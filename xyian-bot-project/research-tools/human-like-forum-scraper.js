const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

// Human-like delay function
function humanDelay(min = 2000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Random human-like scrolling
async function humanScroll(driver) {
    const scrollCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrollCount; i++) {
        await driver.executeScript("window.scrollBy(0, Math.floor(Math.random() * 500) + 200);");
        await humanDelay(1000, 2000);
    }
}

async function scrapeHumanLikeForum() {
    console.log('🚀 Starting HUMAN-LIKE forum scraper...');
    
    let driver;
    const allData = {
        timestamp: new Date().toISOString(),
        sources: [],
        forumThreads: [],
        gameInfo: [],
        allLinks: []
    };
    
    try {
        // Set up Chrome with human-like settings
        const options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.addArguments('--disable-extensions');
        options.addArguments('--disable-plugins');
        options.addArguments('--disable-images');
        
        driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        // Navigate to Discord first
        console.log('🌐 Opening Discord...');
        await driver.get('https://discord.com/app');
        
        // 3-minute timer for manual login
        console.log('⏰ Waiting 3 minutes for you to ensure you\'re logged in...');
        console.log('Please make sure you\'re logged in to Discord in the browser window.');
        console.log('The scraper will start in 3 minutes...');
        
        for (let i = 3; i > 0; i--) {
            console.log(`⏳ ${i} minutes remaining...`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        }
        
        console.log('🚀 Starting HUMAN-LIKE forum scraping now!');
        
        // Table of contents channel
        const tocUrl = 'https://discord.com/channels/1268830572743102505/1361165578001322175';
        
        try {
            console.log(`📋 Navigating to table of contents: ${tocUrl}`);
            
            // Navigate to the table of contents
            await driver.get(tocUrl);
            await humanDelay(5000, 8000); // Wait 5-8 seconds like a human
            
            // Human-like scrolling to load content
            console.log('🔄 Scrolling to load content...');
            await humanScroll(driver);
            await humanDelay(3000, 5000);
            
            // Look for different types of links
            console.log('🔍 Looking for channel links...');
            
            // Try different selectors for links
            const linkSelectors = [
                'a[href*="/channels/"]',
                'a[href*="discord.com/channels"]',
                '[data-list-item-id]',
                '.thread-item',
                '.channel-item'
            ];
            
            let allChannelLinks = [];
            
            for (const selector of linkSelectors) {
                try {
                    const linkElements = await driver.findElements(By.css(selector));
                    console.log(`Found ${linkElements.length} elements with selector: ${selector}`);
                    
                    for (const linkElement of linkElements) {
                        try {
                            const href = await linkElement.getAttribute('href');
                            if (href && href.includes('/channels/')) {
                                allChannelLinks.push(href);
                                console.log(`📎 Found link: ${href}`);
                            }
                        } catch (error) {
                            // Ignore individual link errors
                        }
                    }
                    
                    await humanDelay(2000, 4000); // Human-like pause between selectors
                } catch (error) {
                    console.log(`⚠️ Selector ${selector} failed: ${error.message}`);
                }
            }
            
            // Remove duplicates
            const uniqueLinks = [...new Set(allChannelLinks)];
            console.log(`📊 Found ${uniqueLinks.length} unique channel links`);
            
            allData.allLinks = uniqueLinks;
            
            // Now scrape each channel/thread with human-like behavior
            const maxThreads = Math.min(uniqueLinks.length, 10); // Limit to 10 for now
            console.log(`📋 Will scrape ${maxThreads} threads with human-like behavior...`);
            
            for (let i = 0; i < maxThreads; i++) {
                const channelUrl = uniqueLinks[i];
                try {
                    console.log(`📋 Scraping thread ${i + 1}/${maxThreads}: ${channelUrl}`);
                    
                    // Human-like navigation
                    await driver.get(channelUrl);
                    await humanDelay(4000, 7000); // Wait 4-7 seconds like a human
                    
                    // Human-like scrolling
                    await humanScroll(driver);
                    await humanDelay(2000, 4000);
                    
                    const pageTitle = await driver.getTitle();
                    const pageSource = await driver.getPageSource();
                    const channelId = channelUrl.split('/').pop();
                    
                    allData.forumThreads.push({
                        url: channelUrl,
                        channelId: channelId,
                        contentLength: pageSource.length,
                        pageTitle: pageTitle,
                        scraped: true
                    });
                    
                    // Extract game-related content
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
                        'sequence', 'timing', 'execution', 'mechanics', 'interaction',
                        'mythstone', 'chest', 'rotation', 'spend', 'guide', 'youtube',
                        'mastery', 'equipment', 'gear', 'ultimate', 'questions',
                        'forum', 'thread', 'discussion', 'update', 'announcement',
                        'patch', 'notes', 'balance', 'nerf', 'buff', 'meta',
                        'table', 'contents', 'toc', 'index', 'list', 'directory'
                    ];
                    
                    const foundKeywords = gameKeywords.filter(keyword => 
                        pageSource.toLowerCase().includes(keyword.toLowerCase())
                    );
                    
                    if (foundKeywords.length > 0) {
                        allData.gameInfo.push({
                            source: 'Forum Thread',
                            channel: channelId,
                            keywords: foundKeywords,
                            content: pageSource.substring(0, 2000),
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    console.log(`✅ Thread ${channelId} scraped: ${foundKeywords.length} keywords found`);
                    
                    // Human-like break between threads
                    if (i < maxThreads - 1) {
                        console.log('😴 Taking a human-like break...');
                        await humanDelay(8000, 15000); // 8-15 second break like a human
                    }
                    
                } catch (error) {
                    console.log(`⚠️ Failed to scrape thread ${channelUrl}: ${error.message}`);
                    allData.forumThreads.push({
                        url: channelUrl,
                        channelId: channelUrl.split('/').pop(),
                        error: error.message,
                        scraped: false
                    });
                    
                    // Human-like pause even on errors
                    await humanDelay(3000, 6000);
                }
            }
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape table of contents: ${error.message}`);
        }
        
        // Save all forum data
        const filename = `human-like-forum-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
        console.log(`💾 Saved all forum data to ${filename}`);
        
        // Send summary
        const summary = {
            threadsScraped: allData.forumThreads.filter(t => t.scraped).length,
            threadsFailed: allData.forumThreads.filter(t => !t.scraped).length,
            gameInfoFound: allData.gameInfo.length,
            uniqueKeywords: [...new Set(allData.gameInfo.flatMap(g => g.keywords))].length,
            totalLinks: allData.allLinks.length
        };
        
        console.log('📊 Human-Like Forum Scraping Summary:');
        console.log(`- Threads scraped: ${summary.threadsScraped}`);
        console.log(`- Threads failed: ${summary.threadsFailed}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total links found: ${summary.totalLinks}`);
        
        return allData;
        
    } catch (error) {
        console.error('❌ Human-like forum scraping failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// Run the scraper
if (require.main === module) {
    scrapeHumanLikeForum()
        .then(data => {
            console.log('✅ Human-like forum scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Human-like forum scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeHumanLikeForum };
