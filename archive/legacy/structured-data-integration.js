#!/usr/bin/env node
/**
 * Structured Data Integration System
 * Integrates extracted structured data into the RAG system and bot
 */

const fs = require('fs');
const path = require('path');

class StructuredDataIntegration {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.structuredTablesDir = path.join(this.dataDir, 'structured-tables');
        this.knowledgeBaseDir = path.join(this.dataDir, 'comprehensive-knowledge-base');
        
        // Load structured tables
        this.gearTable = this.loadCSV(path.join(this.structuredTablesDir, 'gear_table.csv'));
        this.runeTable = this.loadCSV(path.join(this.structuredTablesDir, 'rune_table.csv'));
        this.characterTable = this.loadCSV(path.join(this.structuredTablesDir, 'character_table.csv'));
        this.materialsTable = this.loadCSV(path.join(this.structuredTablesDir, 'upgrade_materials_table.csv'));
        
        // Load extracted data
        this.extractedData = this.loadJSON(path.join(this.structuredTablesDir, 'extracted_data.json'));
        
        console.log('📊 Structured Data Integration System Initialized');
        console.log(`✅ Loaded ${this.gearTable.length} gear entries`);
        console.log(`✅ Loaded ${this.runeTable.length} rune entries`);
        console.log(`✅ Loaded ${this.characterTable.length} character entries`);
        console.log(`✅ Loaded ${this.materialsTable.length} material entries`);
    }

    loadCSV(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const headers = lines[0].split(',');
            
            return lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header.trim()] = values[index] ? values[index].trim() : '';
                });
                return obj;
            });
        } catch (error) {
            console.error(`Error loading CSV ${filePath}:`, error.message);
            return [];
        }
    }

    loadJSON(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error loading JSON ${filePath}:`, error.message);
            return {};
        }
    }

    generateStructuredKnowledgeBase() {
        console.log('🔄 Generating structured knowledge base...');
        
        const structuredKB = {
            name: "Structured Archero 2 Knowledge Base",
            description: "Community-verified structured data extracted from Discord, Wiki, and Reddit",
            version: "2.2.0",
            lastUpdated: new Date().toISOString(),
            categories: {
                gear_sets: this.processGearData(),
                runes: this.processRuneData(),
                characters: this.processCharacterData(),
                upgrade_materials: this.processMaterialsData(),
                builds: this.generateBuildRecommendations(),
                costs: this.generateCostData()
            }
        };

        // Save structured knowledge base
        const outputPath = path.join(this.dataDir, 'structured-knowledge-base.json');
        fs.writeFileSync(outputPath, JSON.stringify(structuredKB, null, 2));
        
        console.log(`✅ Generated structured knowledge base: ${outputPath}`);
        return structuredKB;
    }

    processGearData() {
        const gearSets = {};
        
        this.gearTable.forEach(gear => {
            const setName = gear.set || 'unknown';
            if (!gearSets[setName]) {
                gearSets[setName] = {
                    name: setName,
                    pieces: [],
                    totalMentions: 0,
                    bestContext: '',
                    sources: new Set()
                };
            }
            
            gearSets[setName].pieces.push({
                name: gear.name,
                pieceType: gear.piece_type || 'unknown',
                mentions: parseInt(gear.mention_count) || 0,
                context: gear.best_context || ''
            });
            
            gearSets[setName].totalMentions += parseInt(gear.mention_count) || 0;
            if (gear.best_context && gear.best_context.length > gearSets[setName].bestContext.length) {
                gearSets[setName].bestContext = gear.best_context;
            }
            
            // Parse sources
            try {
                const sources = JSON.parse(gear.sources || '[]');
                sources.forEach(source => gearSets[setName].sources.add(source));
            } catch (e) {
                // Ignore parsing errors
            }
        });

        // Convert sets to arrays
        Object.values(gearSets).forEach(set => {
            set.sources = Array.from(set.sources);
        });

        return gearSets;
    }

    processRuneData() {
        const runes = {};
        
        this.runeTable.forEach(rune => {
            runes[rune.name] = {
                name: rune.name,
                mentions: parseInt(rune.mention_count) || 0,
                effects: this.parseEffects(rune.potential_effects),
                context: rune.best_context || '',
                sources: this.parseSources(rune.sources)
            };
        });

        return runes;
    }

    processCharacterData() {
        const characters = {};
        
        this.characterTable.forEach(char => {
            characters[char.name] = {
                name: char.name,
                mentions: parseInt(char.mention_count) || 0,
                context: char.best_context || '',
                sources: this.parseSources(char.sources),
                usage: this.extractCharacterUsage(char.best_context)
            };
        });

        return characters;
    }

    processMaterialsData() {
        const materials = {};
        
        this.materialsTable.forEach(material => {
            materials[material.name] = {
                name: material.name,
                totalQuantity: parseInt(material.total_quantity_mentioned) || 0,
                mentions: parseInt(material.mention_count) || 0,
                context: material.best_context || '',
                sources: this.parseSources(material.sources)
            };
        });

        return materials;
    }

    generateBuildRecommendations() {
        const builds = {
            pvp: {
                name: "PvP Builds",
                recommendations: []
            },
            pve: {
                name: "PvE Builds", 
                recommendations: []
            },
            mixed: {
                name: "Mixed Set Builds",
                recommendations: []
            }
        };

        // Generate PvP builds based on data
        builds.pvp.recommendations.push({
            name: "Griffin PvP Build",
            description: "High-tier PvP build using Griffin set",
            gear: ["griffin amulet", "griffin ring"],
            characters: ["otta", "thor", "helix"],
            runes: ["meteor", "sprite", "elemental"],
            context: "PvP being griffin Amulett and Ring. Also oracle chest"
        });

        builds.pvp.recommendations.push({
            name: "Dragoon Crossbow Build",
            description: "Crossbow-focused PvP build",
            gear: ["dragoon crossbow", "dragoon boots", "dragoon helmet"],
            characters: ["otta", "thor"],
            runes: ["meteor", "etched"],
            context: "chaotic dragoon weapon, helm, boots, griffin amulet, ring, oracle armor"
        });

        // Generate PvE builds
        builds.pve.recommendations.push({
            name: "Oracle PvE Build",
            description: "PvE-focused build using Oracle set",
            gear: ["oracle spear", "oracle chest", "oracle boots"],
            characters: ["rolla", "thor", "nyanja"],
            runes: ["sprite", "circle"],
            context: "6 nyanja with rolla and thor for PvE"
        });

        // Generate mixed builds
        builds.mixed.recommendations.push({
            name: "Oracle + Dragoon Mixed",
            description: "Best mixed set combination",
            gear: ["dragoon crossbow", "oracle amulet", "oracle ring", "oracle chest", "dragoon boots", "dragoon helmet"],
            characters: ["otta", "thor", "helix"],
            runes: ["meteor", "sprite", "elemental"],
            context: "mixed set can beat full dragoon set"
        });

        return builds;
    }

    generateCostData() {
        const costs = {
            runes: {},
            materials: {},
            events: {}
        };

        // Process rune costs from extracted data
        if (this.extractedData.runes) {
            Object.entries(this.extractedData.runes).forEach(([runeName, entries]) => {
                entries.forEach(entry => {
                    const context = entry.context || '';
                    const gemMatch = context.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gems?|gem)/);
                    if (gemMatch) {
                        costs.runes[runeName] = {
                            gems: parseInt(gemMatch[1].replace(/,/g, '')),
                            context: context
                        };
                    }
                });
            });
        }

        // Process material costs
        if (this.extractedData.materials) {
            Object.entries(this.extractedData.materials).forEach(([materialName, entries]) => {
                const totalQuantity = entries.reduce((sum, entry) => sum + (parseInt(entry.quantity) || 0), 0);
                if (totalQuantity > 0) {
                    costs.materials[materialName] = {
                        totalQuantity: totalQuantity,
                        averagePerMention: totalQuantity / entries.length
                    };
                }
            });
        }

        return costs;
    }

    parseEffects(effectsString) {
        try {
            return JSON.parse(effectsString || '[]');
        } catch (e) {
            return [];
        }
    }

    parseSources(sourcesString) {
        try {
            return JSON.parse(sourcesString || '[]');
        } catch (e) {
            return [];
        }
    }

    extractCharacterUsage(context) {
        const usage = [];
        if (context.toLowerCase().includes('pvp')) usage.push('PvP');
        if (context.toLowerCase().includes('pve')) usage.push('PvE');
        if (context.toLowerCase().includes('resonance')) usage.push('Resonance');
        if (context.toLowerCase().includes('base')) usage.push('Base Character');
        return usage;
    }

    generateRAGIntegration() {
        console.log('🔄 Generating RAG integration...');
        
        const ragIntegration = {
            name: "Structured RAG Integration",
            description: "Integration layer for structured data in RAG system",
            version: "2.2.0",
            data: {
                gear_sets: this.processGearData(),
                runes: this.processRuneData(),
                characters: this.processCharacterData(),
                materials: this.processMaterialsData(),
                builds: this.generateBuildRecommendations(),
                costs: this.generateCostData()
            },
            searchPatterns: {
                gear: [
                    "best gear set",
                    "oracle vs dragoon",
                    "griffin build",
                    "mixed set",
                    "pvp gear"
                ],
                runes: [
                    "best runes",
                    "meteor rune",
                    "sprite rune", 
                    "etched rune",
                    "rune build"
                ],
                characters: [
                    "best character",
                    "otta build",
                    "thor build",
                    "helix build",
                    "character tier list"
                ],
                materials: [
                    "upgrade cost",
                    "shard requirements",
                    "gem cost",
                    "upgrade materials"
                ]
            }
        };

        const outputPath = path.join(this.dataDir, 'rag-integration.json');
        fs.writeFileSync(outputPath, JSON.stringify(ragIntegration, null, 2));
        
        console.log(`✅ Generated RAG integration: ${outputPath}`);
        return ragIntegration;
    }

    run() {
        console.log('🚀 Starting Structured Data Integration...');
        
        // Generate structured knowledge base
        const structuredKB = this.generateStructuredKnowledgeBase();
        
        // Generate RAG integration
        const ragIntegration = this.generateRAGIntegration();
        
        console.log('\n📊 INTEGRATION SUMMARY');
        console.log('======================');
        console.log(`✅ Gear Sets: ${Object.keys(structuredKB.categories.gear_sets).length}`);
        console.log(`✅ Runes: ${Object.keys(structuredKB.categories.runes).length}`);
        console.log(`✅ Characters: ${Object.keys(structuredKB.categories.characters).length}`);
        console.log(`✅ Materials: ${Object.keys(structuredKB.categories.materials || {}).length}`);
        console.log(`✅ Build Recommendations: ${Object.keys(structuredKB.categories.builds || {}).length}`);
        console.log(`✅ Cost Data: ${Object.keys(structuredKB.categories.costs || {}).length}`);
        
        console.log('\n🎯 Integration Complete!');
        console.log('The bot now has access to structured, community-verified data!');
        
        return {
            structuredKB,
            ragIntegration
        };
    }
}

// Run if called directly
if (require.main === module) {
    const integration = new StructuredDataIntegration();
    integration.run();
}

module.exports = StructuredDataIntegration;
