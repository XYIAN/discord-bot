#!/usr/bin/env node
/**
 * Enhanced RAG System with Structured Data Integration
 * Uses structured tables instead of raw Discord data
 */

const fs = require('fs');
const path = require('path');

class EnhancedRAGSystem {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.structuredKB = this.loadStructuredKnowledgeBase();
        this.ragIntegration = this.loadRAGIntegration();
        
        console.log('🧠 Enhanced RAG System initialized with structured data');
        console.log(`✅ Gear Sets: ${Object.keys(this.structuredKB.categories.gear_sets).length}`);
        console.log(`✅ Runes: ${Object.keys(this.structuredKB.categories.runes).length}`);
        console.log(`✅ Characters: ${Object.keys(this.structuredKB.categories.characters).length}`);
        console.log(`✅ Builds: ${Object.keys(this.structuredKB.categories.builds).length}`);
    }

    loadStructuredKnowledgeBase() {
        try {
            const filePath = path.join(this.dataDir, 'structured-knowledge-base.json');
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading structured knowledge base:', error.message);
            return { categories: {} };
        }
    }

    loadRAGIntegration() {
        try {
            const filePath = path.join(this.dataDir, 'rag-integration.json');
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading RAG integration:', error.message);
            return { data: {} };
        }
    }

    searchGearSets(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.structuredKB.categories.gear_sets).forEach(([setName, setData]) => {
            let score = 0;
            
            // Check if query matches set name
            if (setName.toLowerCase().includes(queryLower)) {
                score += 100;
            }
            
            // Check if query matches any piece names
            setData.pieces.forEach(piece => {
                if (piece.name.toLowerCase().includes(queryLower)) {
                    score += 50;
                }
            });
            
            // Check context
            if (setData.bestContext.toLowerCase().includes(queryLower)) {
                score += 25;
            }
            
            if (score > 0) {
                results.push({
                    type: 'gear_set',
                    name: setName,
                    data: setData,
                    score: score
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    searchRunes(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.structuredKB.categories.runes).forEach(([runeName, runeData]) => {
            let score = 0;
            
            // Check if query matches rune name
            if (runeName.toLowerCase().includes(queryLower)) {
                score += 100;
            }
            
            // Check effects
            if (runeData.effects && runeData.effects.some(effect => 
                effect.toString().toLowerCase().includes(queryLower))) {
                score += 50;
            }
            
            // Check context
            if (runeData.context.toLowerCase().includes(queryLower)) {
                score += 25;
            }
            
            if (score > 0) {
                results.push({
                    type: 'rune',
                    name: runeName,
                    data: runeData,
                    score: score
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    searchCharacters(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.structuredKB.categories.characters).forEach(([charName, charData]) => {
            let score = 0;
            
            // Check if query matches character name
            if (charName.toLowerCase().includes(queryLower)) {
                score += 100;
            }
            
            // Check usage types
            if (charData.usage && charData.usage.some(usage => 
                usage.toLowerCase().includes(queryLower))) {
                score += 50;
            }
            
            // Check context
            if (charData.context.toLowerCase().includes(queryLower)) {
                score += 25;
            }
            
            if (score > 0) {
                results.push({
                    type: 'character',
                    name: charName,
                    data: charData,
                    score: score
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    searchBuilds(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.structuredKB.categories.builds).forEach(([buildType, buildData]) => {
            buildData.recommendations.forEach((build, index) => {
                let score = 0;
                
                // Check if query matches build name or description
                if (build.name.toLowerCase().includes(queryLower) || 
                    build.description.toLowerCase().includes(queryLower)) {
                    score += 100;
                }
                
                // Check gear matches
                if (build.gear && build.gear.some(gear => 
                    gear.toLowerCase().includes(queryLower))) {
                    score += 50;
                }
                
                // Check character matches
                if (build.characters && build.characters.some(char => 
                    char.toLowerCase().includes(queryLower))) {
                    score += 50;
                }
                
                // Check rune matches
                if (build.runes && build.runes.some(rune => 
                    rune.toLowerCase().includes(queryLower))) {
                    score += 50;
                }
                
                if (score > 0) {
                    results.push({
                        type: 'build',
                        category: buildType,
                        name: build.name,
                        data: build,
                        score: score
                    });
                }
            });
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    searchMaterials(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.structuredKB.categories.materials || {}).forEach(([materialName, materialData]) => {
            let score = 0;
            
            // Check if query matches material name
            if (materialName.toLowerCase().includes(queryLower)) {
                score += 100;
            }
            
            // Check context
            if (materialData.context && materialData.context.toLowerCase().includes(queryLower)) {
                score += 25;
            }
            
            if (score > 0) {
                results.push({
                    type: 'material',
                    name: materialName,
                    data: materialData,
                    score: score
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    generateResponse(query, username = 'User') {
        const queryLower = query.toLowerCase();
        
        // Search all categories
        const gearResults = this.searchGearSets(query);
        const runeResults = this.searchRunes(query);
        const charResults = this.searchCharacters(query);
        const buildResults = this.searchBuilds(query);
        const materialResults = this.searchMaterials(query);
        
        // Combine and sort all results
        const allResults = [
            ...gearResults,
            ...runeResults,
            ...charResults,
            ...buildResults,
            ...materialResults
        ].sort((a, b) => b.score - a.score);
        
        if (allResults.length === 0) {
            return `Hey ${username}! I couldn't find specific information about "${query}" in my structured knowledge base. Try asking about gear sets, runes, characters, or builds!`;
        }
        
        // Generate response based on best results
        const bestResult = allResults[0];
        let response = `Hey ${username}! Here's what I found about "${query}":\n\n`;
        
        switch (bestResult.type) {
            case 'gear_set':
                response += this.formatGearSetResponse(bestResult);
                break;
            case 'rune':
                response += this.formatRuneResponse(bestResult);
                break;
            case 'character':
                response += this.formatCharacterResponse(bestResult);
                break;
            case 'build':
                response += this.formatBuildResponse(bestResult);
                break;
            case 'material':
                response += this.formatMaterialResponse(bestResult);
                break;
        }
        
        // Add related information if available
        if (allResults.length > 1) {
            response += '\n\n**Related Information:**\n';
            allResults.slice(1, 4).forEach(result => {
                response += `• ${result.name} (${result.type})\n`;
            });
        }
        
        return response;
    }

    formatGearSetResponse(result) {
        const setData = result.data;
        let response = `**${result.name.toUpperCase()} GEAR SET**\n`;
        response += `📊 **Mentions:** ${setData.totalMentions}\n`;
        response += `🔧 **Pieces:** ${setData.pieces.length}\n\n`;
        
        if (setData.pieces.length > 0) {
            response += `**Gear Pieces:**\n`;
            setData.pieces.forEach(piece => {
                response += `• ${piece.name} (${piece.pieceType}) - ${piece.mentions} mentions\n`;
            });
        }
        
        if (setData.bestContext) {
            response += `\n**Community Insight:** ${setData.bestContext.substring(0, 200)}...\n`;
        }
        
        return response;
    }

    formatRuneResponse(result) {
        const runeData = result.data;
        let response = `**${result.name.toUpperCase()} RUNE**\n`;
        response += `📊 **Mentions:** ${runeData.mentions}\n`;
        
        if (runeData.effects && runeData.effects.length > 0) {
            response += `⚡ **Effects:** ${runeData.effects.join(', ')}\n`;
        }
        
        if (runeData.context) {
            response += `\n**Community Insight:** ${runeData.context.substring(0, 200)}...\n`;
        }
        
        return response;
    }

    formatCharacterResponse(result) {
        const charData = result.data;
        let response = `**${result.name.toUpperCase()} CHARACTER**\n`;
        response += `📊 **Mentions:** ${charData.mentions}\n`;
        
        if (charData.usage && charData.usage.length > 0) {
            response += `🎯 **Usage:** ${charData.usage.join(', ')}\n`;
        }
        
        if (charData.context) {
            response += `\n**Community Insight:** ${charData.context.substring(0, 200)}...\n`;
        }
        
        return response;
    }

    formatBuildResponse(result) {
        const buildData = result.data;
        let response = `**${buildData.name.toUpperCase()} BUILD**\n`;
        response += `📋 **Category:** ${result.category}\n`;
        response += `📝 **Description:** ${buildData.description}\n\n`;
        
        if (buildData.gear && buildData.gear.length > 0) {
            response += `⚔️ **Gear:** ${buildData.gear.join(', ')}\n`;
        }
        
        if (buildData.characters && buildData.characters.length > 0) {
            response += `👥 **Characters:** ${buildData.characters.join(', ')}\n`;
        }
        
        if (buildData.runes && buildData.runes.length > 0) {
            response += `🔮 **Runes:** ${buildData.runes.join(', ')}\n`;
        }
        
        if (buildData.context) {
            response += `\n**Community Insight:** ${buildData.context.substring(0, 200)}...\n`;
        }
        
        return response;
    }

    formatMaterialResponse(result) {
        const materialData = result.data;
        let response = `**${result.name.toUpperCase()} MATERIAL**\n`;
        response += `📊 **Total Quantity:** ${materialData.totalQuantity}\n`;
        response += `📈 **Mentions:** ${materialData.mentions}\n`;
        
        if (materialData.context) {
            response += `\n**Community Insight:** ${materialData.context.substring(0, 200)}...\n`;
        }
        
        return response;
    }

    getStats() {
        return {
            totalEntries: Object.keys(this.structuredKB.categories.gear_sets).length +
                         Object.keys(this.structuredKB.categories.runes).length +
                         Object.keys(this.structuredKB.categories.characters).length +
                         Object.keys(this.structuredKB.categories.materials || {}).length +
                         Object.keys(this.structuredKB.categories.builds).length,
            categories: {
                gear_sets: Object.keys(this.structuredKB.categories.gear_sets).length,
                runes: Object.keys(this.structuredKB.categories.runes).length,
                characters: Object.keys(this.structuredKB.categories.characters).length,
                materials: Object.keys(this.structuredKB.categories.materials || {}).length,
                builds: Object.keys(this.structuredKB.categories.builds).length
            }
        };
    }
}

module.exports = EnhancedRAGSystem;

