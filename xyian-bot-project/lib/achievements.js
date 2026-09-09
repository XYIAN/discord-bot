'use strict';

// ── Community achievements engine ───────────────────────────────────────────
// Pure: no discord.js, no file I/O. bot.js feeds it events and persists the
// state it returns through lib/state-store.js.
//
// WHY THIS EXISTS. The activity XP ladder (Arch Tactician 100 … Legend 1500,
// strategy channels only, 1 point/min) had 0/0/0/0 holders after five months.
// Two causes, both measured: every point earned before the Railway volume
// mounted (2026-05-07) was lost, and the thresholds were ~10× what the real
// traffic supports — the best member's ALL-TIME total was 64 against a first
// rung of 100, and only 3.6% of human messages happened in channels that
// counted. An achievement nobody reaches is indistinguishable from a broken
// feature, and this server ran that experiment for months.
//
// So: one reducer, tracks as config. Every achievement and every tier is a
// `stat >= threshold` predicate over a per-(track, user) record, which means
// progress is always renderable, a threshold change is a number plus a rebuild,
// and a new channel's track is a config entry, not code.
//
// Stats are deliberately about SHOWING UP, peer approval and conversation —
// never volume-of-anything that a member could read as consumption. The one
// exception, `attachments`, is OPT-IN per track and exists for
// #clips-and-highlights, where posting clips is the whole point; #dab-corner
// can never record it (see docs/brainstorms/dab-corner-gamification.md), and
// test/achievements.test.js pins that mechanically.

const { dayKey } = require('./schedule');

const COOLDOWN_MS = 60_000;

/** Every stat the engine knows. A track may restrict which of these it records. */
const STATS = Object.freeze(['msgs', 'days', 'streak', 'bestStreak', 'appreciated', 'replies', 'aiQuestions', 'attachments']);

const STAT_LABELS = Object.freeze({
    msgs: 'messages',
    days: 'active days',
    streak: 'day streak',
    bestStreak: 'best day streak',
    appreciated: 'appreciated posts',
    replies: 'replies to others',
    aiQuestions: 'AI questions',
    attachments: 'clips & screenshots posted',
});

/**
 * The shared catalog. A track lists the ids it uses and may override name,
 * threshold, role or description per entry (see resolveTrack). Thresholds here
 * are the community-track defaults, calibrated on 90 days of real traffic
 * (2026-06 → 09) so that each rung is reached by a meaningful minority.
 */
const CATALOG = Object.freeze({
    'first-words':      { name: 'First Words',      emoji: '💬', stat: 'msgs',        threshold: 1,   description: 'Posted your first message' },
    'warming-up':       { name: 'Warming Up',       emoji: '🔥', stat: 'msgs',        threshold: 10,  description: '10 messages' },
    'regular':          { name: 'Regular',          emoji: '📅', stat: 'days',        threshold: 7,   description: 'Active on 7 different days' },
    'fixture':          { name: 'Fixture',          emoji: '🏛️', stat: 'days',        threshold: 30,  description: 'Active on 30 different days' },
    'year-rounder':     { name: 'Year-Rounder',     emoji: '🌍', stat: 'days',        threshold: 365, description: 'Active on 365 different days' },
    'on-a-roll':        { name: 'On a Roll',        emoji: '🎲', stat: 'bestStreak',  threshold: 3,   description: '3 days in a row' },
    'locked-in':        { name: 'Locked In',        emoji: '🔒', stat: 'bestStreak',  threshold: 7,   description: '7 days in a row' },
    'iron-streak':      { name: 'Iron Streak',      emoji: '⛓️', stat: 'bestStreak',  threshold: 30,  description: '30 days in a row' },
    'crowd-pleaser':    { name: 'Crowd Pleaser',    emoji: '👏', stat: 'appreciated', threshold: 5,   description: '5 of your posts got a reaction from someone else' },
    'fan-favorite':     { name: 'Fan Favorite',     emoji: '⭐', stat: 'appreciated', threshold: 100, description: '100 appreciated posts' },
    'good-company':     { name: 'Good Company',     emoji: '🤝', stat: 'replies',     threshold: 10,  description: 'Replied to other people 10 times' },
    'conversationalist':{ name: 'Conversationalist',emoji: '🗣️', stat: 'replies',     threshold: 250, description: '250 replies to others' },
    'strategist':       { name: 'Strategist',       emoji: '🧠', stat: 'msgs',        threshold: 1,   description: 'Posted in a strategy channel' },
    'theorycrafter':    { name: 'Theorycrafter',    emoji: '📐', stat: 'msgs',        threshold: 100, description: '100 strategy-channel messages' },
    'pulled-up-a-chair':{ name: 'Pulled Up a Chair',emoji: '🪑', stat: 'msgs',        threshold: 1,   description: 'First post in the corner' },
    'three-timer':      { name: 'Three-Timer',      emoji: '3️⃣', stat: 'days',        threshold: 3,   description: 'Around on 3 different days' },
    'first-question':   { name: 'Arch Adept',       emoji: '🧙', stat: 'aiQuestions', threshold: 1,   description: 'Asked Arch AI your first question' },
    // Cross-server chatter. Kyle: keep bronze/silver reachable, everything past silver
    // hard. Lifetime #cross-server: >=50 → 11 members, >=200 → 7, >=1000 → 0 (top 844).
    // Gold ≈ 10-16 months for the top poster at today's pace; Platinum is his "10,000":
    // 4-7 years for that one person, adjustable later.
    'chatterbox-bronze':{ name: 'Chatterbox Bronze',emoji: '🥉', stat: 'msgs',        threshold: 50,  description: '50 cross-server messages' },
    'chatterbox-silver':{ name: 'Chatterbox Silver',emoji: '🥈', stat: 'msgs',        threshold: 200, description: '200 cross-server messages' },
    'chatterbox-gold':  { name: 'Chatterbox Gold',  emoji: '🥇', stat: 'msgs',        threshold: 2500,description: '2,500 cross-server messages' },
    'chatterbox-platinum':{ name: 'Chatterbox Platinum', emoji: '💎', stat: 'msgs',    threshold: 10000,description: '10,000 cross-server messages' },
    // #clips-and-highlights: the only track allowed to record attachments (see validateTracks).
    'showboat':         { name: 'Showboat',         emoji: '🎬', stat: 'attachments', threshold: 1,   description: 'Posted your first clip or screenshot' },
    'highlight-reel':   { name: 'Highlight Reel',   emoji: '🎞️', stat: 'attachments', threshold: 25,  description: '25 clips or screenshots' },
});

// ── state ───────────────────────────────────────────────────────────────────

function emptyState() {
    return { version: 1, rebuiltAt: null, tracks: {} };
}

function emptyUser(username) {
    return {
        username: username || '',
        msgs: 0, lastMsgAt: 0,
        days: 0, lastDay: null, streak: 0, bestStreak: 0,
        appreciated: 0, replies: 0, aiQuestions: 0, attachments: 0,
        firstAt: null,
        unlocked: {},
    };
}

function ensureUser(state, trackId, userId, username) {
    if (!state.tracks[trackId]) state.tracks[trackId] = { users: {} };
    const users = state.tracks[trackId].users;
    if (!users[userId]) users[userId] = emptyUser(username);
    else if (username) users[userId].username = username;
    return users[userId];
}

// ── config resolution ───────────────────────────────────────────────────────

/**
 * A thread or forum post counts for its parent channel. `parentId` here means
 * THREAD parent only — callers must pass null for a normal text channel, whose
 * discord.js `parentId` is its CATEGORY. Keying a text channel by its category
 * made every include-list track dead and bypassed the community exclude list
 * (caught in review before it shipped).
 */
function channelKey(channel) {
    if (!channel) return null;
    return channel.parentId || channel.id || null;
}

