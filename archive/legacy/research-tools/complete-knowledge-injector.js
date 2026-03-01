const fs = require('fs');
const path = require('path');

async function injectCompleteKnowledge() {
    console.log('🚀 Injecting COMPLETE Discord knowledge into bot database...');
    
    try {
        // Read the COMPLETE Discord channels data
        const completeData = JSON.parse(fs.readFileSync('complete-discord-channels-data-1759696039606.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create COMPLETE comprehensive knowledge base
        const completeKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault', 'COMPLETE Discord Community', 'ALL Discord Channels'],
            completeDiscordChannels: completeData.discordChannels,
            completeGameInfo: completeData.gameInfo,
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
            ...completeKnowledge,
            lastUpdated: new Date().toISOString()
        };
        
        // Save COMPLETE knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(mergedKnowledge, null, 2));
        console.log(`✅ COMPLETE knowledge saved to ${botKnowledgePath}`);
        
        // Create a summary for the bot
        const summary = {
            completeChannels: completeData.discordChannels.filter(c => c.scraped).length,
            completeGameInfo: completeData.gameInfo.length,
            uniqueKeywords: [...new Set(completeData.gameInfo.flatMap(g => g.keywords))].length,
            totalChannels: (botKnowledge.discordChannels?.length || 0) + completeData.discordChannels.length,
            totalGameInfo: (botKnowledge.allGameInfo?.length || 0) + completeData.gameInfo.length
        };
        
        console.log('📊 COMPLETE Discord Knowledge Injection Summary:');
        console.log(`- COMPLETE channels: ${summary.completeChannels}`);
        console.log(`- COMPLETE game info: ${summary.completeGameInfo}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total channels: ${summary.totalChannels}`);
        console.log(`- Total game info: ${summary.totalGameInfo}`);
        
        // List all COMPLETE channels
        console.log('\n🎯 COMPLETE Discord Channels:');
        completeData.discordChannels.forEach((channel, index) => {
            console.log(`${index + 1}. ${channel.pageTitle}`);
            console.log(`   Channel ID: ${channel.channelId}`);
            console.log(`   Content length: ${channel.contentLength} characters`);
            console.log(`   Status: ${channel.scraped ? '✅ COMPLETE Content' : '❌ Failed'}`);
        });
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **COMPLETE Discord Knowledge Base Updated**\n\n✅ Successfully injected COMPLETE Discord channel knowledge\n📊 Enhanced with ${summary.completeChannels} COMPLETE channels, ${summary.completeGameInfo} game info entries\n🎯 Total channels: ${summary.totalChannels}, Total game info: ${summary.totalGameInfo}\n🕒 Last updated: ${new Date().toISOString()}\n\n**COMPLETE Channels Scraped:**\n${completeData.discordChannels.map(c => `• ${c.pageTitle}`).join('\n')}`
        });
        
        console.log('✅ COMPLETE Discord knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ COMPLETE Discord knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectCompleteKnowledge()
        .then(data => {
            console.log('✅ COMPLETE Discord knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ COMPLETE Discord knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectCompleteKnowledge };
