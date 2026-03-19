#!/usr/bin/env node
/**
 * Deep audit: fetch EVERY message in #arch-ai (paginate until exhausted),
 * from oldest to newest, and compare !addfact / !suggest against
 * knowledge.json + suggestions.json.
 *
 * Usage:
 *   node scripts/audit-arch-ai-full.js
 *   node scripts/audit-arch-ai-full.js --json   # write data/arch-ai-audit-report.json
 */

const path = require('path');
const envDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(envDir, '.env') });
require('dotenv').config({ path: path.join(envDir, '.env.local'), override: true });
const fs = require('fs');
const https = require('https');

const KNOWLEDGE_PATH = path.join(envDir, 'data', 'knowledge.json');
const SUGGESTIONS_PATH = path.join(envDir, 'data', 'suggestions.json');
const REPORT_JSON = path.join(envDir, 'data', 'arch-ai-audit-report.json');
const ARCH_AI_CHANNEL = '1424322391160393790';

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN not set');
    process.exit(1);
}

const saveJson = process.argv.includes('--json');

function discordRequest(method, apiPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'discord.com',
            path: '/api/v10' + apiPath,
            method,
            headers: { 'Authorization': 'Bot ' + token },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(data); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

/** Fetch all messages until API returns empty or partial page end */
async function fetchAllMessagesUnlimited(channelId) {
    const all = [];
    let before = null;
    let page = 0;
    while (true) {
        let apiPath = `/channels/${channelId}/messages?limit=100`;
        if (before) apiPath += `&before=${before}`;
        const msgs = await discordRequest('GET', apiPath);
        if (!Array.isArray(msgs)) {
            console.error('❌ Unexpected API response:', typeof msgs, msgs?.message || msgs);
            break;
        }
        if (msgs.length === 0) break;
        all.push(...msgs);
        before = msgs[msgs.length - 1].id;
        page++;
        if (msgs.length < 100) break;
        // gentle pacing (avoid burst rate limits on huge channels)
        await new Promise(r => setTimeout(r, 150));
    }
    console.log(`   Pages fetched: ${page}, total messages: ${all.length}`);
    return all;
}

function loadJSON(p) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function flattenTexts(knowledge) {
    const texts = [];
    for (const [key, val] of Object.entries(knowledge)) {
        if (key === 'custom_facts') {
            if (Array.isArray(val)) val.forEach(f => texts.push((f.text || '').toLowerCase().trim()));
        } else if (typeof val === 'object' && val !== null) {
            const flatten = (obj) => {
                for (const v of Object.values(obj)) {
                    if (typeof v === 'string') texts.push(v.toLowerCase().trim());
                    else if (typeof v === 'object' && v !== null) flatten(v);
                }
            };
            flatten(val);
        }
    }
    return texts;
}

function isInKnowledge(text, existingTexts) {
    const normalized = text.toLowerCase().trim();
    if (normalized.length < 5) return { ok: false, reason: 'too_short' };
    const keywords = normalized.split(/\s+/).filter(w => w.length > 4).slice(0, 5);
    const byPrefix = existingTexts.some(existing =>
        existing.includes(normalized.substring(0, 40)) || normalized.includes(existing.substring(0, 40))
    );
    const byKeywords = keywords.length >= 3 &&
        keywords.filter(kw => existingTexts.some(t => t.includes(kw))).length >= 3;
    return { ok: byPrefix || byKeywords, reason: byPrefix ? 'prefix_or_contains' : byKeywords ? 'keywords' : 'not_found' };
}

function head(s, n = 72) {
    const t = (s || '').replace(/\s+/g, ' ').trim();
    return t.length <= n ? t : t.slice(0, n) + '…';
}

function normKey(s) {
    return (s || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/it'as\b/g, "it's") // common Discord typo vs cleaned repo text
        .trim()
        .substring(0, 80);
}

function matchSuggestionToRepo(suggestText, suggestions) {
    const key = normKey(suggestText);
    for (const s of suggestions) {
        const t = normKey(s.text || '');
        if (!t) continue;
        if (t === key || t.includes(key.substring(0, 50)) || key.includes(t.substring(0, 50))) {
            return { id: s.id, status: s.status, by: s.by };
        }
    }
    return null;
}

function snowflakeToDate(id) {
    const ms = Number(BigInt(id) >> 22n) + 1420070400000;
    return new Date(ms).toISOString();
}

(async () => {
    console.log('🔬 Arch AI full-channel audit');
    console.log('   Channel:', ARCH_AI_CHANNEL);
    console.log('');

    const knowledge = loadJSON(KNOWLEDGE_PATH);
    const suggestions = loadJSON(SUGGESTIONS_PATH) || [];
    if (!knowledge) {
        console.error('❌ knowledge.json missing');
        process.exit(1);
    }

    const existingTexts = flattenTexts(knowledge);

    console.log('📥 Fetching all messages (unlimited pagination)...');
    const raw = await fetchAllMessagesUnlimited(ARCH_AI_CHANNEL);

    // Oldest first (chronological)
    const chronological = [...raw].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));

    const addfacts = [];
    const suggests = [];
    const addfactTooShort = [];
    const otherCommands = [];

    for (const m of chronological) {
        const c = (m.content || '').trim();
        const lower = c.toLowerCase();
        if (lower.startsWith('!addfact')) {
            const body = c.replace(/^!addfact\s+/i, '').trim();
            if (body.length <= 20) {
                addfactTooShort.push({
                    id: m.id,
                    at: snowflakeToDate(m.id),
                    author: m.author?.username,
                    preview: head(body, 120),
                    len: body.length,
                });
            } else {
                const cov = isInKnowledge(body, existingTexts);
                addfacts.push({
                    id: m.id,
                    at: snowflakeToDate(m.id),
                    author: m.author?.username,
                    userId: m.author?.id,
                    text: body,
                    preview: head(body, 100),
                    inKnowledge: cov.ok,
                    matchReason: cov.reason,
                });
            }
        } else if (lower.startsWith('!suggestions')) {
            // admin command — not !suggest
        } else if (/^!suggest\b/i.test(c)) {
            const body = c.replace(/^!suggest\s*/i, '').trim();
            if (body.length < 10) {
                otherCommands.push({ type: 'suggest_too_short', id: m.id, at: snowflakeToDate(m.id), author: m.author?.username });
            } else {
                const repo = matchSuggestionToRepo(body, suggestions);
                suggests.push({
                    id: m.id,
                    at: snowflakeToDate(m.id),
                    author: m.author?.username,
                    userId: m.author?.id,
                    text: body,
                    preview: head(body, 100),
                    inRepo: !!repo,
                    repoId: repo?.id,
                    repoStatus: repo?.status,
                    repoBy: repo?.by,
                });
            }
        } else if (/^![a-z]/i.test(c)) {
            const cmd = c.split(/\s/)[0].toLowerCase();
            if (['!help', '!menu', '!ping', '!faq', '!listfacts', '!list', '!contributors', '!suggestions', '!approve', '!reject', '!grant', '!reset', '!recruit', '!setupreaction', '!post-guild-requirements', '!removefact', '!ai-toggle'].includes(cmd)) {
                // skip noise
            } else {
                otherCommands.push({ type: 'unknown_cmd', cmd, id: m.id, at: snowflakeToDate(m.id), author: m.author?.username, preview: head(c, 60) });
            }
        }
    }

    const firstAddfact = addfacts[0];
    const missedAddfacts = addfacts.filter(a => !a.inKnowledge);
    const missedSuggests = suggests.filter(s => !s.inRepo);

    console.log('');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`Total messages in channel:     ${chronological.length}`);
    console.log(`Oldest message (approx):       ${chronological[0] ? snowflakeToDate(chronological[0].id) : 'n/a'}`);
    console.log(`Newest message (approx):       ${chronological[chronological.length - 1] ? snowflakeToDate(chronological[chronological.length - 1].id) : 'n/a'}`);
    console.log(`!addfact (body > 20 chars):    ${addfacts.length}`);
    console.log(`!addfact (too short / skipped): ${addfactTooShort.length}`);
    console.log(`!suggest (body >= 10):         ${suggests.length}`);
    console.log(`First !addfact in history:     ${firstAddfact ? `${firstAddfact.at} — ${firstAddfact.author} — ${firstAddfact.preview}` : 'none found'}`);
    console.log('');
    console.log(`✅ !addfact covered in knowledge: ${addfacts.filter(a => a.inKnowledge).length}`);
    console.log(`⚠️  !addfact NOT matched to knowledge: ${missedAddfacts.length}`);
    console.log(`✅ !suggest found in suggestions.json: ${suggests.filter(s => s.inRepo).length}`);
    console.log(`⚠️  !suggest NOT in suggestions.json: ${missedSuggests.length}`);
    console.log(`Other notable commands logged:   ${otherCommands.length}`);
    console.log('');

    if (missedAddfacts.length) {
        console.log('──────────────────────────────────────────────────────────────');
        console.log('MISSED / UNMATCHED !addfact (add to knowledge or fix matcher)');
        console.log('──────────────────────────────────────────────────────────────');
        missedAddfacts.forEach((a, i) => {
            console.log(`${i + 1}. [${a.at}] ${a.author} | ${a.matchReason}`);
            console.log(`   ${a.preview}`);
            console.log(`   msg id: ${a.id}`);
            console.log('');
        });
    }

    if (missedSuggests.length) {
        console.log('──────────────────────────────────────────────────────────────');
        console.log('!suggest NOT in repo suggestions.json (never synced / lost)');
        console.log('──────────────────────────────────────────────────────────────');
        missedSuggests.forEach((s, i) => {
            console.log(`${i + 1}. [${s.at}] ${s.author}`);
            console.log(`   ${s.preview}`);
            console.log(`   msg id: ${s.id}`);
            console.log('');
        });
    }

    if (addfactTooShort.length) {
        console.log('──────────────────────────────────────────────────────────────');
        console.log('!addfact with body ≤20 chars (sync script ignores these)');
        console.log('──────────────────────────────────────────────────────────────');
        addfactTooShort.forEach((a, i) => console.log(`${i + 1}. [${a.at}] ${a.author} len=${a.len}: ${a.preview}`));
        console.log('');
    }

    if (otherCommands.length) {
        console.log('──────────────────────────────────────────────────────────────');
        console.log('Other !commands (review if any look like facts)');
        console.log('──────────────────────────────────────────────────────────────');
        otherCommands.slice(0, 30).forEach((o, i) => console.log(`${i + 1}. ${JSON.stringify(o)}`));
        if (otherCommands.length > 30) console.log(`   ... +${otherCommands.length - 30} more`);
        console.log('');
    }

    const report = {
        generatedAt: new Date().toISOString(),
        channelId: ARCH_AI_CHANNEL,
        totalMessages: chronological.length,
        timeRange: {
            oldest: chronological[0] ? snowflakeToDate(chronological[0].id) : null,
            newest: chronological[chronological.length - 1] ? snowflakeToDate(chronological[chronological.length - 1].id) : null,
        },
        firstAddfact: firstAddfact ? { at: firstAddfact.at, author: firstAddfact.author, preview: firstAddfact.preview, messageId: firstAddfact.id } : null,
        counts: {
            addfactValid: addfacts.length,
            addfactTooShort: addfactTooShort.length,
            suggestValid: suggests.length,
            addfactInKnowledge: addfacts.filter(a => a.inKnowledge).length,
            addfactMissed: missedAddfacts.length,
            suggestInRepo: suggests.filter(s => s.inRepo).length,
            suggestMissed: missedSuggests.length,
        },
        missedAddfacts,
        missedSuggests,
        addfactTooShort,
        allAddfacts: addfacts.map(({ text, ...rest }) => ({ ...rest, textLen: text.length })),
        allSuggests: suggests.map(({ text, ...rest }) => ({ ...rest, textLen: text.length })),
        otherCommands,
    };

    if (saveJson) {
        fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + '\n');
        console.log(`📄 Full report written: ${REPORT_JSON}`);
    } else {
        console.log('Tip: run with --json to save arch-ai-audit-report.json');
    }

    if (missedAddfacts.length === 0 && missedSuggests.length === 0 && addfactTooShort.length === 0) {
        console.log('\n✅ No gaps detected for !addfact / !suggest vs repo.');
    } else {
        process.exitCode = missedAddfacts.length || missedSuggests.length ? 2 : 0;
    }
})();
