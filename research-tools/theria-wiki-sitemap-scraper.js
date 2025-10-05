#!/usr/bin/env node

// Theria Games Wiki Sitemap Scraper
// Scrapes all guides, heroes, chapters from the comprehensive wiki

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

// All the URLs from the Theria Games wiki sitemap
const theriaWikiUrls = {
  // Common Guides
  commonGuides: [
    'https://theriagames.com/archero-2-efficient-farming-guide/',
    'https://theriagames.com/archero-2-where-to-spend-your-gems-guide/',
    'https://theriagames.com/beginners-guide-archero-2/',
    'https://theriagames.com/blast-build-guide/',
    'https://theriagames.com/chest-guide/',
    'https://theriagames.com/close-range-build-guide/',
    'https://theriagames.com/combo-build-guide/',
    'https://theriagames.com/energy-guide/',
    'https://theriagames.com/etched-sword-strike-build-guide/',
    'https://theriagames.com/gear-guide/',
    'https://theriagames.com/guild-guide/',
    'https://theriagames.com/redeem-codes/',
    'https://theriagames.com/rune-guide/',
    'https://theriagames.com/shop-guide/',
    'https://theriagames.com/skill-guide/',
    'https://theriagames.com/sprite-build-guide/',
    'https://theriagames.com/talent-cards-guide/',
    'https://theriagames.com/types-of-monster-guide/'
  ],
  
  // Event Guides
  eventGuides: [
    'https://theriagames.com/arena-guide/',
    'https://theriagames.com/gold-cave-guide/',
    'https://theriagames.com/island-treasure-hunt-guide/',
    'https://theriagames.com/sky-tower-guide/'
  ],
  
  // Hero Guides
  heroGuides: [
    'https://theriagames.com/alex-guide/',
    'https://theriagames.com/helix-guide/',
    'https://theriagames.com/otta-guide/',
    'https://theriagames.com/character-tier-list-guide/',
    'https://theriagames.com/archero-2-the-lifesteal-champion-dracoola-guide/',
    'https://theriagames.com/archero-2-rolla-guide/',
    'https://theriagames.com/archero-2-demon-king-atreus-guide/'
  ],
  
  // Chapter Guides (1-52+)
  chapterGuides: [
    'https://theriagames.com/chapter-1-moonlight-forest-guide/',
    'https://theriagames.com/chapter-2-cloud-dreamland-guide/',
    'https://theriagames.com/chapter-3-autumn-ruins-guide/',
    'https://theriagames.com/chapter-4-breeze-prairie/',
    'https://theriagames.com/chapter-5-shadow-king-city-guide/',
    'https://theriagames.com/chapter-6-cystal-altar-guide/',
    'https://theriagames.com/chapter-7-molten-grotto-guide/',
    'https://theriagames.com/chapter-8-treasure-island-guide/',
    'https://theriagames.com/chapter-9-beast-island-guide/',
    'https://theriagames.com/chapter-10-ice-and-snow-land-guide/',
    'https://theriagames.com/chapter-11-maple-bridge-valley-guide/',
    'https://theriagames.com/chapter-12-dawn-jungle-guide/',
    'https://theriagames.com/chapter-13-lost-castle-guide/',
    'https://theriagames.com/chapter-14-green-shades-ruins-guide/',
    'https://theriagames.com/chapter-15-gold-and-silver-island-guide/',
    'https://theriagames.com/chapter-16-azure-sky-hill-guide/',
    'https://theriagames.com/chapter-17-coral-reef-guide/',
    'https://theriagames.com/chapter-18-windstorm-desert-guide/',
    'https://theriagames.com/chapter-19-hanging-bridge-gully-guide/',
    'https://theriagames.com/chapter-20-autumn-pasture-guide/',
    'https://theriagames.com/chapter-21-river-of-lava-guide/',
    'https://theriagames.com/chapter-22-frost-dungeon-guide/',
    'https://theriagames.com/chapter-23-crystal-mine-cave-guide/',
    'https://theriagames.com/chapter-24-twilight-estate-guide/',
    'https://theriagames.com/chapter-25-cloud-isolated-island-guide/',
    'https://theriagames.com/archero-2-chapter-26-crimson-territory-guide/',
    'https://theriagames.com/archero-2-chapter-27-nightfall-icefield-guide/',
    'https://theriagames.com/archero-2-chapter-28-pharaohs-chamber-guide/',
    'https://theriagames.com/archero-2-chapter-29-forbidden-dungeon-guide/',
    'https://theriagames.com/archero-2-chapter-30-nightfall-ruins-guide/',
    'https://theriagames.com/archero-2-chapter-31-splendid-castle-guide/',
    'https://theriagames.com/archero-2-chapter-32-beanstalk-island-guide/',
    'https://theriagames.com/archero-2-chapter-33-whispering-forest-guide/',
    'https://theriagames.com/archero-2-chapter-34-undersea-world-guide/',
    'https://theriagames.com/archero-2-chapter-36-dragon-spine-cliff-guide/',
    'https://theriagames.com/archero-2-chapter-37-gloomy-forest-guide/',
    'https://theriagames.com/archero-2-chapter-38-evil-spirit-arena-guide/',
    'https://theriagames.com/archero-2-chapter-39-mysterious-canyon-guide/',
    'https://theriagames.com/archero-2-chapter-40-enchanted-flair-guide/',
    'https://theriagames.com/archero-2-chapter-41-breeze-island-guide/',
    'https://theriagames.com/archero-2-chapter-42-evil-spirit-castle-guide/',
    'https://theriagames.com/archero-2-chapter-43-silent-castle-guide/',
    'https://theriagames.com/archero-2-chapter-44-city-in-the-clouds-guide/',
    'https://theriagames.com/archero-2-chapter-45-sky-stronghold-guide/',
    'https://theriagames.com/archero-2-chapter-46-void-abyss-guide/',
    'https://theriagames.com/archero-2-chapter-47-vampires-estate-guide/',
    'https://theriagames.com/archero-2-chapter-48-frozen-mountain-guide/',
    'https://theriagames.com/archero-2-chapter-49-nightfall-beanstalk-island-guide/',
    'https://theriagames.com/archero-2-chapter-50-fairytale-fortress-guide/',
    'https://theriagames.com/archero-2-chapter-51-autumn-forest-guide/',
    'https://theriagames.com/archero-2-chapter-52-amber-cavern-guide/',
    'https://theriagames.com/archero-2-chapter-91-silent-reach-guide/',
    'https://theriagames.com/archero-2-chapter-90-palace-ruins-guide/',
    'https://theriagames.com/archero-2-chapter-89-serene-abyss-guide/',
    'https://theriagames.com/archero-2-chapter-88-drill-grounds-guide/',
    'https://theriagames.com/archero-2-chapter-87-silent-isle-guide/',
    'https://theriagames.com/archero-2-chapter-86-twilight-plains-guide/'
  ]
};

async function scrapeTheriaWikiSitemap() {
    console.log('🚀 Starting Theria Games Wiki Sitemap Scraper...');
    console.log('================================================');
    
    const driver = await new Builder().forBrowser('chrome').build();
    
    try {
        const allData = {
            timestamp: new Date().toISOString(),
            sources: [],
            commonGuides: [],
            eventGuides: [],
            heroGuides: [],
            chapterGuides: [],
            totalPages: 0,
            successfulPages: 0,
            failedPages: 0
        };

        // Scrape each category
        for (const [category, urls] of Object.entries(theriaWikiUrls)) {
            console.log(`\n📂 Scraping ${category.toUpperCase()}...`);
            console.log('='.repeat(50));
            
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
                            '.entry-content',
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
                            content: content.substring(0, 3000), // Limit content length
                            scrapedAt: new Date().toISOString(),
                            contentLength: content.length,
                            category: category
                        };
                        
                        allData[category].push(pageData);
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
                const delay = Math.random() * 4000 + 3000; // 3-7 seconds
                console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next page...`);
                await driver.sleep(delay);
            }
        }
        
        // Save results
        const outputFile = path.join(__dirname, '..', 'data', `theria-wiki-sitemap-data-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        
        console.log('\n📊 THERIA WIKI SITEMAP SCRAPING COMPLETE!');
        console.log('=========================================');
        console.log(`✅ Total pages: ${allData.totalPages}`);
        console.log(`✅ Successful: ${allData.successfulPages}`);
        console.log(`❌ Failed: ${allData.failedPages}`);
        console.log(`📁 Data saved to: ${outputFile}`);
        
        // Summary by category
        console.log('\n📋 RESULTS BY CATEGORY:');
        console.log('------------------------');
        console.log(`📚 Common Guides: ${allData.commonGuides.length}`);
        console.log(`🎯 Event Guides: ${allData.eventGuides.length}`);
        console.log(`👥 Hero Guides: ${allData.heroGuides.length}`);
        console.log(`📖 Chapter Guides: ${allData.chapterGuides.length}`);
        
        const totalContent = allData.commonGuides.length + allData.eventGuides.length + 
                           allData.heroGuides.length + allData.chapterGuides.length;
        console.log(`📊 Total content pages: ${totalContent}`);
        
    } catch (error) {
        console.error('❌ Theria Wiki scraper failed:', error);
    } finally {
        await driver.quit();
    }
}

// Run the scraper
scrapeTheriaWikiSitemap().catch(console.error);
