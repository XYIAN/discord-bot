const axios = require('axios');
const fs = require('fs');

async function scrapeAdditionalDiscordChannel() {
    console.log('🚀 Starting additional Discord channel scraper...');
    
    const additionalData = {
        timestamp: new Date().toISOString(),
        sources: [],
        discordChannels: [],
        gameInfo: []
    };
    
    // New Discord channel URL
    const newChannelUrl = 'https://discord.com/channels/1268830572743102505/1347635565876744263';
    
    try {
        console.log(`📋 Scraping additional Discord channel: ${newChannelUrl}`);
        const response = await axios.get(newChannelUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const content = response.data;
        const channelId = newChannelUrl.split('/').pop();
        
        additionalData.discordChannels.push({
            url: newChannelUrl,
            channelId: channelId,
            contentLength: content.length,
            scraped: true
        });
        
        // Extract game information from Discord content
        const gameKeywords = [
            'weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 
            'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild', 'expedition',
            'staff', 'claws', 'crossbow', 'helix', 'alex', 'nyanja', 'rolla',
            'loki', 'demon king', 'otta', 'thor', 'fishing', 'umbral', 'tempest',
            'artifact', 'skill', 'event', 'arena', 'supreme', 'dragoon',
            'rune', 'gear', 'equipment', 'upgrade', 'enhancement', 'build',
            'strategy', 'tip', 'guide', 'help', 'question', 'answer'
        ];
        
        const foundKeywords = gameKeywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length > 0) {
            additionalData.gameInfo.push({
                source: 'Discord',
                channel: channelId,
                keywords: foundKeywords,
                content: content.substring(0, 2000),
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Additional Discord channel ${channelId} scraped: ${foundKeywords.length} keywords found`);
        
        // Save additional data
        const filename = `additional-discord-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(additionalData, null, 2));
        console.log(`💾 Saved additional data to ${filename}`);
        
        // Send summary
        const summary = {
            channelsScraped: additionalData.discordChannels.length,
            gameInfoFound: additionalData.gameInfo.length,
            uniqueKeywords: [...new Set(additionalData.gameInfo.flatMap(g => g.keywords))].length
        };
        
        console.log('📊 Additional Discord Scraping Summary:');
        console.log(`- Channels scraped: ${summary.channelsScraped}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        
        return additionalData;
        
    } catch (error) {
        console.error('❌ Additional Discord scraping failed:', error);
        throw error;
    }
}

// Run the scraper
if (require.main === module) {
    scrapeAdditionalDiscordChannel()
        .then(data => {
            console.log('✅ Additional Discord scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Additional Discord scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeAdditionalDiscordChannel };
