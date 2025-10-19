/**
 * Dual Process Reasoning System
 * Implements System 1 (fast, intuitive) and System 2 (slow, analytical) reasoning
 */

class DualProcessReasoning {
    constructor(knowledgeGraph) {
        this.knowledgeGraph = knowledgeGraph;
        this.system1Cache = new Map();
        this.complexityThreshold = 0.3;
        this.responseTimeThreshold = 1000; // 1 second
    }

    // Main reasoning entry point
    async reason(message, context = {}) {
        const startTime = Date.now();
        
        // Analyze question complexity
        const complexity = this._analyzeComplexity(message, context);
        
        // Route to appropriate system
        let response;
        if (complexity < this.complexityThreshold) {
            response = await this._system1Reasoning(message, context);
        } else {
            response = await this._system2Reasoning(message, context);
        }
        
        const responseTime = Date.now() - startTime;
        
        return {
            ...response,
            reasoning: {
                system: complexity < this.complexityThreshold ? 'System 1' : 'System 2',
                complexity,
                responseTime,
                confidence: response.confidence || 0.8
            }
        };
    }

    // System 1: Fast, intuitive reasoning
    async _system1Reasoning(message, context) {
        const messageLower = message.toLowerCase();
        
        // Check cache first
        const cacheKey = this._getCacheKey(messageLower, context);
        if (this.system1Cache.has(cacheKey)) {
            const cached = this.system1Cache.get(cacheKey);
            return { ...cached, fromCache: true };
        }

        // Simple pattern matching for common questions
        const patterns = {
            'what is your name': () => ({
                answer: "I'm XY Elder, the trusted henchman and guild elder of XYIAN OFFICIAL!",
                confidence: 1.0,
                reasoning: 'Direct identity question'
            }),
            'best weapon': () => this._getBestWeapon(),
            'best character': () => this._getBestCharacter(),
            'pvp': () => this._getPvPAdvice(),
            'arena': () => this._getArenaAdvice(),
            'guild requirements': () => this._getGuildRequirements(),
            'mixed gear': () => this._getMixedGearInfo()
        };

        // Find matching pattern
        for (const [pattern, handler] of Object.entries(patterns)) {
            if (messageLower.includes(pattern)) {
                const result = handler();
                this.system1Cache.set(cacheKey, result);
                return result;
            }
        }

        // Fallback to simple knowledge search
        const results = this.knowledgeGraph.findEntities(message, { limit: 1 });
        if (results.length > 0) {
            const { entity } = results[0];
            const result = {
                answer: entity.content,
                confidence: entity.confidence * 0.8,
                reasoning: 'Simple knowledge retrieval',
                source: entity.source
            };
            this.system1Cache.set(cacheKey, result);
            return result;
        }

        return {
            answer: "I need more information to help you with that question.",
            confidence: 0.3,
            reasoning: 'No pattern match found'
        };
    }

    // System 2: Slow, analytical reasoning
    async _system2Reasoning(message, context) {
        // Deep knowledge graph reasoning
        const reasoning = this.knowledgeGraph.reason(message, context);
        
        if (reasoning.length === 0) {
            return {
                answer: "I don't have enough information to provide a comprehensive answer to that complex question.",
                confidence: 0.2,
                reasoning: 'No relevant knowledge found'
            };
        }

        // Build comprehensive response
        const primary = reasoning[0];
        const related = reasoning.slice(1, 3);
        
        let answer = primary.entity.content;
        
        // Add related information
        if (related.length > 0) {
            answer += "\n\n**Related Information:**\n";
            related.forEach(({ entity, reasoning: relReasoning }) => {
                answer += `• ${entity.name}: ${entity.content.substring(0, 100)}...\n`;
            });
        }

        // Add reasoning explanations
        if (primary.reasoning.length > 0) {
            answer += "\n\n**Why this matters:**\n";
            primary.reasoning.forEach(explanation => {
                answer += `• ${explanation}\n`;
            });
        }

        return {
            answer,
            confidence: Math.min(0.9, primary.score / 10 + 0.5),
            reasoning: 'Deep analytical reasoning',
            sources: reasoning.map(r => r.entity.source).filter((v, i, a) => a.indexOf(v) === i),
            relatedEntities: related.map(r => r.entity.name)
        };
    }

    // Analyze question complexity
    _analyzeComplexity(message, context) {
        let complexity = 0;
        
        // Length factor
        complexity += Math.min(message.length / 200, 0.3);
        
        // Question words
        const complexWords = ['why', 'how', 'explain', 'compare', 'difference', 'strategy', 'build', 'optimize'];
        const messageLower = message.toLowerCase();
        complexWords.forEach(word => {
            if (messageLower.includes(word)) complexity += 0.1;
        });
        
        // Technical terms
        const technicalTerms = ['synergy', 'meta', 'optimization', 'efficiency', 'calculation', 'formula'];
        technicalTerms.forEach(term => {
            if (messageLower.includes(term)) complexity += 0.15;
        });
        
        // Context complexity
        if (context.userLevel === 'expert') complexity += 0.2;
        if (context.previousQuestions && context.previousQuestions.length > 2) complexity += 0.1;
        
        return Math.min(complexity, 1.0);
    }

    // System 1 handlers
    _getBestWeapon() {
        return {
            answer: "The best weapons are S-tier: Oracle Staff, Griffin Claws, and Dragoon Crossbow. Choose based on your character and playstyle.",
            confidence: 0.9,
            reasoning: 'S-tier weapon recommendation'
        };
    }

    _getBestCharacter() {
        return {
            answer: "For PvP: Dragoon (mobility), Oracle (damage), Griffin (balanced). For PvE: Any S-tier character works well.",
            confidence: 0.9,
            reasoning: 'Character tier recommendations'
        };
    }

    _getPvPAdvice() {
        return {
            answer: "Focus on high damage, mobility, and critical hit chance. Use S-tier weapons and characters optimized for PvP.",
            confidence: 0.8,
            reasoning: 'PvP strategy basics'
        };
    }

    _getArenaAdvice() {
        return {
            answer: "Peak Arena requires 3 different characters with different builds. Focus on damage and mobility for each character.",
            confidence: 0.8,
            reasoning: 'Arena requirements'
        };
    }

    _getGuildRequirements() {
        return {
            answer: "XYIAN Guild requirements: 2 daily boss battles, daily donations, active participation. Guild ID: 213797",
            confidence: 1.0,
            reasoning: 'Guild requirements'
        };
    }

    _getMixedGearInfo() {
        return {
            answer: "Mixed gear sets combine different pieces for individual bonuses instead of full set bonuses. Good for optimization when you don't have complete sets.",
            confidence: 0.8,
            reasoning: 'Mixed gear explanation'
        };
    }

    // Cache management
    _getCacheKey(message, context) {
        return `${message}_${JSON.stringify(context)}`;
    }

    // Clear cache
    clearCache() {
        this.system1Cache.clear();
    }

    // Get cache stats
    getCacheStats() {
        return {
            size: this.system1Cache.size,
            hitRate: this._cacheHits / (this._cacheHits + this._cacheMisses) || 0
        };
    }
}

module.exports = DualProcessReasoning;
