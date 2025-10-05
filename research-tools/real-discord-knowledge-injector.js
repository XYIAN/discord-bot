const fs = require('fs');
const path = require('path');

async function injectRealDiscordKnowledge() {
    console.log('🚀 Injecting REAL Discord knowledge into bot database...');
    
    try {
        // Read the REAL Discord channels data
        const realData = JSON.parse(fs.readFileSync('working-discord-channels-data-1759695769195.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create REAL comprehensive knowledge base
        const realKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault', 'REAL Discord Community', 'REAL Discord Channels'],
            realDiscordChannels: realData.discordChannels,
            realGameInfo: realData.gameInfo,
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
            ...realKnowledge,
            lastUpdated: new Date().toISOString()
        };
        
        // Save REAL knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(mergedKnowledge, null, 2));
        console.log(`✅ REAL knowledge saved to ${botKnowledgePath}`);
        
        // Create a summary for the bot
        const summary = {
            realChannels: realData.discordChannels.filter(c => c.scraped).length,
            realGameInfo: realData.gameInfo.length,
            uniqueKeywords: [...new Set(realData.gameInfo.flatMap(g => g.keywords))].length,
            totalChannels: (botKnowledge.discordChannels?.length || 0) + realData.discordChannels.length,
            totalGameInfo: (botKnowledge.allGameInfo?.length || 0) + realData.gameInfo.length
        };
        
        console.log('📊 REAL Discord Knowledge Injection Summary:');
        console.log(`- REAL channels: ${summary.realChannels}`);
        console.log(`- REAL game info: ${summary.realGameInfo}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total channels: ${summary.totalChannels}`);
        console.log(`- Total game info: ${summary.totalGameInfo}`);
        
        // List all REAL channels
        console.log('\n🎯 REAL Discord Channels:');
        realData.discordChannels.forEach((channel, index) => {
            console.log(`${index + 1}. ${channel.pageTitle}`);
            console.log(`   Channel ID: ${channel.channelId}`);
            console.log(`   Content length: ${channel.contentLength} characters`);
            console.log(`   Status: ${channel.scraped ? '✅ REAL Content' : '❌ Failed'}`);
        });
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **REAL Discord Knowledge Base Updated**\n\n✅ Successfully injected REAL Discord channel knowledge\n📊 Enhanced with ${summary.realChannels} REAL channels, ${summary.realGameInfo} game info entries\n🎯 Total channels: ${summary.totalChannels}, Total game info: ${summary.totalGameInfo}\n🕒 Last updated: ${new Date().toISOString()}\n\n**REAL Channels Scraped:**\n${realData.discordChannels.map(c => `• ${c.pageTitle}`).join('\n')}`
        });
        
        console.log('✅ REAL Discord knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ REAL Discord knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectRealDiscordKnowledge()
        .then(data => {
            console.log('✅ REAL Discord knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ REAL Discord knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectRealDiscordKnowledge };
