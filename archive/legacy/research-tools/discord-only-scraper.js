#!/usr/bin/env node

// Discord-Only Scraper
// Scrapes all Discord channels with manual login
// Based on comprehensive-single-session-scraper.js but Discord-only

const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

// All Discord channel URLs
const discordChannels = [
    // Theorycrafting posts (28 URLs)
    'https://discord.com/channels/1268830572743102505/1348520924793667684', // Beginners Guide FAQ
    'https://discord.com/channels/1268830572743102505/1417735501250564146', // Shopping Guide
    'https://discord.com/channels/1268830572743102505/1354841056331698442', // S-Tier Gear Swap & Advanced Fuse
    'https://discord.com/channels/1268830572743102505/1419485616910897234', // How Tickets Stack
    'https://discord.com/channels/1268830572743102505/1368477308893007983', // How element skills work
    'https://discord.com/channels/1268830572743102505/1377926377009057830', // Dragoon Set Guide
    'https://discord.com/channels/1268830572743102505/1394706549074821271', // Rune build for Oracle/Echo
    'https://discord.com/channels/1268830572743102505/1311545299248091226', // Most Efficient Chapter for Grin
    'https://discord.com/channels/1268830572743102505/1392597464581804152', // Archero 2 Damage Formula
    'https://discord.com/channels/1268830572743102505/1356901526961913877', // Front Arrow Calculation
    'https://discord.com/channels/1268830572743102505/1383146616260788245', // Staff Tracking
    'https://discord.com/channels/1268830572743102505/1374729958362185739', // The Boss Guide
    'https://discord.com/channels/1268830572743102505/1408840737952497704', // Shackled Jungle Guide
    'https://discord.com/channels/1268830572743102505/1355348706202878012', // PVP Arena Guide
    'https://discord.com/channels/1268830572743102505/1340897089969852550', // Peak Arena Guide
    'https://discord.com/channels/1268830572743102505/1377264985847365763', // PVP Build Guide
    'https://discord.com/channels/1268830572743102505/1361194834500522055', // PVP Tips
    'https://discord.com/channels/1268830572743102505/1339806294311309446', // PVP Strategy
    'https://discord.com/channels/1268830572743102505/1412491261553934426', // PVP Meta
    'https://discord.com/channels/1268830572743102505/1345022595422224476', // PVP Counters
    'https://discord.com/channels/1268830572743102505/1354856561369157844', // PVP Equipment
    'https://discord.com/channels/1268830572743102505/1393963122712117248', // PVP Characters
    'https://discord.com/channels/1268830572743102505/1375351191835381850', // PVP Runes
    'https://discord.com/channels/1268830572743102505/1360494961765781726', // PVP Skills
    'https://discord.com/channels/1268830572743102505/1374742804655243265', // PVP Builds
    'https://discord.com/channels/1268830572743102505/1354852979081085098', // PVP Strategy
    'https://discord.com/channels/1268830572743102505/1308401390561001482', // Event Guide
    'https://discord.com/channels/1268830572743102505/1310902072467652639', // Event Strategy
    
    // Additional Discord channels
    'https://discord.com/channels/1268830572743102505/1319252275822334012',
    'https://discord.com/channels/1268830572743102505/1346571363451928646',
    'https://discord.com/channels/1268830572743102505/1348357594322043011',
    'https://discord.com/channels/1268830572743102505/1350238408651313275',
    'https://discord.com/channels/1268830572743102505/1347635565876744263',
    'https://discord.com/channels/1268830572743102505/1341711135631736893',
    'https://discord.com/channels/1268830572743102505/1340792565095731290',
    'https://discord.com/channels/1268830572743102505/1319256240228143165',
    'https://discord.com/channels/1268830572743102505/1268830572743102508',
    'https://discord.com/channels/1268830572743102505/1268835262159654932',
    'https://discord.com/channels/1268830572743102505/1340351179582079189',
    'https://discord.com/channels/1268830572743102505/1385569804383158293'
];

