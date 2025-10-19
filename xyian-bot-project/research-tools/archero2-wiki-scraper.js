const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function scrapeArchero2Wiki() {
    console.log('🚀 Starting Archero 2 Wiki scraper...');
    
    // Set up Chrome options to mimic human behavior
    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    options.addArguments('--window-size=1920,1080');
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    try {
        const wikiData = {
            timestamp: new Date().toISOString(),
            mainPage: {},
            pullRates: {},
            talentCards: {},
            artifacts: {},
            events: {},
            skills: {},
            weapons: [],
            characters: [],
            mechanics: []
        };
        
        // Scrape main wiki page
        console.log('📚 Scraping main wiki page...');
        await driver.get('https://archero-2.game-vault.net/wiki/Main_Page');
        await driver.sleep(3000);
        
        try {
            const mainContent = await driver.findElement(By.css('body')).getText();
            wikiData.mainPage.content = mainContent.substring(0, 2000);
            console.log('✅ Main page scraped');
        } catch (error) {
            console.log('⚠️ Could not scrape main page');
        }
        
        // Scrape Pull Rates page
        console.log('📊 Scraping Pull Rates page...');
        await driver.get('https://archero-2.game-vault.net/wiki/Pull_Rates');
        await driver.sleep(3000);
        
        try {
            const pullRatesContent = await driver.findElement(By.css('body')).getText();
            wikiData.pullRates.content = pullRatesContent.substring(0, 2000);
            console.log('✅ Pull Rates page scraped');
        } catch (error) {
            console.log('⚠️ Could not scrape Pull Rates page');
        }
        
        // Scrape Talent Cards page
        console.log('🃏 Scraping Talent Cards page...');
        await driver.get('https://archero-2.game-vault.net/wiki/Talent_Cards');
        await driver.sleep(3000);
        
        try {
            const talentCardsContent = await driver.findElement(By.css('body')).getText();
            wikiData.talentCards.content = talentCardsContent.substring(0, 2000);
            console.log('✅ Talent Cards page scraped');
        } catch (error) {
            console.log('⚠️ Could not scrape Talent Cards page');
        }
        
        // Scrape Artifacts page
        console.log('🏺 Scraping Artifacts page...');
        await driver.get('https://archero-2.game-vault.net/wiki/Artifacts');
        await driver.sleep(3000);
        
        try {
            const artifactsContent = await driver.findElement(By.css('body')).getText();
            wikiData.artifacts.content = artifactsContent.substring(0, 2000);
            console.log('✅ Artifacts page scraped');
        } catch (error) {
            console.log('⚠️ Could not scrape Artifacts page');
        }
        
        // Scrape Events page
        console.log('🎉 Scraping Events page...');
        await driver.get('https://archero-2.game-vault.net/wiki/Events');
        await driver.sleep(3000);
        
        try {
            const eventsContent = await driver.findElement(By.css('body')).getText();
            wikiData.events.content = eventsContent.substring(0, 2000);
            console.log('✅ Events page scraped');
        } catch (error) {
            console.log('⚠️ Could not scrape Events page');
        }
        
        // Scrape Skills page
        console.log('⚡ Scraping Skills page...');
        await driver.get('https://archero-2.game-vault.net/wiki/Skills');
        await driver.sleep(3000);
        
        try {
            const skillsContent = await driver.findElement(By.css('body')).getText();
            wikiData.skills.content = skillsContent.substring(0, 2000);
            console.log('✅ Skills page scraped');
        } catch (error) {
            console.log('⚠️ Could not scrape Skills page');
        }
        
        // Extract specific game information from all content
        const allContent = [
            wikiData.mainPage.content,
            wikiData.pullRates.content,
            wikiData.talentCards.content,
            wikiData.artifacts.content,
            wikiData.events.content,
            wikiData.skills.content
        ].join(' ');
        
        // Extract weapons information
        const weaponMatches = allContent.match(/weapon[^<]*/gi) || [];
        const staffMatches = allContent.match(/staff[^<]*/gi) || [];
        const clawsMatches = allContent.match(/claws[^<]*/gi) || [];
        const crossbowMatches = allContent.match(/crossbow[^<]*/gi) || [];
        
        wikiData.weapons.push(...weaponMatches.slice(0, 10));
        wikiData.weapons.push(...staffMatches.slice(0, 5));
        wikiData.weapons.push(...clawsMatches.slice(0, 5));
        wikiData.weapons.push(...crossbowMatches.slice(0, 5));
        
        // Extract characters information
        const characterMatches = allContent.match(/character[^<]*/gi) || [];
        const resonanceMatches = allContent.match(/resonance[^<]*/gi) || [];
        const alexMatches = allContent.match(/alex[^<]*/gi) || [];
        const helixMatches = allContent.match(/helix[^<]*/gi) || [];
        
        wikiData.characters.push(...characterMatches.slice(0, 10));
        wikiData.characters.push(...resonanceMatches.slice(0, 10));
        wikiData.characters.push(...alexMatches.slice(0, 5));
        wikiData.characters.push(...helixMatches.slice(0, 5));
        
        // Extract mechanics information
        const upgradeMatches = allContent.match(/upgrade[^<]*/gi) || [];
        const tierMatches = allContent.match(/tier[^<]*/gi) || [];
        const mythicMatches = allContent.match(/mythic[^<]*/gi) || [];
        const chaoticMatches = allContent.match(/chaotic[^<]*/gi) || [];
        
        wikiData.mechanics.push(...upgradeMatches.slice(0, 10));
        wikiData.mechanics.push(...tierMatches.slice(0, 10));
        wikiData.mechanics.push(...mythicMatches.slice(0, 5));
        wikiData.mechanics.push(...chaoticMatches.slice(0, 5));
        
        // Save comprehensive wiki data
        const filename = `archero2-wiki-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(wikiData, null, 2));
        console.log(`💾 Saved wiki data to ${filename}`);
        
        // Send summary to debug channel
        const summary = {
            pagesScraped: 6,
            weaponsFound: wikiData.weapons.length,
            charactersFound: wikiData.characters.length,
            mechanicsFound: wikiData.mechanics.length,
            totalContentLength: allContent.length
        };
        
        console.log('📊 Wiki Scraping Summary:');
        console.log(`- Pages scraped: ${summary.pagesScraped}`);
        console.log(`- Weapons found: ${summary.weaponsFound}`);
        console.log(`- Characters found: ${summary.charactersFound}`);
        console.log(`- Mechanics found: ${summary.mechanicsFound}`);
        console.log(`- Total content length: ${summary.totalContentLength} characters`);
        
        return wikiData;
        
    } catch (error) {
        console.error('❌ Wiki scraping error:', error);
        throw error;
    } finally {
        await driver.quit();
        console.log('🔚 Browser closed');
    }
}

// Run the scraper
if (require.main === module) {
    scrapeArchero2Wiki()
        .then(data => {
            console.log('✅ Wiki scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Wiki scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeArchero2Wiki };
