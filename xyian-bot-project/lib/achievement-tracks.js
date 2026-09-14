'use strict';

// ── Track configuration for the achievements engine ─────────────────────────
// Tracks are CONFIG. Every rung and badge below is a `stat >= threshold`
// predicate evaluated by lib/achievements.js; a new demographic channel is one
// more entry here, not code. Thresholds were calibrated on 90+ days of real
// traffic (2026-06 → 09) and the arithmetic is recorded beside each one — an
// achievement nobody reaches is indistinguishable from a broken feature.
//
// bot.js calls buildTracks() with the real channel ids; the tests call it with
// stand-ins and run validateTracks() plus the #dab-corner constraint over the
// result, so a bad threshold or a forbidden metric cannot ship.

/**
 * @param {object} ch  channel ids
 * @param {string[]} ch.strategy         the 13 strategy channels
 * @param {string[]} ch.communityExclude channels that never count for the community track
 * @param {string}   ch.crossServer
 * @param {string}   ch.clips
 * @param {string}   ch.dabCorner
 * @param {string}   ch.archAi
 */
function buildTracks(ch) {
    return {
        // Every channel except the bot's own plumbing and the recruit channel.
        // Full-history replay (16k messages, 2026-09-08) at 50/150: Tactician 18,
        // Veteran 13. Kyle then doubled the ladder (2026-09-14): at 100/300 it is
        // 15 / 10, six members drop a rung (handled by !achievements recalibrate).
        // Top poster is 1,852 over ~12 months (~155/month): Warlord 5,000 ≈ 20
        // months away for one person, Legend 20,000 ≈ a decade — meant to last.
        community: {
            name: 'Community', emoji: '🏘️',
            channels: { exclude: ch.communityExclude },
            tiers: [
                { role: 'Arch Tactician', threshold: 100,  emoji: '⚔️' },
                { role: 'Arch Veteran',   threshold: 300,  emoji: '🛡️' },
                { role: 'Arch Warlord',   threshold: 5000, emoji: '👑' },
                { role: 'Arch Legend',    threshold: 20000, emoji: '🌟' },  // gates vision access — stays scarce
            ],
            achievements: [
                'first-words', 'warming-up',
                'regular', 'fixture', 'year-rounder',
                'on-a-roll', 'locked-in', 'iron-streak',
                'crowd-pleaser', 'fan-favorite',
                'good-company', 'conversationalist',
            ],
            leaderboard: true,
        },

        // The old ladder's channels keep a "strategy contributor" identity
        // without the dead points ladder. 14 posters in 90d, 26 lifetime.
        strategy: {
            name: 'Strategy', emoji: '🧠',
            channels: { include: ch.strategy },
            achievements: ['strategist', 'theorycrafter'],
            leaderboard: false,
        },

        // Kyle: "chatterbox bronze silver and gold tiers", then "10X it — past
        // silver should be harder". Thresholds and arithmetic in the catalog.
        'cross-server': {
            name: 'Cross-Server', emoji: '🌐',
            channels: { include: [ch.crossServer] },
            achievements: ['chatterbox-bronze', 'chatterbox-silver', 'chatterbox-gold', 'chatterbox-platinum'],
            leaderboard: true,
        },

        // Kyle: a video or image in #clips-and-highlights is "showboating".
        // The ONLY track that records attachments (opt-in — see trackRecords).
        // Lifetime: 13 members have posted one, 1 has posted 25.
        clips: {
            name: 'Clips & Highlights', emoji: '🎬',
            channels: { include: [ch.clips] },
            stats: ['msgs', 'days', 'streak', 'bestStreak', 'appreciated', 'replies', 'attachments'],
            achievements: ['showboat', 'highlight-reel'],
            leaderboard: false,
        },

        // Presence, peer approval, conversation — never volume, never images
        // (docs/brainstorms/dab-corner-gamification.md). No ladder, no
        // leaderboard. 5 messages in its first 17 days: only the first-post
        // badge fires this quarter, and that is the honest state.
        'dab-corner': {
            name: 'Dab Corner', emoji: '🌿',
            channels: { include: [ch.dabCorner] },
            stats: ['msgs', 'days', 'streak', 'bestStreak', 'appreciated', 'replies'],
            achievements: [
                'pulled-up-a-chair',
                'three-timer',
                { id: 'regular',       name: 'Corner Regular', role: 'Dab Corner Regular' },
                { id: 'fixture',       name: 'Corner Fixture' },
                { id: 'crowd-pleaser', name: 'Crowd Favorite' },
                { id: 'good-company',  threshold: 5 },
            ],
            leaderboard: false,
        },

        // Kyle: "when someone does their first arch ai message they should
        // auto get tier 1 like arch adept". First rung of the AI ladder, under
        // Arch Scholar (5 approved suggestions) and Arch Sage (15).
        'arch-ai': {
            name: 'Arch AI', emoji: '🧙',
            channels: { include: [ch.archAi] },
            stats: ['aiQuestions'],
            achievements: [{ id: 'first-question', role: 'Arch Adept' }],
            leaderboard: false,
        },

        // Kyle: "achievements for granting roles… start easy and get harder…
        // leadership roundtable style theme". Fed by the audited role-grant
        // path (verify / newxy / newpxy / grant / invite-ai / role add), from
        // whatever channel the command ran in. Nothing to replay — counts from
        // v3.36.0 onward.
        leadership: {
            name: 'Leadership', emoji: '🛡️',
            channels: { include: [] },            // never matches a message — fed only by applyRoleGrant

            stats: ['roleGrants'],
            achievements: ['door-opener', 'recruiter', 'roundtable-steward', 'roundtable-marshal'],
            leaderboard: false,
        },
    };
}

/**
 * Perks: commands an achievement unlocks. Kyle: "it would be cool if each one
 * unlocked skills they can use like commands". `requires.any` lists unlocked
 * keys on `requires.track` — a tier key is `tier:<role>`.
 */
const PERKS = Object.freeze([
    {
        command: 'cheer', name: 'Cheer', emoji: '🎉',
        requires: { track: 'community', any: ['regular', 'tier:Arch Tactician'] },
        usage: '!cheer @user [why]',
        description: 'Post a celebration for someone in the channel',
    },
    {
        command: 'spotlight', name: 'Spotlight', emoji: '🔦',
        requires: { track: 'community', any: ['fixture', 'tier:Arch Veteran'] },
        usage: '!spotlight @user',
        description: "Show off someone's badges and rank to the channel",
    },
    {
        command: 'invite-ai', name: 'AI Invite', emoji: '🤖',
        requires: { track: 'community', any: ['tier:Arch Veteran'] },
        usage: '!invite-ai @user',
        description: 'Grant a member AI access yourself — one per day',
    },
]);

/** Which perks a member has unlocked. */
function perksFor(state, userId) {
    const out = [];
    for (const p of PERKS) {
        const track = state && state.tracks && state.tracks[p.requires.track];
        const user = track && track.users && track.users[userId];
        if (user && p.requires.any.some((k) => user.unlocked[k])) out.push(p);
    }
    return out;
}

function perkAllowed(state, userId, command) {
    return perksFor(state, userId).some((p) => p.command === command);
}

/** The perk a member is closest to, for the "locked" hint in !achievements. */
function perkByCommand(command) {
    return PERKS.find((p) => p.command === command) || null;
}

/** Every perk must point at keys a track can actually unlock. Run by the tests against buildTracks(). */
function validatePerks(tracks) {
    const errors = [];
    const { resolveTrack } = require('./achievements');
    for (const p of PERKS) {
        const t = tracks[p.requires.track];
        if (!t) { errors.push(`perk ${p.command}: unknown track ${p.requires.track}`); continue; }
        const keys = new Set(resolveTrack(p.requires.track, t).map((a) => a.key));
        for (const k of p.requires.any) if (!keys.has(k)) errors.push(`perk ${p.command}: "${k}" is not an achievement on ${p.requires.track}`);
    }
    return errors;
}

module.exports = { buildTracks, PERKS, perksFor, perkAllowed, perkByCommand, validatePerks };
