/**
 * Archero 2 RAG (Retrieval-Augmented Generation) System
 * Better knowledge retrieval + AI generation
 */

const fs = require('fs');
const path = require('path');

class ArcheroRAGSystem {
    constructor() {
        this.knowledgeBase = new Map();
        this.embeddings = new Map();
        this.questionPatterns = new Map();
        this.initializeKnowledgeBase();
    }

    initializeKnowledgeBase() {
        console.log('🧠 Initializing Archero 2 RAG System...');
        
        // Load structured game data
        this.loadStructuredData();
        
        // Create question patterns for better matching
        this.createQuestionPatterns();
        
        console.log(`✅ RAG System ready with ${this.knowledgeBase.size} knowledge entries`);
    }

    loadStructuredData() {
        // Create structured knowledge base with real game facts
        const structuredData = {
            // Weapons
            "oracle_staff": {
                content: "Oracle Staff is an S-tier weapon in Archero 2. It provides high damage and good range, making it excellent for PvE content. Best for balanced builds with high damage output and good survivability.",
                category: "weapons",
                keywords: ["oracle", "staff", "s-tier", "weapon", "pve", "damage", "range"]
            },
            "griffin_claws": {
                content: "Griffin Claws are S-tier weapons with balanced stats, good for all builds and content. They provide well-rounded performance and are versatile for both PvE and PvP.",
                category: "weapons", 
                keywords: ["griffin", "claws", "s-tier", "weapon", "balanced", "versatile"]
            },
            "dragoon_crossbow": {
                content: "Dragoon Crossbow is an S-tier weapon with high damage, excellent for PvP and burst damage builds. Focuses on maximum damage output and is perfect for arena combat.",
                category: "weapons",
                keywords: ["dragoon", "crossbow", "s-tier", "weapon", "pvp", "damage", "arena"]
            },
            
            // Gear Sets
            "oracle_set": {
                content: "Oracle Set provides balanced offense/defense. Best for PvE content and balanced builds. Pieces: Oracle Staff, Oracle Armor, Oracle Boots, Oracle Amulet, Oracle Ring. Focus on high damage with good survivability.",
                category: "gear_sets",
                keywords: ["oracle", "set", "balanced", "pve", "offense", "defense", "armor", "boots", "amulet", "ring"]
            },
            "dragoon_set": {
                content: "Dragoon Set provides high attack/critical damage. Best for PvP and burst damage builds. Pieces: Dragoon Crossbow, Dragoon Helmet, Dragoon Boots, Dragoon Amulet, Dragoon Ring. Focus on maximum damage output.",
                category: "gear_sets",
                keywords: ["dragoon", "set", "pvp", "attack", "critical", "damage", "helmet", "boots", "amulet", "ring"]
            },
            "griffin_set": {
                content: "Griffin Set provides balanced stats for versatile builds and all content. Pieces: Griffin Claws, Griffin Helmet, Griffin Boots, Griffin Amulet, Griffin Ring. Top-tier with excellent damage and survivability.",
                category: "gear_sets",
                keywords: ["griffin", "set", "balanced", "versatile", "claws", "helmet", "boots", "amulet", "ring"]
            },
            
            // Mixed Gear
            "mixed_gear": {
                content: "Mixed gear sets allow combining different pieces from different sets while getting individual piece bonuses. Benefits: Better individual stats, more flexibility, can use best pieces regardless of set. Often better than full sets for optimization.",
                category: "mechanics",
                keywords: ["mixed", "gear", "sets", "combine", "pieces", "bonuses", "flexibility", "optimization"]
            },
            
            // PvP/Arena
            "peak_arena": {
                content: "Peak Arena is the 3v3 PvP mode. Rules: 3 different characters required, each needs different builds, unique items provide bonus health/damage, fully automated PvP. Strategy: Focus on damage and mobility, use S-tier weapons, optimize runes for each character.",
                category: "pvp",
                keywords: ["peak", "arena", "pvp", "3v3", "characters", "builds", "strategy", "damage", "mobility"]
            },
            
            // Characters
            "thor_character": {
                content: "Thor is an S-tier character with lightning attacks. Excellent for high damage output and area damage. Best builds focus on attack damage, critical hit chance, and skill damage.",
                category: "characters",
                keywords: ["thor", "character", "s-tier", "lightning", "damage", "area", "attack", "critical"]
            },
            "loki_character": {
                content: "Loki is an S-tier character with illusions and trickery. Great for confusing enemies and dealing damage through deception. Best for players who like strategic gameplay.",
                category: "characters", 
                keywords: ["loki", "character", "s-tier", "illusions", "trickery", "strategic", "deception"]
            },
            
            // Guild
            "xyian_guild": {
                content: "XYIAN OFFICIAL (Guild ID: 213797) requirements: 2 daily boss battles, daily donations, active participation. Benefits: Guild-exclusive rewards, better daily rewards, access to guild events, community support, competitive advantages in leaderboards.",
                category: "guild",
                keywords: ["xyian", "guild", "213797", "requirements", "boss", "battles", "donations", "rewards", "leaderboards"]
            }
        };

        // Load into knowledge base
        Object.entries(structuredData).forEach(([key, data]) => {
            this.knowledgeBase.set(key, data);
        });
    }

    createQuestionPatterns() {
        // Map common question patterns to knowledge entries
        this.questionPatterns.set("best weapon", ["oracle_staff", "griffin_claws", "dragoon_crossbow"]);
        this.questionPatterns.set("s tier weapon", ["oracle_staff", "griffin_claws", "dragoon_crossbow"]);
        this.questionPatterns.set("weapon tier", ["oracle_staff", "griffin_claws", "dragoon_crossbow"]);
        this.questionPatterns.set("gear sets", ["oracle_set", "dragoon_set", "griffin_set"]);
        this.questionPatterns.set("main 3 gear", ["oracle_set", "dragoon_set", "griffin_set"]);
        this.questionPatterns.set("mixed gear", ["mixed_gear"]);
        this.questionPatterns.set("pvp", ["peak_arena", "dragoon_set", "dragoon_crossbow"]);
        this.questionPatterns.set("arena", ["peak_arena"]);
        this.questionPatterns.set("peak arena", ["peak_arena"]);
        this.questionPatterns.set("thor", ["thor_character"]);
        this.questionPatterns.set("loki", ["loki_character"]);
        this.questionPatterns.set("xyian", ["xyian_guild"]);
        this.questionPatterns.set("guild", ["xyian_guild"]);
    }

    findRelevantKnowledge(question) {
        const questionLower = question.toLowerCase();
        const relevantEntries = [];
        
        // Check question patterns first
        for (const [pattern, keys] of this.questionPatterns) {
            if (questionLower.includes(pattern)) {
                keys.forEach(key => {
                    if (this.knowledgeBase.has(key)) {
                        relevantEntries.push({
                            key,
                            ...this.knowledgeBase.get(key),
                            matchType: 'pattern',
                            confidence: 0.9
                        });
                    }
                });
            }
        }
        
        // If no pattern matches, do keyword matching
        if (relevantEntries.length === 0) {
            for (const [key, data] of this.knowledgeBase) {
                let score = 0;
                const keywords = data.keywords || [];
                
                keywords.forEach(keyword => {
                    if (questionLower.includes(keyword)) {
                        score += 1;
                    }
                });
                
                if (score > 0) {
                    relevantEntries.push({
                        key,
                        ...data,
                        matchType: 'keyword',
                        confidence: Math.min(0.8, score / keywords.length)
                    });
                }
            }
        }
        
        // Sort by confidence
        return relevantEntries.sort((a, b) => b.confidence - a.confidence);
    }

    generateResponse(question, username = '') {
        console.log(`🔍 RAG System processing: "${question}"`);
        
        const relevantKnowledge = this.findRelevantKnowledge(question);
        
        if (relevantKnowledge.length === 0) {
            return `Hey ${username}! I don't have specific information about that. Try asking about weapons, gear sets, characters, PvP, or guild requirements!`;
        }
        
        // Use the most relevant knowledge
        const bestMatch = relevantKnowledge[0];
        const greeting = username ? `Hey ${username}! ` : '';
        
        let response = `${greeting}**${bestMatch.key.replace('_', ' ').toUpperCase()}:**\n\n${bestMatch.content}`;
        
        // Add related information if available
        if (relevantKnowledge.length > 1) {
            response += '\n\n**Related Information:**\n';
            relevantKnowledge.slice(1, 3).forEach(entry => {
                response += `• ${entry.key.replace('_', ' ')}: ${entry.content.substring(0, 100)}...\n`;
            });
        }
        
        response += '\n\n*This information comes from my comprehensive Archero 2 knowledge base!*';
        
        console.log(`✅ RAG Response generated with ${relevantKnowledge.length} relevant entries`);
        return response;
    }

    // Integration with existing bot
    integrateWithBot() {
        return {
            generateAIResponse: (message, channelName) => {
                return this.generateResponse(message, 'User');
            },
            findRelevantKnowledge: (message) => {
                return this.findRelevantKnowledge(message);
            }
        };
    }
}

// Export for use in main bot
module.exports = ArcheroRAGSystem;

// Test the system
if (require.main === module) {
    console.log('🧪 Testing Archero RAG System...');
    
    const rag = new ArcheroRAGSystem();
    
    const testQuestions = [
        "What are the best weapons?",
        "How do mixed gear sets work?", 
        "Tell me about Peak Arena",
        "What are XYIAN guild requirements?",
        "Which characters are best for PvP?"
    ];
    
    testQuestions.forEach(question => {
        console.log(`\nQ: ${question}`);
        console.log(`A: ${rag.generateResponse(question, 'TestUser')}`);
    });
}
