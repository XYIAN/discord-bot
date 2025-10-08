#!/usr/bin/env node

// Ultimate RAG System for XYIAN Bot
// Uses the comprehensive knowledge base extracted from scraped data
// Focuses on factual game information: upgrades, guides, boss lists, events, runes, gear, etc.

const fs = require('fs');
const path = require('path');

class UltimateRAGSystem {
    constructor() {
        this.knowledgeBase = {};
        this.categories = {};
        this.initializeKnowledgeBase();
        console.log(`✅ Ultimate RAG System initialized with ${this.getTotalEntries()} entries`);
    }

    initializeKnowledgeBase() {
        try {
            const knowledgeDir = path.join(__dirname, 'data', 'comprehensive-knowledge-base');
            
            // Load all category files
            const categories = [
                'upgrade_requirements',
                'dragoon_guides', 
                'boss_guides',
                'events_modes',
                'rune_mechanics',
                'gear_details',
                'talent_cards',
                'damage_calculations',
                'character_stats',
                'pvp_strategies',
                'pve_strategies'
            ];

            for (const category of categories) {
                const categoryFile = path.join(knowledgeDir, `${category}.json`);
                if (fs.existsSync(categoryFile)) {
                    const data = JSON.parse(fs.readFileSync(categoryFile, 'utf8'));
                    this.categories[category] = data;
                    
                    // Flatten into main knowledge base
                    if (data.data && Array.isArray(data.data)) {
                        data.data.forEach((entry, index) => {
                            const key = `${category}_${index}`;
                            this.knowledgeBase[key] = {
                                content: entry.content,
                                category: category,
                                confidence: entry.confidence || 0.8,
                                source: entry.source || 'unknown',
                                extractedAt: entry.extractedAt || new Date().toISOString()
                            };
                        });
                    }
                }
            }

            console.log(`📚 Loaded ${Object.keys(this.categories).length} knowledge categories`);
        } catch (error) {
            console.error('❌ Failed to load knowledge base:', error.message);
            this.knowledgeBase = {};
        }
    }

