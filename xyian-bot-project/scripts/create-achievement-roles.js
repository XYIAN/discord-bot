#!/usr/bin/env node
/**
 * One-off, idempotent: the roles the achievements engine grants (v3.35.0).
 *
 *   - "Arch Adept"          — first Arch AI question. Kyle: "when someone does
 *                              their first arch ai message they should auto get
 *                              tier 1 like arch adept". Sits under Arch Scholar
 *                              (5 approved suggestions) and Arch Sage (15).
 *   - "Dab Corner Regular"  — 7 distinct active days in #dab-corner. A presence
 *                              badge, never a volume or consumption one.
 *
 * The engine resolves roles BY NAME (CONFIG.tracks), so a rename here must be
 * mirrored in bot.js. Re-running finds the existing roles and creates nothing.
 *
 *   node scripts/create-achievement-roles.js --dry
 *   node scripts/create-achievement-roles.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const TOKEN = process.env.DISCORD_TOKEN, GUILD_ID = process.env.GUILD_ID;
if (!TOKEN || !GUILD_ID) { console.error('DISCORD_TOKEN and GUILD_ID must be set'); process.exit(1); }
const isDry = process.argv.includes('--dry');

async function api(method, p, body) {
    const res = await fetch('https://discord.com/api/v10' + p, {
        method, headers: { Authorization: 'Bot ' + TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}), 'X-Audit-Log-Reason': 'achievements engine roles (v3.35.0)' },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    return res.json();
}

(async () => {
    const roles = await api('GET', `/guilds/${GUILD_ID}/roles`);
    const byName = (n) => roles.find((r) => r.name === n);
    const scholar = byName('Arch Scholar');
    const WANT = [
        { name: 'Arch Adept', color: scholar ? scholar.color : 0x3498db, hoist: false, mentionable: false, why: 'mirrors Arch Scholar styling — same ladder' },
        { name: 'Dab Corner Regular', color: 0x3ba55d, hoist: false, mentionable: false, why: 'the #dab-corner green' },
    ];
    for (const w of WANT) {
        const existing = byName(w.name);
        if (existing) { console.log(`• ${w.name} already exists — id ${existing.id}`); continue; }
        if (isDry) { console.log(`[dry] would create ${w.name} (${w.why})`); continue; }
        const r = await api('POST', `/guilds/${GUILD_ID}/roles`, { name: w.name, color: w.color, hoist: w.hoist, mentionable: w.mentionable, permissions: '0' });
        console.log(`✓ created ${w.name} — id ${r.id} (${w.why})`);
    }
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