/** Previous calendar day in the same zone — never "minus 24 h", which breaks across DST. */
function prevDayKey(day) {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

/** Which tracks does a channel belong to? A track has either an include list or an exclude list. */
function tracksForChannel(tracks, key) {
    const out = [];
    for (const [id, t] of Object.entries(tracks || {})) {
        const c = t.channels || {};
        if (Array.isArray(c.include)) { if (c.include.includes(key)) out.push(id); }
        else if (Array.isArray(c.exclude)) { if (!c.exclude.includes(key)) out.push(id); }
    }
    return out;
}

/** Bots, webhooks, system messages (joins!), DMs and commands never count. */
function eligibleMessage(m) {
    if (!m || m.authorBot || m.webhookId || m.system || !m.guildId) return false;
    if (typeof m.content === 'string' && m.content.startsWith('!')) return false;
    return true;
}

/**
 * Turn a track's config into a flat, ordered list of resolved achievements.
 * Tiers become achievements too (key `tier:<role>`), so one mechanism unlocks,
 * persists and reconciles everything.
 */
function resolveTrack(trackId, track) {
    const list = [];
    for (const entry of track.achievements || []) {
        const ref = typeof entry === 'string' ? { id: entry } : entry;
        const base = CATALOG[ref.id];
        if (!base) throw new Error(`track "${trackId}" references unknown achievement "${ref.id}"`);
        list.push({
            key: ref.id,
            id: ref.id,
            name: ref.name || base.name,
            emoji: ref.emoji || base.emoji,
            stat: base.stat,
            threshold: ref.threshold != null ? ref.threshold : base.threshold,
            role: ref.role || base.role || null,
            description: ref.description || base.description,
            tier: false,
        });
    }
    for (const t of track.tiers || []) {
        list.push({
            key: `tier:${t.role}`,
            id: `tier:${t.role}`,
            name: t.role,
            emoji: t.emoji || '🏅',
            stat: t.stat || 'msgs',
            threshold: t.threshold,
            role: t.role,
            description: `${t.threshold} ${STAT_LABELS[t.stat || 'msgs']}`,
            tier: true,
        });
    }
    return list;
}

/** Stats a track must NAME in `stats` to record; everything else is on by default. */
const OPT_IN_STATS = Object.freeze(['attachments', 'aiQuestions']);

/**
 * Does this track record a stat? `attachments` is OPT-IN — "how much did you
 * post pictures of" is exactly the metric #dab-corner must never have — and so
 * is `aiQuestions`, which only means something on the Arch AI track. Everything
 * else is on unless `stats` restricts it.
 */
function trackRecords(track, stat) {
    if (OPT_IN_STATS.includes(stat)) return Array.isArray(track.stats) && track.stats.includes(stat);
    return !Array.isArray(track.stats) || track.stats.includes(stat);
}

// ── the reducer ─────────────────────────────────────────────────────────────

function evaluate(trackId, track, user, nowIso) {
    const unlocked = [];
    for (const a of resolveTrack(trackId, track)) {
        if (user.unlocked[a.key]) continue;
        if ((user[a.stat] || 0) >= a.threshold) {
            user.unlocked[a.key] = nowIso;
            unlocked.push(a);
        }
    }
    return unlocked;
}

/**
 * A human message. evt = { userId, username, channelId, parentId, ts, isReply,
 * repliedToUserId, aiQuestion }. Mutates `state`; returns what newly unlocked.
 */
function applyMessage(state, tracks, evt) {
    const key = channelKey({ id: evt.channelId, parentId: evt.parentId });
    const unlocked = [];
    let changed = false;
    const nowIso = new Date(evt.ts).toISOString();
    for (const trackId of tracksForChannel(tracks, key)) {
        const track = tracks[trackId];
        const user = ensureUser(state, trackId, evt.userId, evt.username);
        if (!user.firstAt) user.firstAt = nowIso;

        if (trackRecords(track, 'msgs') && evt.ts - (user.lastMsgAt || 0) >= COOLDOWN_MS) {
            user.msgs += 1;
            user.lastMsgAt = evt.ts;
            changed = true;
        }
        if (trackRecords(track, 'days')) {
            const day = dayKey(evt.ts);
            if (user.lastDay !== day) {
                user.streak = user.lastDay === prevDayKey(day) ? user.streak + 1 : 1;
                if (user.streak > user.bestStreak) user.bestStreak = user.streak;
                user.days += 1;
                user.lastDay = day;
                changed = true;
            }
        }
        if (trackRecords(track, 'replies') && evt.isReply && evt.repliedToUserId && evt.repliedToUserId !== evt.userId) {
            user.replies += 1;
            changed = true;
        }
        if (trackRecords(track, 'aiQuestions') && evt.aiQuestion) {
            user.aiQuestions += 1;
            changed = true;
        }
        if (trackRecords(track, 'attachments') && evt.attachments > 0) {
            user.attachments += 1;              // one per message, however many files it carried
            changed = true;
        }
        for (const a of evaluate(trackId, track, user, nowIso)) {
            unlocked.push({ trackId, userId: evt.userId, username: user.username, achievement: a });
            changed = true;
        }
    }
    return { unlocked, changed };
}

/**
 * An answered Arch AI question. Only tracks that opt into `aiQuestions` see it,
 * so it can never double-count a message's other stats.
 */
function applyAiQuestion(state, tracks, evt) {
    const key = channelKey({ id: evt.channelId, parentId: evt.parentId });
    const unlocked = [];
    let changed = false;
    const nowIso = new Date(evt.ts).toISOString();
    for (const trackId of tracksForChannel(tracks, key)) {
        const track = tracks[trackId];
        if (!trackRecords(track, 'aiQuestions')) continue;
        const user = ensureUser(state, trackId, evt.userId, evt.username);
        if (!user.firstAt) user.firstAt = nowIso;
        user.aiQuestions += 1;
        changed = true;
        for (const a of evaluate(trackId, track, user, nowIso)) unlocked.push({ trackId, userId: evt.userId, username: user.username, achievement: a });
    }
    return { unlocked, changed };
}

/** How many appreciated message ids a user record remembers. A message older than this could in theory re-count; nobody scrolls that far to farm. */
const APPRECIATED_MEMORY = 500;

/**
 * A reaction from someone other than the author. A message counts as
 * appreciated ONCE, remembered by id — so toggling a reaction on and off
 * cannot farm it, and a peer reaction after the author's own still counts.
 * evt = { messageId, authorId, authorUsername, reactorId, channelId, parentId, ts }.
 */
function applyReaction(state, tracks, evt) {
    const unlocked = [];
    let changed = false;
    if (!evt.authorId || !evt.messageId || evt.reactorId === evt.authorId) return { unlocked, changed };
    const key = channelKey({ id: evt.channelId, parentId: evt.parentId });
    const nowIso = new Date(evt.ts).toISOString();
    for (const trackId of tracksForChannel(tracks, key)) {
        const track = tracks[trackId];
        if (!trackRecords(track, 'appreciated')) continue;
        const user = ensureUser(state, trackId, evt.authorId, evt.authorUsername);
        if (!Array.isArray(user.appreciatedIds)) user.appreciatedIds = [];
        if (user.appreciatedIds.includes(evt.messageId)) continue;
        user.appreciatedIds.push(evt.messageId);
        if (user.appreciatedIds.length > APPRECIATED_MEMORY) user.appreciatedIds.splice(0, user.appreciatedIds.length - APPRECIATED_MEMORY);
        user.appreciated += 1;
        changed = true;
        for (const a of evaluate(trackId, track, user, nowIso)) {
            unlocked.push({ trackId, userId: evt.authorId, username: user.username, achievement: a });
        }
    }
    return { unlocked, changed };
}

/**
 * Replay history through the same reducer. Stats are REPLACED by the replay;
 * unlocks are MERGED (union, earliest date wins) — an unlock is never taken
 * away by a threshold that moved up, and one newly reachable after a threshold
 * moved down is recorded silently. Events: {type:'message'|'reaction'|'aiQuestion', ...evt}.
 * A history replay cannot see which #arch-ai messages were answered, so the
 * callers emit an aiQuestion event for every eligible message in that channel.
 */
function rebuild(oldState, tracks, events, nowIso) {
    const state = emptyState();
    const sorted = [...events].sort((a, b) => a.ts - b.ts);
    for (const e of sorted) {
        if (e.type === 'reaction') applyReaction(state, tracks, e);
        else if (e.type === 'aiQuestion') applyAiQuestion(state, tracks, e);
        else applyMessage(state, tracks, e);
    }
    for (const [trackId, t] of Object.entries((oldState && oldState.tracks) || {})) {
        for (const [userId, old] of Object.entries(t.users || {})) {
            const user = ensureUser(state, trackId, userId, null);
            if (!user.username && old.username) user.username = old.username;
            for (const [key, when] of Object.entries(old.unlocked || {})) {
                if (!user.unlocked[key] || when < user.unlocked[key]) user.unlocked[key] = when;
            }
        }
    }
    state.rebuiltAt = nowIso || new Date().toISOString();
    return state;
}

// ── recalibration ───────────────────────────────────────────────────────────

/**
 * The one deliberate exception to "unlocks are never removed": when the OWNER
 * raises a tier threshold, members who no longer meet it lose that TIER (and
 * its role). Badges are never touched — they were earned at the threshold of
 * their day. Returns the demotions without applying them.
 */
function recalibratePlan(state, tracks) {
    const plan = [];
    for (const [trackId, track] of Object.entries(tracks || {})) {
        const users = (state.tracks[trackId] && state.tracks[trackId].users) || {};
        const tiers = resolveTrack(trackId, track).filter((a) => a.tier);
        for (const [userId, user] of Object.entries(users)) {
            for (const t of tiers) {
                if (user.unlocked[t.key] && (user[t.stat] || 0) < t.threshold) {
                    plan.push({ trackId, userId, username: user.username, key: t.key, role: t.role, have: user[t.stat] || 0, need: t.threshold });
                }
            }
        }
    }
    return plan;
}

function applyRecalibration(state, plan) {
    for (const d of plan) {
        const user = state.tracks[d.trackId] && state.tracks[d.trackId].users[d.userId];
        if (user) delete user.unlocked[d.key];
    }
    return state;
}

// ── roles ───────────────────────────────────────────────────────────────────

/** Every role name a member has earned across all tracks. */
function rolesOwed(state, tracks, userId) {
    const owed = new Set();
    for (const [trackId, track] of Object.entries(tracks || {})) {
        const user = state.tracks[trackId] && state.tracks[trackId].users[userId];
        if (!user) continue;
        for (const a of resolveTrack(trackId, track)) {
            if (a.role && user.unlocked[a.key]) owed.add(a.role);
        }
    }
    return owed;
}

/**
 * Who is missing an earned role. `heldRoles(userId)` returns the member's
 * current role names, or null if the member is gone — those are skipped.
 */
function reconcilePlan(state, tracks, heldRoles) {
    const plan = [];
    const userIds = new Set();
    for (const t of Object.values(state.tracks || {})) for (const id of Object.keys(t.users || {})) userIds.add(id);
    for (const userId of userIds) {
        const owed = rolesOwed(state, tracks, userId);
        if (!owed.size) continue;
        const held = heldRoles(userId);
        if (!held) continue;
        const missing = [...owed].filter((r) => !held.includes(r));
        if (missing.length) {
            const username = Object.values(state.tracks).map((t) => t.users[userId]).find(Boolean).username;
            plan.push({ userId, username, missing });
        }
    }
    return plan;
}

// ── views ───────────────────────────────────────────────────────────────────

function progressText(a, user) {
    return `${Math.min(user[a.stat] || 0, a.threshold)}/${a.threshold} ${STAT_LABELS[a.stat]}`;
}

/** Ladder position on the track that has tiers (the community track). */
function tierStatus(track, user) {
    const tiers = [...(track.tiers || [])].sort((a, b) => a.threshold - b.threshold);
    const stat = (tiers[0] && tiers[0].stat) || 'msgs';
    const pts = user ? user[stat] || 0 : 0;
    let current = null;
    let next = tiers[0] || null;
    for (const t of tiers) {
        const earned = pts >= t.threshold || Boolean(user && user.unlocked && user.unlocked[`tier:${t.role}`]);
        if (earned) { current = t; next = tiers[tiers.indexOf(t) + 1] || null; }
    }
    const prev = current ? current.threshold : 0;
    // Clamped: a tier earned under an older, lower threshold can leave pts below `prev`.
    const filled = next ? Math.max(0, Math.min(10, Math.floor(((pts - prev) / (next.threshold - prev)) * 10))) : 10;
    return { pts, current, next, bar: '█'.repeat(filled) + '░'.repeat(10 - filled), stat };
}

function rankView(state, tracks, userId) {
    const out = { tracks: [], badges: { unlocked: 0, total: 0 } };
    for (const [trackId, track] of Object.entries(tracks || {})) {
        const user = state.tracks[trackId] && state.tracks[trackId].users[userId];
        const resolved = resolveTrack(trackId, track);
        const badges = resolved.filter((a) => !a.tier);
        const unlockedCount = user ? badges.filter((a) => user.unlocked[a.key]).length : 0;
        out.badges.unlocked += unlockedCount;
        out.badges.total += badges.length;
        const view = { id: trackId, name: track.name || trackId, emoji: track.emoji || '', user: user || null, badges: { unlocked: unlockedCount, total: badges.length } };
        if (track.tiers && track.tiers.length) view.ladder = tierStatus(track, user);
        out.tracks.push(view);
    }
    return out;
}

function leaderboard(state, tracks, trackId, n) {
    const track = tracks[trackId];
    if (!track || track.leaderboard === false) return null;
    const users = (state.tracks[trackId] && state.tracks[trackId].users) || {};
    return Object.entries(users)
        .map(([userId, u]) => ({ userId, username: u.username, msgs: u.msgs, tier: tierStatus(track, u).current }))
        .sort((a, b) => b.msgs - a.msgs)
        .slice(0, n || 10);
}

function achievementsView(state, tracks, userId) {
    const out = [];
    for (const [trackId, track] of Object.entries(tracks || {})) {
        const user = (state.tracks[trackId] && state.tracks[trackId].users[userId]) || emptyUser('');
        const unlocked = [];
        const locked = [];
        for (const a of resolveTrack(trackId, track)) {
            if (a.tier) continue;
            if (user.unlocked[a.key]) unlocked.push({ ...a, when: user.unlocked[a.key] });
            else locked.push({ ...a, progress: progressText(a, user) });
        }
        out.push({ id: trackId, name: track.name || trackId, emoji: track.emoji || '', unlocked, locked });
    }
    return out;
}

// ── config guard ────────────────────────────────────────────────────────────

/**
 * Problems with a tracks config. Empty array = fine. Called by a test against
 * the real CONFIG so a bad threshold or a forbidden metric cannot ship.
 */
function validateTracks(tracks) {
    const errors = [];
    for (const [trackId, t] of Object.entries(tracks || {})) {
        const c = t.channels || {};
        if (!Array.isArray(c.include) && !Array.isArray(c.exclude)) errors.push(`${trackId}: channels needs include[] or exclude[]`);
        try { resolveTrack(trackId, t); } catch (e) { errors.push(e.message); }
        const tiers = t.tiers || [];
        for (let i = 1; i < tiers.length; i++) {
            if (!(tiers[i].threshold > tiers[i - 1].threshold)) errors.push(`${trackId}: tier thresholds must ascend (${tiers[i - 1].role} ${tiers[i - 1].threshold} → ${tiers[i].role} ${tiers[i].threshold})`);
        }
        for (const s of t.stats || []) if (!STATS.includes(s)) errors.push(`${trackId}: unknown stat "${s}"`);
        try {
            const resolved = resolveTrack(trackId, t);
            const seen = new Set();
            for (const a of resolved) {
                if (seen.has(a.key)) errors.push(`${trackId}: duplicate achievement "${a.key}"`);
                seen.add(a.key);
                if (!(Number.isFinite(a.threshold) && a.threshold > 0)) errors.push(`${trackId}: ${a.key} has a bad threshold (${a.threshold})`);
                if (!STATS.includes(a.stat)) errors.push(`${trackId}: ${a.key} uses unknown stat "${a.stat}"`);
                else if (!trackRecords(t, a.stat)) errors.push(`${trackId}: ${a.key} needs stat "${a.stat}" which this track does not record — it can never fire`);
            }
        } catch { /* reported above */ }
    }
    return errors;
}

module.exports = {
    COOLDOWN_MS, STATS, STAT_LABELS, CATALOG, OPT_IN_STATS,
    emptyState, emptyUser, ensureUser,
    channelKey, prevDayKey, tracksForChannel, eligibleMessage, resolveTrack,
    applyMessage, applyAiQuestion, applyReaction, rebuild,
    rolesOwed, reconcilePlan, recalibratePlan, applyRecalibration,
    tierStatus, rankView, leaderboard, achievementsView, progressText,
    validateTracks,
};
