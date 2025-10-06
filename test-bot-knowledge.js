#!/usr/bin/env node

/**
 * Bot Knowledge System Test
 * 
 * This script tests the bot's knowledge system to ensure it's working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Bot Knowledge System...');

// Load the knowledge database
const cleanedFile = path.join(__dirname, 'data', 'cleaned-knowledge-database.json');
if (!fs.existsSync(cleanedFile)) {
    console.error('❌ cleaned-knowledge-database.json not found!');
    process.exit(1);
}

const knowledgeData = JSON.parse(fs.readFileSync(cleanedFile, 'utf8'));
console.log(`✅ Loaded knowledge database with ${knowledgeData.metadata.totalEntries} entries`);

// Test the knowledge retrieval function (simplified version)
function testGetRelevantKnowledge(message) {
    const messageLower = message.toLowerCase();
    const relevantEntries = [];
    
    // Define keyword categories for better matching
    const keywordCategories = {
        weapons: ['weapon', 'staff', 'bow', 'crossbow', 'claws', 'oracle', 'griffin', 'dragoon', 'damage', 'attack', 'dps'],
        characters: ['character', 'thor', 'otta', 'helix', 'nian', 'duck', 'skin', 'ability', 'skill', 'hero'],
        arena: ['arena', 'pvp', 'peak', 'supreme', 'ranking', 'battle', 'fight', 'combat', 'gvg'],
        gear: ['gear', 'set', 'equipment', 'armor', 'amulet', 'ring', 'chest', 'helmet', 'boots', 'mythic', 'legendary', 'chaotic'],
        runes: ['rune', 'meteor', 'sprite', 'elemental', 'etched', 'blessing', 'enchant', 'build'],
        guild: ['guild', 'xyian', 'boss', 'donation', 'daily', 'requirement', 'expedition']
    };
    
    // Search through all knowledge entries for relevant content
    Object.entries(knowledgeData.entries).forEach(([key, content]) => {
        const keyLower = key.toLowerCase();
        const contentLower = content.toLowerCase();
        
        let relevanceScore = 0;
        
        // Check direct keyword matches
        const messageWords = messageLower.split(/\s+/);
        messageWords.forEach(word => {
            if (word.length < 3) return;
            if (keyLower.includes(word)) relevanceScore += 3;
            if (contentLower.includes(word)) relevanceScore += 2;
        });
        
        // Check category relevance
        Object.entries(keywordCategories).forEach(([category, keywords]) => {
            const messageHasCategory = keywords.some(keyword => messageLower.includes(keyword));
            const entryHasCategory = keywords.some(keyword => keyLower.includes(keyword) || contentLower.includes(keyword));
            
            if (messageHasCategory && entryHasCategory) {
                relevanceScore += 4;
            }
        });
        
        if (relevanceScore > 0) {
            relevantEntries.push({
                key: key,
                content: content.substring(0, 200) + '...',
                score: relevanceScore
            });
        }
    });
    
    // Sort by relevance score
    relevantEntries.sort((a, b) => b.score - a.score);
    
    return relevantEntries.slice(0, 3); // Top 3 for testing
}

// Test fallback response system
function testGetFallbackResponse(message) {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('weapon') || messageLower.includes('staff') || messageLower.includes('bow') || messageLower.includes('crossbow') || messageLower.includes('claws')) {
        return `🏹 **Weapon Question Detected!** While I process your specific question, here's what I know about weapons:\n\n**Top S-Tier Weapons:**\n• **Oracle Staff** - Excellent magical damage, great for elemental builds\n• **Griffin Claws** - Fast attack speed, perfect for crit builds\n• **Dragoon Crossbow** - Outstanding pierce and multishot synergy\n\n**Mixed Oracle/Dragoon gear set is currently the meta!** What specific weapon aspect interests you?`;
    }
    
    if (messageLower.includes('character') || messageLower.includes('thor') || messageLower.includes('otta') || messageLower.includes('helix')) {
        return `⚡ **Character Question!** Here's some key character info:\n\n**Popular Characters:**\n• **Thor** - Lightning abilities, synergizes with electric orbs\n• **Otta** - Versatile with great skin bonuses (Nian Otta recommended)\n• **Helix** - Excellent for PvP, easy to level, Duck skin adds berserk\n\n**Character skins are higher priority than weapon skins!** Which character are you curious about?`;
    }
    
    return `🤔 I don't know the answer to that specific question yet, but I've logged it for learning!\n\n**What you can do:**\n• Use \`!teach "your question" "the answer"\` to teach me\n• Contact XYIAN for complex questions\n• Ask about weapons, characters, runes, or game mechanics I do know\n\n**I'm always learning!** 🧠`;
}

// Run tests
console.log('\n🔍 Running Knowledge Tests...\n');

const testQuestions = [
    'What is the best weapon in Archero 2?',
    'How does Thor work?',
    'What is the best arena build?',
    'Tell me about XYIAN guild',
    'What are the best runes?',
    'How do I upgrade my gear?'
];

testQuestions.forEach((question, index) => {
    console.log(`📝 Test ${index + 1}: "${question}"`);
    
    const relevantKnowledge = testGetRelevantKnowledge(question);
    console.log(`   🎯 Found ${relevantKnowledge.length} relevant entries`);
    
    if (relevantKnowledge.length > 0) {
        console.log(`   📊 Top match: ${relevantKnowledge[0].key} (score: ${relevantKnowledge[0].score})`);
        console.log(`   📄 Content preview: ${relevantKnowledge[0].content.substring(0, 100)}...`);
    } else {
        const fallback = testGetFallbackResponse(question);
        console.log(`   🔄 Using fallback response: ${fallback.substring(0, 100)}...`);
    }
    
    console.log('');
});

// Test database integrity
console.log('🔍 Testing Database Integrity...');
console.log(`📊 Total entries: ${Object.keys(knowledgeData.entries).length}`);
console.log(`📊 Metadata version: ${knowledgeData.metadata.version}`);
console.log(`📊 Quality: ${knowledgeData.metadata.quality}`);

// Check for key knowledge areas
const keyAreas = ['weapon', 'character', 'arena', 'guild', 'rune', 'gear'];
keyAreas.forEach(area => {
    const areaEntries = Object.keys(knowledgeData.entries).filter(key => key.includes(area));
    console.log(`📊 ${area} entries: ${areaEntries.length}`);
});

console.log('\n✅ Knowledge system test completed!');
console.log('🎉 The bot should now provide much better responses to user questions.');