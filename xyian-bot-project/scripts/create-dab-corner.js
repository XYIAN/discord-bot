#!/usr/bin/env node
/**
 * One-off: create #dab-corner (Kyle's spec, 2026-08-21).
 *
 * A 420-friendly social channel — the first of the "one channel per big
 * demographic we notice" idea. Public to everyone, in the Text Channels
 * category beside #general and #clips-and-highlights, since it is a social
 * channel and not a strategy or guild one.
 *
 * TWO DELIBERATE CHOICES, both about keeping the server out of trouble:
 *
 * 1. The topic carries the house rule "no sourcing, sales or trades".
 *    Discord's guidelines permit talking about legal cannabis use but
 *    prohibit using Discord to arrange the SALE of drugs — that line is what
 *    gets servers actioned, so it is stated where members read it rather
 *    than left implied.
 * 2. --age-restrict flips Discord's age-restricted flag. NOT on by default:
 *    Kyle asked for a channel "available to everyone", and the flag adds an
 *    18+ confirmation gate. It is one command away if it is ever wanted.
 *
 * Idempotent — re-running finds the existing channel and changes nothing.
 *
 * Usage:
 *   node scripts/create-dab-corner.js --dry
 *   node scripts/create-dab-corner.js
 *   node scripts/create-dab-corner.js --age-restrict
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
if (!TOKEN || !GUILD_ID) { console.error('DISCORD_TOKEN and GUILD_ID must be set'); process.exit(1); }
const isDry = process.argv.includes('--dry');
const ageRestrict = process.argv.includes('--age-restrict');

const NAME = 'dab-corner';
const TOPIC = '🌿 The Dab Corner — 420-friendly hangout for Arch 2 Addicts. '
    + 'Sesh talk, munchies, and stage grinding at 3am. '
    + 'House rules: 21+ and legal where you are · no sourcing, sales or trades · keep it chill.';

async function api(method, apiPath, body) {
    const res = await fetch('https://discord.com/api/v10' + apiPath, {
        method,
        headers: {
            Authorization: 'Bot ' + TOKEN,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            'X-Audit-Log-Reason': 'Dab Corner community channel',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    return res.json();
}

(async () => {
    const channels = await api('GET', `/guilds/${GUILD_ID}/channels`);

    const existing = channels.find((c) => c.name === NAME);
    if (existing) {
        console.log(`• #${NAME} already exists — id ${existing.id}, nothing to do`);
        return;
    }

    // Sit with the social channels, not the strategy or guild ones.
    const general = channels.find((c) => c.name === 'general');
    const clips = channels.find((c) => c.name === 'clips-and-highlights');
    const anchor = clips || general;
    if (!anchor || !anchor.parent_id) throw new Error('could not locate the Text Channels category — refusing to guess');

    // PUBLIC: no permission_overwrites at all, exactly like #general and
    // #clips-and-highlights. Everyone sees it; @everyone inherits the category.
    const plan = {
        name: NAME,
        type: 0,
        parent_id: anchor.parent_id,
        position: anchor.position + 1,
        topic: TOPIC,
        nsfw: ageRestrict,
        rate_limit_per_user: 0,
    };

    if (isDry) {
        console.log('[dry run] would create:');
        console.log(JSON.stringify(plan, null, 2));
        console.log(`\n  category: ${channels.find((c) => c.id === anchor.parent_id).name}`);
        console.log(`  after:    #${anchor.name}`);
        console.log(`  private:  no — public to everyone, zero overwrites`);
        console.log(`  age-restricted: ${ageRestrict}`);
        return;
    }

    const channel = await api('POST', `/guilds/${GUILD_ID}/channels`, plan);
    console.log(`✓ created #${channel.name} — id ${channel.id}`);
    console.log(`  category ${channel.parent_id}, position ${channel.position}, nsfw=${channel.nsfw}`);
    console.log(`  overwrites: ${channel.permission_overwrites.length} (0 = public)`);
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
