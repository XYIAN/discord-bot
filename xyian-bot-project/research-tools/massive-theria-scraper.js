#!/usr/bin/env node

// Massive Theria Games Scraper
// Scrapes all 217 Archero 2 URLs from the comprehensive sitemap

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

async function scrapeMassiveTheriaWiki() {
    console.log('🚀 STARTING MASSIVE THERIA GAMES SCRAPER!');
    console.log('=========================================');
    console.log('📊 Target: 217 Archero 2 URLs');
    console.log('🎯 Source: Theria Games comprehensive wiki');
    console.log('');
    
    const driver = await new Builder().forBrowser('chrome').build();
    
    try {
        // Load the URL list
        const urlListFile = path.join(__dirname, '..', 'data', 'theria-all-urls-1759704416831.json');
        const urlData = JSON.parse(fs.readFileSync(urlListFile, 'utf8'));
        
        console.log(`📋 Loaded ${urlData.allUrls.length} URLs to scrape`);
        console.log(`📚 Guides: ${urlData.categories.guides.length}`);
        console.log(`📄 Other: ${urlData.categories.other.length}`);
        console.log('');
        
        const allData = {
            timestamp: new Date().toISOString(),
            source: 'Theria Games Wiki - Comprehensive Sitemap',
            totalUrls: urlData.allUrls.length,
            successfulPages: 0,
            failedPages: 0,
            scrapedPages: [],
            categories: {
                guides: [],
                heroes: [],
                chapters: [],
                events: [],
                other: []
            }
        };
        
        // Scrape each URL
        for (let i = 0; i < urlData.allUrls.length; i++) {
            const url = urlData.allUrls[i];
            console.log(`\n📄 [${i + 1}/${urlData.allUrls.length}] Scraping: ${url}`);
            
            try {
                await driver.get(url);
                await driver.sleep(2000); // Wait for page load
                
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
                        content: content.substring(0, 4000), // Limit content length
                        contentLength: content.length,
                        scrapedAt: new Date().toISOString(),
                        category: determineCategory(url, title, content)
                    };
                    
                    allData.scrapedPages.push(pageData);
                    allData.categories[pageData.category].push(pageData);
                    allData.successfulPages++;
                    
                    console.log(`✅ Successfully scraped (${content.length} chars) - ${pageData.category}`);
                } else {
                    console.log(`⚠️ Insufficient content (${content ? content.length : 0} chars)`);
                    allData.failedPages++;
                }
                
            } catch (error) {
                console.log(`❌ Failed to scrape ${url}: ${error.message}`);
                allData.failedPages++;
            }
            
            // Progress update every 10 pages
            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 PROGRESS UPDATE:`);
                console.log(`   ✅ Successful: ${allData.successfulPages}`);
                console.log(`   ❌ Failed: ${allData.failedPages}`);
                console.log(`   📈 Success Rate: ${Math.round((allData.successfulPages / (i + 1)) * 100)}%`);
            }
            
            // Random delay between pages (2-5 seconds)
            const delay = Math.random() * 3000 + 2000;
            await driver.sleep(delay);
        }
        
        // Save results
        const outputFile = path.join(__dirname, '..', 'data', `massive-theria-scraped-data-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        
        console.log('\n🎉 MASSIVE SCRAPING COMPLETE!');
        console.log('=============================');
        console.log(`✅ Total URLs processed: ${urlData.allUrls.length}`);
        console.log(`✅ Successful: ${allData.successfulPages}`);
        console.log(`❌ Failed: ${allData.failedPages}`);
        console.log(`📈 Success Rate: ${Math.round((allData.successfulPages / urlData.allUrls.length) * 100)}%`);
        console.log(`📁 Data saved to: ${outputFile}`);
        
        // Summary by category
        console.log('\n📋 RESULTS BY CATEGORY:');
        console.log('------------------------');
        Object.entries(allData.categories).forEach(([category, pages]) => {
            if (pages.length > 0) {
                console.log(`📚 ${category.toUpperCase()}: ${pages.length} pages`);
            }
        });
        
        const totalContent = allData.scrapedPages.reduce((sum, page) => sum + page.contentLength, 0);
        console.log(`\n📊 TOTAL CONTENT COLLECTED: ${totalContent.toLocaleString()} characters`);
        console.log('🎯 This is MASSIVE! Ready for knowledge database integration!');
        
    } catch (error) {
        console.error('❌ Massive scraper failed:', error);
    } finally {
        await driver.quit();
    }
}

// Determine category based on URL, title, and content
function determineCategory(url, title, content) {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (urlLower.includes('hero') || urlLower.includes('character') || titleLower.includes('hero') || titleLower.includes('character')) {
        return 'heroes';
    } else if (urlLower.includes('chapter') || titleLower.includes('chapter')) {
        return 'chapters';
    } else if (urlLower.includes('event') || urlLower.includes('arena') || titleLower.includes('event') || titleLower.includes('arena')) {
        return 'events';
    } else if (urlLower.includes('guide') || titleLower.includes('guide') || contentLower.includes('guide')) {
        return 'guides';
    } else {
        return 'other';
    }
}

// Run the massive scraper
scrapeMassiveTheriaWiki().catch(console.error);
