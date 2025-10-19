const axios = require('axios');
const fs = require('fs');

async function scrapeArchero2WikiFromDiscord() {
    console.log('🚀 Starting Archero 2 Wiki scraper from Discord sources...');
    
    const wikiData = {
        timestamp: new Date().toISOString(),
        sources: [],
        weapons: [],
        characters: [],
        events: [],
        mechanics: [],
        artifacts: [],
        skills: []
    };
    
    // Known wiki URLs from Discord
    const wikiUrls = [
        'https://archero-2.game-vault.net/wiki/Main_Page',
        'https://archero-2.game-vault.net/wiki/Pull_Rates',
        'https://archero-2.game-vault.net/wiki/Talent_Cards',
        'https://archero-2.game-vault.net/wiki/Artifacts',
        'https://archero-2.game-vault.net/wiki/Events',
        'https://archero-2.game-vault.net/wiki/Skills'
    ];
    
    for (const url of wikiUrls) {
        try {
            console.log(`📚 Scraping ${url}...`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            
            const content = response.data;
            const pageName = url.split('/').pop();
            
            wikiData.sources.push({
                url: url,
                pageName: pageName,
                contentLength: content.length,
                scraped: true
            });
            
            // Extract game information from content
            const weaponMatches = content.match(/weapon[^<]*/gi) || [];
            const characterMatches = content.match(/character[^<]*/gi) || [];
            const eventMatches = content.match(/event[^<]*/gi) || [];
            const mechanicMatches = content.match(/upgrade[^<]*|tier[^<]*|mythic[^<]*|chaotic[^<]*/gi) || [];
            const artifactMatches = content.match(/artifact[^<]*/gi) || [];
            const skillMatches = content.match(/skill[^<]*/gi) || [];
            
            wikiData.weapons.push(...weaponMatches.slice(0, 5));
            wikiData.characters.push(...characterMatches.slice(0, 5));
            wikiData.events.push(...eventMatches.slice(0, 5));
            wikiData.mechanics.push(...mechanicMatches.slice(0, 5));
            wikiData.artifacts.push(...artifactMatches.slice(0, 5));
            wikiData.skills.push(...skillMatches.slice(0, 5));
            
            console.log(`✅ ${pageName} scraped successfully`);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.log(`⚠️ Failed to scrape ${url}: ${error.message}`);
            wikiData.sources.push({
                url: url,
                pageName: url.split('/').pop(),
                error: error.message,
                scraped: false
            });
        }
    }
    
    // Add known game information from Discord knowledge
    const knownGameInfo = {
        weapons: [
            'Oracle Staff - S-tier mage weapon',
            'Griffin Claws - S-tier melee weapon', 
            'Dragoon Crossbow - S-tier ranged weapon',
            'Beam Staff - Basic weapon (not S-tier)',
            'Claw - Basic weapon (not S-tier)',
            'Bow - Basic weapon (not S-tier)'
        ],
        characters: [
            'Alex - 3-star resonance with Nyanja cloudfooted skill',
            'Nyanja - Cloudfooted skill for resonance',
            'Rolla - Best for 3-star resonance slot',
            'Helix - Best for 3-star resonance slot',
            'Loki - Best for 6-star resonance slot',
            'Demon King - Best for 6-star resonance slot',
            'Otta - Best for 6-star resonance slot'
        ],
        mechanics: [
            'Resonance: 3-star and 6-star slots unlock character abilities',
            'Upgrade System: Epic +1/+2, Legendary +1/+2/+3, Mythic +1/+2/+3/+4, Chaotic',
            'S-tier weapons can go to Chaotic tier',
            'Basic weapons limited to Legendary +3',
            'Events rotate monthly (Fishing, Umbral Tempest, Otherworld Summon)',
            'Guild requirements: 2 daily boss battles, 1 daily donation'
        ],
        events: [
            'Fishing Event - Gives etched runes, free/gems',
            'Umbral Tempest - Current event (may be active)',
            'Otherworld Summon - Thor and Demon King, cash-only',
            'Events typically cost cash or gems',
            'Save gems for fishing event when it returns'
        ]
    };
    
    // Merge known information
    wikiData.weapons.push(...knownGameInfo.weapons);
    wikiData.characters.push(...knownGameInfo.characters);
    wikiData.mechanics.push(...knownGameInfo.mechanics);
    wikiData.events.push(...knownGameInfo.events);
    
    // Save comprehensive data
    const filename = `archero2-discord-wiki-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(wikiData, null, 2));
    console.log(`💾 Saved wiki data to ${filename}`);
    
    // Send summary
    const summary = {
        sourcesScraped: wikiData.sources.filter(s => s.scraped).length,
        sourcesFailed: wikiData.sources.filter(s => !s.scraped).length,
        weaponsFound: wikiData.weapons.length,
        charactersFound: wikiData.characters.length,
        eventsFound: wikiData.events.length,
        mechanicsFound: wikiData.mechanics.length,
        artifactsFound: wikiData.artifacts.length,
        skillsFound: wikiData.skills.length
    };
    
    console.log('📊 Discord Wiki Scraping Summary:');
    console.log(`- Sources scraped: ${summary.sourcesScraped}`);
    console.log(`- Sources failed: ${summary.sourcesFailed}`);
    console.log(`- Weapons found: ${summary.weaponsFound}`);
    console.log(`- Characters found: ${summary.charactersFound}`);
    console.log(`- Events found: ${summary.eventsFound}`);
    console.log(`- Mechanics found: ${summary.mechanicsFound}`);
    console.log(`- Artifacts found: ${summary.artifactsFound}`);
    console.log(`- Skills found: ${summary.skillsFound}`);
    
    return wikiData;
}

// Run the scraper
if (require.main === module) {
    scrapeArchero2WikiFromDiscord()
        .then(data => {
            console.log('✅ Discord wiki scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Discord wiki scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeArchero2WikiFromDiscord };