async function scrapeDiscordChannels() {
    console.log('🚀 Starting Discord-Only Scraper...');
    console.log('===================================');
    console.log(`📊 Total Discord channels: ${discordChannels.length}`);
    
    const driver = await new Builder().forBrowser('chrome').build();
    
    try {
        // Clear cache and navigate to Discord
        console.log('🧹 Clearing cache and navigating to Discord...');
        await driver.get('https://discord.com/app');
        
        // Clear localStorage and sessionStorage
        await driver.executeScript('window.localStorage.clear();');
        await driver.executeScript('window.sessionStorage.clear();');
        
        console.log('⏳ MANUAL LOGIN REQUIRED!');
        console.log('========================');
        console.log('Please log in to Discord manually in the browser window.');
        console.log('You have 3 minutes to complete the login process.');
        console.log('The scraper will continue automatically after login...');
        
        // Wait for manual login (3 minutes)
        await driver.sleep(180000); // 3 minutes
        
        console.log('✅ Login timer completed. Starting Discord channel scraping...');
        
        const allData = {
            timestamp: new Date().toISOString(),
            sources: [],
            discordChannels: [],
            totalChannels: discordChannels.length,
            successfulChannels: 0,
            failedChannels: 0
        };
        
        // Scrape each Discord channel
        for (let i = 0; i < discordChannels.length; i++) {
            const url = discordChannels[i];
            console.log(`\n📱 [${i + 1}/${discordChannels.length}] Scraping Discord channel: ${url}`);
            
            try {
                await driver.get(url);
                await driver.sleep(3000); // Wait for page load
                
                // Try to get Discord message content
                let content = '';
                try {
                    // Wait for content to load
                    await driver.sleep(2000);
                    
                    // Try multiple selectors for Discord messages
                    const selectors = [
                        '[data-message-id]',
                        '[class*="message"]',
                        '[class*="Message"]',
                        '[class*="content"]',
                        '[class*="markup"]',
                        'div[role="listitem"]',
                        '[class*="messageContent"]',
                        '[class*="messageContent-"]',
                        '[class*="markup-"]',
                        '[class*="markup"]'
                    ];
                    
                    let messages = [];
                    for (const selector of selectors) {
                        try {
                            const elements = await driver.findElements(By.css(selector));
                            if (elements.length > 0) {
                                console.log(`📝 Found ${elements.length} elements with selector: ${selector}`);
                                for (const element of elements.slice(0, 20)) { // Check more messages
                                    try {
                                        const text = await element.getText();
                                        if (text && text.trim() && text.length > 10) {
                                            messages.push(text.trim());
                                        }
                                    } catch (e) {
                                        // Skip if can't get text
                                    }
                                }
                                if (messages.length > 0) break; // Stop if we found content
                            }
                        } catch (e) {
                            // Try next selector
                        }
                    }
                    
                    // Also try to get all text from the page
                    if (messages.length === 0) {
                        try {
                            const bodyText = await driver.findElement(By.tagName('body')).getText();
                            if (bodyText && bodyText.length > 100) {
                                messages.push(bodyText);
                            }
                        } catch (e) {
                            console.log('⚠️ Could not get body text');
                        }
                    }
                    
                    content = messages.join('\n\n');
                    console.log(`📊 Extracted ${content.length} characters of content`);
                    
                } catch (e) {
                    console.log('⚠️ Could not extract message content:', e.message);
                }
                
                if (content && content.length > 20) {
                    allData.discordChannels.push({
                        url: url,
                        content: content,
                        scrapedAt: new Date().toISOString(),
                        contentLength: content.length
                    });
                    allData.successfulChannels++;
                    console.log(`✅ Successfully scraped channel (${content.length} chars)`);
                } else {
                    console.log(`⚠️ Channel had insufficient content (${content ? content.length : 0} chars)`);
                    allData.failedChannels++;
                }
                
            } catch (error) {
                console.log(`❌ Failed to scrape channel ${url}: ${error.message}`);
                allData.failedChannels++;
            }
            
            // Random delay between channels
            const delay = Math.random() * 5000 + 3000; // 3-8 seconds
            console.log(`⏳ Waiting ${Math.round(delay/1000)}s before next channel...`);
            await driver.sleep(delay);
        }
        
        // Save results
        const outputFile = path.join(__dirname, '..', 'data', `discord-scraped-data-${Date.now()}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        
        console.log('\n📊 DISCORD SCRAPING COMPLETE!');
        console.log('=============================');
        console.log(`✅ Total channels: ${allData.totalChannels}`);
        console.log(`✅ Successful: ${allData.successfulChannels}`);
        console.log(`❌ Failed: ${allData.failedChannels}`);
        console.log(`📁 Data saved to: ${outputFile}`);
        
    } catch (error) {
        console.error('❌ Discord scraper failed:', error);
    } finally {
        await driver.quit();
    }
}

// Run the scraper
scrapeDiscordChannels().catch(console.error);
