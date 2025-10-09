const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeComprehensiveForum() {
    console.log('🚀 Starting COMPREHENSIVE forum scraper...');
    
    let driver;
    const allData = {
        timestamp: new Date().toISOString(),
        sources: [],
        forumThreads: [],
        gameInfo: [],
        allLinks: []
    };
    
    try {
        // Set up Chrome
        const options = new chrome.Options();
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
        
        // 1-minute timer for manual login
        console.log('⏰ Waiting 1 minute for you to ensure you\'re logged in...');
        console.log('Please make sure you\'re logged in to Discord in the browser window.');
        console.log('The scraper will start in 1 minute...');
        
        for (let i = 1; i > 0; i--) {
            console.log(`⏳ ${i} minutes remaining...`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        }
        
        console.log('🚀 Starting COMPREHENSIVE forum scraping now!');
        
        // Table of contents channel
        const tocUrl = 'https://discord.com/channels/1268830572743102505/1361165578001322175';
        
        try {
            console.log(`📋 Scraping table of contents: ${tocUrl}`);
            
            // Navigate to the table of contents
            await driver.get(tocUrl);
            await driver.sleep(5000);
            
            // Get all links from the table of contents
            const linkElements = await driver.findElements(By.css('a[href*="/channels/"]'));
            console.log(`Found ${linkElements.length} channel links in table of contents`);
            
            const allChannelLinks = [];
            for (const linkElement of linkElements) {
                try {
                    const href = await linkElement.getAttribute('href');
                    if (href && href.includes('/channels/')) {
                        allChannelLinks.push(href);
                        console.log(`📎 Found link: ${href}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Could not get link: ${error.message}`);
                }
            }
            
            // Remove duplicates
            const uniqueLinks = [...new Set(allChannelLinks)];
            console.log(`📊 Found ${uniqueLinks.length} unique channel links`);
            
            allData.allLinks = uniqueLinks;
            
            // Now scrape each channel/thread
            for (let i = 0; i < Math.min(uniqueLinks.length, 20); i++) {
                const channelUrl = uniqueLinks[i];
                try {
                    console.log(`📋 Scraping channel ${i + 1}/${Math.min(uniqueLinks.length, 20)}: ${channelUrl}`);
                    
                    await driver.get(channelUrl);
                    await driver.sleep(3000);
                    
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
                    
                    console.log(`✅ Channel ${channelId} scraped: ${foundKeywords.length} keywords found`);
                    
                    // Small delay to be respectful
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.log(`⚠️ Failed to scrape channel ${channelUrl}: ${error.message}`);
                    allData.forumThreads.push({
                        url: channelUrl,
                        channelId: channelUrl.split('/').pop(),
                        error: error.message,
                        scraped: false
                    });
                }
            }
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape table of contents: ${error.message}`);
        }
        
        // Save all forum data
        const filename = `comprehensive-forum-data-${Date.now()}.json`;
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
        
        console.log('📊 Comprehensive Forum Scraping Summary:');
        console.log(`- Threads scraped: ${summary.threadsScraped}`);
        console.log(`- Threads failed: ${summary.threadsFailed}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        console.log(`- Total links found: ${summary.totalLinks}`);
        
        return allData;
        
    } catch (error) {
        console.error('❌ Comprehensive forum scraping failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// Run the scraper
if (require.main === module) {
    scrapeComprehensiveForum()
        .then(data => {
            console.log('✅ Comprehensive forum scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Comprehensive forum scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeComprehensiveForum };
