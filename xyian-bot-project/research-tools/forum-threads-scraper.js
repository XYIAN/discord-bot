const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeForumThreads() {
    console.log('🚀 Starting forum threads scraper...');
    
    let driver;
    const allData = {
        timestamp: new Date().toISOString(),
        sources: [],
        forumThreads: [],
        gameInfo: []
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
        
        console.log('🚀 Starting forum threads scraping now!');
        
        // Forum channel URL
        const forumUrl = 'https://discord.com/channels/1268830572743102505/1293617132373803028';
        
        try {
            console.log(`📋 Scraping forum channel: ${forumUrl}`);
            
            // Navigate to the forum channel
            await driver.get(forumUrl);
            
            // Wait for the page to load
            await driver.sleep(5000);
            
            // Try to find and click on threads
            try {
                const threadElements = await driver.findElements(By.css('[data-list-item-id*="thread"]'));
                console.log(`Found ${threadElements.length} thread elements`);
                
                // Click on each thread to get content
                for (let i = 0; i < Math.min(threadElements.length, 10); i++) {
                    try {
                        console.log(`📋 Scraping thread ${i + 1}...`);
                        await threadElements[i].click();
                        await driver.sleep(3000);
                        
                        const threadTitle = await driver.getTitle();
                        const threadSource = await driver.getPageSource();
                        
                        allData.forumThreads.push({
                            threadIndex: i + 1,
                            title: threadTitle,
                            contentLength: threadSource.length,
                            scraped: true
                        });
                        
                        // Go back to forum
                        await driver.get(forumUrl);
                        await driver.sleep(2000);
                        
                    } catch (error) {
                        console.log(`⚠️ Failed to scrape thread ${i + 1}: ${error.message}`);
                    }
                }
            } catch (error) {
                console.log(`⚠️ Could not find threads: ${error.message}`);
            }
            
            // Get the main forum content
            const pageTitle = await driver.getTitle();
            const pageSource = await driver.getPageSource();
            const channelId = forumUrl.split('/').pop();
            
            allData.forumThreads.push({
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
                'patch', 'notes', 'balance', 'nerf', 'buff', 'meta'
            ];
            
            const foundKeywords = gameKeywords.filter(keyword => 
                pageSource.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (foundKeywords.length > 0) {
                allData.gameInfo.push({
                    source: 'Forum',
                    channel: channelId,
                    keywords: foundKeywords,
                    content: pageSource.substring(0, 2000),
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log(`✅ Forum channel ${channelId} scraped: ${foundKeywords.length} keywords found, ${allData.forumThreads.length} threads`);
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape forum channel ${forumUrl}: ${error.message}`);
            allData.forumThreads.push({
                url: forumUrl,
                channelId: forumUrl.split('/').pop(),
                error: error.message,
                scraped: false
            });
        }
        
        // Save all forum data
        const filename = `forum-threads-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
        console.log(`💾 Saved all forum data to ${filename}`);
        
        // Send summary
        const summary = {
            threadsScraped: allData.forumThreads.filter(t => t.scraped).length,
            threadsFailed: allData.forumThreads.filter(t => !t.scraped).length,
            gameInfoFound: allData.gameInfo.length,
            uniqueKeywords: [...new Set(allData.gameInfo.flatMap(g => g.keywords))].length
        };
        
        console.log('📊 Forum Threads Scraping Summary:');
        console.log(`- Threads scraped: ${summary.threadsScraped}`);
        console.log(`- Threads failed: ${summary.threadsFailed}`);
        console.log(`- Game info found: ${summary.gameInfoFound}`);
        console.log(`- Unique keywords: ${summary.uniqueKeywords}`);
        
        return allData;
        
    } catch (error) {
        console.error('❌ Forum threads scraping failed:', error);
        throw error;
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// Run the scraper
if (require.main === module) {
    scrapeForumThreads()
        .then(data => {
            console.log('✅ Forum threads scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Forum threads scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeForumThreads };
