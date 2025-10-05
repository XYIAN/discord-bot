#!/usr/bin/env node

// Theria Nested Routes Scraper
// Manually discovers and scrapes all nested routes from the main wiki page

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

async function scrapeTheriaNestedRoutes() {
    console.log('🔍 DISCOVERING THERIA NESTED ROUTES');
    console.log('===================================');
    
    const driver = await new Builder().forBrowser('chrome').build();
    
    try {
        // Start from the main wiki page
        const mainWikiUrl = 'https://theriagames.com/archero-2-wiki/';
        console.log(`📄 Starting from: ${mainWikiUrl}`);
        
        await driver.get(mainWikiUrl);
        await driver.sleep(3000);
        
        // Find all links on the main page
        const allLinks = await driver.findElements(By.css('a[href]'));
        console.log(`🔗 Found ${allLinks.length} links on main page`);
        
        const discoveredUrls = new Set();
        const archeroUrls = [];
        
        // Extract all href attributes
        for (const link of allLinks) {
            try {
                const href = await link.getAttribute('href');
                if (href && href.includes('theriagames.com') && href.includes('archero-2')) {
                    discoveredUrls.add(href);
                }
            } catch (e) {
                // Skip if can't get href
            }
        }
        
        console.log(`📊 Discovered ${discoveredUrls.size} Archero 2 URLs`);
        
        // Convert to array and filter
        const urlsToScrape = Array.from(discoveredUrls).filter(url => {
            const urlLower = url.toLowerCase();
            return !urlLower.includes('/archero-2-wiki/') && // Skip main wiki page
                   !urlLower.includes('/archero-2-guides/') && // Skip guides index
                   !urlLower.includes('/archero-2-chapters/') && // Skip chapters index
                   !urlLower.includes('/archero-2-heroes/') && // Skip heroes index
                   !urlLower.includes('/archero-2-events/') && // Skip events index
                   !urlLower.includes('/archero-2-tools/') && // Skip tools index
                   urlLower.includes('archero-2') &&
                   !urlLower.endsWith('/') &&
                   urlLower.includes('-guide') || urlLower.includes('-tutorial') || 
                   urlLower.includes('chapter') || urlLower.includes('hero') ||
                   urlLower.includes('arena') || urlLower.includes('tower') ||
                   urlLower.includes('cave') || urlLower.includes('guild') ||
                   urlLower.includes('gear') || urlLower.includes('rune') ||
                   urlLower.includes('skill') || urlLower.includes('build') ||
                   urlLower.includes('farming') || urlLower.includes('gems') ||
                   urlLower.includes('energy') || urlLower.includes('chest') ||
                   urlLower.includes('shop') || urlLower.includes('talent');
        });
        
        console.log(`🎯 Filtered to ${urlsToScrape.length} relevant URLs`);
        
        // Show sample URLs
        console.log('\n📋 SAMPLE DISCOVERED URLS:');
        urlsToScrape.slice(0, 10).forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });
        
        // Now scrape each discovered URL
        const allData = {
            timestamp: new Date().toISOString(),
            source: 'Theria Games Wiki - Nested Routes Discovery',
            discoveredUrls: urlsToScrape.length,
            successfulPages: 0,
            failedPages: 0,
            scrapedPages: []
        };
        
        console.log('\n🚀 STARTING NESTED ROUTES SCRAPING:');
        console.log('===================================');
        
        for (let i = 0; i < urlsToScrape.length; i++) {
            const url = urlsToScrape[i];
            console.log(`\n📄 [${i + 1}/${urlsToScrape.length}] Scraping: ${url}`);
            
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
            }
            
            // Progress update every 10 pages
            if ((i + 1) % 10 === 0) {
                console.log(`\n📊 PROGRESS UPDATE:`);
                console.log(`   ✅ Successful: ${allData.successfulPages}`);
                console.log(`   ❌ Failed: ${allData.failedPages}`);
                console.log(`   📈 Success Rate: ${Math.round((allData.successfulPages / (i + 1)) * 100)}%`);
            }
            
            // Small delay between pages (1-2 seconds for regular sites)
            const delay = Math.random() * 1000 + 1000;
            await driver.sleep(delay);
        }
        
        // Save results
        const outputFile = path.join(__dirname, '..', 'data', `theria-nested-routes-data-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        
        console.log('\n🎉 NESTED ROUTES SCRAPING COMPLETE!');
        console.log('===================================');
        console.log(`✅ Total URLs discovered: ${urlsToScrape.length}`);
        console.log(`✅ Successful: ${allData.successfulPages}`);
        console.log(`❌ Failed: ${allData.failedPages}`);
        console.log(`📈 Success Rate: ${Math.round((allData.successfulPages / urlsToScrape.length) * 100)}%`);
        console.log(`📁 Data saved to: ${outputFile}`);
        
        const totalContent = allData.scrapedPages.reduce((sum, page) => sum + page.contentLength, 0);
        console.log(`\n📊 TOTAL CONTENT COLLECTED: ${totalContent.toLocaleString()} characters`);
        
        // Show content breakdown
        console.log('\n📋 CONTENT BREAKDOWN:');
        const contentTypes = {
            guides: 0,
            chapters: 0,
            heroes: 0,
            events: 0,
            other: 0
        };
        
        allData.scrapedPages.forEach(page => {
            const url = page.url.toLowerCase();
            if (url.includes('chapter')) {
                contentTypes.chapters++;
            } else if (url.includes('hero')) {
                contentTypes.heroes++;
            } else if (url.includes('arena') || url.includes('tower') || url.includes('cave')) {
                contentTypes.events++;
            } else if (url.includes('guide')) {
                contentTypes.guides++;
            } else {
                contentTypes.other++;
            }
        });
        
        Object.entries(contentTypes).forEach(([type, count]) => {
            if (count > 0) {
                console.log(`  ${type}: ${count} pages`);
            }
        });
        
    } catch (error) {
        console.error('❌ Nested routes scraper failed:', error);
    } finally {
        await driver.quit();
    }
}

// Run the nested routes scraper
scrapeTheriaNestedRoutes().catch(console.error);
