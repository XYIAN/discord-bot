#!/usr/bin/env node
/**
 * XYIAN Bot - Archero 2 community bot
 *
 * Features:
 *   - Daily reset reminder (4pm Pacific) → general chat
 *   - Guild recruitment (every other day) → recruit channel
 *   - OpenAI-powered Q&A in #arch-ai (verified roles only)
 *   - !addfact / !removefact / !listfacts for admins
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

const { Client, GatewayIntentBits, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

const BOT_VERSION = '3.2.1';

const BOT_CHANGELOG = [
    '🔄 **Fact sync workflow** — Dev can pull custom facts from live bot into the repo so they survive redeployments',
    '📢 **Changelog channel** — Bot now posts release notes to #changelog on deploy',
    '📝 Docs updated with fact-sync workflow and changelog process',
];

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

// ── Feedback log ────────────────────────────────────────────────────────────

const FEEDBACK_PATH = path.join(__dirname, 'data', 'feedback.json');

function logFeedback(question, answer, emoji, username) {
    let log = [];
    try { log = JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf8')); } catch { /* new file */ }
    log.push({ question, answer: answer.substring(0, 200), emoji, username, timestamp: new Date().toISOString() });
    if (log.length > 500) log = log.slice(-500);
    try { fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(log, null, 2)); } catch { /* best effort */ }
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

        // If we previously sent a message AND the channel's most recent
        // message is still ours, delete it so the new one looks fresh.
        if (trackingKey && lastBotMessage[trackingKey] && channelId && client.isReady()) {
            try {
                const channel = await client.channels.fetch(channelId);
                if (channel) {
                    const recent = await channel.messages.fetch({ limit: 1 });
                    const latest = recent.first();
                    if (latest && latest.id === lastBotMessage[trackingKey]) {
                        await wh.deleteMessage(lastBotMessage[trackingKey]);
                        console.log(`🗑️ Deleted stale ${trackingKey} message ${lastBotMessage[trackingKey]}`);
                    }
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

// ── OpenAI Q&A ──────────────────────────────────────────────────────────────

async function askAI(question, username) {
    if (!openai) return null;

    const systemPrompt =
        'You are XY Elder, a friendly and knowledgeable Archero 2 expert who helps players in the XYIAN guild Discord. ' +
        'Answer the user\'s question using ONLY the verified facts below. ' +
        'If the facts don\'t cover the question, say so honestly — don\'t guess or make things up. ' +
        'Keep answers concise (under 1500 characters) and helpful. Use a casual, encouraging tone.\n\n' +
        '--- VERIFIED FACTS ---\n' + knowledgeAsText();

    try {
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question },
            ],
            max_tokens: 600,
            temperature: 0.4,
        });
        const answer = res.choices[0]?.message?.content?.trim();
        if (answer && answer.length > 5) return answer;
        return null;
    } catch (e) {
        console.error('❌ OpenAI error:', e.message);
        await sendToAdmin({ content: `🚨 OpenAI error: ${e.message}` });
        return null;
    }
}

// ── Scheduled messages ──────────────────────────────────────────────────────

function setupDailyResetMessaging() {
    const schedule = () => {
        const now = new Date();
        const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        const next = new Date(pacific);
        next.setHours(16, 0, 0, 0);
        if (next <= pacific) next.setDate(next.getDate() + 1);
        const ms = next.getTime() - pacific.getTime();
        console.log(`⏰ Next daily reset: ${next.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
        setTimeout(() => { sendGeneralResetMessage(); schedule(); }, ms);
    };
    schedule();
    console.log('✅ Daily reset scheduled (4pm Pacific)');
}

let resetLock = false;
async function sendGeneralResetMessage() {
    if (resetLock) return;
    resetLock = true;
    try {
        const tip = getRandomFact();
        const embed = new EmbedBuilder()
            .setTitle('🔄 Daily Reset Reminder!')
            .setDescription(
                '**Daily reset is here! Complete your daily tasks before 4pm Pacific!**\n\n' +
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
        if (tip) {
            embed.addFields({ name: '💡 Tip of the Day', value: tip, inline: false });
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
            '💪 **Power Level:** 1M+ recommended\n\n**Ready to join the elite? Apply now!**'
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
        const embed = new EmbedBuilder()
            .setTitle(`Welcome to Arch 2 Addicts, ${member.user.username}!`)
            .setDescription(
                `Hey ${member}! Glad to have you here.\n\n` +
                '**Get started:**\n' +
                '• Head to **#arch-ai** to ask any Archero 2 question\n' +
                '• Check out the community channels and say hi\n' +
                '• Use `!help` to see bot commands\n\n' +
                '**About XYIAN OFFICIAL (Guild ID: 213797):**\n' +
                'We\'re an active Archero 2 guild always looking for dedicated players. 1M+ power recommended.'
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x00ff88)
            .setTimestamp()
            .setFooter({ text: 'Arch 2 Addicts — Welcome!' });
        await sendToGeneral({ embeds: [embed] });
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
                        '`!help` / `!menu` — This message\n\n' +
                        '**Verified roles** (ask in **#arch-ai**):\n' +
                        'Just type your Archero 2 question — no command needed!\n' +
                        '`!faq` — Common topics\n' +
                        '`!listfacts` — Browse custom facts\n\n' +
                        '**XYIAN OFFICIAL / Admin:**\n' +
                        '`!addfact <text>` — Add a fact to the knowledge base\n' +
                        '`!removefact <number>` — Remove a custom fact by number\n' +
                        '`!recruit` — Send guild recruitment now\n' +
                        '`!reset` — Send daily reset now'
                    )
                    .setColor(0x9b59b6).setTimestamp().setFooter({ text: 'XYIAN Bot' });
                return message.reply({ embeds: [embed] });
            }

            case 'faq': {
                const categories = Object.keys(knowledge).filter(k => k !== 'custom_facts');
                const list = categories.map(c => `• **${c.replace(/_/g, ' ')}** (${typeof knowledge[c] === 'object' ? Object.keys(knowledge[c]).length : 1} entries)`).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle('📚 FAQ — What can I answer?')
                    .setDescription(`I know about these topics:\n\n${list}\n\nPlus **${(knowledge.custom_facts || []).length} custom facts** added by admins.\n\nJust ask your question in **#arch-ai**!`)
                    .setColor(0x00bfff).setTimestamp().setFooter({ text: 'XYIAN Bot' });
                return message.reply({ embeds: [embed] });
            }

            case 'listfacts': {
                if (!hasVerifiedRole(message.member) && !isDM) {
                    return message.reply('❌ You need a verified role to use this command.');
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
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
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
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
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

            case 'reset': {
                if (!isAdmin(message.member)) {
                    return message.reply('❌ This command requires the **XYIAN OFFICIAL** or **Admin** role.');
                }
                await sendGeneralResetMessage();
                return message.reply('🔄 Daily reset message sent!');
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
    if (!hasVerifiedRole(message.member)) {
        const embed = new EmbedBuilder()
            .setDescription('You need a verified role to ask questions here. Check the server rules or ask an admin!')
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
        const answer = await askAI(message.content, message.author.username);

        if (!answer) {
            const embed = new EmbedBuilder()
                .setTitle('❓ Archero 2 Q&A')
                .setDescription('Sorry, I couldn\'t generate an answer. Try rephrasing your question, or ask an admin to add more facts with `!addfact`.')
                .setColor(0xff6b6b).setTimestamp().setFooter({ text: 'XYIAN Bot' });
            return message.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('❓ Archero 2 Q&A')
            .setDescription(answer)
            .setColor(0x00bfff)
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot — React 👍/👎 to give feedback' });

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

    // Deploy notification → debug channel
    await sendToAdmin({
        content: `🚀 **Bot deployed!** v${BOT_VERSION}\n` +
            `📊 ${countFacts()} facts loaded\n` +
            `🤖 OpenAI: ${openai ? '✅ ready' : '❌ not configured'}\n` +
            `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} Pacific`,
    });

    // Release notes → changelog channel
    if (BOT_CHANGELOG.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle(`📦 XYIAN Bot v${BOT_VERSION}`)
            .setDescription(BOT_CHANGELOG.map(line => `• ${line}`).join('\n'))
            .setColor(0x00ff88)
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot — Changelog' });
        await sendToChangelog({ embeds: [embed] });
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
