#!/usr/bin/env node
/**
 * Clean RAG System - Uses properly cleaned and structured data
 * Based on RAG best practices for AI/bot systems
 */

const fs = require('fs');
const path = require('path');

class CleanRAGSystem {
    constructor() {
        this.dataDir = path.join(__dirname, 'data', 'cleaned-database');
        this.cleanData = this.loadCleanData();
        this.searchIndex = this.buildSearchIndex();
        
        console.log('🧠 Clean RAG System initialized');
        console.log(`✅ Loaded clean data: ${this.getTotalEntries()} entries`);
        console.log(`✅ Search index built: ${Object.keys(this.searchIndex).length} terms`);
    }

    loadCleanData() {
        try {
            const filePath = path.join(this.dataDir, 'clean-archero-database.json');
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading clean data:', error.message);
            return {};
        }
    }

    buildSearchIndex() {
        const index = {};
        
        // Index gear sets
        Object.entries(this.cleanData.gear_sets || {}).forEach(([setName, data]) => {
            const terms = [
                setName,
                'gear',
                'set',
                'armor',
                'equipment'
            ];
            
            // Add piece types
            Object.keys(data.pieces || {}).forEach(pieceType => {
                terms.push(pieceType);
            });
            
            // Add context terms
            if (data.contexts) {
                data.contexts.forEach(context => {
                    const words = context.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        if (word.length > 3) {
                            terms.push(word);
                        }
                    });
                });
            }
            
            terms.forEach(term => {
                if (!index[term]) {
                    index[term] = [];
                }
                index[term].push({
                    type: 'gear_set',
                    name: setName,
                    data: data,
                    score: data.avg_confidence || 0
                });
            });
        });

        // Index runes
        Object.entries(this.cleanData.runes || {}).forEach(([runeName, data]) => {
            const terms = [
                runeName,
                'rune',
                'etched',
                'bonus',
                'effect'
            ];
            
            // Add effects
            if (data.effects) {
                data.effects.forEach(effect => {
                    terms.push(effect + '%');
                });
            }
            
            // Add context terms
            if (data.contexts) {
                data.contexts.forEach(context => {
                    const words = context.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        if (word.length > 3) {
                            terms.push(word);
                        }
                    });
                });
            }
            
            terms.forEach(term => {
                if (!index[term]) {
                    index[term] = [];
                }
                index[term].push({
                    type: 'rune',
                    name: runeName,
                    data: data,
                    score: data.avg_confidence || 0
                });
            });
        });

        // Index characters
        Object.entries(this.cleanData.characters || {}).forEach(([charName, data]) => {
            const terms = [
                charName,
                'character',
                'hero',
                'build'
            ];
            
            // Add usage types
            if (data.usage_types) {
                data.usage_types.forEach(usage => {
                    terms.push(usage);
                });
            }
            
            // Add context terms
            if (data.contexts) {
                data.contexts.forEach(context => {
                    const words = context.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        if (word.length > 3) {
                            terms.push(word);
                        }
                    });
                });
            }
            
            terms.forEach(term => {
                if (!index[term]) {
                    index[term] = [];
                }
                index[term].push({
                    type: 'character',
                    name: charName,
                    data: data,
                    score: data.avg_confidence || 0
                });
            });
        });

        // Index materials
        Object.entries(this.cleanData.materials || {}).forEach(([materialName, data]) => {
            const terms = [
                materialName,
                'material',
                'upgrade',
                'cost',
                'resource'
            ];
            
            // Add context terms
            if (data.contexts) {
                data.contexts.forEach(context => {
                    const words = context.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        if (word.length > 3) {
                            terms.push(word);
                        }
                    });
                });
            }
            
            terms.forEach(term => {
                if (!index[term]) {
                    index[term] = [];
                }
                index[term].push({
                    type: 'material',
                    name: materialName,
                    data: data,
                    score: data.avg_confidence || 0
                });
            });
        });

        return index;
    }

    search(query, limit = 5) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const results = new Map();
        
        queryTerms.forEach(term => {
            if (this.searchIndex[term]) {
                this.searchIndex[term].forEach(item => {
                    const key = `${item.type}:${item.name}`;
                    if (!results.has(key)) {
                        results.set(key, {
                            ...item,
                            relevanceScore: 0
                        });
                    }
                    
                    // Calculate relevance score
                    const current = results.get(key);
                    current.relevanceScore += item.score;
                    
                    // Boost for exact matches
                    if (item.name.toLowerCase().includes(term)) {
                        current.relevanceScore += 0.5;
                    }
                });
            }
        });
        
        return Array.from(results.values())
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }

    generateResponse(query, username = 'User') {
        const results = this.search(query, 3);
        
        if (results.length === 0) {
            return `Hey ${username}! I couldn't find specific information about "${query}" in my clean database. Try asking about gear sets, runes, characters, or materials!`;
        }
        
        let response = `Hey ${username}! Here's what I found about "${query}":\n\n`;
        
        results.forEach((result, index) => {
            response += `**${index + 1}. ${result.name.toUpperCase()} (${result.type})**\n`;
            
            switch (result.type) {
                case 'gear_set':
                    response += this.formatGearSetResponse(result);
                    break;
                case 'rune':
                    response += this.formatRuneResponse(result);
                    break;
                case 'character':
                    response += this.formatCharacterResponse(result);
                    break;
                case 'material':
                    response += this.formatMaterialResponse(result);
                    break;
            }
            
            response += '\n';
        });
        
        return response;
    }

    formatGearSetResponse(result) {
        const data = result.data;
        let response = `📊 **Mentions:** ${data.mentions}\n`;
        response += `🎯 **Confidence:** ${(data.avg_confidence * 100).toFixed(1)}%\n`;
        
        if (data.pieces && Object.keys(data.pieces).length > 0) {
            response += `⚔️ **Pieces:**\n`;
            Object.entries(data.pieces).forEach(([pieceType, pieces]) => {
                if (pieces.length > 0) {
                    response += `  • ${pieceType}: ${pieces.length} entries\n`;
                }
            });
        }
        
        if (data.contexts && data.contexts.length > 0) {
            response += `💬 **Community Insight:** ${data.contexts[0].substring(0, 150)}...\n`;
        }
        
        return response;
    }

    formatRuneResponse(result) {
        const data = result.data;
        let response = `📊 **Mentions:** ${data.mentions}\n`;
        response += `🎯 **Confidence:** ${(data.avg_confidence * 100).toFixed(1)}%\n`;
        
        if (data.effects && data.effects.length > 0) {
            response += `⚡ **Effects:** ${data.effects.join(', ')}\n`;
        }
        
        if (data.costs && data.costs.length > 0) {
            response += `💰 **Costs:** ${data.costs.join(', ')}\n`;
        }
        
        if (data.contexts && data.contexts.length > 0) {
            response += `💬 **Community Insight:** ${data.contexts[0].substring(0, 150)}...\n`;
        }
        
        return response;
    }

    formatCharacterResponse(result) {
        const data = result.data;
        let response = `📊 **Mentions:** ${data.mentions}\n`;
        response += `🎯 **Confidence:** ${(data.avg_confidence * 100).toFixed(1)}%\n`;
        
        if (data.usage_types && data.usage_types.length > 0) {
            response += `🎮 **Usage:** ${data.usage_types.join(', ')}\n`;
        }
        
        if (data.builds && data.builds.length > 0) {
            response += `🏗️ **Builds:** ${data.builds.length} strategies\n`;
        }
        
        if (data.contexts && data.contexts.length > 0) {
            response += `💬 **Community Insight:** ${data.contexts[0].substring(0, 150)}...\n`;
        }
        
        return response;
    }

    formatMaterialResponse(result) {
        const data = result.data;
        let response = `📊 **Mentions:** ${data.mentions}\n`;
        response += `🎯 **Confidence:** ${(data.avg_confidence * 100).toFixed(1)}%\n`;
        response += `📦 **Total Quantity:** ${data.total_quantity}\n`;
        
        if (data.contexts && data.contexts.length > 0) {
            response += `💬 **Community Insight:** ${data.contexts[0].substring(0, 150)}...\n`;
        }
        
        return response;
    }

    getTotalEntries() {
        let total = 0;
        Object.values(this.cleanData).forEach(category => {
            if (typeof category === 'object' && category !== null) {
                total += Object.keys(category).length;
            }
        });
        return total;
    }

    getStats() {
        return {
            totalEntries: this.getTotalEntries(),
            categories: {
                gear_sets: Object.keys(this.cleanData.gear_sets || {}).length,
                runes: Object.keys(this.cleanData.runes || {}).length,
                characters: Object.keys(this.cleanData.characters || {}).length,
                materials: Object.keys(this.cleanData.materials || {}).length
            },
            searchIndexSize: Object.keys(this.searchIndex).length,
            dataQuality: this.getDataQuality()
        };
    }

    getDataQuality() {
        const qualityReportPath = path.join(this.dataDir, 'quality-report.json');
        try {
            const content = fs.readFileSync(qualityReportPath, 'utf8');
            const report = JSON.parse(content);
            return {
                cleaningEfficiency: report.summary.cleaning_efficiency,
                averageConfidence: report.summary.average_confidence,
                duplicatesRemoved: report.summary.duplicates_removed
            };
        } catch (error) {
            return { error: 'Quality report not available' };
        }
    }
}

module.exports = CleanRAGSystem;


