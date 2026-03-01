const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

// All theorycrafting post URLs organized by category
const theorycraftingPosts = {
  general: [
    'https://discord.com/channels/1268830572743102505/1348520924793667684', // Beginners Guide FAQ
    'https://discord.com/channels/1268830572743102505/1417735501250564146', // Shopping Guide
    'https://discord.com/channels/1268830572743102505/1354841056331698442', // S-Tier Gear Swap & Advanced Fuse
    'https://discord.com/channels/1268830572743102505/1419485616910897234', // How Tickets Stack
    'https://discord.com/channels/1268830572743102505/1368477308893007983', // How element skills work
    'https://discord.com/channels/1268830572743102505/1377926377009057830', // Dragoon Set Guide
  ],
  pve: [
    'https://discord.com/channels/1268830572743102505/1394706549074821271', // Rune build for Oracle/Echo
    'https://discord.com/channels/1268830572743102505/1311545299248091226', // Most Efficient Chapter for Grin
    'https://discord.com/channels/1268830572743102505/1392597464581804152', // Archero 2 Damage Formula
    'https://discord.com/channels/1268830572743102505/1356901526961913877', // Front Arrow Calculation
    'https://discord.com/channels/1268830572743102505/1383146616260788245', // Staff Tracking
    'https://discord.com/channels/1268830572743102505/1374729958362185739', // The Boss Guide
    'https://discord.com/channels/1268830572743102505/1408840737952497704', // Shackled Jungle Guide
  ],
  pvp: [
    'https://discord.com/channels/1268830572743102505/1355348706202878012', // Arena Tips & FAQ
    'https://discord.com/channels/1268830572743102505/1340897089969852550', // Arena Build
    'https://discord.com/channels/1268830572743102505/1377264985847365763', // Dragoon Set Discussion
  ],
  events: [
    'https://discord.com/channels/1268830572743102505/1361194834500522055', // All Events Guide
    'https://discord.com/channels/1268830572743102505/1339806294311309446', // Popular Event Interval
    'https://discord.com/channels/1268830572743102505/1412491261553934426', // Event List Chart
    'https://discord.com/channels/1268830572743102505/1345022595422224476', // Dice Event Guide
    'https://discord.com/channels/1268830572743102505/1354856561369157844', // Fishing Event Guide
    'https://discord.com/channels/1268830572743102505/1393963122712117248', // Atreus/Thor Event Guide
    'https://discord.com/channels/1268830572743102505/1375351191835381850', // Lucky Treasure Wheels
    'https://discord.com/channels/1268830572743102505/1360494961765781726', // F2P Guide to World Tree's Pulse
  ],
  other: [
    'https://discord.com/channels/1268830572743102505/1374742804655243265', // Tryhards Screenshots
    'https://discord.com/channels/1268830572743102505/1354852979081085098', // Rune Theory Discussion
    'https://discord.com/channels/1268830572743102505/1308401390561001482', // Archero2 Build Maker
    'https://discord.com/channels/1268830572743102505/1310902072467652639', // Other discussions
  ]
};

async function scrapeTheorycraftingPosts() {
  let driver;
  
  try {
    console.log('🚀 Starting Theorycrafting Posts Scraper...');
    console.log('🧹 Starting with fresh browser session...');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .build();
    
    // Clear cache and hard refresh
    console.log('🗑️ Clearing browser cache...');
    await driver.manage().deleteAllCookies();
    
    // Navigate to Discord first
    await driver.get('https://discord.com/app');
    console.log('📱 Opened Discord app');
    
    // Clear storage after navigation
    try {
      await driver.executeScript('window.localStorage.clear();');
      await driver.executeScript('window.sessionStorage.clear();');
    } catch (e) {
      console.log('⚠️ Could not clear storage (normal for some browsers)');
    }
    
    // Hard refresh to ensure clean state
    console.log('🔄 Performing hard refresh...');
    await driver.navigate().refresh();
    await driver.sleep(2000); // Wait for refresh to complete
    
    console.log('⏰ Manual login timer: 5 minutes - please log into Discord manually');
    console.log('⏳ Waiting 5 minutes for manual login...');
    await driver.sleep(300000); // 5 minutes
    
    console.log('✅ Manual login period complete, starting scraping...');
    
    const allData = {
      scrapedAt: new Date().toISOString(),
      totalPosts: 0,
      categories: {}
    };
    
    // Scrape each category
    for (const [category, urls] of Object.entries(theorycraftingPosts)) {
      console.log(`\n📂 Scraping ${category.toUpperCase()} category (${urls.length} posts)...`);
      
      allData.categories[category] = {
        postCount: urls.length,
        posts: []
      };
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n🔗 Scraping post ${i + 1}/${urls.length}: ${url}`);
        
        try {
          // Navigate to the post
          await driver.get(url);
          
          // Wait for content to load
          await driver.sleep(Math.random() * 3000 + 2000); // 2-5 seconds
          
          // Random scroll to mimic human behavior
          await driver.executeScript('window.scrollBy(0, arguments[0]);', Math.random() * 500 + 100);
          await driver.sleep(Math.random() * 2000 + 1000);
          
          // Try to get the main content with multiple selectors
          let content = '';
          try {
            // Wait for content to load
            await driver.sleep(3000);
            
            // Try multiple selectors for Discord messages
            const selectors = [
              '[data-message-id]',
              '[class*="message"]',
              '[class*="Message"]',
              '[class*="content"]',
              '[class*="markup"]',
              'div[role="listitem"]',
              'div[class*="messageContent"]',
              'div[class*="messageContent-"]',
              'div[class*="markup-"]',
              'div[class*="markup"]'
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
            allData.categories[category].posts.push({
              url: url,
              content: content,
              scrapedAt: new Date().toISOString()
            });
            console.log(`✅ Successfully scraped post ${i + 1} (${content.length} chars)`);
          } else {
            console.log(`⚠️ Post ${i + 1} had insufficient content (${content ? content.length : 0} chars)`);
            // Debug: save the page source for inspection
            try {
              const pageSource = await driver.getPageSource();
              console.log(`🔍 Page source length: ${pageSource.length} characters`);
            } catch (e) {
              console.log('⚠️ Could not get page source');
            }
          }
          
          // Human-like delay between posts
          await driver.sleep(Math.random() * 8000 + 5000); // 5-13 seconds
          
        } catch (error) {
          console.log(`❌ Error scraping post ${i + 1}: ${error.message}`);
        }
      }
      
      allData.totalPosts += allData.categories[category].posts.length;
      console.log(`✅ Completed ${category} category: ${allData.categories[category].posts.length} posts scraped`);
    }
    
    // Save the data
    const filename = `theorycrafting-posts-data-${Date.now()}.json`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, JSON.stringify(allData, null, 2));
    
    console.log(`\n🎉 Scraping complete!`);
    console.log(`📊 Total posts scraped: ${allData.totalPosts}`);
    console.log(`💾 Data saved to: ${filename}`);
    
    // Show summary
    console.log('\n📋 Summary by category:');
    for (const [category, data] of Object.entries(allData.categories)) {
      console.log(`  ${category.toUpperCase()}: ${data.posts.length}/${data.postCount} posts`);
    }
    
  } catch (error) {
    console.error('❌ Scraper failed:', error.message);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Run the scraper
scrapeTheorycraftingPosts();
