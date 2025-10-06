/**
 * Data Loader for Knowledge Graph
 * Converts our cleaned facts into structured knowledge graph entities
 */

const fs = require('fs');
const path = require('path');
const KnowledgeGraph = require('./knowledge-graph');

class DataLoader {
    constructor() {
        this.knowledgeGraph = new KnowledgeGraph();
    }

    // Load and convert all data sources
    async loadAllData() {
        console.log('🧠 Loading data into knowledge graph...');
        
        // Load cleaned facts
        await this._loadCleanedFacts();
        
        // Load real facts
        await this._loadRealFacts();
        
        // Add relationships
        this._addRelationships();
        
        console.log(`✅ Loaded ${this.knowledgeGraph.getStats().entities} entities and ${this.knowledgeGraph.getStats().relationships} relationships`);
        
        return this.knowledgeGraph;
    }

    // Load cleaned facts from our extraction
    async _loadCleanedFacts() {
        const factsFile = path.join(__dirname, '../../data/cleaned-real-facts.json');
        
        if (!fs.existsSync(factsFile)) {
            console.log('⚠️ No cleaned facts file found');
            return;
        }

        const data = JSON.parse(fs.readFileSync(factsFile, 'utf8'));
        
        Object.entries(data).forEach(([category, facts]) => {
            Object.entries(facts).forEach(([key, content]) => {
                // Only add if content is substantial and useful
                if (this._isUsefulContent(content)) {
                    this.knowledgeGraph.addEntity(key, {
                        type: this._determineType(category, content),
                        name: this._extractName(content),
                        content: this._cleanContent(content),
                        category,
                        source: 'cleaned_facts',
                        confidence: this._calculateConfidence(content)
                    });
                }
            });
        });
    }

    // Load real facts
    async _loadRealFacts() {
        const realFactsFile = path.join(__dirname, '../../data/real-archero2-facts.json');
        
        if (!fs.existsSync(realFactsFile)) {
            console.log('⚠️ No real facts file found');
            return;
        }

        const data = JSON.parse(fs.readFileSync(realFactsFile, 'utf8'));
        
        Object.entries(data).forEach(([category, facts]) => {
            Object.entries(facts).forEach(([key, content]) => {
                this.knowledgeGraph.addEntity(`real_${category}_${key}`, {
                    type: this._determineType(category, content),
                    name: this._extractName(content),
                    content,
                    category,
                    source: 'real_facts',
                    confidence: 1.0
                });
            });
        });
    }

    // Add relationships between entities
    _addRelationships() {
        const entities = Array.from(this.knowledgeGraph.entities.values());
        
        // Add relationships based on content analysis
        entities.forEach(entity => {
            const content = entity.content.toLowerCase();
            
            // Weapon relationships
            if (entity.type === 'weapon') {
                this._addWeaponRelationships(entity, entities);
            }
            
            // Character relationships
            if (entity.type === 'character') {
                this._addCharacterRelationships(entity, entities);
            }
            
            // PvP relationships
            if (content.includes('pvp') || content.includes('arena')) {
                this._addPvPRelationships(entity, entities);
            }
            
            // Gear relationships
            if (content.includes('gear') || content.includes('equipment')) {
                this._addGearRelationships(entity, entities);
            }
        });
    }

    // Add weapon-specific relationships
    _addWeaponRelationships(weapon, allEntities) {
        const weaponName = weapon.name.toLowerCase();
        
        // Find characters that work well with this weapon
        allEntities.forEach(entity => {
            if (entity.type === 'character' && entity.content.toLowerCase().includes(weaponName)) {
                this.knowledgeGraph.addRelationship(
                    weapon.id,
                    entity.id,
                    'recommended_for',
                    { confidence: 0.8 }
                );
            }
        });
        
        // Find game modes this weapon is effective in
        allEntities.forEach(entity => {
            if (entity.content.toLowerCase().includes(weaponName) && 
                (entity.content.toLowerCase().includes('pvp') || entity.content.toLowerCase().includes('arena'))) {
                this.knowledgeGraph.addRelationship(
                    weapon.id,
                    entity.id,
                    'effective_in',
                    { confidence: 0.7 }
                );
            }
        });
    }

    // Add character-specific relationships
    _addCharacterRelationships(character, allEntities) {
        const characterName = character.name.toLowerCase();
        
        // Find weapons recommended for this character
        allEntities.forEach(entity => {
            if (entity.type === 'weapon' && entity.content.toLowerCase().includes(characterName)) {
                this.knowledgeGraph.addRelationship(
                    character.id,
                    entity.id,
                    'synergizes_with',
                    { confidence: 0.8 }
                );
            }
        });
    }

    // Add PvP-specific relationships
    _addPvPRelationships(pvpEntity, allEntities) {
        allEntities.forEach(entity => {
            if (entity.id !== pvpEntity.id && 
                (entity.content.toLowerCase().includes('pvp') || entity.content.toLowerCase().includes('arena'))) {
                this.knowledgeGraph.addRelationship(
                    pvpEntity.id,
                    entity.id,
                    'related_to',
                    { confidence: 0.6 }
                );
            }
        });
    }

    // Add gear-specific relationships
    _addGearRelationships(gearEntity, allEntities) {
        allEntities.forEach(entity => {
            if (entity.type === 'character' && gearEntity.content.toLowerCase().includes(entity.name.toLowerCase())) {
                this.knowledgeGraph.addRelationship(
                    gearEntity.id,
                    entity.id,
                    'recommended_for',
                    { confidence: 0.7 }
                );
            }
        });
    }

    // Determine entity type based on content
    _determineType(category, content) {
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes('weapon') || contentLower.includes('staff') || contentLower.includes('crossbow')) {
            return 'weapon';
        }
        
        if (contentLower.includes('character') || contentLower.includes('dragoon') || contentLower.includes('oracle')) {
            return 'character';
        }
        
        if (contentLower.includes('rune') || contentLower.includes('enchant')) {
            return 'rune';
        }
        
        if (contentLower.includes('gear') || contentLower.includes('equipment') || contentLower.includes('set')) {
            return 'gear';
        }
        
        if (contentLower.includes('pvp') || contentLower.includes('arena')) {
            return 'game_mode';
        }
        
        if (contentLower.includes('guild') || contentLower.includes('xyian')) {
            return 'guild';
        }
        
        return 'concept';
    }

    // Extract name from content
    _extractName(content) {
        // Try to extract a meaningful name from the content
        const sentences = content.split(/[.!?]/);
        const firstSentence = sentences[0].trim();
        
        // If it's a question, extract the subject
        if (firstSentence.includes('?')) {
            const words = firstSentence.split(' ');
            const questionWords = ['what', 'which', 'how', 'why', 'when', 'where'];
            const questionIndex = words.findIndex(word => questionWords.includes(word.toLowerCase()));
            if (questionIndex !== -1 && questionIndex < words.length - 1) {
                return words.slice(questionIndex + 1, questionIndex + 3).join(' ');
            }
        }
        
        // Otherwise, use first few words
        return firstSentence.split(' ').slice(0, 3).join(' ');
    }

    // Clean content for better processing
    _cleanContent(content) {
        return content
            .replace(/@\w+/g, '') // Remove usernames
            .replace(/https?:\/\/\S+/g, '') // Remove URLs
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    // Check if content is useful
    _isUsefulContent(content) {
        if (!content || typeof content !== 'string') return false;
        
        // Must be substantial
        if (content.length < 30) return false;
        
        // Must not be mostly chat
        const chatIndicators = ['@', 'yesterday', 'today', 'lol', 'haha'];
        const chatCount = chatIndicators.filter(indicator => content.includes(indicator)).length;
        if (chatCount > 2) return false;
        
        // Must contain game-related terms
        const gameTerms = ['weapon', 'character', 'damage', 'pvp', 'arena', 'rune', 'gear', 'build'];
        const hasGameTerms = gameTerms.some(term => content.toLowerCase().includes(term));
        
        return hasGameTerms;
    }

    // Calculate confidence based on content quality
    _calculateConfidence(content) {
        let confidence = 0.5;
        
        // Length factor
        if (content.length > 100) confidence += 0.2;
        if (content.length > 200) confidence += 0.1;
        
        // Technical terms
        const technicalTerms = ['damage', 'critical', 'tier', 'stats', 'bonus', 'synergy'];
        const techCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
        confidence += techCount * 0.05;
        
        // Question indicators (lower confidence for questions)
        if (content.includes('?')) confidence -= 0.1;
        
        return Math.min(Math.max(confidence, 0.1), 1.0);
    }

    // Save knowledge graph to file
    async saveKnowledgeGraph(filePath) {
        const data = this.knowledgeGraph.export();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved knowledge graph to ${filePath}`);
    }

    // Load knowledge graph from file
    async loadKnowledgeGraph(filePath) {
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            this.knowledgeGraph.import(data);
            console.log(`📁 Loaded knowledge graph from ${filePath}`);
        }
    }
}

module.exports = DataLoader;
