const fs = require('fs');
const path = require('path');

async function injectOfficialWikiKnowledge() {
    console.log('🚀 Injecting official wiki knowledge into bot database...');
    
    try {
        // Read the scraped official wiki data
        const wikiData = JSON.parse(fs.readFileSync('archero2-official-wiki-data-1759694294205.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create comprehensive knowledge base from official wiki
        const enhancedKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault'],
            artifacts: {
                mythic: wikiData.artifacts.mythic,
                legendary: wikiData.artifacts.legendary,
                sets: wikiData.artifacts.sets,
                mechanics: {
                    wishTokens: "Artifacts can be obtained by using Wish Token in the shop tab",
                    sources: ["Sky Tower", "Tasks", "Purchases", "Events"],
                    guarantee: "You are guaranteed a Legendary or Mythic Artifact if you unsuccessfully find one within 100 wishes",
                    stars: "Each Artifact can be increased to 15 Star which increases the Artifacts base stats. Each Star adds +50% base stats"
                }
            },
            weapons: {
                sTier: [
                    'Oracle Staff - S-tier mage weapon',
                    'Griffin Claws - S-tier melee weapon',
                    'Dragoon Crossbow - S-tier ranged weapon'
                ],
                basic: [
                    'Beam Staff - Basic weapon (not S-tier)',
                    'Claw - Basic weapon (not S-tier)',
                    'Bow - Basic weapon (not S-tier)'
                ],
                upgradeLimits: {
                    sTier: 'Can go to Chaotic tier',
                    basic: 'Limited to Legendary +3'
                }
            },
            characters: {
                resonance: {
                    threeStar: ['Alex', 'Nyanja', 'Rolla', 'Helix'],
                    sixStar: ['Loki', 'Demon King', 'Otta']
                },
                skills: {
                    alex: '3-star resonance with Nyanja cloudfooted skill',
                    nyanja: 'Cloudfooted skill for resonance',
                    rolla: 'Best for 3-star resonance slot',
                    helix: 'Best for 3-star resonance slot',
                    loki: 'Best for 6-star resonance slot',
                    demonKing: 'Best for 6-star resonance slot',
                    otta: 'Best for 6-star resonance slot'
                }
            },
            mechanics: {
                resonance: '3-star and 6-star slots unlock character abilities',
                upgradeSystem: {
                    epic: '+1/+2 (1 epic consumed each)',
                    legendary: '+1/+2/+3 (1 legendary consumed each, +3 needs 2 legendaries)',
                    mythic: '+1/+2/+3/+4',
                    chaotic: 'Requires Mythic +4 + 14 epic Griffin helmets OR 42 epic helmets OR 38 legendary helmets'
                },
                events: {
                    current: 'Umbral Tempest (may be active)',
                    best: 'Fishing event (gives etched runes, free/gems)',
                    cashOnly: 'Otherworld Summon (Thor and Demon King)',
                    rotation: 'Events rotate monthly'
                }
            },
            events: {
                fishing: 'Gives etched runes, free/gems',
                umbralTempest: 'Current event (may be active)',
                otherworldSummon: 'Thor and Demon King, cash-only',
                cost: 'Events typically cost cash or gems',
                advice: 'Save gems for fishing event when it returns'
            },
            guild: {
                requirements: '2 daily boss battles, 1 daily donation',
                recruitment: 'Daily active and looking for 300k power or over'
            },
            // New comprehensive data from official wiki
            officialWiki: {
                artifacts: wikiData.artifacts,
                weapons: wikiData.weapons,
                characters: wikiData.characters,
                events: wikiData.events,
                mechanics: wikiData.mechanics,
                sources: wikiData.sources
            }
        };
        
        // Merge with existing knowledge
        const mergedKnowledge = {
            ...botKnowledge,
            ...enhancedKnowledge,
            lastUpdated: new Date().toISOString()
        };
        
        // Save enhanced knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(mergedKnowledge, null, 2));
        console.log(`✅ Enhanced knowledge saved to ${botKnowledgePath}`);
        
        // Create a summary for the bot
        const summary = {
            mythicArtifacts: enhancedKnowledge.artifacts.mythic.length,
            legendaryArtifacts: enhancedKnowledge.artifacts.legendary.length,
            artifactSets: enhancedKnowledge.artifacts.sets.length,
            weapons: enhancedKnowledge.weapons.sTier.length + enhancedKnowledge.weapons.basic.length,
            characters: Object.keys(enhancedKnowledge.characters).length,
            mechanics: Object.keys(enhancedKnowledge.mechanics).length,
            events: Object.keys(enhancedKnowledge.events).length,
            guild: Object.keys(enhancedKnowledge.guild).length,
            sources: enhancedKnowledge.officialWiki.sources.length
        };
        
        console.log('📊 Official Wiki Knowledge Injection Summary:');
        console.log(`- Mythic artifacts: ${summary.mythicArtifacts}`);
        console.log(`- Legendary artifacts: ${summary.legendaryArtifacts}`);
        console.log(`- Artifact sets: ${summary.artifactSets}`);
        console.log(`- Weapons: ${summary.weapons}`);
        console.log(`- Characters: ${summary.characters} categories`);
        console.log(`- Mechanics: ${summary.mechanics} categories`);
        console.log(`- Events: ${summary.events} categories`);
        console.log(`- Guild: ${summary.guild} categories`);
        console.log(`- Sources: ${summary.sources} wiki pages`);
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **Official Wiki Knowledge Base Updated**\n\n✅ Successfully injected official Archero 2 wiki knowledge\n📊 Enhanced with ${summary.mythicArtifacts} mythic artifacts, ${summary.legendaryArtifacts} legendary artifacts, ${summary.artifactSets} artifact sets\n🎯 Sources: ${summary.sources} official wiki pages\n🕒 Last updated: ${new Date().toISOString()}`
        });
        
        console.log('✅ Official wiki knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ Official wiki knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectOfficialWikiKnowledge()
        .then(data => {
            console.log('✅ Official wiki knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Official wiki knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectOfficialWikiKnowledge };
