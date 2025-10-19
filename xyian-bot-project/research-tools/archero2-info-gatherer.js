const axios = require('axios');
const fs = require('fs');

async function gatherArchero2Info() {
    console.log('🚀 Gathering Archero 2 information from multiple sources...');
    
    const gameInfo = {
        timestamp: new Date().toISOString(),
        sources: [],
        weapons: [],
        characters: [],
        events: [],
        mechanics: []
    };
    
    // Source 1: Reddit r/Archero2
    try {
        console.log('📱 Scraping Reddit r/Archero2...');
        const redditResponse = await axios.get('https://www.reddit.com/r/Archero2.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        const redditPosts = redditResponse.data.data.children.slice(0, 10);
        const redditInfo = redditPosts.map(post => ({
            title: post.data.title,
            content: post.data.selftext,
            score: post.data.score,
            url: `https://reddit.com${post.data.permalink}`
        }));
        
        gameInfo.sources.push({
            name: 'Reddit r/Archero2',
            posts: redditInfo.length,
            data: redditInfo
        });
        
        console.log(`✅ Found ${redditInfo.length} Reddit posts`);
    } catch (error) {
        console.log('⚠️ Reddit scraping failed:', error.message);
    }
    
    // Source 2: Archero 2 Wiki
    try {
        console.log('📚 Scraping Archero 2 Wiki...');
        const wikiResponse = await axios.get('https://archero2.fandom.com/wiki/Archero_2', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        // Extract game information from wiki
        const wikiContent = wikiResponse.data;
        const weaponMatches = wikiContent.match(/weapon[^<]*/gi) || [];
        const characterMatches = wikiContent.match(/character[^<]*/gi) || [];
        const eventMatches = wikiContent.match(/event[^<]*/gi) || [];
        
        gameInfo.weapons.push(...weaponMatches.slice(0, 5));
        gameInfo.characters.push(...characterMatches.slice(0, 5));
        gameInfo.events.push(...eventMatches.slice(0, 5));
        
        gameInfo.sources.push({
            name: 'Archero 2 Wiki',
            weapons: weaponMatches.length,
            characters: characterMatches.length,
            events: eventMatches.length
        });
        
        console.log(`✅ Found ${weaponMatches.length} weapon references, ${characterMatches.length} character references`);
    } catch (error) {
        console.log('⚠️ Wiki scraping failed:', error.message);
    }
    
    // Source 3: Game-specific information
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
    
    gameInfo.weapons.push(...knownGameInfo.weapons);
    gameInfo.characters.push(...knownGameInfo.characters);
    gameInfo.mechanics.push(...knownGameInfo.mechanics);
    gameInfo.events.push(...knownGameInfo.events);
    
    // Save comprehensive data
    const filename = `archero2-comprehensive-data-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(gameInfo, null, 2));
    console.log(`💾 Saved comprehensive data to ${filename}`);
    
    // Send summary to debug channel
    const summary = {
        sources: gameInfo.sources.length,
        weapons: gameInfo.weapons.length,
        characters: gameInfo.characters.length,
        mechanics: gameInfo.mechanics.length,
        events: gameInfo.events.length
    };
    
    console.log('📊 Information Gathering Summary:');
    console.log(`- Sources: ${summary.sources}`);
    console.log(`- Weapons: ${summary.weapons}`);
    console.log(`- Characters: ${summary.characters}`);
    console.log(`- Mechanics: ${summary.mechanics}`);
    console.log(`- Events: ${summary.events}`);
    
    return gameInfo;
}

// Run the info gatherer
if (require.main === module) {
    gatherArchero2Info()
        .then(data => {
            console.log('✅ Information gathering completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Information gathering failed:', error);
            process.exit(1);
        });
}

module.exports = { gatherArchero2Info };
