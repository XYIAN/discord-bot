const axios = require('axios');
const fs = require('fs');

async function scrapeMultipleDiscordChannels() {
    console.log('🚀 Starting multi-Discord channel scraper...');
    
    const multiData = {
        timestamp: new Date().toISOString(),
        sources: [],
        discordChannels: [],
        gameInfo: []
    };
    
    // Multiple Discord channel URLs
    const discordChannels = [
        'https://discord.com/channels/1268830572743102505/1347635565876744263',
        'https://discord.com/channels/1268830572743102505/1341711135631736893'
    ];
    
    for (const channelUrl of discordChannels) {
        try {
            console.log(`📋 Scraping Discord channel: ${channelUrl}`);
            const response = await axios.get(channelUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                },
                timeout: 15000
            });
            
            const content = response.data;
            const channelId = channelUrl.split('/').pop();
            
            multiData.discordChannels.push({
                url: channelUrl,
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
                'strategy', 'tip', 'guide', 'help', 'question', 'answer',
                'pvp', 'arena', 'supreme', 'battle', 'combat', 'damage',
                'defense', 'attack', 'speed', 'crit', 'dodge', 'health'
            ];
            
            const foundKeywords = gameKeywords.filter(keyword => 
                content.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
                multiData.gameInfo.push({
                    source: 'Discord',
                    channel: channelId,
                    keywords: foundKeywords,
                    content: content.substring(0, 2000),
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log(`✅ Discord channel ${channelId} scraped: ${foundKeywords.length} keywords found`);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape Discord channel ${channelUrl}: ${error.message}`);
            multiData.discordChannels.push({
                url: channelUrl,
                channelId: channelUrl.split('/').pop(),
                error: error.message,
                scraped: false
            });
        }
    }
    
    // Save multi-channel data
    const filename = `multi-discord-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(multiData, null, 2));
    console.log(`💾 Saved multi-channel data to ${filename}`);
    
    // Send summary
    const summary = {
        channelsScraped: multiData.discordChannels.filter(c => c.scraped).length,
        channelsFailed: multiData.discordChannels.filter(c => !c.scraped).length,
        gameInfoFound: multiData.gameInfo.length,
        uniqueKeywords: [...new Set(multiData.gameInfo.flatMap(g => g.keywords))].length
    };
    
    console.log('📊 Multi-Discord Scraping Summary:');
    console.log(`- Channels scraped: ${summary.channelsScraped}`);
    console.log(`- Channels failed: ${summary.channelsFailed}`);
    console.log(`- Game info found: ${summary.gameInfoFound}`);
    console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
    
    return multiData;
}

// Run the scraper
if (require.main === module) {
    scrapeMultipleDiscordChannels()
        .then(data => {
            console.log('✅ Multi-Discord scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Multi-Discord scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMultipleDiscordChannels };
