const fs = require('fs');
const path = require('path');

class ImprovedRAGSystem {
    constructor() {
        this.knowledgeBase = [];
        this.initialize();
    }

    initialize() {
        console.log('🚀 Initializing Improved RAG System...');
        this.loadKnowledgeBase();
        console.log(`✅ Improved RAG System ready with ${this.knowledgeBase.length} entries`);
    }

    loadKnowledgeBase() {
        try {
            // Load real archero2 facts (cleaner data)
            const realFactsFile = path.join(__dirname, 'data', 'real-archero2-facts.json');
            if (fs.existsSync(realFactsFile)) {
                const data = JSON.parse(fs.readFileSync(realFactsFile, 'utf8'));
                
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
                console.log(`📚 Loaded ${this.knowledgeBase.length} knowledge entries from real-archero2-facts.json`);
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

    searchRelevantKnowledge(query, limit = 3) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        
        const scoredEntries = this.knowledgeBase.map(entry => {
            let score = 0;
            
            // Title matching (highest weight)
            const titleLower = entry.title.toLowerCase();
            queryWords.forEach(word => {
                if (titleLower.includes(word)) score += 10;
            });
            
            // Content matching
            const contentLower = entry.content.toLowerCase();
            queryWords.forEach(word => {
                if (contentLower.includes(word)) score += 5;
            });
            
            // Keyword matching
            entry.keywords.forEach(keyword => {
                queryWords.forEach(word => {
                    if (keyword.includes(word) || word.includes(keyword)) score += 3;
                });
            });
            
            // Category matching
            const categoryLower = entry.category.toLowerCase();
            queryWords.forEach(word => {
                if (categoryLower.includes(word)) score += 2;
            });
            
            return { ...entry, score };
        });
        
        // Sort by score and return top results
        return scoredEntries
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .filter(entry => entry.score > 0);
    }

    generateResponse(query, username = 'User') {
        console.log(`🔍 Searching for: "${query}"`);
        
        // Search for relevant knowledge
        const relevantEntries = this.searchRelevantKnowledge(query, 3);
        
        if (relevantEntries.length === 0) {
            return `Hey ${username}! I don't have specific information about that in my knowledge base. Try asking about weapons, gear sets, characters, PvP strategies, or guild requirements!`;
        }
        
        // Build response from best matches
        const bestMatch = relevantEntries[0];
        const confidence = bestMatch.score > 20 ? "🎯 High confidence" : 
                          bestMatch.score > 10 ? "✅ Good match" : "🔍 Relevant info";
        
        // Create a better title from the category and key
        const categoryName = bestMatch.category.charAt(0).toUpperCase() + bestMatch.category.slice(1);
        const cleanTitle = bestMatch.title.replace(/cleaned-knowledge-database_entries_/gi, '').replace(/_/g, ' ');
        
        let response = `Hey ${username}! **${categoryName} - ${cleanTitle}:**\n\n${bestMatch.content}`;
        
        // Add related information if available
        if (relevantEntries.length > 1) {
            response += "\n\n**Related Information:**\n";
            relevantEntries.slice(1, 3).forEach(entry => {
                const relatedTitle = entry.title.replace(/cleaned-knowledge-database_entries_/gi, '').replace(/_/g, ' ');
                response += `• **${relatedTitle}:** ${entry.content.substring(0, 150)}...\n`;
            });
        }
        
        response += `\n\n${confidence} | Found ${relevantEntries.length} relevant entries from my comprehensive Archero 2 knowledge base!`;
        
        return response;
    }

    // Get system stats
    getStats() {
        return {
            totalEntries: this.knowledgeBase.length,
            categories: [...new Set(this.knowledgeBase.map(entry => entry.category))],
            avgKeywords: this.knowledgeBase.reduce((sum, entry) => sum + entry.keywords.length, 0) / this.knowledgeBase.length
        };
    }
}

module.exports = ImprovedRAGSystem;

// Test the system
if (require.main === module) {
    console.log('🧪 Testing Improved RAG System...');
    
    const testRAG = new ImprovedRAGSystem();
    
    const testQueries = [
        "What are the best weapons for PvP?",
        "How do mixed gear sets work?",
        "Tell me about Peak Arena strategy",
        "What are XYIAN guild requirements?",
        "Which characters are best for arena?"
    ];
    
    testQueries.forEach(query => {
        console.log(`\n🔍 Testing: "${query}"`);
        const response = testRAG.generateResponse(query, 'TestUser');
        console.log(`✅ Response: ${response.substring(0, 200)}...`);
    });
    
    console.log('\n📊 System Stats:', testRAG.getStats());
}
