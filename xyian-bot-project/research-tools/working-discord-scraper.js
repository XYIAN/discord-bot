const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeWorkingDiscordChannels() {
    console.log('🚀 Starting working Discord channels scraper...');
    
    let driver;
    const allData = {
        timestamp: new Date().toISOString(),
        sources: [],
        discordChannels: [],
        gameInfo: []
    };
    
    try {
        // Set up Chrome with a different approach
        const options = new chrome.Options();
        // Don't use user data directory - start fresh
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');
        
        driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        // Navigate to Discord first
        console.log('🌐 Opening Discord...');
        await driver.get('https://discord.com/app');
        
        // 5-minute timer for manual login
        console.log('⏰ Waiting 5 minutes for you to manually log in to Discord...');
        console.log('Please log in to Discord in the browser window that just opened.');
        console.log('The scraper will start in 5 minutes...');
        
        for (let i = 5; i > 0; i--) {
            console.log(`⏳ ${i} minutes remaining...`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        }
        
        console.log('🚀 Starting Discord scraping now!');
        
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
                
                // Wait a bit for the page to load
                await driver.sleep(5000);
                
                // Check if we're on Discord login page or actual channel
                const pageTitle = await driver.getTitle();
                console.log(`Page title: ${pageTitle}`);
                
                // Get page source to see what we actually got
                const pageSource = await driver.getPageSource();
                const channelId = channelUrl.split('/').pop();
                
                // Check if we got the login page or actual content
                const isLoginPage = pageSource.includes('Discord - Group Chat') && !pageSource.includes('chat-messages');
                const hasMessages = pageSource.includes('chat-messages') || pageSource.includes('message');
                
                allData.discordChannels.push({
                    url: channelUrl,
                    channelId: channelId,
                    contentLength: pageSource.length,
                    pageTitle: pageTitle,
                    isLoginPage: isLoginPage,
                    hasMessages: hasMessages,
                    scraped: !isLoginPage
                });
                
                // Extract any game-related content if we got real content
                if (!isLoginPage && hasMessages) {
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
                        'level', 'experience', 'power', 'stats', 'bonus', 'effect'
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
                    
                    console.log(`✅ Discord channel ${channelId} scraped: ${foundKeywords.length} keywords found`);
                } else {
                    console.log(`⚠️ Discord channel ${channelId} - got login page or no messages`);
                }
                
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
        const filename = `working-discord-channels-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
        console.log(`💾 Saved all channel data to ${filename}`);
        
        // Send summary
        const summary = {
            channelsScraped: allData.discordChannels.filter(c => c.scraped).length,
            channelsFailed: allData.discordChannels.filter(c => !c.scraped).length,
            gameInfoFound: allData.gameInfo.length,
            uniqueKeywords: [...new Set(allData.gameInfo.flatMap(g => g.keywords))].length
        };
        
        console.log('📊 Working Discord Channels Scraping Summary:');
        console.log(`- Channels scraped: ${summary.channelsScraped}`);
        console.log(`- Channels failed: ${summary.channelsFailed}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        
        return allData;
        
    } catch (error) {
        console.error('❌ Working Discord scraping failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// Run the scraper
if (require.main === module) {
    scrapeWorkingDiscordChannels()
        .then(data => {
            console.log('✅ Working Discord channels scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Working Discord channels scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeWorkingDiscordChannels };
