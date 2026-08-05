#!/usr/bin/env node
/**
 * One-off script: posts the moderation-commands guide to the guild leadership
 * channel, for the admins and moderators who actually have to use them.
 *
 * The commands shipped in v3.16.0 and are documented in `!help`, but `!help` is
 * a wall of text covering every tier — nobody reads it to discover that they
 * personally gained four new powers. This is the targeted version.
 *
 * Channel discovery mirrors post-v3.12-announcements.js: prefers
 * `leadership-roundtable`, falls back through the other officer channels.
 *
 * Usage:
 *   node scripts/post-moderation-guide.js --dry     # print the embed, post nothing
 *   node scripts/post-moderation-guide.js           # post it
 */

const path = require('path');
const envDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(envDir, '.env') });
require('dotenv').config({ path: path.join(envDir, '.env.local'), override: true });

const https = require('https');

const DRY = process.argv.includes('--dry');
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN && !DRY) { console.error('❌ DISCORD_TOKEN not set'); process.exit(1); }

const GUILD_ID = '1419944148701679686';
const FALLBACK_LEADERSHIP_CHANNEL = '1487167729910677564'; // rune-gear-strategy-and-presets

function discordRequest(method, endpoint, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const req = https.request({
            hostname: 'discord.com',
            path: `/api/v10${endpoint}`,
            method,
            headers: {
                Authorization: `Bot ${TOKEN}`,
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        }, (res) => {
            let raw = '';
            res.on('data', (c) => { raw += c; });
            res.on('end', () => {
                if (res.statusCode >= 400) return reject(new Error(`${res.statusCode} ${raw}`));
                try { resolve(raw ? JSON.parse(raw) : null); } catch { resolve(null); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

/**
 * Resolve the officer channel by name.
 *
 * Deliberately does NOT silently fall back to `rune-gear-strategy-and-presets`
 * the way post-v3.12-announcements.js does. This message tells officers how to
 * kick and ban people; landing it in a strategy channel because a name lookup
 * missed would be worse than not posting at all. Pass --allow-fallback if you
 * really want that channel.
 */
async function findLeadershipChannel() {
    const channels = await discordRequest('GET', `/guilds/${GUILD_ID}/channels`);
    if (!Array.isArray(channels)) {
        throw new Error('Could not list guild channels — refusing to guess where this goes.');
    }
    const byName = {};
    for (const c of channels) byName[c.name] = c;
    for (const candidate of ['leadership-roundtable', 'leadership', 'officers', 'xyian-leadership']) {
        if (byName[candidate]) return { id: byName[candidate].id, name: candidate };
    }
    if (process.argv.includes('--allow-fallback')) {
        return { id: FALLBACK_LEADERSHIP_CHANNEL, name: 'rune-gear-strategy-and-presets (fallback)' };
    }
    throw new Error(
        'No leadership channel found (looked for leadership-roundtable, leadership, officers, '
        + 'xyian-leadership). Refusing to post moderation instructions somewhere unintended. '
        + 'Re-run with --allow-fallback to use rune-gear-strategy-and-presets.',
    );
}

function moderationEmbed() {
    return {
        title: '🛡️ Moderation commands — a guide for officers',
        color: 0x5865f2,
        description: [
            'Until recently the bot could hand out contributor roles but had no way for you to *moderate* anyone. That changed — here is what you can now do and, just as importantly, what you cannot.',
            '',
            '**If you are a Moderator**',
            '`!role @user add|remove <role>` — add or remove a role',
            '`!timeout @user <30m|2h|7d> [reason]` — temporarily mute someone',
            '`!untimeout @user [reason]` — lift a timeout early',
            '',
            '**If you are XYIAN OFFICIAL or Admin** — everything above, plus:',
            '`!kick @user [reason]` — remove a member (they can rejoin)',
            '`!ban @user [reason]` — ban a member',
            '`!unban <user id> [reason]` — lift a ban',
            '',
            '**Why moderators cannot kick or ban**',
            'That split is deliberate. Timeouts are reversible; bans are not. If a moderator account is ever compromised, the worst it can do is mute people — it cannot empty the guild. Nothing personal.',
            '',
            '**Rules the bot enforces before it acts**',
            '• You cannot moderate yourself, the server owner, the bot owner, or other bots.',
            '• You can only action people **below you** in the role list.',
            '• The bot itself must sit above the target in the role list, or Discord refuses. If you see a complaint about role position, that is what it means — move the bot\'s role up.',
            '• Durations accept `30m`, `2h`, `7d` or a bare number of minutes. Discord caps timeouts at 28 days, and anything longer is rejected rather than quietly shortened.',
            '',
            'Every refusal comes with a sentence explaining *why*, rather than a silent failure. If you get one that does not make sense, that is a bug worth reporting.',
            '',
            '⚠️ **Please read before using kick/ban**',
            '`!kick`, `!ban` and `!unban` are shipped but have **not been tested against a real member yet** — testing them means actually removing somebody. The permission logic around them is unit-tested, but the Discord call itself is unproven. Try them on a throwaway account first, and tell Kyle how it goes.',
            '',
            'Full command list for every tier is in `!help`.',
        ].join('\n'),
        footer: { text: 'XY Elder — moderation guide' },
    };
}

(async () => {
    const embed = moderationEmbed();
    console.log(`\n${'═'.repeat(70)}\n${embed.title}\n${'═'.repeat(70)}`);
    console.log(embed.description);
    console.log(`${'═'.repeat(70)}`);
    console.log(`\n  description length: ${embed.description.length} chars (Discord limit 4096)\n`);

    if (DRY) {
        console.log('  DRY RUN — nothing posted.\n');
        return;
    }
    const channel = await findLeadershipChannel();
    console.log(`  target channel: #${channel.name} (${channel.id})`);
    await discordRequest('POST', `/channels/${channel.id}/messages`, { embeds: [embed] });
    console.log(`  ✅ posted to #${channel.name}\n`);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
