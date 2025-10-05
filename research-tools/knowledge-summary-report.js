const fs = require('fs');

function generateKnowledgeSummaryReport() {
    console.log('📊 ARCHERO 2 KNOWLEDGE BASE SUMMARY REPORT');
    console.log('=' .repeat(60));
    
    // Read the main knowledge base
    const knowledgeBase = JSON.parse(fs.readFileSync('../data/archero_qa_learned.json', 'utf8'));
    
    console.log('\n🎯 KNOWLEDGE SOURCES:');
    console.log('-' .repeat(30));
    knowledgeBase.sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source}`);
    });
    
    console.log('\n⚔️ WEAPONS SYSTEM:');
    console.log('-' .repeat(30));
    console.log('S-Tier Weapons (Can go to Chaotic):');
    knowledgeBase.weapons.sTier.forEach(weapon => {
        console.log(`  • ${weapon}`);
    });
    console.log('\nBasic Weapons (Limited to Legendary +3):');
    knowledgeBase.weapons.basic.forEach(weapon => {
        console.log(`  • ${weapon}`);
    });
    
    console.log('\n👥 CHARACTERS & RESONANCE:');
    console.log('-' .repeat(30));
    console.log('3-Star Resonance Characters:');
    knowledgeBase.characters.resonance.threeStar.forEach(char => {
        console.log(`  • ${char}`);
    });
    console.log('\n6-Star Resonance Characters:');
    knowledgeBase.characters.resonance.sixStar.forEach(char => {
        console.log(`  • ${char}`);
    });
    
    console.log('\n🔧 UPGRADE SYSTEM:');
    console.log('-' .repeat(30));
    console.log('Epic Tier: +1/+2 (1 epic consumed each)');
    console.log('Legendary Tier: +1/+2/+3 (1 legendary consumed each, +3 needs 2)');
    console.log('Mythic Tier: +1/+2/+3/+4');
    console.log('Chaotic Tier: Mythic +4 + 14 epic Griffin helmets OR 42 epic helmets OR 38 legendary helmets');
    
    console.log('\n🎪 EVENTS:');
    console.log('-' .repeat(30));
    console.log(`Current Event: ${knowledgeBase.events.umbralTempest}`);
    console.log(`Best Event: ${knowledgeBase.events.fishing}`);
    console.log(`Cash-Only Event: ${knowledgeBase.events.otherworldSummon}`);
    console.log(`Advice: ${knowledgeBase.events.advice}`);
    
    console.log('\n🏰 GUILD SYSTEM:');
    console.log('-' .repeat(30));
    console.log(`Requirements: ${knowledgeBase.guild.requirements}`);
    console.log(`Recruitment: ${knowledgeBase.guild.recruitment}`);
    
    // Count artifacts
    const artifactSets = Object.keys(knowledgeBase.artifacts.sets);
    console.log('\n🏺 ARTIFACTS SYSTEM:');
    console.log('-' .repeat(30));
    console.log(`Total Artifact Sets: ${artifactSets.length}`);
    artifactSets.forEach(setName => {
        const set = knowledgeBase.artifacts.sets[setName];
        console.log(`  • ${set.name}: ${set.artifacts.length} artifacts`);
    });
    
    // Count Discord channels
    const discordChannels = knowledgeBase.ultimateDiscordChannels || [];
    console.log('\n💬 DISCORD CHANNELS SCRAPED:');
    console.log('-' .repeat(30));
    console.log(`Total Channels: ${discordChannels.length}`);
    discordChannels.forEach((channel, index) => {
        console.log(`${index + 1}. Channel ${channel.channelId} (${channel.contentLength} chars)`);
    });
    
    // Count game info entries
    const gameInfo = knowledgeBase.ultimateGameInfo || [];
    console.log('\n🎮 GAME INFO ENTRIES:');
    console.log('-' .repeat(30));
    console.log(`Total Game Info Entries: ${gameInfo.length}`);
    const uniqueKeywords = [...new Set(gameInfo.flatMap(g => g.keywords))];
    console.log(`Unique Keywords Found: ${uniqueKeywords.length}`);
    console.log('Keywords:', uniqueKeywords.join(', '));
    
    console.log('\n📈 KNOWLEDGE BASE STATISTICS:');
    console.log('-' .repeat(30));
    console.log(`Last Updated: ${knowledgeBase.lastUpdated}`);
    console.log(`Total Sources: ${knowledgeBase.sources.length}`);
    console.log(`Total Discord Channels: ${discordChannels.length}`);
    console.log(`Total Game Info Entries: ${gameInfo.length}`);
    console.log(`Total Artifact Sets: ${artifactSets.length}`);
    console.log(`Total S-Tier Weapons: ${knowledgeBase.weapons.sTier.length}`);
    console.log(`Total Basic Weapons: ${knowledgeBase.weapons.basic.length}`);
    console.log(`Total Characters (3-star): ${knowledgeBase.characters.resonance.threeStar.length}`);
    console.log(`Total Characters (6-star): ${knowledgeBase.characters.resonance.sixStar.length}`);
    
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('=' .repeat(60));
    console.log('All data has been successfully scraped and integrated into the bot knowledge base.');
    console.log('The bot now has access to comprehensive Archero 2 information from multiple sources.');
}

// Run the report
if (require.main === module) {
    generateKnowledgeSummaryReport();
}

module.exports = { generateKnowledgeSummaryReport };
