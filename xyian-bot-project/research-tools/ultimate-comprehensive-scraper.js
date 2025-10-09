const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ULTIMATE COMPREHENSIVE SCRAPER
// This will scrape EVERYTHING to get the real factual data

const SCRAPE_CONFIG = {
    // Discord channels to scrape (all theorycrafting and data channels)
    discordChannels: [
        'https://discord.com/channels/1419944148701679686/1424322391160393790', // arch-ai
        'https://discord.com/channels/1419944148701679686/1424322423901392957', // xyian-guild
        // Add more Discord channels as needed
    ],
    
    // Theorycrafting posts
    theorycraftingPosts: [
        'https://discord.com/channels/1419944148701679686/1424322423901392957/1234567890123456789', // Add actual post IDs
        // Add more theorycrafting posts
    ],
    
    // Theria Games Wiki - ALL pages
    theriaWiki: [
        'https://theriagames.com/archero-2-wiki/',
        'https://theriagames.com/archero-2-guides/',
        // We'll discover all nested routes
    ],
    
    // Reddit r/ArcheroV2
    reddit: [
        'https://www.reddit.com/r/ArcheroV2/',
        'https://www.reddit.com/r/ArcheroV2/hot/',
        'https://www.reddit.com/r/ArcheroV2/top/',
    ],
    
    // BlueStacks guides
    bluestacks: [
        'https://www.bluestacks.com/blog/game-guides/archero-2/ah2-gear-guide-en.html',
    ],
    
    // Damage calculator
    damageCalculator: [
        'https://docs.google.com/spreadsheets/d/1-xLV4JSE71lI9W3SbXn9G_BNganA9VkzbnC5FmH3DaA/edit',
    ]
};

