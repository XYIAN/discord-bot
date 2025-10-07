const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

class AdvancedRAGSystem {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.knowledgeBase = [];
        this.embeddings = [];
        this.vectorDB = new Map(); // Simple in-memory vector DB
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing Advanced RAG System...');
        await this.loadKnowledgeBase();
        await this.createEmbeddings();
        console.log(`✅ RAG System ready with ${this.knowledgeBase.length} entries`);
    }

    async loadKnowledgeBase() {
        try {
            // Load cleaned real facts
            const cleanedFactsFile = path.join(__dirname, 'data', 'cleaned-real-facts.json');
            if (fs.existsSync(cleanedFactsFile)) {
                const data = JSON.parse(fs.readFileSync(cleanedFactsFile, 'utf8'));
                
                // Flatten and structure the data
                Object.entries(data).forEach(([category, facts]) => {
                    Object.entries(facts).forEach(([key, content]) => {
                        this.knowledgeBase.push({
                            id: `${category}_${key}`,
                            category: category,
                            title: key.replace(/_/g, ' ').toUpperCase(),
                            content: content,
                            keywords: this.extractKeywords(content)
                        });
                    });
                });
                console.log(`📚 Loaded ${this.knowledgeBase.length} knowledge entries`);
            } else {
                console.log('⚠️ No knowledge database found');
            }
        } catch (error) {
            console.error('❌ Failed to load knowledge base:', error.message);
        }
    }

    extractKeywords(text) {
        // Extract important keywords for better matching
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'will', 'your', 'when', 'what', 'where', 'which', 'there', 'their', 'them', 'then', 'than'].includes(word));
        
        return [...new Set(words)]; // Remove duplicates
    }

    async createEmbeddings() {
        console.log('🔄 Creating embeddings for knowledge base...');
        
        for (let i = 0; i < this.knowledgeBase.length; i++) {
            const entry = this.knowledgeBase[i];
            try {
                // Create embedding for the content
                const response = await this.openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: `${entry.title}: ${entry.content}`,
                });
                
                const embedding = response.data[0].embedding;
                this.vectorDB.set(entry.id, {
                    ...entry,
                    embedding: embedding
                });
                
                // Progress indicator
                if (i % 10 === 0) {
                    console.log(`📊 Processed ${i + 1}/${this.knowledgeBase.length} entries`);
                }
            } catch (error) {
                console.error(`❌ Failed to create embedding for ${entry.id}:`, error.message);
            }
        }
        
        console.log(`✅ Created ${this.vectorDB.size} embeddings`);
    }

    cosineSimilarity(vecA, vecB) {
        // Calculate cosine similarity between two vectors
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async searchRelevantKnowledge(query, limit = 3) {
        try {
            // Create embedding for the query
            const queryResponse = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: query,
            });
            
            const queryEmbedding = queryResponse.data[0].embedding;
            
            // Calculate similarities
            const similarities = [];
            for (const [id, entry] of this.vectorDB) {
                const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
                similarities.push({
                    ...entry,
                    similarity: similarity
                });
            }
            
            // Sort by similarity and return top results
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .filter(item => item.similarity > 0.7); // Only return highly relevant results
            
        } catch (error) {
            console.error('❌ Search error:', error.message);
            return [];
        }
    }

    async generateResponse(query, username = 'User') {
        try {
            console.log(`🔍 Searching for: "${query}"`);
            
            // Search for relevant knowledge
            const relevantEntries = await this.searchRelevantKnowledge(query, 3);
            
            if (relevantEntries.length === 0) {
                return `Hey ${username}! I don't have specific information about that in my knowledge base. Try asking about weapons, gear sets, characters, PvP strategies, or guild requirements!`;
            }
            
            // Build context from relevant entries
            let context = "Based on my comprehensive Archero 2 knowledge base:\n\n";
            relevantEntries.forEach((entry, index) => {
                context += `**${entry.title}:**\n${entry.content}\n\n`;
            });
            
            // Generate response using OpenAI with context
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are XY Elder, the trusted henchman and guild elder of XYIAN OFFICIAL. You serve under Grand Master XYIAN and help guild members dominate the leaderboards. Use the provided knowledge base context to give accurate, helpful answers about Archero 2. Be enthusiastic about XYIAN's quest for #1 leaderboard dominance.`
                    },
                    {
                        role: "user",
                        content: `Context: ${context}\n\nQuestion: ${query}`
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            });
            
            const aiResponse = response.choices[0].message.content;
            
            // Add confidence indicator
            const confidence = relevantEntries[0].similarity;
            const confidenceText = confidence > 0.9 ? "🎯 High confidence" : 
                                 confidence > 0.8 ? "✅ Good match" : "🔍 Relevant info";
            
            return `${aiResponse}\n\n${confidenceText} | Found ${relevantEntries.length} relevant entries`;
            
        } catch (error) {
            console.error('❌ RAG generation error:', error.message);
            return `Hey ${username}! I'm having trouble accessing my knowledge base right now. Try asking about weapons, gear sets, or PvP strategies!`;
        }
    }

    // Get system stats
    getStats() {
        return {
            totalEntries: this.knowledgeBase.length,
            embeddedEntries: this.vectorDB.size,
            categories: [...new Set(this.knowledgeBase.map(entry => entry.category))],
            avgKeywords: this.knowledgeBase.reduce((sum, entry) => sum + entry.keywords.length, 0) / this.knowledgeBase.length
        };
    }
}

module.exports = AdvancedRAGSystem;

// Test the system
if (require.main === module) {
    console.log('🧪 Testing Advanced RAG System...');
    
    const testRAG = new AdvancedRAGSystem();
    
    // Wait for initialization, then test
    setTimeout(async () => {
        const testQueries = [
            "What are the best weapons for PvP?",
            "How do mixed gear sets work?",
            "Tell me about Peak Arena strategy",
            "What are XYIAN guild requirements?",
            "Which characters are best for arena?"
        ];
        
        for (const query of testQueries) {
            console.log(`\n🔍 Testing: "${query}"`);
            const response = await testRAG.generateResponse(query, 'TestUser');
            console.log(`✅ Response: ${response.substring(0, 200)}...`);
        }
        
        console.log('\n📊 System Stats:', testRAG.getStats());
    }, 5000); // Wait 5 seconds for initialization
}
