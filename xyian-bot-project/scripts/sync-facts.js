#!/usr/bin/env node
/**
 * Fact Sync Script
 *
 * Pulls custom facts from the live bot's #arch-ai channel (!addfact messages),
 * compares against the local knowledge.json, and adds any new ones.
 *
 * Also checks approved suggestions and syncs those.
 *
 * Usage:
 *   node scripts/sync-facts.js           # Dry run — shows what would be added
 *   node scripts/sync-facts.js --apply   # Actually writes to knowledge.json
 *   node scripts/sync-facts.js --notify  # Apply + post sync summary to Discord
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });
const fs = require('fs');
const path = require('path');
const https = require('https');

const KNOWLEDGE_PATH = path.join(__dirname, '..', 'data', 'knowledge.json');
const SUGGESTIONS_PATH = path.join(__dirname, '..', 'data', 'suggestions.json');
const ARCH_AI_CHANNEL = '1424322391160393790';
const COMMUNITY_AI_CHANNEL = '1424785709914521701';
const DEBUG_CHANNEL = '1424329611969433703';

const token = process.env.DISCORD_TOKEN;
if (!token) { console.error('❌ DISCORD_TOKEN not set'); process.exit(1); }

const applyMode = process.argv.includes('--apply') || process.argv.includes('--notify');
const notifyMode = process.argv.includes('--notify');

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

async function fetchAllMessages(channelId, maxPages = 5) {
    let all = [];
    let before = null;
    for (let i = 0; i < maxPages; i++) {
        let apiPath = `/channels/${channelId}/messages?limit=100`;
        if (before) apiPath += `&before=${before}`;
        const msgs = await discordRequest('GET', apiPath);
        if (!Array.isArray(msgs) || !msgs.length) break;
        all = all.concat(msgs);
        before = msgs[msgs.length - 1].id;
    }
    return all;
}

function loadJSON(filepath) {
    try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return null; }
}

function countFacts(knowledge) {
    let count = 0;
    for (const [key, val] of Object.entries(knowledge)) {
        if (key === 'custom_facts') {
            count += Array.isArray(val) ? val.length : 0;
        } else if (typeof val === 'object' && val !== null) {
            count += Object.keys(val).length;
        }
    }
    return count;
}

(async () => {
    console.log('📦 Fact Sync Script');
    console.log(applyMode ? '   Mode: APPLY' + (notifyMode ? ' + NOTIFY' : '') : '   Mode: DRY RUN (use --apply to write, --notify to post to Discord)');
    console.log('');

    const knowledge = loadJSON(KNOWLEDGE_PATH);
    if (!knowledge) { console.error('❌ Could not load knowledge.json'); process.exit(1); }

    const existingTexts = [];
    for (const [key, val] of Object.entries(knowledge)) {
        if (key === 'custom_facts') {
            if (Array.isArray(val)) val.forEach(f => existingTexts.push(f.text.toLowerCase().trim()));
        } else if (typeof val === 'object' && val !== null) {
            const flatten = (obj) => {
                for (const v of Object.values(obj)) {
                    if (typeof v === 'string') existingTexts.push(v.toLowerCase().trim());
                    else if (typeof v === 'object' && v !== null) flatten(v);
                }
            };
            flatten(val);
        }
    }
    const beforeCount = countFacts(knowledge);

    // --- Pull !addfact messages from #arch-ai ---
    console.log('🔍 Scanning #arch-ai for !addfact messages...');
    const messages = await fetchAllMessages(ARCH_AI_CHANNEL);
    const addFactMsgs = messages.filter(m => m.content.startsWith('!addfact '));

    const newFacts = [];
    for (const msg of addFactMsgs) {
        const text = msg.content.replace(/^!addfact\s+/, '').trim();
        if (!text || text.length < 10) continue;
        const normalized = text.toLowerCase().trim();
        const keywords = normalized.split(/\s+/).filter(w => w.length > 4).slice(0, 5);
        const alreadyExists = existingTexts.some(existing =>
            existing.includes(normalized.substring(0, 40)) || normalized.includes(existing.substring(0, 40))
        ) || keywords.length >= 3 && keywords.filter(kw => existingTexts.some(t => t.includes(kw))).length >= 3;
        if (!alreadyExists) {
            newFacts.push({
                text,
                added_by: msg.author.username,
                added_at: msg.timestamp.split('T')[0],
                source: 'discord_addfact',
            });
        }
    }

    // --- Check approved suggestions ---
    console.log('🔍 Checking suggestions.json for approved items not in knowledge...');
    const suggestions = loadJSON(SUGGESTIONS_PATH) || [];
    const approvedSuggestions = suggestions.filter(s => s.status === 'approved');
    const newFromSuggestions = [];
    for (const s of approvedSuggestions) {
        const normalized = s.text.toLowerCase().trim();
        const keywords = normalized.split(/\s+/).filter(w => w.length > 4).slice(0, 5);
        const alreadyExists = existingTexts.some(existing =>
            existing.includes(normalized.substring(0, 40)) || normalized.includes(existing.substring(0, 40))
        ) || keywords.length >= 3 && keywords.filter(kw => existingTexts.some(t => t.includes(kw))).length >= 3;
        const alreadyInNew = newFacts.some(f => f.text.toLowerCase().includes(normalized.substring(0, 40)));
        if (!alreadyExists && !alreadyInNew) {
            newFromSuggestions.push({
                text: s.text,
                added_by: s.by || 'unknown',
                added_at: s.at ? s.at.split('T')[0] : new Date().toISOString().split('T')[0],
                source: 'approved_suggestion',
            });
        }
    }

    const allNew = [...newFacts, ...newFromSuggestions];

    // --- Report ---
    console.log('');
    console.log(`📊 Results:`);
    console.log(`   !addfact messages found: ${addFactMsgs.length}`);
    console.log(`   Approved suggestions: ${approvedSuggestions.length}`);
    console.log(`   Already in knowledge.json: ${addFactMsgs.length + approvedSuggestions.length - allNew.length}`);
    console.log(`   NEW facts to add: ${allNew.length}`);
    console.log('');

    if (allNew.length === 0) {
        console.log('✅ Knowledge base is up to date — nothing to sync.');
        console.log(`   Total entries: ${beforeCount}`);
        return;
    }

    console.log('📋 New facts:');
    allNew.forEach((f, i) => {
        console.log(`   ${i + 1}. [${f.added_by}] ${f.text.substring(0, 100)}${f.text.length > 100 ? '...' : ''}`);
    });
    console.log('');

    if (!applyMode) {
        console.log('ℹ️  Dry run complete. Run with --apply to write changes.');
        return;
    }

    // --- Apply ---
    if (!knowledge.custom_facts) knowledge.custom_facts = [];
    for (const fact of allNew) {
        knowledge.custom_facts.push({
            text: fact.text,
            added_by: fact.added_by,
            added_at: fact.added_at,
        });
    }

    fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(knowledge, null, 2) + '\n');
    const afterCount = countFacts(knowledge);

    console.log(`✅ Added ${allNew.length} facts to knowledge.json`);
    console.log(`   Before: ${beforeCount} entries`);
    console.log(`   After: ${afterCount} entries`);

    // --- Notify Discord ---
    if (notifyMode) {
        const contributors = [...new Set(allNew.map(f => f.added_by))];
        const summary = allNew.map(f => `• ${f.text.substring(0, 80)}${f.text.length > 80 ? '...' : ''} *(${f.added_by})*`).join('\n');

        await discordRequest('POST', `/channels/${ARCH_AI_CHANNEL}/messages`, {
            content: `📦 **Memory Sync Complete**\n\n` +
                `${allNew.length} community-contributed fact${allNew.length === 1 ? '' : 's'} ${allNew.length === 1 ? 'has' : 'have'} been reviewed and saved to **permanent memory**:\n\n` +
                `${summary}\n\n` +
                `📊 Knowledge base: **${afterCount} facts** | Contributors: ${contributors.join(', ')}\n` +
                `*Keep using \`!addfact\` or \`!suggest\` to contribute!*`,
        });
        console.log('📢 Sync summary posted to #arch-ai');

        await discordRequest('POST', `/channels/${DEBUG_CHANNEL}/messages`, {
            content: `📦 **Fact sync completed**\n` +
                `Added: ${allNew.length} facts\n` +
                `Before: ${beforeCount} → After: ${afterCount}\n` +
                `Contributors: ${contributors.join(', ')}`,
        });
        console.log('🔧 Sync confirmation posted to #debug-logs');
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes: git diff data/knowledge.json');
    console.log('   2. Update CHANGELOG.md with a patch entry');
    console.log('   3. Commit and push: git add -A && git commit -m "vX.Y.Z: Fact sync" && git push');
})();