async function ultimateComprehensiveScrape() {
    console.log('🚀 STARTING ULTIMATE COMPREHENSIVE SCRAPE');
    console.log('==========================================');
    console.log('Target: Get ALL factual data about Archero 2');
    console.log('Focus: Runes, etched runes, gear, weapons, characters, skins, blacksmith, etc.');
    console.log('');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const allScrapedData = {
        discord: [],
        theriaWiki: [],
        reddit: [],
        bluestacks: [],
        damageCalculator: [],
        metadata: {
            startTime: new Date().toISOString(),
            totalPages: 0,
            successfulPages: 0,
            failedPages: 0
        }
    };
    
    try {
        // 1. DISCORD SCRAPING (Human-like speed)
        console.log('📱 SCRAPING DISCORD CHANNELS...');
        console.log('===============================');
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to Discord
        await page.goto('https://discord.com/app', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Clear storage
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });
        
        console.log('🔐 Please log in to Discord manually...');
        console.log('⏳ Waiting for manual login (30 seconds)...');
        await page.waitForTimeout(30000);
        
        // Scrape Discord channels
        for (const channelUrl of SCRAPE_CONFIG.discordChannels) {
            try {
                console.log(`📱 Scraping Discord channel: ${channelUrl}`);
                await page.goto(channelUrl, { waitUntil: 'networkidle2' });
                await page.waitForTimeout(2000);
                
                // Scroll to load more messages
                for (let i = 0; i < 10; i++) {
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                    await page.waitForTimeout(1000);
                }
                
                // Extract messages
                const messages = await page.evaluate(() => {
                    const messageElements = document.querySelectorAll('[data-message-id]');
                    const messages = [];
                    
                    messageElements.forEach(element => {
                        const content = element.textContent.trim();
                        if (content.length > 20) {
                            messages.push({
                                content: content,
                                timestamp: new Date().toISOString()
                            });
                        }
                    });
                    
                    return messages;
                });
                
                allScrapedData.discord.push({
                    url: channelUrl,
                    messages: messages,
                    scrapedAt: new Date().toISOString()
                });
                
                console.log(`✅ Scraped ${messages.length} messages from Discord channel`);
                allScrapedData.metadata.successfulPages++;
                
            } catch (error) {
                console.error(`❌ Error scraping Discord channel ${channelUrl}:`, error.message);
                allScrapedData.metadata.failedPages++;
            }
            
            // Human-like delay
            await page.waitForTimeout(3000 + Math.random() * 2000);
        }
        
        // 2. THERIA WIKI COMPREHENSIVE SCRAPING
        console.log('\\n📚 SCRAPING THERIA GAMES WIKI...');
        console.log('=================================');
        
        // First, discover ALL URLs from sitemap
        const sitemapUrls = await discoverAllTheriaUrls();
        console.log(`📊 Discovered ${sitemapUrls.length} Theria URLs`);
        
        // Scrape all discovered URLs
        for (const url of sitemapUrls.slice(0, 50)) { // Limit to first 50 for now
            try {
                console.log(`📚 Scraping: ${url}`);
                
                const response = await axios.get(url, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const $ = cheerio.load(response.data);
                
                // Extract all text content
                const content = $('body').text().replace(/\\s+/g, ' ').trim();
                
                if (content.length > 100) {
                    allScrapedData.theriaWiki.push({
                        url: url,
                        title: $('title').text(),
                        content: content,
                        scrapedAt: new Date().toISOString()
                    });
                    
                    console.log(`✅ Scraped ${content.length} characters from ${url}`);
                    allScrapedData.metadata.successfulPages++;
                }
                
            } catch (error) {
                console.error(`❌ Error scraping ${url}:`, error.message);
                allScrapedData.metadata.failedPages++;
            }
            
            // Regular delay for non-Discord sites
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 3. REDDIT SCRAPING
        console.log('\\n🔴 SCRAPING REDDIT r/ArcheroV2...');
        console.log('==================================');
        
        for (const redditUrl of SCRAPE_CONFIG.reddit) {
            try {
                console.log(`🔴 Scraping Reddit: ${redditUrl}`);
                
                const response = await axios.get(redditUrl, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const $ = cheerio.load(response.data);
                const content = $('body').text().replace(/\\s+/g, ' ').trim();
                
                if (content.length > 100) {
                    allScrapedData.reddit.push({
                        url: redditUrl,
                        content: content,
                        scrapedAt: new Date().toISOString()
                    });
                    
                    console.log(`✅ Scraped ${content.length} characters from Reddit`);
                    allScrapedData.metadata.successfulPages++;
                }
                
            } catch (error) {
                console.error(`❌ Error scraping Reddit ${redditUrl}:`, error.message);
                allScrapedData.metadata.failedPages++;
            }
        }
        
        // 4. BLUESTACKS SCRAPING
        console.log('\\n💻 SCRAPING BLUESTACKS GUIDES...');
        console.log('==================================');
        
        for (const bluestacksUrl of SCRAPE_CONFIG.bluestacks) {
            try {
                console.log(`💻 Scraping BlueStacks: ${bluestacksUrl}`);
                
                const response = await axios.get(bluestacksUrl, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const $ = cheerio.load(response.data);
                const content = $('body').text().replace(/\\s+/g, ' ').trim();
                
                if (content.length > 100) {
                    allScrapedData.bluestacks.push({
                        url: bluestacksUrl,
                        content: content,
                        scrapedAt: new Date().toISOString()
                    });
                    
                    console.log(`✅ Scraped ${content.length} characters from BlueStacks`);
                    allScrapedData.metadata.successfulPages++;
                }
                
            } catch (error) {
                console.error(`❌ Error scraping BlueStacks ${bluestacksUrl}:`, error.message);
                allScrapedData.metadata.failedPages++;
            }
        }
        
        // 5. DAMAGE CALCULATOR SCRAPING
        console.log('\\n📊 SCRAPING DAMAGE CALCULATOR...');
        console.log('==================================');
        
        for (const calcUrl of SCRAPE_CONFIG.damageCalculator) {
            try {
                console.log(`📊 Scraping Damage Calculator: ${calcUrl}`);
                
                const response = await axios.get(calcUrl, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                const $ = cheerio.load(response.data);
                const content = $('body').text().replace(/\\s+/g, ' ').trim();
                
                if (content.length > 100) {
                    allScrapedData.damageCalculator.push({
                        url: calcUrl,
                        content: content,
                        scrapedAt: new Date().toISOString()
                    });
                    
                    console.log(`✅ Scraped ${content.length} characters from Damage Calculator`);
                    allScrapedData.metadata.successfulPages++;
                }
                
            } catch (error) {
                console.error(`❌ Error scraping Damage Calculator ${calcUrl}:`, error.message);
                allScrapedData.metadata.failedPages++;
            }
        }
        
    } finally {
        await browser.close();
    }
    
    // Save all scraped data
    allScrapedData.metadata.endTime = new Date().toISOString();
    allScrapedData.metadata.totalPages = allScrapedData.metadata.successfulPages + allScrapedData.metadata.failedPages;
    
    const filename = `data/ultimate-comprehensive-scraped-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(allScrapedData, null, 2));
    
    console.log('\\n🎉 ULTIMATE COMPREHENSIVE SCRAPE COMPLETE!');
    console.log('==========================================');
    console.log(`📊 Total pages scraped: ${allScrapedData.metadata.totalPages}`);
    console.log(`✅ Successful: ${allScrapedData.metadata.successfulPages}`);
    console.log(`❌ Failed: ${allScrapedData.metadata.failedPages}`);
    console.log(`💾 Data saved to: ${filename}`);
    
    return allScrapedData;
}

// Helper function to discover all Theria URLs
async function discoverAllTheriaUrls() {
    console.log('🔍 Discovering all Theria Games URLs...');
    
    try {
        // Get sitemap index
        const sitemapResponse = await axios.get('https://theriagames.com/sitemap_index.xml');
        const sitemapIndex = sitemapResponse.data;
        
        // Extract sub-sitemap URLs
        const subSitemapUrls = [];
        const sitemapMatches = sitemapIndex.match(/<loc>(.*?)<\\/loc>/g);
        if (sitemapMatches) {
            sitemapMatches.forEach(match => {
                const url = match.replace(/<\\/?loc>/g, '');
                if (url.includes('archero')) {
                    subSitemapUrls.push(url);
                }
            });
        }
        
        console.log(`📊 Found ${subSitemapUrls.length} sub-sitemaps`);
        
        // Get URLs from each sub-sitemap
        const allUrls = [];
        for (const sitemapUrl of subSitemapUrls) {
            try {
                const response = await axios.get(sitemapUrl);
                const sitemapContent = response.data;
                
                const urlMatches = sitemapContent.match(/<loc>(.*?)<\\/loc>/g);
                if (urlMatches) {
                    urlMatches.forEach(match => {
                        const url = match.replace(/<\\/?loc>/g, '');
                        if (url.includes('archero-2')) {
                            allUrls.push(url);
                        }
                    });
                }
                
                console.log(`📊 Extracted URLs from ${sitemapUrl}`);
                
            } catch (error) {
                console.error(`❌ Error processing sitemap ${sitemapUrl}:`, error.message);
            }
        }
        
        console.log(`📊 Total Archero 2 URLs discovered: ${allUrls.length}`);
        return allUrls;
        
    } catch (error) {
        console.error('❌ Error discovering Theria URLs:', error.message);
        return [];
    }
}

// Run the ultimate comprehensive scrape
ultimateComprehensiveScrape().catch(console.error);
