#!/usr/bin/env node

/**
 * Real Knowledge Database Creator
 * 
 * This script creates the REAL knowledge database from the comprehensive
 * markdown documentation files that contain the actual Archero 2 data.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Creating REAL Knowledge Database from Documentation...');

// Read all the comprehensive documentation files
const docFiles = [
    'docs/COMPREHENSIVE-ARCHERO2-DATABASE.md',
    'docs/ARCHERO2-GAME-MECHANICS.md', 
    'docs/COMPREHENSIVE-RUNES-DATABASE.md',
    'docs/ARENA-DOCUMENTATION.md',
    'docs/EXPERT-KNOWLEDGE-GUIDE.md'
];

const realKnowledgeDatabase = {
    metadata: {
        version: '2.1.0',
        created: new Date().toISOString(),
        source: 'Comprehensive Documentation Files',
        quality: 'expert',
        totalEntries: 0,
        categories: ['weapons', 'characters', 'runes', 'arena', 'gear', 'strategies', 'mechanics', 'campaign', 'guild']
    },
    entries: {}
};

let entryCount = 0;

// Process each documentation file
docFiles.forEach(docFile => {
    if (!fs.existsSync(docFile)) {
        console.log(`⚠️ Skipping ${docFile} - not found`);
        return;
    }
    
    console.log(`📖 Processing ${docFile}...`);
    const content = fs.readFileSync(docFile, 'utf8');
    
    // Extract sections and create knowledge entries
    const sections = extractSections(content, docFile);
    sections.forEach(section => {
        const key = `${path.basename(docFile, '.md')}_${section.id}`;
        realKnowledgeDatabase.entries[key] = section.content;
        entryCount++;
    });
});

// Add specific high-value knowledge entries
const expertKnowledge = {
    // S-Tier Weapons (ONLY 3 in Archero 2)
    'weapons_oracle_staff': 'Oracle Staff is one of only 3 S-tier weapons in Archero 2. Best for mage builds with exceptional range and area-of-effect damage, ideal for crowd control. Essential for competitive play.',
    
    'weapons_griffin_claws': 'Griffin Claws is one of only 3 S-tier weapons in Archero 2. Best for melee builds with high critical hit potential. Only use Griffin character if you have complete Griffin build.',
    
    'weapons_dragoon_crossbow': 'Dragoon Crossbow is one of only 3 S-tier weapons in Archero 2. Best for ranged builds with high burst damage and faster projectile speed. Excellent for both PvE and PvP.',
    
    // Top Arena Characters
    'characters_dragoon': 'Dragoon is the #1 absolute best Arena hero in Archero 2. Primary choice for both Arena and Supreme Arena. Clear #1 choice for Arena success. Use mobility builds for optimal performance.',
    
    'characters_griffin': 'Griffin is the second best Arena hero, but ONLY with complete build. Avoid using without complete Griffin setup. When properly built, excellent for Arena damage builds.',
    
    'characters_helix': 'Helix is the best free-to-play option. Increased attack power when HP is low. Excellent for beginners and F2P players. Good for budget builds.',
    
    // Essential Runes
    'runes_revive_essential': 'Revive Rune is ESSENTIAL and MANDATORY for competitive play. Epic effect: 50% chance to revive with half HP. Mythic effect: 100% chance to revive with attack boosts. Highest priority rune.',
    
    'runes_main_hand_etched': 'Main Hand Etched Rune has HIGHEST PRIORITY. Weapon gains 30% chance to trigger special effects. Essential for all competitive builds. Must-have for Arena and Supreme Arena.',
    
    // Supreme Arena Rules
    'arena_supreme_rules': 'Supreme Arena requires 3 different characters with 3 different builds. No player limit. Weekly rankings: top 40% stay, 60% demoted. Each unique item provides bonus health and damage.',
    
    // Gear Meta
    'gear_legendary_priority': 'Legendary gear provides highest stat boosts and unique set bonuses. Essential for endgame content. Priority: weapons first, then armor. Focus on S-tier items only.',
    
    // F2P Strategy
    'strategy_f2p': 'F2P Setup: Helix + Main Hand Etched Rune + Revive Rune + Guardian Rune. Focus on budget builds with maximum efficiency. Complete daily quests and join active guild.',
    
    // Competitive Strategy
    'strategy_competitive': 'Competitive Setup: Main Hand Etched Rune + Revive Rune + Dragoon + Griffin + Third Hero. Focus on maximum DPS and survival. Requires epic level runes and optimized builds.',
    
    // Campaign Progression
    'campaign_progression': 'Campaign strategy: Early chapters (1-10) focus on learning. Mid chapters (11-20) optimize builds. Late chapters (21+) require perfect execution and Supreme Arena strategies.',
    
    // Sky Tower
    'sky_tower_strategy': 'Sky Tower daily routine: 1) Attempt daily, 2) Push as high as possible, 3) Collect all rewards, 4) Upgrade equipment. Focus on survivability builds.',
    
    // Guild Benefits
    'guild_benefits': 'Join active guild for: daily guild quests, guild shop access, guild expeditions, team support. Essential for progression and resource gathering.',
    
    // Resource Management
    'resources_priority': 'Resource priority: 1) Upgrade S-tier weapons first, 2) Focus on legendary gear, 3) Save gems for essential runes, 4) Complete daily activities for steady progression.'
};

// Add expert knowledge
Object.entries(expertKnowledge).forEach(([key, content]) => {
    realKnowledgeDatabase.entries[key] = content;
    entryCount++;
});

// Update metadata
realKnowledgeDatabase.metadata.totalEntries = entryCount;

// Save the real knowledge database
const outputFile = path.join(__dirname, 'data', 'cleaned-knowledge-database.json');
fs.writeFileSync(outputFile, JSON.stringify(realKnowledgeDatabase, null, 2));

console.log(`✅ Created REAL knowledge database with ${entryCount} entries`);
console.log(`📊 Sources: ${docFiles.length} comprehensive documentation files`);
console.log(`🎯 Quality: ${realKnowledgeDatabase.metadata.quality}`);
console.log(`📁 Saved to: ${outputFile}`);

// Helper function to extract sections from markdown content
function extractSections(content, filename) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionId = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect section headers
        if (line.startsWith('##') || line.startsWith('###') || line.startsWith('####')) {
            // Save previous section
            if (currentSection && currentSection.content.length > 100) {
                sections.push({
                    id: sectionId++,
                    title: currentSection.title,
                    content: currentSection.content.trim()
                });
            }
            
            // Start new section
            currentSection = {
                title: line.replace(/^#+\s*/, '').replace(/\*\*/g, ''),
                content: ''
            };
        } else if (currentSection && line.length > 0) {
            // Add content to current section
            currentSection.content += line + '\n';
        }
    }
    
    // Add the last section
    if (currentSection && currentSection.content.length > 100) {
        sections.push({
            id: sectionId++,
            title: currentSection.title,
            content: currentSection.content.trim()
        });
    }
    
    return sections;
}

console.log('🎉 REAL knowledge database creation completed!');