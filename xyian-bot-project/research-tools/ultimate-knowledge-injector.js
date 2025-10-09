const fs = require('fs');
const path = require('path');

async function injectUltimateKnowledge() {
    console.log('🚀 Injecting ultimate comprehensive knowledge into bot database...');
    
    try {
        // Read the ultimate Discord channels data
        const ultimateData = JSON.parse(fs.readFileSync('ultimate-discord-channels-data-1759694990333.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create ultimate comprehensive knowledge base
        const ultimateKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault', 'Discord Community', 'All Discord Channels'],
            ultimateDiscordChannels: ultimateData.discordChannels,
            ultimateGameInfo: ultimateData.gameInfo,
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
            ...ultimateKnowledge,
            lastUpdated: new Date().toISOString()
        };
        
        // Save ultimate knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(mergedKnowledge, null, 2));
        console.log(`✅ Ultimate knowledge saved to ${botKnowledgePath}`);
        
        // Create a summary for the bot
        const summary = {
            ultimateChannels: ultimateData.discordChannels.filter(c => c.scraped).length,
            ultimateGameInfo: ultimateData.gameInfo.length,
            uniqueKeywords: [...new Set(ultimateData.gameInfo.flatMap(g => g.keywords))].length,
            totalChannels: (botKnowledge.discordChannels?.length || 0) + ultimateData.discordChannels.length,
            totalGameInfo: (botKnowledge.allGameInfo?.length || 0) + ultimateData.gameInfo.length
        };
        
        console.log('📊 Ultimate Knowledge Injection Summary:');
        console.log(`- Ultimate channels: ${summary.ultimateChannels}`);
        console.log(`- Ultimate game info: ${summary.ultimateGameInfo}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total channels: ${summary.totalChannels}`);
        console.log(`- Total game info: ${summary.totalGameInfo}`);
        
        // List all ultimate channels
        console.log('\n🎯 Ultimate Discord Channels:');
        ultimateData.discordChannels.forEach((channel, index) => {
            console.log(`${index + 1}. Channel ${channel.channelId}`);
            console.log(`   URL: ${channel.url}`);
            console.log(`   Content length: ${channel.contentLength} characters`);
            console.log(`   Status: ${channel.scraped ? '✅ Scraped' : '❌ Failed'}`);
        });
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **Ultimate Knowledge Base Updated**\n\n✅ Successfully injected ultimate Discord channel knowledge\n📊 Enhanced with ${summary.ultimateChannels} ultimate channels, ${summary.ultimateGameInfo} game info entries\n🎯 Total channels: ${summary.totalChannels}, Total game info: ${summary.totalGameInfo}\n🕒 Last updated: ${new Date().toISOString()}`
        });
        
        console.log('✅ Ultimate knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ Ultimate knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectUltimateKnowledge()
        .then(data => {
            console.log('✅ Ultimate knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ultimate knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectUltimateKnowledge };