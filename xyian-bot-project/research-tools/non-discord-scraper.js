#!/usr/bin/env node

// Non-Discord Scraper
// Scrapes all non-Discord sources: wiki, Reddit, BlueStacks, damage calculator
// No login required - can run immediately

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

// Non-Discord URLs to scrape
const nonDiscordUrls = {
  wiki: [
    'https://theriagames.com/archero-2-wiki/',
    'https://archero-2.game-vault.net/wiki/Characters',
    'https://archero-2.game-vault.net/wiki/Gear',
    'https://archero-2.game-vault.net/wiki/Runes',
    'https://archero-2.game-vault.net/wiki/Skills',
    'https://archero-2.game-vault.net/wiki/Events'
  ],
  community: [
    'https://www.reddit.com/r/ArcheroV2/'
  ],
  guides: [
    'https://www.bluestacks.com/blog/game-guides/archero-2/ah2-gear-guide-en.html'
  ],
  tools: [
    'https://docs.google.com/spreadsheets/d/1-xLV4JSE71lI9W3SbXn9G_BNganA9VkzbnC5FmH3DaA/edit'
  ]
};

async function scrapeNonDiscordSources() {
    console.log('🚀 Starting Non-Discord Scraper...');
    console.log('==================================');
    
    const driver = await new Builder().forBrowser('chrome').build();
    
    try {
        const allData = {
            timestamp: new Date().toISOString(),
            sources: [],
            wikiPages: [],
            communityPages: [],
            guidePages: [],
            toolPages: [],
            totalPages: 0,
            successfulPages: 0,
            failedPages: 0
        };

        // Scrape each category
        for (const [category, urls] of Object.entries(nonDiscordUrls)) {
            console.log(`\n📂 Scraping ${category.toUpperCase()} pages...`);
            console.log('='.repeat(40));
            
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                console.log(`\n📄 [${i + 1}/${urls.length}] Scraping: ${url}`);
                
                try {
                    await driver.get(url);
                    await driver.sleep(3000); // Wait for page load
                    
                    // Try to get page content
                    let content = '';
                    try {
                        // Wait for content to load
                        await driver.sleep(2000);
                        
                        // Try multiple selectors for content
                        const selectors = [
                            'main',
                            'article',
                            '.content',
                            '.post-content',
                            '.wiki-content',
                            'body'
                        ];
                        
                        for (const selector of selectors) {
                            try {
                                const element = await driver.findElement(By.css(selector));
                                const text = await element.getText();
                                if (text && text.length > 100) {
                                    content = text;
                                    break;
                                }
                            } catch (e) {
                                // Try next selector
                            }
                        }
                        
                        // If no content found, get body text
                        if (!content) {
                            const body = await driver.findElement(By.tagName('body'));
                            content = await body.getText();
                        }
                        
                    } catch (e) {
                        console.log(`⚠️ Could not extract content: ${e.message}`);
                    }
                    
                    if (content && content.length > 50) {
                        const pageData = {
                            url: url,
                            content: content.substring(0, 2000), // Limit content length
                            scrapedAt: new Date().toISOString(),
                            contentLength: content.length
                        };
                        
                        allData[`${category}Pages`].push(pageData);
                        allData.successfulPages++;
                        console.log(`✅ Successfully scraped (${content.length} chars)`);
                    } else {
                        console.log(`⚠️ Insufficient content (${content ? content.length : 0} chars)`);
                        allData.failedPages++;
                    }
                    
                    allData.totalPages++;
                    
                } catch (error) {
                    console.log(`❌ Failed to scrape ${url}: ${error.message}`);
                    allData.failedPages++;
                    allData.totalPages++;
                }
                
                // Random delay between pages
                const delay = Math.random() * 3000 + 2000; // 2-5 seconds
                console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next page...`);
                await driver.sleep(delay);
            }
        }
        
        // Save results
        const outputFile = path.join(__dirname, '..', 'data', `non-discord-scraped-data-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        
        console.log('\n📊 SCRAPING COMPLETE!');
        console.log('====================');
        console.log(`✅ Total pages: ${allData.totalPages}`);
        console.log(`✅ Successful: ${allData.successfulPages}`);
        console.log(`❌ Failed: ${allData.failedPages}`);
        console.log(`📁 Data saved to: ${outputFile}`);
        
        // Summary by category
        console.log('\n📋 RESULTS BY CATEGORY:');
        console.log('------------------------');
        console.log(`📚 Wiki pages: ${allData.wikiPages.length}`);
        console.log(`👥 Community pages: ${allData.communityPages.length}`);
        console.log(`📖 Guide pages: ${allData.guidePages.length}`);
        console.log(`🛠️ Tool pages: ${allData.toolPages.length}`);
        
    } catch (error) {
        console.error('❌ Scraper failed:', error);
    } finally {
        await driver.quit();
    }
}

// Run the scraper
scrapeNonDiscordSources().catch(console.error);
