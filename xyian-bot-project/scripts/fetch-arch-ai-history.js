#!/usr/bin/env node
/**
 * Fetch and analyze arch-ai channel history
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

async function fetchChannelHistory() {
    try {
        console.log('🔍 Logging in to Discord...');
        await client.login(process.env.DISCORD_TOKEN);
        
        console.log('✅ Logged in successfully');
        
        // Find the arch-ai channel
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.error('❌ No guild found');
            process.exit(1);
        }
        
        console.log(`📊 Guild: ${guild.name}`);
        
        const channel = guild.channels.cache.find(ch => ch.name === 'arch-ai');
        if (!channel) {
            console.error('❌ arch-ai channel not found');
            console.log('Available channels:', guild.channels.cache.map(ch => ch.name).join(', '));
            process.exit(1);
        }
        
        console.log(`📝 Found channel: #${channel.name} (ID: ${channel.id})`);
        console.log('⏳ Fetching messages...');
        
        let allMessages = [];
        let lastMessageId = null;
        let batchCount = 0;
        
        // Fetch messages in batches of 100 (Discord API limit)
        while (true) {
            const options = { limit: 100 };
            if (lastMessageId) {
                options.before = lastMessageId;
            }
            
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;
            
            batchCount++;
            console.log(`📦 Batch ${batchCount}: Fetched ${messages.size} messages (Total: ${allMessages.length + messages.size})`);
            
            messages.forEach(msg => {
                allMessages.push({
                    id: msg.id,
                    author: {
                        username: msg.author.username,
                        bot: msg.author.bot,
                        id: msg.author.id
                    },
                    content: msg.content,
                    timestamp: msg.createdAt.toISOString(),
                    attachments: msg.attachments.map(att => ({
                        url: att.url,
                        name: att.name
                    })),
                    embeds: msg.embeds.length,
                    reactions: msg.reactions.cache.map(r => ({
                        emoji: r.emoji.name,
                        count: r.count
                    }))
                });
            });
            
            lastMessageId = messages.last().id;
            
            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n✅ Fetched ${allMessages.length} total messages`);
        
        // Analyze the messages
        console.log('\n📊 Analyzing messages...\n');
        
        const analysis = {
            totalMessages: allMessages.length,
            userMessages: allMessages.filter(m => !m.author.bot).length,
            botMessages: allMessages.filter(m => m.author.bot).length,
            authors: {},
            messagesByDate: {},
            questionsAsked: [],
            botResponses: []
        };
        
        allMessages.forEach(msg => {
            // Count by author
            if (!analysis.authors[msg.author.username]) {
                analysis.authors[msg.author.username] = {
                    count: 0,
                    isBot: msg.author.bot
                };
            }
            analysis.authors[msg.author.username].count++;
            
            // Count by date
            const date = msg.timestamp.split('T')[0];
            analysis.messagesByDate[date] = (analysis.messagesByDate[date] || 0) + 1;
            
            // Collect questions (messages ending with ?)
            if (msg.content.includes('?') && !msg.author.bot) {
                analysis.questionsAsked.push({
                    author: msg.author.username,
                    question: msg.content,
                    timestamp: msg.timestamp
                });
            }
            
            // Collect bot responses
            if (msg.author.bot) {
                analysis.botResponses.push({
                    content: msg.content.substring(0, 200),
                    timestamp: msg.timestamp,
                    hasEmbeds: msg.embeds > 0
                });
            }
        });
        
        // Print analysis
        console.log('═'.repeat(80));
        console.log('📊 ARCH-AI CHANNEL ANALYSIS');
        console.log('═'.repeat(80));
        console.log(`\n📝 Total Messages: ${analysis.totalMessages}`);
        console.log(`👤 User Messages: ${analysis.userMessages}`);
        console.log(`🤖 Bot Messages: ${analysis.botMessages}`);
        
        console.log(`\n👥 Top Authors:`);
        const sortedAuthors = Object.entries(analysis.authors)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);
        sortedAuthors.forEach(([username, data], index) => {
            const botLabel = data.isBot ? '🤖' : '👤';
            console.log(`  ${index + 1}. ${botLabel} ${username}: ${data.count} messages`);
        });
        
        console.log(`\n📅 Messages by Date (last 7 days):`);
        const sortedDates = Object.entries(analysis.messagesByDate)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7);
        sortedDates.forEach(([date, count]) => {
            console.log(`  ${date}: ${count} messages`);
        });
        
        console.log(`\n❓ Recent Questions (last 10):`);
        analysis.questionsAsked.slice(-10).reverse().forEach((q, index) => {
            console.log(`  ${index + 1}. [${q.timestamp.split('T')[0]}] ${q.author}: ${q.question.substring(0, 80)}...`);
        });
        
        console.log(`\n🤖 Recent Bot Responses (last 5):`);
        analysis.botResponses.slice(-5).reverse().forEach((r, index) => {
            console.log(`  ${index + 1}. [${r.timestamp.split('T')[0]}] ${r.content.substring(0, 100)}...`);
        });
        
        // Save to file
        const outputDir = path.join(__dirname, '..', 'data', 'channel-history');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputFile = path.join(outputDir, `arch-ai-history-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify({
            fetchedAt: new Date().toISOString(),
            channel: {
                name: channel.name,
                id: channel.id
            },
            analysis,
            messages: allMessages
        }, null, 2));
        
        console.log(`\n💾 Full data saved to: ${outputFile}`);
        console.log('═'.repeat(80));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

client.once('ready', () => {
    console.log(`✅ Bot ready as ${client.user.tag}`);
    fetchChannelHistory();
});

