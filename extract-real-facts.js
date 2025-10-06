const fs = require('fs');
const path = require('path');

// Load all the scraped data
const dataFiles = [
    'data/archero_qa_learned.json',
    'data/cleaned-knowledge-database.json',
    'data/archero2-comprehensive-data-1759693367933.json',
    'data/archero2-discord-invite-data-1759693346206.json'
];

let allData = {};

// Load all data files
dataFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            allData[file] = data;
            console.log(`📁 Loaded ${file}`);
        } catch (error) {
            console.log(`❌ Error loading ${file}: ${error.message}`);
        }
    }
});

// Extract only useful game facts
const usefulFacts = {
    weapons: {},
    characters: {},
    runes: {},
    builds: {},
    arena: {},
    guild: {},
    mechanics: {},
    strategies: {}
};

// Keywords that indicate useful content
const usefulKeywords = [
    'damage', 'attack', 'health', 'defense', 'critical', 'crit',
    'weapon', 'character', 'rune', 'build', 'arena', 'pvp',
    'tier', 's-tier', 'a-tier', 'b-tier', 'c-tier',
    'oracle', 'griffin', 'dragoon', 'thor', 'demon', 'rolla',
    'staff', 'crossbow', 'claws', 'bow', 'sword',
    'mixed gear', 'set bonus', 'equipment', 'gear',
    'resonance', 'star', 'upgrade', 'enhance',
    'peak arena', 'guild', 'xyian', 'requirements',
    'strategy', 'meta', 'optimal', 'best', 'recommended'
];

// Keywords that indicate useless content
const uselessKeywords = [
    '@', 'discord', 'yesterday', 'today', 'click to see',
    'lol', 'haha', 'wtf', 'omg', 'noob', 'pro',
    'username', 'user', 'member', 'joined', 'left',
    'attachment', 'image', 'screenshot', 'photo',
    'opinion', 'think', 'believe', 'feel', 'guess',
    'maybe', 'probably', 'might', 'could', 'should',
    'idk', 'dunno', 'not sure', 'unsure'
];

function isUsefulContent(text) {
    if (!text || typeof text !== 'string') return false;
    
    const textLower = text.toLowerCase();
    
    // Check for useless content
    const hasUseless = uselessKeywords.some(keyword => textLower.includes(keyword));
    if (hasUseless) return false;
    
    // Check for useful content
    const hasUseful = usefulKeywords.some(keyword => textLower.includes(keyword));
    if (!hasUseful) return false;
    
    // Must be substantial content
    if (text.length < 50) return false;
    
    // Must not be mostly usernames or chat
    const words = text.split(/\s+/);
    const usernameCount = words.filter(word => word.startsWith('@')).length;
    if (usernameCount > words.length * 0.3) return false;
    
    return true;
}

function extractFacts(data, category = '') {
    if (typeof data === 'string') {
        if (isUsefulContent(data)) {
            // Categorize based on content
            const textLower = data.toLowerCase();
            if (textLower.includes('weapon') || textLower.includes('staff') || textLower.includes('crossbow')) {
                usefulFacts.weapons[`${category}_${Date.now()}`] = data;
            } else if (textLower.includes('character') || textLower.includes('dragoon') || textLower.includes('oracle')) {
                usefulFacts.characters[`${category}_${Date.now()}`] = data;
            } else if (textLower.includes('rune') || textLower.includes('rune')) {
                usefulFacts.runes[`${category}_${Date.now()}`] = data;
            } else if (textLower.includes('build') || textLower.includes('strategy')) {
                usefulFacts.builds[`${category}_${Date.now()}`] = data;
            } else if (textLower.includes('arena') || textLower.includes('pvp')) {
                usefulFacts.arena[`${category}_${Date.now()}`] = data;
            } else if (textLower.includes('guild') || textLower.includes('xyian')) {
                usefulFacts.guild[`${category}_${Date.now()}`] = data;
            } else {
                usefulFacts.mechanics[`${category}_${Date.now()}`] = data;
            }
        }
    } else if (Array.isArray(data)) {
        data.forEach((item, index) => extractFacts(item, `${category}_${index}`));
    } else if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => extractFacts(value, `${category}_${key}`));
    }
}

// Extract facts from all data
Object.entries(allData).forEach(([file, data]) => {
    console.log(`🔍 Extracting facts from ${file}...`);
    extractFacts(data, path.basename(file, '.json'));
});

// Clean up duplicates and merge similar content
function cleanAndMerge(facts) {
    const cleaned = {};
    const seen = new Set();
    
    Object.entries(facts).forEach(([key, content]) => {
        // Remove duplicates
        const contentHash = content.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seen.has(contentHash)) return;
        seen.add(contentHash);
        
        // Clean up the content
        let cleanedContent = content
            .replace(/@\w+/g, '') // Remove usernames
            .replace(/https?:\/\/\S+/g, '') // Remove URLs
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        if (cleanedContent.length > 30) {
            cleaned[key] = cleanedContent;
        }
    });
    
    return cleaned;
}

// Clean all categories
Object.keys(usefulFacts).forEach(category => {
    usefulFacts[category] = cleanAndMerge(usefulFacts[category]);
});

// Save the cleaned facts
const outputFile = 'data/cleaned-real-facts.json';
fs.writeFileSync(outputFile, JSON.stringify(usefulFacts, null, 2));

console.log('\n📊 EXTRACTION COMPLETE:');
Object.entries(usefulFacts).forEach(([category, facts]) => {
    console.log(`${category}: ${Object.keys(facts).length} facts`);
});

console.log(`\n✅ Saved cleaned facts to ${outputFile}`);
console.log(`📈 Total useful facts extracted: ${Object.values(usefulFacts).reduce((sum, facts) => sum + Object.keys(facts).length, 0)}`);

// Also create a summary of what was removed
const removedContent = {
    discord_chat: 0,
    usernames: 0,
    opinions: 0,
    short_content: 0,
    total_processed: 0
};

console.log('\n🗑️ CONTENT REMOVED:');
console.log('• Discord chat and usernames');
console.log('• Opinions and speculation');
console.log('• Short or incomplete content');
console.log('• Duplicate information');
console.log('• Non-game related content');

console.log('\n🎯 USEFUL CONTENT KEPT:');
console.log('• Weapon stats and tiers');
console.log('• Character abilities and builds');
console.log('• Rune effects and strategies');
console.log('• Arena rules and tactics');
console.log('• Guild requirements and benefits');
console.log('• Game mechanics and systems');
