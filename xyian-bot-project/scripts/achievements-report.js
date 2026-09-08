#!/usr/bin/env node
/**
 * Preview the achievements rebuild WITHOUT touching production.
 *
 * Replays real channel history (GET-only Discord REST, Bot token from .env)
 * through the SAME reducer the bot uses — lib/achievements.js with the tracks
 * from lib/achievement-tracks.js — and prints who would hold what. This is the
 * calibration check before a threshold is frozen, and the dry run before
 * `!achievements rebuild`. Measurement reads what production reads.
 *
 *   node scripts/achievements-report.js                 # full history
 *   node scripts/achievements-report.js --since 2026-06-01
 *   node scripts/achievements-report.js --json out.json # also dump the state
 *
 * Channel ids mirror CONFIG in bot.js (which is not requireable — it starts
 * the bot). If CONFIG changes, change these.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const achievements = require('../lib/achievements');
const { buildTracks } = require('../lib/achievement-tracks');

const TOKEN = process.env.DISCORD_TOKEN, GUILD_ID = process.env.GUILD_ID;
if (!TOKEN || !GUILD_ID) { console.error('DISCORD_TOKEN and GUILD_ID must be set'); process.exit(1); }
const argv = process.argv.slice(2);
const sinceArg = argv[argv.indexOf('--since') + 1];
const SINCE = argv.includes('--since') && sinceArg ? Date.parse(sinceArg) : 0;
const JSON_OUT = argv.includes('--json') ? argv[argv.indexOf('--json') + 1] : null;

const CH = {
    strategy: ['1421930658737164531', '1419944602651197511', '1421948149827895498', '1429496650627551332', '1487582830702759936', '1487582836327186482', '1487582841507151883', '1487582846548971620', '1487582851808624731', '1487582856732606596', '1487582861912444979', '1487582867822215300', '1487582873094721789'],
    communityExclude: ['1424329611969433703', '1424784471395274803', '1424530610059350086', '1429497007814479903', '1419944464608268410'],
    crossServer: '1425322796820725760',
    clips: '1419944149410648116',
    dabCorner: '1540418122996121720',
    archAi: '1424322391160393790',
};
const TRACKS = buildTracks(CH);

let calls = 0;
async function api(p) {
    for (;;) {
        calls++;
        const res = await fetch('https://discord.com/api/v10' + p, { headers: { Authorization: 'Bot ' + TOKEN } });
        if (res.status === 429) { const j = await res.json().catch(() => ({})); await new Promise((r) => setTimeout(r, ((j.retry_after || 1) * 1000) + 100)); continue; }
        if (!res.ok) throw new Error(`${res.status} ${p}`);
        return res.json();
    }
}

function mediaCount(m) {
    return (m.attachments || []).length;          // files only — link unfurls are not visible to the live hook
}

(async () => {
    const channels = await api(`/guilds/${GUILD_ID}/channels`);
    const text = channels.filter((c) => c.type === 0);
    const wanted = new Set();
    for (const t of Object.values(TRACKS)) {
        const c = t.channels || {};
        if (Array.isArray(c.include)) c.include.forEach((id) => wanted.add(id));
        else if (Array.isArray(c.exclude)) text.filter((ch) => !c.exclude.includes(ch.id)).forEach((ch) => wanted.add(ch.id));
    }
    const events = [];
    let fetched = 0;
    const unreadable = [];
    for (const id of wanted) {
        const name = (channels.find((c) => c.id === id) || {}).name || id;
        let before = null, n = 0;
        try {
            for (let page = 0; page < 300; page++) {
                const batch = await api(`/channels/${id}/messages?limit=100${before ? `&before=${before}` : ''}`);
                if (!batch.length) break;
                for (const m of batch) {
                    const ts = Date.parse(m.timestamp);
                    if (ts < SINCE) continue;
                    fetched++; n++;
                    const authorBot = Boolean(m.author && m.author.bot);
                    if (!achievements.eligibleMessage({ authorBot, webhookId: m.webhook_id, system: m.type !== 0 && m.type !== 19 && m.type !== 21, guildId: GUILD_ID, content: m.content })) continue;
                    const repliedTo = m.referenced_message && m.referenced_message.author ? m.referenced_message.author.id : null;
                    events.push({ type: 'message', userId: m.author.id, username: m.author.username, channelId: id, parentId: null, ts,
                        isReply: Boolean(m.message_reference), repliedToUserId: repliedTo, attachments: mediaCount(m) });
                    if (id === CH.archAi) events.push({ type: 'aiQuestion', userId: m.author.id, username: m.author.username, channelId: id, parentId: null, ts: ts + 1 });
                    if ((m.reactions || []).some((r) => r.count > (r.me ? 1 : 0))) events.push({ type: 'reaction', messageId: m.id, authorId: m.author.id, authorUsername: m.author.username, reactorId: 'history', channelId: id, parentId: null, ts: ts + 1 });
                }
                before = batch[batch.length - 1].id;
                if (batch.length < 100 || Date.parse(batch[batch.length - 1].timestamp) < SINCE) break;
            }
            process.stderr.write(`  #${name}: ${n} messages\n`);
        } catch (e) { unreadable.push(`${name} (${e.message})`); }
    }
    const state = achievements.rebuild(null, TRACKS, events, new Date().toISOString());
    console.log(`\nAchievements report — ${fetched} messages, ${events.length} events, ${calls} API calls${SINCE ? `, since ${new Date(SINCE).toISOString().slice(0, 10)}` : ' (full history)'}${unreadable.length ? `\n  unreadable: ${unreadable.join(', ')}` : ''}\n`);
    for (const [trackId, t] of Object.entries(TRACKS)) {
        const users = (state.tracks[trackId] && state.tracks[trackId].users) || {};
        console.log(`${t.emoji} ${t.name} — ${Object.keys(users).length} members`);
        for (const a of achievements.resolveTrack(trackId, t)) {
            const holders = Object.values(users).filter((u) => u.unlocked[a.key]);
            if (!holders.length) { console.log(`   ${a.emoji} ${a.name.padEnd(20)} ${String(a.threshold).padStart(5)} ${a.stat.padEnd(12)} — nobody yet`); continue; }
            const names = holders.map((u) => u.username).slice(0, 8).join(', ') + (holders.length > 8 ? ` +${holders.length - 8}` : '');
            console.log(`   ${a.emoji} ${a.name.padEnd(20)} ${String(a.threshold).padStart(5)} ${a.stat.padEnd(12)} — ${holders.length}: ${names}`);
        }
        const lb = achievements.leaderboard(state, TRACKS, trackId, 10);
        if (lb) console.log(`   top: ${lb.map((r, i) => `${i + 1}. ${r.username} ${r.msgs}${r.tier ? ` (${r.tier.role})` : ''}`).join(' · ')}`);
        console.log('');
    }
    console.log('Roles owed:');
    const owed = {};
    for (const t of Object.values(state.tracks)) for (const [uid, u] of Object.entries(t.users)) { const r = achievements.rolesOwed(state, TRACKS, uid); if (r.size) owed[u.username] = [...r]; }
    for (const [name, roles] of Object.entries(owed).sort()) console.log(`   ${name.padEnd(24)} ${roles.join(', ')}`);
    if (JSON_OUT) { fs.writeFileSync(JSON_OUT, JSON.stringify(state, null, 1)); console.log(`\nstate written to ${JSON_OUT}`); }
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
