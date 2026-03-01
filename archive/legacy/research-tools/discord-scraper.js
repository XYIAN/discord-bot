const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeArchero2Discord() {
    console.log('🚀 Starting Archero 2 Discord scraper...');
    
    // Set up Chrome options to mimic human behavior
    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--disable-features=VizDisplayCompositor');
    options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    try {
        console.log('🌐 Navigating to Discord...');
        await driver.get('https://discord.com/app');
        
        // Wait for Discord to load
        await driver.sleep(3000);
        console.log('⏳ Waiting for Discord to load...');
        
        // Wait for user to be logged in (check for server list)
        await driver.wait(until.elementLocated(By.css('[data-list-id="guildsnav"]')), 30000);
        console.log('✅ Discord loaded successfully');
        
        // Navigate to Archero 2 server
        console.log('🎯 Looking for Archero 2 server...');
        await driver.sleep(2000);
        
        // Try to find and click on Archero 2 server
        try {
            const archeroServer = await driver.findElement(By.xpath("//div[contains(text(), 'Archero 2') or contains(text(), 'archero')]"));
            await archeroServer.click();
            console.log('✅ Found and clicked Archero 2 server');
            await driver.sleep(3000);
        } catch (error) {
            console.log('⚠️ Could not find Archero 2 server automatically, continuing...');
        }
        
        // Look for channels and gather information
        console.log('📋 Scraping channel information...');
        
        const channels = await driver.findElements(By.css('[data-list-item-id*="channels"]'));
        console.log(`Found ${channels.length} channels`);
        
        const scrapedData = {
            timestamp: new Date().toISOString(),
            channels: [],
            messages: [],
            gameInfo: []
        };
        
        // Scrape channel names and types
        for (let i = 0; i < Math.min(channels.length, 20); i++) {
            try {
                const channel = channels[i];
                const channelName = await channel.getText();
                const channelType = await channel.getAttribute('data-list-item-id');
                
                scrapedData.channels.push({
                    name: channelName,
                    type: channelType,
                    index: i
                });
                
                console.log(`📝 Found channel: ${channelName}`);
                
                // Click on channel to see messages
                await channel.click();
                await driver.sleep(1000);
                
                // Look for messages in this channel
                const messages = await driver.findElements(By.css('[data-list-item-id*="chat-messages"]'));
                console.log(`Found ${messages.length} messages in ${channelName}`);
                
                // Scrape first few messages for game info
                for (let j = 0; j < Math.min(messages.length, 5); j++) {
                    try {
                        const message = messages[j];
                        const messageText = await message.getText();
                        
                        if (messageText && messageText.length > 10) {
                            scrapedData.messages.push({
                                channel: channelName,
                                text: messageText,
                                timestamp: new Date().toISOString()
                            });
                            
                            // Look for game-related keywords
                            const gameKeywords = ['weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 'upgrade', 'tier', 'mythic', 'chaotic'];
                            const foundKeywords = gameKeywords.filter(keyword => 
                                messageText.toLowerCase().includes(keyword.toLowerCase())
                            );
                            
                            if (foundKeywords.length > 0) {
                                scrapedData.gameInfo.push({
                                    channel: channelName,
                                    keywords: foundKeywords,
                                    text: messageText.substring(0, 200) + '...',
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    } catch (error) {
                        // Skip problematic messages
                    }
                }
                
                // Human-like delay
                await driver.sleep(Math.random() * 2000 + 1000);
                
            } catch (error) {
                console.log(`⚠️ Error processing channel ${i}: ${error.message}`);
            }
        }
        
        // Save scraped data
        const filename = `archero2-discord-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(scrapedData, null, 2));
        console.log(`💾 Saved scraped data to ${filename}`);
        
        // Send summary to debug channel
        const summary = {
            channelsFound: scrapedData.channels.length,
            messagesScraped: scrapedData.messages.length,
            gameInfoFound: scrapedData.gameInfo.length,
            topChannels: scrapedData.channels.slice(0, 10).map(c => c.name),
            gameKeywords: [...new Set(scrapedData.gameInfo.flatMap(g => g.keywords))]
        };
        
        console.log('📊 Scraping Summary:');
        console.log(`- Channels found: ${summary.channelsFound}`);
        console.log(`- Messages scraped: ${summary.messagesScraped}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
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
    scrapeArchero2Discord()
        .then(data => {
            console.log('✅ Scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeArchero2Discord };
