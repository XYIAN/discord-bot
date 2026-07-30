'use strict';

// Read-only audit: scans the FULL #arch-ai history for community contributions
// (!suggest / !addfact / !opinion) and cross-references data/suggestions.json to
// find anything that was never credited. Writes nothing — prints a report.
//
//   node scripts/audit-contributions.js            # report only
//   node scripts/audit-contributions.js --json     # machine-readable
//
// Why this exists: all 52 existing approvals were backfilled by scripts, which
// bypassed the tier-upgrade path. This verifies nothing else slipped through.

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TOKEN = process.env.DISCORD_TOKEN;
const ARCH_AI_CHANNEL = '1424322391160393790';
const SUGGESTIONS_PATH = path.join(__dirname, '..', 'data', 'suggestions.json');
const MAX_PAGES = 40; // 40 * 100 = 4000 messages

function discord(pathname) {
    return new Promise((resolve, reject) => {
        const req = https.request(
            { hostname: 'discord.com', path: `/api/v10${pathname}`, method: 'GET',
              headers: { Authorization: `Bot ${TOKEN}`, 'User-Agent': 'DiscordBot (audit-contributions, 1.0)' } },
            (res) => {
                let body = '';
                res.on('data', (c) => { body += c; });
                res.on('end', () => {
                    if (res.statusCode === 429) {
                        const retry = (JSON.parse(body).retry_after || 1) * 1000 + 300;
                        return setTimeout(() => discord(pathname).then(resolve, reject), retry);
                    }
                    if (res.statusCode >= 400) return reject(new Error(`${res.statusCode} ${body.slice(0, 200)}`));
                    resolve(JSON.parse(body));
                });
            });
        req.on('error', reject);
        req.end();
    });
}

// Same normalization sync-facts.js uses, so "already recorded" matches its semantics.
function normalize(text) {
    return String(text || '')
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function isRecorded(recordedNorms, text) {
    const n = normalize(text);
    if (!n) return true;
    const key = n.slice(0, 40);
    for (const r of recordedNorms) {
        if (r.includes(key) || n.includes(r.slice(0, 40))) return true;
    }
    return false;
}

(async () => {
    if (!TOKEN) { console.error('DISCORD_TOKEN not set'); process.exit(1); }

    const suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_PATH, 'utf8'));
    const recordedNorms = suggestions.map((s) => normalize(s.text)).filter(Boolean);

    // Page backwards through the entire channel.
    let before = null;
    let all = [];
    for (let page = 0; page < MAX_PAGES; page++) {
        const q = `?limit=100${before ? `&before=${before}` : ''}`;
        const batch = await discord(`/channels/${ARCH_AI_CHANNEL}/messages${q}`);
        if (!batch.length) break;
        all = all.concat(batch);
        before = batch[batch.length - 1].id;
        if (batch.length < 100) break;
    }

    const CMD = /^\s*!(suggest|addfact|opinion)\s+([\s\S]+)/i;
    const contributions = [];
    for (const m of all) {
        if (m.author?.bot) continue;
        const match = (m.content || '').match(CMD);
        if (!match) continue;
        contributions.push({
            command: match[1].toLowerCase(),
            text: match[2].trim(),
            by: m.author.username,
            userId: m.author.id,
            at: m.timestamp,
            messageId: m.id,
        });
    }

    const missing = contributions.filter((c) => !isRecorded(recordedNorms, c.text));

    // Per-user tallies
    const tally = {};
    for (const c of contributions) {
        tally[c.by] = tally[c.by] || { total: 0, missing: 0, userId: c.userId };
        tally[c.by].total++;
    }
    for (const c of missing) tally[c.by].missing++;

    if (process.argv.includes('--json')) {
        console.log(JSON.stringify({ scanned: all.length, contributions: contributions.length, missing }, null, 2));
        return;
    }

    console.log(`Scanned ${all.length} messages in #arch-ai`);
    console.log(`Found ${contributions.length} contribution commands (!suggest/!addfact/!opinion)`);
    console.log(`Already recorded in suggestions.json: ${contributions.length - missing.length}`);
    console.log(`NOT recorded anywhere: ${missing.length}\n`);

    console.log('Per-contributor:');
    for (const [name, t] of Object.entries(tally).sort((a, b) => b[1].total - a[1].total)) {
        console.log(`  ${name.padEnd(16)} posted=${String(t.total).padStart(3)}  unrecorded=${String(t.missing).padStart(3)}  (${t.userId})`);
    }

    if (missing.length) {
        console.log('\nUnrecorded contributions (candidates to credit):');
        for (const c of missing) {
            console.log(`  [${c.at.slice(0, 10)}] ${c.by} !${c.command}: ${c.text.slice(0, 100).replace(/\n/g, ' ')}`);
        }
    }
})().catch((e) => { console.error('Audit failed:', e.message); process.exit(1); });
