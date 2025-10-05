const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeRealDiscordChannels() {
    console.log('🚀 Starting REAL Discord channels scraper...');
    
    let driver;
    const allData = {
        timestamp: new Date().toISOString(),
        sources: [],
        discordChannels: [],
        gameInfo: []
    };
    
    try {
        // Set up Chrome with user data directory to use existing session
        const options = new chrome.Options();
        options.addArguments('--user-data-dir=/Users/kyle/Library/Application Support/Google/Chrome');
        options.addArguments('--profile-directory=Default');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        // Discord channel URLs
        const discordChannels = [
            'https://discord.com/channels/1268830572743102505/1347635565876744263',
            'https://discord.com/channels/1268830572743102505/1341711135631736893',
            'https://discord.com/channels/1268830572743102505/1340792565095731290',
            'https://discord.com/channels/1268830572743102505/1319256240228143165',
            'https://discord.com/channels/1268830572743102505/1268830572743102508',
            'https://discord.com/channels/1268830572743102505/1268835262159654932'
        ];
        
        for (const channelUrl of discordChannels) {
            try {
                console.log(`📋 Scraping Discord channel: ${channelUrl}`);
                
                // Navigate to the channel
                await driver.get(channelUrl);
                
                // Wait for Discord to load
                await driver.wait(until.titleContains('Discord'), 10000);
                
                // Wait for messages to load
                await driver.sleep(3000);
                
                // Try to find message elements
                const messages = await driver.findElements(By.css('[data-list-item-id*="chat-messages"]'));
                console.log(`Found ${messages.length} message elements`);
                
                // Get page source to see what we actually got
                const pageSource = await driver.getPageSource();
                const channelId = channelUrl.split('/').pop();
                
                allData.discordChannels.push({
                    url: channelUrl,
                    channelId: channelId,
                    contentLength: pageSource.length,
                    messagesFound: messages.length,
                    scraped: true
                });
                
                // Extract any game-related content
                const gameKeywords = [
                    'weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 
                    'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild', 'expedition',
                    'staff', 'claws', 'crossbow', 'helix', 'alex', 'nyanja', 'rolla',
                    'loki', 'demon king', 'otta', 'thor', 'fishing', 'umbral', 'tempest',
                    'artifact', 'skill', 'event', 'arena', 'supreme', 'dragoon',
                    'rune', 'gear', 'equipment', 'upgrade', 'enhancement', 'build',
                    'strategy', 'tip', 'guide', 'help', 'question', 'answer',
                    'pvp', 'arena', 'supreme', 'battle', 'combat', 'damage',
                    'defense', 'attack', 'speed', 'crit', 'dodge', 'health',
                    'talent', 'card', 'upgrade', 'enhancement', 'progression',
                    'level', 'experience', 'power', 'stats', 'bonus', 'effect',
                    'hero', 'heroes', 'ability', 'abilities', 'passive', 'active',
                    'cooldown', 'duration', 'range', 'area', 'single', 'target',
                    'multi', 'target', 'chain', 'bounce', 'pierce', 'explode',
                    'poison', 'fire', 'ice', 'lightning', 'dark', 'light',
                    'element', 'elemental', 'resistance', 'immunity', 'weakness',
                    'strength', 'advantage', 'disadvantage', 'counter', 'synergy',
                    'combo', 'combination', 'rotation', 'priority', 'order',
                    'sequence', 'timing', 'execution', 'mechanics', 'interaction'
                ];
                
                const foundKeywords = gameKeywords.filter(keyword => 
                    pageSource.toLowerCase().includes(keyword.toLowerCase())
                );
                
                if (foundKeywords.length > 0) {
                    allData.gameInfo.push({
                        source: 'Discord',
                        channel: channelId,
                        keywords: foundKeywords,
                        content: pageSource.substring(0, 2000),
                        timestamp: new Date().toISOString()
                    });
                }
                
                console.log(`✅ Discord channel ${channelId} scraped: ${foundKeywords.length} keywords found, ${messages.length} messages`);
                
                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`⚠️ Failed to scrape Discord channel ${channelUrl}: ${error.message}`);
                allData.discordChannels.push({
                    url: channelUrl,
                    channelId: channelUrl.split('/').pop(),
                    error: error.message,
                    scraped: false
                });
            }
        }
        
        // Save all channel data
        const filename = `real-discord-channels-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
        console.log(`💾 Saved all channel data to ${filename}`);
        
        // Send summary
        const summary = {
            channelsScraped: allData.discordChannels.filter(c => c.scraped).length,
            channelsFailed: allData.discordChannels.filter(c => !c.scraped).length,
            gameInfoFound: allData.gameInfo.length,
            uniqueKeywords: [...new Set(allData.gameInfo.flatMap(g => g.keywords))].length
        };
        
        console.log('📊 Real Discord Channels Scraping Summary:');
        console.log(`- Channels scraped: ${summary.channelsScraped}`);
        console.log(`- Channels failed: ${summary.channelsFailed}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        
        return allData;
        
    } catch (error) {
        console.error('❌ Real Discord scraping failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// Run the scraper
if (require.main === module) {
    scrapeRealDiscordChannels()
        .then(data => {
            console.log('✅ Real Discord channels scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Real Discord channels scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeRealDiscordChannels };
