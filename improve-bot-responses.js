#!/usr/bin/env node

/**
 * Bot Response Improvement Script
 * 
 * This script improves the bot's response capabilities by:
 * 1. Enhancing the fallback response system
 * 2. Improving knowledge retrieval algorithms
 * 3. Adding better context awareness
 * 4. Implementing smarter keyword matching
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Bot Response Improvements...');

// Read the current bot file
const botFile = path.join(__dirname, 'ultimate-xyian-bot.js');
let botContent = fs.readFileSync(botFile, 'utf8');

console.log('📖 Loaded bot file, applying improvements...');

// Improvement 1: Enhanced Fallback Response System
const enhancedFallbackFunction = `
// Enhanced fallback with learning system and smart keyword responses
function getFallbackResponse(message) {
    // Log the unknown question with timestamp and user info
    const unknownQuestion = {
        question: message,
        timestamp: new Date().toISOString(),
        status: 'unknown',
        needsAnswer: true
    };
    
    // Save to unknown questions file
    saveUnknownQuestion(unknownQuestion);
    
    console.log(\`📝 UNKNOWN QUESTION LOGGED: "\${message}" - Added to training queue\`);
    
    // Try to provide a more helpful fallback based on keywords
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('weapon') || messageLower.includes('staff') || messageLower.includes('bow') || messageLower.includes('crossbow') || messageLower.includes('claws')) {
        return \`🏹 **Weapon Question Detected!** While I process your specific question, here's what I know about weapons:\\n\\n**Top S-Tier Weapons:**\\n• **Oracle Staff** - Excellent magical damage, great for elemental builds\\n• **Griffin Claws** - Fast attack speed, perfect for crit builds\\n• **Dragoon Crossbow** - Outstanding pierce and multishot synergy\\n\\n**Mixed Oracle/Dragoon gear set is currently the meta!** What specific weapon aspect interests you?\`;
    }
    
    if (messageLower.includes('character') || messageLower.includes('thor') || messageLower.includes('otta') || messageLower.includes('helix')) {
        return \`⚡ **Character Question!** Here's some key character info:\\n\\n**Popular Characters:**\\n• **Thor** - Lightning abilities, synergizes with electric orbs\\n• **Otta** - Versatile with great skin bonuses (Nian Otta recommended)\\n• **Helix** - Excellent for PvP, easy to level, Duck skin adds berserk\\n\\n**Character skins are higher priority than weapon skins!** Which character are you curious about?\`;
    }
    
    if (messageLower.includes('arena') || messageLower.includes('pvp') || messageLower.includes('peak') || messageLower.includes('supreme')) {
        return \`🏟️ **Arena/PvP Question!** Here's the current meta:\\n\\n**Peak Arena Rules:**\\n• No player limit, weekly rankings (top 40% stay, 60% demoted)\\n• Team of 3 characters with different builds\\n• Mixed Oracle/Dragoon set is optimal\\n\\n**Arena Build:** Meteor + Sprite combination with proper etched runes. Want specific build details?\`;
    }
    
    if (messageLower.includes('guild') || messageLower.includes('xyian')) {
        return \`🏰 **XYIAN Guild Info!** \\n\\n**Guild ID:** 213797\\n**Requirements:** 300k+ power, daily active\\n**Daily Tasks:** 2 Boss Battles + 1 Guild Donation\\n\\n**Benefits:** Expert strategies, active community, event coordination, enhanced AI features!\\n\\nWhat specific guild aspect can I help with?\`;
    }
    
    if (messageLower.includes('build') || messageLower.includes('rune') || messageLower.includes('meteor') || messageLower.includes('sprite')) {
        return \`🔮 **Build/Runes Question!** Here's current meta info:\\n\\n**Top Builds:**\\n• **Meteor Build** - Great for Peak Arena and GvG\\n• **Sprite Build** - Strong for Arena survival\\n• **Mixed Build** - Meteor + Sprite combination\\n\\n**Key Runes:** Elemental, Meteor Split, Sprites Awe, Elemental Crit\\n\\nWhat specific build aspect interests you?\`;
    }
    
    if (messageLower.includes('gear') || messageLower.includes('set') || messageLower.includes('equipment') || messageLower.includes('mythic')) {
        return \`⚔️ **Gear Question!** Here's the current meta:\\n\\n**Best Gear Set (Mythic):**\\n• Dragoon Crossbow\\n• Oracle Amulet\\n• Oracle/Dragoon Ring\\n• Oracle Chestplate\\n• Dragoon Helmet\\n• Oracle Boots\\n\\n**Mixed set beats full Dragoon or full Oracle!** What gear piece are you working on?\`;
    }
    
    return \`🤔 I don't know the answer to that specific question yet, but I've logged it for learning!\\n\\n**What you can do:**\\n• Use \\\`!teach "your question" "the answer"\\\` to teach me\\n• Contact XYIAN for complex questions\\n• Ask about weapons, characters, runes, or game mechanics I do know\\n\\n**I'm always learning!** 🧠\`;
}`;

// Improvement 2: Enhanced Knowledge Retrieval
const enhancedKnowledgeFunction = `
function getRelevantKnowledge(message) {
    const messageLower = message.toLowerCase();
    const relevantEntries = [];
    
    // Define keyword categories for better matching
    const keywordCategories = {
        weapons: ['weapon', 'staff', 'bow', 'crossbow', 'claws', 'oracle', 'griffin', 'dragoon', 'damage', 'attack', 'dps'],
        characters: ['character', 'thor', 'otta', 'helix', 'nian', 'duck', 'skin', 'ability', 'skill', 'hero'],
        arena: ['arena', 'pvp', 'peak', 'supreme', 'ranking', 'battle', 'fight', 'combat', 'gvg'],
        gear: ['gear', 'set', 'equipment', 'armor', 'amulet', 'ring', 'chest', 'helmet', 'boots', 'mythic', 'legendary', 'chaotic'],
        runes: ['rune', 'meteor', 'sprite', 'elemental', 'etched', 'blessing', 'enchant', 'build'],
        guild: ['guild', 'xyian', 'boss', 'donation', 'daily', 'requirement', 'expedition'],
        events: ['event', 'starcore', 'tidal', 'vibrant', 'voyage', 'lucky', 'wheel'],
        mechanics: ['resonance', 'orb', 'revive', 'upgrade', 'progression', 'tier']
    };
    
    // Search through all knowledge entries for relevant content
    Object.entries(archeroDatabase).forEach(([key, content]) => {
        const keyLower = key.toLowerCase();
        const contentLower = content.toLowerCase();
        
        let relevanceScore = 0;
        
        // Check direct keyword matches (higher weight)
        const messageWords = messageLower.split(/\\s+/);
        messageWords.forEach(word => {
            if (word.length < 3) return;
            if (keyLower.includes(word)) relevanceScore += 3;
            if (contentLower.includes(word)) relevanceScore += 2;
        });
        
        // Check category relevance (medium weight)
        Object.entries(keywordCategories).forEach(([category, keywords]) => {
            const messageHasCategory = keywords.some(keyword => messageLower.includes(keyword));
            const entryHasCategory = keywords.some(keyword => keyLower.includes(keyword) || contentLower.includes(keyword));
            
            if (messageHasCategory && entryHasCategory) {
                relevanceScore += 4;
            }
        });
        
        // Boost score for high-quality entries
        if (keyLower.includes('weapon_') || keyLower.includes('character_') || keyLower.includes('arena_') || keyLower.includes('gear_')) {
            relevanceScore += 1;
        }
        
        if (relevanceScore > 0) {
            relevantEntries.push({
                key: key,
                content: content.substring(0, 1200), // Increased content length for better context
                score: relevanceScore
            });
        }
    });
    
    // Sort by relevance score (highest first)
    relevantEntries.sort((a, b) => b.score - a.score);
    
    // If no relevant entries found, get some high-quality entries for context
    if (relevantEntries.length === 0) {
        const priorityKeys = Object.keys(archeroDatabase).filter(key => 
            key.includes('weapon_') || key.includes('character_') || key.includes('arena_') || 
            key.includes('gear_') || key.includes('build') || key.includes('strategy') ||
            key.includes('guild') || key.includes('rune')
        );
        
        const selectedKeys = priorityKeys.length > 0 ? priorityKeys.slice(0, 6) : 
                            Object.keys(archeroDatabase).sort(() => 0.5 - Math.random()).slice(0, 6);
        
        selectedKeys.forEach(key => {
            relevantEntries.push({
                key: key,
                content: archeroDatabase[key].substring(0, 1200),
                score: 1
            });
        });
    }
    
    console.log(\`🎯 Found \${relevantEntries.length} relevant knowledge entries (scores: \${relevantEntries.slice(0, 3).map(e => e.score).join(', ')}) for: "\${message.substring(0, 50)}..."\`);
    return relevantEntries.slice(0, 10); // Limit to top 10 entries for optimal context
}`;

// Apply the improvements
console.log('🔧 Applying enhanced fallback response system...');
botContent = botContent.replace(
    /\/\/ Enhanced fallback with learning system[\s\S]*?^}/m,
    enhancedFallbackFunction.trim()
);

console.log('🔧 Applying enhanced knowledge retrieval system...');
botContent = botContent.replace(
    /function getRelevantKnowledge\(message\)[\s\S]*?^}/m,
    enhancedKnowledgeFunction.trim()
);

// Improvement 3: Add better error handling for AI responses
const aiErrorHandling = `
        // Enhanced AI error handling with better fallbacks
        if (!answer || answer.length < 10) {
            console.log('⚠️ AI response too short or empty, using enhanced fallback');
            answer = getFallbackResponse(message.content);
        }`;

// Apply AI error handling improvement
botContent = botContent.replace(
    /if \(!answer \|\| answer\.length < 10\) \{[\s\S]*?\}/,
    aiErrorHandling.trim()
);

// Write the improved bot file
fs.writeFileSync(botFile, botContent);

console.log('✅ Bot response improvements applied successfully!');
console.log('📊 Improvements made:');
console.log('  • Enhanced fallback responses with keyword detection');
console.log('  • Improved knowledge retrieval with relevance scoring');
console.log('  • Better category-based knowledge matching');
console.log('  • Increased context length for better AI responses');
console.log('  • Enhanced error handling for AI failures');

console.log('🎉 Bot improvement completed! The bot should now provide much better responses.');