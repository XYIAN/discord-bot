const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeRealDiscordChannels() {
    console.log('🚀 Starting REAL Discord channel scraper...');
    
    // Set up Chrome options to mimic human behavior
    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    options.addArguments('--window-size=1920,1080');
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    try {
        const discordData = {
            timestamp: new Date().toISOString(),
            channels: [],
            messages: [],
            gameInfo: []
        };
        
        // Discord channel URLs to scrape
        const channelUrls = [
            'https://discord.com/channels/1419944148701679686/1419944149410648115',
            'https://discord.com/channels/1268830572743102505/1324372368721838120'
        ];
        
        for (const url of channelUrls) {
            try {
                console.log(`📋 Scraping Discord channel: ${url}`);
                await driver.get(url);
                await driver.sleep(5000); // Wait for Discord to load
                
                // Wait for messages to load
                try {
                    await driver.wait(until.elementLocated(By.css('[data-list-item-id*="chat-messages"]')), 10000);
                    console.log('✅ Messages loaded');
                } catch (error) {
                    console.log('⚠️ Messages not found, trying alternative selectors...');
                }
                
                // Try to get channel name
                let channelName = 'Unknown Channel';
                try {
                    const channelElement = await driver.findElement(By.css('h1, [data-list-item-id*="channels"]'));
                    channelName = await channelElement.getText();
                } catch (error) {
                    console.log('⚠️ Could not get channel name');
                }
                
                // Get all messages
                const messageElements = await driver.findElements(By.css('[data-list-item-id*="chat-messages"], [class*="message"], [class*="chat"]'));
                console.log(`Found ${messageElements.length} message elements`);
                
                const channelData = {
                    url: url,
                    name: channelName,
                    messages: [],
                    gameInfo: []
                };
                
                // Scrape messages
                for (let i = 0; i < Math.min(messageElements.length, 50); i++) {
                    try {
                        const message = messageElements[i];
                        const messageText = await message.getText();
                        
                        if (messageText && messageText.length > 10) {
                            channelData.messages.push({
                                text: messageText,
                                timestamp: new Date().toISOString()
                            });
                            
                            // Look for game-related keywords
                            const gameKeywords = [
                                'weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 
                                'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild', 'expedition',
                                'staff', 'claws', 'crossbow', 'helix', 'alex', 'nyanja', 'rolla',
                                'loki', 'demon king', 'otta', 'thor', 'fishing', 'umbral', 'tempest',
                                'artifact', 'skill', 'event', 'arena', 'supreme', 'dragoon'
                            ];
                            
                            const foundKeywords = gameKeywords.filter(keyword => 
                                messageText.toLowerCase().includes(keyword.toLowerCase())
                            );
                            
                            if (foundKeywords.length > 0) {
                                channelData.gameInfo.push({
                                    keywords: foundKeywords,
                                    text: messageText.substring(0, 500),
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    } catch (error) {
                        // Skip problematic messages
                    }
                }
                
                discordData.channels.push(channelData);
                discordData.messages.push(...channelData.messages);
                discordData.gameInfo.push(...channelData.gameInfo);
                
                console.log(`✅ ${channelName} scraped: ${channelData.messages.length} messages, ${channelData.gameInfo.length} game info items`);
                
                // Human-like delay
                await driver.sleep(Math.random() * 3000 + 2000);
                
            } catch (error) {
                console.log(`⚠️ Error scraping channel ${url}: ${error.message}`);
            }
        }
        
        // Save comprehensive Discord data
        const filename = `discord-real-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(discordData, null, 2));
        console.log(`💾 Saved Discord data to ${filename}`);
        
        // Send summary
        const summary = {
            channelsScraped: discordData.channels.length,
            totalMessages: discordData.messages.length,
            gameInfoFound: discordData.gameInfo.length,
            uniqueKeywords: [...new Set(discordData.gameInfo.flatMap(g => g.keywords))]
        };
        
        console.log('📊 REAL Discord Scraping Summary:');
        console.log(`- Channels scraped: ${summary.channelsScraped}`);
        console.log(`- Total messages: ${summary.totalMessages}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords.join(', ')}`);
        
        return discordData;
        
    } catch (error) {
        console.error('❌ Discord scraping error:', error);
        throw error;
    } finally {
        await driver.quit();
        console.log('🔚 Browser closed');
    }
}

// Run the scraper
if (require.main === module) {
    scrapeRealDiscordChannels()
        .then(data => {
            console.log('✅ REAL Discord scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ REAL Discord scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeRealDiscordChannels };
