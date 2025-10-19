const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeDiscordWithExistingSession() {
    console.log('🚀 Starting Discord scraper with existing browser session...');
    
    // Set up Chrome options to use existing profile
    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    options.addArguments('--window-size=1920,1080');
    
    // Try to use existing Chrome profile
    const userDataDir = process.env.HOME + '/Library/Application Support/Google/Chrome';
    if (fs.existsSync(userDataDir)) {
        options.addArguments(`--user-data-dir=${userDataDir}`);
        console.log('✅ Using existing Chrome profile');
    }
    
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
        
        // Try to navigate to Discord
        console.log('🌐 Navigating to Discord...');
        await driver.get('https://discord.com/app');
        await driver.sleep(5000);
        
        // Check if we're logged in
        try {
            await driver.wait(until.elementLocated(By.css('[data-list-id="guildsnav"]')), 10000);
            console.log('✅ Discord loaded successfully');
        } catch (error) {
            console.log('⚠️ Discord not accessible, trying direct channel URLs...');
        }
        
        // Try direct channel URLs
        const channelUrls = [
            'https://discord.com/channels/1419944148701679686/1419944149410648115',
            'https://discord.com/channels/1268830572743102505/1324372368721838120'
        ];
        
        for (const url of channelUrls) {
            try {
                console.log(`📋 Scraping Discord channel: ${url}`);
                await driver.get(url);
                await driver.sleep(8000); // Wait longer for Discord to load
                
                // Try multiple selectors for messages
                const messageSelectors = [
                    '[data-list-item-id*="chat-messages"]',
                    '[class*="message"]',
                    '[class*="chat"]',
                    '[class*="content"]',
                    'div[role="listitem"]',
                    'div[data-list-item-id]'
                ];
                
                let messageElements = [];
                for (const selector of messageSelectors) {
                    try {
                        const elements = await driver.findElements(By.css(selector));
                        if (elements.length > 0) {
                            messageElements = elements;
                            console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
                            break;
                        }
                    } catch (error) {
                        // Try next selector
                    }
                }
                
                // Get page source to analyze
                const pageSource = await driver.getPageSource();
                const pageText = await driver.findElement(By.css('body')).getText();
                
                console.log(`📄 Page source length: ${pageSource.length}`);
                console.log(`📄 Page text length: ${pageText.length}`);
                
                // Look for game-related content in page text
                const gameKeywords = [
                    'weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 
                    'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild', 'expedition',
                    'staff', 'claws', 'crossbow', 'helix', 'alex', 'nyanja', 'rolla',
                    'loki', 'demon king', 'otta', 'thor', 'fishing', 'umbral', 'tempest',
                    'artifact', 'skill', 'event', 'arena', 'supreme', 'dragoon'
                ];
                
                const foundKeywords = gameKeywords.filter(keyword => 
                    pageText.toLowerCase().includes(keyword.toLowerCase())
                );
                
                const channelData = {
                    url: url,
                    name: 'Discord Channel',
                    messages: [],
                    gameInfo: [],
                    pageText: pageText.substring(0, 2000),
                    foundKeywords: foundKeywords
                };
                
                if (foundKeywords.length > 0) {
                    channelData.gameInfo.push({
                        keywords: foundKeywords,
                        text: pageText.substring(0, 1000),
                        timestamp: new Date().toISOString()
                    });
                }
                
                discordData.channels.push(channelData);
                discordData.messages.push(...channelData.messages);
                discordData.gameInfo.push(...channelData.gameInfo);
                
                console.log(`✅ Channel scraped: ${foundKeywords.length} keywords found`);
                
                // Human-like delay
                await driver.sleep(Math.random() * 3000 + 2000);
                
            } catch (error) {
                console.log(`⚠️ Error scraping channel ${url}: ${error.message}`);
            }
        }
        
        // Save comprehensive Discord data
        const filename = `discord-browser-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(discordData, null, 2));
        console.log(`💾 Saved Discord data to ${filename}`);
        
        // Send summary
        const summary = {
            channelsScraped: discordData.channels.length,
            totalMessages: discordData.messages.length,
            gameInfoFound: discordData.gameInfo.length,
            uniqueKeywords: [...new Set(discordData.gameInfo.flatMap(g => g.keywords))]
        };
        
        console.log('📊 Discord Browser Scraping Summary:');
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
    scrapeDiscordWithExistingSession()
        .then(data => {
            console.log('✅ Discord browser scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Discord browser scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeDiscordWithExistingSession };
