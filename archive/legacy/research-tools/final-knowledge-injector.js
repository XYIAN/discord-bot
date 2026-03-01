const fs = require('fs');
const path = require('path');

async function injectFinalKnowledge() {
    console.log('🚀 Injecting final comprehensive knowledge into bot database...');
    
    try {
        // Read the additional Discord channels data
        const additionalData = JSON.parse(fs.readFileSync('all-discord-channels-data-1759694832932.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create final comprehensive knowledge base
        const finalKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault', 'Discord Community', 'Additional Discord Channels'],
            additionalDiscordChannels: additionalData.discordChannels,
            additionalGameInfo: additionalData.gameInfo,
            // Keep all existing knowledge
            artifacts: botKnowledge.artifacts || {},
            weapons: botKnowledge.weapons || {},
            characters: botKnowledge.characters || {},
            mechanics: botKnowledge.mechanics || {},
            events: botKnowledge.events || {},
            guild: botKnowledge.guild || {},
            gameSystems: botKnowledge.gameSystems || {},
            allGameInfo: botKnowledge.allGameInfo || []
        };
        
        // Merge with existing knowledge
        const mergedKnowledge = {
            ...botKnowledge,
            ...finalKnowledge,
            lastUpdated: new Date().toISOString()
        };
        
        // Save final knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(mergedKnowledge, null, 2));
        console.log(`✅ Final knowledge saved to ${botKnowledgePath}`);
        
        // Create a summary for the bot
        const summary = {
            additionalChannels: additionalData.discordChannels.filter(c => c.scraped).length,
            additionalGameInfo: additionalData.gameInfo.length,
            uniqueKeywords: [...new Set(additionalData.gameInfo.flatMap(g => g.keywords))].length,
            totalChannels: (botKnowledge.discordChannels?.length || 0) + additionalData.discordChannels.length,
            totalGameInfo: (botKnowledge.allGameInfo?.length || 0) + additionalData.gameInfo.length
        };
        
        console.log('📊 Final Knowledge Injection Summary:');
        console.log(`- Additional channels: ${summary.additionalChannels}`);
        console.log(`- Additional game info: ${summary.additionalGameInfo}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total channels: ${summary.totalChannels}`);
        console.log(`- Total game info: ${summary.totalGameInfo}`);
        
        // List all additional channels
        console.log('\n🎯 Additional Discord Channels:');
        additionalData.discordChannels.forEach((channel, index) => {
            console.log(`${index + 1}. Channel ${channel.channelId}`);
            console.log(`   URL: ${channel.url}`);
            console.log(`   Content length: ${channel.contentLength} characters`);
            console.log(`   Status: ${channel.scraped ? '✅ Scraped' : '❌ Failed'}`);
        });
        
        // Send to admin webhook
        const adminWebhook = 'https://discord.com/api/webhooks/REDACTED';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **Final Knowledge Base Updated**\n\n✅ Successfully injected additional Discord channel knowledge\n📊 Enhanced with ${summary.additionalChannels} additional channels, ${summary.additionalGameInfo} game info entries\n🎯 Total channels: ${summary.totalChannels}, Total game info: ${summary.totalGameInfo}\n🕒 Last updated: ${new Date().toISOString()}`
        });
        
        console.log('✅ Final knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ Final knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectFinalKnowledge()
        .then(data => {
            console.log('✅ Final knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Final knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectFinalKnowledge };
