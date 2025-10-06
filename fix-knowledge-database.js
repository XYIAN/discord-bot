#!/usr/bin/env node

/**
 * Knowledge Database Fixer
 * 
 * This script fixes the bot's knowledge database by:
 * 1. Processing the existing archero_qa_learned.json file
 * 2. Creating the missing cleaned-knowledge-database.json file
 * 3. Enhancing the knowledge base with additional structured data
 * 4. Improving the bot's response capabilities
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Knowledge Database Fix...');

// Load the existing data
const qaFile = path.join(__dirname, 'data', 'archero_qa_learned.json');
if (!fs.existsSync(qaFile)) {
    console.error('❌ archero_qa_learned.json not found!');
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(qaFile, 'utf8'));
console.log(`📊 Loaded ${rawData.totalEntries} entries from QA database`);

// Create cleaned knowledge database structure
const cleanedDatabase = {
    metadata: {
        version: '2.0.0',
        created: new Date().toISOString(),
        source: 'archero_qa_learned.json + enhancements',
        quality: 'high',
        totalEntries: 0,
        categories: Object.keys(rawData.categories || {})
    },
    entries: {},
    categories: rawData.categories || {}
};

// Process each category and extract meaningful knowledge
let entryCount = 0;

// Process theorycrafting data
if (rawData.categories.theorycrafting) {
    Object.entries(rawData.categories.theorycrafting).forEach(([key, entry]) => {
        if (entry.content && entry.content.length > 100) {
            // Extract key information from the content
            const content = entry.content;
            
            // Create structured entries for different topics
            const topics = extractTopics(content);
            topics.forEach((topic, index) => {
                const entryKey = `theorycrafting_${key}_${index}`;
                cleanedDatabase.entries[entryKey] = topic;
                entryCount++;
            });
        }
    });
}

// Add comprehensive game knowledge
const gameKnowledge = {
    // Weapon Information
    'weapon_oracle_staff': 'Oracle Staff is one of the top 3 S-tier weapons in Archero 2. Excellent for both PvE and PvP content. Provides strong magical damage and works well with elemental builds.',
    'weapon_griffin_claws': 'Griffin Claws is one of the top 3 S-tier weapons. Exceptional for PvP and high-level content. Fast attack speed and great for critical hit builds.',
    'weapon_dragoon_crossbow': 'Dragoon Crossbow is one of the top 3 S-tier weapons. Outstanding for both PvE and PvP. Works excellently with pierce and multishot abilities.',
    
    // Character Information
    'character_thor': 'Thor is a powerful legendary character with lightning abilities. Excellent for both PvE and PvP. His abilities synergize well with electric orbs and lightning-based builds.',
    'character_otta': 'Otta is a versatile character with unique abilities. The Nian Otta skin provides significant bonuses and is highly recommended for competitive play.',
    'character_helix': 'Helix is a popular character, especially good for PvP as a resonance character. Easy to level and has useful skills. Duck Helix skin provides berserk ability after revive.',
    
    // Gear Sets
    'gear_mixed_set': 'Mixed Oracle/Dragoon set is currently the best setup: Dragoon Crossbow, Oracle amulet, Oracle or Dragoon ring, Oracle chestplate, Dragoon helmet, Oracle boots. Better than full Dragoon or full Oracle sets.',
    'gear_full_dragoon': 'Full Dragoon set is strong but mixed Oracle/Dragoon is better. Full Dragoon works well for PvP but mixed set outperforms it at mythic level.',
    'gear_mythic_builds': 'At mythic level, mixed sets outperform full sets. Key pieces are crossbow and boots for damage, everything else for survival.',
    
    // Arena and PvP
    'arena_peak_rules': 'Peak Arena has no player limit. Weekly rankings with top 40% maintaining rank, 60% demoted. Team of 3 characters max with different builds. Unique items provide bonus health/damage.',
    'arena_builds': 'For Arena: Left side - Flamenox, Frostshock, Giant meteor, Meteor potion. Right side - Frostshock, Healing sprite, Star of time, Star of fury. Blessings: Lucky shadow, Revive. Etched: Meteor split, Sprites awe, Elemental crit.',
    'pvp_strategy': 'PvP strategy focuses on revive mechanics, positioning, and burst damage. Griffin amulet often better than Oracle amulet for Arena. Timing and build optimization crucial.',
    
    // Runes and Enchantments
    'runes_meteor': 'Meteor builds are excellent for Peak Arena and GvG. Use elemental runes with meteor/elemental crit enchants for maximum effectiveness.',
    'runes_sprite': 'Sprite builds are strong for Arena. Use sprite-etched runes and enchants. Healing sprite is key for survival in PvP.',
    'enchants_priority': 'Key enchants: Arrow Rain (30% Crit Dmg reduction), Sharp arrow (+2 bounce/6% crit/480 damage). Focus on crit damage and survivability.',
    
    // Skins and Upgrades
    'skins_priority': 'Character skins are higher priority than weapon skins. Epic skins are generally better than legendary skins. Otta skin is highly recommended.',
    'weapon_skins': 'For crossbow skins, epic 0* is recommended over legendary. Character skins provide better value than weapon skins.',
    'upgrade_path': 'Upgrade priority: Main weapon first, then character abilities. Epic → Legendary → Mythic → Chaotic progression path.',
    
    // Events and Resources
    'events_starcores': 'Tidal starcores available from Vibrant Voyage and Lucky Wheel events. Lucky Wheel starcores are cheaper than Vibrant Voyage.',
    'resource_management': 'Focus on daily requirements: 2 boss battles, 1 guild donation. Prioritize character skins over weapon skins for core spending.',
    
    // Guild Information
    'guild_xyian': 'XYIAN Guild (ID: 213797) requirements: 300k+ power, daily active. Benefits include expert strategies, active community, event coordination, and enhanced AI features.',
    'guild_requirements': 'Daily guild requirements: Complete 2 Boss Battles, Make 1 Guild Donation, Stay active and engaged. Focus on guild contribution and teamwork.',
    
    // Game Mechanics
    'resonance_system': 'Resonance system allows character synergies. Sacred Hall level affects skin resonance bonuses. Character combinations provide team-wide benefits.',
    'orb_system': 'Orb swapping costs gems but provides build flexibility. Fire orbs boost damage, Ice orbs provide crowd control, Electric orbs synergize with Thor.',
    'revive_mechanics': 'Revive timing crucial in PvP. First to revive often loses due to invincibility frames. Legendary revive provides tactical advantages.',
};

// Add game knowledge to database
Object.entries(gameKnowledge).forEach(([key, content]) => {
    cleanedDatabase.entries[key] = content;
    entryCount++;
});

// Update metadata
cleanedDatabase.metadata.totalEntries = entryCount;

// Save the cleaned database
const outputFile = path.join(__dirname, 'data', 'cleaned-knowledge-database.json');
fs.writeFileSync(outputFile, JSON.stringify(cleanedDatabase, null, 2));

console.log(`✅ Created cleaned-knowledge-database.json with ${entryCount} entries`);
console.log(`📊 Categories: ${cleanedDatabase.metadata.categories.join(', ')}`);
console.log(`🎯 Quality: ${cleanedDatabase.metadata.quality}`);

// Helper function to extract topics from content
function extractTopics(content) {
    const topics = [];
    const lines = content.split('\n');
    let currentTopic = '';
    let topicContent = '';
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) continue;
        
        // Look for topic indicators
        if (trimmedLine.includes('?') || trimmedLine.includes('build') || trimmedLine.includes('weapon') || 
            trimmedLine.includes('character') || trimmedLine.includes('arena') || trimmedLine.includes('pvp')) {
            
            if (topicContent.length > 50) {
                topics.push(topicContent.trim());
            }
            
            currentTopic = trimmedLine;
            topicContent = trimmedLine + '\n';
        } else {
            topicContent += trimmedLine + '\n';
        }
    }
    
    // Add the last topic
    if (topicContent.length > 50) {
        topics.push(topicContent.trim());
    }
    
    return topics.slice(0, 10); // Limit to 10 topics per entry
}

console.log('🎉 Knowledge database fix completed successfully!');