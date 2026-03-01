const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeArchero2DiscordInvite() {
    console.log('🚀 Starting Archero 2 Discord invite scraper...');
    
    // Set up Chrome options to mimic human behavior
    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    try {
        console.log('🌐 Navigating to Archero 2 Discord invite...');
        await driver.get('https://discord.gg/archero2');
        
        // Wait for invite page to load
        await driver.sleep(5000);
        console.log('⏳ Waiting for invite page to load...');
        
        // Look for server information
        const scrapedData = {
            timestamp: new Date().toISOString(),
            serverInfo: {},
            channels: [],
            gameInfo: []
        };
        
        try {
            // Try to get server name
            const serverName = await driver.findElement(By.css('h1')).getText();
            scrapedData.serverInfo.name = serverName;
            console.log(`📋 Server name: ${serverName}`);
        } catch (error) {
            console.log('⚠️ Could not get server name');
        }
        
        try {
            // Look for member count
            const memberCount = await driver.findElement(By.css('[class*="memberCount"]')).getText();
            scrapedData.serverInfo.memberCount = memberCount;
            console.log(`👥 Member count: ${memberCount}`);
        } catch (error) {
            console.log('⚠️ Could not get member count');
        }
        
        try {
            // Look for channel list
            const channels = await driver.findElements(By.css('[class*="channel"]'));
            console.log(`📋 Found ${channels.length} channels`);
            
            for (let i = 0; i < Math.min(channels.length, 10); i++) {
                try {
                    const channel = channels[i];
                    const channelName = await channel.getText();
                    const channelType = await channel.getAttribute('class');
                    
                    scrapedData.channels.push({
                        name: channelName,
                        type: channelType,
                        index: i
                    });
                    
                    console.log(`📝 Channel: ${channelName}`);
                } catch (error) {
                    // Skip problematic channels
                }
            }
        } catch (error) {
            console.log('⚠️ Could not get channel list');
        }
        
        // Look for any visible text that might contain game information
        try {
            const allText = await driver.findElement(By.css('body')).getText();
            const gameKeywords = ['weapon', 'character', 'resonance', 'oracle', 'dragon', 'griffin', 'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild', 'expedition'];
            
            const foundKeywords = gameKeywords.filter(keyword => 
                allText.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
                scrapedData.gameInfo.push({
                    keywords: foundKeywords,
                    source: 'invite_page',
                    timestamp: new Date().toISOString()
                });
                console.log(`🎮 Game keywords found: ${foundKeywords.join(', ')}`);
            }
        } catch (error) {
            console.log('⚠️ Could not analyze page text');
        }
        
        // Save scraped data
        const filename = `archero2-discord-invite-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(scrapedData, null, 2));
        console.log(`💾 Saved scraped data to ${filename}`);
        
        // Send summary to debug channel
        const summary = {
            serverName: scrapedData.serverInfo.name || 'Unknown',
            memberCount: scrapedData.serverInfo.memberCount || 'Unknown',
            channelsFound: scrapedData.channels.length,
            gameKeywords: scrapedData.gameInfo.length > 0 ? scrapedData.gameInfo[0].keywords : []
        };
        
        console.log('📊 Scraping Summary:');
        console.log(`- Server: ${summary.serverName}`);
        console.log(`- Members: ${summary.memberCount}`);
        console.log(`- Channels: ${summary.channelsFound}`);
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
    scrapeArchero2DiscordInvite()
        .then(data => {
            console.log('✅ Scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeArchero2DiscordInvite };
