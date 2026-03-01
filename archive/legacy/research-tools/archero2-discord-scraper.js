const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeArchero2DiscordServer() {
    console.log('🚀 Starting comprehensive Archero 2 Discord server scraper...');
    
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
        console.log('🌐 Navigating to Archero 2 Discord invite...');
        await driver.get('https://discord.gg/archero2');
        
        // Wait for Discord to load
        await driver.sleep(5000);
        console.log('⏳ Waiting for Discord to load...');
        
        // Wait for server to be accessible
        try {
            await driver.wait(until.elementLocated(By.css('[data-list-id="guildsnav"]')), 30000);
            console.log('✅ Discord server loaded successfully');
        } catch (error) {
            console.log('⚠️ Discord server not accessible, trying alternative approach...');
        }
        
        const scrapedData = {
            timestamp: new Date().toISOString(),
            serverInfo: {},
            channels: [],
            messages: [],
            gameInfo: [],
            weapons: [],
            characters: [],
            events: [],
            mechanics: []
        };
        
        // Try to get server information
        try {
            const serverName = await driver.findElement(By.css('h1')).getText();
            scrapedData.serverInfo.name = serverName;
            console.log(`📋 Server name: ${serverName}`);
        } catch (error) {
            console.log('⚠️ Could not get server name');
        }
        
        // Look for channels
        try {
            console.log('📋 Scraping channels...');
            const channelElements = await driver.findElements(By.css('[data-list-item-id*="channels"]'));
            console.log(`Found ${channelElements.length} channel elements`);
            
            for (let i = 0; i < Math.min(channelElements.length, 30); i++) {
                try {
                    const channel = channelElements[i];
                    const channelName = await channel.getText();
                    const channelType = await channel.getAttribute('data-list-item-id');
                    
                    scrapedData.channels.push({
                        name: channelName,
                        type: channelType,
                        index: i
                    });
                    
                    console.log(`📝 Channel: ${channelName}`);
                    
                    // Click on channel to see messages
                    await channel.click();
                    await driver.sleep(2000);
                    
                    // Look for messages in this channel
                    const messageElements = await driver.findElements(By.css('[data-list-item-id*="chat-messages"]'));
                    console.log(`Found ${messageElements.length} messages in ${channelName}`);
                    
                    // Scrape first few messages for game info
                    for (let j = 0; j < Math.min(messageElements.length, 10); j++) {
                        try {
                            const message = messageElements[j];
                            const messageText = await message.getText();
                            
                            if (messageText && messageText.length > 10) {
                                scrapedData.messages.push({
                                    channel: channelName,
                                    text: messageText,
                                    timestamp: new Date().toISOString()
                                });
                                
                                // Look for game-related keywords
                                const gameKeywords = [
                                    'weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 
                                    'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild', 'expedition',
                                    'staff', 'claws', 'crossbow', 'helix', 'alex', 'nyanja', 'rolla',
                                    'loki', 'demon king', 'otta', 'thor', 'fishing', 'umbral', 'tempest'
                                ];
                                
                                const foundKeywords = gameKeywords.filter(keyword => 
                                    messageText.toLowerCase().includes(keyword.toLowerCase())
                                );
                                
                                if (foundKeywords.length > 0) {
                                    scrapedData.gameInfo.push({
                                        channel: channelName,
                                        keywords: foundKeywords,
                                        text: messageText.substring(0, 300) + '...',
                                        timestamp: new Date().toISOString()
                                    });
                                    
                                    // Extract specific game information
                                    if (messageText.toLowerCase().includes('weapon')) {
                                        scrapedData.weapons.push({
                                            channel: channelName,
                                            info: messageText.substring(0, 200),
                                            timestamp: new Date().toISOString()
                                        });
                                    }
                                    
                                    if (messageText.toLowerCase().includes('character') || messageText.toLowerCase().includes('resonance')) {
                                        scrapedData.characters.push({
                                            channel: channelName,
                                            info: messageText.substring(0, 200),
                                            timestamp: new Date().toISOString()
                                        });
                                    }
                                    
                                    if (messageText.toLowerCase().includes('event') || messageText.toLowerCase().includes('fishing') || messageText.toLowerCase().includes('umbral')) {
                                        scrapedData.events.push({
                                            channel: channelName,
                                            info: messageText.substring(0, 200),
                                            timestamp: new Date().toISOString()
                                        });
                                    }
                                }
                            }
                        } catch (error) {
                            // Skip problematic messages
                        }
                    }
                    
                    // Human-like delay
                    await driver.sleep(Math.random() * 3000 + 2000);
                    
                } catch (error) {
                    console.log(`⚠️ Error processing channel ${i}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log('⚠️ Could not access channels:', error.message);
        }
        
        // Look for any visible text that might contain game information
        try {
            console.log('🔍 Analyzing page content for game information...');
            const allText = await driver.findElement(By.css('body')).getText();
            
            // Extract game information from page content
            const weaponMatches = allText.match(/weapon[^<]*/gi) || [];
            const characterMatches = allText.match(/character[^<]*/gi) || [];
            const eventMatches = allText.match(/event[^<]*/gi) || [];
            const resonanceMatches = allText.match(/resonance[^<]*/gi) || [];
            
            scrapedData.weapons.push(...weaponMatches.slice(0, 10));
            scrapedData.characters.push(...characterMatches.slice(0, 10));
            scrapedData.events.push(...eventMatches.slice(0, 10));
            scrapedData.mechanics.push(...resonanceMatches.slice(0, 10));
            
            console.log(`🎮 Found ${weaponMatches.length} weapon references, ${characterMatches.length} character references, ${eventMatches.length} event references`);
        } catch (error) {
            console.log('⚠️ Could not analyze page content');
        }
        
        // Save comprehensive scraped data
        const filename = `archero2-discord-server-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(scrapedData, null, 2));
        console.log(`💾 Saved comprehensive data to ${filename}`);
        
        // Send summary to debug channel
        const summary = {
            serverName: scrapedData.serverInfo.name || 'Unknown',
            channelsFound: scrapedData.channels.length,
            messagesScraped: scrapedData.messages.length,
            gameInfoFound: scrapedData.gameInfo.length,
            weaponsFound: scrapedData.weapons.length,
            charactersFound: scrapedData.characters.length,
            eventsFound: scrapedData.events.length,
            mechanicsFound: scrapedData.mechanics.length,
            topChannels: scrapedData.channels.slice(0, 10).map(c => c.name),
            gameKeywords: [...new Set(scrapedData.gameInfo.flatMap(g => g.keywords))]
        };
        
        console.log('📊 Comprehensive Scraping Summary:');
        console.log(`- Server: ${summary.serverName}`);
        console.log(`- Channels: ${summary.channelsFound}`);
        console.log(`- Messages: ${summary.messagesScraped}`);
        console.log(`- Game info: ${summary.gameInfoFound}`);
        console.log(`- Weapons: ${summary.weaponsFound}`);
        console.log(`- Characters: ${summary.charactersFound}`);
        console.log(`- Events: ${summary.eventsFound}`);
        console.log(`- Mechanics: ${summary.mechanicsFound}`);
        console.log(`- Top channels: ${summary.topChannels.join(', ')}`);
        console.log(`- Game keywords: ${summary.gameKeywords.join(', ')}`);
        
        return scrapedData;
        
    } catch (error) {
        console.error('❌ Scraping error:', error);
        throw error;
    } finally {
        await driver.quit();
        console.log('🔚 Browser closed');
    }
}

// Run the scraper
if (require.main === module) {
    scrapeArchero2DiscordServer()
        .then(data => {
            console.log('✅ Comprehensive scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Comprehensive scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeArchero2DiscordServer };
