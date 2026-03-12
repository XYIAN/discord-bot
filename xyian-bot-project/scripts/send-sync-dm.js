#!/usr/bin/env node
/**
 * Send the "your contributions have been synced" DM to a specific user (retroactive).
 * Use when someone was credited in a past sync but never got the DM.
 *
 * Usage: node scripts/send-sync-dm.js <username>
 * Example: node scripts/send-sync-dm.js fails_8743
 */

const path = require('path');
const envDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(envDir, '.env') });
require('dotenv').config({ path: path.join(envDir, '.env.local'), override: true });
const fs = require('fs');
const https = require('https');

const SUGGESTIONS_PATH = path.join(__dirname, '..', 'data', 'suggestions.json');

const TIER_THRESHOLDS = [
    { name: 'Arch Scholar', threshold: 5 },
    { name: 'Arch Sage', threshold: 15 },
];

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN not set. Set it in xyian-bot-project/.env or .env.local');
    process.exit(1);
}

const username = process.argv[2];
if (!username) {
    console.error('Usage: node scripts/send-sync-dm.js <username>');
    console.error('Example: node scripts/send-sync-dm.js fails_8743');
    process.exit(1);
}

function discordRequest(method, apiPath, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'discord.com',
            path: '/api/v10' + apiPath,
            method,
            headers: {
                'Authorization': 'Bot ' + token,
                ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(data); }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

function loadJSON(filepath) {
    try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return null; }
}

(async () => {
    const suggestions = loadJSON(SUGGESTIONS_PATH) || [];
    const approved = suggestions.filter(s => s.status === 'approved' && (s.by || '').toLowerCase() === username.toLowerCase());
    if (!approved.length) {
        console.error(`❌ No approved suggestions found for user "${username}" in suggestions.json`);
        process.exit(1);
    }

    const userId = approved[0].userId;
    const totalApproved = approved.length;
    const nextTier = TIER_THRESHOLDS.find(t => t.threshold > totalApproved);
    const progressLine = nextTier
        ? `You now have **${totalApproved}** approved contribution${totalApproved === 1 ? '' : 's'}. ${nextTier.threshold - totalApproved} more until **${nextTier.name}**!`
        : `You now have **${totalApproved}** approved contributions. You've reached the highest tier!`;

    const factLines = approved.map(s => `> ${(s.text || '').substring(0, 400)}${(s.text || '').length > 400 ? '…' : ''}`).join('\n\n');
    const factsSection = `**Fact(s) added to the knowledge base:**\n\n${factLines}\n\n`;

    const dmBody = `✅ **Your contributions have been synced!**\n\n` +
        `${totalApproved} of your facts have been reviewed and added to the bot's permanent knowledge base.\n\n` +
        factsSection +
        `${progressLine}\n\n` +
        `*Thank you for making the bot smarter for everyone!*`;
    const dmContent = dmBody.length > 2000 ? dmBody.substring(0, 1990) + '\n\n…_(message truncated)_' : dmBody;

    try {
        const dmChannel = await discordRequest('POST', '/users/@me/channels', { recipient_id: userId });
        if (dmChannel && dmChannel.id) {
            await discordRequest('POST', `/channels/${dmChannel.id}/messages`, { content: dmContent });
            console.log(`📬 DM sent to ${username} (${totalApproved} fact(s)).`);
        } else {
            console.error(`❌ Could not open DM channel with ${username}`);
            process.exit(1);
        }
    } catch (e) {
        console.error(`❌ Could not send DM to ${username}:`, e.message || e);
        process.exit(1);
    }
})();
