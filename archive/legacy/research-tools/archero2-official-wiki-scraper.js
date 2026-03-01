const axios = require('axios');
const fs = require('fs');

async function scrapeArchero2OfficialWiki() {
    console.log('🚀 Starting Archero 2 Official Wiki scraper...');
    
    const wikiData = {
        timestamp: new Date().toISOString(),
        sources: [],
        artifacts: {
            mythic: [],
            legendary: [],
            epic: [],
            rare: [],
            sets: []
        },
        weapons: [],
        characters: [],
        events: [],
        mechanics: []
    };
    
    // Scrape the Artifacts page (we already have this content)
    try {
        console.log('📚 Processing Artifacts page content...');
        
        // Extract artifact information from the provided content
        const artifactData = {
            mythic: [
                {
                    name: "Cupid's Arrow",
                    description: "This arrow burns with fiery passion, igniting the flames of love within the soul",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "Flame DMG +20%",
                    obtainFrom: "Exchange shop"
                },
                {
                    name: "Demon King's Eye",
                    description: "An eye sealed in a gemstone. It greedily devours everything it see's",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "Player DMG reduced by 8%",
                    obtainFrom: "Exchange shop"
                },
                {
                    name: "Goldfinger",
                    description: "Every stone it touches turns to gold",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "DODGE +4%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Golden Fleece",
                    description: "Not just any wool, but a treasure every adventurer dreams of",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "ATK SPD +6%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Ravenous Chain",
                    description: "A chain forged with demonic fangs",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "SPRITE DMG +12%",
                    obtainFrom: "Event"
                },
                {
                    name: "Pan's Flute",
                    description: "A flute full of magic. It's sounds attracts cattle",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "CRIT Rate +4%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Tidal Conch",
                    description: "Holds the power of the ocean",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "CRIT DMG +16%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Golden Mask",
                    description: "Beneath the mask, it sparks the imagination",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "DMG Reduction +4%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Demon Blood",
                    description: "A blood sample labelled 'Flammable and Explosive'",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "DMG to players increased by 8%",
                    obtainFrom: "Exchange shop"
                },
                {
                    name: "Swiftwind Jade",
                    description: "Infused with the power of raging winds",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "Chance to spawn whirlwind when Cloudfooted is active",
                    obtainFrom: "Event"
                },
                {
                    name: "Aeon Spire",
                    description: "Forged by Vidar himself, this elegant blade harvests all souls in its path",
                    baseStats: "ATK +360 & HP +1440",
                    specialStats: "Circle DMG +12%",
                    obtainFrom: "Event"
                }
            ],
            legendary: [
                {
                    name: "Cupid's Bow",
                    description: "Love is the worlds sweetest passion-once tainted, there is no escape",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "Poison DMG +10%",
                    obtainFrom: "Exchange shop"
                },
                {
                    name: "Brisingamen",
                    description: "A treasure forged by four dwarven smiths, fought over by gods",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "DMG vs Elites +4%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Dragon Heart",
                    description: "Look, even after leaving the dragon's body, it still beats",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "HP +2%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Attack Horn",
                    description: "Charge! Charge! Let the ennemies feel the wrath of the Viking warriors",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "DMG vs ground ennemies +8%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Healing Grail",
                    description: "This cup's water can heal ailments. What, for drinking? Hmm... no one has tried yet",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "Boss DMG +8%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Damocles' Sword",
                    description: "The tangible Samocles' sword can be easily avoided, while the intangible one is everywhere",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "DMG vs minions +4%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Gargoyle",
                    description: "Well, it looks scary, but it's meant too",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "CRIT DMG +8%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Bull Skull",
                    description: "An unrotting hard bone, symbolizing strength",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "ATK +3%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Fire Phoenix Feather",
                    description: "Feathers glowing with flames, seeming to hold power",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "DMG vs airborne Enemies +4%",
                    obtainFrom: "Wish"
                },
                {
                    name: "Magic Harp",
                    description: "Play it, you'll witness a magical feast",
                    baseStats: "ATK +120 & HP +480",
                    specialStats: "Gear base stats +3%",
                    obtainFrom: "Wish"
                }
            ]
        };
        
        wikiData.artifacts = artifactData;
        
        // Extract artifact sets
        const artifactSets = [
            {
                name: "Golden Dragon's Treasure Set",
                artifacts: ["Pumpkin Lantern", "Four-Leaf Clover", "Laurel Wreath"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Knight's Oath Set",
                artifacts: ["Gladiator's Helm", "Sword in the Stone", "Iron Throne", "Supreme Staff"],
                bonuses: {
                    "3 Star": "ATK +1% & HP +1%",
                    "6 Star": "ATK +1.5% & HP +1.5%",
                    "9 Star": "ATK +2% & HP +2%",
                    "12 Star": "ATK +2.5% & HP +2.5%",
                    "15 Star": "ATK +3% & HP +3%"
                }
            }
        ];
        
        wikiData.artifacts.sets = artifactSets;
        
        // Extract mechanics information
        wikiData.mechanics.push({
            type: "Artifact System",
            description: "Artifacts can be obtained by using Wish Token in the shop tab",
            sources: ["Sky Tower", "Tasks", "Purchases", "Events"],
            guarantee: "You are guaranteed a Legendary or Mythic Artifact if you unsuccessfully find one within 100 wishes",
            stars: "Each Artifact can be increased to 15 Star which increases the Artifacts base stats. Each Star adds +50% base stats"
        });
        
        wikiData.sources.push({
            url: "https://archero-2.game-vault.net/wiki/Artifacts",
            pageName: "Artifacts",
            scraped: true,
            contentLength: "Full artifact database"
        });
        
        console.log('✅ Artifacts page processed successfully');
        
    } catch (error) {
        console.log('⚠️ Error processing Artifacts page:', error.message);
    }
    
    // Now let's scrape other important pages
    const otherPages = [
        'https://archero-2.game-vault.net/wiki/Characters',
        'https://archero-2.game-vault.net/wiki/Gear',
        'https://archero-2.game-vault.net/wiki/Runes',
        'https://archero-2.game-vault.net/wiki/Skills',
        'https://archero-2.game-vault.net/wiki/Events',
        'https://archero-2.game-vault.net/wiki/Pull_Rates'
    ];
    
    for (const url of otherPages) {
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
                scraped: true,
                contentLength: content.length
            });
            
            // Extract game information from content
            const weaponMatches = content.match(/weapon[^<]*/gi) || [];
            const characterMatches = content.match(/character[^<]*/gi) || [];
            const eventMatches = content.match(/event[^<]*/gi) || [];
            const mechanicMatches = content.match(/upgrade[^<]*|tier[^<]*|mythic[^<]*|chaotic[^<]*/gi) || [];
            
            wikiData.weapons.push(...weaponMatches.slice(0, 5));
            wikiData.characters.push(...characterMatches.slice(0, 5));
            wikiData.events.push(...eventMatches.slice(0, 5));
            wikiData.mechanics.push(...mechanicMatches.slice(0, 5));
            
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
    
    // Save comprehensive wiki data
    const filename = `archero2-official-wiki-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(wikiData, null, 2));
    console.log(`💾 Saved wiki data to ${filename}`);
    
    // Send summary
    const summary = {
        sourcesScraped: wikiData.sources.filter(s => s.scraped).length,
        sourcesFailed: wikiData.sources.filter(s => !s.scraped).length,
        mythicArtifacts: wikiData.artifacts.mythic.length,
        legendaryArtifacts: wikiData.artifacts.legendary.length,
        artifactSets: wikiData.artifacts.sets.length,
        weaponsFound: wikiData.weapons.length,
        charactersFound: wikiData.characters.length,
        eventsFound: wikiData.events.length,
        mechanicsFound: wikiData.mechanics.length
    };
    
    console.log('📊 Official Wiki Scraping Summary:');
    console.log(`- Sources scraped: ${summary.sourcesScraped}`);
    console.log(`- Sources failed: ${summary.sourcesFailed}`);
    console.log(`- Mythic artifacts: ${summary.mythicArtifacts}`);
    console.log(`- Legendary artifacts: ${summary.legendaryArtifacts}`);
    console.log(`- Artifact sets: ${summary.artifactSets}`);
    console.log(`- Weapons found: ${summary.weaponsFound}`);
    console.log(`- Characters found: ${summary.charactersFound}`);
    console.log(`- Events found: ${summary.eventsFound}`);
    console.log(`- Mechanics found: ${summary.mechanicsFound}`);
    
    return wikiData;
}

// Run the scraper
if (require.main === module) {
    scrapeArchero2OfficialWiki()
        .then(data => {
            console.log('✅ Official wiki scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Official wiki scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeArchero2OfficialWiki };
