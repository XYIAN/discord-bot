'use strict';

// Tests for the community achievements engine. Run:
//   node xyian-bot-project/test/achievements.test.js
//
// The activity XP ladder this replaces had 0/0/0/0 holders for five months:
// thresholds ~10× the real traffic, points lost before the volume mounted,
// and nothing that could recompute from history. Everything below is a rule
// the engine must keep so that never happens quietly again.
const assert = require('assert');
const A = require('../lib/achievements');
const { buildTracks, perksFor, perkAllowed } = require('../lib/achievement-tracks');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

// Stand-in channel ids; shapes match the real CONFIG exactly.
const CH = {
    strategy: ['s1', 's2'],
    communityExclude: ['debug', 'changelog', 'recruit'],
    crossServer: 'cs',
    clips: 'clips',
    dabCorner: 'dab',
    archAi: 'ai',
};
const TRACKS = buildTracks(CH);
const T = (iso) => Date.parse(iso);
const msg = (over) => ({ userId: 'u1', username: 'kyle', channelId: 'general', parentId: null, ts: T('2026-09-07T18:00:00Z'), ...over });

console.log('achievements — config guard');
test('the real track config validates clean', () => {
    assert.deepStrictEqual(A.validateTracks(TRACKS), []);
});
test('tier thresholds must ascend and every id must exist', () => {
    const bad = { x: { channels: { include: ['a'] }, tiers: [{ role: 'B', threshold: 10 }, { role: 'A', threshold: 5 }], achievements: ['no-such-badge'] } };
    const errs = A.validateTracks(bad);
    assert.ok(errs.some((e) => /ascend/.test(e)), errs.join('; '));
    assert.ok(errs.some((e) => /unknown achievement/.test(e)), errs.join('; '));
});
test('THE DAB-CORNER CONSTRAINT: no ladder, no leaderboard, no attachments, no consumption words', () => {
    const t = TRACKS['dab-corner'];
    assert.ok(!t.tiers, 'dab-corner must not have a points ladder');
    assert.strictEqual(t.leaderboard, false);
    assert.ok(!(t.stats || []).includes('attachments'), 'dab-corner must never record attachments');
    for (const a of A.resolveTrack('dab-corner', t)) {
        assert.ok(!/sesh|smoke|blaze|420|gram|ounce|cart|stash/i.test(`${a.name} ${a.description}`), `forbidden word in ${a.name}`);
        assert.ok(['msgs', 'days', 'streak', 'bestStreak', 'appreciated', 'replies'].includes(a.stat), `${a.name} uses ${a.stat}`);
    }
});
test('attachments is OPT-IN: only a track that names it records it', () => {
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ channelId: 'general', attachments: 2 }));
    assert.strictEqual(s.tracks.community.users.u1.attachments, 0, 'community must not count attachments');
    A.applyMessage(s, TRACKS, msg({ channelId: 'clips', attachments: 2, ts: T('2026-09-07T18:05:00Z') }));
    assert.strictEqual(s.tracks.clips.users.u1.attachments, 1, 'one per message, however many files');
});

console.log('achievements — eligibility');
test('bots, webhooks, system messages, DMs and commands never count', () => {
    assert.strictEqual(A.eligibleMessage({ authorBot: true, guildId: 'g' }), false);
    assert.strictEqual(A.eligibleMessage({ webhookId: 'w', guildId: 'g' }), false);
    assert.strictEqual(A.eligibleMessage({ system: true, guildId: 'g' }), false, 'a join notification counted as a first message once — Tempest v0.1.7');
    assert.strictEqual(A.eligibleMessage({ guildId: null }), false);
    assert.strictEqual(A.eligibleMessage({ guildId: 'g', content: '!rank' }), false);
    assert.strictEqual(A.eligibleMessage({ guildId: 'g', content: 'hello' }), true);
});
test('a thread or forum post counts for its parent channel', () => {
    // parentId here is THREAD parent only — a text channel's discord.js parentId is its
    // category, and bot.js must pass null for those (threadParentId). Review caught it.
    assert.strictEqual(A.channelKey({ id: 'thread-9', parentId: 's1' }), 's1');
    assert.strictEqual(A.channelKey({ id: 's1', parentId: null }), 's1');
    assert.deepStrictEqual(A.tracksForChannel(TRACKS, 's1').sort(), ['community', 'strategy']);
    assert.deepStrictEqual(A.tracksForChannel(TRACKS, 'debug'), [], 'excluded channels belong to no track');
});

console.log('achievements — the reducer');
test('cooldown is PER TRACK: a strategy message and a #general message 10 s apart each count once', () => {
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ channelId: 's1', ts: T('2026-09-07T18:00:00Z') }));
    A.applyMessage(s, TRACKS, msg({ channelId: 'general', ts: T('2026-09-07T18:00:10Z') }));
    assert.strictEqual(s.tracks.strategy.users.u1.msgs, 1);
    assert.strictEqual(s.tracks.community.users.u1.msgs, 1, 'the second message is within the community cooldown of the first');
});
test('two #general messages 10 s apart count once; 60 s apart count twice', () => {
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T18:00:00Z') }));
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T18:00:10Z') }));
    assert.strictEqual(s.tracks.community.users.u1.msgs, 1);
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T18:01:00Z') }));
    assert.strictEqual(s.tracks.community.users.u1.msgs, 2);
});
test('days use the PACIFIC day boundary, same clock as the daily reset', () => {
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T06:30:00Z') }));   // 23:30 PDT Sep 6
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T07:30:00Z') }));   // 00:30 PDT Sep 7
    assert.strictEqual(s.tracks.community.users.u1.days, 2);
    assert.strictEqual(s.tracks.community.users.u1.streak, 2);
    const s2 = A.emptyState();
    A.applyMessage(s2, TRACKS, msg({ ts: T('2026-09-07T16:59:00Z') }));  // 09:59 PDT
    A.applyMessage(s2, TRACKS, msg({ ts: T('2026-09-07T17:01:00Z') }));  // 10:01 PDT — same day
    assert.strictEqual(s2.tracks.community.users.u1.days, 1);
});
test('a missed day breaks the streak; bestStreak keeps the high-water mark', () => {
    const s = A.emptyState();
    for (const d of ['01', '02', '04']) A.applyMessage(s, TRACKS, msg({ ts: T(`2026-09-${d}T18:00:00Z`) }));
    const u = s.tracks.community.users.u1;
    assert.strictEqual(u.days, 3);
    assert.strictEqual(u.streak, 1);
    assert.strictEqual(u.bestStreak, 2);
});
test('days has NO cap — Tempest caps at 60 and silently bounds any future badge', () => {
    const s = A.emptyState();
    const start = T('2025-01-01T18:00:00Z');
    for (let i = 0; i < 400; i++) A.applyMessage(s, TRACKS, msg({ ts: start + i * 86400000 }));
    assert.strictEqual(s.tracks.community.users.u1.days, 400);
    assert.strictEqual(s.tracks.community.users.u1.bestStreak, 400);
});
test('appreciated: a message counts ONCE by id — toggling a reaction cannot farm it', () => {
    const s = A.emptyState();
    const base = { messageId: 'm1', authorId: 'u1', authorUsername: 'kyle', reactorId: 'u2', channelId: 'general', parentId: null, ts: T('2026-09-07T18:00:00Z') };
    A.applyReaction(s, TRACKS, base);
    A.applyReaction(s, TRACKS, base);                                  // remove + re-add
    A.applyReaction(s, TRACKS, { ...base, reactorId: 'u3' });          // a second person
    assert.strictEqual(s.tracks.community.users.u1.appreciated, 1, 'one message, one appreciation');
    A.applyReaction(s, TRACKS, { ...base, reactorId: 'u1', messageId: 'm2' });
    assert.strictEqual(s.tracks.community.users.u1.appreciated, 1, 'reacting to yourself is not appreciation');
    A.applyReaction(s, TRACKS, { ...base, messageId: 'm2' });          // a peer AFTER the author self-reacted still counts
    assert.strictEqual(s.tracks.community.users.u1.appreciated, 2);
    assert.strictEqual(A.applyReaction(s, TRACKS, { ...base, messageId: undefined }).changed, false, 'no id, no count');
});
test('a streak survives a DST change — yesterday is the previous calendar day, not ts − 24 h', () => {
    // 2026-11-01 is the US fall-back day (25 hours long in Pacific time).
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-10-31T20:00:00Z') }));   // Oct 31, 13:00 PDT
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-11-02T05:30:00Z') }));   // Nov 1, 21:30 PST (the long day)
    A.applyMessage(s, TRACKS, msg({ ts: T('2026-11-02T20:00:00Z') }));   // Nov 2, 12:00 PST
    assert.strictEqual(s.tracks.community.users.u1.streak, 3);
    assert.strictEqual(A.prevDayKey('2026-03-01'), '2026-02-28');
});
test('tierStatus honours a tier someone EARNED before its threshold was raised', () => {
    const s = A.emptyState();
    const u = A.ensureUser(s, 'community', 'u1', 'kyle');
    u.msgs = 60; u.unlocked['tier:Arch Warlord'] = '2026-01-01T00:00:00.000Z';   // earned under an old, lower threshold
    const ladder = A.tierStatus(TRACKS.community, u);
    assert.strictEqual(ladder.current.role, 'Arch Warlord', 'rank must agree with the role they hold');
    assert.strictEqual(ladder.next.role, 'Arch Legend');
});
test('validateTracks catches a badge that can never fire and a duplicate id', () => {
    const bad = { x: { channels: { include: ['a'] }, stats: ['msgs'], achievements: ['showboat', 'first-words', 'first-words'] } };
    const errs = A.validateTracks(bad);
    assert.ok(errs.some((e) => /can never fire/.test(e)), errs.join('; '));
    assert.ok(errs.some((e) => /duplicate/.test(e)), errs.join('; '));
});
test('replies to OTHER people count; replying to yourself does not', () => {
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ isReply: true, repliedToUserId: 'u1' }));
    assert.strictEqual(s.tracks.community.users.u1.replies, 0);
    A.applyMessage(s, TRACKS, msg({ isReply: true, repliedToUserId: 'u2', ts: T('2026-09-07T18:00:05Z') }));
    assert.strictEqual(s.tracks.community.users.u1.replies, 1, 'replies are not subject to the message cooldown');
});
test('an AI question increments only the track that records it and unlocks Arch Adept', () => {
    const s = A.emptyState();
    const r = A.applyMessage(s, TRACKS, msg({ channelId: 'ai', aiQuestion: true }));
    assert.strictEqual(s.tracks['arch-ai'].users.u1.aiQuestions, 1);
    assert.strictEqual(s.tracks.community.users.u1.aiQuestions, 0, 'the community track does not record AI questions');
    const adept = r.unlocked.find((u) => u.achievement.role === 'Arch Adept');
    assert.ok(adept, 'first question must unlock Arch Adept');
    assert.strictEqual(adept.trackId, 'arch-ai');
});
test('the same events in a different order give the same stats', () => {
    const evs = ['01T10', '01T11', '03T09', '02T20'].map((d) => ({ type: 'message', ...msg({ ts: T(`2026-09-${d}:00:00Z`) }) }));
    const a = A.rebuild(null, TRACKS, evs, 'now');
    const b = A.rebuild(null, TRACKS, [...evs].reverse(), 'now');
    assert.deepStrictEqual(a.tracks, b.tracks);
});

console.log('achievements — unlocks fire once and survive');
test('crossing a threshold unlocks exactly once', () => {
    const s = A.emptyState();
    const r1 = A.applyMessage(s, TRACKS, msg({}));
    assert.ok(r1.unlocked.some((u) => u.achievement.id === 'first-words'));
    const r2 = A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T18:05:00Z') }));
    assert.ok(!r2.unlocked.some((u) => u.achievement.id === 'first-words'), 'second message must not re-unlock');
    assert.strictEqual(s.tracks.community.users.u1.unlocked['first-words'], '2026-09-07T18:00:00.000Z', 'the original unlock date survives');
});
test('a tier is an achievement too: 50 messages → Arch Tactician, recorded under tier:<role>', () => {
    const s = A.emptyState();
    let promoted = null;
    for (let i = 0; i < 50; i++) {
        const r = A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T00:00:00Z') + i * 61000 }));
        const t = r.unlocked.find((u) => u.achievement.tier);
        if (t) promoted = t;
    }
    assert.ok(promoted && promoted.achievement.role === 'Arch Tactician');
    assert.ok(s.tracks.community.users.u1.unlocked['tier:Arch Tactician']);
    assert.ok(A.rolesOwed(s, TRACKS, 'u1').has('Arch Tactician'));
});
test('REBUILD never removes an unlock, even when the replay no longer reaches it', () => {
    // Threshold raised, or history partially unavailable: an earned badge stays earned.
    const old = A.emptyState();
    A.ensureUser(old, 'community', 'u1', 'kyle').unlocked['warming-up'] = '2026-06-01T00:00:00.000Z';
    const rebuilt = A.rebuild(old, TRACKS, [{ type: 'message', ...msg({}) }], 'now');
    assert.strictEqual(rebuilt.tracks.community.users.u1.msgs, 1, 'stats are REPLACED by the replay');
    assert.strictEqual(rebuilt.tracks.community.users.u1.unlocked['warming-up'], '2026-06-01T00:00:00.000Z', 'unlocks are MERGED');
    assert.strictEqual(rebuilt.rebuiltAt, 'now');
});
test('rebuild routes aiQuestion events — Arch Adept is retroactive', () => {
    // A history replay cannot see which #arch-ai messages were answered, so the
    // rebuild callers emit one aiQuestion event per member message there.
    const rebuilt = A.rebuild(null, TRACKS, [{ type: 'aiQuestion', ...msg({ channelId: 'ai' }) }], 'now');
    assert.strictEqual(rebuilt.tracks['arch-ai'].users.u1.aiQuestions, 1);
    assert.ok(rebuilt.tracks['arch-ai'].users.u1.unlocked['first-question']);
    assert.ok(A.rolesOwed(rebuilt, TRACKS, 'u1').has('Arch Adept'));
});
test('rebuild keeps the EARLIEST unlock date when both sides have one', () => {
    const old = A.emptyState();
    A.ensureUser(old, 'community', 'u1', 'kyle').unlocked['first-words'] = '2026-01-01T00:00:00.000Z';
    const rebuilt = A.rebuild(old, TRACKS, [{ type: 'message', ...msg({}) }], 'now');
    assert.strictEqual(rebuilt.tracks.community.users.u1.unlocked['first-words'], '2026-01-01T00:00:00.000Z');
});

