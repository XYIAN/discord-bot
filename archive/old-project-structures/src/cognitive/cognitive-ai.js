/**
 * Cognitive AI System
 * Main interface that integrates knowledge graph, dual process reasoning, and memory
 */

const KnowledgeGraph = require('./knowledge-graph');
const DualProcessReasoning = require('./dual-process-reasoning');
const DataLoader = require('./data-loader');

class CognitiveAI {
    constructor() {
        this.knowledgeGraph = new KnowledgeGraph();
        this.reasoning = null;
        this.dataLoader = new DataLoader();
        this.isInitialized = false;
        this.conversationMemory = new Map();
        this.userPreferences = new Map();
    }

    // Initialize the cognitive AI system
    async initialize() {
        if (this.isInitialized) return;

        console.log('🧠 Initializing Cognitive AI System...');
        
        try {
            // Load data into knowledge graph
            this.knowledgeGraph = await this.dataLoader.loadAllData();
            
            // Initialize dual process reasoning
            this.reasoning = new DualProcessReasoning(this.knowledgeGraph);
            
            // Load saved knowledge graph if available
            await this.dataLoader.loadKnowledgeGraph('./data/knowledge-graph.json');
            
            this.isInitialized = true;
            console.log('✅ Cognitive AI System initialized successfully');
            
            // Log stats
            const stats = this.knowledgeGraph.getStats();
            console.log(`📊 Knowledge Graph: ${stats.entities} entities, ${stats.relationships} relationships, ${stats.categories} categories`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Cognitive AI System:', error);
            throw error;
        }
    }

    // Main reasoning interface
    async reason(message, context = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Add user context
        const enhancedContext = {
            ...context,
            userLevel: this._getUserLevel(context.userId),
            previousQuestions: this._getPreviousQuestions(context.userId),
            preferences: this._getUserPreferences(context.userId)
        };

        // Get reasoning result
        const result = await this.reasoning.reason(message, enhancedContext);
        
        // Store in conversation memory
        this._storeConversation(context.userId, message, result);
        
        // Update user preferences based on interaction
        this._updateUserPreferences(context.userId, message, result);
        
        return result;
    }

    // Get user level based on interaction history
    _getUserLevel(userId) {
        if (!userId) return 'beginner';
        
        const history = this.conversationMemory.get(userId) || [];
        const questionCount = history.length;
        
        if (questionCount < 5) return 'beginner';
        if (questionCount < 20) return 'intermediate';
        return 'expert';
    }

    // Get previous questions for context
    _getPreviousQuestions(userId) {
        if (!userId) return [];
        
        const history = this.conversationMemory.get(userId) || [];
        return history.slice(-3).map(entry => entry.question);
    }

    // Get user preferences
    _getUserPreferences(userId) {
        if (!userId) return {};
        
        return this.userPreferences.get(userId) || {};
    }

    // Store conversation in memory
    _storeConversation(userId, question, result) {
        if (!userId) return;
        
        if (!this.conversationMemory.has(userId)) {
            this.conversationMemory.set(userId, []);
        }
        
        const history = this.conversationMemory.get(userId);
        history.push({
            question,
            answer: result.answer,
            timestamp: new Date().toISOString(),
            reasoning: result.reasoning,
            confidence: result.confidence
        });
        
        // Keep only last 10 conversations
        if (history.length > 10) {
            history.shift();
        }
    }

    // Update user preferences based on interaction
    _updateUserPreferences(userId, question, result) {
        if (!userId) return;
        
        const preferences = this.userPreferences.get(userId) || {};
        
        // Analyze question for preferences
        const questionLower = question.toLowerCase();
        
        if (questionLower.includes('pvp') || questionLower.includes('arena')) {
            preferences.interests = preferences.interests || [];
            if (!preferences.interests.includes('pvp')) {
                preferences.interests.push('pvp');
            }
        }
        
        if (questionLower.includes('build') || questionLower.includes('optimize')) {
            preferences.interests = preferences.interests || [];
            if (!preferences.interests.includes('optimization')) {
                preferences.interests.push('optimization');
            }
        }
        
        if (questionLower.includes('dragoon') || questionLower.includes('oracle')) {
            preferences.favoriteCharacters = preferences.favoriteCharacters || [];
            if (questionLower.includes('dragoon') && !preferences.favoriteCharacters.includes('dragoon')) {
                preferences.favoriteCharacters.push('dragoon');
            }
            if (questionLower.includes('oracle') && !preferences.favoriteCharacters.includes('oracle')) {
                preferences.favoriteCharacters.push('oracle');
            }
        }
        
        this.userPreferences.set(userId, preferences);
    }

    // Get conversation history for a user
    getConversationHistory(userId) {
        return this.conversationMemory.get(userId) || [];
    }

    // Clear conversation history for a user
    clearConversationHistory(userId) {
        this.conversationMemory.delete(userId);
    }

    // Get user preferences
    getUserPreferences(userId) {
        return this.userPreferences.get(userId) || {};
    }

    // Search knowledge base
    searchKnowledge(query, options = {}) {
        return this.knowledgeGraph.findEntities(query, options);
    }

    // Get related information
    getRelatedInfo(entityId, relationshipType = null) {
        return this.knowledgeGraph.findRelated(entityId, relationshipType);
    }

    // Get system statistics
    getStats() {
        return {
            knowledgeGraph: this.knowledgeGraph.getStats(),
            reasoning: this.reasoning ? this.reasoning.getCacheStats() : null,
            conversations: this.conversationMemory.size,
            users: this.userPreferences.size,
            initialized: this.isInitialized
        };
    }

    // Save knowledge graph
    async saveKnowledgeGraph() {
        if (this.dataLoader) {
            await this.dataLoader.saveKnowledgeGraph('./data/knowledge-graph.json');
        }
    }

    // Test the system
    async test() {
        console.log('🧪 Testing Cognitive AI System...');
        
        const testQuestions = [
            "What is your name?",
            "What's the best weapon for PvP?",
            "How do mixed gear sets work?",
            "What are the XYIAN guild requirements?",
            "Explain Dragoon's abilities and best builds"
        ];
        
        for (const question of testQuestions) {
            console.log(`\n❓ Testing: "${question}"`);
            try {
                const result = await this.reason(question, { userId: 'test_user' });
                console.log(`✅ Answer: ${result.answer.substring(0, 100)}...`);
                console.log(`   Reasoning: ${result.reasoning?.system || 'Unknown'}`);
                console.log(`   Confidence: ${result.confidence || 0}`);
            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
            }
        }
        
        console.log('\n📊 System Stats:', this.getStats());
    }
}

module.exports = CognitiveAI;
