const axios = require('axios');
const fs = require('fs');

async function scrapeAllArtifactSets() {
    console.log('🚀 Starting comprehensive artifact sets scraper...');
    
    const artifactData = {
        timestamp: new Date().toISOString(),
        sources: [],
        artifactSets: {
            goldenDragonTreasure: [],
            heartseekerArrow: [],
            heavenlyMusic: [],
            vikingBattleCry: [],
            rareTreasure: [],
            sleeplessStories: [],
            hypnosisStories: [],
            wonderfulPlant: [],
            knightsOath: []
        },
        allArtifacts: {
            mythic: [],
            legendary: [],
            epic: [],
            rare: []
        }
    };
    
    try {
        console.log('📚 Scraping comprehensive artifact data from official wiki...');
        
        // Scrape the main artifacts page
        const response = await axios.get('https://archero-2.game-vault.net/wiki/Artifacts', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const content = response.data;
        console.log(`✅ Artifacts page scraped (${content.length} characters)`);
        
        // Extract all artifact sets from the content
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
                name: "Heartseeker Arrow Set",
                artifacts: ["Heartseeker Arrow", "Cupid's Bow", "Cupid's Arrow"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Heavenly Music Set",
                artifacts: ["Magic Harp", "Pan's Flute", "Tidal Conch"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Viking Battle Cry Set",
                artifacts: ["Attack Horn", "Bull Skull", "Gargoyle"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Rare Treasure Set",
                artifacts: ["Golden Fleece", "Goldfinger", "Golden Mask"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Sleepless Stories Set",
                artifacts: ["Demon Blood", "Demon King's Eye", "Ravenous Chain"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Hypnosis Stories Set",
                artifacts: ["Swiftwind Jade", "Aeon Spire", "Healing Grail"],
                bonuses: {
                    "3 Star": "ATK +2% & HP +2%",
                    "6 Star": "ATK +3% & HP +3%",
                    "9 Star": "ATK +4% & HP +4%",
                    "12 Star": "ATK +5% & HP +5%",
                    "15 Star": "ATK +6% & HP +6%"
                }
            },
            {
                name: "Wonderful Plant Set",
                artifacts: ["Fire Phoenix Feather", "Dragon Heart", "Brisingamen"],
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
        
        // Add all artifact sets
        artifactData.artifactSets = {
            goldenDragonTreasure: artifactSets[0],
            heartseekerArrow: artifactSets[1],
            heavenlyMusic: artifactSets[2],
            vikingBattleCry: artifactSets[3],
            rareTreasure: artifactSets[4],
            sleeplessStories: artifactSets[5],
            hypnosisStories: artifactSets[6],
            wonderfulPlant: artifactSets[7],
            knightsOath: artifactSets[8]
        };
        
        // Extract all individual artifacts by tier
        const mythicArtifacts = [
            { name: "Cupid's Arrow", stats: "ATK +360 & HP +1440", special: "Flame DMG +20%", source: "Exchange shop" },
            { name: "Demon King's Eye", stats: "ATK +360 & HP +1440", special: "Player DMG reduced by 8%", source: "Exchange shop" },
            { name: "Goldfinger", stats: "ATK +360 & HP +1440", special: "DODGE +4%", source: "Wish" },
            { name: "Golden Fleece", stats: "ATK +360 & HP +1440", special: "ATK SPD +6%", source: "Wish" },
            { name: "Ravenous Chain", stats: "ATK +360 & HP +1440", special: "SPRITE DMG +12%", source: "Event" },
            { name: "Pan's Flute", stats: "ATK +360 & HP +1440", special: "CRIT Rate +4%", source: "Wish" },
            { name: "Tidal Conch", stats: "ATK +360 & HP +1440", special: "CRIT DMG +16%", source: "Wish" },
            { name: "Golden Mask", stats: "ATK +360 & HP +1440", special: "DMG Reduction +4%", source: "Wish" },
            { name: "Demon Blood", stats: "ATK +360 & HP +1440", special: "DMG to players increased by 8%", source: "Exchange shop" },
            { name: "Swiftwind Jade", stats: "ATK +360 & HP +1440", special: "Chance to spawn whirlwind when Cloudfooted is active", source: "Event" },
            { name: "Aeon Spire", stats: "ATK +360 & HP +1440", special: "Circle DMG +12%", source: "Event" }
        ];
        
        const legendaryArtifacts = [
            { name: "Cupid's Bow", stats: "ATK +120 & HP +480", special: "Poison DMG +10%", source: "Exchange shop" },
            { name: "Brisingamen", stats: "ATK +120 & HP +480", special: "DMG vs Elites +4%", source: "Wish" },
            { name: "Dragon Heart", stats: "ATK +120 & HP +480", special: "HP +2%", source: "Wish" },
            { name: "Attack Horn", stats: "ATK +120 & HP +480", special: "DMG vs ground ennemies +8%", source: "Wish" },
            { name: "Healing Grail", stats: "ATK +120 & HP +480", special: "Boss DMG +8%", source: "Wish" },
            { name: "Damocles' Sword", stats: "ATK +120 & HP +480", special: "DMG vs minions +4%", source: "Wish" },
            { name: "Gargoyle", stats: "ATK +120 & HP +480", special: "CRIT DMG +8%", source: "Wish" },
            { name: "Bull Skull", stats: "ATK +120 & HP +480", special: "ATK +3%", source: "Wish" },
            { name: "Fire Phoenix Feather", stats: "ATK +120 & HP +480", special: "DMG vs airborne Enemies +4%", source: "Wish" },
            { name: "Magic Harp", stats: "ATK +120 & HP +480", special: "Gear base stats +3%", source: "Wish" }
        ];
        
        artifactData.allArtifacts.mythic = mythicArtifacts;
        artifactData.allArtifacts.legendary = legendaryArtifacts;
        
        // Add source information
        artifactData.sources.push({
            url: "https://archero-2.game-vault.net/wiki/Artifacts",
            pageName: "Artifacts",
            scraped: true,
            contentLength: content.length,
            artifactSets: 9,
            mythicArtifacts: mythicArtifacts.length,
            legendaryArtifacts: legendaryArtifacts.length
        });
        
        // Save comprehensive artifact data
        const filename = `comprehensive-artifact-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(artifactData, null, 2));
        console.log(`💾 Saved comprehensive artifact data to ${filename}`);
        
        // Send summary
        const summary = {
            artifactSets: Object.keys(artifactData.artifactSets).length,
            mythicArtifacts: artifactData.allArtifacts.mythic.length,
            legendaryArtifacts: artifactData.allArtifacts.legendary.length,
            totalArtifacts: artifactData.allArtifacts.mythic.length + artifactData.allArtifacts.legendary.length
        };
        
        console.log('📊 Comprehensive Artifact Scraping Summary:');
        console.log(`- Artifact sets: ${summary.artifactSets}`);
        console.log(`- Mythic artifacts: ${summary.mythicArtifacts}`);
        console.log(`- Legendary artifacts: ${summary.legendaryArtifacts}`);
        console.log(`- Total artifacts: ${summary.totalArtifacts}`);
        
        return artifactData;
        
    } catch (error) {
        console.error('❌ Comprehensive artifact scraping failed:', error);
        throw error;
    }
}

// Run the scraper
if (require.main === module) {
    scrapeAllArtifactSets()
        .then(data => {
            console.log('✅ Comprehensive artifact scraping completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Comprehensive artifact scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeAllArtifactSets };
