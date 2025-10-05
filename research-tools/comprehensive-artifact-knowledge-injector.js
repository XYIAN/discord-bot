const fs = require('fs');
const path = require('path');

async function injectComprehensiveArtifactKnowledge() {
    console.log('🚀 Injecting comprehensive artifact knowledge into bot database...');
    
    try {
        // Read the comprehensive artifact data
        const artifactData = JSON.parse(fs.readFileSync('comprehensive-artifact-data-1759694426991.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Create comprehensive artifact knowledge base
        const enhancedKnowledge = {
            timestamp: new Date().toISOString(),
            sources: ['Official Archero 2 Wiki', 'Game Vault'],
            artifacts: {
                sets: artifactData.artifactSets,
                mythic: artifactData.allArtifacts.mythic,
                legendary: artifactData.allArtifacts.legendary,
                mechanics: {
                    wishTokens: "Artifacts can be obtained by using Wish Token in the shop tab",
                    sources: ["Sky Tower", "Tasks", "Purchases", "Events"],
                    guarantee: "You are guaranteed a Legendary or Mythic Artifact if you unsuccessfully find one within 100 wishes",
                    stars: "Each Artifact can be increased to 15 Star which increases the Artifacts base stats. Each Star adds +50% base stats",
                    sets: "Artifact sets provide bonus stats when multiple artifacts from the same set are equipped"
                }
            },
            // Keep existing knowledge
            weapons: botKnowledge.weapons || {},
            characters: botKnowledge.characters || {},
            mechanics: botKnowledge.mechanics || {},
            events: botKnowledge.events || {},
            guild: botKnowledge.guild || {}
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
            artifactSets: Object.keys(artifactData.artifactSets).length,
            mythicArtifacts: artifactData.allArtifacts.mythic.length,
            legendaryArtifacts: artifactData.allArtifacts.legendary.length,
            totalArtifacts: artifactData.allArtifacts.mythic.length + artifactData.allArtifacts.legendary.length
        };
        
        console.log('📊 Comprehensive Artifact Knowledge Injection Summary:');
        console.log(`- Artifact sets: ${summary.artifactSets}`);
        console.log(`- Mythic artifacts: ${summary.mythicArtifacts}`);
        console.log(`- Legendary artifacts: ${summary.legendaryArtifacts}`);
        console.log(`- Total artifacts: ${summary.totalArtifacts}`);
        
        // List all artifact sets
        console.log('\n🎯 Artifact Sets Available:');
        Object.keys(artifactData.artifactSets).forEach((setKey, index) => {
            const set = artifactData.artifactSets[setKey];
            console.log(`${index + 1}. ${set.name}`);
            console.log(`   Artifacts: ${set.artifacts.join(', ')}`);
            console.log(`   Bonuses: ${Object.keys(set.bonuses).length} star levels`);
        });
        
        // Send to admin webhook
        const adminWebhook = 'https://discordapp.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2';
        
        const axios = require('axios');
        await axios.post(adminWebhook, {
            content: `🧠 **Comprehensive Artifact Knowledge Base Updated**\n\n✅ Successfully injected complete artifact system knowledge\n📊 Enhanced with ${summary.artifactSets} artifact sets, ${summary.mythicArtifacts} mythic artifacts, ${summary.legendaryArtifacts} legendary artifacts\n🎯 Total artifacts: ${summary.totalArtifacts}\n🕒 Last updated: ${new Date().toISOString()}`
        });
        
        console.log('✅ Comprehensive artifact knowledge injection completed successfully');
        return mergedKnowledge;
        
    } catch (error) {
        console.error('❌ Comprehensive artifact knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectComprehensiveArtifactKnowledge()
        .then(data => {
            console.log('✅ Comprehensive artifact knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Comprehensive artifact knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectComprehensiveArtifactKnowledge };
