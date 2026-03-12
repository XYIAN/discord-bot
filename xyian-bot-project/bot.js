#!/usr/bin/env node
/**
 * XYIAN Bot - Archero 2 community bot
 *
 * Features:
 *   - Daily reset reminder (5pm Pacific) → general chat
 *   - Guild recruitment (every other day) → recruit channel
 *   - OpenAI-powered Q&A in #arch-ai (verified roles + AI Enabled)
 *   - !addfact / !removefact / !listfacts for admins
 *   - !suggest for community corrections → admin review queue
 *   - Welcome message for new members
 *   - Thumbs-up/down feedback on Q&A replies
 *   - Deploy notification → admin webhook on startup
 *   - Auto-delete stale scheduled messages when no user activity
 *   - Debug/errors → admin webhook
 *
 * Env (required): DISCORD_TOKEN, GENERAL_CHAT_WEBHOOK, GUILD_RECRUIT_WEBHOOK, ADMIN_WEBHOOK
 * Env (optional): OPENAI_API_KEY, OWNER_ID, PORT
 * See docs/ENV-AND-CHANNELS.md for the full list.
 */

const { Client, GatewayIntentBits, Partials, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
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

const { version: BOT_VERSION, lines: BOT_CHANGELOG } = parseChangelog();

// ── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
    channels: {
        archAi: '1424322391160393790',
        guildRecruit: '1419944464608268410',
        changelog: '1424784471395274803',
        general: null,  // resolved on ready by channel name
    },
    ignoreChannelNames: ['guild-recruit-chat', 'xyian-guild', 'guild-chat', 'recruit', 'guild-recruit'],
    generalChatNames: ['general', 'general-chat', 'main-chat', 'arch-2-addicts'],
    features: {
        tipOfTheDay: false,
    },
    reactionRole: {
        emoji: '🤖',
        roleName: 'AI Enabled',
        messageIds: ['1477906768272166925', '1478172709719380081', '1478934754848931930'],
    },
    roleTiers: [
        { name: 'AI Enabled',   threshold: 0,  canAsk: true,  canSuggest: true,  canAddFact: false, canRemoveFact: false, canListFacts: false },
        { name: 'Arch Scholar',  threshold: 5,  canAsk: true,  canSuggest: true,  canAddFact: true,  canRemoveFact: false, canListFacts: true  },
        { name: 'Arch Sage',    threshold: 15, canAsk: true,  canSuggest: true,  canAddFact: true,  canRemoveFact: true,  canListFacts: true  },
    ],
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
        const lines = [];
        if (typeof entries === 'object' && entries !== null) {
            for (const [name, data] of Object.entries(entries)) {
                if (typeof data === 'string') {
                    lines.push(`${name}: ${data}`);
                } else if (typeof data === 'object') {
                    lines.push(`${name}: ${JSON.stringify(data)}`);
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
        if (key === 'custom_facts') {
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
        if (key === 'custom_facts') {
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

    const emptyCategories = ['gear_sets', 'weapons', 'runes', 'blessings', 'game_modes', 'tips'];
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

// ── Role helpers ────────────────────────────────────────────────────────────

function isOwner(member) {
    return process.env.OWNER_ID && member.id === process.env.OWNER_ID;
}

function isAdmin(member) {
    if (!member || !member.roles) return false;
    return member.roles.cache.some(r => r.name === 'XYIAN OFFICIAL' || r.name === 'Admin');
}

function hasVerifiedRole(member) {
    if (!member || !member.roles) return false;
    const allowed = ['XYIAN OFFICIAL', 'XYIAN Guild Verified', 'Admin', 'Server Booster'];
    return member.roles.cache.some(r => allowed.includes(r.name));
}

function hasAIAccess(member) {
    if (!member || !member.roles) return false;
    return hasVerifiedRole(member) || member.roles.cache.some(r =>
        CONFIG.roleTiers.some(t => t.name === r.name)
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
                `• \`!faq\` — View all knowledge categories\n` +
                `• \`!listfacts\` — Browse all custom facts\n\n` +
                `And this isn't the end — at **15 approved suggestions**, you'll reach **Arch Sage**, the highest rank in the community. Keep going.`,
            debug: `🎓 **Tier upgrade: Arch Scholar**\nUser: **${username}** (${userId})\nApproved suggestions: ${count}\nNew access: !addfact, !faq, !listfacts`,
        },
        'Arch Sage': {
            dm: `🧙 **${username}, you are now an Arch Sage.**\n\n` +
                `This is the highest rank a community member can achieve — and you earned it. **${count} approved suggestions.** Every single one made the bot smarter, more accurate, and more useful for players who will never even know your name but will benefit from what you built.\n\n` +
                `There are no more tiers. No more thresholds. You've reached the top.\n\n` +
                `From here, you have full access to manage the knowledge base:\n` +
                `• \`!addfact\` — Add facts\n` +
                `• \`!removefact\` — Remove incorrect info\n` +
                `• \`!listfacts\` / \`!faq\` — Full visibility into everything the bot knows\n\n` +
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

async function sendToAdmin(content) {
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
        '- The user may ask follow-up questions. Use the conversation history to understand context.\n\n' +
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
        await sendToGeneral({ embeds: [embed] });
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
            '💪 **Power Level:** 1.5M+ required\n\n**Ready to join the elite? Apply now!**'
        )
        .setColor(0xffa500)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL — Arch 2 Addicts' });
    await sendToRecruit({ embeds: [embed] });
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
                'We\'re an active Archero 2 guild — daily activity and 1.5M+ power required.'
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x00ff88)
            .setTimestamp()
            .setFooter({ text: 'Arch 2 Addicts — React 🤖 for AI access!' });
        const welcomeMsg = await sendToGeneral({ embeds: [embed] });
        if (welcomeMsg?.id) {
            reactionRoleMessages.add(welcomeMsg.id);
            const channel = await client.channels.fetch(CONFIG.channels.general);
            if (channel) {
                const fetched = await channel.messages.fetch(welcomeMsg.id);
                await fetched.react(emoji);
            }
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
                '🎓 **Arch Scholar** (5 approved suggestions) — Unlock `!addfact`, `!faq`, `!listfacts`\n' +
                '🧙 **Arch Sage** (15 approved suggestions) — Unlock `!removefact`\n\n' +
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
    } catch (e) {
        console.error('❌ Welcome error:', e.message);
    }
});

// ── Message handler ─────────────────────────────────────────────────────────

const spamTracker = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

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
                        '`!contributors` — Leaderboard of top contributors\n\n' +
                        '**🤖 AI Enabled** (in **#arch-ai**):\n' +
                        'Just type your Archero 2 question — no command needed!\n' +
                        '`!suggest <text>` — Suggest a correction or new info\n\n' +
                        '**🎓 Arch Scholar** (5 approved suggestions):\n' +
                        '`!addfact <text>` — Add a fact to the knowledge base\n' +
                        '`!faq` — View knowledge categories\n' +
                        '`!listfacts` — Browse custom facts\n\n' +
                        '**🧙 Arch Sage** (15 approved suggestions):\n' +
                        '`!removefact <number>` — Remove a custom fact\n\n' +
                        '**XYIAN OFFICIAL / Admin:**\n' +
                        '`!suggestions` — Review pending suggestions\n' +
                        '`!approve <#>` — Approve a suggestion (adds as fact)\n' +
                        '`!reject <#> [reason]` — Reject a suggestion\n' +
                        '`!grant @user` — Manually assign a role\n' +
                        '`!setupreaction` — Post a reaction-role message\n' +
                        '`!recruit` — Send guild recruitment now\n' +
                        '`!post-guild-requirements` — Post guild requirements embed (for #guild-requirements)\n' +
                        '`!reset` — Send daily reset now'
                    )
                    .setColor(0x9b59b6).setTimestamp().setFooter({ text: 'XYIAN Bot' });
                return message.reply({ embeds: [embed] });
            }

            case 'faq': {
                if (!canMemberDo(message.member, 'canListFacts') && !isDM) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to use this command. Earn it by getting 5 suggestions approved!');
                }
                const categories = Object.keys(knowledge).filter(k => k !== 'custom_facts');
                const list = categories.map(c => `• **${c.replace(/_/g, ' ')}** (${typeof knowledge[c] === 'object' ? Object.keys(knowledge[c]).length : 1} entries)`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle('📚 FAQ — What can I answer?')
                    .setDescription(`I know about these topics:\n\n${list}\n\nPlus **${(knowledge.custom_facts || []).length} custom facts** added by admins.\n\nJust ask your question in **#arch-ai**!`)
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

            case 'listfacts': {
                if (!canMemberDo(message.member, 'canListFacts') && !isDM) {
                    return message.reply('❌ You need the **Arch Scholar** role or higher to use this command. Earn it by getting 5 suggestions approved!');
                }
                const facts = knowledge.custom_facts || [];
                if (!facts.length) return message.reply('No custom facts yet. Admins can add some with `!addfact <text>`.');
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
                        { name: '💪 Power Level', value: '**1.5M+ required**\n• Minimum power to join and stay active', inline: false },
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
                    id: suggestions.length + 1,
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
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
                }
                const all = loadSuggestions();
                const pending = all.filter(s => s.status === 'pending');
                if (!pending.length) return message.reply('📭 No pending suggestions!');
                const list = pending.slice(-15).map(s =>
                    `**#${s.id}** (${s.by}) — ${s.text.substring(0, 100)}${s.text.length > 100 ? '...' : ''}`
                ).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle(`💡 Pending Suggestions (${pending.length})`)
                    .setDescription(list)
                    .setColor(0xffa500).setTimestamp()
                    .setFooter({ text: 'Use !approve <#> or !reject <#> [reason]' });
                return message.reply({ embeds: [embed] });
            }

            case 'approve': {
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
                }
                const suggestions = loadSuggestions();
                const approveId = parseInt(argText, 10);
                const target = suggestions.find(s => s.id === approveId && s.status === 'pending');
                if (!target) return message.reply(`❌ No pending suggestion #${approveId}. Use \`!suggestions\` to see the queue.`);
                target.status = 'approved';
                target.reviewed_by = message.author.username;
                target.reviewed_at = new Date().toISOString();
                if (!knowledge.custom_facts) knowledge.custom_facts = [];
                knowledge.custom_facts.push({
                    text: target.text,
                    added_by: `${target.by} (via suggestion)`,
                    added_at: new Date().toISOString().split('T')[0],
                });
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
                        await contributor.send(
                            `✅ **Your suggestion was approved!**\n\n` +
                            `> ${target.text.substring(0, 300)}\n\n` +
                            `This is now part of the bot's knowledge base and will be used to answer questions.\n\n` +
                            `${progressLine}\n\n` +
                            `*Thank you for making the bot smarter for everyone!*`
                        );
                    } catch { /* DMs disabled */ }
                }

                const approvedCount = getApprovedCountForUser(target.userId);
                return message.reply(`✅ Suggestion #${approveId} approved and added as a fact!\n> ${target.text.substring(0, 200)}\n**${countFacts()}** facts total. (${target.by} now has ${approvedCount} approved)`);
            }

            case 'reject': {
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
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
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
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

    // Ask OpenAI
    if (!openai) {
        const embed = new EmbedBuilder()
            .setTitle('❓ Archero 2 Q&A')
            .setDescription('AI features are currently offline. An admin needs to configure the OpenAI API key.')
            .setColor(0xff6b6b).setTimestamp().setFooter({ text: 'XYIAN Bot' });
        return message.reply({ embeds: [embed] });
    }

    try {
        await message.channel.sendTyping();
        const answer = await askAI(message.content, message.author.username, message.author.id);

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

        const footerText = hasVerifiedRole(message.member)
            ? 'XYIAN Bot — React 👍/👎 to give feedback'
            : 'Something wrong? Use !suggest to report incorrect info  •  React 👍/👎';

        const embed = new EmbedBuilder()
            .setTitle('❓ Archero 2 Q&A')
            .setDescription(answer)
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
                    const embed = new EmbedBuilder()
                        .setTitle(`📦 XYIAN Bot v${BOT_VERSION}`)
                        .setDescription(BOT_CHANGELOG.map(line => `• ${line}`).join('\n'))
                        .setColor(0x00ff88)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot — Changelog' });
                    await changelogChannel.send({ embeds: [embed] });
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

client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error('❌ Login failed:', err);
    setTimeout(() => client.login(process.env.DISCORD_TOKEN), 5000);
});
