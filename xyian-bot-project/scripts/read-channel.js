#!/usr/bin/env node
'use strict';

// Dump a channel's recent messages as plain text.
//
//   node xyian-bot-project/scripts/read-channel.js              # arch-ai, last 40
//   node xyian-bot-project/scripts/read-channel.js general 60
//   node xyian-bot-project/scripts/read-channel.js --list       # channel names
//
// Reads DISCORD_TOKEN and GUILD_ID from xyian-bot-project/.env. Read-only.
//
// Written after reviewing an AI channel by driving the Discord desktop app with
// screenshots — scrolling, zooming, reading text off images. It took a dozen
// round trips to read what this prints in one, and it once typed into a
// half-written DM. The content is text; fetch it as text. See
// docs/coding-standards/debugging.md.

const fs = require('fs');
const path = require('path');

function loadEnv() {
    const out = { ...process.env };
    try {
        const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
        for (const line of raw.split('\n')) {
            const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
            if (m && out[m[1]] === undefined) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
        }
    } catch { /* no .env — rely on the environment */ }
    return out;
}

const env = loadEnv();
const token = env.DISCORD_TOKEN;
const guildId = env.GUILD_ID || env.ARCH_GUILD_ID;
if (!token || !guildId) {
    console.error('DISCORD_TOKEN and GUILD_ID must be set (.env or environment).');
    process.exit(2);
}

async function api(p) {
    const res = await fetch(`https://discord.com/api/v10${p}`, {
        headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${p}`);
    return res.json();
}

(async () => {
    const channels = await api(`/guilds/${guildId}/channels`);
    const textChannels = channels.filter((c) => c.type === 0);

    if (process.argv[2] === '--list') {
        console.log(textChannels.map((c) => `  #${c.name}`).sort().join('\n'));
        return;
    }

    const name = process.argv[2] || 'arch-ai';
    const limit = Math.min(Number(process.argv[3] || 40), 100);
    const channel = textChannels.find((c) => c.name === name);
    if (!channel) {
        console.error(`No channel named "${name}". Try --list.`);
        process.exit(1);
    }

    const messages = await api(`/channels/${channel.id}/messages?limit=${limit}`);
    console.log(`#${channel.name} — ${messages.length} most recent, oldest first`);
    console.log('='.repeat(72));

    for (const m of messages.reverse()) {
        const when = new Date(m.timestamp).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        });
        console.log(`\n-- ${m.author.username}${m.author.bot ? ' [BOT]' : ''} · ${when}`);
        if (m.referenced_message) {
            const r = m.referenced_message;
            console.log(`   ^ replying to ${r.author.username}: "${(r.content || '').slice(0, 90)}"`);
        }
        if (m.content) console.log(m.content);
        for (const e of m.embeds || []) {
            if (e.title) console.log(`   [embed] ${e.title}`);
            if (e.description) console.log(e.description);
        }
    }
})().catch((e) => {
    console.error(`Failed: ${e.message}`);
    process.exit(1);
});
