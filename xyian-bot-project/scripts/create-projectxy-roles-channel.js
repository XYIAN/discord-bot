#!/usr/bin/env node
/**
 * One-off: create the ProjectXY role/channel mirror (Kyle's spec, 2026-08-18).
 *
 *   - Role "ProjectXY Official"       — exact mirror of XYIAN OFFICIAL
 *   - Role "ProjectXY Guild Verified" — exact mirror of XYIAN Guild Verified
 *   - Channel #official-projectxy-guild in the XYIAN-Guild category, placed
 *     right after #official-xyian-guild, private to everyone EXCEPT:
 *     the two new roles, XYIAN OFFICIAL (Kyle: they should see it too),
 *     Admin, and the bot — the same overwrite pattern as the XYIAN channel.
 *
 * Exactly two roles and one channel — nothing else is created.
 *
 * Usage:
 *   node scripts/create-projectxy-roles-channel.js --dry
 *   node scripts/create-projectxy-roles-channel.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
if (!TOKEN || !GUILD_ID) { console.error('DISCORD_TOKEN and GUILD_ID must be set'); process.exit(1); }
const isDry = process.argv.includes('--dry');

async function api(method, apiPath, body) {
    const res = await fetch('https://discord.com/api/v10' + apiPath, {
        method,
        headers: {
            Authorization: 'Bot ' + TOKEN,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            'X-Audit-Log-Reason': 'ProjectXY sub-guild rollout',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    return res.json();
}

/** VIEW_CHANNEL + CONNECT — the exact mask the XYIAN channel uses. */
const VIEW = '1049600';

(async () => {
    const roles = await api('GET', `/guilds/${GUILD_ID}/roles`);
    const channels = await api('GET', `/guilds/${GUILD_ID}/channels`);
    const byName = (n) => roles.find((r) => r.name === n);

    const xyianOfficial = byName('XYIAN OFFICIAL');
    const xyianVerified = byName('XYIAN Guild Verified');
    const admin = byName('Admin');
    const template = channels.find((c) => c.name === 'official-xyian-guild');
    if (!xyianOfficial || !xyianVerified || !admin || !template) {
        throw new Error('template role or channel missing — refusing to guess');
    }
    // The type:1 (member) overwrite on the template is the bot itself.
    const botOverwrite = template.permission_overwrites.find((o) => o.type === 1);

    // Idempotence: never create a duplicate on a re-run.
    const plan = [];
    const existing = {
        official: byName('ProjectXY Official'),
        verified: byName('ProjectXY Guild Verified'),
        channel: channels.find((c) => c.name === 'official-projectxy-guild'),
    };

    if (!existing.official) {
        plan.push({
            what: 'role ProjectXY Official (mirror of XYIAN OFFICIAL)',
            run: () => api('POST', `/guilds/${GUILD_ID}/roles`, {
                name: 'ProjectXY Official',
                permissions: xyianOfficial.permissions,
                color: xyianOfficial.color,
                hoist: xyianOfficial.hoist,
                mentionable: xyianOfficial.mentionable,
            }),
        });
    } else console.log('• ProjectXY Official already exists — skipping');

    if (!existing.verified) {
        plan.push({
            what: 'role ProjectXY Guild Verified (mirror of XYIAN Guild Verified)',
            run: () => api('POST', `/guilds/${GUILD_ID}/roles`, {
                name: 'ProjectXY Guild Verified',
                permissions: xyianVerified.permissions,
                color: xyianVerified.color,
                hoist: xyianVerified.hoist,
                mentionable: xyianVerified.mentionable,
            }),
        });
    } else console.log('• ProjectXY Guild Verified already exists — skipping');

    if (isDry) {
        console.log('\n[dry run] would create:');
        for (const p of plan) console.log('  -', p.what);
        if (!existing.channel) console.log('  - channel #official-projectxy-guild in', template.parent_id, 'after #official-xyian-guild');
        return;
    }

    const created = {};
    for (const p of plan) {
        const r = await p.run();
        created[r.name] = r.id;
        console.log(`✓ created ${p.what} — id ${r.id}`);
    }
    const officialId = existing.official?.id ?? created['ProjectXY Official'];
    const verifiedId = existing.verified?.id ?? created['ProjectXY Guild Verified'];

    if (existing.channel) { console.log('• #official-projectxy-guild already exists — done'); return; }

    const channel = await api('POST', `/guilds/${GUILD_ID}/channels`, {
        name: 'official-projectxy-guild',
        type: 0,
        parent_id: template.parent_id,
        position: template.position + 1,
        topic: 'ProjectXY guild members — Guild ID 214890. Sister guild of XYIAN OFFICIAL.',
        permission_overwrites: [
            { id: GUILD_ID, type: 0, allow: '0', deny: VIEW },              // @everyone: out
            { id: officialId, type: 0, allow: VIEW, deny: '0' },            // ProjectXY Official
            { id: verifiedId, type: 0, allow: VIEW, deny: '0' },            // ProjectXY Guild Verified
            { id: xyianOfficial.id, type: 0, allow: VIEW, deny: '0' },      // XYIAN OFFICIAL (Kyle: they see it too)
            { id: admin.id, type: 0, allow: VIEW, deny: '0' },              // Admin, same as template
            ...(botOverwrite ? [{ id: botOverwrite.id, type: 1, allow: VIEW, deny: '0' }] : []),
        ],
    });
    console.log(`✓ created #${channel.name} — id ${channel.id} (category ${channel.parent_id}, position ${channel.position})`);
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
