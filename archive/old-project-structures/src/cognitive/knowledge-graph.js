/**
 * Cognitive Knowledge Graph System
 * Implements structured knowledge representation with relationships and reasoning
 */

class KnowledgeGraph {
    constructor() {
        this.entities = new Map();
        this.relationships = new Map();
        this.categories = new Map();
        this.index = new Map(); // For fast lookups
    }

    // Add an entity to the knowledge graph
    addEntity(id, data) {
        const entity = {
            id,
            type: data.type || 'concept',
            name: data.name || id,
            properties: data.properties || {},
            content: data.content || '',
            confidence: data.confidence || 1.0,
            source: data.source || 'unknown',
            timestamp: data.timestamp || new Date().toISOString()
        };

        this.entities.set(id, entity);
        
        // Add to category
        if (data.category) {
            if (!this.categories.has(data.category)) {
                this.categories.set(data.category, new Set());
            }
            this.categories.get(data.category).add(id);
        }

        // Add to search index
        this._indexEntity(entity);
        
        return entity;
    }

    // Add a relationship between entities
    addRelationship(fromId, toId, type, properties = {}) {
        const relationship = {
            id: `${fromId}_${type}_${toId}`,
            from: fromId,
            to: toId,
            type,
            properties,
            confidence: properties.confidence || 1.0,
            timestamp: new Date().toISOString()
        };

        this.relationships.set(relationship.id, relationship);
        return relationship;
    }

    // Find entities by query
    findEntities(query, options = {}) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [id, entity] of this.entities) {
            let score = 0;
            
            // Check name match
            if (entity.name.toLowerCase().includes(queryLower)) {
                score += 10;
            }
            
            // Check content match
            if (entity.content.toLowerCase().includes(queryLower)) {
                score += 5;
            }
            
            // Check property matches
            for (const [key, value] of Object.entries(entity.properties)) {
                if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
                    score += 3;
                }
            }
            
            if (score > 0) {
                results.push({ entity, score });
            }
        }
        
        // Sort by score and confidence
        return results
            .sort((a, b) => (b.score + b.entity.confidence) - (a.score + a.entity.confidence))
            .slice(0, options.limit || 10);
    }

    // Find related entities
    findRelated(entityId, relationshipType = null, limit = 5) {
        const related = [];
        
        for (const [relId, relationship] of this.relationships) {
            if (relationshipType && relationship.type !== relationshipType) continue;
            
            if (relationship.from === entityId) {
                const targetEntity = this.entities.get(relationship.to);
                if (targetEntity) {
                    related.push({ entity: targetEntity, relationship });
                }
            } else if (relationship.to === entityId) {
                const sourceEntity = this.entities.get(relationship.from);
                if (sourceEntity) {
                    related.push({ entity: sourceEntity, relationship });
                }
            }
        }
        
        return related.slice(0, limit);
    }

    // Reason about relationships
    reason(query, context = {}) {
        const results = this.findEntities(query);
        const reasoning = [];
        
        for (const { entity, score } of results) {
            const related = this.findRelated(entity.id);
            
            reasoning.push({
                entity,
                score,
                related,
                reasoning: this._generateReasoning(entity, related, context)
            });
        }
        
        return reasoning;
    }

    // Generate reasoning explanation
    _generateReasoning(entity, related, context) {
        const explanations = [];
        
        for (const { entity: relatedEntity, relationship } of related) {
            switch (relationship.type) {
                case 'recommended_for':
                    explanations.push(`${entity.name} is recommended for ${relatedEntity.name}`);
                    break;
                case 'synergizes_with':
                    explanations.push(`${entity.name} synergizes well with ${relatedEntity.name}`);
                    break;
                case 'effective_in':
                    explanations.push(`${entity.name} is effective in ${relatedEntity.name}`);
                    break;
                case 'belongs_to':
                    explanations.push(`${entity.name} belongs to the ${relatedEntity.name} category`);
                    break;
                case 'has_property':
                    explanations.push(`${entity.name} has the property: ${relatedEntity.name}`);
                    break;
                default:
                    explanations.push(`${entity.name} is related to ${relatedEntity.name} (${relationship.type})`);
            }
        }
        
        return explanations;
    }

    // Index entity for fast searching
    _indexEntity(entity) {
        const terms = [
            entity.name,
            entity.type,
            ...Object.keys(entity.properties),
            ...Object.values(entity.properties).filter(v => typeof v === 'string')
        ].join(' ').toLowerCase().split(/\s+/);
        
        for (const term of terms) {
            if (term.length > 2) {
                if (!this.index.has(term)) {
                    this.index.set(term, new Set());
                }
                this.index.get(term).add(entity.id);
            }
        }
    }

    // Get statistics
    getStats() {
        return {
            entities: this.entities.size,
            relationships: this.relationships.size,
            categories: this.categories.size,
            indexedTerms: this.index.size
        };
    }

    // Export for persistence
    export() {
        return {
            entities: Object.fromEntries(this.entities),
            relationships: Object.fromEntries(this.relationships),
            categories: Object.fromEntries(
                Array.from(this.categories.entries()).map(([k, v]) => [k, Array.from(v)])
            ),
            timestamp: new Date().toISOString()
        };
    }

    // Import from data
    import(data) {
        // Clear existing data
        this.entities.clear();
        this.relationships.clear();
        this.categories.clear();
        this.index.clear();

        // Import entities
        for (const [id, entity] of Object.entries(data.entities || {})) {
            this.entities.set(id, entity);
            this._indexEntity(entity);
        }

        // Import relationships
        for (const [id, relationship] of Object.entries(data.relationships || {})) {
            this.relationships.set(id, relationship);
        }

        // Import categories
        for (const [category, entityIds] of Object.entries(data.categories || {})) {
            this.categories.set(category, new Set(entityIds));
        }
    }
}

module.exports = KnowledgeGraph;
