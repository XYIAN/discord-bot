#!/usr/bin/env node
/**
 * One-off script: announces the new sub-guild ProjectXY (Guild ID 214890).
 *
 * Three audiences, three different messages (Kyle's spec, 2026-08-15):
 *
 *   1. #general              — the exciting advertisement. Get everyone hyped
 *                              to join ProjectXY.
 *   2. #guild-recruit-chat   — the practical notice: XYIAN OFFICIAL is full,
 *                              ProjectXY is the primary home for NEW members.
 *                              One sub only — nobody gets forgotten.
 *   3. #official-xyian-guild — family news for existing guildmates: we have a
 *                              sub now, and some members may be randomly
 *                              selected to transfer over to help seed it.
 *
 * Facts from the in-game guild screen: ProjectXY, ID 214890, Lv.10, active
 * players 6M+, daily boss & research 2x min, daily bargain 1x min.
 *
 * ⚠️  SUPERSEDED — DO NOT RE-RUN AS-IS. This is a record of what was posted on
 * 2026-08-15. The requirements changed on 2026-08-24: XYIAN OFFICIAL is 8M+,
 * ProjectXY is 6M+, and the daily requirement is 2x DONATIONS, not a bargain
 * (different systems). Re-running this would post the superseded numbers to
 * three channels. Build any new announcement from lib/guild-requirements.js.
 *
 * Usage:
 *   node scripts/post-projectxy-announcements.js          # post all three
 *   node scripts/post-projectxy-announcements.js --dry    # print, post nothing
 *   node scripts/post-projectxy-announcements.js --only=general|recruit|guild
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const https = require('https');

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
if (!TOKEN || !GUILD_ID) { console.error('DISCORD_TOKEN and GUILD_ID must be set'); process.exit(1); }

const args = process.argv.slice(2);
const isDry = args.includes('--dry');
const only = (args.find(a => a.startsWith('--only=')) || '').split('=')[1] || '';

function discordRequest(method, apiPath, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request({
            hostname: 'discord.com',
            path: '/api/v10' + apiPath,
            method,
            headers: {
                'Authorization': 'Bot ' + TOKEN,
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
            },
        }, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => {
                const parsed = (() => { try { return JSON.parse(data); } catch { return data; } })();
                if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`));
                else resolve(parsed);
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

// ── The three embeds ─────────────────────────────────────────────────────────

function generalEmbed() {
    return {
        title: '🚀 BIG NEWS — Introducing ProjectXY!',
        color: 0x00ff88,
        description: [
            "**The XYIAN family is growing.** Say hello to our brand-new sister guild: **ProjectXY** — `Guild ID: 214890`!",
            '',
            "XYIAN OFFICIAL filled up. That's what happens when a community is this good — so instead of closing the door, we built a second home. 🏰",
            '',
            '⚡ **Why you want in:**',
            '• Ground floor of a fresh leaderboard climb — your name on the wall from day one',
            '• Same family, same Discord, same Arch AI, same strategies that got the main guild to full',
            '• Active 6M+ players, climbing one day at a time',
            '',
            '🎯 **The ask:** daily boss battles & research (2x), daily bargain (1x), and show up here like you already do.',
            '',
            '**Open the game → Guild → search `214890` → ProjectXY. See you inside!** 🔥',
        ].join('\n'),
        footer: { text: 'ProjectXY · Guild ID 214890 — Arch 2 Addicts' },
    };
}

function recruitEmbed() {
    return {
        title: '🏰 New members: your guild is ProjectXY',
        color: 0xffa500,
        description: [
            'A milestone and a heads-up in one:',
            '',
            "**XYIAN OFFICIAL** (`Guild ID: 213797`) **is full.** We ran out of space — a success problem, but a real one.",
            '',
            "So we've expanded: **ProjectXY** (`Guild ID: 214890`) is our new sister guild and the **primary home for new members** from today.",
            '',
            "One thing we want to be clear about: **we are not expanding past one sub-guild.** Two guilds, one community, one Discord. Nobody gets forgotten or left in the dust — everyone hangs out here, uses the same Arch AI, and plays the same events together.",
            '',
            '🎯 **Requirements (same standard as the main guild):**',
            '• 💪 6M+ power',
            '• Daily boss battles & research (2x minimum)',
            '• Daily bargain (1x minimum)',
            '• Active in this Discord',
            '',
            '**Apply in game → search Guild ID `214890` → ProjectXY.**',
        ].join('\n'),
        footer: { text: 'XYIAN OFFICIAL 213797 (full) · ProjectXY 214890 (recruiting)' },
    };
}

function guildEmbed() {
    return {
        title: '📣 Guild family news: ProjectXY is live',
        color: 0x5865f2,
        description: [
            'XYIAN OFFICIAL crew — some news from leadership:',
            '',
            "We've opened our first (and only) sister guild: **ProjectXY** — `Guild ID: 214890`. The main guild is at capacity, and rather than turn good players away, we're growing the family.",
            '',
            '**What this means for you:**',
            "• New members will primarily join ProjectXY from now on.",
            '• **Some members may be randomly selected to transfer over** to help get the new guild off the ground. If that\'s you, leadership will reach out — it\'s the same community, same Discord, and you\'d be a founding presence there rather than a name on a long roster here.',
            '• We are **not** creating more sub-guilds after this one. Two guilds, one family — nobody gets left in the dust.',
            '',
            'Questions or a strong preference either way? Talk to leadership — this works best when it works for everyone. 💪',
        ].join('\n'),
        footer: { text: 'XYIAN OFFICIAL 213797 + ProjectXY 214890 — one family' },
    };
}

// ── Post ─────────────────────────────────────────────────────────────────────

const TARGETS = [
    { key: 'general', channelName: 'general', embed: generalEmbed() },
    { key: 'recruit', channelName: 'guild-recruit-chat', embed: recruitEmbed() },
    { key: 'guild', channelName: 'official-xyian-guild', embed: guildEmbed() },
];

(async () => {
    const channels = await discordRequest('GET', `/guilds/${GUILD_ID}/channels`);
    const byName = Object.fromEntries(channels.map((c) => [c.name, c]));

    for (const t of TARGETS) {
        if (only && t.key !== only) continue;
        const channel = byName[t.channelName];
        if (!channel) { console.error(`✗ #${t.channelName} not found — skipped`); process.exitCode = 1; continue; }

        if (isDry) {
            console.log(`\n── would post to #${t.channelName} ──`);
            console.log(`   ${t.embed.title}`);
            console.log(t.embed.description.split('\n').map((l) => '   ' + l).join('\n'));
            continue;
        }
        const msg = await discordRequest('POST', `/channels/${channel.id}/messages`, { embeds: [t.embed] });
        console.log(`✓ posted to #${t.channelName} — message ${msg.id}`);
    }
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
