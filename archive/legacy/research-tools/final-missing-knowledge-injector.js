const fs = require('fs');
const path = require('path');

async function injectFinalMissingKnowledge() {
    console.log('🚀 Injecting FINAL missing Discord knowledge into bot database...');
    
    try {
        // Read the missing Discord channels data
        const missingData = JSON.parse(fs.readFileSync('missing-discord-channels-data-1759696277895.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create FINAL comprehensive knowledge base
        const finalKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault', 'FINAL Discord Community', 'ALL Discord Channels'],
            finalDiscordChannels: missingData.discordChannels,
            finalGameInfo: missingData.gameInfo,
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
        
        // Save FINAL knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(mergedKnowledge, null, 2));
        console.log(`✅ FINAL knowledge saved to ${botKnowledgePath}`);
        
        // Create a summary for the bot
        const summary = {
            finalChannels: missingData.discordChannels.filter(c => c.scraped).length,
            finalGameInfo: missingData.gameInfo.length,
            uniqueKeywords: [...new Set(missingData.gameInfo.flatMap(g => g.keywords))].length,
            totalChannels: (botKnowledge.discordChannels?.length || 0) + missingData.discordChannels.length,
            totalGameInfo: (botKnowledge.allGameInfo?.length || 0) + missingData.gameInfo.length
        };
        
        console.log('📊 FINAL Missing Discord Knowledge Injection Summary:');
        console.log(`- FINAL channels: ${summary.finalChannels}`);
        console.log(`- FINAL game info: ${summary.finalGameInfo}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total channels: ${summary.totalChannels}`);
        console.log(`- Total game info: ${summary.totalGameInfo}`);
        
        // List all FINAL channels
        console.log('\n🎯 FINAL Missing Discord Channels:');
        missingData.discordChannels.forEach((channel, index) => {
            console.log(`${index + 1}. ${channel.pageTitle}`);
            console.log(`   Channel ID: ${channel.channelId}`);
            console.log(`   Content length: ${channel.contentLength} characters`);
            console.log(`   Status: ${channel.scraped ? '✅ FINAL Content' : '❌ Failed'}`);
        });
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **FINAL Missing Discord Knowledge Base Updated**\n\n✅ Successfully injected FINAL missing Discord channel knowledge\n📊 Enhanced with ${summary.finalChannels} FINAL channels, ${summary.finalGameInfo} game info entries\n🎯 Total channels: ${summary.totalChannels}, Total game info: ${summary.totalGameInfo}\n🕒 Last updated: ${new Date().toISOString()}\n\n**FINAL Missing Channels Scraped:**\n${missingData.discordChannels.map(c => `• ${c.pageTitle}`).join('\n')}`
        });
        
        console.log('✅ FINAL missing Discord knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ FINAL missing Discord knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectFinalMissingKnowledge()
        .then(data => {
            console.log('✅ FINAL missing Discord knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ FINAL missing Discord knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectFinalMissingKnowledge };
