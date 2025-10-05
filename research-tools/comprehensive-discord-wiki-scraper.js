const axios = require('axios');
const fs = require('fs');

async function scrapeComprehensiveDiscordAndWiki() {
    console.log('🚀 Starting comprehensive Discord and Wiki scraper...');
    
    const comprehensiveData = {
        timestamp: new Date().toISOString(),
        sources: [],
        discordChannels: [],
        wikiPages: [],
        gameSystems: {
            artifacts: {},
            weapons: {},
            characters: {},
            runes: {},
            gear: {},
            skills: {},
            events: {}
        },
        allGameInfo: []
    };
    
    // Discord channel URLs to scrape
    const discordChannels = [
        'https://discord.com/channels/1268830572743102505/1319252275822334012',
        'https://discord.com/channels/1268830572743102505/1346571363451928646',
        'https://discord.com/channels/1268830572743102505/1348357594322043011',
        'https://discord.com/channels/1268830572743102505/1350238408651313275'
    ];
    
    // Wiki pages to scrape
    const wikiPages = [
        'https://archero-2.game-vault.net/wiki/Characters',
        'https://archero-2.game-vault.net/wiki/Gear',
        'https://archero-2.game-vault.net/wiki/Runes',
        'https://archero-2.game-vault.net/wiki/Skills',
        'https://archero-2.game-vault.net/wiki/Events',
        'https://archero-2.game-vault.net/wiki/Pull_Rates',
        'https://archero-2.game-vault.net/wiki/Talent_Cards'
    ];
    
    // Scrape Discord channels
    console.log('📱 Scraping Discord channels...');
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
            
            comprehensiveData.discordChannels.push({
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
                'rune', 'gear', 'equipment', 'upgrade', 'enhancement'
            ];
            
            const foundKeywords = gameKeywords.filter(keyword => 
                content.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
                comprehensiveData.allGameInfo.push({
                    source: 'Discord',
                    channel: channelId,
                    keywords: foundKeywords,
                    content: content.substring(0, 1000),
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log(`✅ Discord channel ${channelId} scraped: ${foundKeywords.length} keywords found`);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape Discord channel ${channelUrl}: ${error.message}`);
            comprehensiveData.discordChannels.push({
                url: channelUrl,
                channelId: channelUrl.split('/').pop(),
                error: error.message,
                scraped: false
            });
        }
    }
    
    // Scrape Wiki pages
    console.log('📚 Scraping Wiki pages...');
    for (const wikiUrl of wikiPages) {
        try {
            console.log(`📚 Scraping Wiki page: ${wikiUrl}`);
            const response = await axios.get(wikiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                },
                timeout: 15000
            });
            
            const content = response.data;
            const pageName = wikiUrl.split('/').pop();
            
            comprehensiveData.wikiPages.push({
                url: wikiUrl,
                pageName: pageName,
                contentLength: content.length,
                scraped: true
            });
            
            // Extract game information from wiki content
            const weaponMatches = content.match(/weapon[^<]*/gi) || [];
            const characterMatches = content.match(/character[^<]*/gi) || [];
            const runeMatches = content.match(/rune[^<]*/gi) || [];
            const gearMatches = content.match(/gear[^<]*|equipment[^<]*/gi) || [];
            const skillMatches = content.match(/skill[^<]*/gi) || [];
            const eventMatches = content.match(/event[^<]*/gi) || [];
            const artifactMatches = content.match(/artifact[^<]*/gi) || [];
            
            // Categorize by game system
            if (pageName === 'Characters') {
                comprehensiveData.gameSystems.characters = {
                    content: content.substring(0, 5000),
                    keywords: characterMatches.slice(0, 10),
                    scraped: true
                };
            } else if (pageName === 'Gear') {
                comprehensiveData.gameSystems.gear = {
                    content: content.substring(0, 5000),
                    keywords: gearMatches.slice(0, 10),
                    scraped: true
                };
            } else if (pageName === 'Runes') {
                comprehensiveData.gameSystems.runes = {
                    content: content.substring(0, 5000),
                    keywords: runeMatches.slice(0, 10),
                    scraped: true
                };
            } else if (pageName === 'Skills') {
                comprehensiveData.gameSystems.skills = {
                    content: content.substring(0, 5000),
                    keywords: skillMatches.slice(0, 10),
                    scraped: true
                };
            } else if (pageName === 'Events') {
                comprehensiveData.gameSystems.events = {
                    content: content.substring(0, 5000),
                    keywords: eventMatches.slice(0, 10),
                    scraped: true
                };
            }
            
            // Add to all game info
            comprehensiveData.allGameInfo.push({
                source: 'Wiki',
                page: pageName,
                keywords: [...weaponMatches, ...characterMatches, ...runeMatches, ...gearMatches, ...skillMatches, ...eventMatches, ...artifactMatches].slice(0, 20),
                content: content.substring(0, 1000),
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Wiki page ${pageName} scraped: ${weaponMatches.length + characterMatches.length + runeMatches.length + gearMatches.length + skillMatches.length + eventMatches.length + artifactMatches.length} keywords found`);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape Wiki page ${wikiUrl}: ${error.message}`);
            comprehensiveData.wikiPages.push({
                url: wikiUrl,
                pageName: wikiUrl.split('/').pop(),
                error: error.message,
                scraped: false
            });
        }
    }
    
    // Save comprehensive data
    const filename = `comprehensive-discord-wiki-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(comprehensiveData, null, 2));
    console.log(`💾 Saved comprehensive data to ${filename}`);
    
    // Send summary
    const summary = {
        discordChannels: comprehensiveData.discordChannels.filter(c => c.scraped).length,
        wikiPages: comprehensiveData.wikiPages.filter(p => p.scraped).length,
        gameSystems: Object.keys(comprehensiveData.gameSystems).length,
        allGameInfo: comprehensiveData.allGameInfo.length,
        uniqueKeywords: [...new Set(comprehensiveData.allGameInfo.flatMap(g => g.keywords))]
    };
    
    console.log('📊 Comprehensive Discord & Wiki Scraping Summary:');
    console.log(`- Discord channels: ${summary.discordChannels}`);
    console.log(`- Wiki pages: ${summary.wikiPages}`);
    console.log(`- Game systems: ${summary.gameSystems}`);
    console.log(`- All game info: ${summary.allGameInfo}`);
    console.log(`- Unique keywords: ${summary.uniqueKeywords.length}`);
    
    return comprehensiveData;
}

// Run the scraper
if (require.main === module) {
    scrapeComprehensiveDiscordAndWiki()
        .then(data => {
            console.log('✅ Comprehensive Discord & Wiki scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Comprehensive Discord & Wiki scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeComprehensiveDiscordAndWiki };
