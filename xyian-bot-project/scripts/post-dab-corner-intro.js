#!/usr/bin/env node
/**
 * Post + pin the opening message in #dab-corner.
 *
 * A channel with nothing in it reads as an accident, and the house rules
 * belong somewhere members actually look — a pin, not just the topic line
 * that nobody expands on mobile.
 *
 * Idempotent: refuses to post if the bot already has a pinned message there.
 *
 * Usage:
 *   node scripts/post-dab-corner-intro.js --dry
 *   node scripts/post-dab-corner-intro.js
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
            'X-Audit-Log-Reason': 'Dab Corner opening post',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    return res.status === 204 ? null : res.json();
}

const EMBED = {
    title: '🌿 Welcome to The Dab Corner',
    description:
        'Every guild has that crew who logs in at 2am, gets three stages deep, and forgets '
        + 'what they were farming. **This is your channel.**\n\n'
        + 'Arch 2 Addicts is big enough now that the community has actual pockets in it — so '
        + 'we\'re building each one a home. This is the first.',
    color: 0x3BA55D,
    fields: [
        {
            name: '🔥 What goes here',
            value:
                '• Sesh check-ins — what you\'re on, what you\'re running\n'
                + '• Setup pics, glass, carts, whatever you\'re proud of\n'
                + '• The stage you cleared that you have *no memory* of clearing\n'
                + '• Munchies discourse. It gets heated. That\'s fine.',
            inline: false,
        },
        {
            name: '📜 House rules — short version',
            value:
                '**1.** 21+, and legal where you are.\n'
                + '**2.** No sourcing, sales, or trades. Not here, not in DMs off the back of here. '
                + 'This one is not negotiable — it\'s the line that gets whole servers deleted.\n'
                + '**3.** Nobody gets pressured, nobody gets judged. Sober folks welcome too.\n'
                + '**4.** Everything in <#1425139850599731365> still applies.',
            inline: false,
        },
        {
            name: '👀 Coming soon',
            value: 'Roles, perks and a little friendly competition for the regulars in here. Ideas welcome — post them below.',
            inline: false,
        },
    ],
    footer: { text: 'Arch 2 Addicts · pull up, say hi, tell us what you\'re smoking on' },
};

(async () => {
    const channels = await api('GET', `/guilds/${GUILD_ID}/channels`);
    const channel = channels.find((c) => c.name === 'dab-corner');
    if (!channel) throw new Error('#dab-corner does not exist — run create-dab-corner.js first');

    const pins = await api('GET', `/channels/${channel.id}/pins`);
    const already = (pins.items || pins || []).length > 0;
    if (already) { console.log('• #dab-corner already has a pinned message — refusing to double-post'); return; }

    if (isDry) {
        console.log('[dry run] would post + pin to #dab-corner (' + channel.id + '):\n');
        console.log(EMBED.title + '\n\n' + EMBED.description + '\n');
        for (const f of EMBED.fields) console.log(f.name + '\n' + f.value + '\n');
        console.log('— ' + EMBED.footer.text);
        return;
    }

    const msg = await api('POST', `/channels/${channel.id}/messages`, { embeds: [EMBED] });
    console.log(`✓ posted — message ${msg.id}`);
    await api('PUT', `/channels/${channel.id}/pins/${msg.id}`);
    console.log('✓ pinned');
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
