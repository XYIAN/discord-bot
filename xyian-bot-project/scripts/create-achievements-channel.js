#!/usr/bin/env node
/**
 * One-off, idempotent: #achievements — the feed every badge, rank-up and perk
 * post goes to (Kyle, 2026-09-08: "maybe we can make a new one called
 * achievements"). Public, in Text Channels beside the social channels.
 *
 *   node scripts/create-achievements-channel.js --dry
 *   node scripts/create-achievements-channel.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const TOKEN = process.env.DISCORD_TOKEN, GUILD_ID = process.env.GUILD_ID;
if (!TOKEN || !GUILD_ID) { console.error('DISCORD_TOKEN and GUILD_ID must be set'); process.exit(1); }
const isDry = process.argv.includes('--dry');
async function api(method, p, body) {
    const res = await fetch('https://discord.com/api/v10' + p, { method, headers: { Authorization: 'Bot ' + TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}), 'X-Audit-Log-Reason': 'achievements feed (v3.35.1)' }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    return res.json();
}
(async () => {
    const channels = await api('GET', `/guilds/${GUILD_ID}/channels`);
    const existing = channels.find((c) => c.name === 'achievements');
    if (existing) { console.log(`• #achievements already exists — id ${existing.id}`); console.log(`ID=${existing.id}`); return; }
    const anchor = channels.find((c) => c.name === 'dab-corner') || channels.find((c) => c.name === 'clips-and-highlights');
    const plan = { name: 'achievements', type: 0, parent_id: anchor.parent_id, position: anchor.position + 1,
        topic: '🏆 Badges, rank-ups and perks, as they happen. Check yours: !rank · !achievements · !leaderboard' };
    if (isDry) { console.log('[dry] would create', JSON.stringify(plan)); return; }
    const ch = await api('POST', `/guilds/${GUILD_ID}/channels`, plan);
    console.log(`✓ created #${ch.name} — id ${ch.id} (public, after #${anchor.name})`); console.log(`ID=${ch.id}`);
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