    searchKnowledge(query, category = null, limit = 5) {
        const queryLower = query.toLowerCase();
        const results = [];

        for (const [key, entry] of Object.entries(this.knowledgeBase)) {
            // Skip if category filter specified
            if (category && entry.category !== category) continue;

            let score = 0;
            const contentLower = entry.content.toLowerCase();

            // Exact phrase matching (highest score)
            if (contentLower.includes(queryLower)) {
                score += 50;
            }

            // Word matching
            const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
            const contentWords = contentLower.split(/\s+/);

            queryWords.forEach(word => {
                if (contentWords.includes(word)) {
                    score += 10;
                }
                // Partial word matching
                contentWords.forEach(contentWord => {
                    if (contentWord.includes(word) || word.includes(contentWord)) {
                        score += 3;
                    }
                });
            });

            // Category-specific scoring (much higher priority)
            if (entry.category === 'dragoon_guides' && queryLower.includes('dragoon')) {
                score += 30;
            }
            if (entry.category === 'boss_guides' && (queryLower.includes('boss') || queryLower.includes('shackled'))) {
                score += 30;
            }
            if (entry.category === 'upgrade_requirements' && (queryLower.includes('upgrade') || queryLower.includes('cost') || queryLower.includes('require'))) {
                score += 30;
            }
            if (entry.category === 'rune_mechanics' && queryLower.includes('rune')) {
                score += 30;
            }
            if (entry.category === 'gear_details' && (queryLower.includes('gear') || queryLower.includes('weapon') || queryLower.includes('armor'))) {
                score += 30;
            }
            if (entry.category === 'damage_calculations' && (queryLower.includes('damage') || queryLower.includes('dps') || queryLower.includes('formula'))) {
                score += 30;
            }
            if (entry.category === 'events_modes' && (queryLower.includes('event') || queryLower.includes('shackled') || queryLower.includes('jungle'))) {
                score += 30;
            }
            if (entry.category === 'character_stats' && (queryLower.includes('character') || queryLower.includes('thor') || queryLower.includes('otta'))) {
                score += 30;
            }
            if (entry.category === 'pvp_strategies' && (queryLower.includes('pvp') || queryLower.includes('arena'))) {
                score += 30;
            }
            if (entry.category === 'pve_strategies' && (queryLower.includes('pve') || queryLower.includes('chapter'))) {
                score += 30;
            }

            // Confidence boost
            score += entry.confidence * 5;

            if (score > 0) {
                results.push({
                    key,
                    content: entry.content,
                    category: entry.category,
                    confidence: entry.confidence,
                    source: entry.source,
                    score
                });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    generateResponse(query, username = 'User') {
        console.log(`🔍 Searching for: "${query}"`);
        
        // Search for relevant knowledge
        const results = this.searchKnowledge(query, null, 3);
        
        if (results.length === 0) {
            return `Hey ${username}! I don't have specific information about that in my comprehensive knowledge base. Try asking about:\n\n• **Dragoon builds** and strategies\n• **Boss guides** and encounters\n• **Upgrade requirements** and costs\n• **Rune mechanics** and bonuses\n• **Gear details** and stats\n• **Damage calculations** and formulas\n• **PvP strategies** and arena builds\n• **Events** like Shackled Jungle\n\nI have 1,367+ expert entries from the community!`;
        }
        
        // Build response from best matches
        const bestMatch = results[0];
        const confidence = bestMatch.score > 20 ? "🎯 High confidence" : 
                          bestMatch.score > 10 ? "✅ Good match" : "🔍 Relevant info";
        
        // Get category display name
        const categoryNames = {
            'upgrade_requirements': 'Upgrade Requirements',
            'dragoon_guides': 'Dragoon Build Guides',
            'boss_guides': 'Boss Guides',
            'events_modes': 'Events & Modes',
            'rune_mechanics': 'Rune Mechanics',
            'gear_details': 'Gear & Equipment',
            'talent_cards': 'Talent Cards',
            'damage_calculations': 'Damage Calculations',
            'character_stats': 'Character Stats',
            'pvp_strategies': 'PvP Strategies',
            'pve_strategies': 'PvE Strategies'
        };
        
        const categoryName = categoryNames[bestMatch.category] || bestMatch.category;
        
        let response = `Hey ${username}! **${categoryName}:**\n\n${bestMatch.content}`;
        
        // Add related information if available
        if (results.length > 1) {
            response += "\n\n**Related Information:**\n";
            results.slice(1, 3).forEach(entry => {
                const relatedCategory = categoryNames[entry.category] || entry.category;
                response += `• **${relatedCategory}:** ${entry.content.substring(0, 150)}...\n`;
            });
        }
        
        response += `\n\n${confidence} | Found ${results.length} relevant entries from my comprehensive Archero 2 knowledge base!`;
        
        return response;
    }

    getCategoryStats() {
        const stats = {};
        for (const [category, data] of Object.entries(this.categories)) {
            stats[category] = {
                name: data.name || category,
                count: data.data ? data.data.length : 0,
                priority: data.priority || 'medium'
            };
        }
        return stats;
    }

    getTotalEntries() {
        return Object.keys(this.knowledgeBase).length;
    }

    getStats() {
        return {
            totalEntries: this.getTotalEntries(),
            categories: Object.keys(this.categories).length,
            categoryStats: this.getCategoryStats()
        };
    }
}

// Test the system if run directly
if (require.main === module) {
    const rag = new UltimateRAGSystem();
    
    console.log('\n🧪 Testing Ultimate RAG System...');
    console.log('================================');
    
    const testQueries = [
        'Dragoon build guide',
        'Shackled Jungle boss',
        'upgrade requirements',
        'rune bonuses',
        'damage calculation',
        'PvP strategy'
    ];
    
    testQueries.forEach(query => {
        console.log(`\n🔍 Query: "${query}"`);
        const response = rag.generateResponse(query, 'TestUser');
        console.log(`📝 Response: ${response.substring(0, 200)}...`);
    });
    
    console.log('\n📊 System Stats:');
    console.log(JSON.stringify(rag.getStats(), null, 2));
}

module.exports = UltimateRAGSystem;