console.log('achievements — roles');
test('reconcilePlan lists only MISSING roles and skips members who left', () => {
    const s = A.emptyState();
    const u = A.ensureUser(s, 'community', 'u1', 'kyle');
    u.unlocked['tier:Arch Tactician'] = 'x'; u.unlocked['tier:Arch Veteran'] = 'x';
    const gone = A.ensureUser(s, 'community', 'u2', 'left');
    gone.unlocked['tier:Arch Tactician'] = 'x';
    const plan = A.reconcilePlan(s, TRACKS, (id) => (id === 'u1' ? ['Arch Tactician'] : null));
    assert.deepStrictEqual(plan, [{ userId: 'u1', username: 'kyle', missing: ['Arch Veteran'] }]);
});
test('rolesOwed spans tracks: a Corner Regular and an Arch Adept both come back', () => {
    const s = A.emptyState();
    A.ensureUser(s, 'dab-corner', 'u1', 'kyle').unlocked['regular'] = 'x';
    A.ensureUser(s, 'arch-ai', 'u1', 'kyle').unlocked['first-question'] = 'x';
    assert.deepStrictEqual([...A.rolesOwed(s, TRACKS, 'u1')].sort(), ['Arch Adept', 'Dab Corner Regular']);
});

console.log('achievements — views');
test('rankView shows the ladder with a progress bar and counts badges across tracks', () => {
    const s = A.emptyState();
    for (let i = 0; i < 12; i++) A.applyMessage(s, TRACKS, msg({ ts: T('2026-09-07T00:00:00Z') + i * 61000 }));
    const v = A.rankView(s, TRACKS, 'u1');
    const community = v.tracks.find((t) => t.id === 'community');
    assert.strictEqual(community.ladder.pts, 12);
    assert.strictEqual(community.ladder.current, null);
    assert.strictEqual(community.ladder.next.role, 'Arch Tactician');
    assert.match(community.ladder.bar, /^█{2}░{8}$/, community.ladder.bar);
    assert.strictEqual(v.badges.unlocked, 2, 'First Words + Warming Up');
});
test('leaderboard is null for a track that forbids one', () => {
    const s = A.emptyState();
    A.applyMessage(s, TRACKS, msg({ channelId: 'dab' }));
    assert.strictEqual(A.leaderboard(s, TRACKS, 'dab-corner', 10), null);
    assert.strictEqual(A.leaderboard(s, TRACKS, 'community', 10).length, 1);
});
test('achievementsView renders locked badges with mechanical progress', () => {
    const s = A.emptyState();
    for (const d of ['01', '02', '03', '04']) A.applyMessage(s, TRACKS, msg({ ts: T(`2026-09-${d}T18:00:00Z`) }));
    const community = A.achievementsView(s, TRACKS, 'u1').find((t) => t.id === 'community');
    const regular = community.locked.find((a) => a.id === 'regular');
    assert.strictEqual(regular.progress, '4/7 active days');
    assert.ok(community.unlocked.some((a) => a.id === 'on-a-roll'), '4 days in a row unlocks On a Roll');
});

test('every perk points at a real achievement key on its track', () => {
    const { validatePerks } = require('../lib/achievement-tracks');
    assert.deepStrictEqual(validatePerks(TRACKS), []);
});

console.log('achievements — perks');
test('a perk unlocks with ANY of its listed keys and stays locked otherwise', () => {
    const s = A.emptyState();
    assert.strictEqual(perkAllowed(s, 'u1', 'cheer'), false);
    A.ensureUser(s, 'community', 'u1', 'kyle').unlocked['regular'] = 'x';
    assert.strictEqual(perkAllowed(s, 'u1', 'cheer'), true);
    assert.strictEqual(perkAllowed(s, 'u1', 'invite-ai'), false, 'Regular is not enough for AI Invite');
    s.tracks.community.users.u1.unlocked['tier:Arch Veteran'] = 'x';
    assert.deepStrictEqual(perksFor(s, 'u1').map((p) => p.command), ['cheer', 'spotlight', 'invite-ai']);
});

console.log(`\n${passed} passed`);
