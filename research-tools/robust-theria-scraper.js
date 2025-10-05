#!/usr/bin/env node

// Robust Theria Games Scraper
// Scrapes all URLs with better error handling and timeouts

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

async function scrapeRobustTheriaWiki() {
    console.log('🚀 STARTING ROBUST THERIA GAMES SCRAPER!');
    console.log('========================================');
    
    const driver = await new Builder().forBrowser('chrome').build();
    
    try {
        // Load the filtered URL list
        const urlListFile = path.join(__dirname, '..', 'data', 'theria-filtered-urls.json');
        const urlData = JSON.parse(fs.readFileSync(urlListFile, 'utf8'));
        
        console.log(`📋 Loaded ${urlData.allUrls.length} URLs to scrape`);
        
        const allData = {
            timestamp: new Date().toISOString(),
            source: 'Theria Games Wiki - Robust Scraper',
            totalUrls: urlData.allUrls.length,
            successfulPages: 0,
            failedPages: 0,
            scrapedPages: []
        };
        
        // Scrape each URL with timeout and error handling
        for (let i = 0; i < urlData.allUrls.length; i++) {
            const url = urlData.allUrls[i];
            console.log(`\n📄 [${i + 1}/${urlData.allUrls.length}] Scraping: ${url}`);
            
            try {
                // Set timeout for page load
                await driver.manage().setTimeouts({ pageLoad: 30000 }); // 30 second timeout
                
                await driver.get(url);
                
                // Wait for page to load with timeout
                try {
                    await driver.wait(until.elementLocated(By.tagName('body')), 10000);
                } catch (e) {
                    console.log(`⚠️ Page load timeout, continuing...`);
                }
                
                await driver.sleep(2000); // Wait for content
                
                // Try to get page content
                let content = '';
                let title = '';
                
                try {
                    // Get page title
                    title = await driver.getTitle();
                    
                    // Try multiple selectors for content
                    const selectors = [
                        'main',
                        'article',
                        '.content',
                        '.post-content',
                        '.wiki-content',
                        '.entry-content',
                        '.guide-content',
                        'body'
                    ];
                    
                    for (const selector of selectors) {
                        try {
                            const element = await driver.findElement(By.css(selector));
                            const text = await element.getText();
                            if (text && text.length > 200) {
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
                
                if (content && content.length > 100) {
                    const pageData = {
                        url: url,
                        title: title,
                        content: content.substring(0, 3000), // Limit content length
                        contentLength: content.length,
                        scrapedAt: new Date().toISOString()
                    };
                    
                    allData.scrapedPages.push(pageData);
                    allData.successfulPages++;
                    
                    console.log(`✅ Successfully scraped (${content.length} chars)`);
                } else {
                    console.log(`⚠️ Insufficient content (${content ? content.length : 0} chars)`);
                    allData.failedPages++;
                }
                
            } catch (error) {
                console.log(`❌ Failed to scrape ${url}: ${error.message}`);
                allData.failedPages++;
                
                // Try to continue by refreshing or navigating away
                try {
                    await driver.get('about:blank');
                    await driver.sleep(1000);
                } catch (e) {
                    // Ignore navigation errors
                }
            }
            
            // Progress update every 5 pages
            if ((i + 1) % 5 === 0) {
                console.log(`\n📊 PROGRESS UPDATE:`);
                console.log(`   ✅ Successful: ${allData.successfulPages}`);
                console.log(`   ❌ Failed: ${allData.failedPages}`);
                console.log(`   📈 Success Rate: ${Math.round((allData.successfulPages / (i + 1)) * 100)}%`);
            }
            
            // Random delay between pages (1-3 seconds)
            const delay = Math.random() * 2000 + 1000;
            await driver.sleep(delay);
        }
        
        // Save results
        const outputFile = path.join(__dirname, '..', 'data', `robust-theria-scraped-data-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        
        console.log('\n🎉 ROBUST SCRAPING COMPLETE!');
        console.log('============================');
        console.log(`✅ Total URLs processed: ${urlData.allUrls.length}`);
        console.log(`✅ Successful: ${allData.successfulPages}`);
        console.log(`❌ Failed: ${allData.failedPages}`);
        console.log(`📈 Success Rate: ${Math.round((allData.successfulPages / urlData.allUrls.length) * 100)}%`);
        console.log(`📁 Data saved to: ${outputFile}`);
        
        const totalContent = allData.scrapedPages.reduce((sum, page) => sum + page.contentLength, 0);
        console.log(`\n📊 TOTAL CONTENT COLLECTED: ${totalContent.toLocaleString()} characters`);
        
    } catch (error) {
        console.error('❌ Robust scraper failed:', error);
    } finally {
        await driver.quit();
    }
}

// Run the robust scraper
scrapeRobustTheriaWiki().catch(console.error);
