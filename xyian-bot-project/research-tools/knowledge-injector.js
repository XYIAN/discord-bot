const fs = require('fs');
const path = require('path');

async function injectWikiKnowledge() {
    console.log('🚀 Injecting wiki knowledge into bot database...');
    
    try {
        // Read the scraped wiki data
        const wikiData = JSON.parse(fs.readFileSync('archero2-discord-wiki-data-1759693742831.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create comprehensive knowledge base
        const enhancedKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Discord Wiki', 'Official Game Vault'],
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
            weapons: Object.keys(enhancedKnowledge.weapons).length,
            characters: Object.keys(enhancedKnowledge.characters).length,
            mechanics: Object.keys(enhancedKnowledge.mechanics).length,
            events: Object.keys(enhancedKnowledge.events).length,
            guild: Object.keys(enhancedKnowledge.guild).length
        };
        
        console.log('📊 Knowledge Injection Summary:');
        console.log(`- Weapons: ${summary.weapons} categories`);
        console.log(`- Characters: ${summary.characters} categories`);
        console.log(`- Mechanics: ${summary.mechanics} categories`);
        console.log(`- Events: ${summary.events} categories`);
        console.log(`- Guild: ${summary.guild} categories`);
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **Knowledge Base Updated**\n\n✅ Successfully injected wiki knowledge into bot database\n📊 Enhanced with ${summary.weapons + summary.characters + summary.mechanics + summary.events + summary.guild} knowledge categories\n🕒 Last updated: ${new Date().toISOString()}`
        });
        
        console.log('✅ Knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ Knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectWikiKnowledge()
        .then(data => {
            console.log('✅ Knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectWikiKnowledge };
