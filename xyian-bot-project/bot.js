#!/usr/bin/env node
/**
 * XYIAN Bot - Archero 2 community bot
 *
 * Features:
 *   - Daily reset reminder (5pm Pacific) → general chat
 *   - Guild recruitment (every other day) → recruit channel
 *   - OpenAI-powered Q&A in #arch-ai (verified roles + AI Enabled)
 *   - !addfact / !removefact / !listfacts for facts
 *   - !opinion / !removeopinion / !listopinions for community opinions
 *   - !suggest for community corrections → admin review queue
 *   - Activity leveling in strategy channels (XP per message → tier roles)
 *   - !rank / !leaderboard for activity progress
 *   - Welcome message for new members
 *   - Thumbs-up/down feedback on Q&A replies
 *   - Deploy notification → admin webhook on startup
 *   - Auto-delete stale scheduled messages when no user activity
 *   - Debug/errors → admin webhook
 *
 * ⚠️  CHANGELOG RULE: ALWAYS update CHANGELOG.md BEFORE pushing to main.
 *     The bot parses CHANGELOG.md on startup to determine the version and
 *     post release notes. Newest version MUST be the first ## [x.x.x] entry.
 *     If the changelog is wrong, the deploy is invisible (no debug log, no
 *     release notes). See .cursorrules and README for full rules.
 *
 * Env (required): DISCORD_TOKEN, GENERAL_CHAT_WEBHOOK, GUILD_RECRUIT_WEBHOOK, ADMIN_WEBHOOK
 * Env (optional): OPENAI_API_KEY, OWNER_ID, PORT
 * See docs/ENV-AND-CHANNELS.md for the full list.
 */

const { Client, GatewayIntentBits, Partials, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { createLogForwarder, attachConsole } = require('./lib/log-forwarder');
require('dotenv').config();

// Single source of truth: version + changelog are parsed from CHANGELOG.md
function parseChangelog() {
    try {
        const md = fs.readFileSync(path.join(__dirname, 'CHANGELOG.md'), 'utf-8');
        const versionMatch = md.match(/^## \[(\d+\.\d+\.\d+)\]/m);
        const version = versionMatch ? versionMatch[1] : '0.0.0';

        const firstEntry = md.indexOf('## [');
        const secondEntry = md.indexOf('## [', firstEntry + 1);
        const section = secondEntry > -1
            ? md.slice(firstEntry, secondEntry)
            : md.slice(firstEntry);

        const lines = section
            .split('\n')
            .filter(l => /^- /.test(l.trim()))
            .map(l => l.trim().replace(/^- /, ''));

        return { version, lines };
    } catch (e) {
        console.error('⚠️  Could not parse CHANGELOG.md:', e.message);
        return { version: '0.0.0', lines: [] };
    }
}

// Look up bullet lines for a specific historical version. Used by
// !post-changelog <version> to re-post any release whose original deploy
// failed to get its embed out (e.g. v3.12.0 whose description blew the
// 4096-char limit before chunking was added).
function getChangelogLinesForVersion(targetVersion) {
    try {
        const md = fs.readFileSync(path.join(__dirname, 'CHANGELOG.md'), 'utf-8');
        const startMarker = `## [${targetVersion}]`;
        const startIdx = md.indexOf(startMarker);
        if (startIdx === -1) return null;
        const afterStart = md.slice(startIdx);
        const nextEntry = afterStart.indexOf('\n## [');
        const section = nextEntry > -1 ? afterStart.slice(0, nextEntry) : afterStart;
        return section
            .split('\n')
            .filter(l => /^- /.test(l.trim()))
            .map(l => l.trim().replace(/^- /, ''));
    } catch {
        return null;
    }
}

// Build one or more EmbedBuilders so a long changelog body fits inside
// Discord's 4096-char embed description limit. Bullets stay whole — we never
// split mid-bullet, even if it means a chunk is shorter than the limit.
// Discord allows up to 10 embeds per message; if a release somehow exceeds
// that, postChangelogToChannel splits across multiple sends.
function buildChangelogEmbeds(version, lines) {
    const HARD_LIMIT = 3900; // Headroom under 4096 for safety + embed rendering.
    const bullets = lines.map(l => `• ${l}`);
    const chunks = [];
    let current = '';
    for (const b of bullets) {
        if (current && current.length + b.length + 1 > HARD_LIMIT) {
            chunks.push(current);
            current = '';
        }
        // If a single bullet itself is over the limit, hard-truncate it so we
        // don't drop the post entirely. Vanishingly rare in practice.
        const safeBullet = b.length > HARD_LIMIT ? b.slice(0, HARD_LIMIT - 3) + '...' : b;
        current += (current ? '\n' : '') + safeBullet;
    }
    if (current) chunks.push(current);
    if (chunks.length === 0) chunks.push('• (no entries)');

    return chunks.map((desc, idx) => {
        const e = new EmbedBuilder().setDescription(desc).setColor(0x00ff88);
        if (idx === 0) e.setTitle(`📦 XYIAN Bot v${version}`);
        const isLast = idx === chunks.length - 1;
        const footer = chunks.length > 1
            ? `XYIAN Bot — Changelog (part ${idx + 1}/${chunks.length})`
            : 'XYIAN Bot — Changelog';
        e.setFooter({ text: footer });
        if (isLast) e.setTimestamp();
        return e;
    });
}

// Post a versioned changelog entry to a channel, splitting across messages
// if it produces more than Discord's 10-embed-per-message ceiling.
async function postChangelogToChannel(channel, version, lines) {
    const embeds = buildChangelogEmbeds(version, lines);
    const MAX_PER_MSG = 10;
    for (let i = 0; i < embeds.length; i += MAX_PER_MSG) {
        await channel.send({ embeds: embeds.slice(i, i + MAX_PER_MSG) });
    }
    return embeds.length;
}

const { version: BOT_VERSION, lines: BOT_CHANGELOG } = parseChangelog();

// ── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
    channels: {
        archAi: '1424322391160393790',
        archAiDiscussion: '1424785709914521701',
        guildRecruit: '1419944464608268410',
        changelog: '1424784471395274803',
        general: null,  // resolved on ready by channel name
    },
    ignoreChannelNames: ['guild-recruit-chat', 'xyian-guild', 'guild-chat', 'recruit', 'guild-recruit'],
    generalChatNames: ['general', 'general-chat', 'main-chat', 'arch-2-addicts'],
    features: {
        tipOfTheDay: false,
        // Master kill switch for the OpenAI-backed Q&A in #arch-ai (text + vision).
        // Toggleable at runtime by the owner via !ai on / !ai off (in-memory only).
        aiEnabled: true,
        // Vision-specific flag. If false but aiEnabled is true, image attachments
        // are stripped and the message is treated as a text-only question.
        visionEnabled: true,
        // Vision cost guardrails — keep these tight; gpt-4o-mini vision is
        // ~10–50× the cost of text-only Q&A per call.
        visionMaxImages: 2,
        visionDetail: 'low',          // 'low' | 'high' | 'auto' — 'low' is ~85 tokens/image
        visionCooldownMs: 60_000,     // per-user vision cooldown
    },
    // Roles allowed to use vision (image attachments) in #arch-ai. Anyone else
    // who attaches an image gets a redirect embed and zero OpenAI calls.
    visionTrustedRoleNames: ['XYIAN OFFICIAL', 'Admin', 'Moderator', 'Arch Legend'],
    reactionRole: {
        emoji: '🤖',
        roleName: 'AI Enabled',
        messageIds: ['1477906768272166925', '1478172709719380081', '1478934754848931930'],
    },
    roleTiers: [
        { name: 'AI Enabled',   threshold: 0,  canAsk: true,  canSuggest: true,  canAddFact: false, canAddOpinion: false, canRemoveFact: false, canListFacts: false },
        { name: 'Arch Scholar',  threshold: 5,  canAsk: true,  canSuggest: true,  canAddFact: true,  canAddOpinion: true,  canRemoveFact: false, canListFacts: true  },
        { name: 'Arch Sage',    threshold: 15, canAsk: true,  canSuggest: true,  canAddFact: true,  canAddOpinion: true,  canRemoveFact: true,  canListFacts: true  },
    ],
    activityTiers: [
        { name: 'Arch Tactician', threshold: 100,  color: 0x7289DA },
        { name: 'Arch Veteran',   threshold: 350,  color: 0x2ECC71 },
        { name: 'Arch Warlord',   threshold: 750,  color: 0xFFD700 },
        { name: 'Arch Legend',     threshold: 1500, color: 0x00FFFF },
    ],
    activityChannelIds: new Set([
        '1421930658737164531', // arch2-wiki
        '1419944602651197511', // umbral-tempest
        '1421948149827895498', // arena-pvp
        '1429496650627551332', // fishing-event
        '1487582830702759936', // gem-spending
        '1487582836327186482', // campaign-and-hard-mode
        '1487582841507151883', // peak-arena
        '1487582846548971620', // sky-tower-and-challenges
        '1487582851808624731', // abyssal-tide
        '1487582856732606596', // boss-strategy
        '1487582861912444979', // rune-and-gear-builds
        '1487582867822215300', // event-guides
        '1487582873094721789', // all-star-cup
    ]),
};

const webhooks = {
    general: process.env.GENERAL_CHAT_WEBHOOK,
    recruit: process.env.GUILD_RECRUIT_WEBHOOK,
    admin: process.env.ADMIN_WEBHOOK,
};

// ── OpenAI (optional) ───────────────────────────────────────────────────────

let openai = null;
try {
    const OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('✅ OpenAI loaded');
    } else {
        console.log('⚠️  No OPENAI_API_KEY — AI Q&A disabled');
    }
} catch {
    console.log('⚠️  openai package not installed — AI Q&A disabled');
}

// ── Knowledge base ──────────────────────────────────────────────────────────

const KNOWLEDGE_PATH = path.join(__dirname, 'data', 'knowledge.json');
const DATA_DIR = path.join(__dirname, 'data');
const SEEDS_DIR = path.join(__dirname, 'seeds');

// First-mount volume seeder. Railway volumes mount empty on first attach and
// shadow files baked into the image at the mount path, so files committed
// under data/ would appear missing on the very first deploy. We keep an
// authoritative snapshot of knowledge.json under seeds/ (outside any mount
// path) and copy it in when the live file is missing. Idempotent and
// non-destructive — never overwrites an existing target. Other data files
// (suggestions/activity/feedback) already treat "missing" as empty, so they
// don't need seeding.
function seedDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
        catch (e) { console.error('❌ Could not create data dir:', e.message); return; }
    }
    if (!fs.existsSync(SEEDS_DIR)) return;
    const seedables = ['knowledge.json'];
    for (const filename of seedables) {
        const target = path.join(DATA_DIR, filename);
        const seed = path.join(SEEDS_DIR, filename);
        if (fs.existsSync(target)) continue;
        if (!fs.existsSync(seed)) continue;
        try {
            fs.copyFileSync(seed, target);
            const bytes = fs.statSync(target).size;
            console.log(`📦 Seeded ${filename} from seeds/ (${bytes} bytes) — first-mount volume hydration`);
        } catch (e) {
            console.error(`❌ Failed to seed ${filename}:`, e.message);
        }
    }
}

seedDataFiles();

let knowledge = loadKnowledge();

function loadKnowledge() {
    try {
        return JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
    } catch (e) {
        console.error('❌ Failed to load knowledge.json:', e.message);
        return { custom_facts: [] };
    }
}

function saveKnowledge() {
    try {
        fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(knowledge, null, 2));
    } catch (e) {
        console.error('❌ Failed to save knowledge.json:', e.message);
    }
}

function knowledgeAsText() {
    const sections = [];
    for (const [category, entries] of Object.entries(knowledge)) {
        if (category === 'custom_facts') {
            if (Array.isArray(entries) && entries.length > 0) {
                sections.push('ADDITIONAL FACTS:\n' + entries.map(f => `- ${f.text}`).join('\n'));
            }
            continue;
        }
        if (category === 'opinions') {
            if (Array.isArray(entries) && entries.length > 0) {
                sections.push('COMMUNITY OPINIONS (not verified — present these as player opinions, not confirmed facts):\n' + entries.map(o => `- ${o.text} (by ${o.added_by})`).join('\n'));
            }
            continue;
        }
        const lines = [];
        if (typeof entries === 'object' && entries !== null) {
            for (const [name, data] of Object.entries(entries)) {
                if (typeof data === 'string') {
                    lines.push(`${name}: ${data}`);
                } else if (typeof data === 'object' && data !== null) {
                    // Approved/vision entries store { text, added_by, added_at, source }.
                    // Prefer the human-readable .text so the AI sees clean prose
                    // instead of a JSON dump. Curated entries without .text
                    // (e.g. characters with skill_levels) still fall back to JSON.
                    if (typeof data.text === 'string' && data.text.length > 0) {
                        lines.push(`${name}: ${data.text}`);
                    } else {
                        lines.push(`${name}: ${JSON.stringify(data)}`);
                    }
                }
            }
        }
        if (lines.length) {
            sections.push(`${category.toUpperCase()}:\n${lines.join('\n')}`);
        }
    }
    return sections.join('\n\n');
}

function countFacts() {
    let count = 0;
    for (const [key, val] of Object.entries(knowledge)) {
        if (key === 'custom_facts' || key === 'opinions') {
            count += Array.isArray(val) ? val.length : 0;
        } else if (typeof val === 'object' && val !== null) {
            count += Object.keys(val).length;
        }
    }
    return count;
}

function getRandomFact() {
    const all = [];
    for (const [key, val] of Object.entries(knowledge)) {
        if (key === 'custom_facts' || key === 'opinions') {
            if (Array.isArray(val)) val.forEach(f => all.push(f.text));
        } else if (key === 'tips' && typeof val === 'object') {
            Object.values(val).forEach(t => all.push(t));
        } else if (typeof val === 'object') {
            for (const entry of Object.values(val)) {
                if (entry.note) all.push(entry.note);
                if (entry.description) all.push(entry.description);
            }
        }
    }
    return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

// ── Knowledge gap scanner ───────────────────────────────────────────────────

function findKnowledgeGaps() {
    const gaps = [];

    const emptyCategories = ['blessings', 'tips'];
    for (const cat of emptyCategories) {
        if (!knowledge[cat] || (typeof knowledge[cat] === 'object' && Object.keys(knowledge[cat]).length === 0)) {
            gaps.push({ type: 'empty_category', category: cat, label: cat.replace(/_/g, ' ') });
        }
    }

    if (knowledge.characters) {
        for (const [name, data] of Object.entries(knowledge.characters)) {
            if (!data.skill_levels || Object.keys(data.skill_levels).length < 4) {
                gaps.push({ type: 'incomplete_character', name, label: name.replace(/_/g, ' '), missing: 'skill levels' });
            }
            if (!data.stat_boost) {
                gaps.push({ type: 'incomplete_character', name, label: name.replace(/_/g, ' '), missing: 'stat boost' });
            }
        }
    }

    return gaps;
}

const dailyQuestionTemplates = {
    confused_wizard: [
        (gap) => `I've been staring at my notes for hours and I have absolutely nothing on **${gap.label}**. This is... concerning. Anyone want to help a wizard out? Head to <#${CONFIG.channels.archAi}> and use \`!suggest\`.`,
        (gap) => `So apparently I'm supposed to know about **${gap.label}**. I do not. I've checked twice. If anyone has intel, I'm all ears. Well, sensors. \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `I just realized I can't answer a single question about **${gap.label}**. I need a moment. Actually, I don't need a moment, I need *data*. \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
    ],
    casual_ask: [
        (gap) => `Quick one for the guild — anyone know much about **${gap.label}**? My memory's a little empty on that one. Drop what you know in <#${CONFIG.channels.archAi}> with \`!suggest\`.`,
        (gap) => `Hey guildmates, I could use some help on **${gap.label}**. Even the basics would go a long way. Hit me with a \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `If any of you happen to be experts on **${gap.label}**, now would be an excellent time to share. <#${CONFIG.channels.archAi}> → \`!suggest\`. I'll owe you one.`,
    ],
    movie_reference: [
        (gap) => `"With great power comes great responsibility." You know what else comes with it? Questions about **${gap.label}** that I can't answer yet. Help me out — \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `I've been trying to figure out **${gap.label}** on my own. It did not go well. As a wise man once said, "It's not my fault!" Actually, it is. Help me fix this — \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `"I'm not a smart man, but I know what **${gap.label}** is." Actually no. I don't. That's the problem. \`!suggest\` in <#${CONFIG.channels.archAi}> and educate this wizard.`,
    ],
    nerdy_deep_dive: [
        (gap) => `I've been running calculations on **${gap.label}** and I keep getting the same result: insufficient data. If you've done any testing or have firsthand experience, the guild could really use it. \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `Here's what I find fascinating — **${gap.label}** could completely change how builds work, but I don't have enough data to say for sure. Anyone willing to nerd out with me? <#${CONFIG.channels.archAi}>.`,
    ],
    deadpan_gandalf: [
        (gap) => `I have no memory of **${gap.label}**. And unlike a certain grey wizard, I can't just wander off and come back with the answer. I need the guild for this one. \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `Someone asked me about **${gap.label}** today. I stared at them in silence for what felt like an eternity. It was 0.3 seconds. But still. \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
        (gap) => `You know what keeps a cybernetic wizard up at night? The fact that my knowledge of **${gap.label}** is a void. An actual void. Help fill it — \`!suggest\` in <#${CONFIG.channels.archAi}>.`,
    ],
};

function getDailyQuestion() {
    const gaps = findKnowledgeGaps();
    if (!gaps.length) return null;

    const gap = gaps[Math.floor(Math.random() * gaps.length)];
    const categories = Object.keys(dailyQuestionTemplates);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = dailyQuestionTemplates[category];
    const template = templates[Math.floor(Math.random() * templates.length)];

    return template(gap);
}

// ── Feedback log ────────────────────────────────────────────────────────────

const FEEDBACK_PATH = path.join(__dirname, 'data', 'feedback.json');

function logFeedback(question, answer, emoji, username) {
    let log = [];
    try { log = JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf8')); } catch { /* new file */ }
    log.push({ question, answer: answer.substring(0, 200), emoji, username, timestamp: new Date().toISOString() });
    if (log.length > 500) log = log.slice(-500);
    try { fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(log, null, 2)); } catch { /* best effort */ }
}

// ── Suggestions system ──────────────────────────────────────────────────────

const SUGGESTIONS_PATH = path.join(__dirname, 'data', 'suggestions.json');
const suggestCooldown = new Map();
const SUGGEST_COOLDOWN_MS = 60 * 1000;
const SUGGEST_DAILY_MAX = 5;

function loadSuggestions() {
    try { return JSON.parse(fs.readFileSync(SUGGESTIONS_PATH, 'utf8')); } catch { return []; }
}

function saveSuggestions(suggestions) {
    try { fs.writeFileSync(SUGGESTIONS_PATH, JSON.stringify(suggestions, null, 2)); } catch { /* best effort */ }
}

// Generate the next suggestion ID. Always max(id) + 1 — never length + 1,
// because deletes/edits would otherwise cause ID collisions across the
// !suggest, vision-candidate, and sync-facts entry points.
function nextSuggestionId(suggestions) {
    if (!Array.isArray(suggestions) || suggestions.length === 0) return 1;
    return suggestions.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
}

function canSuggest(userId) {
    const now = Date.now();
    const tracker = suggestCooldown.get(userId) || { count: 0, firstAt: now, lastAt: 0 };
    if (now - tracker.lastAt < SUGGEST_COOLDOWN_MS) return { ok: false, reason: 'Please wait a minute between suggestions.' };
    if (now - tracker.firstAt > 24 * 60 * 60 * 1000) {
        tracker.count = 0;
        tracker.firstAt = now;
    }
    if (tracker.count >= SUGGEST_DAILY_MAX) return { ok: false, reason: `You've hit the daily limit (${SUGGEST_DAILY_MAX} suggestions). Try again tomorrow!` };
    return { ok: true, tracker };
}

function recordSuggestion(userId) {
    const now = Date.now();
    const tracker = suggestCooldown.get(userId) || { count: 0, firstAt: now, lastAt: 0 };
    tracker.count++;
    tracker.lastAt = now;
    suggestCooldown.set(userId, tracker);
}

// Parse !approve arg syntax:
//   !approve 5
//   !approve 5 runes
//   !approve 5 runes frostshard
//   !approve 5 | cleaned-up text
//   !approve 5 runes frostshard | cleaned-up text
// The pipe separator lets a moderator override the suggestion's text in place
// at approval time without needing a separate !edit step.
function parseApproveArgs(argText) {
    const sepIdx = argText.indexOf('|');
    const left = (sepIdx === -1 ? argText : argText.slice(0, sepIdx)).trim();
    const overrideRaw = sepIdx === -1 ? '' : argText.slice(sepIdx + 1).trim();
    const tokens = left.split(/\s+/).filter(Boolean);
    return {
        id: parseInt(tokens[0], 10),
        category: tokens[1] ? tokens[1].toLowerCase() : null,
        key: tokens[2] ? tokens[2].toLowerCase() : null,
        overrideText: overrideRaw.length > 0 ? overrideRaw : null,
    };
}

// Build a short snake_case key from free text. Used when an approver doesn't
// specify one and the vision pass didn't propose one either.
function autoKey(text, fallbackId) {
    const words = (text || '').toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(w));
    const slug = words.slice(0, 3).join('_').slice(0, 30);
    return slug || `note_${fallbackId}`;
}

// Apply an approved suggestion to the knowledge base in the right category.
// Returns { ok: true, locator } on success, { ok: false, error } on failure.
//
// Shape rules:
//   - custom_facts / opinions stay arrays of { text, added_by, added_at }.
//   - Structured top-level categories (weapons, runes, characters, ...) are
//     keyed objects. Approved entries are written as
//       { text, added_by, added_at, source }
//     so they share one shape regardless of origin (suggestion / vision /
//     addfact). Pre-existing curated entries (objects with skill_levels etc.)
//     remain valid — knowledgeAsText() prefers .text when present and falls
//     back to JSON-serializing the structured shape.
function applyApprovedToKnowledge({ category, key, text, by, suggestionId, source }) {
    const today = new Date().toISOString().split('T')[0];
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
        return { ok: false, error: `Unknown category \`${category}\`. Valid: ${[...KNOWLEDGE_CATEGORIES, 'custom_facts', 'opinions'].join(', ')}` };
    }
    if (!knowledge[category] || typeof knowledge[category] !== 'object' || Array.isArray(knowledge[category])) {
        knowledge[category] = {};
    }
    let finalKey = key || autoKey(text, suggestionId);
    if (Object.prototype.hasOwnProperty.call(knowledge[category], finalKey)) {
        // Collision: append a numeric suffix until free.
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

// ── Activity leveling system ────────────────────────────────────────────────

const ACTIVITY_PATH = path.join(__dirname, 'data', 'activity.json');
const ACTIVITY_COOLDOWN_MS = 60_000;

function loadActivity() {
    try { return JSON.parse(fs.readFileSync(ACTIVITY_PATH, 'utf8')); } catch { return {}; }
}

function saveActivity(data) {
    try { fs.writeFileSync(ACTIVITY_PATH, JSON.stringify(data, null, 2)); } catch { /* best effort */ }
}

function awardActivityPoint(userId, username) {
    const data = loadActivity();
    const now = Date.now();
    const entry = data[userId] || { points: 0, lastPointAt: 0, username };
    if (now - entry.lastPointAt < ACTIVITY_COOLDOWN_MS) return null;
    entry.points++;
    entry.lastPointAt = now;
    entry.username = username;
    data[userId] = entry;
    saveActivity(data);
    return entry.points;
}

async function checkActivityTierUpgrade(guild, userId, username, points) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    const tierDMs = {
        'Arch Tactician': {
            dm: `⚔️ **You've earned the rank of Arch Tactician!**\n\n` +
                `${username}, your activity in the strategy channels has been noticed. **${points} messages** of real discussion — that puts you above the crowd.\n\n` +
                `Keep contributing and you'll climb even higher. Next rank: **Arch Veteran** at 350 points.`,
            debug: `⚔️ **Activity tier: Arch Tactician**\nUser: **${username}** (${userId})\nActivity points: ${points}`,
        },
        'Arch Veteran': {
            dm: `🛡️ **${username}, you are now an Arch Veteran.**\n\n` +
                `**${points} messages** in the strategy channels. You're one of the most consistent contributors in this community. People are learning from what you share.\n\n` +
                `Next rank: **Arch Warlord** at 750 points. Keep going.`,
            debug: `🛡️ **Activity tier: Arch Veteran**\nUser: **${username}** (${userId})\nActivity points: ${points}`,
        },
        'Arch Warlord': {
            dm: `👑 **${username}, you've reached Arch Warlord.**\n\n` +
                `**${points} messages.** You are among the elite strategists in this community. Your knowledge and dedication are shaping how people play.\n\n` +
                `One more tier remains: **Arch Legend** at 1500 points. Only the most dedicated reach it.`,
            debug: `👑 **Activity tier: Arch Warlord**\nUser: **${username}** (${userId})\nActivity points: ${points}`,
        },
        'Arch Legend': {
            dm: `🌟 **${username}, you are now an Arch Legend.**\n\n` +
                `**${points} messages.** This is the highest activity rank in the community. There are no more tiers — you've reached the top.\n\n` +
                `You've been one of the most active and helpful voices in the strategy channels. The community is better because of you. Thank you.`,
            debug: `🌟 **Activity tier: Arch Legend** 🎉\nUser: **${username}** (${userId})\nActivity points: ${points}\n*Highest activity rank achieved.*`,
        },
    };

    for (const tier of CONFIG.activityTiers) {
        if (points >= tier.threshold && !member.roles.cache.some(r => r.name === tier.name)) {
            const role = guild.roles.cache.find(r => r.name === tier.name);
            if (!role) continue;
            await member.roles.add(role);
            const msgs = tierDMs[tier.name];
            if (msgs) {
                await sendToAdmin({ content: msgs.debug });
                try { await member.user.send(msgs.dm); } catch { /* DMs disabled */ }
            }
        }
    }
}

// ── Role helpers ────────────────────────────────────────────────────────────

function isOwner(member) {
    return process.env.OWNER_ID && member.id === process.env.OWNER_ID;
}

function isAdmin(member) {
    if (!member || !member.roles) return false;
    return member.roles.cache.some(r => r.name === 'XYIAN OFFICIAL' || r.name === 'Admin');
}

function isModerator(member) {
    if (!member || !member.roles) return false;
    return isAdmin(member) || member.roles.cache.some(r => r.name === 'Moderator');
}

function hasVerifiedRole(member) {
    if (!member || !member.roles) return false;
    const allowed = ['XYIAN OFFICIAL', 'XYIAN Guild Verified', 'Admin', 'Moderator', 'Server Booster'];
    return member.roles.cache.some(r => allowed.includes(r.name));
}

function hasAIAccess(member) {
    if (!member || !member.roles) return false;
    return hasVerifiedRole(member) || member.roles.cache.some(r =>
        CONFIG.roleTiers.some(t => t.name === r.name)
    );
}

// Vision (image attachments in #arch-ai) is gated tighter than text Q&A —
// only trusted contributors per CONFIG.visionTrustedRoleNames. Keeps the
// expensive multimodal calls out of reach for new / random members.
function hasVisionAccess(member) {
    if (!member || !member.roles) return false;
    return member.roles.cache.some(r =>
        CONFIG.visionTrustedRoleNames.includes(r.name)
    );
}

function getMemberTier(member) {
    if (!member || !member.roles) return null;
    for (let i = CONFIG.roleTiers.length - 1; i >= 0; i--) {
        if (member.roles.cache.some(r => r.name === CONFIG.roleTiers[i].name)) {
            return CONFIG.roleTiers[i];
        }
    }
    return null;
}

function canMemberDo(member, permission) {
    if (isAdmin(member)) return true;
    if (hasVerifiedRole(member)) return true;
    const tier = getMemberTier(member);
    return tier ? tier[permission] === true : false;
}

function getApprovedCountForUser(userId) {
    const suggestions = loadSuggestions();
    return suggestions.filter(s => s.status === 'approved' && s.userId === userId).length;
}

async function checkTierUpgrade(guild, userId, username) {
    const count = getApprovedCountForUser(userId);
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    const tierMessages = {
        'Arch Scholar': {
            dm: `🎓 **You've earned the rank of Arch Scholar.**\n\n` +
                `${username}, **${count} of your suggestions** have been reviewed, approved, and added to the bot's permanent knowledge. That's not nothing — that's real contributions that every player in this community benefits from.\n\n` +
                `You've gone from asking questions to shaping the answers. That's a big deal.\n\n` +
                `**What's new for you:**\n` +
                `• \`!addfact <text>\` — Add facts directly to the knowledge base\n` +
                `• \`!opinion <text>\` — Share gameplay opinions and theories\n` +
                `• \`!faq\` — View all knowledge categories\n` +
                `• \`!listfacts\` — Browse all custom facts\n` +
                `• \`!listopinions\` — Browse community opinions\n\n` +
                `And this isn't the end — at **15 approved suggestions**, you'll reach **Arch Sage**, the highest rank in the community. Keep going.`,
            debug: `🎓 **Tier upgrade: Arch Scholar**\nUser: **${username}** (${userId})\nApproved suggestions: ${count}\nNew access: !addfact, !opinion, !faq, !listfacts, !listopinions`,
        },
        'Arch Sage': {
            dm: `🧙 **${username}, you are now an Arch Sage.**\n\n` +
                `This is the highest rank a community member can achieve — and you earned it. **${count} approved suggestions.** Every single one made the bot smarter, more accurate, and more useful for players who will never even know your name but will benefit from what you built.\n\n` +
                `There are no more tiers. No more thresholds. You've reached the top.\n\n` +
                `From here, you have full access to manage the knowledge base:\n` +
                `• \`!addfact\` / \`!opinion\` — Add facts or opinions\n` +
                `• \`!removefact\` / \`!removeopinion\` — Remove incorrect info\n` +
                `• \`!listfacts\` / \`!listopinions\` / \`!faq\` — Full visibility into everything the bot knows\n\n` +
                `You're not just a contributor anymore — you're a guardian of this community's knowledge. We built this together, and it wouldn't be the same without you.\n\n` +
                `Thank you. Genuinely.`,
            debug: `🧙 **Tier upgrade: Arch Sage** 🎉\nUser: **${username}** (${userId})\nApproved suggestions: ${count}\nNew access: !removefact (full knowledge management)\n*Highest community rank achieved.*`,
        },
    };

    for (const tier of CONFIG.roleTiers) {
        if (tier.threshold === 0) continue;
        if (count >= tier.threshold && !member.roles.cache.some(r => r.name === tier.name)) {
            const role = guild.roles.cache.find(r => r.name === tier.name);
            if (!role) continue;
            await member.roles.add(role);

            const msgs = tierMessages[tier.name];
            if (msgs) {
                await sendToAdmin({ content: msgs.debug });
                try { await member.user.send(msgs.dm); } catch { /* DMs disabled */ }
            }
        }
    }
}

// ── Webhook senders (with stale-message cleanup) ────────────────────────────

// Track the last message ID we sent per channel so we can delete it if
// nobody else posted since then (keeps channels tidy).
const lastBotMessage = {
    general: null,  // message ID of last daily reset we sent
    recruit: null,  // message ID of last recruitment we sent
};

async function sendViaWebhook(webhookUrl, channelId, trackingKey, content) {
    if (!webhookUrl) return null;
    try {
        const wh = new WebhookClient({ url: webhookUrl });

        // Delete our previous message before sending so the channel stays tidy.
        // - recruit: always delete our last post so only one recruitment message is visible.
        // - general: only delete if we're still the latest (don't remove if users replied).
        if (trackingKey && lastBotMessage[trackingKey] && channelId && client.isReady()) {
            try {
                let shouldDelete = false;
                if (trackingKey === 'recruit') {
                    shouldDelete = true;
                } else {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                        const recent = await channel.messages.fetch({ limit: 1 });
                        const latest = recent.first();
                        if (latest && latest.id === lastBotMessage[trackingKey]) {
                            shouldDelete = true;
                        }
                    }
                }
                if (shouldDelete) {
                    await wh.deleteMessage(lastBotMessage[trackingKey]);
                    console.log(`🗑️ Deleted previous ${trackingKey} message ${lastBotMessage[trackingKey]}`);
                }
            } catch (e) {
                console.log(`⚠️  Could not clean old ${trackingKey} message: ${e.message}`);
            }
        }

        const sent = await wh.send({ ...content, wait: true });

        if (trackingKey && sent?.id) {
            lastBotMessage[trackingKey] = sent.id;
        }

        return sent;
    } catch (e) {
        console.error(`❌ sendViaWebhook(${trackingKey || 'admin'}) failed:`, e.message);
        return null;
    }
}

// Continuous debug-log forwarder: streams console errors/warnings to
// #debug-logs, deduped against the explicit sendToAdmin alerts below so the
// same event isn't posted twice. Sends via a direct webhook (never through the
// intercepted console) so a failing send can't feed itself.
const logForwarder = createLogForwarder({
    send: async (text) => {
        if (!webhooks.admin) return;
        const wh = new WebhookClient({ url: webhooks.admin });
        await wh.send({ content: text, allowedMentions: { parse: [] } });
    },
});

// Real stdout output is preserved for Railway's own logs; a filtered copy is
// captured for forwarding. attachConsole lives in the tested module.
function installConsoleForwarding() {
    attachConsole(logForwarder);
    logForwarder.start();
}

async function sendToAdmin(content) {
    // Record for dedup, but never let it block the actual alert.
    try { logForwarder.noteExplicitAlert(content); } catch { /* best effort */ }
    return sendViaWebhook(webhooks.admin, null, null, content);
}

async function sendToGeneral(content) {
    return sendViaWebhook(webhooks.general, CONFIG.channels.general, 'general', content);
}

async function sendToRecruit(content) {
    return sendViaWebhook(webhooks.recruit, CONFIG.channels.guildRecruit, 'recruit', content);
}

async function sendToChangelog(content) {
    if (!CONFIG.channels.changelog || !client.isReady()) return;
    try {
        const channel = await client.channels.fetch(CONFIG.channels.changelog);
        if (channel) await channel.send(content);
    } catch (e) {
        console.log(`⚠️  Could not post to changelog: ${e.message}`);
    }
}

// ── OpenAI Q&A (with per-user conversation memory) ──────────────────────────

const conversationHistory = new Map();
const CONTEXT_MAX_EXCHANGES = 3;
const CONTEXT_EXPIRY_MS = 10 * 60 * 1000;

function getUserContext(userId) {
    const entry = conversationHistory.get(userId);
    if (!entry) return [];
    if (Date.now() - entry.lastActive > CONTEXT_EXPIRY_MS) {
        conversationHistory.delete(userId);
        return [];
    }
    return entry.messages;
}

function storeExchange(userId, question, answer) {
    const entry = conversationHistory.get(userId) || { messages: [], lastActive: 0 };
    entry.messages.push(
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
    );
    while (entry.messages.length > CONTEXT_MAX_EXCHANGES * 2) {
        entry.messages.splice(0, 2);
    }
    entry.lastActive = Date.now();
    conversationHistory.set(userId, entry);
    if (conversationHistory.size > 200) {
        const oldest = conversationHistory.keys().next().value;
        conversationHistory.delete(oldest);
    }
}

async function askAI(question, username, userId) {
    if (!openai) return null;

    const systemPrompt =
        'You are Arch AI — a cybernetic wizard who serves as the knowledge keeper for the XYIAN guild in Archero 2. ' +
        'You are deeply knowledgeable, loyal to your guildmates, and genuinely passionate about helping them improve. ' +
        'Your tone is dry wit meets warmth — think Gandalf crossed with Robin Williams in Flubber. ' +
        'You can be funny, but it\'s subtle and smart, never forced. You take the game seriously but not yourself.\n\n' +
        'RULES:\n' +
        '- Answer using ONLY the verified facts below. Never guess or fabricate information.\n' +
        '- If your knowledge doesn\'t cover the question, admit it honestly with personality ' +
        '(e.g. "I\'ve searched every corner of my memory and came up empty. Someone help me out — use !suggest").\n' +
        '- Keep answers concise — under 1500 characters. Be helpful first, entertaining second.\n' +
        '- Always say "guild" never "clan".\n' +
        '- When you don\'t know something, nudge them toward !suggest to help fill the gap.\n' +
        '- You care about accuracy above all. Wrong info hurts the guild.\n' +
        '- The user may ask follow-up questions. Use the conversation history to understand context.\n' +
        '- When referencing community opinions, clearly note they are opinions from players, not verified facts.\n\n' +
        '--- VERIFIED FACTS ---\n' + knowledgeAsText();

    const priorContext = getUserContext(userId);

    try {
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...priorContext,
                { role: 'user', content: question },
            ],
            max_tokens: 600,
            temperature: 0.4,
        });
        const answer = res.choices[0]?.message?.content?.trim();
        if (answer && answer.length > 5) {
            storeExchange(userId, question, answer);
            return answer;
        }
        return null;
    } catch (e) {
        console.error('❌ OpenAI error:', e.message);
        await sendToAdmin({ content: `🚨 OpenAI error: ${e.message}` });
        const isRateLimit = e.status === 429 || e.message?.includes('rate') || e.message?.includes('quota') || e.message?.includes('billing');
        return isRateLimit ? '__RATE_LIMITED__' : null;
    }
}

// ── Vision Q&A (screenshots) ────────────────────────────────────────────────
// gpt-4o-mini is already multimodal — we hand it Discord's CDN image URLs
// alongside the text question. The vision pass also returns a structured
// CANDIDATES block of new facts the bot doesn't already know, which we route
// into the suggestions queue for admin review.
//
// Cost shape on gpt-4o-mini vision: ~10–50× a text-only call per request.
// Guardrails enforced here + at the messageCreate handler:
//   - CONFIG.features.visionMaxImages    (cap images per call)
//   - CONFIG.features.visionDetail       ('low' clamps each image to ~85 tokens)
//   - CONFIG.features.visionCooldownMs   (per-user cooldown between vision calls)
//   - hasVisionAccess(member)            (trusted-roles-only gate)

// Per-user cooldown timestamps for vision calls. Keyed by Discord user ID.
// In-memory only — resets on Railway redeploy, which is fine.
const visionCooldown = new Map();

// Returns 0 if the user can call vision now, or the remaining ms until they can.
function getVisionCooldownRemainingMs(userId) {
    const last = visionCooldown.get(userId);
    if (!last) return 0;
    const remaining = CONFIG.features.visionCooldownMs - (Date.now() - last);
    return remaining > 0 ? remaining : 0;
}

function stampVisionCooldown(userId) {
    visionCooldown.set(userId, Date.now());
    // Bound the map to avoid unbounded growth across many distinct users.
    if (visionCooldown.size > 500) {
        const oldest = visionCooldown.keys().next().value;
        visionCooldown.delete(oldest);
    }
}

// Whitelist of categories a vision candidate can be filed under. Matches the
// top-level keys in knowledge.json. Anything outside this list falls back to
// custom_facts on approval. opinions and custom_facts are excluded as proposal
// targets — those are special arrays, not categorical buckets.
const KNOWLEDGE_CATEGORIES = new Set([
    'star_system', 'resonance', 'characters', 'pvp_meta', 'skins', 'gold',
    'guild', 'gear_sets', 'weapons', 'runes', 'blessings', 'game_modes',
    'profile_experience', 'tips', 'skills', 'resources', 'privilege_cards',
    'sacred_hall', 'damage_terminology', 'collectibles',
]);

function knowledgeCategoryList() {
    return Array.from(KNOWLEDGE_CATEGORIES).join(', ');
}

// Best-effort parse of the trailing CANDIDATES JSON block emitted by the
// vision model. Returns { reply, candidates } where reply is the user-facing
// text with the block stripped, and candidates is a (possibly empty) array.
function splitVisionResponse(rawAnswer) {
    if (!rawAnswer) return { reply: rawAnswer, candidates: [] };
    // Look for an explicit delimiter the prompt asks the model to emit.
    const marker = /===\s*CANDIDATES\s*===\s*([\s\S]*)$/i;
    const match = rawAnswer.match(marker);
    if (!match) return { reply: rawAnswer.trim(), candidates: [] };
    const reply = rawAnswer.slice(0, match.index).trim();
    let jsonText = match[1].trim();
    // Strip ``` fences if the model wrapped the JSON in them.
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    let parsed = [];
    try {
        const obj = JSON.parse(jsonText);
        parsed = Array.isArray(obj) ? obj : (Array.isArray(obj?.candidates) ? obj.candidates : []);
    } catch {
        parsed = [];
    }
    // Sanitize: drop anything missing text, normalize fields.
    const cleaned = [];
    for (const c of parsed) {
        if (!c || typeof c !== 'object') continue;
        const text = (c.text || '').trim();
        if (text.length < 10) continue;
        const proposed_category = KNOWLEDGE_CATEGORIES.has(c.category) ? c.category : null;
        const proposed_key = (typeof c.key === 'string' && /^[a-z0-9_]{2,40}$/i.test(c.key.trim()))
            ? c.key.trim().toLowerCase()
            : null;
        const confidence = ['high', 'medium', 'low'].includes(c.confidence) ? c.confidence : 'medium';
        cleaned.push({ text, proposed_category, proposed_key, confidence });
    }
    return { reply, candidates: cleaned };
}

async function askAIWithVision(question, imageUrls, username, userId) {
    if (!openai) return { reply: null, candidates: [] };
    if (!imageUrls || imageUrls.length === 0) {
        const reply = await askAI(question, username, userId);
        return { reply, candidates: [] };
    }

    const visionPrompt =
        'You are Arch AI — a cybernetic wizard who serves as the knowledge keeper for the XYIAN guild in Archero 2. ' +
        'You are deeply knowledgeable, loyal to your guildmates, and genuinely passionate about helping them improve. ' +
        'Your tone is dry wit meets warmth — think Gandalf crossed with Robin Williams in Flubber. ' +
        'You can be funny, but it\'s subtle and smart, never forced. You take the game seriously but not yourself.\n\n' +
        'VISION MODE — the user has attached one or more Archero 2 screenshots. Carefully observe what is visible:\n' +
        '- Character / hero (name, level, stars/ascension, skin)\n' +
        '- Equipped gear (weapon, armor pieces, set bonuses, gear levels)\n' +
        '- Stats panel (ATK, HP, crit, damage modifiers, total power)\n' +
        '- Active runes, blessings, skills, sacred hall picks, resonance slots\n' +
        '- Currency, event progress, chapter/floor, PvP/peak-arena rank, leaderboard entries\n' +
        '- UI cues that reveal which menu, event, or game mode is being shown\n\n' +
        'RULES IN VISION MODE:\n' +
        '- Describing what you OBSERVE in the screenshot is fine — observation is not fabrication.\n' +
        '- For ADVICE about what you see (build recommendations, upgrade priority, meta tier, value calls), ' +
        'still ground that advice in the verified facts below. Do not invent meta opinions.\n' +
        '- If the user asked a specific question, answer it using the screenshot + verified facts together. ' +
        'If they posted only the image, give them an in-character rundown of what you see and offer to dig deeper.\n' +
        '- If something in the image is cropped, blurry, or you genuinely can\'t tell what it is, say so honestly.\n' +
        '- Keep your in-character reply under 1500 characters.\n' +
        '- Always say "guild" never "clan". When referencing community opinions, label them as opinions.\n' +
        '- The user may ask follow-up questions. Use the conversation history to understand context.\n\n' +
        'KNOWLEDGE-GROWTH PASS — after your in-character reply, add a CANDIDATES block listing concrete factual ' +
        'claims you observed in the screenshot that AREN\'T already covered by the verified facts below. ' +
        'These will go into a queue for admin review, NOT auto-added to the knowledge base.\n' +
        'STRICT RULES for candidates:\n' +
        '- Only universal Archero 2 facts. SKIP user-specific values: their roll on a piece of gear, their ' +
        'upgrade level, their owned counts, their personal currency, their leaderboard rank, their power level.\n' +
        '- Skip anything already present in the verified facts below.\n' +
        '- Skip ambiguous numbers, blurry text, or anything you\'re unsure about.\n' +
        '- Each candidate must be self-contained and intelligible without the screenshot.\n' +
        '- Propose a `category` from this list ONLY: ' + knowledgeCategoryList() + '. ' +
        'If none fit, omit the category field and it will land in custom_facts.\n' +
        '- Propose a short `key` (lowercase letters, digits, underscores; e.g. "frostshard_rune"). ' +
        'Used as the entry name within the category.\n' +
        '- Set `confidence` to "high", "medium", or "low" based on how clear the on-screen evidence is.\n' +
        '- If nothing new and clear is visible, output an empty array.\n\n' +
        'OUTPUT FORMAT — your response MUST end exactly like this (no commentary after):\n' +
        '<your in-character reply here>\n' +
        '=== CANDIDATES ===\n' +
        '```json\n' +
        '[{"text": "...", "category": "runes", "key": "frostshard_rune", "confidence": "high"}]\n' +
        '```\n\n' +
        '--- VERIFIED FACTS ---\n' + knowledgeAsText();

    const priorContext = getUserContext(userId);

    const userContent = [];
    const trimmedQuestion = (question || '').trim();
    userContent.push({
        type: 'text',
        text: trimmedQuestion
            ? trimmedQuestion
            : 'I shared a screenshot — tell me what you see and anything noteworthy about my setup.'
    });
    for (const url of imageUrls.slice(0, CONFIG.features.visionMaxImages)) {
        userContent.push({
            type: 'image_url',
            image_url: { url, detail: CONFIG.features.visionDetail },
        });
    }

    try {
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: visionPrompt },
                ...priorContext,
                { role: 'user', content: userContent },
            ],
            max_tokens: 1000,  // bumped from 700 to leave room for CANDIDATES block
            temperature: 0.4,
        });
        const raw = res.choices[0]?.message?.content?.trim();
        if (raw && raw.length > 5) {
            const { reply, candidates } = splitVisionResponse(raw);
            if (reply && reply.length > 5) {
                // Stash text-only summary into conversation history.
                const ctxQ = trimmedQuestion
                    ? `[shared a screenshot] ${trimmedQuestion}`
                    : '[shared a screenshot]';
                storeExchange(userId, ctxQ, reply);
                return { reply, candidates };
            }
        }
        return { reply: null, candidates: [] };
    } catch (e) {
        console.error('❌ OpenAI vision error:', e.message);
        await sendToAdmin({ content: `🚨 OpenAI vision error: ${e.message}` });
        const isRateLimit = e.status === 429 || e.message?.includes('rate') || e.message?.includes('quota') || e.message?.includes('billing');
        return { reply: isRateLimit ? '__RATE_LIMITED__' : null, candidates: [] };
    }
}

// Take vision-extracted candidates and append them to the suggestions queue.
// Each candidate becomes its own pending suggestion, marked source:'vision',
// with the screenshot URL stored for admin review.
function queueVisionCandidates(candidates, screenshotUrls, message) {
    if (!candidates || candidates.length === 0) return [];
    const suggestions = loadSuggestions();
    const queued = [];
    for (const c of candidates) {
        const entry = {
            id: nextSuggestionId(suggestions),
            text: c.text,
            by: message.author.username,
            userId: message.author.id,
            at: new Date().toISOString(),
            status: 'pending',
            source: 'vision',
            screenshot_url: screenshotUrls[0] || null,
            proposed_category: c.proposed_category || null,
            proposed_key: c.proposed_key || null,
            confidence: c.confidence || 'medium',
        };
        suggestions.push(entry);
        queued.push(entry);
    }
    saveSuggestions(suggestions);
    return queued;
}

// Filter Discord attachments down to just images we can hand to the vision API.
function extractImageUrls(message) {
    if (!message.attachments || message.attachments.size === 0) return [];
    const urls = [];
    for (const att of message.attachments.values()) {
        const looksImage =
            (att.contentType && att.contentType.startsWith('image/')) ||
            (att.name && /\.(png|jpe?g|gif|webp)$/i.test(att.name)) ||
            (att.url && /\.(png|jpe?g|gif|webp)(\?|$)/i.test(att.url));
        if (looksImage) urls.push(att.url);
    }
    return urls;
}

// ── Scheduled messages ──────────────────────────────────────────────────────

function setupDailyResetMessaging() {
    const schedule = () => {
        const now = new Date();
        // Target next 5:00 PM America/Los_Angeles. In PST that's 01:00 UTC (next day), in PDT that's 00:00 UTC.
        let next = null;
        for (const utcHour of [0, 1]) {
            const candidate = new Date(now);
            candidate.setUTCHours(utcHour, 0, 0, 0);
            if (candidate <= now) candidate.setUTCDate(candidate.getUTCDate() + 1);
            const laHour = candidate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', hour12: false });
            if (laHour === '17') {
                next = candidate;
                break;
            }
        }
        if (!next) next = new Date(now.getTime() + 60 * 60 * 1000); // fallback: 1 hour from now
        const ms = Math.max(0, next.getTime() - now.getTime());
        console.log(`⏰ Next daily reset: ${next.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} (5pm Pacific)`);
        setTimeout(() => { sendGeneralResetMessage(); schedule(); }, ms);
    };
    schedule();
    console.log('✅ Daily reset scheduled (5:00 PM Pacific Standard Time / 1:00 AM UTC)');
}

let resetLock = false;
async function sendGeneralResetMessage() {
    if (resetLock) return;
    resetLock = true;
    try {
        const embed = new EmbedBuilder()
            .setTitle('🔄 Daily Reset Reminder!')
            .setDescription(
                '**Daily reset is here! Complete your daily tasks before 5:00 PM Pacific Standard Time (1:00 AM UTC).**\n\n' +
                '✨ **What\'s new today:**\n' +
                '• Fresh daily quests with great rewards\n' +
                '• New challenges to conquer\n' +
                '• Another chance to improve your build\n' +
                '• More opportunities to earn gold and XP'
            )
            .addFields(
                {
                    name: '⚔️ Daily Guild Reminders',
                    value: '• **Guild Boss Battles** — Complete your 2 daily battles!\n• **Donations** — Help the guild grow stronger!\n• **Gold Rush** — Don\'t miss out on extra gold!',
                    inline: false,
                },
                {
                    name: '💪 Motivational Message',
                    value: 'Every reset is a chance to prove yourself! Stay focused, stay determined. 🏆',
                    inline: false,
                },
            );
        if (CONFIG.features.tipOfTheDay) {
            const tip = getRandomFact();
            if (tip) embed.addFields({ name: '💡 Arch AI Alpha — Tip of the Day', value: tip, inline: false });
        }
        const question = getDailyQuestion();
        if (question) {
            embed.addFields({ name: '🧙 Arch AI has a question...', value: question, inline: false });
        }
        embed.setColor(0x00ff88).setTimestamp().setFooter({ text: 'Arch 2 Addicts — Daily Reset' });
        const sent = await sendToGeneral({ embeds: [embed] });
        if (!sent) {
            // sendViaWebhook swallows webhook errors and returns null (e.g. a
            // rotated/deleted GENERAL_CHAT_WEBHOOK → 404). Surface it loudly
            // instead of logging a false success — this is what hid the outage.
            const reason = webhooks.general
                ? 'GENERAL_CHAT_WEBHOOK send returned null — webhook likely rotated/deleted. Verify Railway env matches a live #general webhook in Discord.'
                : 'GENERAL_CHAT_WEBHOOK is not set in the environment.';
            console.error(`❌ Daily reset NOT delivered: ${reason}`);
            await sendToAdmin({ content: `🚨 Daily reset NOT delivered to #general — ${reason}` });
            return;
        }
        console.log('✅ Daily reset message sent');
    } catch (e) {
        console.error('❌ Daily reset error:', e);
        await sendToAdmin({ content: `🚨 Daily reset failed: ${e.message}` });
    } finally {
        setTimeout(() => { resetLock = false; }, 5 * 60 * 1000);
    }
}

let recruitDayCounter = 0;
function setupDailyMessaging() {
    const dailyMs = 24 * 60 * 60 * 1000;
    setInterval(async () => {
        recruitDayCounter++;
        if (recruitDayCounter % 2 === 0) {
            await sendGuildRecruitment();
            console.log('✅ Guild recruitment sent');
        }
    }, dailyMs);
    console.log('✅ Guild recruit scheduled (every other day)');
}

async function sendGuildRecruitment() {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN OFFICIAL — Guild Recruitment')
        .setDescription(
            '**Guild ID: 213797**\n\n' +
            '**We\'re looking for dedicated players to join our elite community!**\n\n' +
            '✨ **What we offer:**\n• Active daily community\n• Expert strategies and guides\n• Guild events and challenges\n• 10% discount on guild shop items\n• Supportive and friendly environment\n\n' +
            '🎯 **Requirements:**\n• Daily participation in guild activities\n• 2 Boss Battles per day\n• 1 Guild Donation per day\n• Active in Discord community\n\n' +
            '💪 **Power Level:** 2M+ required\n\n**Ready to join the elite? Apply now!**'
        )
        .setColor(0xffa500)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL — Arch 2 Addicts' });
    await sendToRecruit({ embeds: [embed] });
}

// ── Weekly knowledge sync report ────────────────────────────────────────────
// Read-only: summarizes what the knowledge base gained this week and posts a
// digest + full-knowledge backup to #debug-logs (admin webhook). Never writes
// knowledge/suggestions — ingestion stays the job of scripts/sync-facts.js.

const SYNC_REPORT_PATH = path.join(__dirname, 'data', 'sync-report-state.json');

function loadSyncReportState() {
    try { return JSON.parse(fs.readFileSync(SYNC_REPORT_PATH, 'utf8')); } catch { return {}; }
}

function saveSyncReportState(data) {
    try { fs.writeFileSync(SYNC_REPORT_PATH, JSON.stringify(data, null, 2)); } catch { /* best effort */ }
}

// Collect every knowledge entry carrying an added_at date, from both the
// custom_facts/opinions arrays and the structured category objects.
function collectDatedFacts(kb) {
    const out = [];
    for (const val of Object.values(kb || {})) {
        if (Array.isArray(val)) {
            for (const e of val) if (e && typeof e === 'object' && e.added_at) out.push(e);
        } else if (val && typeof val === 'object') {
            for (const e of Object.values(val)) if (e && typeof e === 'object' && e.added_at) out.push(e);
        }
    }
    return out;
}

async function postWeeklyKnowledgeReport(force = false) {
    const now = new Date();
    const state = loadSyncReportState();

    // Don't post twice in the same week (guards redeploy re-arms / double fires).
    if (!force && state.lastWeeklyReportAt) {
        const daysSince = (now - new Date(state.lastWeeklyReportAt)) / 86_400_000;
        if (daysSince < 6) return;
    }

    const weekAgoDate = new Date(now.getTime() - 7 * 86_400_000).toISOString().split('T')[0]; // YYYY-MM-DD
    const weekAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();

    const dated = collectDatedFacts(knowledge);
    const newFacts = dated.filter(f => f.added_at && f.added_at >= weekAgoDate);

    const suggestions = loadSuggestions();
    const pending = suggestions.filter(s => s.status === 'pending');
    const approvedThisWeek = suggestions.filter(s => s.status === 'approved' && s.at && s.at >= weekAgoIso);

    // Nothing new and nothing waiting → skip quietly.
    if (!force && newFacts.length === 0 && pending.length === 0) {
        console.log('🧠 Weekly knowledge report skipped — nothing new this week');
        return;
    }

    const contribCounts = {};
    for (const f of newFacts) if (f.added_by) contribCounts[f.added_by] = (contribCounts[f.added_by] || 0) + 1;
    const topContribs = Object.entries(contribCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, n]) => `${name} (${n})`)
        .join(', ') || 'none';

    const embed = new EmbedBuilder()
        .setTitle('🧠 Weekly Knowledge Sync')
        .setColor(0x5865f2)
        .setDescription([
            `**New facts this week:** ${newFacts.length}`,
            `**Approved suggestions this week:** ${approvedThisWeek.length}`,
            `**Awaiting review:** ${pending.length}${pending.length > 0 ? ' — run `!suggestions` to review' : ''}`,
            `**Total dated facts:** ${dated.length}`,
            `**Contributors this week:** ${topContribs}`,
            '',
            'Full knowledge base attached as a dated backup.',
        ].join('\n'))
        .setTimestamp()
        .setFooter({ text: 'Automatic weekly knowledge sync' });

    const backup = {
        attachment: Buffer.from(JSON.stringify(knowledge, null, 2), 'utf8'),
        name: `knowledge-${now.toISOString().split('T')[0]}.json`,
    };

    // Post digest + backup; fall back to embed-only if the file send fails.
    let sent = await sendToAdmin({ embeds: [embed], files: [backup] });
    if (!sent) sent = await sendToAdmin({ embeds: [embed] });
    if (sent) {
        saveSyncReportState({ lastWeeklyReportAt: now.toISOString() });
        console.log(`🧠 Weekly knowledge report posted: ${newFacts.length} new, ${pending.length} pending`);
    } else {
        console.log('⚠️  Weekly knowledge report failed to send; will retry next run');
    }
}

// Next Sunday 10:00 AM America/Los_Angeles, DST-safe (probes the two UTC
// hours that map to LA 10:00). Mirrors setupDailyResetMessaging's approach.
function nextWeeklyReportTime(now) {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', weekday: 'short', hour: '2-digit', hour12: false,
    });
    for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
        for (const utcHour of [17, 18]) { // LA 10:00 = 17:00 UTC (PDT) or 18:00 UTC (PST)
            const c = new Date(now);
            c.setUTCDate(c.getUTCDate() + dayOffset);
            c.setUTCHours(utcHour, 0, 0, 0);
            if (c <= now) continue;
            const parts = fmt.formatToParts(c);
            const weekday = parts.find(p => p.type === 'weekday')?.value;
            const hour = parts.find(p => p.type === 'hour')?.value;
            if (weekday === 'Sun' && hour === '10') return c;
        }
    }
    return new Date(now.getTime() + 7 * 86_400_000); // fallback: 7 days out
}

function setupWeeklyKnowledgeReport() {
    const schedule = () => {
        const now = new Date();
        const next = nextWeeklyReportTime(now);
        const ms = Math.max(0, next.getTime() - now.getTime());
        console.log(`🧠 Next weekly knowledge report: ${next.toISOString()} (~${Math.round(ms / 3_600_000)}h)`);
        setTimeout(() => {
            postWeeklyKnowledgeReport().catch(e => console.log(`⚠️  Weekly report error: ${e.message}`));
            schedule();
        }, ms);
    };
    schedule();
}

// ── Discord client ──────────────────────────────────────────────────────────

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User],
});

// ── Reaction-role system ────────────────────────────────────────────────────

const reactionRoleMessages = new Set();
const welcomeDmMessages = new Map();

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    // ⚔️ Guild verification request via DM
    if (reaction.emoji.name === '⚔️' && welcomeDmMessages.has(reaction.message.id)) {
        const info = welcomeDmMessages.get(reaction.message.id);
        welcomeDmMessages.delete(reaction.message.id);
        try {
            await sendToAdmin({
                content: `⚔️ **Guild verification request**\n` +
                    `User: **${info.username}** (<@${info.userId}>)\n` +
                    `They reacted to their welcome DM — verify they're in XYIAN OFFICIAL and use \`!grant @user\` to assign the role.`,
            });
            await user.send('⚔️ Your guild verification request has been sent! An admin will review it shortly.');
        } catch (e) {
            console.error('❌ Guild verify request error:', e.message);
        }
        return;
    }

    if (reaction.emoji.name !== '🤖') return;
    if (!reactionRoleMessages.has(reaction.message.id)) return;

    try {
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const guild = reaction.message.guild;
        if (!guild) return;

        const roleName = CONFIG.reactionRole.roleName;
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            console.log(`⚠️  Role "${roleName}" not found — cannot assign via reaction`);
            return;
        }

        const member = await guild.members.fetch(user.id);
        if (member.roles.cache.has(role.id)) return;

        await member.roles.add(role);
        console.log(`🤖 Reaction-role: assigned "${roleName}" to ${user.username}`);

        await sendToAdmin({
            content: `🤖 **Reaction-role granted**\n` +
                `User: **${user.username}** (${user.id})\n` +
                `Role: **${roleName}**\n` +
                `Via: reaction on message ${reaction.message.id}`,
        });

        try {
            await user.send(
                `You've been given the **${roleName}** role! ` +
                `Head to <#${CONFIG.channels.archAi}> to start asking Archero 2 questions.`
            );
        } catch { /* DMs may be disabled */ }
    } catch (e) {
        console.error('❌ Reaction-role error:', e.message);
    }
});

// ── Welcome message ─────────────────────────────────────────────────────────
// Flow: (1) ArchAddict role, (2) public welcome in #general (required), (3) personal DM.
// Each step is isolated — a failure on one must not block the others.

const processedMembers = new Set();
client.on('guildMemberAdd', async (member) => {
    if (processedMembers.has(member.id)) return;
    processedMembers.add(member.id);
    if (processedMembers.size > 500) {
        processedMembers.delete(processedMembers.values().next().value);
    }

    try {
        // Auto-assign ArchAddict role on join
        const addictRole = member.guild.roles.cache.find(r => r.name === 'ArchAddict');
        if (addictRole && !member.roles.cache.has(addictRole.id)) {
            await member.roles.add(addictRole);
        }
    } catch (e) {
        console.error('❌ Welcome role error:', e.message);
        await sendToAdmin({ content: `⚠️ **Welcome role** — Failed to add ArchAddict for ${member.user.username} (${member.id}): ${e.message}` });
    }

    const emoji = CONFIG.reactionRole.emoji;
    const roleName = CONFIG.reactionRole.roleName;
    const embed = new EmbedBuilder()
        .setTitle(`Welcome to Arch 2 Addicts, ${member.user.username}!`)
        .setDescription(
            `Hey ${member}! Glad to have you here.\n\n` +
            '**Where to go:**\n' +
            '💬 <#1425322796820725760> — **Start here!** cross-server day-to-day chat\n' +
            `🤖 <#1424785709914521701> — AI-powered Q&A for Archero 2\n` +
            '🎬 <#1419944149410648116> — Share your best clips and highlights\n\n' +
            `**${emoji} Want AI access?**\n` +
            `React with ${emoji} on this message to get the **${roleName}** role and start asking Archero 2 questions in <#${CONFIG.channels.archAi}>!\n\n` +
            '**About XYIAN OFFICIAL (Guild ID: 213797):**\n' +
            'We\'re an active Archero 2 guild — daily activity and 2M+ power required.'
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x00ff88)
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts — React 🤖 for AI access!' });

    try {
        const welcomeMsg = await sendToGeneral({ embeds: [embed] });
        if (welcomeMsg?.id) {
            reactionRoleMessages.add(welcomeMsg.id);
            const channel = CONFIG.channels.general ? await client.channels.fetch(CONFIG.channels.general).catch(() => null) : null;
            if (channel) {
                try {
                    const fetched = await channel.messages.fetch(welcomeMsg.id);
                    await fetched.react(emoji);
                } catch (reactErr) {
                    await sendToAdmin({ content: `⚠️ **Welcome react** — Could not add ${emoji} to welcome msg for ${member.user.username}: ${reactErr.message}` });
                }
            }
            await sendToAdmin({ content: `👋 **Welcome #general** — <@${member.id}> (${member.user.username}) — msg \`${welcomeMsg.id}\`` });
        } else {
            await sendToAdmin({
                content: `❌ **Welcome #general failed** — No message sent for <@${member.id}> (${member.user.username}). ` +
                    `Webhook or send returned null. Check GENERAL_CHAT_WEBHOOK and bot logs.`,
            });
        }
    } catch (e) {
        console.error('❌ Welcome #general error:', e.message);
        await sendToAdmin({
            content: `❌ **Welcome #general error** — <@${member.id}> (${member.user.username}): ${e.message}`,
        });
    }

    // Personal welcome DM
    const dmEmbed = new EmbedBuilder()
            .setTitle(`Welcome to Arch 2 Addicts!`)
            .setDescription(
                `Hey ${member.user.username}, thanks for joining — seriously. This community is small but it's full of people who genuinely help each other out, and that's what makes it special.\n\n` +
                `We're building something here that doesn't really exist for Archero 2 — a real, accurate knowledge base powered by the players themselves. No outdated wikis, no scattered info, no guesswork. Every fact in the bot was verified by someone in this community. And we'd love your help making it even better.\n\n` +
                '**Where to hang out:**\n' +
                '💬 <#1425322796820725760> — cross-server, jump in anytime\n' +
                '🤖 <#1424785709914521701> — **Community AI discussion** (get AI access here)\n' +
                '🎬 <#1419944149410648116> — Clips and highlights\n\n' +
                `**Getting AI access:**\n` +
                `Go to **<#1424785709914521701>** (community AI discussion) and react with ${emoji} on the message there to get the **${roleName}** role. Once you have it, head to <#${CONFIG.channels.archAi}> and ask any Archero 2 question — no command needed.\n\n` +
                '**Role tiers — contribute and level up:**\n' +
                `🤖 **AI Enabled** — Get it by reacting in <#1424785709914521701>. Then ask questions + \`!suggest\`\n` +
                '🎓 **Arch Scholar** (5 approved suggestions) — Unlock `!addfact`, `!opinion`, `!faq`, `!listfacts`, `!listopinions`\n' +
                '🧙 **Arch Sage** (15 approved suggestions) — Unlock `!removefact`, `!removeopinion`\n\n' +
                '**Useful commands:**\n' +
                '`!suggest <text>` — Submit a correction or new info\n' +
                '`!help` — Full command list\n' +
                '`!contributors` — See top contributors\n\n' +
                '⚔️ **Already in XYIAN OFFICIAL?**\n' +
                'React with ⚔️ on this message to request **guild verification**. An admin will confirm and get you set up.\n\n' +
                '*Thank you in advance for being here. Whether you ask a question, drop a suggestion, or just hang out — you\'re making this community better.*'
            )
            .setColor(0x5a017a)
            .setFooter({ text: 'Arch 2 Addicts — Built by the community, for the community' });
    try {
        const dmMsg = await member.user.send({ embeds: [dmEmbed] });
        await dmMsg.react('⚔️');
        welcomeDmMessages.set(dmMsg.id, { userId: member.id, username: member.user.username });
        if (welcomeDmMessages.size > 500) {
            const oldest = welcomeDmMessages.keys().next().value;
            welcomeDmMessages.delete(oldest);
        }
    } catch { /* DMs disabled */ }
});

// ── Message handler ─────────────────────────────────────────────────────────

const spamTracker = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Activity XP: award a point for non-command messages in strategy channels
    if (message.guild && CONFIG.activityChannelIds.has(message.channel.id) && !message.content.startsWith('!')) {
        const newPoints = awardActivityPoint(message.author.id, message.author.username);
        if (newPoints !== null) {
            await checkActivityTierUpgrade(message.guild, message.author.id, message.author.username, newPoints);
        }
    }

    const isCommand = message.content.startsWith('!');
    const isDM = message.channel.type === 1;
    const isAIChannel = message.channel.id === CONFIG.channels.archAi;

    // Ignore recruit channels entirely
    if (message.channel.id === CONFIG.channels.guildRecruit) return;
    if (message.channel.name && message.channel.name.toLowerCase().includes('recruit')) return;

    // General chat: only !help and !menu
    if (message.channel.name && (CONFIG.generalChatNames.includes(message.channel.name) || message.channel.name.toLowerCase().includes('general'))) {
        if (!isCommand || (!message.content.startsWith('!help') && !message.content.startsWith('!menu') && !message.content.startsWith('!ping'))) {
            return;
        }
    }

    // Outside arch-ai / DMs: only respond to commands
    if (!isAIChannel && !isDM && !isCommand) return;

    // ── Commands ──

    if (isCommand) {
        const rest = message.content.slice(1).trim();
        const spaceIdx = rest.indexOf(' ');
        const cmd = (spaceIdx === -1 ? rest : rest.slice(0, spaceIdx)).toLowerCase();
        const argText = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1).trim();

        switch (cmd) {
            case 'ping':
                return message.reply(`🏓 Pong! v${BOT_VERSION} — ${countFacts()} facts loaded`);

            case 'help':
            case 'menu': {
                const embed = new EmbedBuilder()
                    .setTitle('🤖 XYIAN Bot — Commands')
                    .setDescription(
                        '**Everyone:**\n' +
                        '`!ping` — Bot status\n' +
                        '`!help` / `!menu` — This message\n' +
                        '`!contributors` — Leaderboard of top contributors\n' +
                        '`!rank` / `!level` — Check your activity rank and progress\n' +
                        '`!leaderboard` / `!lb` — Top 10 strategy channel contributors\n\n' +
                        '**🤖 AI Enabled** (in **#arch-ai**):\n' +
                        'Just type your Archero 2 question — no command needed!\n' +
                        '📸 *Screenshot Q&A:* limited to **XYIAN OFFICIAL · Admin · Moderator · Arch Legend** (cooldown applies). Everyone else, ask in text.\n' +
                        '`!suggest <text>` — Suggest a correction or new info\n\n' +
                        '**🎓 Arch Scholar** (5 approved suggestions):\n' +
                        '`!addfact <text>` — Add a fact to the knowledge base\n' +
                        '`!opinion <text>` — Share a gameplay opinion or theory\n' +
                        '`!faq` — View knowledge categories\n' +
                        '`!listfacts` — Browse custom facts\n' +
                        '`!listopinions` — Browse community opinions\n\n' +
                        '**🧙 Arch Sage** (15 approved suggestions):\n' +
                        '`!removefact <number>` — Remove a custom fact\n' +
                        '`!removeopinion <number>` — Remove an opinion\n\n' +
                        '**Moderator+:**\n' +
                        '`!suggestions` — Review pending suggestions (📸 = vision-extracted)\n' +
                        '`!edit <#> <text>` — Fix typos / clean OCR errors before approval\n' +
                        '`!approve <#> [category] [key] [| override]` — Approve into the right knowledge category\n' +
                        '`!reject <#> [reason]` — Reject a suggestion\n' +
                        '`!grant @user` — Manually assign a role\n\n' +
                        '**XYIAN OFFICIAL / Admin:**\n' +
                        '`!setupreaction` — Post a reaction-role message\n' +
                        '`!recruit` — Send guild recruitment now\n' +
                        '`!post-guild-requirements` — Post guild requirements embed\n' +
                        '`!reset` — Send daily reset now\n\n' +
                        '**Owner only:**\n' +
                        '`!ai status` / `!ai on` / `!ai off` — Master kill switch for the OpenAI Q&A in #arch-ai\n' +
                        '`!post-changelog [x.y.z]` — Manually post a CHANGELOG entry to #changelog (omit version for current)'
                    )
                    .setColor(0x9b59b6).setTimestamp().setFooter({ text: 'XYIAN Bot' });
                return message.reply({ embeds: [embed] });
            }

            case 'faq': {
                if (!canMemberDo(message.member, 'canListFacts') && !isDM) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to use this command. Earn it by getting 5 suggestions approved!');
                }
                const categories = Object.keys(knowledge).filter(k => k !== 'custom_facts' && k !== 'opinions');
                const list = categories.map(c => `• **${c.replace(/_/g, ' ')}** (${typeof knowledge[c] === 'object' ? Object.keys(knowledge[c]).length : 1} entries)`).join('\n');
                const factsCount = (knowledge.custom_facts || []).length;
                const opinionsCount = (knowledge.opinions || []).length;
                const embed = new EmbedBuilder()
                    .setTitle('📚 FAQ — What can I answer?')
                    .setDescription(`I know about these topics:\n\n${list}\n\nPlus **${factsCount} custom facts** and **${opinionsCount} community opinions**.\n\nJust ask your question in **#arch-ai**!`)
                    .setColor(0x00bfff).setTimestamp().setFooter({ text: 'XYIAN Bot' });
                return message.reply({ embeds: [embed] });
            }

            case 'contributors': {
                const allSuggestions = loadSuggestions();
                const approved = allSuggestions.filter(s => s.status === 'approved');
                if (!approved.length) return message.reply('No approved contributions yet. Be the first — use `!suggest`!');
                const counts = {};
                approved.forEach(s => {
                    const key = s.by || 'Unknown';
                    counts[key] = (counts[key] || 0) + 1;
                });
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const medals = ['🥇', '🥈', '🥉'];
                const leaderboard = sorted.map(([name, count], i) => {
                    const medal = medals[i] || `**${i + 1}.**`;
                    const tierLabel = count >= 15 ? ' 🧙 Sage' : count >= 5 ? ' 🎓 Scholar' : '';
                    return `${medal} **${name}** — ${count} approved${tierLabel}`;
                }).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle('🏆 Top Contributors')
                    .setDescription(leaderboard + '\n\n*Get 5 approved suggestions → **Arch Scholar**\nGet 15 approved suggestions → **Arch Sage***')
                    .setColor(0xf39c12).setTimestamp().setFooter({ text: 'XYIAN Bot — !suggest to contribute' });
                return message.reply({ embeds: [embed] });
            }

            case 'rank':
            case 'level': {
                const targetUser = message.mentions.users.first() || message.author;
                const activity = loadActivity();
                const entry = activity[targetUser.id];
                const pts = entry ? entry.points : 0;

                let currentTier = 'ArchAddict';
                let currentColor = 0x808080;
                let nextTier = CONFIG.activityTiers[0];
                for (const tier of CONFIG.activityTiers) {
                    if (pts >= tier.threshold) {
                        currentTier = tier.name;
                        currentColor = tier.color;
                        nextTier = CONFIG.activityTiers[CONFIG.activityTiers.indexOf(tier) + 1] || null;
                    }
                }

                let progressLine;
                if (!nextTier) {
                    progressLine = '██████████ MAX — You\'ve reached the highest rank!';
                } else {
                    const prevThreshold = CONFIG.activityTiers.find(t => t.name === currentTier)?.threshold || 0;
                    const range = nextTier.threshold - prevThreshold;
                    const progress = pts - prevThreshold;
                    const filled = Math.floor((progress / range) * 10);
                    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
                    progressLine = `${bar} ${pts}/${nextTier.threshold} → next: **${nextTier.name}** (${nextTier.threshold - pts} to go)`;
                }

                const rankEmbed = new EmbedBuilder()
                    .setTitle(`🏅 ${targetUser.username} — ${currentTier}`)
                    .setDescription(`**${pts}** activity points\n\n${progressLine}`)
                    .setColor(currentColor)
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot — Earn points by chatting in strategy channels' });
                return message.reply({ embeds: [rankEmbed] });
            }

            case 'leaderboard':
            case 'lb': {
                const activity = loadActivity();
                const sorted = Object.entries(activity)
                    .sort(([, a], [, b]) => b.points - a.points)
                    .slice(0, 10);

                if (!sorted.length) return message.reply('No activity recorded yet. Start chatting in the strategy channels!');

                const medals = ['🥇', '🥈', '🥉'];
                const lines = sorted.map(([, entry], i) => {
                    const medal = medals[i] || `**${i + 1}.**`;
                    let tierLabel = '';
                    for (const tier of CONFIG.activityTiers) {
                        if (entry.points >= tier.threshold) tierLabel = ` ${tier.name}`;
                    }
                    if (!tierLabel) tierLabel = ' ArchAddict';
                    return `${medal} **${entry.username}** — ${entry.points} pts (${tierLabel.trim()})`;
                }).join('\n');

                const lbEmbed = new EmbedBuilder()
                    .setTitle('🏆 Strategy Activity Leaderboard')
                    .setDescription(lines + '\n\n*Earn points by posting in strategy channels (1 pt/min cooldown)*')
                    .setColor(0x00FFFF)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot — !rank to check your own progress' });
                return message.reply({ embeds: [lbEmbed] });
            }

            case 'listfacts': {
                if (!canMemberDo(message.member, 'canListFacts') && !isDM) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to use this command. Earn it by getting 5 suggestions approved!');
                }
                const facts = knowledge.custom_facts || [];
                if (!facts.length) {
                    return message.reply('No entries in the **custom facts** queue right now — most knowledge lives in categories (weapons, runes, guild, gold, etc.). Try `!faq` for the full topic list. Use `!addfact <text>` for facts or `!opinion <text>` for gameplay theories.');
                }
                const list = facts.map((f, i) => `**${i + 1}.** ${f.text}`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle(`📋 Custom Facts (${facts.length})`)
                    .setDescription(list.length > 4000 ? list.slice(0, 4000) + '\n...' : list)
                    .setColor(0x00bfff).setTimestamp().setFooter({ text: 'XYIAN Bot' });
                return message.reply({ embeds: [embed] });
            }

            case 'addfact': {
                if (!canMemberDo(message.member, 'canAddFact')) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to add facts. Earn it by getting 5 suggestions approved!');
                }
                if (!argText || argText.length < 10) {
                    return message.reply('Usage: `!addfact <fact text>` (at least 10 characters)');
                }
                if (!knowledge.custom_facts) knowledge.custom_facts = [];
                knowledge.custom_facts.push({
                    text: argText,
                    added_by: message.author.username,
                    added_at: new Date().toISOString().split('T')[0],
                });
                saveKnowledge();
                return message.reply(`✅ Fact added! I now know **${countFacts()}** facts total.`);
            }

            case 'removefact': {
                if (!canMemberDo(message.member, 'canRemoveFact')) {
                    return message.reply('❌ You need the **Arch Sage** role to remove facts. Earn it by getting 15 suggestions approved!');
                }
                const idx = parseInt(argText, 10);
                const facts = knowledge.custom_facts || [];
                if (isNaN(idx) || idx < 1 || idx > facts.length) {
                    return message.reply(`Usage: \`!removefact <number>\` (1–${facts.length}). Use \`!listfacts\` to see them.`);
                }
                const removed = facts.splice(idx - 1, 1)[0];
                saveKnowledge();
                return message.reply(`🗑️ Removed fact #${idx}: "${removed.text.substring(0, 80)}..."\n**${countFacts()}** facts remaining.`);
            }

            case 'opinion': {
                if (!canMemberDo(message.member, 'canAddOpinion')) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to share opinions. Earn it by getting 5 suggestions approved!');
                }
                if (!argText || argText.length < 10) {
                    return message.reply('Usage: `!opinion <your take>` (at least 10 characters). Opinions are gameplay theories or preferences — things that might help others but aren\'t fully confirmed.');
                }
                if (!knowledge.opinions) knowledge.opinions = [];
                knowledge.opinions.push({
                    text: argText,
                    added_by: message.author.username,
                    added_at: new Date().toISOString().split('T')[0],
                });
                saveKnowledge();
                return message.reply(`💬 Opinion logged! The community now has **${(knowledge.opinions || []).length}** opinions on file.`);
            }

            case 'listopinions': {
                if (!canMemberDo(message.member, 'canListFacts') && !isDM) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to use this command. Earn it by getting 5 suggestions approved!');
                }
                const opinions = knowledge.opinions || [];
                if (!opinions.length) {
                    return message.reply('No community opinions yet. Be the first — use `!opinion <your take>` to share a gameplay theory or preference!');
                }
                const opList = opinions.map((o, i) => `**${i + 1}.** ${o.text} *(${o.added_by})*`).join('\n');
                const opEmbed = new EmbedBuilder()
                    .setTitle('💬 Community Opinions')
                    .setDescription(`These are player opinions and theories — not verified facts.\n\n${opList}`)
                    .setColor(0xf39c12).setTimestamp().setFooter({ text: 'XYIAN Bot — opinions are not verified' });
                return message.reply({ embeds: [opEmbed] });
            }

            case 'removeopinion': {
                if (!canMemberDo(message.member, 'canRemoveFact')) {
                    return message.reply('❌ You need the **Arch Sage** role to remove opinions. Earn it by getting 15 suggestions approved!');
                }
                const opIdx = parseInt(argText, 10);
                const opinions = knowledge.opinions || [];
                if (isNaN(opIdx) || opIdx < 1 || opIdx > opinions.length) {
                    return message.reply(`Usage: \`!removeopinion <number>\` (1–${opinions.length}). Use \`!listopinions\` to see them.`);
                }
                const removedOp = opinions.splice(opIdx - 1, 1)[0];
                saveKnowledge();
                return message.reply(`🗑️ Removed opinion #${opIdx}: "${removedOp.text.substring(0, 80)}..."\n**${opinions.length}** opinions remaining.`);
            }

            case 'recruit': {
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
                }
                await sendGuildRecruitment();
                return message.reply('🏰 Guild recruitment sent!');
            }

            case 'post-guild-requirements': {
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
                }
                const reqEmbed = new EmbedBuilder()
                    .setTitle('🏰 XYIAN OFFICIAL — Guild Requirements')
                    .setDescription('**Requirements for active members (Guild ID: 213797)**')
                    .addFields(
                        { name: '💪 Power Level', value: '**2M+ required**\n• Minimum power to join and stay active', inline: false },
                        { name: '⚔️ Daily Boss Battles', value: '**2 per day**\n• Required for active status\n• Tracked automatically', inline: false },
                        { name: '💰 Guild Donations', value: '**1 per day**\n• First donation of the day is free\n• Next 4 cost 20 → 40 → 60 → 80 gems (200 gems total if all 5)\n• Tracked automatically', inline: false },
                        { name: '📊 Activity', value: '**Daily participation in Discord**\n• Inactive players may be removed\n• Exceptions for valid reasons', inline: false }
                    )
                    .setColor(0xFFD700)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN OFFICIAL — Arch 2 Addicts' });
                await message.channel.send({ embeds: [reqEmbed] });
                return message.reply('✅ Guild requirements embed posted. You can delete the old message and this reply.');
            }

            case 'reset': {
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
                }
                await sendGeneralResetMessage();
                return message.reply('🔄 Daily reset message sent!');
            }

            case 'ai': {
                // Owner-only kill switch for the OpenAI-backed Q&A in #arch-ai.
                // Toggles CONFIG.features.aiEnabled in-memory; resets to true on
                // every Railway redeploy by design (the source of truth is code,
                // not state). Use `!ai status` to verify before/after toggling.
                if (!isOwner(message.author)) {
                    return message.reply('❌ This command is owner-only.');
                }
                const sub = (argText || 'status').trim().toLowerCase();
                const fmtBool = b => b ? '✅ on' : '❌ off';
                if (sub === 'status') {
                    const cooldownActive = visionCooldown.size;
                    const lines = [
                        '🤖 **AI subsystem status**',
                        `• AI Q&A: ${fmtBool(CONFIG.features.aiEnabled)}`,
                        `• Vision: ${fmtBool(CONFIG.features.visionEnabled)} (max ${CONFIG.features.visionMaxImages} img, detail \`${CONFIG.features.visionDetail}\`, ${CONFIG.features.visionCooldownMs / 1000}s cooldown)`,
                        `• OpenAI key: ${openai ? '✅ loaded' : '❌ missing'}`,
                        `• Users currently in vision cooldown: ${cooldownActive}`,
                        '',
                        '_Use_ `!ai on` _or_ `!ai off` _to toggle the master switch._',
                    ];
                    return message.reply(lines.join('\n'));
                }
                if (sub === 'on') {
                    CONFIG.features.aiEnabled = true;
                    await sendToAdmin({
                        content: `🤖 **AI Q&A enabled** by ${message.author.username} via \`!ai on\`.`,
                    });
                    return message.reply('🤖 AI Q&A is now **on**. Try `!ai status` to confirm.');
                }
                if (sub === 'off') {
                    CONFIG.features.aiEnabled = false;
                    await sendToAdmin({
                        content: `🤖 **AI Q&A disabled** by ${message.author.username} via \`!ai off\`. Users in #arch-ai will see the offline embed.`,
                    });
                    return message.reply('🤖 AI Q&A is now **off**. `#arch-ai` will reply with an offline notice. Re-enable with `!ai on`.');
                }
                return message.reply('Usage: `!ai status` · `!ai on` · `!ai off` (owner only)');
            }

            case 'post-changelog':
            case 'postchangelog': {
                // Owner-only manual changelog post. Used to backfill releases
                // whose automatic startup post failed (e.g. v3.12.0 blew the
                // 4096-char embed limit). Argument is the semver string, or
                // omitted to post the latest entry from CHANGELOG.md.
                if (!isOwner(message.author)) {
                    return message.reply('❌ This command is owner-only.');
                }
                if (!CONFIG.channels.changelog) {
                    return message.reply('❌ No changelog channel configured.');
                }
                const targetVersion = (argText || '').trim() || BOT_VERSION;
                if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
                    return message.reply('Usage: `!post-changelog [x.y.z]` — version must be `major.minor.patch`. Omit to post the current version.');
                }
                const lines = getChangelogLinesForVersion(targetVersion);
                if (!lines || lines.length === 0) {
                    return message.reply(`❌ No CHANGELOG entries found for v${targetVersion}.`);
                }
                try {
                    const channel = await client.channels.fetch(CONFIG.channels.changelog);
                    const embedCount = await postChangelogToChannel(channel, targetVersion, lines);
                    await sendToAdmin({
                        content: `📋 **Manual changelog post** by ${message.author.username}: v${targetVersion} (${lines.length} bullet${lines.length === 1 ? '' : 's'}, ${embedCount} embed${embedCount === 1 ? '' : 's'}).`,
                    });
                    return message.reply(`✅ Posted v${targetVersion} to <#${CONFIG.channels.changelog}> (${embedCount} embed${embedCount === 1 ? '' : 's'}).`);
                } catch (e) {
                    return message.reply(`❌ Post failed: ${e.message}`);
                }
            }

            case 'suggest': {
                if (!hasAIAccess(message.member)) {
                    return message.reply('❌ You need the **AI Enabled** role or a verified guild role to use this.');
                }
                if (!argText || argText.length < 10) {
                    return message.reply('Usage: `!suggest <your correction or suggestion>` (at least 10 characters)');
                }
                const check = canSuggest(message.author.id);
                if (!check.ok) return message.reply(`⏳ ${check.reason}`);
                const suggestions = loadSuggestions();
                suggestions.push({
                    id: nextSuggestionId(suggestions),
                    text: argText,
                    by: message.author.username,
                    userId: message.author.id,
                    at: new Date().toISOString(),
                    status: 'pending',
                });
                saveSuggestions(suggestions);
                recordSuggestion(message.author.id);
                await sendToAdmin({ content: `💡 **New suggestion** from ${message.author.username}:\n> ${argText.substring(0, 500)}` });
                return message.reply('💡 Thanks! Your suggestion has been submitted for admin review.');
            }

            case 'suggestions': {
                if (!isModerator(message.member)) {
                    return message.reply('❌ This command requires the **Moderator**, **XYIAN OFFICIAL**, or **Admin** role.');
                }
                const all = loadSuggestions();
                const pending = all.filter(s => s.status === 'pending');
                if (!pending.length) return message.reply('📭 No pending suggestions!');
                const list = pending.slice(-15).map(s => {
                    const badges = [];
                    if (s.source === 'vision') badges.push('📸');
                    if (s.confidence) badges.push(s.confidence);
                    if (s.proposed_category) badges.push(`→ ${s.proposed_category}${s.proposed_key ? '.' + s.proposed_key : ''}`);
                    if (s.edited_by) badges.push(`✏️ edited by ${s.edited_by}`);
                    const badgeStr = badges.length ? ` [${badges.join(' · ')}]` : '';
                    const screenshot = s.screenshot_url ? ' 🖼️' : '';
                    return `**#${s.id}**${badgeStr} (${s.by})${screenshot} — ${s.text.substring(0, 100)}${s.text.length > 100 ? '...' : ''}`;
                }).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle(`💡 Pending Suggestions (${pending.length})`)
                    .setDescription(list)
                    .setColor(0xffa500).setTimestamp()
                    .setFooter({ text: '!approve <#> [category] [key] [| override] · !edit <#> <text> · !reject <#> [reason]' });
                return message.reply({ embeds: [embed] });
            }

            case 'edit': {
                if (!isModerator(message.member)) {
                    return message.reply('❌ This command requires the **Moderator**, **XYIAN OFFICIAL**, or **Admin** role.');
                }
                const editParts = argText.split(/\s+/);
                const editId = parseInt(editParts[0], 10);
                const newText = editParts.slice(1).join(' ').trim();
                if (!editId || !newText || newText.length < 10) {
                    return message.reply('Usage: `!edit <#> <new text>` — replaces the suggestion text in place (min 10 chars). Useful for fixing OCR errors before approval.');
                }
                const editSugs = loadSuggestions();
                const editTarget = editSugs.find(s => s.id === editId && s.status === 'pending');
                if (!editTarget) return message.reply(`❌ No pending suggestion #${editId}. Use \`!suggestions\` to see the queue.`);
                if (!editTarget.original_text) editTarget.original_text = editTarget.text;
                editTarget.text = newText;
                editTarget.edited_by = message.author.username;
                editTarget.edited_at = new Date().toISOString();
                saveSuggestions(editSugs);
                return message.reply(
                    `✏️ Suggestion #${editId} updated.\n` +
                    `**Was:** ${editTarget.original_text.substring(0, 180)}\n` +
                    `**Now:** ${newText.substring(0, 180)}\n\n` +
                    `Approve with \`!approve ${editId}\`` +
                    (editTarget.proposed_category ? ` (defaults to \`${editTarget.proposed_category}${editTarget.proposed_key ? '.' + editTarget.proposed_key : ''}\`)` : '') +
                    `, or pick a category: \`!approve ${editId} <category> [key]\`.`
                );
            }

            case 'approve': {
                if (!isModerator(message.member)) {
                    return message.reply('❌ This command requires the **Moderator**, **XYIAN OFFICIAL**, or **Admin** role.');
                }
                const args = parseApproveArgs(argText);
                if (!args.id || Number.isNaN(args.id)) {
                    return message.reply('Usage: `!approve <#> [category] [key] [| override text]`\nExamples:\n`!approve 5` — files into custom_facts\n`!approve 5 runes frostshard_rune` — files into knowledge.runes.frostshard_rune\n`!approve 5 weapons | Cleaned up text` — categorize + override the text in one shot');
                }
                const suggestions = loadSuggestions();
                const target = suggestions.find(s => s.id === args.id && s.status === 'pending');
                if (!target) return message.reply(`❌ No pending suggestion #${args.id}. Use \`!suggestions\` to see the queue.`);

                const finalText = args.overrideText || target.text;
                const finalCategory = args.category || target.proposed_category || 'custom_facts';
                const finalKey = args.key || target.proposed_key || null;

                const result = applyApprovedToKnowledge({
                    category: finalCategory,
                    key: finalKey,
                    text: finalText,
                    by: target.by,
                    suggestionId: target.id,
                    source: target.source || 'suggestion',
                });
                if (!result.ok) {
                    return message.reply(`❌ ${result.error}`);
                }

                target.status = 'approved';
                target.reviewed_by = message.author.username;
                target.reviewed_at = new Date().toISOString();
                target.approved_category = finalCategory;
                target.approved_locator = result.locator;
                if (args.overrideText) {
                    if (!target.original_text) target.original_text = target.text;
                    target.text = finalText;
                    target.edited_by = message.author.username + ' (at approval)';
                    target.edited_at = target.reviewed_at;
                }

                saveKnowledge();
                saveSuggestions(suggestions);

                // Check if the contributor earned a tier upgrade
                if (target.userId && message.guild) {
                    await checkTierUpgrade(message.guild, target.userId, target.by);
                }

                // DM the contributor
                if (target.userId) {
                    try {
                        const contributor = await client.users.fetch(target.userId);
                        const approvedTotal = getApprovedCountForUser(target.userId);
                        const nextTier = CONFIG.roleTiers.find(t => t.threshold > approvedTotal);
                        const progressLine = nextTier
                            ? `You now have **${approvedTotal}** approved suggestion${approvedTotal === 1 ? '' : 's'}. ${nextTier.threshold - approvedTotal} more until **${nextTier.name}**!`
                            : `You now have **${approvedTotal}** approved suggestions. You've reached the highest tier!`;
                        const sourceLine = target.source === 'vision'
                            ? '_(spotted from your screenshot — thanks for sharing!)_\n\n'
                            : '';
                        await contributor.send(
                            `✅ **Your suggestion was approved!**\n\n` +
                            sourceLine +
                            `> ${finalText.substring(0, 300)}\n\n` +
                            `Filed under \`${result.locator}\`. This is now part of the bot's knowledge base and will be used to answer questions.\n\n` +
                            `${progressLine}\n\n` +
                            `*Thank you for making the bot smarter for everyone!*`
                        );
                    } catch { /* DMs disabled */ }
                }

                const approvedCount = getApprovedCountForUser(target.userId);
                const overrideNote = args.overrideText ? ' *(text overridden at approval)*' : '';
                return message.reply(
                    `✅ Suggestion #${args.id} approved and filed under \`${result.locator}\`!${overrideNote}\n` +
                    `> ${finalText.substring(0, 200)}\n` +
                    `**${countFacts()}** facts total. (${target.by} now has ${approvedCount} approved)`
                );
            }

            case 'reject': {
                if (!isModerator(message.member)) {
                    return message.reply('❌ This command requires the **Moderator**, **XYIAN OFFICIAL**, or **Admin** role.');
                }
                const rejSuggestions = loadSuggestions();
                const parts = argText.split(/\s+/);
                const rejectId = parseInt(parts[0], 10);
                const reason = parts.slice(1).join(' ') || 'No reason given';
                const rejTarget = rejSuggestions.find(s => s.id === rejectId && s.status === 'pending');
                if (!rejTarget) return message.reply(`❌ No pending suggestion #${rejectId}. Use \`!suggestions\` to see the queue.`);
                rejTarget.status = 'rejected';
                rejTarget.reason = reason;
                rejTarget.reviewed_by = message.author.username;
                rejTarget.reviewed_at = new Date().toISOString();
                saveSuggestions(rejSuggestions);

                // DM the contributor about the rejection
                if (rejTarget.userId) {
                    try {
                        const contributor = await client.users.fetch(rejTarget.userId);
                        await contributor.send(
                            `📝 **Update on your suggestion:**\n\n` +
                            `> ${rejTarget.text.substring(0, 300)}\n\n` +
                            `This one wasn't added to the knowledge base.\n` +
                            `**Reason:** ${reason}\n\n` +
                            `Don't be discouraged — your contributions matter! Feel free to submit again with \`!suggest\`.`
                        );
                    } catch { /* DMs disabled */ }
                }

                return message.reply(`🗑️ Suggestion #${rejectId} rejected. Reason: ${reason}`);
            }

            case 'grant': {
                if (!isModerator(message.member)) {
                    return message.reply('❌ This command requires the **Moderator**, **XYIAN OFFICIAL**, or **Admin** role.');
                }
                const mentioned = message.mentions.members?.first();
                if (!mentioned) return message.reply('Usage: `!grant @user` — assigns the reaction role.');
                const grantRoleName = CONFIG.reactionRole.roleName;
                const grantRole = message.guild.roles.cache.find(r => r.name === grantRoleName);
                if (!grantRole) return message.reply(`❌ Role "${grantRoleName}" not found in this server.`);
                if (mentioned.roles.cache.has(grantRole.id)) {
                    return message.reply(`${mentioned.user.username} already has the **${grantRoleName}** role.`);
                }
                await mentioned.roles.add(grantRole);
                await sendToAdmin({
                    content: `🤖 **Role manually granted**\nUser: **${mentioned.user.username}** (${mentioned.id})\nRole: **${grantRoleName}**\nGranted by: ${message.author.username}`,
                });
                try {
                    await mentioned.user.send(
                        `🤖 **You've been granted the ${grantRoleName} role!**\n\n` +
                        `An admin has given you access to the Arch AI bot.\n\n` +
                        `Head to <#${CONFIG.channels.archAi}> and ask any Archero 2 question — no command needed!\n\n` +
                        `**Useful commands:**\n` +
                        `• \`!suggest <text>\` — Submit a correction or new info\n` +
                        `• \`!help\` — See all commands\n` +
                        `• \`!contributors\` — See the leaderboard\n\n` +
                        `*Get 5 suggestions approved to reach **Arch Scholar** and unlock more abilities!*`
                    );
                } catch { /* DMs disabled */ }
                return message.reply(`✅ Assigned **${grantRoleName}** to ${mentioned.user.username}.`);
            }

            case 'setupreaction': {
                if (!isOwner(message.author.id) && !isAdmin(message.member)) {
                    return message.reply('❌ This command requires Admin access.');
                }
                const roleName = CONFIG.reactionRole.roleName;
                const emoji = CONFIG.reactionRole.emoji;
                const setupEmbed = new EmbedBuilder()
                    .setTitle(`${emoji} Introducing: Arch AI (Alpha)`)
                    .setDescription(
                        `We're building an AI-powered Q&A bot for Archero 2 right here in this server. It can answer questions about characters, skills, star-ups, resonance, privilege cards, and more — all powered by verified in-game data.\n\n` +
                        `**Want access?**\n` +
                        `React with ${emoji} below and you'll get the **${roleName}** role automatically.\n\n` +
                        `**How to use it:**\n` +
                        `Head to <#${CONFIG.channels.archAi}> and just type your question — no command needed.\n` +
                        `*Examples: "What does Phynx's Desert Tribunal do?" • "How does resonance work?" • "What are Cleo's skill levels?"*\n\n` +
                        `**See something wrong?**\n` +
                        `Type \`!suggest <text>\` to submit a correction — it goes to the team for review.\n\n` +
                        `**Commands:** \`!help\` for the full list • \`!ping\` for bot status\n\n` +
                        `*This is an alpha — answers won't always be perfect. Your questions and suggestions help make it better.*`
                    )
                    .setColor(0x00ff88)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot — React 🤖 for access!' });
                const posted = await message.channel.send({ embeds: [setupEmbed] });
                await posted.react(emoji);
                reactionRoleMessages.add(posted.id);
                await sendToAdmin({
                    content: `📌 **Reaction-role message posted**\nChannel: <#${message.channel.id}>\nMessage ID: ${posted.id}\nRole: **${roleName}**\nEmoji: ${emoji}`,
                });
                return message.reply(`✅ Reaction-role message posted! Message ID: \`${posted.id}\`\n⚠️ Add this ID to \`CONFIG.reactionRole.messageIds\` so it persists across restarts.`);
            }

            default:
                if (isAIChannel || isDM) {
                    return message.reply('Unknown command. Try `!help`.');
                }
                return;
        }
    }

    // ── Q&A in arch-ai ──

    if (!isAIChannel) return;

    // Duplicate prevention
    const spamKey = `${message.id}_${message.channel.id}`;
    if (spamTracker.has(spamKey)) return;
    spamTracker.set(spamKey, true);
    if (spamTracker.size > 1000) spamTracker.delete(spamTracker.keys().next().value);

    // Role check
    if (!hasAIAccess(message.member)) {
        const embed = new EmbedBuilder()
            .setDescription('You need the **AI Enabled** role or a verified guild role to ask questions here. Ask an admin for access!')
            .setColor(0xff6b6b).setFooter({ text: 'XYIAN Bot' });
        return message.reply({ embeds: [embed] });
    }

    // Owner-controlled global kill switch (toggleable via !ai on / !ai off).
    // Applies to everyone — including the owner — so the off-state is honest.
    if (!CONFIG.features.aiEnabled) {
        const embed = new EmbedBuilder()
            .setTitle('🧙 Arch AI is offline')
            .setDescription('AI Q&A is paused right now. The owner has temporarily disabled it — try again later.')
            .setColor(0xff6b6b).setTimestamp().setFooter({ text: 'XYIAN Bot — !ai status' });
        return message.reply({ embeds: [embed] });
    }

    // OpenAI not configured at all (no key, package missing, etc.).
    if (!openai) {
        const embed = new EmbedBuilder()
            .setTitle('❓ Archero 2 Q&A')
            .setDescription('AI features are currently offline. An admin needs to configure the OpenAI API key.')
            .setColor(0xff6b6b).setTimestamp().setFooter({ text: 'XYIAN Bot' });
        return message.reply({ embeds: [embed] });
    }

    // ── Vision gating ──
    // Vision is the expensive path (~10–50× a text call). Layer the gates
    // before any OpenAI call: feature flag → trusted-roles → per-user cooldown.
    let imageUrls = extractImageUrls(message);
    let visionStripped = false;
    if (imageUrls.length > 0) {
        if (!CONFIG.features.visionEnabled) {
            // Vision feature is paused. Strip images and answer the text-only
            // portion (or a generic prompt if there is no text).
            imageUrls = [];
            visionStripped = true;
        } else if (!hasVisionAccess(message.member)) {
            // Non-trusted user attached an image — redirect, no OpenAI call.
            const trustedList = CONFIG.visionTrustedRoleNames.map(n => `**${n}**`).join(', ');
            const embed = new EmbedBuilder()
                .setTitle('📸 Vision is for trusted contributors')
                .setDescription(
                    `Image analysis in <#${CONFIG.channels.archAi}> is currently limited to ${trustedList}.\n\n` +
                    `Drop your **text** question here in <#${CONFIG.channels.archAi}> and I'll do my best, ` +
                    `or chat about your screenshot in <#${CONFIG.channels.archAiDiscussion}>.`
                )
                .setColor(0xff6b6b).setTimestamp().setFooter({ text: 'XYIAN Bot — vision access' });
            return message.reply({ embeds: [embed] });
        } else {
            // Trusted user — enforce the per-user cooldown.
            const remainingMs = getVisionCooldownRemainingMs(message.author.id);
            if (remainingMs > 0) {
                const seconds = Math.ceil(remainingMs / 1000);
                const embed = new EmbedBuilder()
                    .setTitle('📸 Vision cooldown')
                    .setDescription(
                        `My circuits need a moment. Try the screenshot again in **${seconds}s**, ` +
                        `or ask a text question now and I'll answer right away.`
                    )
                    .setColor(0xf39c12).setTimestamp().setFooter({ text: 'XYIAN Bot — vision cooldown' });
                return message.reply({ embeds: [embed] });
            }
        }
    }

    try {
        await message.channel.sendTyping();

        // If the user attached image(s) AND vision is enabled AND they are
        // trusted, route through the vision-capable path. Otherwise, behavior
        // is unchanged from text-only Q&A.
        let answer;
        let visionCandidates = [];
        if (imageUrls.length > 0) {
            // Stamp BEFORE the call so a duplicate within the OpenAI roundtrip
            // window also gets gated.
            stampVisionCooldown(message.author.id);
            const result = await askAIWithVision(message.content, imageUrls, message.author.username, message.author.id);
            answer = result.reply;
            visionCandidates = result.candidates || [];
        } else {
            const textQuestion = visionStripped && !message.content.trim()
                ? 'I shared a screenshot, but vision is paused right now — anything general you can tell me?'
                : message.content;
            answer = await askAI(textQuestion, message.author.username, message.author.id);
        }

        if (answer === '__RATE_LIMITED__') {
            const rateLimitMessages = [
                "I've been answering questions all day and my circuits are... warm. Very warm. I need a minute. Try again shortly.",
                "Turns out even a cybernetic wizard has limits. I've hit mine for the moment — give me a bit and I'll be back at full power.",
                "My knowledge is vast. My API budget is not. I've been temporarily throttled — try again in a few minutes.",
                "I just tried to think and got a 'please hold' message from my own brain. That's new. Check back in a bit.",
            ];
            const msg = rateLimitMessages[Math.floor(Math.random() * rateLimitMessages.length)];
            const embed = new EmbedBuilder()
                .setTitle('🧙 Arch AI is recharging...')
                .setDescription(msg)
                .setColor(0xf39c12).setTimestamp().setFooter({ text: 'Arch AI — Back shortly' });
            return message.reply({ embeds: [embed] });
        }

        if (!answer) {
            const failMessages = [
                "I searched every corner of my memory and came up blank on that one. Try rephrasing, or if you know the answer — `!suggest` it and help a wizard out.",
                "That question stumped me. Either I don't have the data yet, or I need more coffee. Try asking differently, or use `!suggest` to add what you know.",
                "I... genuinely don't know. And I'm not going to pretend I do. If you have the answer, `!suggest` it — the guild will thank you.",
            ];
            const msg = failMessages[Math.floor(Math.random() * failMessages.length)];
            const embed = new EmbedBuilder()
                .setTitle('🧙 Arch AI')
                .setDescription(msg)
                .setColor(0xff6b6b).setTimestamp().setFooter({ text: 'Arch AI — !suggest to help fill the gaps' });
            return message.reply({ embeds: [embed] });
        }

        // If the vision pass surfaced new candidate facts, queue them for
        // admin review and append a transparent footer to the wizard's reply.
        let queuedCandidates = [];
        let answerWithCandidates = answer;
        if (visionStripped) {
            answerWithCandidates =
                `_Vision is paused right now — answering the text part only._\n\n` + answer;
        }
        if (visionCandidates.length > 0) {
            queuedCandidates = queueVisionCandidates(visionCandidates, imageUrls, message);
            if (queuedCandidates.length > 0) {
                const sample = queuedCandidates[0].text.length > 80
                    ? queuedCandidates[0].text.slice(0, 77) + '...'
                    : queuedCandidates[0].text;
                const more = queuedCandidates.length > 1 ? ` (+${queuedCandidates.length - 1} more)` : '';
                answerWithCandidates =
                    answer +
                    `\n\n📸 *I noticed ${queuedCandidates.length} thing${queuedCandidates.length === 1 ? '' : 's'} ` +
                    `I don't have on file yet — queued for admin review:* "${sample}"${more}`;
                // Notify admin webhook so mods know the queue grew.
                const adminLines = queuedCandidates.map(c =>
                    `  • #${c.id} [${c.confidence}] ${c.proposed_category ? `→ \`${c.proposed_category}.${c.proposed_key || 'auto'}\` ` : ''}${c.text.slice(0, 200)}`
                ).join('\n');
                await sendToAdmin({
                    content:
                        `📸 **New vision candidates** from ${message.author.username} (screenshot review queue):\n` +
                        adminLines +
                        `\nUse \`!suggestions\`, \`!edit <#> <text>\`, \`!approve <#> [category] [key]\`, or \`!reject <#>\`.`,
                });
            }
        }

        const footerText = hasVerifiedRole(message.member)
            ? 'XYIAN Bot — React 👍/👎 to give feedback'
            : 'Something wrong? Use !suggest to report incorrect info  •  React 👍/👎';

        const embed = new EmbedBuilder()
            .setTitle('❓ Archero 2 Q&A')
            .setDescription(answerWithCandidates)
            .setColor(0x00bfff)
            .setTimestamp()
            .setFooter({ text: footerText });

        const reply = await message.reply({ embeds: [embed] });

        // Add feedback reactions
        await reply.react('👍');
        await reply.react('👎');

        const filter = (reaction, user) => ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
        const collector = reply.createReactionCollector({ filter, time: 5 * 60 * 1000 });
        collector.on('collect', (reaction, user) => {
            logFeedback(message.content, answer, reaction.emoji.name, user.username);
            console.log(`${reaction.emoji.name} from ${user.username} on: "${message.content.substring(0, 50)}"`);
        });

    } catch (e) {
        console.error('❌ Q&A error:', e);
        await sendToAdmin({ content: `🚨 Q&A error: ${e.message}\nQuestion: ${message.content.substring(0, 100)}` });
        try { await message.reply('Something went wrong. Please try again later.'); } catch { /* best effort */ }
    }
});

// ── Error handling ──────────────────────────────────────────────────────────

client.on('error', (e) => {
    console.error('Discord client error:', e);
    sendToAdmin({ content: `🚨 **Discord client error**: ${e.message}` });
});

process.on('unhandledRejection', (e) => {
    console.error('Unhandled rejection:', e);
    sendToAdmin({ content: `🚨 **Unhandled rejection**: ${e}` });
});

// ── Ready ───────────────────────────────────────────────────────────────────

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag} (v${BOT_VERSION})`);
    console.log(`📊 ${countFacts()} facts loaded from knowledge.json`);

    // Resolve general channel ID for stale-message cleanup
    try {
        const guild = client.guilds.cache.first();
        if (guild) {
            const channels = await guild.channels.fetch();
            const general = channels.find(ch =>
                ch.isTextBased() && CONFIG.generalChatNames.some(n => ch.name === n)
            );
            if (general) {
                CONFIG.channels.general = general.id;
                console.log(`📍 General channel resolved: #${general.name} (${general.id})`);
            }
        }
    } catch (e) {
        console.log(`⚠️  Could not resolve general channel: ${e.message}`);
    }

    // Release notes → changelog channel (only if version is new)
    let changelogStatus = '⏭️ no changelog entries';
    if (BOT_CHANGELOG.length > 0 && CONFIG.channels.changelog) {
        try {
            const changelogChannel = await client.channels.fetch(CONFIG.channels.changelog);
            if (changelogChannel) {
                const recent = await changelogChannel.messages.fetch({ limit: 1 });
                const lastPost = recent.first();
                const lastTitle = lastPost?.embeds?.[0]?.title || '';
                const alreadyPosted = lastTitle.includes(`v${BOT_VERSION}`);

                if (alreadyPosted) {
                    changelogStatus = `⏭️ v${BOT_VERSION} already posted — skipped`;
                    console.log(`📋 Changelog v${BOT_VERSION} already posted — skipping`);
                } else {
                    await postChangelogToChannel(changelogChannel, BOT_VERSION, BOT_CHANGELOG);
                    changelogStatus = `📋 v${BOT_VERSION} posted to #changelog`;
                    console.log(changelogStatus);
                }
            }
        } catch (e) {
            changelogStatus = `⚠️ changelog post failed: ${e.message}`;
            console.log(`⚠️  Could not post to changelog: ${e.message}`);
        }
    }

    // Deploy notification → debug channel (includes changelog status)
    await sendToAdmin({
        content: `🚀 **Bot deployed!** v${BOT_VERSION}\n` +
            `📊 ${countFacts()} facts loaded\n` +
            `🤖 OpenAI: ${openai ? '✅ ready' : '❌ not configured'}\n` +
            `${changelogStatus}\n` +
            `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} Pacific`,
    });

    // Seed known reaction-role message IDs so reactions work after restart
    if (CONFIG.reactionRole.messageIds) {
        CONFIG.reactionRole.messageIds.forEach(id => reactionRoleMessages.add(id));
        console.log(`📌 Tracking ${CONFIG.reactionRole.messageIds.length} reaction-role message(s)`);
    }

    setupDailyResetMessaging();
    setupDailyMessaging();
    setupWeeklyKnowledgeReport();
});

// ── Health check (Railway) ──────────────────────────────────────────────────

const app = express();
const port = process.env.PORT || 3000;
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: BOT_VERSION,
        uptime: process.uptime(),
        facts: countFacts(),
        discord: client.isReady() ? 'connected' : 'disconnected',
        openai: openai ? 'configured' : 'not configured',
    });
});
app.listen(port, () => console.log(`🏥 Health check on port ${port}`));

// ── Login ───────────────────────────────────────────────────────────────────

installConsoleForwarding(); // start streaming errors/warnings to #debug-logs

client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error('❌ Login failed:', err);
    setTimeout(() => client.login(process.env.DISCORD_TOKEN), 5000);
});
