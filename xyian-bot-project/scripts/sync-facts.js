#!/usr/bin/env node
/**
 * Fact Sync Script
 *
 * Pulls custom facts from the live bot's #arch-ai channel (!addfact messages),
 * compares against the local knowledge.json, and adds any new ones.
 * Also credits contributors in suggestions.json so their approved count
 * is accurate for the role tier system (Arch Scholar @ 5, Arch Sage @ 15).
 *
 * Required after any knowledge-base update: update CHANGELOG.md, commit, push,
 * and deploy (or restart the bot) so it posts release notes to #changelog.
 *
 * Usage:
 *   node scripts/sync-facts.js           # Dry run — shows what would be added/credited
 *   node scripts/sync-facts.js --apply   # Write to knowledge.json + suggestions.json
 *   node scripts/sync-facts.js --notify  # Apply + post sync summary + DM contributors
 */

const path = require('path');
const envDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(envDir, '.env') });
require('dotenv').config({ path: path.join(envDir, '.env.local'), override: true });
const fs = require('fs');
const https = require('https');

const KNOWLEDGE_PATH = path.join(__dirname, '..', 'data', 'knowledge.json');
const SEEDS_KNOWLEDGE_PATH = path.join(__dirname, '..', 'seeds', 'knowledge.json');
const SUGGESTIONS_PATH = path.join(__dirname, '..', 'data', 'suggestions.json');
const ARCH_AI_CHANNEL = '1424322391160393790';
const DEBUG_CHANNEL = '1424329611969433703';
const OWNER_ID = process.env.OWNER_ID || '528059607826825226';

/** Approved suggestion rows already represented in structured knowledge (verbatim text differs from `damage_terminology` keys). */
const SKIP_APPROVED_SUGGESTION_IDS = new Set([30, 31, 32, 33]);

const TIER_THRESHOLDS = [
    { name: 'Arch Scholar', threshold: 5 },
    { name: 'Arch Sage', threshold: 15 },
];

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

// Fetches up to maxPages × 100 messages (e.g. 25 → 2500 messages) so we don't miss older !addfact
async function fetchAllMessages(channelId, maxPages = 25) {
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

function saveJSON(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
}

// Mirror knowledge.json into seeds/ so the Railway first-mount volume seed
// stays current. Called wherever we save KNOWLEDGE_PATH.
function saveKnowledgeWithSeedMirror(knowledge) {
    saveJSON(KNOWLEDGE_PATH, knowledge);
    try {
        const seedsDir = path.dirname(SEEDS_KNOWLEDGE_PATH);
        if (!fs.existsSync(seedsDir)) fs.mkdirSync(seedsDir, { recursive: true });
        // Preserve the repair manifests — they live ONLY in seeds/ and are what
        // makes a --repair reach the Railway volume at boot.
        let manifests = {};
        try {
            const prev = JSON.parse(fs.readFileSync(SEEDS_KNOWLEDGE_PATH, 'utf8'));
            if (Array.isArray(prev._repairs)) manifests._repairs = prev._repairs;
            if (Array.isArray(prev._custom_facts_repairs)) manifests._custom_facts_repairs = prev._custom_facts_repairs;
        } catch { /* no seed yet */ }
        saveJSON(SEEDS_KNOWLEDGE_PATH, { ...knowledge, ...manifests });
        console.log('🌱 seeds/knowledge.json refreshed (kept in sync with data/knowledge.json; repair manifests preserved)');
    } catch (e) {
        console.error('⚠️  Could not refresh seeds/knowledge.json:', e.message);
    }
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

function flattenTexts(knowledge) {
    const texts = [];
    for (const [key, val] of Object.entries(knowledge)) {
        if (key === 'custom_facts' || key === 'opinions') {
            if (Array.isArray(val)) val.forEach(f => {
                if (f && typeof f.text === 'string') texts.push(f.text.toLowerCase().trim());
            });
        } else if (typeof val === 'object' && val !== null) {
            const flatten = (obj) => {
                // Approved/vision entries are { text, added_by, added_at, source }.
                // Only push the .text so duplicate detection sees clean prose,
                // not the metadata fields. Curated entries without .text
                // (e.g. characters with skill_levels) recurse normally.
                if (typeof obj.text === 'string' && obj.text.length > 0) {
                    texts.push(obj.text.toLowerCase().trim());
                    return;
                }
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

// Whitelist of structured top-level categories an approved suggestion can be
// routed into. Mirrors KNOWLEDGE_CATEGORIES in bot.js so the round-trip path
// uses the same shape. Keep these in sync if the bot's set ever changes.
const KNOWLEDGE_CATEGORIES = new Set([
    'star_system', 'resonance', 'characters', 'pvp_meta', 'skins', 'gold',
    'guild', 'gear_sets', 'weapons', 'runes', 'blessings', 'game_modes',
    'profile_experience', 'tips', 'skills', 'resources', 'privilege_cards',
    'sacred_hall', 'damage_terminology', 'collectibles',
]);

function autoKey(text, fallbackId) {
    const words = (text || '').toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(w));
    const slug = words.slice(0, 3).join('_').slice(0, 30);
    return slug || `note_${fallbackId}`;
}

// Mirror of bot.js applyApprovedToKnowledge for the round-trip side.
// Returns { ok, locator, error }. Mutates `knowledge` in place.
function applyApprovedToKnowledge(knowledge, { category, key, text, by, suggestionId, source, addedAt }) {
    const today = addedAt || new Date().toISOString().split('T')[0];
    const credit = `${by} (via suggestion)`;
    const entrySource = source || 'suggestion';

    if (!category || category === 'custom_facts') {
        if (!knowledge.custom_facts) knowledge.custom_facts = [];
        knowledge.custom_facts.push({ text, added_by: credit, added_at: today, source: entrySource });
        return { ok: true, locator: 'custom_facts' };
    }
    if (category === 'opinions') {
        if (!knowledge.opinions) knowledge.opinions = [];
        knowledge.opinions.push({ text, added_by: credit, added_at: today, source: entrySource });
        return { ok: true, locator: 'opinions' };
    }
    if (!KNOWLEDGE_CATEGORIES.has(category)) {
        // Fall back to custom_facts rather than crashing the sync. The router
        // is intentionally forgiving here — the bot has the strict whitelist.
        if (!knowledge.custom_facts) knowledge.custom_facts = [];
        knowledge.custom_facts.push({ text, added_by: credit, added_at: today, source: entrySource });
        return { ok: true, locator: 'custom_facts', warning: `Unknown category '${category}', filed in custom_facts` };
    }
    if (!knowledge[category] || typeof knowledge[category] !== 'object' || Array.isArray(knowledge[category])) {
        knowledge[category] = {};
    }
    let finalKey = key || autoKey(text, suggestionId);
    if (Object.prototype.hasOwnProperty.call(knowledge[category], finalKey)) {
        let n = 2;
        while (Object.prototype.hasOwnProperty.call(knowledge[category], `${finalKey}_${n}`)) n++;
        finalKey = `${finalKey}_${n}`;
    }
    knowledge[category][finalKey] = {
        text,
        added_by: credit,
        added_at: today,
        source: entrySource,
    };
    return { ok: true, locator: `${category}.${finalKey}` };
}

/** Strip common !addfact prefixes so Discord copy matches structured knowledge keys */
function stripFactPrefixes(s) {
    return s
        .replace(/^weapons category\s*/i, '')
        .replace(/^collectables?:\s*/i, '')
        .replace(/^runes:\s*/i, '')
        .replace(/^runes\s+/i, '')
        .trim();
}

function normalizeUnicode(s) {
    return s.replace(/\u2019/g, "'").replace(/\u2018/g, "'");
}

/**
 * True if this fact text is already represented in knowledge.json.
 * Uses substring overlap (same as pre-3.9.12) so structured entries (e.g. skills.tracking_eye
 * without the "Tracking Eye:" label) still match the channel message.
 * Does NOT use the old keyword 3-of-5 heuristic — that caused false positives when many
 * rune lines shared words like "damage" / "rune" but were different facts.
 */
function isAlreadySynced(text, existingTexts) {
    const normalized = normalizeUnicode(text.toLowerCase().trim());
    if (!normalized.length) return true;
    const stripped = stripFactPrefixes(normalized);
    const variants = [normalized];
    if (stripped.length >= 20 && stripped !== normalized) variants.push(stripped);

    return existingTexts.some(existing => {
        const e = normalizeUnicode(existing);
        if (e.length < 12) return false;
        for (const n of variants) {
            if (e.includes(n)) return true;
            if (n.includes(e) && e.length > 40) return true;
            if (e.includes(n.substring(0, 40)) || n.includes(e.substring(0, 40))) return true;
        }
        return false;
    });
}

(async () => {
    console.log('📦 Fact Sync Script');
    console.log(applyMode ? '   Mode: APPLY' + (notifyMode ? ' + NOTIFY' : '') : '   Mode: DRY RUN (use --apply to write, --notify to post to Discord)');
    console.log('');

    const knowledge = loadJSON(KNOWLEDGE_PATH);
    if (!knowledge) { console.error('❌ Could not load knowledge.json'); process.exit(1); }

    const existingTexts = flattenTexts(knowledge);
    const beforeCount = countFacts(knowledge);

    // ── Pull !addfact messages from #arch-ai ──
    console.log('🔍 Scanning #arch-ai for !addfact messages...');
    const messages = await fetchAllMessages(ARCH_AI_CHANNEL);
    console.log(`   Fetched ${messages.length} messages from Discord (up to 25 pages × 100)`);
    const addFactMsgs = messages.filter(m => {
        const c = m.content || '';
        return /^\!addfact(\s|$)/i.test(c.trim()) && c.replace(/^\!addfact\s*/i, '').trim().length > 10;
    });

    // Build contribution list from ALL !addfact messages (for credit tracking)
    const allContributions = addFactMsgs.map(msg => ({
        text: msg.content.replace(/^!addfact\s+/, '').trim(),
        username: msg.author.username,
        userId: msg.author.id,
        date: msg.timestamp.split('T')[0],
        messageId: msg.id,
    }));

    // Filter to only new (unsaved) facts
    const newFacts = allContributions.filter(c => !isAlreadySynced(c.text, existingTexts));

    // ── Check approved suggestions not yet in knowledge ──
    console.log('🔍 Checking suggestions.json for approved items not in knowledge...');
    const suggestions = loadJSON(SUGGESTIONS_PATH) || [];
    const approvedSuggestions = suggestions.filter(s => s.status === 'approved');
    const newFromSuggestions = approvedSuggestions.filter(s =>
        !SKIP_APPROVED_SUGGESTION_IDS.has(s.id) &&
        !isAlreadySynced(s.text, existingTexts) &&
        !newFacts.some(f => f.text.toLowerCase().includes(s.text.toLowerCase().substring(0, 40)))
    );

    // ── Credit tracking ──
    // Ensure ALL !addfact contributions have a matching entry in suggestions.json
    // This is how the tier system counts approved contributions
    const existingSuggestionTexts = suggestions.map(s =>
        (s.text || '').toLowerCase().substring(0, 40)
    );

    const uncreditedContributions = allContributions.filter(c => {
        const norm = c.text.toLowerCase().substring(0, 40);
        return !existingSuggestionTexts.some(t => t.includes(norm) || norm.includes(t));
    });

    // ── Report ──
    console.log('');
    console.log('📊 Results:');
    console.log(`   !addfact messages found: ${addFactMsgs.length}`);
    console.log(`   Already in knowledge.json: ${allContributions.length - newFacts.length}`);
    console.log(`   NEW facts to add: ${newFacts.length}`);
    console.log(`   Approved suggestions not synced: ${newFromSuggestions.length}`);
    console.log('');

    // Credit report
    console.log('🎖️  Contributor Credit:');
    const creditByUser = {};
    allContributions.forEach(c => {
        if (!creditByUser[c.username]) creditByUser[c.username] = { userId: c.userId, total: 0, uncredited: 0 };
        creditByUser[c.username].total++;
    });
    uncreditedContributions.forEach(c => {
        if (creditByUser[c.username]) creditByUser[c.username].uncredited++;
    });
    // Also count existing approved suggestions per user
    const existingApprovedByUser = {};
    suggestions.filter(s => s.status === 'approved').forEach(s => {
        const key = s.by || 'unknown';
        existingApprovedByUser[key] = (existingApprovedByUser[key] || 0) + 1;
    });

    for (const [username, data] of Object.entries(creditByUser)) {
        const existing = existingApprovedByUser[username] || 0;
        const newCount = existing + data.uncredited;
        const tier = TIER_THRESHOLDS.filter(t => t.threshold <= newCount).pop();
        const nextTier = TIER_THRESHOLDS.find(t => t.threshold > newCount);
        console.log(`   ${username} (${data.userId}): ${data.total} total contributions, ${existing} already credited, ${data.uncredited} to credit → ${newCount} total approved`);
        if (tier) console.log(`      Current tier: ${tier.name}`);
        if (nextTier) console.log(`      Next tier: ${nextTier.name} (${nextTier.threshold - newCount} more needed)`);
    }
    console.log('');

    if (newFacts.length === 0 && uncreditedContributions.length === 0 && newFromSuggestions.length === 0) {
        console.log('✅ Knowledge base and credits are up to date — nothing to sync.');
        console.log(`   Total entries: ${beforeCount}`);
        return;
    }

    if (newFacts.length > 0) {
        console.log('📋 New facts to add:');
        newFacts.forEach((f, i) => {
            console.log(`   ${i + 1}. [${f.username}] ${f.text.substring(0, 100)}${f.text.length > 100 ? '...' : ''}`);
        });
        console.log('');
    }

    if (uncreditedContributions.length > 0) {
        console.log('🎖️  Contributions to credit in suggestions.json:');
        uncreditedContributions.forEach((c, i) => {
            console.log(`   ${i + 1}. [${c.username}] ${c.text.substring(0, 80)}...`);
        });
        console.log('');
    }

    if (!applyMode) {
        console.log('ℹ️  Dry run complete. Run with --apply to write changes.');
        return;
    }

    // ── Apply: add new facts to knowledge.json ──
    // !addfact contributions don't carry a category proposal, so they always
    // land in custom_facts (pre-vision behavior, preserved verbatim).
    if (newFacts.length > 0) {
        if (!knowledge.custom_facts) knowledge.custom_facts = [];
        for (const fact of newFacts) {
            knowledge.custom_facts.push({
                text: fact.text,
                added_by: fact.username,
                added_at: fact.date,
                source: 'addfact',
            });
        }
        saveKnowledgeWithSeedMirror(knowledge);
        console.log(`✅ Added ${newFacts.length} facts to knowledge.json`);
    }

    // ── Apply: credit uncredited contributions in suggestions.json ──
    if (uncreditedContributions.length > 0) {
        let nextId = suggestions.length > 0 ? Math.max(...suggestions.map(s => s.id || 0)) + 1 : 1;
        for (const c of uncreditedContributions) {
            suggestions.push({
                id: nextId++,
                text: c.text.substring(0, 200),
                by: c.username,
                userId: c.userId,
                at: new Date(c.date).toISOString(),
                status: 'approved',
                approvedVia: 'fact_sync',
            });
        }
        saveJSON(SUGGESTIONS_PATH, suggestions);
        console.log(`✅ Credited ${uncreditedContributions.length} contributions in suggestions.json`);
    }

    // Also add new suggestion entries if any. Approved-via-Discord rows that
    // carry approved_category / approved_key get routed to the structured
    // category (mirrors bot.js applyApprovedToKnowledge); plain rows still
    // fall through to custom_facts.
    if (newFromSuggestions.length > 0) {
        const summary = { custom_facts: 0, structured: 0 };
        for (const s of newFromSuggestions) {
            const result = applyApprovedToKnowledge(knowledge, {
                category: s.approved_category || null,
                key: s.approved_key || null,
                text: s.text,
                by: s.by,
                suggestionId: s.id,
                source: s.source || (s.approvedVia === 'fact_sync' ? 'addfact' : 'suggestion'),
                addedAt: s.at ? s.at.split('T')[0] : new Date().toISOString().split('T')[0],
            });
            if (result.locator === 'custom_facts') summary.custom_facts++;
            else summary.structured++;
            if (result.warning) console.log(`   ⚠️  ${result.warning} (suggestion #${s.id})`);
            console.log(`   → #${s.id} filed under ${result.locator}`);
        }
        saveKnowledgeWithSeedMirror(knowledge);
        console.log(`✅ Added ${newFromSuggestions.length} approved suggestions to knowledge.json (${summary.structured} categorized, ${summary.custom_facts} into custom_facts)`);
    }

    const afterCount = countFacts(knowledge);
    console.log(`\n📊 Before: ${beforeCount} entries → After: ${afterCount} entries`);

    // ── DM credited contributors (always when we credited; not opt-in) ──
    let dmSentTo = [];
    let dmFailed = [];
    if (applyMode && uncreditedContributions.length > 0) {
        for (const [username, data] of Object.entries(creditByUser)) {
            if (data.userId === OWNER_ID) continue;
            if (data.uncredited === 0) continue;
            const totalApproved = (existingApprovedByUser[username] || 0) + data.uncredited;
            const nextTier = TIER_THRESHOLDS.find(t => t.threshold > totalApproved);
            const progressLine = nextTier
                ? `You now have **${totalApproved}** approved contribution${totalApproved === 1 ? '' : 's'}. ${nextTier.threshold - totalApproved} more until **${nextTier.name}**!`
                : `You now have **${totalApproved}** approved contributions. You've reached the highest tier!`;

            const userFacts = uncreditedContributions.filter(c => c.username === username);
            const factLines = userFacts.map(c => `> ${c.text.substring(0, 400)}${c.text.length > 400 ? '…' : ''}`).join('\n\n');
            const factsSection = userFacts.length > 0
                ? `**Fact(s) added to the knowledge base:**\n\n${factLines}\n\n`
                : '';

            const dmBody = `✅ **Your contributions have been synced!**\n\n` +
                `${data.uncredited} of your facts have been reviewed and added to the bot's permanent knowledge base.\n\n` +
                factsSection +
                `${progressLine}\n\n` +
                `*Thank you for making the bot smarter for everyone!*`;
            const dmContent = dmBody.length > 2000 ? dmBody.substring(0, 1990) + '\n\n…_(message truncated)_' : dmBody;

            try {
                const dmChannel = await discordRequest('POST', '/users/@me/channels', { recipient_id: data.userId });
                if (dmChannel && dmChannel.id) {
                    await discordRequest('POST', `/channels/${dmChannel.id}/messages`, { content: dmContent });
                    dmSentTo.push(username);
                    console.log(`📬 DM sent to ${username}`);
                } else {
                    dmFailed.push(username);
                    console.log(`⚠️  Could not open DM with ${username}`);
                }
            } catch (e) {
                dmFailed.push(username);
                console.log(`⚠️  Could not DM ${username}: ${e.message || 'DMs disabled'}`);
            }
        }
    }

    // ── Notify Discord channels (optional: only with --notify) ──
    if (notifyMode) {
        const contributors = [...new Set(allContributions.map(c => c.username))].filter(u => u !== '_xyian');
        const totalSynced = newFacts.length + newFromSuggestions.length;
        const totalCredited = uncreditedContributions.length;

        if (totalSynced > 0 || totalCredited > 0) {
            const parts = [];
            if (totalSynced > 0) parts.push(`${totalSynced} fact${totalSynced === 1 ? '' : 's'} saved to permanent memory`);
            if (totalCredited > 0) parts.push(`${totalCredited} contribution${totalCredited === 1 ? '' : 's'} credited`);

            await discordRequest('POST', `/channels/${ARCH_AI_CHANNEL}/messages`, {
                content: `📦 **Memory Sync Complete**\n\n` +
                    `${parts.join(' and ')}.\n\n` +
                    `📊 Knowledge base: **${afterCount} facts**\n` +
                    (contributors.length ? `🎖️ Contributors: ${contributors.join(', ')}\n` : '') +
                    `*Keep using \`!addfact\` or \`!suggest\` to contribute!*`,
            });
            console.log('📢 Sync summary posted to #arch-ai');
        }

        await discordRequest('POST', `/channels/${DEBUG_CHANNEL}/messages`, {
            content: `📦 **Fact sync completed**\n` +
                `Facts added: ${newFacts.length + newFromSuggestions.length}\n` +
                `Contributions credited: ${uncreditedContributions.length}\n` +
                `Before: ${beforeCount} → After: ${afterCount}\n` +
                `Credit breakdown:\n` +
                Object.entries(creditByUser).map(([u, d]) => {
                    const total = (existingApprovedByUser[u] || 0) + d.uncredited;
                    return `  ${u}: ${total} approved`;
                }).join('\n') +
                (dmSentTo.length > 0 ? `\n📬 **DMs sent to:** ${dmSentTo.join(', ')}` : '') +
                (dmFailed.length > 0 ? `\n⚠️ **DM failed:** ${dmFailed.join(', ')}` : ''),
        });
        console.log('🔧 Sync confirmation posted to #debug-logs');
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Review the changes: git diff data/');
    console.log('   2. Update CHANGELOG.md with a patch entry');
    console.log('   3. Commit and push');
    console.log('   4. Deploy (or restart the bot) so it posts release notes to #changelog — required for every knowledge-base update (same as DMs/notify).');
})();
