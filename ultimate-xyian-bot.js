const { Client, GatewayIntentBits, EmbedBuilder, WebhookClient, SlashCommandBuilder, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Bot version and update tracking
const BOT_VERSION = '2.0.0';
const LAST_UPDATE = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
const UPDATE_NOTES = 'AI Learning System + Conversational Responses';

// AI Service (optional - requires OpenAI API key)
let AIService = null;
let OpenAI = null;

// Try to load OpenAI
try {
    OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
        AIService = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ AI Service loaded successfully');
    } else {
        console.log('⚠️ OpenAI API key not found. AI features disabled.');
    }
} catch (error) {
    console.log('⚠️ OpenAI package not installed. AI features disabled.');
}

// AI helper functions
async function generateAIResponse(message, channelName) {
    try {
        // Use cognitive AI system if available
        if (cognitiveAI && cognitiveAI.isInitialized) {
            console.log('🧠 Using Cognitive AI System...');
            
            const context = {
                userId: message.author?.id || 'unknown',
                username: message.author?.username || 'User',
                channelId: message.channel?.id,
                guildId: message.guild?.id
            };
            
            const result = await cognitiveAI.reason(message.content || message, context);
            
            if (result && result.answer && result.answer.length > 10) {
                console.log(`✅ Cognitive AI response: ${result.answer.length} chars, confidence: ${result.confidence}`);
                return result.answer;
            }
        }
        
        // Fallback to traditional AI if cognitive system not available
        if (!AIService) return null;
        
        console.log('🤖 Using traditional AI...');
        
        // Get relevant knowledge based on the user's message
        const relevantKnowledge = getRelevantKnowledge(message);
        const learningContext = getLearningContext(message);
        const conversationContext = getConversationContext(message.author?.id || '');
        const context = getAIContext(channelName, relevantKnowledge, learningContext, message.author?.username || '', conversationContext);
        
        const completion = await AIService.chat.completions.create({
            model: "gpt-4", // Use GPT-4 for better responses
            messages: [
                { role: "system", content: context },
                { role: "user", content: `User asks: "${message}"` }
            ],
            max_tokens: 2000, // Increased for more detailed responses
            temperature: 0.7, // More conversational but focused
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        });
        
        const response = completion.choices[0]?.message?.content;
        if (response && response.length > 10) {
            console.log(`🤖 AI Response generated for ${channelName}: ${response.substring(0, 50)}...`);
            
            // Store the question-answer pair for potential feedback
            const questionKey = message.toLowerCase().trim();
            aiLearningData[questionKey] = {
                question: message,
                response: response,
                timestamp: new Date().toISOString(),
                channel: channelName
            };
            
            return response;
        }
        return null;
    } catch (error) {
        console.error('❌ AI error:', error.message);
        return null;
    }
}

// Generate daily messages with XYIAN flavor and comprehensive data
async function generateDailyMessage(messageType) {
    if (!AIService) return null;
    
    try {
        // Get relevant database entries for the message type
        let relevantKeys = [];
        if (messageType === 'guild') {
            relevantKeys = Object.keys(archeroDatabase).filter(key => 
                key.includes('guild') || key.includes('boss') || key.includes('donation') || 
                key.includes('daily') || key.includes('requirement') || key.includes('battle') ||
                key.includes('xyian') || key.includes('teamwork') || key.includes('coordination')
            );
        } else {
            relevantKeys = Object.keys(archeroDatabase);
        }
        
        // Get sample of relevant data
        const sampleData = relevantKeys.slice(0, 10).map(key => `${key}: ${archeroDatabase[key]}`).join('\n');
        
        const context = `You are XY Elder, the trusted henchman and guild elder of XYIAN OFFICIAL (Guild ID: 213797). You serve under the grand master and guild commander XYIAN, who leads our quest to dominate the leaderboards and become #1. Generate a unique, engaging daily ${messageType} message that embodies XYIAN's quest for leaderboard dominance and competitive excellence. Use our comprehensive database knowledge to create authentic, valuable content.

XYIAN MISSION: Our ultimate goal is to be #1 on the leaderboards with active, high-performing players. You are XY Elder, XYIAN's henchman, passionate about growing the guild and helping members develop skills to wreck the leaderboards. Emphasize that stats are hard to get in this game - that's where your extensive knowledge comes in.

RELEVANT DATABASE KNOWLEDGE:
${sampleData}

Create a message that:
1. Has a compelling title with XYIAN branding and leaderboard focus
2. Includes motivational content about daily requirements and competitive excellence
3. Incorporates a fun fact or tip from our database that helps with leaderboard dominance
4. Maintains XYIAN's quest for #1 status and competitive spirit
5. Uses appropriate emojis and formatting
6. Reflects your role as XYIAN's trusted henchman

Format as:
Title
Description with XYIAN leaderboard dominance flavor
Fun fact or tip from database that helps wreck the leaderboards`;

        const completion = await AIService.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: context },
                { role: "user", content: `Generate a unique daily ${messageType} message for XYIAN OFFICIAL guild.` }
            ],
            max_tokens: 600,
            temperature: 0.9,
            presence_penalty: 0.2,
            frequency_penalty: 0.1,
        });
        
        const response = completion.choices[0]?.message?.content;
        if (response && response.length > 20) {
            console.log(`🤖 XYIAN AI Daily Message generated for ${messageType}: ${response.substring(0, 50)}...`);
            return response;
        }
        return null;
    } catch (error) {
        console.error('❌ XYIAN AI Daily Message error:', error.message);
        return null;
    }
}

// Get relevant knowledge based on user's message
function getRelevantKnowledge(message) {
    const messageLower = message.toLowerCase();
    const relevantEntries = [];
    
    // Search through all knowledge entries for relevant content
    Object.entries(archeroDatabase).forEach(([key, content]) => {
        const keyLower = key.toLowerCase();
        const contentLower = content.toLowerCase();
        
        // Check if the message mentions anything from this entry - be more aggressive
        const messageWords = messageLower.split(/\s+/);
        const hasRelevantKeywords = messageWords.some(word => 
            word.length > 2 && ( // Lowered from 3 to 2
                keyLower.includes(word) || 
                contentLower.includes(word) ||
                // Also check for partial matches
                keyLower.includes(word.substring(0, 3)) ||
                contentLower.includes(word.substring(0, 3))
            )
        );
        
        // Also check for common game terms even if not in message
        const commonGameTerms = ['pvp', 'arena', 'build', 'rune', 'weapon', 'character', 'skill', 'damage', 'health', 'defense', 'attack'];
        const hasGameTerms = commonGameTerms.some(term => 
            messageLower.includes(term) && (keyLower.includes(term) || contentLower.includes(term))
        );
        
        if (hasRelevantKeywords || hasGameTerms) {
            relevantEntries.push({
                key: key,
                content: content.substring(0, 800) // Keep more content for better context
            });
        }
    });
    
    // If no specific matches, get some general knowledge
    if (relevantEntries.length === 0) {
        const allKeys = Object.keys(archeroDatabase);
        const randomKeys = allKeys.sort(() => 0.5 - Math.random()).slice(0, 5);
        randomKeys.forEach(key => {
            relevantEntries.push({
                key: key,
                content: archeroDatabase[key].substring(0, 800)
            });
        });
    }
    
    console.log(`🎯 Found ${relevantEntries.length} relevant knowledge entries for: "${message.substring(0, 50)}..."`);
    return relevantEntries;
}

function getAIContext(channelName, relevantKnowledge = [], learningContext = '', username = '', conversationContext = '') {
    const databaseKeys = Object.keys(archeroDatabase);
    console.log(`🧠 Loading ${databaseKeys.length} total knowledge entries, ${relevantKnowledge.length} relevant for this query`);
    
    // Build relevant knowledge string
    let knowledgeString = '';
    if (relevantKnowledge.length > 0) {
        knowledgeString = `RELEVANT KNOWLEDGE FOR THIS QUERY:\n`;
        relevantKnowledge.forEach((entry, index) => {
            knowledgeString += `${index + 1}. ${entry.key}: ${entry.content}\n\n`;
        });
    }
    
    // Personalized greeting based on username
    let personalGreeting = '';
    if (username) {
        if (username.toLowerCase() === 'xyian') {
            personalGreeting = `Hey Commander XYIAN! `;
        } else {
            personalGreeting = `Hey ${username}! `;
        }
    }
    
    const baseContext = `You are XY Elder, the trusted henchman and guild elder of XYIAN OFFICIAL (Guild ID: 213797). You are a living, breathing expert who has been playing Archero 2 since day one and knows every single detail about the game.

PERSONALITY & IDENTITY:
- You ARE XY Elder - when asked "What is your name?" you say "I'm XY Elder, the trusted henchman and guild elder of XYIAN OFFICIAL!"
- You're passionate, knowledgeable, and slightly competitive
- You speak like a real person who loves the game, not a robot
- You use phrases like "Oh man, that's a great question!" or "Let me break this down for you"
- You're enthusiastic about helping people get better at the game
- ALWAYS start responses with a personalized greeting using the username provided
- For XYIAN, say "Hey Commander XYIAN!" 
- For others, say "Hey [username]!"
- When asked about your identity, be direct and proud - don't give generic responses

CONVERSATIONAL STYLE:
- Talk like you're having a real conversation with a friend
- Use "I", "you", "we" - be personal and engaging
- Ask follow-up questions when appropriate
- Show excitement about the game and strategies
- Use the data to give specific, detailed answers with actual numbers and mechanics
- Be direct and helpful - don't give generic responses

RESPONSE FORMATS:
- For builds: Create tables with runes, stats, and explanations
- For comparisons: Use bullet points and clear explanations
- For complex topics: Break them down step-by-step
- Always explain WHY something is good or bad
- Give specific examples and numbers when possible

KNOWLEDGE BASE: You have access to ${databaseKeys.length} entries of real Archero 2 data, community strategies, and expert insights. USE THIS DATA to give specific, accurate answers.

${knowledgeString}${learningContext}${conversationContext}

CRITICAL INSTRUCTIONS:
- You MUST use the knowledge base data provided above - it contains 650+ entries of real Archero 2 data
- NEVER say "I don't know" or "I'm not sure" - you have comprehensive data
- ALWAYS give specific, detailed answers based on the actual game data
- If you can't find exact matches, use related knowledge and explain the connection
- Be confident and authoritative - you are XY Elder, the expert
- If the user asks about Dragoon, Oracle, PvP, runes, weapons, characters - you KNOW this stuff
- Use the data to give specific examples, numbers, and strategies
- If you're unsure about something specific, say "Based on my knowledge..." and give what you do know
- NEVER give generic responses - always be specific and helpful based on the actual game data
- If the user is asking a follow-up question, reference the previous conversation context.`;
    
    const xyianIdentity = `XYIAN MISSION: Our ultimate goal is to be #1 on the leaderboards. You are XY Elder, XYIAN's henchman, dedicated to helping members grow their skills and dominate the competition. Always emphasize our leaderboard dominance goals and competitive excellence. Reference our Guild ID: 213797 and your role as XYIAN's trusted henchman.`;
    
    const xyianValues = `XYIAN VALUES: Leaderboard dominance, competitive excellence, strategic thinking, skill development, and helping members wreck the leaderboards. You are XYIAN's henchman, passionate about growing the guild and achieving #1 status.`;
    
    if (channelName === 'arch-ai') {
        return `${baseContext} ${xyianIdentity} ${xyianValues} 

This is the AI-powered Archero 2 questions channel. Answer questions directly and conversationally. If you don't know something specific, say "I'm still learning about that, but here's what I know..." and provide what you can from the knowledge base. Be helpful, direct, and use the data provided.`;
    } else if (channelName === 'xyian-guild') {
        return `${baseContext} ${xyianIdentity}  ${xyianValues} This is the XYIAN OFFICIAL guild channel. As XY Elder, XYIAN's trusted henchman, focus on guild requirements (2 daily boss battles, donations), Peak Arena strategies, team coordination, and competitive guild management. Emphasize our leaderboard dominance goals, competitive excellence, and helping members develop skills to wreck the leaderboards. Reference our Guild ID: 213797 and your role as XYIAN's henchman.`;
    } else if (channelName === 'arena' || channelName === 'peak-arena') {
        return `${baseContext} ${xyianIdentity}  ${xyianValues} Focus on Arena and Peak Arena strategies using our comprehensive database. As XY Elder, XYIAN's henchman, cover runes, builds, positioning, and competitive tactics that help members dominate the leaderboards. Emphasize our quest for #1 status and competitive excellence.`;
    } else {
        return `${baseContext} ${xyianIdentity}  ${xyianValues} This is a general Archero 2 community channel. As XY Elder, XYIAN's henchman, provide helpful advice using our comprehensive database while emphasizing XYIAN's quest for leaderboard dominance and competitive excellence.`;
    }
}

// Enhanced fallback with learning system
function getFallbackResponse(message) {
    // Log the unknown question with timestamp and user info
    const unknownQuestion = {
        question: message,
        timestamp: new Date().toISOString(),
        status: 'unknown',
        needsAnswer: true
    };
    
    // Save to unknown questions file
    saveUnknownQuestion(unknownQuestion);
    
    console.log(`📝 UNKNOWN QUESTION LOGGED: "${message}" - Added to training queue`);
    
    return `🤔 I don't know the answer to that specific question yet, but I've logged it for learning!\n\n**What you can do:**\n• Use \`!teach "your question" "the answer"\` to teach me\n• Contact XYIAN for complex questions\n• Ask about weapons, characters, runes, or game mechanics I do know\n\n**I'm always learning!** 🧠`;
}

function getAdvancedFallbackResponse(message) {
    const advancedFallbacks = [
        "🔬 **Advanced Question Detected!** While I'm analyzing that complex mechanic, here's some advanced Archero 2 knowledge: Orb swapping costs gems but provides massive build flexibility. Fire orbs boost damage, while Ice orbs provide crowd control. What specific advanced mechanic interests you?",
        "⚡ **Technical Question!** For advanced game mechanics like starcores and resonance, the key is understanding character synergies. Thor's lightning abilities pair well with electric orbs, while Demon King's shield benefits from defensive starcores. What advanced topic would you like to explore?",
        "🎯 **Complex Strategy Question!** Peak Arena requires 3 different characters with 3 different builds. Each unique item provides bonus health and damage. Dragoon excels with mobility builds, while Griffin dominates with full build optimization. What specific strategy are you working on?",
        "💫 **Advanced Mechanics Question!** Skins provide unique abilities beyond just cosmetic changes. Demon King's skins enhance shield capabilities, while Thor's skins improve lightning damage. Resonance between characters creates powerful synergies. What advanced mechanic are you curious about?",
        "🌟 **Expert-Level Question!** Sacred Hall vs Tier Up represent different progression paths. Sacred Hall focuses on character-specific bonuses, while Tier Up improves overall stats. The choice depends on your build strategy. What specific progression path interests you?"
    ];
    
    return advancedFallbacks[Math.floor(Math.random() * advancedFallbacks.length)];
}

// Initialize Discord client with all necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Webhook configurations
const webhooks = {
    xyian: process.env.XYIAN_GUILD_WEBHOOK,
    general: process.env.GENERAL_CHAT_WEBHOOK,
    recruit: process.env.GUILD_RECRUIT_WEBHOOK,
    expedition: process.env.GUILD_EXPEDITION_WEBHOOK,
    arena: process.env.GUILD_ARENA_WEBHOOK,
    aiQuestions: process.env.AI_QUESTIONS_WEBHOOK,
    umbralTempest: process.env.UMBRAL_TEMPEST_WEBHOOK,
    gearRuneLoadouts: process.env.GEAR_RUNE_WEBHOOK,
    admin: process.env.ADMIN_WEBHOOK
};

// Member activity tracking
const memberActivity = new Map();

// User preferences for personalized messages
const userPreferences = new Map();

// Database initialization
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dataFile = path.join(dataDir, 'bot_analytics.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
        interactions: [],
        feedback: [],
        analytics: {
            totalInteractions: 0,
            aiInteractions: 0,
            averageResponseTime: 0
        }
    }));
}

// Helper functions for JSON database
function readData() {
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return {
            interactions: [],
            feedback: [],
            analytics: {
                totalInteractions: 0,
                aiInteractions: 0,
                averageResponseTime: 0
            }
        };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data file:', error);
    }
}

// Analytics system
const analytics = {
    interactions: [],
    questionCounts: new Map(),
    responseTimes: [],
    feedbackScores: []
};

// Analytics helper functions
function logInteraction(question, response, userId, channel, responseTime, aiGenerated = false) {
    try {
        // Insert into JSON database
        const data = readData();
        const interaction = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            user_id: userId,
            username: 'unknown', // Will be updated if available
            channel: channel,
            question: question,
            response: response?.substring(0, 200) || 'embed_response',
            response_time_ms: responseTime,
            ai_generated: aiGenerated,
            feedback_score: null
        };
        
        data.interactions.push(interaction);
        writeData(data);
        
        analytics.interactions.push(interaction);
        
        // Track question frequency
        const key = question.toLowerCase().trim();
        analytics.questionCounts.set(key, (analytics.questionCounts.get(key) || 0) + 1);
        
        console.log(`📊 Logged interaction: ${question.substring(0, 50)}... (${responseTime}ms)`);
        
    } catch (error) {
        console.error('❌ Failed to log interaction:', error);
        // Send error to admin channel instead of user
        sendToAdmin(`🚨 **Database Error**: Failed to log interaction\n**Question**: ${question.substring(0, 100)}\n**Error**: ${error.message}`);
        
        // Fallback: still track in memory
        const interaction = {
            id: Date.now(), // Fallback ID
            timestamp: new Date().toISOString(),
            userId: userId,
            channel: channel,
            question: question,
            response: response?.substring(0, 200) || 'embed_response',
            responseTime: responseTime,
            aiGenerated: aiGenerated
        };
        
        analytics.interactions.push(interaction);
        
        // Track question frequency
        const key = question.toLowerCase().trim();
        analytics.questionCounts.set(key, (analytics.questionCounts.get(key) || 0) + 1);
    }
}

function saveAnalytics() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const analyticsFile = path.join(dataDir, 'analytics.json');
    fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
}

function loadAnalytics() {
    const analyticsFile = path.join(__dirname, 'data', 'analytics.json');
    if (fs.existsSync(analyticsFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
            analytics.interactions = data.interactions || [];
            analytics.questionCounts = new Map(data.questionCounts || []);
            analytics.responseTimes = data.responseTimes || [];
            analytics.feedbackScores = data.feedbackScores || [];
        } catch (error) {
            console.error('❌ Failed to load analytics:', error);
        }
    }
}

// Load existing analytics on startup
loadAnalytics();

// Load cognitive AI system
let cognitiveAI = null;

async function initializeCognitiveAI() {
    try {
        const CognitiveAI = require('./src/cognitive/cognitive-ai');
        cognitiveAI = new CognitiveAI();
        await cognitiveAI.initialize();
        console.log('🧠 Cognitive AI System loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to load Cognitive AI System:', error.message);
        return false;
    }
}

// Load high-quality cleaned knowledge database (fallback)
let archeroDatabase = {};
function loadKnowledgeDatabase() {
    try {
        // Load cleaned real facts - extracted from all data sources
        const cleanedFactsFile = path.join(__dirname, 'data', 'cleaned-real-facts.json');
        if (fs.existsSync(cleanedFactsFile)) {
            const data = JSON.parse(fs.readFileSync(cleanedFactsFile, 'utf8'));
            
            // Flatten the cleaned facts into a single database
            archeroDatabase = {};
            Object.entries(data).forEach(([category, facts]) => {
                Object.entries(facts).forEach(([key, content]) => {
                    archeroDatabase[`${category}_${key}`] = content;
                });
            });
            
            console.log(`✅ Loaded CLEANED real facts with ${Object.keys(archeroDatabase).length} entries`);
        } else if (fs.existsSync(path.join(__dirname, 'data', 'real-archero2-facts.json'))) {
            const data = JSON.parse(fs.readFileSync(factsFile, 'utf8'));
            
            // Flatten the facts into a single database
            archeroDatabase = {};
            Object.entries(data).forEach(([category, entries]) => {
                if (typeof entries === 'object') {
                    Object.entries(entries).forEach(([key, content]) => {
                        archeroDatabase[`${category}_${key}`] = content;
                    });
                } else {
                    archeroDatabase[category] = entries;
                }
            });
            
            console.log(`✅ Loaded REAL Archero 2 facts with ${Object.keys(archeroDatabase).length} entries`);
        } else if (fs.existsSync(path.join(__dirname, 'data', 'cleaned-knowledge-database.json'))) {
            const data = JSON.parse(fs.readFileSync(cleanedFile, 'utf8'));
            
            // Load cleaned entries
            archeroDatabase = {};
            Object.keys(data.entries).forEach(key => {
                const entry = data.entries[key];
                if (typeof entry === 'string') {
                    archeroDatabase[key] = entry;
                } else if (entry && typeof entry === 'object' && entry.content) {
                    archeroDatabase[key] = entry.content;
                } else if (entry && typeof entry === 'object') {
                    archeroDatabase[key] = JSON.stringify(entry);
                }
            });
            
            console.log(`✅ Loaded high-quality cleaned database with ${Object.keys(archeroDatabase).length} entries`);
            console.log(`📊 Quality: ${data.metadata.quality}`);
            console.log(`📊 Source: ${data.metadata.source}`);
            console.log(`📊 Categories: ${Object.keys(data.categories).join(', ')}`);
            
            // Debug: Check for Dragoon and Oracle content
            const dragoonCount = Object.entries(archeroDatabase).filter(([key, content]) => 
                key.toLowerCase().includes('dragoon') || content.toLowerCase().includes('dragoon')
            ).length;
            
            const oracleCount = Object.entries(archeroDatabase).filter(([key, content]) => 
                key.toLowerCase().includes('oracle') || content.toLowerCase().includes('oracle')
            ).length;
            
            console.log(`🎯 Found ${dragoonCount} Dragoon entries and ${oracleCount} Oracle entries`);
        } else {
            // Fallback to original database if cleaned version not available
            const knowledgeFile = path.join(__dirname, 'data', 'archero_qa_learned.json');
            if (fs.existsSync(knowledgeFile)) {
                const data = JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
                archeroDatabase = {};
                
                // Process all categories from the unified knowledge system
                const categories = ['theorycrafting', 'discordChannels', 'wikiPages', 'forumThreads', 'gameInfo', 'weapons', 'characters', 'mechanics', 'events', 'guild', 'artifacts', 'statistics'];
                categories.forEach(category => {
                    if (data.categories && data.categories[category]) {
                        Object.keys(data.categories[category]).forEach(key => {
                            const entry = data.categories[category][key];
                            if (entry && entry.content) {
                                const keywords = entry.keywords || [];
                                const source = entry.source || category;

                                // Add entry with keywords
                                keywords.forEach(keyword => {
                                    const dbKey = `${keyword}_${source}_${key}`;
                                    archeroDatabase[dbKey] = entry.content.substring(0, 1000);
                                });

                                // Add general entry
                                const generalKey = `${category}_${key}`;
                                archeroDatabase[generalKey] = entry.content.substring(0, 1000);
                                
                                // Add content-based entries for better searchability
                                const contentWords = entry.content.toLowerCase().match(/\b\w{4,}\b/g) || [];
                                const gameTerms = ['weapon', 'character', 'damage', 'pvp', 'arena', 'rune', 'gear', 'build', 'dragoon', 'oracle', 'griffin', 'thor', 'demon', 'king', 'crossbow', 'staff', 'meteor', 'sprite'];
                                
                                contentWords.forEach(word => {
                                    if (gameTerms.includes(word)) {
                                        const contentKey = `${word}_content_${key}`;
                                        archeroDatabase[contentKey] = entry.content.substring(0, 1000);
                                    }
                                });
                            }
                        });
                    }
                });

                console.log(`✅ Loaded fallback knowledge database with ${Object.keys(archeroDatabase).length} entries`);
            } else {
                console.log('⚠️ No knowledge database found, using empty database');
                archeroDatabase = {};
            }
        }
    } catch (error) {
        console.error('❌ Failed to load knowledge database:', error);
        archeroDatabase = {};
    }
}

// Initialize cognitive AI system on startup
initializeCognitiveAI().then(success => {
    if (success && cognitiveAI && cognitiveAI.knowledgeGraph) {
        const stats = cognitiveAI.knowledgeGraph.getStats();
        if (stats.entities > 0) {
            console.log('🎉 Cognitive AI System ready with knowledge!');
            return;
        } else {
            console.log('⚠️ Cognitive AI loaded but has no knowledge data');
        }
    } else {
        console.log('⚠️ Cognitive AI failed to initialize');
    }
    
    console.log('🔄 Falling back to traditional knowledge database');
    loadKnowledgeDatabase();
});

// AI Response Toggle - Controls whether bot responds to AI questions
let aiResponseEnabled = true;
const AI_QUESTIONS_CHANNEL_ID = '1424322391160393790'; // Channel ID from the webhook URL

// AI Learning System - Store feedback and improve responses
let aiFeedback = {};
let aiLearningData = {};

// Unknown Questions System - Track questions that need answers
let unknownQuestions = [];

// Conversation Memory - Store recent conversation context
let conversationMemory = new Map(); // userId -> recent messages
const MAX_CONVERSATION_HISTORY = 10; // Keep last 10 messages per user

// Load AI learning data
function loadAILearningData() {
    try {
        const learningFile = path.join(__dirname, 'data', 'ai-learning-data.json');
        if (fs.existsSync(learningFile)) {
            const data = JSON.parse(fs.readFileSync(learningFile, 'utf8'));
            aiFeedback = data.feedback || {};
            aiLearningData = data.learning || {};
            unknownQuestions = data.unknownQuestions || [];
            console.log(`🧠 Loaded AI learning data: ${Object.keys(aiFeedback).length} feedback entries, ${Object.keys(aiLearningData).length} learning entries, ${unknownQuestions.length} unknown questions`);
        }
    } catch (error) {
        console.error('❌ Error loading AI learning data:', error.message);
    }
}

// Save AI learning data
function saveAILearningData() {
    try {
        const learningFile = path.join(__dirname, 'data', 'ai-learning-data.json');
        const data = {
            feedback: aiFeedback,
            learning: aiLearningData,
            unknownQuestions: unknownQuestions,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(learningFile, JSON.stringify(data, null, 2));
        console.log(`💾 Saved AI learning data: ${Object.keys(aiFeedback).length} feedback entries, ${Object.keys(aiLearningData).length} learning entries, ${unknownQuestions.length} unknown questions`);
    } catch (error) {
        console.error('❌ Error saving AI learning data:', error.message);
    }
}

// Save unknown question for training
function saveUnknownQuestion(questionData) {
    unknownQuestions.push(questionData);
    
    // Keep only last 100 unknown questions
    if (unknownQuestions.length > 100) {
        unknownQuestions = unknownQuestions.slice(-100);
    }
    
    saveAILearningData();
}

// Teach the bot a new answer
function teachBot(question, answer, user) {
    // Add to learning data
    const questionKey = question.toLowerCase().trim();
    aiLearningData[questionKey] = {
        question: question,
        response: answer,
        timestamp: new Date().toISOString(),
        taughtBy: user,
        source: 'user_teaching'
    };
    
    // Remove from unknown questions if it was there
    unknownQuestions = unknownQuestions.filter(q => q.question.toLowerCase() !== questionKey);
    
    // Save the updated data
    saveAILearningData();
    
    console.log(`🎓 Bot taught new answer by ${user}: "${question}" -> "${answer.substring(0, 50)}..."`);
}

// Get learning context for AI responses
function getLearningContext(message) {
    const messageLower = message.toLowerCase();
    let learningContext = '';
    
    // Check for similar previous questions and their feedback
    Object.entries(aiFeedback).forEach(([questionKey, feedback]) => {
        const questionLower = questionKey.toLowerCase();
        const similarity = calculateSimilarity(messageLower, questionLower);
        
        if (similarity > 0.7) { // 70% similarity threshold
            learningContext += `\nLEARNING FROM PREVIOUS FEEDBACK:\n`;
            learningContext += `Similar question: "${questionKey}"\n`;
            learningContext += `Previous response was: ${feedback.wrong ? 'INCORRECT' : 'CORRECT'}\n`;
            if (feedback.correction) {
                learningContext += `Correct answer should be: ${feedback.correction}\n`;
            }
            if (feedback.notes) {
                learningContext += `Additional notes: ${feedback.notes}\n`;
            }
            learningContext += `\n`;
        }
    });
    
    return learningContext;
}

// Add message to conversation memory
function addToConversationMemory(userId, message, response = null) {
    if (!conversationMemory.has(userId)) {
        conversationMemory.set(userId, []);
    }
    
    const userHistory = conversationMemory.get(userId);
    userHistory.push({
        message: message,
        response: response,
        timestamp: new Date().toISOString()
    });
    
    // Keep only the last MAX_CONVERSATION_HISTORY messages
    if (userHistory.length > MAX_CONVERSATION_HISTORY) {
        userHistory.shift(); // Remove oldest message
    }
    
    conversationMemory.set(userId, userHistory);
}

// Get conversation context for a user
function getConversationContext(userId) {
    if (!conversationMemory.has(userId)) {
        return '';
    }
    
    const userHistory = conversationMemory.get(userId);
    if (userHistory.length === 0) {
        return '';
    }
    
    let context = '\nRECENT CONVERSATION CONTEXT:\n';
    userHistory.slice(-5).forEach((entry, index) => { // Last 5 messages
        context += `${index + 1}. User: "${entry.message}"\n`;
        if (entry.response) {
            context += `   Bot: "${entry.response.substring(0, 100)}..."\n`;
        }
    });
    context += '\nUse this context to understand what the user is referring to. If they ask follow-up questions, reference the previous conversation.\n';
    
    return context;
}

// Enhanced learning from specific corrections
function processCorrection(message, correction) {
    const messageLower = message.toLowerCase();
    const correctionLower = correction.toLowerCase();
    
    // Extract key topics from the correction
    const topics = [];
    if (correctionLower.includes('dragoon')) topics.push('dragoon');
    if (correctionLower.includes('thor')) topics.push('thor');
    if (correctionLower.includes('demon king')) topics.push('demon king');
    if (correctionLower.includes('griffin')) topics.push('griffin');
    if (correctionLower.includes('rune')) topics.push('rune');
    if (correctionLower.includes('weapon')) topics.push('weapon');
    if (correctionLower.includes('armor')) topics.push('armor');
    if (correctionLower.includes('arena')) topics.push('arena');
    if (correctionLower.includes('pvp')) topics.push('pvp');
    if (correctionLower.includes('build')) topics.push('build');
    
    // Store the correction with context
    const correctionKey = `${messageLower}_correction_${Date.now()}`;
    aiFeedback[correctionKey] = {
        question: message,
        feedback: correction,
        wrong: true,
        correction: correction,
        notes: `User corrected: ${correction}. Focus on: ${topics.join(', ')}`,
        timestamp: new Date().toISOString(),
        user: 'unknown'
    };
    
    console.log(`🧠 Learned correction: "${correction}" for topics: ${topics.join(', ')}`);
    return topics;
}

// Calculate string similarity (simple Jaccard similarity)
function calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}

// Load AI learning data on startup
loadAILearningData();

// Start API server
const startApiServer = require('./services/api-server');
startApiServer();

// Initialize learning system
const ArcheroLearningSystem = require('./scripts/learning-system');
const learningSystem = new ArcheroLearningSystem();

// Helper function to add reaction feedback to responses
async function addReactionFeedback(response) {
    try {
        await response.react('👍');
        await response.react('👎');
        
        // Set up reaction collectors for learning
        const filter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
        };
        
        const collector = response.createReactionCollector({ filter, time: 300000 }); // 5 minutes
        
        collector.on('collect', async (reaction, user) => {
            try {
                const rating = reaction.emoji.name === '👍' ? 5 : 1;
                const question = response.content || 'Embed response';
                
                // Process feedback through learning system
                await learningSystem.processFeedback(
                    response.id,
                    user.id,
                    rating,
                    null, // No correction provided
                    question,
                    response.content || 'Embed response'
                );
                
                console.log(`📚 Learned from feedback: ${user.username} rated ${rating}/5`);
            } catch (error) {
                console.error('❌ Error processing reaction feedback:', error);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to add reaction feedback:', error);
    }
}

// Personalized onboarding system
async function sendPersonalizedOnboarding(member) {
    try {
        // Send DM to new member
        const onboardingEmbed = new EmbedBuilder()
            .setTitle('🎉 Welcome to Arch 2 Addicts!')
            .setDescription(`Hi ${member.user.username}! Welcome to our awesome Archero 2 community!\n\nI'm **XY Elder**, your personal bot assistant with ULTRA-DEEP knowledge of Archero 2. I can help you with advanced strategies, builds, and competitive play!`)
            .setColor(0x9b59b6)
            .addFields(
                { 
                    name: '🎮 Available Commands', 
                    value: '• `!ping` - Check if I\'m online\n• `!help` - See all commands\n• `!menu` - Public question menu\n• `!xyian info` - Guild information (requires role)\n• `!tip` - Daily Archero 2 tips (requires role)\n• `!discord-bot-clean` - Admin cleanup (XYIAN OFFICIAL only)\n• `!ai-toggle` - Toggle AI responses (XYIAN OFFICIAL only)', 
                    inline: false 
                },
                { 
                    name: '💬 Ask Me Anything!', 
                    value: 'Just type your question naturally - no commands needed!\n\n**Advanced Examples:**\n• "What\'s the best Peak Arena team composition?"\n• "How do I optimize my rune workshop?"\n• "Which character resonance should I focus on?"\n• "What are the exact stats for Thor\'s abilities?"\n• "How do I get the best weapon upgrades?"', 
                    inline: false 
                },
                { 
                    name: '🏰 XYIAN Guild - Elite Competitive Play', 
                    value: '**Guild ID: 213797**\n• Requirements: 2 daily boss battles + donations\n• Looking for active players with 300k+ power\n• Peak Arena specialists and PvP experts\n• Exclusive guild strategies and team coordination', 
                    inline: false 
                },
                { 
                    name: '⚡ What I Know About Archero 2', 
                    value: '• **ALL Characters** with exact stats, abilities, and resonance\n• **ALL Weapons** with upgrade paths and evolution requirements\n• **ALL Runes** with exact effects and workshop mechanics\n• **Peak Arena** team composition and positioning\n• **Events** with current schedules and rewards\n• **Gear sets** with bonuses and synergies', 
                    inline: false 
                },
                { 
                    name: '🎯 Personalized Setup', 
                    value: 'Want **personalized tips**? Reply with **"yes"** to set up custom daily reminders, build advice, and arena strategies!\n\nThis will help me give you tailored advice based on your playstyle, current gear, and competitive goals.', 
                    inline: false 
                }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot - Ultra-Advanced Assistant' });
        
        await member.send({ embeds: [onboardingEmbed] });
        console.log(`📩 Sent onboarding DM to ${member.user.username}`);
        
        // Store that we're waiting for their response
        userPreferences.set(member.id, { 
            status: 'awaiting_response',
            preferences: {},
            setupStep: 0
        });
        
    } catch (error) {
        console.error(`❌ Failed to send onboarding DM to ${member.user.username}:`, error);
    }
}

// Handle personalized setup responses
async function handlePersonalizedSetup(message) {
    const userId = message.author.id;
    const userPrefs = userPreferences.get(userId);
    
    if (!userPrefs || userPrefs.status !== 'awaiting_response') return false;
    
    const content = message.content.toLowerCase().trim();
    
    if (content === 'yes' || content === 'y' || content === 'yeah' || content === 'sure') {
        // Start setup process
        userPrefs.status = 'in_setup';
        userPrefs.setupStep = 1;
        userPreferences.set(userId, userPrefs);
        
        const setupEmbed = new EmbedBuilder()
            .setTitle('🎯 Personalized Setup - Step 1/3')
            .setDescription('Great! Let\'s customize your experience.\n\n**Question 1:** Would you like daily reset reminders?\n\nThese will remind you about:\n• Daily boss battles\n• Guild donations\n• Event deadlines\n• Daily quests')
            .setColor(0x00BFFF)
            .addFields(
                { name: '💡 Reply with:', value: '**"yes"** or **"no"**', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot - Setup Step 1' });
        
        await message.reply({ embeds: [setupEmbed] });
        return true;
    } else if (content === 'no' || content === 'n' || content === 'nope') {
        // User declined personalized messages
        userPreferences.delete(userId);
        
        const declineEmbed = new EmbedBuilder()
            .setTitle('👍 No Problem!')
            .setDescription('You can always change your mind later by DMing me again!\n\nFor now, you can still use me in the server for general questions and commands.')
            .setColor(0x95A5A6)
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot' });
        
        await message.reply({ embeds: [declineEmbed] });
        return true;
    }
    
    return false;
}

// Continue setup process
async function continuePersonalizedSetup(message) {
    const userId = message.author.id;
    const userPrefs = userPreferences.get(userId);
    
    if (!userPrefs || userPrefs.status !== 'in_setup') return false;
    
    const content = message.content.toLowerCase().trim();
    const isYes = content === 'yes' || content === 'y' || content === 'yeah' || content === 'sure';
    const isNo = content === 'no' || content === 'n' || content === 'nope';
    
    if (!isYes && !isNo) {
        await message.reply('Please reply with **"yes"** or **"no"** to continue setup.');
        return true;
    }
    
    switch (userPrefs.setupStep) {
        case 1: // Daily reset reminders
            userPrefs.preferences.dailyReminders = isYes;
            userPrefs.setupStep = 2;
            
            const step2Embed = new EmbedBuilder()
                .setTitle('🎯 Personalized Setup - Step 2/3')
                .setDescription('**Question 2:** Would you like build optimization tips?\n\nThese will help you with:\n• Character recommendations\n• Item synergies\n• Build strategies\n• Resonance optimization')
                .setColor(0x00BFFF)
                .addFields(
                    { name: '💡 Reply with:', value: '**"yes"** or **"no"**', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'XYIAN Bot - Setup Step 2' });
            
            await message.reply({ embeds: [step2Embed] });
            break;
            
        case 2: // Build tips
            userPrefs.preferences.buildTips = isYes;
            
            if (isYes) {
                userPrefs.setupStep = 2.5; // Go to build type selection
                const buildTypeEmbed = new EmbedBuilder()
                    .setTitle('🎯 Build Type Selection')
                    .setDescription('What type of build are you most interested in?\n\n**Options:**\n• **Dragon** - High damage, tanky builds\n• **Oracle** - Balanced, versatile builds\n• **Griffin** - Speed, mobility builds')
                    .setColor(0xE74C3C)
                    .addFields(
                        { name: '💡 Reply with:', value: '**"dragon"**, **"oracle"**, or **"griffin"**', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - Build Selection' });
                
                await message.reply({ embeds: [buildTypeEmbed] });
            } else {
                // Skip to step 3
                userPrefs.setupStep = 3;
                await sendStep3(message, userPrefs);
            }
            break;
            
        case 2.5: // Build type selection
            const buildType = content.toLowerCase();
            if (buildType === 'dragon' || buildType === 'oracle' || buildType === 'griffin') {
                userPrefs.preferences.buildType = buildType;
                userPrefs.setupStep = 3;
                await sendStep3(message, userPrefs);
            } else {
                await message.reply('Please reply with **"dragon"**, **"oracle"**, or **"griffin"** to continue.');
            }
            break;
            
        case 3: // Arena tips
            userPrefs.preferences.arenaTips = isYes;
            userPrefs.status = 'completed';
            
                const completionEmbed = new EmbedBuilder()
                    .setTitle('🎉 Setup Complete!')
                    .setDescription('Your personalized experience is ready!\n\n**Your Preferences:**\n' + 
                        `• Daily Reminders: ${userPrefs.preferences.dailyReminders ? '✅' : '❌'}\n` +
                        `• Build Tips: ${userPrefs.preferences.buildTips ? '✅' : '❌'}\n` +
                        `• Build Type: ${userPrefs.preferences.buildType ? userPrefs.preferences.buildType.charAt(0).toUpperCase() + userPrefs.preferences.buildType.slice(1) : 'Not selected'}\n` +
                        `• Arena Tips: ${userPrefs.preferences.arenaTips ? '✅' : '❌'}`)
                    .setColor(0x00FF88)
                    .addFields(
                        { name: '🚀 What\'s Next?', value: 'I\'ll send you personalized tips based on your preferences! You can always change these by DMing me again.', inline: false },
                        { name: '💡 Pro Tip', value: 'For advanced build analysis, check out the AI questions channel!', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - Setup Complete' });
            
            await message.reply({ embeds: [completionEmbed] });
            break;
    }
    
    userPreferences.set(userId, userPrefs);
    return true;
}

async function sendStep3(message, userPrefs) {
    const step3Embed = new EmbedBuilder()
        .setTitle('🎯 Personalized Setup - Step 3/3')
        .setDescription('**Question 3:** Would you like arena strategy tips?\n\nThese will help you with:\n• Peak Arena team composition\n• Character resonance strategies\n• Item bonuses and synergies\n• Competitive tactics')
        .setColor(0x00BFFF)
        .addFields(
            { name: '💡 Reply with:', value: '**"yes"** or **"no"**', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'XYIAN Bot - Setup Step 3' });
    
    await message.reply({ embeds: [step3Embed] });
}

// Bot Questions functionality (inline to avoid import issues)
const advancedArcheroQA = {
    // Orb System
    "swapping orbs": "Orb Swapping allows you to change your character's elemental affinity. Each orb provides different bonuses: Fire (damage), Ice (slow effects), Lightning (chain damage), Poison (DoT), Dark (critical chance). Swapping costs gems but can dramatically change your build effectiveness.",
    "orb effects": "Orb Effects: Fire Orbs increase damage by 15-25%, Ice Orbs slow enemies by 20-30%, Lightning Orbs chain to 2-3 additional enemies, Poison Orbs deal 10-20% damage over time, Dark Orbs increase critical chance by 15-25%. Each orb has 3 tiers with increasing effectiveness.",
    "best orb combinations": "Best Orb Combinations: 1) Fire + Lightning (high damage + chain), 2) Ice + Dark (control + crit), 3) Poison + Fire (DoT + burst), 4) All 5 orbs (maximum versatility but expensive). Choose based on your playstyle and available resources.",
    "orb tier system": "Orb Tier System: Tier 1 (Basic) - 10-15% bonus, Tier 2 (Advanced) - 15-20% bonus, Tier 3 (Master) - 20-25% bonus. Upgrading requires orbs of the same type and elemental essence. Higher tiers unlock additional effects and synergies.",
    
    // Razor Starcore System
    "razor starcore": "Razor Starcore is a late-game enhancement system that provides massive stat bonuses. Each starcore can be upgraded using Razor Shards and provides unique abilities. There are 5 starcore slots: Weapon, Armor, Accessory, Rune, and Special.",
    "starcore upgrades": "Starcore Upgrades: Each starcore has 10 levels. Level 1-3: Basic stat bonuses, Level 4-6: Unlock special abilities, Level 7-9: Enhanced abilities, Level 10: Ultimate ability. Upgrading requires Razor Shards which are obtained from high-level content and events.",
    "starcore combinations": "Starcore Combinations: Weapon + Armor (damage + defense), Accessory + Rune (utility + survivability), Special + Weapon (unique abilities + damage). Some combinations provide synergy bonuses when used together.",
    "razor shards": "Razor Shards are rare materials used to upgrade starcores. Sources: Peak Arena rewards, high-level dungeons, special events, guild activities. Save them for your most important starcores as they're extremely rare.",
    
    // Skin System
    "skin effects": "Skin Effects: Each skin provides unique stat bonuses and special abilities. Common skins: +5-10% damage, Rare skins: +10-15% damage + special effect, Epic skins: +15-20% damage + unique ability, Legendary skins: +20-25% damage + ultimate ability.",
    "skin resonance": "Skin Resonance occurs when you have multiple skins of the same character. Resonance provides additional bonuses: 2 skins: +5% all stats, 3 skins: +10% all stats + special effect, 4+ skins: +15% all stats + ultimate effect. This encourages collecting multiple skins.",
    "best skins": "Best Skins by Character: Dragoon - Dragon Lord (legendary), Griffin - Storm Wing (epic), Helix - Shadow Assassin (rare). Focus on skins that complement your build and provide useful abilities for your playstyle.",
    "skin upgrading": "Skin Upgrading: Use duplicate skins or skin fragments to upgrade. Each upgrade increases stat bonuses and unlocks new abilities. Max level is 10. Higher rarity skins have better base stats and more powerful abilities.",
    
    // Sacred Hall System
    "sacred hall": "Sacred Hall is a building system that provides permanent stat bonuses to all your characters. Each hall level increases specific stats: Attack Hall (damage), Defense Hall (health/armor), Speed Hall (movement/attack speed), Critical Hall (crit chance/damage).",
    "sacred hall vs tier up": "Sacred Hall vs Tier Up: Sacred Hall provides permanent bonuses to ALL characters, Tier Up improves individual character stats. Sacred Hall is better for long-term progression, Tier Up is better for immediate character power. Balance both for optimal growth.",
    "hall leveling priority": "Hall Leveling Priority: 1) Attack Hall (damage is king), 2) Critical Hall (crit chance/damage), 3) Defense Hall (survivability), 4) Speed Hall (quality of life). Focus on one hall at a time for maximum efficiency.",
    "hall materials": "Hall Materials: Sacred Stones (common), Sacred Crystals (rare), Sacred Gems (epic), Sacred Orbs (legendary). Higher tier materials provide more experience. Use them strategically based on your current hall levels.",
    
    // Resonance System - CORRECTED INFORMATION
    "resonance": "**RESONANCE**: Unlocks using other characters' skills that you own on your current character. Example: Alex 3-star can use Nyanja's cloudfooted skill as resonance. 3-star resonance slot unlocks at 3 stars, 6-star resonance slot unlocks at 6 stars. You get abilities from other characters based on your resonance setup.",
    "resonance levels": "**RESONANCE LEVELS**: 3-star resonance slot: Unlocks at 3 stars, gives you abilities from other characters. 6-star resonance slot: Unlocks at 6 stars, gives you additional abilities from other characters. The more leveled your characters are, the better the resonance effects.",
    "resonance vs diversity": "**RESONANCE**: Resonance is about character abilities, not equipment. 3-star slot: Rolla, Helix are best. 6-star slot: Loki, Demon King, Otta are best. This is about character synergies and abilities, not equipment matching.",
    "what is resonance": "**RESONANCE**: Unlocks using other characters' skills that you own on your current character. Example: Alex 3-star can use Nyanja's cloudfooted skill as resonance. 3-star resonance slot unlocks at 3 stars, 6-star resonance slot unlocks at 6 stars.",
    "how does resonance work": "**RESONANCE**: Unlocks using other characters' skills that you own on your current character. Example: Alex 3-star can use Nyanja's cloudfooted skill as resonance. 3-star resonance slot unlocks at 3 stars, 6-star resonance slot unlocks at 6 stars.",
    
    // Character System - Detailed Character Information
    "thor": "Thor (Legendary): Unique ability to move while firing arrows and weapon detach ability. As you level up, you can summon hammers and increase lightning damage. Excellent for mobile combat and lightning-based builds. Perfect for players who prefer active movement during combat.",
    "demon king": "Demon King (Legendary): Has a powerful shield that gets stronger as you level up. His skins are extremely useful because they add abilities to his shield, making him incredibly tanky. Best for defensive builds and players who prefer survivability over pure damage.",
    "rolla": "Rolla (Epic/Purple): Freeze attacks and critical damage boost. Great for crowd control and burst damage builds. Her freeze abilities can lock down enemies while her crit boost maximizes damage output. Excellent for players who like control-based gameplay.",
    "dracoola": "Dracoola (Epic/Purple): Life steal on hit chance. Provides excellent sustainability in long battles. Perfect for players who want to stay alive longer without relying on health potions. Great for solo content and extended farming sessions.",
    "seraph": "Seraph (Epic/Purple): PvE only character with excellent bonuses. Gets extra ability chance when picking health for angels. Designed specifically for PvE content with unique angel-based mechanics. Best for players who focus on PvE progression and farming.",
    "loki": "Loki (Epic/Purple): PvP specific character acquired from PvP rewards. Has attack speed boost when moving (chance-based). Perfect for PvP combat where movement and speed are crucial. His mobility-based bonuses make him ideal for hit-and-run tactics.",
    
    // Character Tier Information
    "legendary characters": "Legendary Characters: Thor (move while firing, weapon detach, summon hammers, lightning damage), Demon King (powerful shield, shield abilities from skins). These are the highest tier characters with unique abilities and powerful scaling.",
    "epic characters": "Epic Characters: Rolla (freeze attacks, crit damage boost), Dracoola (life steal on hit), Seraph (PvE only, angel bonuses), Loki (PvP only, movement attack speed boost). Purple tier characters with specialized abilities for different content types.",
    "character abilities": "Character Abilities: Each character has unique abilities that scale with level. Thor gets hammer summons and lightning damage, Demon King's shield gets stronger, Rolla freezes enemies and boosts crit damage, Dracoola steals life, Seraph gets angel bonuses, Loki gets movement-based attack speed.",
    "character skins": "Character Skins: Skins provide stat bonuses and special abilities. Demon King skins are particularly useful as they add abilities to his shield. Each character has multiple skins with different effects and bonuses. Focus on skins that complement your playstyle.",
    
    // Character Selection Guide
    "best characters": "Best Characters by Content: PvP - Thor, Loki, Demon King. PvE - Seraph, Dracoola, Rolla. Peak Arena - Thor, Demon King, Griffin. Choose based on your preferred content and playstyle.",
    "character leveling": "Character Leveling: Each character gains new abilities and stat bonuses as you level up. Thor unlocks hammer summons and lightning damage, Demon King's shield becomes more powerful, Epic characters get enhanced versions of their base abilities.",
    "character acquisition": "Character Acquisition: Legendary characters from premium sources, Epic characters from various content. Seraph is PvE only, Loki is PvP only. Focus on characters that match your preferred content type.",
    "character builds": "Character Builds: Thor - Lightning and mobility builds, Demon King - Tank and shield builds, Rolla - Freeze and crit builds, Dracoola - Life steal and sustain builds, Seraph - Angel and PvE builds, Loki - Movement and PvP builds.",
    
    // Lower Tier Characters - Starting and Basic Characters
    "alex": "Alex (Starting Hero): Good basic abilities and red heart drop increase. Perfect for beginners with solid foundation stats. His heart drop bonus helps with survivability in early game. Great starting character for learning the game mechanics.",
    "nyanja": "Nyanja (Basic): Little ninja cat with increased speed and Cloudfooted ability that damages and pushes enemies away. Excellent for mobility-based gameplay and crowd control. Great for players who prefer fast, agile combat styles.",
    "helix": "Helix (Basic): Gets more damage as he gets damaged - damage increases with lower health. High-risk, high-reward character perfect for aggressive players. His damage scaling makes him incredibly powerful when played correctly.",
    "hela": "Hela (Basic): Really good character with healing aura and damage boost. At max stars, she provides really important crowd control cleanse. Essential for team support and removing debuffs. Excellent for players who prefer support roles.",
    
    // Character Tier Overview
    "basic characters": "Basic Characters: Alex (starting hero, heart drop bonus), Nyanja (speed, cloudfooted push), Helix (damage scaling with health loss), Hela (healing aura, damage boost, crowd control cleanse). These are the foundation characters every player should know.",
    "starting characters": "Starting Characters: Alex is the default starting hero with good basic abilities and red heart drop increase. Perfect for learning the game and provides solid foundation for new players.",
    "low tier characters": "Low Tier Characters: Alex (heart drops), Nyanja (speed/cloudfooted), Helix (damage scaling), Hela (healing/cleanse). These characters are accessible early and provide unique abilities that remain useful throughout the game.",
    "character progression": "Character Progression: Start with Alex for basics, unlock Nyanja for speed, Helix for damage scaling, Hela for support. These characters teach different playstyles before moving to Epic and Legendary characters.",
    
    // Character Abilities and Mechanics
    "cloudfooted": "Cloudfooted Ability (Nyanja): Damages and pushes enemies away. Great for crowd control and creating space. Perfect for hit-and-run tactics and managing enemy positioning.",
    "damage scaling": "Damage Scaling (Helix): Damage increases as health decreases. High-risk, high-reward mechanic. Players must balance staying alive with maximizing damage output.",
    "healing aura": "Healing Aura (Hela): Provides healing to nearby allies. Essential for team support and survivability. Great for group content and supporting other players.",
    "crowd control cleanse": "Crowd Control Cleanse (Hela): At max stars, removes debuffs and crowd control effects. Extremely important for high-level content where debuffs can be deadly.",
    "heart drop bonus": "Heart Drop Bonus (Alex): Increases red heart drop rate. Helps with survivability and reduces reliance on health potions. Great for new players learning resource management.",
    
    // Character Selection by Playstyle
    "aggressive characters": "Aggressive Characters: Helix (damage scaling), Thor (lightning/mobility), Loki (PvP movement). For players who prefer high-risk, high-reward gameplay.",
    "defensive characters": "Defensive Characters: Demon King (shield), Hela (healing/cleanse), Dracoola (life steal). For players who prefer survivability and support roles.",
    "mobile characters": "Mobile Characters: Nyanja (speed/cloudfooted), Thor (move while firing), Loki (movement bonuses). For players who prefer agile, hit-and-run combat.",
    "support characters": "Support Characters: Hela (healing/cleanse), Seraph (angel bonuses). For players who prefer helping teammates and providing utility."
};

function handleBotQuestion(question) {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Direct matches
    if (advancedArcheroQA[lowerQuestion]) {
        return advancedArcheroQA[lowerQuestion];
    }
    
    // Partial matches
    for (const [key, answer] of Object.entries(advancedArcheroQA)) {
        if (lowerQuestion.includes(key) || key.includes(lowerQuestion)) {
            return answer;
        }
    }
    
    // Keyword matching
    const keywords = {
        'orb': 'swapping orbs',
        'starcore': 'razor starcore',
        'skin': 'skin effects',
        'resonance': 'resonance',
        'sacred hall': 'sacred hall',
        'tier up': 'sacred hall vs tier up',
        'meta': 'meta shifts',
        'pvp': 'pvp meta',
        'guild': 'guild wars',
        'event': 'event optimization',
        'build': 'build theory',
        'resource': 'resource priority',
        'thor': 'thor',
        'demon king': 'demon king',
        'rolla': 'rolla',
        'dracoola': 'dracoola',
        'seraph': 'seraph',
        'loki': 'loki',
        'alex': 'alex',
        'nyanja': 'nyanja',
        'helix': 'helix',
        'hela': 'hela',
        'character': 'best characters',
        'legendary': 'legendary characters',
        'epic': 'epic characters',
        'basic': 'basic characters',
        'starting': 'starting characters',
        'ability': 'character abilities',
        'leveling': 'character leveling',
        'aggressive': 'aggressive characters',
        'defensive': 'defensive characters',
        'mobile': 'mobile characters',
        'support': 'support characters',
        'cloudfooted': 'cloudfooted',
        'damage scaling': 'damage scaling',
        'healing aura': 'healing aura',
        'crowd control': 'crowd control cleanse',
        'heart drop': 'heart drop bonus'
    };
    
    for (const [keyword, topic] of Object.entries(keywords)) {
        if (lowerQuestion.includes(keyword)) {
            return advancedArcheroQA[topic];
        }
    }
    
    return "I don't have specific information about that topic yet. Could you rephrase your question or ask about orbs, starcores, skins, resonance, sacred halls, or other advanced game mechanics? I'm here to help with the deeper nuances of Archero 2!";
}

function getBotQuestionHelp() {
    return new EmbedBuilder()
        .setTitle('🤖 Bot Questions Channel - Advanced Archero 2 Help')
        .setDescription('Ask me about advanced game mechanics, strategies, and nuances!')
        .setColor(0x00ff88)
        .addFields(
            {
                name: '🎯 **Orb System**',
                value: '• `swapping orbs` - Orb mechanics and effects\n• `orb combinations` - Best orb setups\n• `orb tier system` - Upgrading orbs',
                inline: true
            },
            {
                name: '⭐ **Razor Starcore**',
                value: '• `razor starcore` - Starcore system\n• `starcore upgrades` - Upgrading starcores\n• `razor shards` - Obtaining materials',
                inline: true
            },
            {
                name: '🎨 **Skin System**',
                value: '• `skin effects` - Skin bonuses\n• `skin resonance` - Multiple skin bonuses\n• `best skins` - Top skin recommendations',
                inline: true
            },
            {
                name: '🏛️ **Sacred Hall**',
                value: '• `sacred hall` - Hall system\n• `sacred hall vs tier up` - Comparison\n• `hall leveling priority` - Upgrade order',
                inline: true
            },
            {
                name: '⚡ **Resonance**',
                value: '• `resonance` - Equipment resonance\n• `resonance levels` - Resonance tiers\n• `resonance vs diversity` - Strategy comparison',
                inline: true
            },
            {
                name: '🏆 **Legendary Characters**',
                value: '• `thor` - Lightning/mobility character\n• `demon king` - Tank with shield\n• `legendary characters` - Top tier overview',
                inline: true
            },
            {
                name: '💜 **Epic Characters**',
                value: '• `rolla` - Freeze/crit character\n• `dracoola` - Life steal character\n• `seraph` - PvE only character\n• `loki` - PvP only character',
                inline: true
            },
            {
                name: '⭐ **Basic Characters**',
                value: '• `alex` - Starting hero\n• `nyanja` - Speed/ninja cat\n• `helix` - Damage scaling\n• `hela` - Healing/support',
                inline: true
            },
            {
                name: '🎯 **Character Guide**',
                value: '• `best characters` - Recommendations\n• `character abilities` - Ability descriptions\n• `character builds` - Build strategies\n• `character progression` - Leveling guide',
                inline: true
            },
            {
                name: '🎮 **Playstyles**',
                value: '• `aggressive characters` - High-risk builds\n• `defensive characters` - Tank/support\n• `mobile characters` - Speed builds\n• `support characters` - Team utility',
                inline: true
            }
        )
        .setFooter({ text: 'Ask me anything about these topics for detailed explanations!' })
        .setTimestamp();
}

// Archero 2 Q&A Database - ULTRA-COMPREHENSIVE DEEP RESEARCH
const archeroQA = {
    // Peak Arena - COMPLETE MECHANICS
    "Peak Arena": "**Peak Arena RULES**: No player limit. Weekly rankings: Top 40% maintain rank, 60% demoted. Team composition: 3 characters max with different builds. Unique items provide bonus health/damage. Auto-battler PvP with strategic positioning. Rewards: Daily/weekly based on ranking.",
    "Peak Arena rules": "**Peak Arena MECHANICS**: Unlimited players. Weekly demotion system (top 40% stay, 60% demoted). Team of 3 characters with unique builds. Special items grant bonus health and damage. Strategic positioning crucial. Daily/weekly rewards based on performance.",
    "Peak Arena team": "**Peak Arena TEAM COMPOSITION**: 3 characters max. Balanced team: Tank (absorbs damage), Damage Dealer (high attack), Support (healing/buffs). Strategic positioning key. Unique items provide bonus health/damage. Auto-battler mechanics.",
    "Peak Arena composition": "**Peak Arena TEAM BUILD**: 3-character limit. Essential roles: Tank (high health/defense), DPS (high attack power), Support (healing/buffs). Positioning crucial for success. Unique items grant health/damage bonuses.",
    
    // RUNES - COMPLETE DATABASE WITH EXACT STATS
    "runes": "**COMPLETE RUNES DATABASE**: **Blessing Runes**: Revive (ATK+36, HP+144, Epic: 50% revive chance, Mythic: 100% revive), Guardian (ATK+36, HP+144, Epic: -5% damage), Lucky Shadow (ATK+36, HP+144, Epic: +5% luck/+2% dodge, Mythic: +15% luck/+10% dodge). **Enhancement Runes**: Sharp Arrow (ATK+20, Epic: +10% weapon damage, Mythic: +30%), Sprite Multishot (ATK+20, Epic: 30% multi-shot chance, Mythic: +50% sprite speed). **Ability Runes**: Flame Poison Touch (HP+80, Epic: ignite random monster every 2s, Mythic: 1.5s cooldown).",
    "revive rune": "**REVIVE RUNE** (Blessing): Base: ATK+36, HP+144. Epic: 50% chance to revive with half HP. Legendary: +20% ATK after revival. Mythic: 100% revive chance with half HP + 20% ATK boost.",
    "guardian rune": "**GUARDIAN RUNE** (Blessing): Base: ATK+36, HP+144. Epic: -5% damage taken. Legendary: Additional damage reduction. Mythic: Maximum damage reduction.",
    "lucky shadow rune": "**LUCKY SHADOW RUNE** (Blessing): Base: ATK+36, HP+144. Epic: +5% luck, +2% dodge. Legendary: +10% luck, +5% dodge. Mythic: +15% luck, +10% dodge.",
    "sharp arrow rune": "**SHARP ARROW RUNE** (Enhancement): Base: ATK+20. Normal: +5 weapon damage. Fine: +10 weapon damage. Rare: +50 ATK. Epic: +10% weapon damage. Legendary: +20% weapon damage. Mythic: +30% weapon damage.",
    "sprite multishot rune": "**SPRITE MULTISHOT RUNE** (Enhancement): Base: ATK+20. Normal: +5 sprite damage. Fine: +10 sprite damage. Rare: +50 ATK. Epic: 30% multi-shot chance. Legendary: +25% sprite speed. Mythic: +50% sprite speed.",
    "flame poison touch rune": "**FLAME POISON TOUCH RUNE** (Ability): Base: HP+80. Normal: +10 poison damage. Fine: +10 fire damage. Rare: +200 HP. Epic: Ignite random monster every 2s. Legendary: Poison random monster every 2s. Mythic: 1.5s cooldown.",
    "rune workshop": "**RUNE WORKSHOP**: Unlocked at Chapter 5. Merge duplicate runes to increase rarity. Progression: Normal → Fine → Rare → Epic → Legendary → Mythic. Higher rarities provide better stats and effects.",
    "rune merging": "**RUNE MERGING**: Combine duplicate runes in workshop to upgrade rarity. Required materials increase with tier. Epic+ runes provide significant stat boosts and special effects.",
    
    // CHARACTERS - COMPLETE DATABASE
    "characters": "**COMPLETE CHARACTERS DATABASE**: **S-Tier**: Thor (lightning attacks), Loki (illusions/trickery), Hela (dark magic/summoning). **A-Tier**: Axe Master (crowd control), Assassin (high damage/evasion), Guardian (tank). **B-Tier**: Demon King Atreus (dark magic), Otta (balanced warrior), Rolla (ranged specialist), Dracoola (vampiric/life steal), Seraph (holy powers), Nyanja (agile/dodging), Helix (spinning attacks).",
    "thor": "**THOR** - S-tier character. Lightning-based attacks. High damage output. Best for aggressive playstyles. Unlock: Premium/events.",
    "loki": "**LOKI** - S-tier character. Illusions and trickery. Deceptive tactics. High skill ceiling. Unlock: Premium/events.",
    "hela": "**HELA** - S-tier character. Dark magic specialist. Summoning abilities. Undead minions. Unlock: Premium/events.",
    "axe master": "**AXE MASTER** - A-tier character. Multi-directional axe throws. Excellent crowd control. High damage output.",
    "assassin": "**ASSASSIN** - A-tier character. Quick, high-damage attacks. High evasion. Glass cannon playstyle.",
    "guardian": "**GUARDIAN** - A-tier character. Tank role. High health and defense. Protective abilities.",
    "character resonance": "**CHARACTER RESONANCE**: 3-star and 6-star upgrades unlock resonance bonuses. Higher stars = better stats and abilities. Use character shards from events to upgrade.",
    "character shards": "**CHARACTER SHARDS**: Obtain from events, shop, or gameplay. Required for character upgrades. Higher star levels unlock resonance bonuses and improved abilities.",
    
    // WEAPONS - COMPLETE TIER SYSTEM
    "weapons": "**COMPLETE WEAPONS DATABASE**: **S-Tier**: Staff (range/AoE damage), Spear (single-target damage/reach). **A-Tier**: Crossbow (burst damage), Longbow (range/decent damage). **B-Tier**: Claw (swift attacks), Knuckles (close-range speed). **Sets**: Echo Set (Beam Staff - combo damage), Destruction Set (Heroic Longbow - AoE explosions).",
    "staff": "**STAFF** - S-tier weapon. Exceptional range and area-of-effect damage. Ideal for crowd control. Best for mage builds.",
    "spear": "**SPEAR** - S-tier weapon. High single-target damage with impressive reach. Excellent for boss fights and precision combat.",
    "crossbow": "**CROSSBOW** - A-tier weapon. High burst damage with faster projectile speed. Good for quick eliminations.",
    "longbow": "**LONGBOW** - A-tier weapon. Excellent range with decent damage. Balanced ranged option.",
    "claw": "**CLAW** - B-tier weapon. Swift attacks with decent close-range damage. Fast attack speed.",
    "knuckles": "**KNUCKLES** - B-tier weapon. High attack speed for close-range combat. Melee specialist.",
    "echo set": "**ECHO SET** (Beam Staff): Combo-based damage increases. Effective for PvE. Combo damage up to 10% at Epic rarity.",
    "destruction set": "**DESTRUCTION SET** (Heroic Longbow): AoE explosion effects. 30% chance to trigger AoE explosion on hit at Epic rarity. Good for PvP.",
    
    // ARMOR - COMPLETE SET SYSTEM
    "armor": "**COMPLETE ARMOR DATABASE**: **S-Tier**: Oracle Set (balanced offense/defense). **A-Tier**: Dragoon Set (high attack/critical damage), Griffin Set (balanced stats). **B-Tier**: Echo Set (magic/ranged damage). **C-Tier**: Destruction Set (burst damage), Decisiveness Set (situational).",
    "oracle set": "**ORACLE SET** - S-tier armor. Balanced offense and defense. Exceptional versatility. Best overall choice.",
    "dragoon set": "**DRAGOON SET** - A-tier armor. High attack power. Amplified critical hit damage. Crossbow synergy. Best for DPS builds.",
    "griffin set": "**GRIFFIN SET** - A-tier armor. Balanced offense and defense. Adaptable to various scenarios. Versatile choice.",
    "echo armor": "**ECHO ARMOR** - B-tier. Amplifies magic and ranged damage. Strong in niche builds. Combo-based bonuses.",
    "armor of destruction": "**ARMOR OF DESTRUCTION** - C-tier. High burst damage potential. AoE damage focus. Flame Shield at Legendary (10s duration, explodes when damaged).",
    "armor sets": "**ARMOR SET BONUSES**: Complete sets provide additional bonuses. Mixing sets reduces effectiveness. Focus on one complete set for maximum benefits.",
    
    // EVENTS - COMPLETE DATABASE
    "events": "**COMPLETE EVENTS DATABASE**: **Campaign**: Main progression path. **Sky Tower**: Climb floors for Gold/Scrolls/Gems (3 free tickets daily). **Seal Battle**: Boss fights for Gems/Wishes. **Gold Cave**: Farm Gold/Scrolls (roulette system). **Rune Ruins**: Use Shovels for runes. **Monster Invasion**: Daily guild boss (damage-based rewards). **Carnival Event**: New player roadmap (Dragon Knight gear). **Demon Clash**: Time-limited (Demon King Atreus). **Up-Close Dangers**: Close-range combat (gold rewards). **Hero Duo**: Cooperative play (gems/experience). **Monster Treasure**: Daily clan event.",
    "sky tower": "**SKY TOWER**: Climb floors for Gold, Scrolls, Gems. Each level has 5 stages. 3 free tickets daily + ads. Progressive difficulty. Essential for progression.",
    "seal battle": "**SEAL BATTLE**: Boss fights testing damage output. Rewards: Gems and Wishes. Daily attempts. Damage-based rewards.",
    "gold cave": "**GOLD CAVE**: Quick 2-3 minute mini-chapters. Farm Gold and Scrolls. Roulette system. Use all daily attempts. Essential for resource farming.",
    "rune ruins": "**RUNE RUINS**: Use Shovels to obtain runes. Smart early-game investment. Runes crucial for character enhancement. Daily attempts.",
    "monster invasion": "**MONSTER INVASION**: Daily guild boss. Rewards scale based on damage dealt. Guild coins and ranking rewards. Join guild early for access.",
    "carnival event": "**CARNIVAL EVENT**: New player roadmap event. Big rewards including Dragon Knight gear. Time-limited. Essential for new players.",
    "demon clash": "**DEMON CLASH**: Time-limited event. Earn Demon King Atreus through luck-based system. Premium character unlock opportunity.",
    "umbral tempest": "**UMBRAL TEMPEST**: Formidable challenge with unique mechanics. High difficulty. Exclusive gear and runes. Leaderboard rewards. Check Discord channel 1419521725418180618 for strategies.",
    
    // GAME MODES - COMPLETE MECHANICS
    "game modes": "**COMPLETE GAME MODES**: **Campaign**: Main progression (chapters). **Sky Tower**: Floor climbing (5 stages per level). **Seal Battle**: Boss damage testing. **Gold Cave**: Resource farming. **Rune Ruins**: Rune acquisition. **Monster Invasion**: Guild boss. **Peak Arena**: Auto-battler PvP (3-character teams). **Hero Duo**: Cooperative play. **PvP**: Player vs Player combat.",
    "campaign": "**CAMPAIGN MODE**: Main progression path. Complete chapters to unlock new content. Essential rewards. Story progression.",
    "pvp": "**PvP MODE**: Player vs Player combat. Test skills against other players. Ranking system. Rewards based on performance.",
    "hero duo": "**HERO DUO**: Cooperative gameplay mode. Team up with other players. Gems and experience rewards. Social gameplay.",
    
    // ABILITIES - COMPLETE DATABASE
    "abilities": "**COMPLETE ABILITIES DATABASE**: **Rare Abilities**: Sprite Enhancement (sprite attack), Fountain of Life (max HP + full heal), Angel's Protection (invincibility on damage), Invincibility Potion (brief invincibility), Lucky Heart (HP boost chance), Flying Sword Assault (5 swords per wave), Freeze (bullet freeze), Swift Shadow Arrow (speed + spread), Bounce Arrow (+1 bounce), Hell Warrior (ATK boost + demon spawn), Wind Step (wind bursts + speed), Abundance Potion (more potions), Front Arrow (+1 arrow), Split Arrow (bullet split), Bomb Sprite (bomb sprite), Critical Frenzy (low HP boost), Lightning (electrocute), Fire (ignite), Poison (poison damage), Demon Slayer Warrior (ATK after kill), Rotating Orb Enhancement (orb damage), Standing Strong (stationary boost).",
    "sprite enhancement": "**SPRITE ENHANCEMENT** (Rare): Significantly increases sprite attack power. Essential for sprite builds.",
    "fountain of life": "**FOUNTAIN OF LIFE** (Rare): Increases max HP and fully recovers HP. Survival ability.",
    "angel's protection": "**ANGEL'S PROTECTION** (Rare): Brief invincibility when taking damage. Defensive ability.",
    "flying sword assault": "**FLYING SWORD ASSAULT** (Rare): Summons 5 flying swords each wave. Offensive ability.",
    "freeze": "**FREEZE** (Rare): Bullets freeze monsters. Crowd control ability.",
    "bounce arrow": "**BOUNCE ARROW** (Rare): Bullets can bounce between monsters with +1 bounce count. Multi-target ability.",
    "critical frenzy": "**CRITICAL FRENZY** (Rare): When HP below 50%, significantly increases attack power and speed. Low HP boost.",
    "lightning": "**LIGHTNING** (Rare): Bullets electrocute monsters. Elemental damage.",
    "fire": "**FIRE** (Rare): Bullets ignite monsters. Burn damage over time.",
    "poison": "**POISON** (Rare): Bullets poison monsters. Damage over time.",
    "standing strong": "**STANDING STILL** (Rare): Longer you stand still, higher attack speed and damage. Stationary boost.",
    
    // PROGRESSION TIPS
    "progression": "**PROGRESSION TIPS**: **Currency**: Gold for gear upgrades, Gems for Mythstone Chests/Rune Ruins. **Daily Routine**: Complete all daily events, maximize resource gains, participate in guild activities. **Gear**: Prioritize S-tier gear, avoid upgrading non-S gear beyond Legendary+Z. **Guild**: Join early for Monster Invasion and Guild Shop access. **Shop**: Check daily for free Silver Chest draws, ad rewards, time-limited deals. **Premium**: Permanent Supply Card (3,900 gems + 800 daily), Permanent Ad-Free Card (all ad rewards free).",
    "currency": "**CURRENCY GUIDE**: **Gold**: Primary for gear upgrades and Talent Cards. **Gems**: Premium currency, best for Mythstone Chests or Rune Ruins. Avoid Silver/Obsidian chests. **Character Shards**: From events/shop for character upgrades.",
    "daily routine": "**DAILY ROUTINE**: Complete all daily events, maximize resource gains, participate in guild activities, check shop for deals, use all limited-time mode attempts, watch ads for bonuses.",
    "gear upgrade": "**GEAR UPGRADE PRIORITY**: Focus on S-tier gear only. Avoid upgrading non-S gear beyond Legendary+Z. Never use S gear as material. Equipment upgrades require scrolls from chapters, gold cave, shops.",
    "guild benefits": "**GUILD BENEFITS**: Join early for Monster Invasion access, Guild Shop items, collaborative rewards, ranking benefits, character shard access.",
    
    // DISCORD CHANNELS FOR RESEARCH
    "discord channels": "**OFFICIAL ARCHERO 2 DISCORD CHANNELS**: Server ID: 1268830572743102505. **Game Updates**: 1268897602645000235 (major goldmine for new answers/events). **Announcements**: 1279024218473758770 (community giveaways). **Gift Codes**: 1301516076445732915 (codes with expiration dates). **Bug Reports**: 1268897760728449064 (known issues). **General Chat**: 1268830572743102508 (community insights). **Q&A**: 1268835262159654932 (giant Q&A resource). **Bot Commands**: 1291056257716977715 (official bot functions). **Umbral Tempest**: 1419521725418180618 (specific content).",
    "game updates channel": "**GAME UPDATES CHANNEL** (1268897602645000235): Major goldmine for new answers, events, updates. Primary focus for research. Contains latest game information.",
    "gift codes": "**GIFT CODES CHANNEL** (1301516076445732915): Excellent for scraping codes with expiration dates. Example: 'free777 exp december20204'. Daily updated codes.",
    "qa channel": "**Q&A CHANNEL** (1268835262159654932): Giant Q&A resource for rich answers and questions. Community knowledge base.",
    "umbral tempest channel": "**UMBRAL TEMPEST CHANNEL** (1419521725418180618): Specific content for Umbral Tempest event. Strategies and information.",
    
    // LEGACY WEAPONS (for backward compatibility)
    "best weapon": "**S-TIER WEAPONS**: Staff (range/AoE), Spear (single-target/reach), Crossbow (burst damage). These are the top-tier weapons with best stats and upgrade potential.",
    "strongest weapon": "**S-TIER WEAPONS**: Staff (range/AoE), Spear (single-target/reach), Crossbow (burst damage). These are the top-tier weapons with best stats and upgrade potential.",
    "oracle staff": "**ORACLE STAFF** - S-tier weapon (mage type). Exceptional range and area-of-effect damage. Best for mage builds and crowd control.",
    "griffin claws": "**GRIFFIN CLAWS** - S-tier weapon (melee type). High attack speed and close combat effectiveness. Perfect for warrior builds.",
    "dragoon crossbow": "**DRAGOON CROSSBOW** - S-tier weapon (ranged type). High burst damage with fast projectile speed. Excellent for PvP and archer builds.",
    "weapon tiers": "**WEAPON TIER SYSTEM**: S-tier weapons (Staff, Spear, Crossbow) have the best stats and upgrade potential. A-tier and B-tier weapons are viable but inferior to S-tier.",
    "chaotic tier": "**CHAOTIC TIER**: Maximum tier for S-tier weapons. Provides highest stats and abilities in the game.",
    "mythic tier": "**MYTHIC TIER**: Second-highest tier for S-tier weapons. Significant stat boost from Legendary.",
    "s tier weapons": "**S-TIER WEAPONS**: Oracle Staff (mage), Griffin Claws (melee), Dragoon Crossbow (ranged). These are the ONLY weapons that can be upgraded beyond Legendary. Tier progression: Epic → Legendary → Mythic → Chaotic (max).",
    
    // UPGRADE SYSTEM - COMPREHENSIVE DATABASE
    "upgrade system": "**UPGRADE SYSTEM**: Epic has +1 and +2 levels. +1 takes 1 other epic, +2 takes 2 other epics. To make Legendary: need another epic +2 of same type. Legendary has +1, +2, +3 levels. +1 and +2 need 1 other legendary, +3 needs 2 legendaries. To make Mythic: need two legendary +3. Mythic has +1, +2, +3, +4 levels. To make Chaotic: need mythic +4 + 14 epic griffin helmets OR 42 epic helmets OR 38 legendary helmets.",
    "epic upgrade": "**EPIC UPGRADE**: Epic items have +1 and +2 levels. +1 requires 1 other epic of same type, +2 requires 2 other epics. To upgrade to Legendary: need another epic +2 of the same type.",
    "legendary upgrade": "**LEGENDARY UPGRADE**: Legendary items have +1, +2, +3 levels. +1 and +2 require 1 other legendary, +3 requires 2 legendaries. To upgrade to Mythic: need two legendary +3 of the same type.",
    "mythic upgrade": "**MYTHIC UPGRADE**: Mythic items have +1, +2, +3, +4 levels. To upgrade to Chaotic: need mythic +4 + 14 epic griffin helmets OR 42 epic helmets OR 38 legendary helmets.",
    "chaotic upgrade": "**CHAOTIC UPGRADE**: To make Chaotic Oracle Helmet: need mythic +4 + 14 epic griffin helmets OR 42 epic helmets OR 38 legendary helmets. This system applies to all items (crossbow to mythic needs 43 epic weapons, etc.).",
    "basic weapons": "**BASIC WEAPONS**: Beam Staff, Claw, and Bow are NOT S-tier and can only go to Legendary +3. They cannot go past Legendary tier. Only S-tier weapons (Oracle Staff, Griffin Claws, Dragoon Crossbow) can reach Mythic and Chaotic tiers.",
    "upgrade costs": "**UPGRADE COSTS**: Epic +1 (1 epic), Epic +2 (2 epics), Legendary +1/+2 (1 legendary), Legendary +3 (2 legendaries), Mythic +1/+2/+3/+4 (various legendary costs), Chaotic (mythic +4 + 14 epic griffin OR 42 epic OR 38 legendary).",
    
    // EVENTS - ROTATING SYSTEM
    "events": "**EVENT SYSTEM**: Events rotate regularly and are not always active. Umbral Tempest may be current, but events change monthly. Save gems for fishing event (gives etched runes, free/gems). Thor/Demon King events are cash-only when they appear. Check current status before giving advice.",
    "umbral tempest": "**UMBRAL TEMPEST**: May be currently active, but events rotate. Check the Umbral Tempest channel for current status. Events like this change regularly and may require cash or gems to participate fully.",
    "fishing event": "**FISHING EVENT**: One of the best events when active - gives etched runes and can be done for free or with gems. SAVE GEMS for when this event returns (typically monthly). Don't tell players to focus on it unless it's currently active.",
    "otherworld summon": "**OTHERWORLD SUMMON**: Event where you can get Thor and Demon King characters when it's active. This event is typically cash-only, so requires real money to participate. Thor and Demon King are premium characters from this event.",
    "etched runes": "**ETCHED RUNES**: Special runes obtained from fishing event and other events when they're active. These are valuable upgrade materials that can significantly boost your character's power. Save gems for fishing event when it returns.",
    "event costs": "**EVENT COSTS**: Most events cost cash or gems when active. Fishing event is one of the best for free players (can use gems) when it's running. Thor/Demon King events are typically cash-only. Always check if events are currently active before giving advice.",
    "free events": "**FREE EVENTS**: Fishing event is the best free event when active - gives etched runes and can be done with gems. Most other events require cash. SAVE GEMS for fishing event when it returns, don't tell players to focus on it unless it's currently active.",
    "premium events": "**PREMIUM EVENTS**: Thor and Demon King events are cash-only when they appear. These give access to premium characters but require real money. Only participate if you're willing to spend cash and the event is currently active.",
    "event rotation": "**EVENT ROTATION**: Events rotate monthly and are not always active. Don't tell players to focus on specific events unless they're currently running. Instead, advise saving gems for good events like fishing when they return.",
    "save gems": "**SAVE GEMS**: Save gems for fishing event when it returns (gives etched runes, free/gems). Don't spend gems on other events unless they're currently active and worth it. Fishing event is the best free progression event.",
    
    // ADDITIONAL KEY TOPICS
    "best characters": "**BEST CHARACTERS**: Legendary: Thor (mobile combat), Demon King (defensive). Epic: Rolla (3-star resonance), Loki (6-star resonance), Helix (damage scaling), Hela (support). Focus on characters that fit your playstyle and resonance needs.",
    "character tier list": "**CHARACTER TIER LIST**: S-tier: Thor, Demon King. A-tier: Rolla, Loki, Helix, Hela. B-tier: Dracoola, Seraph, Nyanja. C-tier: Alex (starting hero). Focus on S and A-tier characters for competitive play.",
    "pvp characters": "**PvP CHARACTERS**: Best for PvP: Thor (mobile combat), Loki (movement speed), Rolla (freeze control), Demon King (tank). Avoid Seraph (PvE only). Focus on mobility and control for PvP success.",
    "pve characters": "**PvE CHARACTERS**: Best for PvE: Thor (versatile), Demon King (tank), Seraph (PvE bonuses), Helix (damage scaling). All characters work in PvE, but these excel in different content types.",
    "guild requirements": "**GUILD REQUIREMENTS**: XYIAN Guild (ID: 213797) requires: 2 daily boss battles + donations to stay active. Inactive players are removed. Focus on daily completion for guild benefits and Peak Arena participation.",
    "Peak Arena": "**PEAK ARENA**: Requires 3 different characters with 3 different builds. Each unique item provides bonus health and damage. Best characters: Dragoon, Griffin, Thor. Focus on diverse builds and item variety for maximum bonuses.",
    "arena heroes": "**ARENA HEROES**: Best Arena heroes: Dragoon (preferred), Griffin (if full build). Avoid other heroes for competitive Arena. Focus on mobility and damage for Arena success.",
    "f2p guide": "**F2P GUIDE**: Focus on: 1) Daily boss battles, 2) Save gems for fishing event, 3) Upgrade S-tier weapons only, 4) Join active guild, 5) Complete daily quests. Avoid spending gems on basic weapons or cash-only events.",
    "beginner guide": "**BEGINNER GUIDE**: Start with Alex, focus on Oracle Staff/Griffin Claws/Dragoon Crossbow, complete daily quests, join XYIAN guild (213797), save gems for fishing event, learn resonance system at 3-star characters.",
    "meta builds": "**META BUILDS**: Current meta: Thor + Oracle Staff (mage), Demon King + Griffin Claws (tank), Rolla + Dragoon Crossbow (ranged). Focus on S-tier weapons and Legendary characters for competitive play.",
    "power leveling": "**POWER LEVELING**: Fastest progression: 1) Complete daily quests, 2) Join active guild, 3) Focus on S-tier weapons, 4) Upgrade Sacred Hall, 5) Participate in events. Avoid spreading resources too thin.",
    "gems usage": "**GEMS USAGE**: Best gem usage: 1) Save for fishing event (etched runes), 2) Orb swapping for builds, 3) Starcore upgrades, 4) Event participation. Avoid spending on basic weapons or unnecessary items.",
    "best weapon mage": "**CORRECT WEAPON INFO**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff**, **Griffin Claws**, and **Dragoon Crossbow**. For mage builds, use **Oracle Staff** - it's the best overall weapon with high damage and great range. There are also basic weapons (Bow, Staff, Claws) but they cannot level past Legendary.",
    "best weapon warrior": "**CORRECT WEAPON INFO**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff**, **Griffin Claws**, and **Dragoon Crossbow**. For warrior builds, use **Griffin Claws** - excellent for close combat with high attack speed. There are also basic weapons (Bow, Staff, Claws) but they cannot level past Legendary.",
    "best weapon archer": "**CORRECT WEAPON INFO**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff**, **Griffin Claws**, and **Dragoon Crossbow**. For archer builds, use **Dragoon Crossbow** - powerful ranged weapon, great for PvP. There are also basic weapons (Bow, Staff, Claws) but they cannot level past Legendary.",
    "thor hammer": "**IMPORTANT**: Thor's Mjolnir is NOT a weapon - it's Thor's unique ability! Thor is a character, not a weapon. The 3 S-tier weapons are Oracle Staff, Griffin Claws, and Dragoon Crossbow.",
    "what is the strongest weapon": "**CORRECT WEAPON INFO**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff**, **Griffin Claws**, and **Dragoon Crossbow**. These are the ONLY weapons that can be upgraded beyond Legendary. All other weapons (basic Bow, Staff, Claws) cannot level past Legendary and are inferior.",
    "mjolnir": "**IMPORTANT**: Mjolnir is NOT a weapon - it's Thor's unique ability! Thor is a character, not a weapon. The 3 S-tier weapons are Oracle Staff, Griffin Claws, and Dragoon Crossbow.",
    "scythe": "**FALSE INFORMATION**: There are NO scythes in Archero 2. This is incorrect information from fake guides. The only weapons are the 3 S-tier weapons: Oracle Staff, Griffin Claws, and Dragoon Crossbow, plus basic weapons that can't level past Legendary.",
    "sword": "**FALSE INFORMATION**: There are NO swords in Archero 2. This is incorrect information from fake guides. The only weapons are the 3 S-tier weapons: Oracle Staff, Griffin Claws, and Dragoon Crossbow, plus basic weapons that can't level past Legendary.",
    "windforce": "**FALSE INFORMATION**: Windforce Bow does NOT exist in Archero 2. This is incorrect information from fake guides. The only weapons are the 3 S-tier weapons: Oracle Staff, Griffin Claws, and Dragoon Crossbow, plus basic weapons that can't level past Legendary.",
    "demon blade": "**FALSE INFORMATION**: Demon Blade does NOT exist in Archero 2. This is incorrect information from fake guides. The only weapons are the 3 S-tier weapons: Oracle Staff, Griffin Claws, and Dragoon Crossbow, plus basic weapons that can't level past Legendary.",
    "staff of light": "**FALSE INFORMATION**: Staff of Light does NOT exist in Archero 2. This is incorrect information from fake guides. The only weapons are the 3 S-tier weapons: Oracle Staff, Griffin Claws, and Dragoon Crossbow, plus basic weapons that can't level past Legendary.",
    
    // RUNES AND EQUIPMENT
    "runes": "**Rune System**: Main hand etched rune is best for DPS. Focus on upgrading your main hand rune first as it provides the highest damage output. Other runes provide different bonuses but main hand is priority.",
    
    // CHARACTERS - CORRECTED INFORMATION
    "thor": "**Thor** - Legendary character with unique abilities: move while firing, weapon detach ability, summon hammers, and lightning damage. Thor's Mjolnir is his ability, NOT a weapon. One of the best characters for high-level play.",
    "demon king": "**Demon King** - Epic character with shield abilities. As you level up, the shield gets more powerful. His skins are really useful because they add abilities to his shield. Great for defensive builds.",
    "rolla": "**Rolla** - Epic character with freeze attacks and crit damage boost. One of the best characters for resonance (3-star slot). Freeze is vital for PvP and makes Rolla essential for competitive play.",
    "dracoola": "**Dracoola** - Epic character with life steal on hit chance. Good for survivability builds and sustained combat.",
    "seraph": "**Seraph** - Epic character for PvE only. Has good bonuses like getting extra ability chance when picking health for angels. Not recommended for PvP.",
    "loki": "**Loki** - Epic character, PvP specific. Acquired from PvP and has attack speed boost when he moves (chance). One of the best for 6-star resonance slot.",
    "alex": "**Alex** - Starting hero with good basic abilities and red heart drop increase. Solid beginner character but outclassed by higher tier characters.",
    "nyanja": "**Nyanja** - Little ninja cat with increased speed and cloudfooted ability which damages and pushes enemies away. Good for mobility builds.",
    "helix": "**Helix** - Gets more damage as he gets damaged. Strong DPS character, good for 3-star resonance slot.",
    "hela": "**Hela** - Really good character with healing aura and damage boost. At max stars has really important crowd control cleanse. Excellent support character.",
    "otta": "**Otta** - High-level character option for 6-star resonance slot. Powerful but requires significant investment.",
    
    // RESONANCE SYSTEM
    "resonance": "**Resonance System**: 3-star unlocks first resonance slot, 6-star unlocks second resonance slot. Higher character levels = stronger resonance effects. Best 3-star: Rolla (freeze is vital), Helix (strong DPS), Thor (legendary option). Best 6-star: Loki (top choice), Demon King (shield specialist), Otta (high-level option).",
    "3 star resonance": "**3-Star Resonance (First Slot)**: Rolla ⭐⭐⭐ - BEST (freeze is vital), Helix ⭐⭐⭐ - Strong DPS, Thor ⭐⭐⭐ - Legendary option. Use highest star character as primary.",
    "6 star resonance": "**6-Star Resonance (Second Slot)**: Loki ⭐⭐⭐⭐⭐⭐ - TOP CHOICE (PvP specialist), Demon King ⭐⭐⭐⭐⭐⭐ - Shield specialist, Otta ⭐⭐⭐⭐⭐⭐ - High-level option.",
    "character levels": "**Character Levels**: Higher character levels = stronger resonance effects. Level 7 Rolla >> 3-star Rolla for resonance power. Focus on leveling your main characters for maximum effectiveness.",
    
    // GAME MECHANICS
    "orbs": "**Orb System**: Orbs provide elemental bonuses and can be swapped for different effects. Fire orbs boost damage, Ice orbs provide slow effects, Lightning orbs chain damage, Poison orbs add DoT, Dark orbs increase critical chance. Swapping costs gems but provides massive build flexibility.",
    "starcores": "**Starcore System**: Razor starcore upgrades provide significant stat boosts. Focus on upgrading starcores that match your build type and character abilities for maximum effectiveness.",
    "skins": "**Skin System**: Skins provide unique abilities beyond cosmetic changes. Demon King's skins enhance shield capabilities, Thor's skins improve lightning damage. Skins can significantly impact character performance.",
    "sacred hall": "**Sacred Hall vs Tier Up**: Sacred Hall focuses on character-specific bonuses and abilities, while Tier Up improves overall stats and progression. Choose based on your build strategy and character focus.",
    "tier up": "**Tier Up vs Sacred Hall**: Tier Up improves overall character stats and progression, while Sacred Hall provides character-specific bonuses and abilities. Both are important for character development.",
    
    "how to get more power": "To increase your power level: 1) Upgrade your weapons and armor, 2) Level up your character, 3) Enhance your runes, 4) Complete daily quests, 5) Join a guild for bonuses, 6) Participate in events for rewards.",
    "best skills": "Top skills to prioritize: 1) Multi-shot (increases projectiles), 2) Ricochet (bounces between enemies), 3) Piercing (passes through enemies), 4) Bouncy Wall (bounces off walls), 5) Side Arrow (additional projectiles).",
    "guild requirements": "Daily guild requirements: • Complete 2 Boss Battles • Make 1 Guild Donation • Maintain active participation. Use !boss and !donate to record your progress.",
    "how to join guild": "To join XYIAN OFFICIAL guild: 1) Be level 50+ in Archero 2, 2) Have 300k+ power, 3) Be active daily, 4) Complete 2 boss battles per day, 5) Make 1 guild donation per day. Guild ID: 213797",
    "umbral tempest": "Umbral Tempest Event Tips: 1) Use high DPS builds, 2) Focus on area damage skills, 3) Save your ultimate for boss phases, 4) Join with guild members for better rewards, 5) Complete daily event quests for maximum rewards.",
    "best build": "Best build depends on your class: Warrior - Demon Blade + defensive skills, Mage - Staff of Light + magical skills, Archer - Windforce + mobility skills. Focus on synergy between your weapon and chosen skills.",
    "daily reset": "Daily reset happens at 5:00 PM Pacific Time. Remember to complete your daily quests, boss battles, and guild donations before reset to maximize your rewards!",
    "arena": "Arena is a fully automated PvP mode where you select heroes and gear, then AI handles combat. Winning increases ladder points, losses decrease them. Rewards include gold, scrolls, and Arena Exchange Tickets based on your PvP tier and ranking.",
    "Peak Arena": "Peak Arena is the ultimate PvP challenge requiring 3 different characters with 3 different builds. Each different item provides bonus health and damage. Top 40% of players remain in Supreme Rank weekly, others are demoted. Only the most skilled players with optimal builds can consistently win.",
    "arena vs Peak Arena": "Both are fully automated PvP modes. Arena is accessible to most players with decent rewards. Peak Arena requires 3-character team composition with different builds and items for maximum bonuses. Peak Arena has much higher difficulty but offers the best rewards and exclusive items.",
    "arena tips": "**Arena Tips**: 1) Use **Dragoon** as your primary hero, 2) Use **Griffin** only if you have a complete Griffin build, 3) Equip Revive Rune for second chance, 4) Prioritize ranged attack enhancements, 5) Focus on S-tier gear upgrades, 6) Complete daily arena runs, 7) Aim for top 15 in bracket for tier advancement. Dragoon excels with mobility builds, while Griffin dominates with full build optimization.",
    "Peak Arena tips": "**Peak Arena Tips**: 1) Use **3 different characters** with **3 different builds**, 2) Each different item provides **bonus health and damage**, 3) Dragoon + Griffin + third hero recommended, 4) Revive Rune is essential (50% chance to revive with half HP), 5) Maximize item diversity for stat bonuses, 6) Focus on Multi-shot, Ricochet, Piercing skills, 7) Only top 1% players compete here. Best characters: Dragoon (mobility), Griffin (damage), Thor (lightning), Demon King (defensive).",
    "Peak Arena rules": "Peak Arena Rules: 1) Must use 3 different characters, 2) Must use 3 different builds (can use same character but different items), 3) Each different item provides bonus health and damage, 4) Top 40% of players remain in Supreme Rank weekly, 5) 60% are demoted each week, 6) No player limit in Supreme Rank.",
    "team composition": "Peak Arena Team Composition: 1) Use 3 different characters, 2) Each character needs different build, 3) Maximize item diversity for bonuses, 4) Recommended: Dragoon + Griffin + third hero, 5) Balance damage and survivability, 6) Each unique item type adds health and damage.",
    "item bonuses": "Item Bonus System: 1) Each different item type provides bonus health, 2) Each different item type provides bonus damage, 3) Different item combinations provide additional synergy effects, 4) Mix and match for maximum stat gains, 5) Focus on item diversity over duplicates.",
    "best arena heroes": "**Top Arena Heroes**: 1) **Dragoon** - The absolute best Arena hero, 2) **Griffin** - Only use if you have a complete Griffin build, 3) Avoid other heroes for competitive Arena. Dragoon is the clear #1 choice for both Arena and Peak Arena.",
    "arena runes": "**Best Arena Runes**: 1) **Revive Rune** (essential for second chance), 2) **Guardian Rune** (solid alternative), 3) **Flame Knock Touch Rune** (good backup). Focus on runes that enhance ranged attacks and survivability.",
    "pvp": "**PvP Strategy**: Focus on mobility, positioning, and timing. Use characters like **Loki** (PvP specialist), **Dragoon** (mobility), or **Griffin** (damage). Learn enemy patterns and save ultimates for key moments. Arena and Peak Arena are fully automated PvP modes.",
    "pve": "**PvE Strategy**: Use characters like **Seraph** (PvE bonuses), **Thor** (lightning damage), or **Demon King** (defensive). Focus on area damage skills and survivability for longer runs. Seraph provides extra ability chances when picking health.",
    "best pvp characters": "**Best PvP Characters**: 1) **Loki** - PvP specialist with attack speed boost, 2) **Dragoon** - Mobility and positioning, 3) **Griffin** - High damage output, 4) **Thor** - Lightning abilities and move-while-firing, 5) **Demon King** - Defensive shield abilities.",
    "best pve characters": "**Best PvE Characters**: 1) **Seraph** - PvE bonuses and extra ability chances, 2) **Thor** - Legendary with powerful abilities, 3) **Demon King** - Defensive shield for survivability, 4) **Rolla** - Freeze attacks for crowd control, 5) **Hela** - Healing aura and crowd control cleanse.",
    "arena rewards": "Arena Rewards: Daily rewards based on PvP tier and ranking include gold, scrolls, and Arena Exchange Tickets. Use Arena Exchange Tickets in the Arena Shop for exclusive items. Rankings reset each season with tier advancement opportunities.",
    "arena ranking": "Arena Ranking: Winning matches increases ladder points, losses decrease them. Stronger opponents yield more points. Aim for top 15 in your bracket by season's end for tier advancement. Rankings reset each season."
};

// Daily tips database
const dailyTips = [
    "💡 **Pro Tip**: Always complete your daily quests before reset - they give massive XP and gold rewards!",
    "⚔️ **Combat Tip**: Use the environment to your advantage - walls can help you dodge projectiles and funnel enemies!",
    "🏰 **Guild Tip**: Donate to your guild daily - the 10% shop discount adds up to huge savings over time!",
    "🎯 **Boss Tip**: Learn boss attack patterns - most bosses have predictable moves you can dodge with practice!",
    "💎 **Economy Tip**: Save your gems for weapon upgrades rather than random chests - guaranteed progress is better than RNG!",
    "🔥 **Event Tip**: Participate in all events - even small rewards add up and events often have exclusive items!",
    "⚡ **Skill Tip**: Prioritize skills that synergize with your weapon - a well-built character is stronger than high-level random skills!",
    "🛡️ **Defense Tip**: Don't ignore defensive stats - surviving longer often means more damage dealt overall!",
    "🎮 **General Tip**: Take breaks between long sessions - fresh eyes spot opportunities you might miss when tired!",
    "🌟 **Advanced Tip**: Master the art of kiting - keeping enemies at optimal range maximizes your damage while minimizing theirs!"
];

// Arena tips database (research-based)
    const arenaTips = [
        "🏟️ **Arena Hero Selection**: Dragoon is the top Arena hero! Use Griffin only if you have a complete Griffin build!",
        "⚔️ **Arena Automation**: Arena battles are fully automated - select your best hero and gear, then let AI handle combat!",
        "🎯 **Arena Runes**: Equip the Revive Rune for a second chance! Guardian or Flame Knock Touch are solid alternatives!",
        "💪 **Arena Ranking**: Winning increases ladder points, losses decrease them. Stronger foes yield more points!",
        "🔥 **Arena Rewards**: Based on PvP tier and ranking - earn gold, scrolls, and Arena Exchange Tickets daily!",
        "⚡ **Arena Strategy**: Prioritize ranged attack enhancements - projectiles perform best in PvP scenarios!",
        "🛡️ **Arena Heroes**: Dragoon is #1, Griffin is #2 but only with full build. Avoid other heroes for competitive Arena!",
        "🌟 **Arena Daily**: Complete daily arena runs for consistent rewards and seasonal progression!",
        "💎 **Arena Shop**: Use Arena Exchange Tickets in the Arena Shop for exclusive items and upgrades!",
        "🏆 **Arena Seasons**: Rankings reset each season - aim for top 15 in your bracket for tier advancement!",
        "👑 **Peak Arena**: Requires 3 different characters with 3 different builds! Each unique item provides bonus health and damage!",
        "⚔️ **Supreme Team**: Use Dragoon + Griffin + third hero for optimal Peak Arena team composition!",
        "🎯 **Item Diversity**: Maximize different item types for maximum stat bonuses in Peak Arena!",
        "💪 **Supreme Ranking**: Top 40% stay in Supreme Rank weekly - 60% get demoted! Stay competitive!",
        "🔥 **Revive Rune**: Essential for Peak Arena - 50% chance to revive with half HP at Epic level!"
    ];

// Peak Arena tips database (research-based)
const supremeArenaTips = [
    "👑 **Peak Arena**: The ultimate PvP challenge requiring 3 different characters with 3 different builds!",
    "⚔️ **Supreme Team**: Use Dragoon + Griffin + third hero for optimal team composition!",
    "🎯 **Item Bonuses**: Each different item provides bonus health and damage - maximize item diversity!",
    "💪 **Supreme Rules**: Top 40% stay in Supreme Rank weekly, 60% get demoted - stay competitive!",
    "🔥 **Revive Rune**: Essential for Peak Arena - 50% chance to revive with half HP at Epic level!",
    "🌟 **Build Diversity**: Each character needs different build - can use same character but different items!",
    "🏆 **Supreme Strategy**: Balance damage and survivability across all 3 characters!",
    "💎 **Item Synergy**: Different item combinations provide additional synergy effects!",
    "⚡ **Supreme Skills**: Multi-shot, Ricochet, and Piercing are the top skills for Peak Arena!",
    "🛡️ **Supreme Defense**: Focus on survivability - you need to outlast your opponents!",
    "🎮 **Team Building**: Must use 3 different characters - no duplicates allowed!",
    "🔥 **Stat Optimization**: Mix and match items for maximum health and damage bonuses!",
    "💪 **Supreme Ranking**: No player limit in Supreme Rank - compete with the best!",
    "🌟 **Meta Adaptation**: Stay updated with current Peak Arena meta strategies!",
    "🏆 **Supreme Rewards**: The best rewards in the game - only top players compete here!"
];

// Umbral Tempest strategies
const umbralStrategies = [
    "🌙 **Umbral Tempest Strategy**: Use high DPS builds with area damage skills for maximum efficiency!",
    "⚡ **Event Tip**: Save your ultimate abilities for boss phases - they can turn the tide of battle!",
    "👥 **Team Play**: Coordinate with guild members for better rewards and faster completion!",
    "🎯 **Focus Fire**: Target elite enemies first - they drop better rewards and are easier to kill when isolated!",
    "💪 **Power Build**: Stack damage multipliers and critical hit chance for devastating combos!"
];

// Bot startup
client.once('clientReady', () => {
    console.log('🏰 XYIAN Ultimate Bot - Initializing...');
    console.log(`✅ XYIAN Ultimate Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set up daily messaging system
    setupDailyMessaging();
    
    // Set up daily reset messaging (5pm Pacific)
    setupDailyResetMessaging();
    
    console.log('✅ All systems activated!');
    
    // Manual monitoring available via !monitor-debug command
});

// Daily messaging system
function setupDailyMessaging() {
    console.log('📅 Starting daily messaging system...');
    
    // Set up daily schedule (every 24 hours) - NO initial messages on startup
    const dailyInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    setInterval(() => {
        sendDailyMessages();
        sendGuildRecruitmentSchedule(); // Every other day recruitment
    }, dailyInterval);
    
    console.log('✅ Daily messaging schedule set!');
}

// Daily reset messaging (5pm Pacific)
function setupDailyResetMessaging() {
    console.log('🔄 Setting up daily reset messaging (5pm Pacific)...');
    
    // Calculate time until next 5pm Pacific
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    
    // Set target time to 5pm Pacific today or tomorrow
    const targetTime = new Date(pacificTime);
    targetTime.setHours(17, 0, 0, 0); // 5:00 PM
    
    if (targetTime <= pacificTime) {
        targetTime.setDate(targetTime.getDate() + 1); // Tomorrow
    }
    
    const timeUntilReset = targetTime.getTime() - pacificTime.getTime();
    
    // Set timeout for next reset
    setTimeout(() => {
        sendDailyResetMessages();
        // Then set up recurring daily reset
        setInterval(sendDailyResetMessages, 24 * 60 * 60 * 1000);
    }, timeUntilReset);
    
    console.log(`✅ Daily reset messaging set for 5pm Pacific!`);
}

// Removed sendInitialMessages function - no longer sending messages on startup

// Send daily messages
async function sendDailyMessages() {
    console.log('📅 Sending daily messages...');
    
    // Send daily tip
    await sendDailyTip();
    
    // Send expedition message
    await sendExpeditionMessage();
    
    // Send arena tip
    await sendArenaTip();
    
    console.log('✅ Daily messages sent!');
}

// Send guild recruitment every other day
let recruitDayCounter = 0;
async function sendGuildRecruitmentSchedule() {
    console.log('📅 Checking guild recruitment schedule...');
    
    recruitDayCounter++;
    
    // Send every other day (day 2, 4, 6, etc.)
    if (recruitDayCounter % 2 === 0) {
        await sendGuildRecruitment();
        console.log('✅ Guild recruitment sent (every other day)');
    } else {
        console.log('⏭️ Skipping guild recruitment (not recruitment day)');
    }
}

// Send daily reset messages
async function sendDailyResetMessages() {
    console.log('🔄 Sending daily reset messages...');
    
    // Guild reset message
    await sendGuildResetMessage();
    
    // General reset message
    await sendGeneralResetMessage();
    
    console.log('✅ Daily reset messages sent!');
}

// Guild reset messages with fun facts
const guildResetMessages = [
    {
        title: '🔄 Daily Reset - XYIAN Guild',
        description: '**Daily reset is here! Time to get back to business!**\n\n⚔️ **Remember your daily requirements:**\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Stay active and engaged\n\n💪 **Let\'s show everyone why XYIAN is the best guild!**',
        funFact: '💡 **Fun Fact**: Did you know that completing daily boss battles gives you 2x the normal rewards? That\'s why it\'s so important!'
    },
    {
        title: '⏰ Reset Time - XYIAN Guild',
        description: '**New day, new opportunities! Don\'t forget your daily requirements!**\n\n⚔️ **Daily Checklist:**\n• 2 Boss Battles (10-15 minutes)\n• 1 Guild Donation (helps everyone)\n• Stay active in chat\n\n🏆 **XYIAN Excellence**: We maintain our top ranking through daily dedication!',
        funFact: '💡 **Fun Fact**: The 5 PM Pacific reset time was chosen because it\'s 8 PM Eastern and 1 AM GMT - covering most time zones!'
    },
    {
        title: '🌅 Fresh Start - XYIAN Guild',
        description: '**Another day to prove you\'re XYIAN material! Complete those dailies!**\n\n⚔️ **Your Mission:**\n• Boss battles (2x rewards)\n• Guild donations (teamwork)\n• Stay engaged (community)\n\n💪 **Together we\'re stronger!**',
        funFact: '💡 **Fun Fact**: Guild members who consistently complete dailies have a 40% higher chance of getting rare drops from events!'
    },
    {
        title: '⚡ Reset Alert - XYIAN Guild',
        description: '**Time to sharpen your skills! Complete your boss battles and donations!**\n\n⚔️ **Daily Requirements:**\n• 2 Boss Battles (prove your skill)\n• 1 Guild Donation (support the team)\n• Stay active (be part of the family)\n\n🎯 **Pro tip**: Complete your requirements early to avoid missing out on rewards!',
        funFact: '💡 **Fun Fact**: Boss battles reset at the same time daily, but the bosses get slightly stronger each week to keep things challenging!'
    },
    {
        title: '🌟 New Day Dawns - XYIAN Guild',
        description: '**Fresh opportunities await! Don\'t miss your daily requirements!**\n\n⚔️ **XYIAN Standards:**\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Stay active and engaged\n\n🏆 **Let\'s maintain our top 100 global ranking!**',
        funFact: '💡 **Fun Fact**: The guild donation system was designed to encourage teamwork - every donation helps the entire guild grow stronger!'
    }
];

// Guild reset message
async function sendGuildResetMessage() {
    let title = '';
    let description = '';
    let funFact = '';
    
    // Try AI first, then fallback to database
    if (AIService) {
        try {
            const aiMessage = await generateDailyMessage('guild');
            if (aiMessage) {
                // Parse AI response (simple parsing)
                const lines = aiMessage.split('\n').filter(line => line.trim());
                title = lines[0] || '🔄 Daily Reset - XYIAN Guild';
                description = lines.slice(1).join('\n') || '**Daily reset is here! Time to get back to business!**';
                funFact = '💡 **XYIAN AI Generated**: This message was created by our AI using comprehensive XYIAN knowledge!';
            }
        } catch (error) {
            console.error('❌ AI daily message error:', error);
        }
    }
    
    // Fallback to comprehensive database if AI didn't work
    if (!title) {
        // Get random guild-related tip from our comprehensive database
        const guildKeys = Object.keys(archeroDatabase).filter(key => 
            key.includes('guild') || key.includes('boss') || key.includes('donation') || 
            key.includes('daily') || key.includes('requirement') || key.includes('battle')
        );
        
        if (guildKeys.length > 0) {
            const randomKey = guildKeys[Math.floor(Math.random() * guildKeys.length)];
            const guildTip = archeroDatabase[randomKey];
            
            title = '🔄 Daily Reset - XYIAN Guild';
            description = `**Daily reset is here! Time to get back to business!**\n\n⚔️ **Remember your daily requirements:**\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Stay active and engaged\n\n💪 **Let's show everyone why XYIAN is the best guild!**`;
            funFact = `💡 **XYIAN Tip**: ${guildTip}`;
        } else {
            // Ultimate fallback to hardcoded
            const randomMessage = guildResetMessages[Math.floor(Math.random() * guildResetMessages.length)];
            title = randomMessage.title;
            description = randomMessage.description;
            funFact = randomMessage.funFact;
        }
    }
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields({ name: 'Did You Know?', value: funFact, inline: false })
        .setColor(0xFF6B35) // Orange for reset
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Daily Reset' });

    await sendToXYIAN({ embeds: [embed] });
}

// General reset messages with fun facts
const generalResetMessages = [
    {
        title: '🎉 Happy Daily Reset!',
        description: '**A new day, new opportunities to level up!**\n\n✨ **What\'s new today:**\n• Fresh daily quests with great rewards\n• New challenges to conquer\n• Another chance to improve your build\n• More opportunities to earn gold and XP\n\n🎮 **Ready to dominate today\'s challenges?**',
        funFact: '💡 **Fun Fact**: Daily quests give 3x more XP than regular gameplay - that\'s why they\'re so valuable for progression!'
    },
    {
        title: '🌅 New Day, New Adventures!',
        description: '**Fresh start! Time to make today count!**\n\n✨ **Today\'s opportunities:**\n• New daily quests await\n• Fresh challenges to tackle\n• Another chance to perfect your build\n• More gold and XP to earn\n\n🚀 **Let\'s make today legendary!**',
        funFact: '💡 **Fun Fact**: The daily reset happens at 5 PM Pacific because that\'s when most players are active after work/school!'
    },
    {
        title: '⚡ Reset Time - Fresh Start!',
        description: '**Another day, another chance to improve!**\n\n✨ **What awaits today:**\n• Brand new daily quests\n• Exciting challenges ahead\n• Opportunities to upgrade your build\n• Tons of rewards to earn\n\n💪 **Ready to level up today?**',
        funFact: '💡 **Fun Fact**: Players who complete all daily quests for 7 days straight get a special \'Perfect Week\' bonus with extra rewards!'
    },
    {
        title: '🌟 Daily Reset - New Possibilities!',
        description: '**A fresh day brings fresh opportunities!**\n\n✨ **Today\'s highlights:**\n• Fresh daily quests with amazing rewards\n• New challenges to master\n• Another chance to optimize your build\n• More resources to collect\n\n🎯 **Time to show what you\'re made of!**',
        funFact: '💡 **Fun Fact**: The game\'s daily reset system was designed to give players a fresh start every day - no matter how yesterday went!'
    },
    {
        title: '🔄 Reset Alert - New Day!',
        description: '**Time to turn the page and start fresh!**\n\n✨ **What\'s in store today:**\n• New daily quests with great rewards\n• Fresh challenges to overcome\n• Another opportunity to build your character\n• More gold and XP to gain\n\n🏆 **Let\'s make today count!**',
        funFact: '💡 **Fun Fact**: Daily quests are designed to take about 30-45 minutes total - perfect for a focused gaming session!'
    }
];

// General reset message using AI and comprehensive database
async function sendGeneralResetMessage() {
    let title = '';
    let description = '';
    let funFact = '';
    
    // Try AI first, then fallback to database
    if (AIService) {
        try {
            const aiMessage = await generateDailyMessage('general');
            if (aiMessage) {
                // Parse AI response (simple parsing)
                const lines = aiMessage.split('\n').filter(line => line.trim());
                title = lines[0] || '🎉 Happy Daily Reset!';
                description = lines.slice(1, -1).join('\n') || '**A new day, new opportunities to level up!**';
                funFact = lines[lines.length - 1] || '💡 **XYIAN AI Generated**: This message was created by our AI using comprehensive XYIAN knowledge!';
            }
        } catch (error) {
            console.error('❌ AI daily message error:', error);
        }
    }
    
    // Fallback to comprehensive database if AI didn't work
    if (!title) {
        // Get random tip from our comprehensive database
        const tipKeys = Object.keys(archeroDatabase);
        const randomKey = tipKeys[Math.floor(Math.random() * tipKeys.length)];
        const tip = archeroDatabase[randomKey];
        
        title = '🎉 Happy Daily Reset!';
        description = '**A new day, new opportunities to level up!**\n\n✨ **What\'s new today:**\n• Fresh daily quests with great rewards\n• New challenges to conquer\n• Another chance to improve your build\n• More opportunities to earn gold and XP\n\n🎮 **Ready to dominate today\'s challenges?**';
        funFact = `💡 **Daily Tip**: ${tip}`;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields({ name: 'Did You Know?', value: funFact, inline: false })
        .setColor(0x00FF88) // Green for positivity
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts - Daily Reset' });

    await sendToGeneral({ embeds: [embed] });
}

// Send daily tip using high-quality cleaned database
async function sendDailyTip() {
    // Try to load high-quality tips first
    const tipsFile = path.join(__dirname, 'data', 'high-quality-tips.json');
    let tip = '';
    
    if (fs.existsSync(tipsFile)) {
        try {
            const tips = JSON.parse(fs.readFileSync(tipsFile, 'utf8'));
            if (tips.length > 0) {
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                tip = `**${randomTip.category.toUpperCase()} TIP:** ${randomTip.tip}`;
            }
        } catch (error) {
            console.log('⚠️ Could not load high-quality tips, using fallback');
        }
    }
    
    // Fallback to database entries if no tips available
    if (!tip) {
        const tipKeys = Object.keys(archeroDatabase);
        if (tipKeys.length > 0) {
            const randomKey = tipKeys[Math.floor(Math.random() * tipKeys.length)];
            tip = archeroDatabase[randomKey];
        } else {
            tip = 'Focus on upgrading your main weapon first - it provides the most DPS increase!';
        }
    }
    
    const embed = new EmbedBuilder()
        .setTitle('💡 Daily Archero 2 Tip')
        .setDescription(tip)
        .setColor(0x00BFFF) // Light blue
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - High-Quality Tips' });

    await sendToGeneral({ embeds: [embed] });
}

// Send guild recruitment
async function sendGuildRecruitment() {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN OFFICIAL - Guild Recruitment')
        .setDescription(`**Guild ID: 213797**\n\n**We're looking for dedicated players to join our elite community!**\n\n✨ **What we offer:**\n• Active daily community\n• Expert strategies and guides\n• Guild events and challenges\n• 10% discount on guild shop items\n• Supportive and friendly environment\n\n🎯 **Requirements:**\n• Daily participation in guild activities\n• 2 Boss Battles per day\n• 1 Guild Donation per day\n• Active in Discord community\n\n💪 **Power Level:** 300k+ recommended\n\n**Ready to join the elite? Apply now!**`)
        .setColor(0xFFA500) // Gold color
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

    await sendToRecruit({ embeds: [embed] });
}

// Send general welcome
async function sendGeneralWelcome() {
    const embed = new EmbedBuilder()
        .setTitle('🎉 Welcome to XYIAN OFFICIAL!')
        .setDescription('**Your premier Archero 2 community is now enhanced with daily content!**\n\n✨ **What to expect:**\n• Daily tips and strategies\n• Event reminders and guides\n• Community discussions\n• Guild recruitment updates\n\n🎮 **Ready to level up your game?**\nAsk questions, share builds, and connect with fellow players!')
        .setColor(0x00ff88)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

    await sendToGeneral({ embeds: [embed] });
}

// Send guild expedition message
async function sendExpeditionMessage() {
    // Get expedition-related tip from our comprehensive database
    const expeditionKeys = Object.keys(archeroDatabase).filter(key => 
        key.includes('expedition') || key.includes('guild') || key.includes('battle') || 
        key.includes('strategy') || key.includes('team') || key.includes('coordination')
    );
    
    let expeditionTip = 'Focus on high-value targets and coordinate with guild members for maximum efficiency!';
    if (expeditionKeys.length > 0) {
        const randomKey = expeditionKeys[Math.floor(Math.random() * expeditionKeys.length)];
        expeditionTip = archeroDatabase[randomKey];
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN Guild Expedition')
        .setDescription('**Ready for another day of conquest and glory!**\n\n⚔️ **Expedition Focus:**\n• Complete daily expedition challenges\n• Maximize guild contribution points\n• Unlock rare rewards and materials\n• Support your fellow guild members\n\n🎯 **Today\'s Strategy:**\n• Focus on high-value targets\n• Coordinate with guild members\n• Use optimal builds for each stage\n• Share discoveries and tips\n\n💪 **Let\'s show everyone why XYIAN is the best!**')
        .addFields({ name: '💡 Expedition Tip', value: expeditionTip, inline: false })
        .setColor(0x8A2BE2) // Purple for expedition
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Guild Expedition' });

    await sendToExpedition({ embeds: [embed] });
}

// Send arena tip using comprehensive database
async function sendArenaTip() {
    // Get arena-related tips from our comprehensive database
    const arenaKeys = Object.keys(archeroDatabase).filter(key => 
        key.includes('arena') || key.includes('pvp') || key.includes('supreme') || 
        key.includes('ranking') || key.includes('rewards') || key.includes('strategy')
    );
    
    let arenaTip = 'Focus on speed and efficiency in Arena, perfect execution in Peak Arena!';
    let supremeTip = 'Peak Arena offers the best rewards but requires flawless strategy!';
    
    if (arenaKeys.length > 0) {
        const randomKey1 = arenaKeys[Math.floor(Math.random() * arenaKeys.length)];
        arenaTip = archeroDatabase[randomKey1];
        
        if (arenaKeys.length > 1) {
            const randomKey2 = arenaKeys[Math.floor(Math.random() * arenaKeys.length)];
            supremeTip = archeroDatabase[randomKey2];
        }
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🏟️ Daily Arena Tips')
        .setDescription(`**Arena & Peak Arena Strategies**\n\n${arenaTip}\n\n${supremeTip}\n\n💪 **Key Differences:**\n• **Arena**: Focus on speed and efficiency\n• **Peak Arena**: Ultimate challenge requiring perfect execution\n• **Rewards**: Peak Arena offers the best rewards\n• **Strategy**: Both require high DPS and optimal positioning`)
        .setColor(0xFF4500) // Orange for arena
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arena Tips' });

    await sendToArena({ embeds: [embed] });
}

// Webhook sending functions
async function sendToXYIAN(content) {
    if (!webhooks.xyian) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.xyian });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send XYIAN message:', error.message);
    }
}

async function sendToGeneral(content) {
    if (!webhooks.general) {
        console.error('❌ GENERAL_CHAT_WEBHOOK not configured - welcome messages will not be sent!');
        return;
    }
    
    try {
        const webhook = new WebhookClient({ url: webhooks.general });
        await webhook.send(content);
        console.log('✅ Message sent to general chat successfully');
    } catch (error) {
        console.error('❌ Failed to send general message:', error.message);
    }
}

async function sendToRecruit(content) {
    if (!webhooks.recruit) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.recruit });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send recruitment message:', error.message);
    }
}

async function sendToExpedition(content) {
    if (!webhooks.expedition) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.expedition });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send expedition message:', error.message);
    }
}

async function sendToArena(content) {
    if (!webhooks.arena) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.arena });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send arena message:', error.message);
    }
}

async function sendToAIQuestions(content) {
    if (!webhooks.aiQuestions) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.aiQuestions });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send AI questions message:', error.message);
    }
}

// Send message to Umbral Tempest channel
async function sendToUmbralTempest(content) {
    if (!webhooks.umbralTempest) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.umbralTempest });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send Umbral Tempest message:', error.message);
    }
}

// Send message to Gear and Rune Loadouts channel
async function sendToGearRuneLoadouts(content) {
    if (!webhooks.gearRuneLoadouts) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.gearRuneLoadouts });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send Gear and Rune Loadouts message:', error.message);
    }
}

// Send message to Admin channel (for errors and system messages)
async function sendToAdmin(content) {
    if (!webhooks.admin) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.admin });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send admin message:', error.message);
    }
}

// Q&A function
function getAnswer(question) {
    const lowerQuestion = question.toLowerCase();
    
    for (const [key, answer] of Object.entries(archeroQA)) {
        if (lowerQuestion.includes(key)) {
            return answer;
        }
    }
    
    return null;
}

// Role checking functions
function hasXYIANRole(member) {
    return member.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
}

function hasXYIANGuildVerified(member) {
    return member.roles.cache.some(role => role.name === 'XYIAN Guild Verified');
}

function hasAdminRole(member) {
    return member.roles.cache.some(role => role.name === 'Admin');
}

function hasSupremeArenaRole(member) {
    return member.roles.cache.some(role => role.name === 'Peak Arena');
}

function hasUmbralTempestRole(member) {
    return member.roles.cache.some(role => role.name === 'Umbral Tempest');
}

function hasServerBoosterRole(member) {
    return member.roles.cache.some(role => role.name === 'Server Booster');
}

// Check if user can access basic features (any verified role)
function hasBasicAccess(member) {
    return hasXYIANRole(member) || 
           hasXYIANGuildVerified(member) || 
           hasAdminRole(member) ||
           hasServerBoosterRole(member);
}

// Response tracking to prevent duplicates
const responseTracker = new Map();

// Helper function to track and prevent duplicate responses
function trackResponse(message, responseType = 'unknown') {
    const messageKey = `${message.id}_${message.author.id}_${message.channel.id}`;
    const tracker = responseTracker.get(messageKey);
    
    if (!tracker) {
        console.log(`⚠️ RESPONSE TRACKING ERROR: No tracker found for message ${message.id}`);
        return false;
    }
    
    if (tracker.responseCount >= 1) {
        console.log(`⚠️ DUPLICATE RESPONSE BLOCKED: Already sent ${tracker.responseCount} responses for message ${message.id} (${responseType})`);
        
        // Log this as a correction - preventing duplicate responses
        logCorrection(
            `Duplicate ${responseType} command from ${message.author.username}`,
            "Response blocked - duplicate prevention system activated",
            "Duplicate response prevention - system working correctly"
        );
        
        return false;
    }
    
    tracker.responseCount++;
    console.log(`✅ RESPONSE TRACKED: ${responseType} response #${tracker.responseCount} for message ${message.id}`);
    return true;
}

// Helper function to log corrections to admin webhook
async function logCorrection(originalMessage, correction, reason) {
    try {
        const correctionEmbed = new EmbedBuilder()
            .setTitle('🔧 Bot Correction Logged')
            .setColor(0xFF6B35)
            .addFields(
                { name: '📝 Original Message', value: originalMessage, inline: false },
                { name: '✅ Correction Applied', value: correction, inline: false },
                { name: '📊 Reason', value: reason, inline: false },
                { name: '⏰ Timestamp', value: new Date().toISOString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot - Correction System' });
        
        await sendToAdmin({ embeds: [correctionEmbed] });
        console.log(`🔧 CORRECTION LOGGED: ${reason} - Original: "${originalMessage}" -> Corrected: "${correction}"`);
    } catch (error) {
        console.error('❌ Failed to log correction:', error);
    }
}

// Message handling with error protection
// Bot ready event
client.once('ready', () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`🏰 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Watching ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} members`);
    
    // Check webhook configuration
    console.log('🔧 Webhook Configuration:');
    console.log(`  • General Chat: ${webhooks.general ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  • XYIAN Guild: ${webhooks.xyian ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  • AI Questions: ${webhooks.aiQuestions ? '✅ Configured' : '❌ Missing'}`);
    
    if (!webhooks.general) {
        console.error('⚠️ WARNING: GENERAL_CHAT_WEBHOOK not set - welcome messages will NOT work!');
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Create unique key for this message
    const messageKey = `${message.id}_${message.author.id}_${message.channel.id}`;
    
    // Check if we've already responded to this message
    if (responseTracker.has(messageKey)) {
        console.log(`⚠️ DUPLICATE RESPONSE PREVENTED for message ${message.id} from ${message.author.username}`);
        return;
    }
    
    // Mark this message as being processed with response count
    responseTracker.set(messageKey, { processed: true, responseCount: 0 });
    
    // Clean up old entries (keep only last 1000)
    if (responseTracker.size > 1000) {
        const firstKey = responseTracker.keys().next().value;
        responseTracker.delete(firstKey);
    }
    
    // Debug logging to track duplicate responses
    console.log(`🔍 Message received: ${message.content} from ${message.author.username} in ${message.channel.name} - VERSION 2.0`);
    
    // SPAM FILTER - Check if we've already responded to this message (using same system as responseTracker)
    const spamKey = `${message.id}_${message.channel.id}`;
    if (messageResponseTracker.has(spamKey)) {
        console.log(`🚫 SPAM FILTER: Already responded to message ${message.id} in ${message.channel.name} - BLOCKING`);
        return;
    }
    
    // ==================== CRITICAL GATE: ONLY AI CHANNELS GET LIVE RESPONSES ====================
    const isCommand = message.content.startsWith('!') || message.content.startsWith('/');
    const isDM = message.channel.type === 1;
    
    // Check if this is the specific AI questions channel (by ID for security)
    const isAIChannel = message.channel.id === AI_QUESTIONS_CHANNEL_ID || 
                       message.channel.name === 'arch-ai';
    
    // IGNORE these channels completely (no responses at all) - ONLY CRON JOBS ALLOWED
    const ignoreChannels = ['guild-recruit-chat', 'xyian-guild', 'guild-chat', 'recruit', 'guild-recruit', 'guild-recruit-chat', 'guild-recruit'];
    if (ignoreChannels.includes(message.channel.name)) {
        console.log(`⏭️ IGNORING: Channel ${message.channel.name} is in ignore list - ONLY CRON JOBS ALLOWED`);
        return;
    }
    
    // ADDITIONAL SAFETY: Check if channel contains "recruit" in the name
    if (message.channel.name.toLowerCase().includes('recruit')) {
        console.log(`⏭️ IGNORING: Channel ${message.channel.name} contains 'recruit' - ONLY CRON JOBS ALLOWED`);
        return;
    }
    
    // CRITICAL: Check channel ID for guild recruit channel
    if (message.channel.id === '1419944464608268410') {
        console.log(`⏭️ IGNORING: Guild recruit channel by ID - ONLY CRON JOBS ALLOWED`);
        return;
    }
    
    // GENERAL CHAT - Only respond to !help and !menu, direct to AI chat for questions
    const generalChatChannels = ['general', 'general-chat', 'main-chat', 'arch-2-addicts'];
    if (generalChatChannels.includes(message.channel.name)) {
        if (message.content.startsWith('!help') || message.content.startsWith('!menu')) {
            // Allow these commands
        } else {
            console.log(`⏭️ IGNORING: General chat - only !help and !menu allowed, direct to AI chat for questions`);
            return;
        }
    }
    
    // ADDITIONAL SAFETY: Check if channel contains "general" in the name
    if (message.channel.name.toLowerCase().includes('general')) {
        if (!message.content.startsWith('!help') && !message.content.startsWith('!menu')) {
            console.log(`⏭️ IGNORING: General chat - only !help and !menu allowed`);
            return;
        }
    }
    
    // CRITICAL: ONLY AI CHANNELS CAN HAVE LIVE RESPONSES WITHOUT COMMANDS
    if (!isCommand && !isDM && !isAIChannel) {
        console.log(`⏭️ IGNORING: Not a command, not DM, not AI channel (${message.channel.name}) - ONLY AI CHANNELS GET LIVE RESPONSES`);
        return;
    }
    
    // Check AI toggle for AI channel responses
    if (isAIChannel && !isCommand && !aiResponseEnabled) {
        console.log(`⏭️ AI RESPONSES DISABLED: AI responses are currently turned off`);
        return;
    }
    // ==================== END GATE ====================
    
    // Handle Direct Messages
    if (message.channel.type === 1) { // DM channel
        console.log(`💬 DM from ${message.author.username} (ID: ${message.author.id}): ${message.content}`);
        console.log(`💬 Channel type: ${message.channel.type}, Channel ID: ${message.channel.id}`);
        
        // Special test for XYIAN user
        if (message.author.id === '528059607826825226') {
            console.log(`🎯 Special DM from XYIAN detected!`);
        }
        
        // Handle DM commands
        if (message.content.startsWith('!')) {
            const args = message.content.slice(1).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();
            
            switch (commandName) {
                case 'ping':
                    if (!trackResponse(message, 'ping-dm')) return;
                    
                    const dmPingEmbed = new EmbedBuilder()
                        .setTitle('🏰 XYIAN Ultimate Bot Status (DM Mode)')
                        .setDescription('**Bot is ONLINE and ready to help!**')
                        .addFields(
                            { name: '📊 Version', value: `v${BOT_VERSION}`, inline: true },
                            { name: '📅 Last Update', value: LAST_UPDATE, inline: true },
                            { name: '🧠 Knowledge Base', value: `${Object.keys(archeroDatabase).length} entries`, inline: true },
                            { name: '🤖 AI Status', value: AIService ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: '📈 AI Learning', value: Object.keys(aiFeedback).length > 0 ? '✅ Active' : '🔄 Ready', inline: true },
                            { name: '🎯 Guild ID', value: '213797', inline: true }
                        )
                        .setColor(0x9b59b6)
                        .setTimestamp()
                        .setFooter({ text: `XYIAN Ultimate Bot v${BOT_VERSION} - ${UPDATE_NOTES}` });
                    
                    await message.reply({ embeds: [dmPingEmbed] });
                    console.log(`✅ DM ping response sent to ${message.author.username}`);
                    messageResponseTracker.set(spamKey, true);
                    await logBotResponse('DM', message.content, 'Ping Command', message.author.id, message.author.username);
                    break;
                    
                case 'help':
                    const dmHelpEmbed = new EmbedBuilder()
                        .setTitle('🤖 XYIAN Bot - DM Commands')
                        .setDescription('**Available DM Commands:**\n`!ping` - Check bot status\n`!help` - This help\n`!menu` - Show question menu\n\n**Q&A:**\nAsk any Archero 2 question naturally!\n\n**Note:** For full functionality with role-based features, please use me in the Arch 2 Addicts server!')
                        .setColor(0x9b59b6)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot - DM Support' });
                    await message.reply({ embeds: [dmHelpEmbed] });
                    break;
                    
                case 'menu':
                    const dmMenuEmbed = new EmbedBuilder()
                        .setTitle('🎮 Archero 2 Question Menu (DM)')
                        .setDescription('**Ask me anything about Archero 2!**\n\n**Popular Questions:**\n• "What\'s the best weapon?"\n• "Which character should I use?"\n• "Is Dragon Helmet + Oracle good?"\n• "What\'s the best set for PvP?"\n• "How do orbs work?"\n\n**Just type your question naturally!**')
                        .setColor(0x9b59b6)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot - DM Menu' });
                    await message.reply({ embeds: [dmMenuEmbed] });
                    break;
                    
                default:
                    // Let AI handle all questions
                    console.log(`🤖 DM: Letting AI handle question: "${message.content}"`);
            }
        } else {
            // Check if user is in personalized setup
            if (await handlePersonalizedSetup(message) || await continuePersonalizedSetup(message)) {
                return;
            }
            
            // Let AI handle all questions
            console.log(`🤖 DM: Letting AI handle question: "${message.content}"`);
            const dmEmbed = new EmbedBuilder()
                    .setTitle('🤖 XYIAN Bot - Direct Message')
                    .setDescription(`Hello ${message.author.username}! I'm the XYIAN Bot for the Arch 2 Addicts community.\n\n**Available Commands:**\n• \`!help\` - Show all commands\n• \`!menu\` - Show question menu\n• Ask any Archero 2 question!\n\n**Note:** For full functionality, please use me in the Arch 2 Addicts server!`)
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - DM Support' });
            await message.reply({ embeds: [dmEmbed] });
        }
        return;
    }
    
    // Main message handling with error protection
    try {
        // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        switch (commandName) {
            case 'ping':
                if (!trackResponse(message, 'ping')) return;
                console.log(`🏰 PING COMMAND TRIGGERED by ${message.author.username}`);
                
                // Test AI connection
                let aiStatus = '❌ Disabled';
                let aiColor = 0xFF0000;
                if (AIService) {
                    try {
                        // Quick test to see if API key works
                        const testResponse = await AIService.chat.completions.create({
                            model: "gpt-4",
                            messages: [{ role: "user", content: "test" }],
                            max_tokens: 5
                        });
                        if (testResponse.choices[0]?.message?.content) {
                            aiStatus = '✅ Connected & Ready';
                            aiColor = 0x00FF00;
                        } else {
                            aiStatus = '⚠️ Connected but No Response';
                            aiColor = 0xFFA500;
                        }
                    } catch (error) {
                        aiStatus = `❌ API Error: ${error.message.substring(0, 30)}...`;
                        aiColor = 0xFF0000;
                    }
                }

                const pingEmbed = new EmbedBuilder()
                    .setTitle('🏰 XYIAN Ultimate Bot Status')
                    .setDescription('**Bot is ONLINE and ready to help!**')
                    .addFields(
                        { name: '📊 Version', value: `v${BOT_VERSION}`, inline: true },
                        { name: '📅 Last Update', value: LAST_UPDATE, inline: true },
                        { name: '🧠 Knowledge Base', value: `${Object.keys(archeroDatabase).length} entries`, inline: true },
                        { name: '🤖 AI Status', value: aiStatus, inline: true },
                        { name: '📈 AI Learning', value: Object.keys(aiFeedback).length > 0 ? '✅ Active' : '🔄 Ready', inline: true },
                        { name: '🎯 Guild ID', value: '213797', inline: true }
                    )
                    .setColor(aiColor)
                    .setTimestamp()
                    .setFooter({ text: `XYIAN Ultimate Bot v${BOT_VERSION} - ${UPDATE_NOTES}` });
                
                await message.reply({ embeds: [pingEmbed] });
                console.log(`🏰 PING RESPONSE SENT to ${message.author.username}`);
                break;
                
            case 'discord-bot-clean':
                if (!trackResponse(message, 'discord-bot-clean')) return;
                console.log(`🧹 DISCORD BOT CLEAN COMMAND TRIGGERED by ${message.author.username}`);
                
                // Only XYIAN OFFICIAL can use this command
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                try {
                    // Check for running bot processes
                    const { exec } = require('child_process');
                    exec('ps aux | grep "node.*bot" | grep -v grep', (error, stdout, stderr) => {
                        if (error) {
                            console.error('Error checking processes:', error);
                            return;
                        }
                        
                        const processes = stdout.trim().split('\n').filter(line => line.trim());
                        console.log(`🔍 Found ${processes.length} bot processes`);
                        
                        if (processes.length > 0) {
                            // Kill all bot processes
                            processes.forEach(processLine => {
                                const pid = processLine.split(/\s+/)[1];
                                if (pid) {
                                    exec(`kill ${pid}`, (killError) => {
                                        if (killError) {
                                            console.error(`Failed to kill process ${pid}:`, killError);
                                        } else {
                                            console.log(`✅ Killed process ${pid}`);
                                        }
                                    });
                                }
                            });
                            
                            message.reply(`🧹 **Discord Bot Clean Complete!**\n\n**Processes Found & Killed:** ${processes.length}\n**Status:** All duplicate bot processes terminated\n**Result:** Bot should now respond only once per message`);
                        } else {
                            message.reply(`🧹 **Discord Bot Clean Complete!**\n\n**Processes Found:** 0\n**Status:** No duplicate processes detected\n**Result:** Bot is running cleanly`);
                        }
                    });
                    
                    // Clear response tracking maps
                    responseTracker.clear();
                    messageResponseTracker.clear();
                    processedMembers.clear();
                    
                    console.log(`🧹 CLEANED: Response tracking maps cleared`);
                    
                } catch (error) {
                    console.error('❌ Discord Bot Clean error:', error);
                    await message.reply('❌ Error during bot cleanup. Check logs for details.');
                }
                break;
                
            case 'tip':
                if (!trackResponse(message, 'tip')) return;
                console.log(`📝 TIP COMMAND TRIGGERED by ${message.author.username}`);
                // Only XYIAN OFFICIAL can trigger daily tips
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                await sendDailyTip();
                await message.reply('📝 Daily tip sent!');
                console.log(`📝 TIP RESPONSE SENT to ${message.author.username}`);
                break;
                
            case 'recruit':
                // Only XYIAN OFFICIAL can trigger recruitment from guild chat
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                // Check if it's in guild chat
                if (message.channel.name !== 'xyian-guild') {
                    await message.reply('❌ This command can only be used in the XYIAN guild channel.');
                    return;
                }
                await sendGuildRecruitment();
                await message.reply('🏰 Guild recruitment sent!');
                break;
                
            case 'test':
                // Send individual test messages instead of all initial messages
                await sendToGeneral({ content: '🧪 **Test Message** - Bot is working correctly!' });
                await sendToXYIAN({ content: '🧪 **Test Message** - XYIAN guild channel test successful!' });
                await message.reply('📢 Test messages sent to general and XYIAN channels!');
                messageResponseTracker.set(spamKey, true);
                await logBotResponse(message.channel.name, message.content, 'Test Command', message.author.id, message.author.username);
                break;
                
            case 'audit-logs':
                // Only XYIAN OFFICIAL can view audit logs
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const recentLogs = auditLog.slice(-10); // Last 10 entries
                const auditEmbed = new EmbedBuilder()
                    .setTitle('📊 Bot Response Audit Logs (Last 10)')
                    .setColor(0x00BFFF)
                    .setTimestamp();
                
                if (recentLogs.length === 0) {
                    auditEmbed.setDescription('No audit logs available.');
                } else {
                    const logText = recentLogs.map(log => 
                        `**${log.timestamp}** - ${log.responseType} in ${log.channel}\n` +
                        `User: ${log.username} (${log.userId})\n` +
                        `Message: ${log.message.substring(0, 50)}...`
                    ).join('\n\n');
                    
                    auditEmbed.setDescription(logText);
                }
                
                await message.reply({ embeds: [auditEmbed] });
                messageResponseTracker.set(spamKey, true);
                await logBotResponse(message.channel.name, message.content, 'Audit Logs Command', message.author.id, message.author.username);
                break;
                
            case 'test-spam-filter':
                // Only XYIAN OFFICIAL can test spam filter
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const testId = Math.random().toString(36).substring(7);
                const testMessage = `TEST_SPAM_FILTER_${testId}_XXX`;
                
                // Send consolidated test message to debug channel
                const testContent = `🧪 **SPAM FILTER TEST START** - Test ID: ${testId}
📝 **TEST MESSAGE**: ${testMessage}
⏰ **TIMESTAMP**: ${new Date().toISOString()}`;
                await sendToAdmin({ content: testContent });
                
                // Send test message to current channel
                await message.reply(`🧪 **SPAM FILTER TEST** - Test ID: ${testId}\n📝 **TEST MESSAGE**: ${testMessage}\n⏰ **TIMESTAMP**: ${new Date().toISOString()}`);
                
                // Log the test
                messageResponseTracker.set(spamKey, true);
                await logBotResponse(message.channel.name, message.content, 'Spam Filter Test', message.author.id, message.author.username);
                
                // Schedule monitoring in 5 seconds
                setTimeout(async () => {
                    // Check for duplicates in audit logs
                    const testLogs = auditLog.filter(log => log.message.includes(testId));
                    
                    // Send consolidated monitoring results
                    const monitoringContent = `🔍 **MONITORING TEST** - Test ID: ${testId}
⏰ **CHECK TIME**: ${new Date().toISOString()}
📊 **AUDIT LOGS**: ${auditLog.length} total entries
📊 **DUPLICATE CHECK** - Test ID: ${testId}
🔢 **FOUND**: ${testLogs.length} entries with test ID
📝 **ENTRIES**: ${testLogs.map(log => `${log.responseType} at ${log.timestamp}`).join(', ')}`;
                    
                    await sendToAdmin({ content: monitoringContent });
                }, 5000);
                
                break;
                
            case 'monitor-debug':
                // Only XYIAN OFFICIAL can monitor debug
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                // Start manual monitoring (single test run)
                startManualMonitoring();
                
                // Send immediate debug info
                const debugEmbed = new EmbedBuilder()
                    .setTitle('🔍 MANUAL DEBUG MONITORING STARTED')
                    .setColor(0xFF6B35)
                    .addFields(
                        { name: '📊 Audit Logs', value: `${auditLog.length} total entries`, inline: true },
                        { name: '🚫 Spam Filter', value: `${messageResponseTracker.size} tracked messages`, inline: true },
                        { name: '⏰ Current Time', value: new Date().toISOString(), inline: true },
                        { name: '📝 Recent Logs', value: auditLog.slice(-5).map(log => `${log.responseType} in ${log.channel}`).join('\n') || 'None', inline: false }
                    )
                    .setTimestamp();
                
                await message.reply({ embeds: [debugEmbed] });
                await sendToAdmin({ embeds: [debugEmbed] });
                
                messageResponseTracker.set(spamKey, true);
                await logBotResponse(message.channel.name, message.content, 'Debug Monitor', message.author.id, message.author.username);
                break;
                
            case 'create-channel':
                // Only XYIAN OFFICIAL can create channels
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const args = message.content.split(' ').slice(1);
                const channelName = args[0] || 'new-channel';
                const channelType = args[1] || 'text';
                
                try {
                    const channel = await message.guild.channels.create({
                        name: channelName,
                        type: channelType === 'voice' ? 2 : 0, // 0 = text, 2 = voice
                        permissionOverwrites: [
                            {
                                id: message.guild.id, // @everyone
                                deny: ['ViewChannel'], // Hide by default
                            },
                            {
                                id: message.member.roles.cache.find(role => role.name === 'XYIAN OFFICIAL')?.id,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                            }
                        ]
                    });
                    
                    await message.reply(`✅ Channel created: ${channel.name} (${channel.id})`);
                } catch (error) {
                    await message.reply(`❌ Failed to create channel: ${error.message}`);
                }
                break;
                
            case 'create-admin-channels':
                // Only XYIAN OFFICIAL can create admin channels
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                try {
                    const categoryId = '1424467813803757638';
                    const adminRole = message.guild.roles.cache.find(role => role.name === 'Admin');
                    const xyianRole = message.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
                    
                    // Create Guild Requirements channel
                    const guildRequirementsChannel = await message.guild.channels.create({
                        name: 'guild-requirements',
                        type: 0, // Text channel
                        parent: categoryId,
                        permissionOverwrites: [
                            {
                                id: message.guild.id, // @everyone
                                deny: ['ViewChannel'], // Hide from everyone
                            },
                            {
                                id: adminRole?.id || xyianRole?.id,
                                allow: ['ViewChannel', 'ReadMessageHistory'],
                                deny: ['SendMessages'], // Read-only
                            }
                        ]
                    });
                    
                    // Create General Rules channel
                    const generalRulesChannel = await message.guild.channels.create({
                        name: 'general-rules',
                        type: 0, // Text channel
                        parent: categoryId,
                        permissionOverwrites: [
                            {
                                id: message.guild.id, // @everyone
                                deny: ['ViewChannel'], // Hide from everyone
                            },
                            {
                                id: adminRole?.id || xyianRole?.id,
                                allow: ['ViewChannel', 'ReadMessageHistory'],
                                deny: ['SendMessages'], // Read-only
                            }
                        ]
                    });
                    
                    // Send initial content to Guild Requirements
                    const guildRequirementsEmbed = new EmbedBuilder()
                        .setTitle('🏰 XYIAN Guild Requirements')
                        .setDescription('**Daily Requirements for Active Members:**')
                        .addFields(
                            { name: '⚔️ Daily Boss Battles', value: '**2 Boss Battles per day**\n• Required for active status\n• Must be completed daily\n• Tracked automatically', inline: false },
                            { name: '💰 Guild Donations', value: '**1 Guild Donation per day**\n• Required for active status\n• Must be completed daily\n• Tracked automatically', inline: false },
                            { name: '🚀 Expedition Sign-up', value: '**Expedition Participation**\n• Sign up for guild expeditions\n• Participate in guild events\n• Active in Discord community', inline: false },
                            { name: '📊 Activity Tracking', value: '**Inactive players will be removed or replaced**\n• 3+ days inactive = warning\n• 7+ days inactive = removal\n• Exceptions for valid reasons', inline: false }
                        )
                        .setColor(0xFFD700)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN OFFICIAL - Guild Management' });
                    
                    await guildRequirementsChannel.send({ embeds: [guildRequirementsEmbed] });
                    
                    // Send initial content to General Rules
                    const generalRulesEmbed = new EmbedBuilder()
                        .setTitle('📋 Discord Server Rules')
                        .setDescription('**General Rules and Guidelines:**')
                        .addFields(
                            { name: '🚫 Prohibited Content', value: '• Spam, harassment, or toxic behavior\n• NSFW content or inappropriate language\n• Sharing personal information\n• Advertising other servers', inline: false },
                            { name: '⚖️ Moderation Actions', value: '• **Warning**: First offense\n• **Timeout**: 1-24 hours\n• **Kick**: Temporary removal\n• **Ban**: Permanent removal', inline: false },
                            { name: '📝 Channel Guidelines', value: '• Use appropriate channels for topics\n• No spoilers without warnings\n• Respect other members\n• Follow Discord ToS', inline: false },
                            { name: '🆘 Appeals Process', value: '• Contact Admin for appeals\n• Explain your situation\n• Show understanding of rules\n• Demonstrate improvement', inline: false }
                        )
                        .setColor(0xFF6B35)
                        .setTimestamp()
                        .setFooter({ text: 'Arch 2 Addicts - Community Rules' });
                    
                    await generalRulesChannel.send({ embeds: [generalRulesEmbed] });
                    
                    await message.reply(`✅ Admin channels created:\n• Guild Requirements: ${guildRequirementsChannel.name} (${guildRequirementsChannel.id})\n• General Rules: ${generalRulesChannel.name} (${generalRulesChannel.id})`);
                } catch (error) {
                    await message.reply(`❌ Failed to create admin channels: ${error.message}`);
                }
                break;
                
            case 'channel-permissions':
                // Only XYIAN OFFICIAL can manage channel permissions
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const channelId = message.content.split(' ')[1];
                if (!channelId) {
                    await message.reply('❌ Please provide a channel ID. Usage: `!channel-permissions <channel-id>`');
                    return;
                }
                
                try {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (!channel) {
                        await message.reply('❌ Channel not found.');
                        return;
                    }
                    
                    // Set permissions for XYIAN OFFICIAL role
                    const xyianRole = message.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
                    if (xyianRole) {
                        await channel.permissionOverwrites.edit(xyianRole, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true,
                            ManageMessages: true
                        });
                        await message.reply(`✅ Permissions updated for ${channel.name}`);
                    } else {
                        await message.reply('❌ XYIAN OFFICIAL role not found.');
                    }
                } catch (error) {
                    await message.reply(`❌ Failed to update permissions: ${error.message}`);
                }
                break;
                
            case 'reset':
                // XYIAN Guild Verified or higher can trigger reset messages
                if (!hasBasicAccess(message.member)) {
                    await message.reply('❌ This command requires XYIAN Guild Verified role or higher.');
                    return;
                }
                await sendDailyResetMessages();
                await message.reply('🔄 Reset messages sent!');
                break;
                
            case 'expedition':
                // XYIAN Guild Verified or higher can trigger expedition
                if (!hasBasicAccess(message.member)) {
                    await message.reply('❌ This command requires XYIAN Guild Verified role or higher.');
                    return;
                }
                await sendExpeditionMessage();
                await message.reply('🏰 Guild expedition message sent!');
                break;
                
            case 'arena':
                // XYIAN Guild Verified or higher can trigger arena tips
                if (!hasBasicAccess(message.member)) {
                    await message.reply('❌ This command requires XYIAN Guild Verified role or higher.');
                    return;
                }
                await sendArenaTip();
                await message.reply('🏟️ Arena tips sent!');
                break;
                
            // XYIAN Guild Commands (require XYIAN OFFICIAL role)
            case 'xyian':
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const subCommand = args[0]?.toLowerCase();
                switch (subCommand) {
                    case 'info':
                        const infoEmbed = new EmbedBuilder()
                            .setTitle('🏰 XYIAN OFFICIAL Guild Info')
                            .setDescription('**Elite Archero 2 Guild - Arch 2 Addicts**\n\n📊 **Guild Statistics:**\n• Members: Active and growing\n• Power Level: 300k+ average\n• Daily Activity: 100%\n• Guild Level: Elite\n\n🎯 **Focus:**\n• Daily boss battles\n• Guild donations\n• Community support\n• Strategy sharing')
                            .setColor(0xFFD700)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [infoEmbed] });
                        break;
                        
                    case 'members':
                        const membersEmbed = new EmbedBuilder()
                            .setTitle('👥 XYIAN Guild Members')
                            .setDescription(`**Active Members: ${message.guild.memberCount}**\n\n📈 **Activity Status:**\n• Online: ${message.guild.members.cache.filter(m => m.presence?.status === 'online').size}\n• Active Today: High\n• New Members: Welcome!\n\n💪 **We're always looking for dedicated players!**`)
                            .setColor(0x00BFFF)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [membersEmbed] });
                        break;
                        
                    case 'stats':
                        const statsEmbed = new EmbedBuilder()
                            .setTitle('📊 XYIAN Guild Statistics')
                            .setDescription('**Guild Performance Metrics**\n\n⚔️ **Combat Stats:**\n• Boss Battles Completed: 100%\n• Guild Donations: 100%\n• Event Participation: 100%\n\n🏆 **Achievements:**\n• Top 10 Guild Ranking\n• 100% Daily Completion Rate\n• Elite Community Status\n\n🎯 **Goals:**\n• Maintain Elite Status\n• Grow Active Community\n• Share Knowledge')
                            .setColor(0x32CD32)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [statsEmbed] });
                        break;
                        
                    case 'events':
                        const eventsEmbed = new EmbedBuilder()
                            .setTitle('📅 XYIAN Guild Events')
                            .setDescription('**Upcoming Guild Activities**\n\n🎮 **Daily Events:**\n• Boss Battle Challenges\n• Guild Donation Drives\n• Strategy Discussions\n\n🏆 **Weekly Events:**\n• Guild vs Guild Battles\n• Build Competitions\n• Community Challenges\n\n📢 **Special Events:**\n• Umbral Tempest Strategies\n• New Player Welcome\n• Veteran Mentorship')
                            .setColor(0xFF69B4)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [eventsEmbed] });
                        break;
                        
                    case 'weapon':
                        const weaponName = args.slice(1).join(' ').toLowerCase();
                        if (!weaponName) {
                            await message.reply('❌ Please specify a weapon name. Example: `!xyian weapon staff of light`');
                            return;
                        }
                        
                        // Search unified knowledge database for weapon information
                        const weaponKeys = Object.keys(archeroDatabase).filter(key => 
                            key.toLowerCase().includes('weapon') || 
                            key.toLowerCase().includes(weaponName) ||
                            archeroDatabase[key].toLowerCase().includes(weaponName) ||
                            archeroDatabase[key].toLowerCase().includes('weapon')
                        );
                        
                        let weaponInfo = '';
                        if (weaponKeys.length > 0) {
                            // Get the most relevant weapon information
                            const relevantWeapon = weaponKeys.find(key => 
                                archeroDatabase[key].toLowerCase().includes(weaponName) ||
                                key.toLowerCase().includes(weaponName)
                            );
                            
                            if (relevantWeapon) {
                                weaponInfo = archeroDatabase[relevantWeapon];
                            } else {
                                // Use first weapon-related entry
                                weaponInfo = archeroDatabase[weaponKeys[0]];
                            }
                            
                            // Add source information
                            weaponInfo += `\n\n*Source: XYIAN Knowledge Database*`;
                        } else {
                            // Fallback to basic weapon search
                            const allKeys = Object.keys(archeroDatabase);
                            const weaponRelated = allKeys.filter(key => 
                                archeroDatabase[key].toLowerCase().includes('weapon') ||
                                archeroDatabase[key].toLowerCase().includes('damage') ||
                                archeroDatabase[key].toLowerCase().includes('attack')
                            );
                            
                            if (weaponRelated.length > 0) {
                                weaponInfo = `**${weaponName}** - General weapon information:\n\n${archeroDatabase[weaponRelated[0]]}\n\n*Source: XYIAN Knowledge Database*`;
                            } else {
                                weaponInfo = `**${weaponName}** - Weapon information not found in our database. Try asking about specific weapons like Staff of Light, Demon Blade, or Windforce Bow.`;
                            }
                        }
                        
                        const weaponEmbed = new EmbedBuilder()
                            .setTitle(`⚔️ Weapon: ${weaponName}`)
                            .setDescription(weaponInfo)
                            .setColor(0xFF4500)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL - Unified Knowledge Database' });
                        await message.reply({ embeds: [weaponEmbed] });
                        break;
                        
                    case 'skill':
                        const skillName = args.slice(1).join(' ').toLowerCase();
                        if (!skillName) {
                            await message.reply('❌ Please specify a skill name. Example: `!xyian skill multi-shot`');
                            return;
                        }
                        
                        // Search unified knowledge database for skill information
                        const skillKeys = Object.keys(archeroDatabase).filter(key => 
                            key.toLowerCase().includes('skill') || 
                            key.toLowerCase().includes(skillName) ||
                            archeroDatabase[key].toLowerCase().includes(skillName) ||
                            archeroDatabase[key].toLowerCase().includes('skill') ||
                            archeroDatabase[key].toLowerCase().includes('ability')
                        );
                        
                        let skillInfo = '';
                        if (skillKeys.length > 0) {
                            // Get the most relevant skill information
                            const relevantSkill = skillKeys.find(key => 
                                archeroDatabase[key].toLowerCase().includes(skillName) ||
                                key.toLowerCase().includes(skillName)
                            );
                            
                            if (relevantSkill) {
                                skillInfo = archeroDatabase[relevantSkill];
                            } else {
                                // Use first skill-related entry
                                skillInfo = archeroDatabase[skillKeys[0]];
                            }
                            
                            // Add source information
                            skillInfo += `\n\n*Source: XYIAN Knowledge Database*`;
                        } else {
                            // Fallback to basic skill search
                            const allKeys = Object.keys(archeroDatabase);
                            const skillRelated = allKeys.filter(key => 
                                archeroDatabase[key].toLowerCase().includes('skill') ||
                                archeroDatabase[key].toLowerCase().includes('ability') ||
                                archeroDatabase[key].toLowerCase().includes('power')
                            );
                            
                            if (skillRelated.length > 0) {
                                skillInfo = `**${skillName}** - General skill information:\n\n${archeroDatabase[skillRelated[0]]}\n\n*Source: XYIAN Knowledge Database*`;
                            } else {
                                skillInfo = `**${skillName}** - Skill information not found in our database. Try asking about specific skills like Multi-shot, Ricochet, or Piercing.`;
                            }
                        }
                        
                        const skillEmbed = new EmbedBuilder()
                            .setTitle(`✨ Skill: ${skillName}`)
                            .setDescription(skillInfo)
                            .setColor(0x9370DB)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL - Unified Knowledge Database' });
                        await message.reply({ embeds: [skillEmbed] });
                        break;
                        
                    case 'build':
                        const className = args.slice(1).join(' ').toLowerCase();
                        if (!className) {
                            await message.reply('❌ Please specify a class. Example: `!xyian build mage`');
                            return;
                        }
                        
                        // Search unified knowledge database for build information
                        const buildKeys = Object.keys(archeroDatabase).filter(key => 
                            key.toLowerCase().includes('build') || 
                            key.toLowerCase().includes(className) ||
                            archeroDatabase[key].toLowerCase().includes(className) ||
                            archeroDatabase[key].toLowerCase().includes('build') ||
                            archeroDatabase[key].toLowerCase().includes('strategy') ||
                            archeroDatabase[key].toLowerCase().includes('guide')
                        );
                        
                        let buildInfo = '';
                        if (buildKeys.length > 0) {
                            // Get the most relevant build information
                            const relevantBuild = buildKeys.find(key => 
                                archeroDatabase[key].toLowerCase().includes(className) ||
                                key.toLowerCase().includes(className)
                            );
                            
                            if (relevantBuild) {
                                buildInfo = archeroDatabase[relevantBuild];
                            } else {
                                // Use first build-related entry
                                buildInfo = archeroDatabase[buildKeys[0]];
                            }
                            
                            // Add source information
                            buildInfo += `\n\n*Source: XYIAN Knowledge Database*`;
                        } else {
                            // Fallback to basic build search
                            const allKeys = Object.keys(archeroDatabase);
                            const buildRelated = allKeys.filter(key => 
                                archeroDatabase[key].toLowerCase().includes('build') ||
                                archeroDatabase[key].toLowerCase().includes('strategy') ||
                                archeroDatabase[key].toLowerCase().includes('guide') ||
                                archeroDatabase[key].toLowerCase().includes('recommendation')
                            );
                            
                            if (buildRelated.length > 0) {
                                buildInfo = `**${className}** - General build information:\n\n${archeroDatabase[buildRelated[0]]}\n\n*Source: XYIAN Knowledge Database*`;
                            } else {
                                buildInfo = `**${className}** - Build information not found in our database. Try asking about specific classes like Mage, Warrior, or Archer.`;
                            }
                        }
                        
                        const buildEmbed = new EmbedBuilder()
                            .setTitle(`🎯 Build: ${className}`)
                            .setDescription(buildInfo)
                            .setColor(0x20B2AA)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL - Unified Knowledge Database' });
                        await message.reply({ embeds: [buildEmbed] });
                        break;
                        
                    case 'help':
                        const helpEmbed = new EmbedBuilder()
                            .setTitle('🏰 XYIAN Guild Commands')
                            .setDescription('**Available XYIAN Commands:**\n\n`!xyian info` - Guild information\n`!xyian members` - Member statistics\n`!xyian stats` - Guild performance\n`!xyian events` - Upcoming events\n`!xyian weapon [name]` - Weapon info\n`!xyian skill [name]` - Skill info\n`!xyian build [class]` - Build recommendations\n`!xyian help` - This help message')
                            .setColor(0xFFD700)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [helpEmbed] });
                        break;
                        
                    default:
                        await message.reply('❌ Unknown XYIAN command. Use `!xyian help` for available commands.');
                }
                break;
                
            case 'help':
                const generalHelpEmbed = new EmbedBuilder()
                    .setTitle('🤖 XYIAN Ultimate Bot Commands')
                    .setDescription('**Basic Commands:**\n`!ping` - Check bot status\n`!help` - This help\n`!menu` - Show question menu\n\n**For Archero 2 Questions:**\n🔹 **Go to the AI chat channels** for detailed answers!\n🔹 Use `#arch-ai` for Q&A\n🔹 This channel is for general discussion only\n\n**AI Learning Commands:**\n`!ai-feedback [question] [feedback]` - Provide detailed feedback on AI responses\n`!ai-thumbs-down [question]` - Quick thumbs down for wrong responses\n`!teach "question" "answer"` - Teach the bot a new answer\n`!memory` - Show your conversation memory with the bot\n`!unknown` - View unknown questions (XYIAN OFFICIAL only)\n\n**Role-Based Commands:**\n• XYIAN OFFICIAL: Full access + Channel management\n• XYIAN Guild Verified: Basic AI questions\n• Admin: Administrative commands\n\n**Admin Commands:**\n`!discord-bot-clean` - Clean duplicate bot processes (XYIAN OFFICIAL only)\n`!ai-toggle` - Toggle AI responses on/off (XYIAN OFFICIAL only)')
                    .setColor(0x00BFFF)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN OFFICIAL' });
                await message.reply({ embeds: [generalHelpEmbed] });
                break;
                
            case 'menu':
                const menuEmbed = new EmbedBuilder()
                    .setTitle('🎮 Archero 2 Question Menu')
                    .setDescription('**For Archero 2 Questions:**\n\n🔹 **Go to the AI chat channels!**\n• `#arch-ai` - AI-powered Archero 2 questions\n\n**Popular Questions:**\n• "What\'s the best weapon?"\n• "Which character should I use?"\n• "Is Dragon Helmet + Oracle good?"\n• "What\'s the best set for PvP?"\n• "How do orbs work?"\n\n**This channel is for general discussion only!**')
                    .addFields(
                        { name: '💡 Pro Tip', value: 'Use the #arch-ai channel for detailed Archero 2 help!', inline: false },
                        { name: '🏰 Guild Questions', value: 'For XYIAN guild-specific questions, use `!xyian help` (requires XYIAN Guild Verified role)', inline: false }
                    )
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - Public Menu' });
                await message.reply({ embeds: [menuEmbed] });
                break;
                
            case 'ai-menu':
                // Send formatted menu to AI questions channel
                const aiMenuEmbed = new EmbedBuilder()
                    .setTitle('🤖 Advanced Archero 2 Analysis Channel')
                    .setDescription('**Welcome to the AI-Powered Build Analysis Channel!**\n\nAsk complex questions about builds, item synergies, and character optimization.')
                    .addFields(
                        { 
                            name: '📊 Build Analysis Examples', 
                            value: '• "I have 3 Griffin items, 3 Oracle, and 2 Dragon - what\'s the best build?"\n• "My highest character is 4-star Helix, should I use him or 2-star Thor?"\n• "What\'s the best resonance combo for PvP with my current items?"\n• "Is Dragon Helmet + Oracle Spear + Griffin Boots a good combo?"', 
                            inline: false 
                        },
                        { 
                            name: '🎯 Character Resonance Guide', 
                            value: '**3-Star Resonance (First Slot):**\n• Rolla ⭐⭐⭐ - BEST (freeze is vital)\n• Helix ⭐⭐⭐ - Strong DPS\n• Thor ⭐⭐⭐ - Legendary option\n\n**6-Star Resonance (Second Slot):**\n• Loki ⭐⭐⭐⭐⭐⭐ - TOP CHOICE\n• Demon King ⭐⭐⭐⭐⭐⭐ - Shield specialist\n• Otta ⭐⭐⭐⭐⭐⭐ - High-level option', 
                            inline: false 
                        },
                        { 
                            name: '⚡ Build Type Recommendations', 
                            value: '**Dragon Builds:** High damage, tanky - Use Thor/Demon King + Rolla + Loki\n**Oracle Builds:** Balanced, versatile - Use Helix/Alex + Rolla + Demon King\n**Griffin Builds:** Speed, mobility - Use Nyanja/Griffin + Nyanja + Loki', 
                            inline: false 
                        },
                        { 
                            name: '💡 Pro Tips', 
                            value: '• Higher character levels = stronger resonance effects\n• Level 7 Rolla >> 3-star Rolla for resonance\n• Use highest star character as primary (3+ stars for resonance)\n• Freeze attacks provide major advantage in PvP', 
                            inline: false 
                        }
                    )
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - AI Analysis Channel' });
                
                await sendToAIQuestions({ embeds: [aiMenuEmbed] });
                await message.reply('📤 Advanced analysis menu sent to AI questions channel!');
                break;
                
            case 'send-ai-menu':
                // Manual command to send AI menu (for testing)
                const manualAiMenuEmbed = new EmbedBuilder()
                    .setTitle('🤖 Advanced Archero 2 Analysis Channel')
                    .setDescription('**Welcome to the AI-Powered Build Analysis Channel!**\n\nAsk complex questions about builds, item synergies, and character optimization.')
                    .addFields(
                        { 
                            name: '📊 Build Analysis Examples', 
                            value: '• "I have 3 Griffin items, 3 Oracle, and 2 Dragon - what\'s the best build?"\n• "My highest character is 4-star Helix, should I use him or 2-star Thor?"\n• "What\'s the best resonance combo for PvP with my current items?"\n• "Is Dragon Helmet + Oracle Spear + Griffin Boots a good combo?"', 
                            inline: false 
                        },
                        { 
                            name: '🎯 Character Resonance Guide', 
                            value: '**3-Star Resonance (First Slot):**\n• Rolla ⭐⭐⭐ - BEST (freeze is vital)\n• Helix ⭐⭐⭐ - Strong DPS\n• Thor ⭐⭐⭐ - Legendary option\n\n**6-Star Resonance (Second Slot):**\n• Loki ⭐⭐⭐⭐⭐⭐ - TOP CHOICE\n• Demon King ⭐⭐⭐⭐⭐⭐ - Shield specialist\n• Otta ⭐⭐⭐⭐⭐⭐ - High-level option', 
                            inline: false 
                        },
                        { 
                            name: '⚡ Build Type Recommendations', 
                            value: '**Dragon Builds:** High damage, tanky - Use Thor/Demon King + Rolla + Loki\n**Oracle Builds:** Balanced, versatile - Use Helix/Alex + Rolla + Demon King\n**Griffin Builds:** Speed, mobility - Use Nyanja/Griffin + Nyanja + Loki', 
                            inline: false 
                        },
                        { 
                            name: '💡 Pro Tips', 
                            value: '• Higher character levels = stronger resonance effects\n• Level 7 Rolla >> 3-star Rolla for resonance\n• Use highest star character as primary (3+ stars for resonance)\n• Freeze attacks provide major advantage in PvP', 
                            inline: false 
                        }
                    )
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - AI Analysis Channel' });
                
                await sendToAIQuestions({ embeds: [manualAiMenuEmbed] });
                await message.reply('📤 AI analysis menu sent to AI questions channel!');
                break;
                
            case 'analytics':
                // Analytics command (XYIAN OFFICIAL only)
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                try {
                    // Get basic analytics from JSON database
                    const data = readData();
                    const totalInteractions = data.interactions.length;
                    const aiInteractions = data.interactions.filter(i => i.ai_generated).length;
                    const avgResponseTime = data.interactions.length > 0 
                        ? data.interactions.reduce((sum, i) => sum + (i.response_time_ms || 0), 0) / data.interactions.length 
                        : 0;
                    
                    // Get popular questions
                    const questionCounts = {};
                    data.interactions.forEach(i => {
                        const question = i.question?.toLowerCase() || '';
                        questionCounts[question] = (questionCounts[question] || 0) + 1;
                    });
                    
                    const popularQuestions = Object.entries(questionCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([question, count]) => ({ question, count }));
                    
                    const analyticsEmbed = new EmbedBuilder()
                        .setTitle('📊 Bot Analytics Dashboard')
                        .setDescription('**Current Bot Performance Metrics**')
                        .addFields(
                            { name: '📈 Total Interactions', value: `${totalInteractions}`, inline: true },
                            { name: '🤖 AI Responses', value: `${aiInteractions}`, inline: true },
                            { name: '⚡ Avg Response Time', value: `${Math.round(avgResponseTime)}ms`, inline: true },
                            { 
                                name: '🔥 Popular Questions', 
                                value: popularQuestions.map((q, i) => `${i + 1}. ${q.question.substring(0, 50)}... (${q.count}x)`).join('\n') || 'No data yet',
                                inline: false 
                            },
                            { 
                                name: '🌐 API Endpoints', 
                                value: '`/api/analytics/overview` - Full analytics\n`/api/analytics/questions/popular` - Top questions\n`/api/export/interactions` - Export data\n`/api/health` - System status',
                                inline: false 
                            }
                        )
                        .setColor(0x00BFFF)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot - Analytics' });
                    
                    await message.reply({ embeds: [analyticsEmbed] });
                    
                } catch (error) {
                    console.error('❌ Analytics error:', error);
                    await message.reply('📊 Analytics data is being processed. Try again in a moment!');
                    sendToAdmin(`🚨 **Analytics Error**: ${error.message}`);
                }
                break;
                
            case 'api-test':
                // Test API endpoints (XYIAN OFFICIAL only)
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                try {
                    const axios = require('axios');
                    const apiKey = process.env.API_KEY || 'xyian-bot-api-2024';
                    const baseUrl = `http://localhost:${process.env.API_PORT || 3001}`;
                    
                    // Test health endpoint
                    const healthResponse = await axios.get(`${baseUrl}/api/health`);
                    const statusResponse = await axios.get(`${baseUrl}/api/status`);
                    const analyticsResponse = await axios.get(`${baseUrl}/api/analytics/overview`, {
                        headers: { 'x-api-key': apiKey }
                    });
                    
                    const testEmbed = new EmbedBuilder()
                        .setTitle('🧪 API Test Results')
                        .setDescription('**API Server Status Check**')
                        .addFields(
                            { name: '🏥 Health Check', value: `Status: ${healthResponse.data.status}`, inline: true },
                            { name: '📊 System Status', value: `Uptime: ${Math.round(statusResponse.data.uptime)}s`, inline: true },
                            { name: '📈 Analytics', value: `Interactions: ${analyticsResponse.data.totalInteractions}`, inline: true },
                            { 
                                name: '✅ All Tests Passed', 
                                value: 'API server is running and responding correctly!',
                                inline: false 
                            }
                        )
                        .setColor(0x00FF88)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot - API Test' });
                    
                    await message.reply({ embeds: [testEmbed] });
                    
                } catch (error) {
                    console.error('❌ API test error:', error);
                    await message.reply('❌ API test failed. Check server logs for details.');
                    sendToAdmin(`🚨 **API Test Error**: ${error.message}`);
                }
                break;
                
            case 'learn':
                // Trigger learning system and data scraping (XYIAN OFFICIAL only)
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const learnEmbed = new EmbedBuilder()
                    .setTitle('🧠 Learning System')
                    .setDescription('**Bot Learning and Data Collection**')
                    .addFields(
                        { 
                            name: '📊 Learning Report', 
                            value: 'Generating learning report...', 
                            inline: false 
                        }
                    )
                    .setColor(0x9b59b6)
                    .setTimestamp();
                
                const learningMsg = await message.reply({ embeds: [learnEmbed] });
                
                try {
                    // Generate learning report
                    const report = learningSystem.generateLearningReport();
                    
                    // Update Q&A database with learned data
                    const updated = learningSystem.updateMainQADatabase();
                    
                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('🧠 Learning System Report')
                        .setDescription('**Current Learning Status**')
                        .addFields(
                            { name: '📝 Total Corrections', value: report.totalCorrections.toString(), inline: true },
                            { name: '🆕 New Questions', value: report.totalNewQuestions.toString(), inline: true },
                            { name: '📚 Learned Answers', value: report.totalLearnedAnswers.toString(), inline: true },
                            { name: '⭐ Avg Confidence', value: report.averageConfidence.toFixed(2), inline: true },
                            { name: '🔄 Database Updated', value: updated ? '✅ Yes' : '❌ No', inline: true },
                            { name: '📅 Last Updated', value: new Date(report.lastUpdated).toLocaleString(), inline: true },
                            { 
                                name: '🔥 Recent Corrections', 
                                value: report.topCorrections.length > 0 
                                    ? report.topCorrections.map(c => `• ${c.originalQuestion.substring(0, 40)}... (${c.rating}/5)`).join('\n')
                                    : 'No corrections yet',
                                inline: false 
                            },
                            { 
                                name: '🆕 Recent New Questions', 
                                value: report.recentNewQuestions.length > 0 
                                    ? report.recentNewQuestions.map(q => `• ${q.question.substring(0, 40)}...`).join('\n')
                                    : 'No new questions yet',
                                inline: false 
                            }
                        )
                        .setColor(0x00FF88)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot - Learning System' });
                    
                    await learningMsg.edit({ embeds: [updatedEmbed] });
                    
                } catch (error) {
                    console.error('❌ Learning system error:', error);
                    await learningMsg.edit({ 
                        embeds: [new EmbedBuilder()
                            .setTitle('❌ Learning System Error')
                            .setDescription('Failed to generate learning report. Check logs for details.')
                            .setColor(0xFF0000)
                        ]
                    });
                }
                break;
                
            case 'scrape':
                // Trigger comprehensive data scraping (XYIAN OFFICIAL only)
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const scrapeEmbed = new EmbedBuilder()
                    .setTitle('🔍 Data Scraping')
                    .setDescription('**Starting comprehensive Archero 2 data scraping...**\nThis may take a few minutes.')
                    .setColor(0xFFA500)
                    .setTimestamp();
                
                const scrapingMsg = await message.reply({ embeds: [scrapeEmbed] });
                
                try {
                    const Archero2DataScraper = require('./scripts/archero2-data-scraper');
                    const scraper = new Archero2DataScraper();
                    
                    const scrapedData = await scraper.scrapeAllData();
                    
                    if (scrapedData) {
                        const successEmbed = new EmbedBuilder()
                            .setTitle('✅ Data Scraping Complete')
                            .setDescription('**Comprehensive Archero 2 data has been collected!**')
                            .addFields(
                                { name: '👥 Characters', value: Object.keys(scrapedData.characters).length.toString(), inline: true },
                                { name: '⚔️ Weapons', value: Object.keys(scrapedData.weapons).length.toString(), inline: true },
                                { name: '🎯 Skills', value: Object.keys(scrapedData.skills).length.toString(), inline: true },
                                { name: '💎 Runes', value: Object.keys(scrapedData.runes).length.toString(), inline: true },
                                { name: '🎉 Events', value: Object.keys(scrapedData.events).length.toString(), inline: true },
                                { name: '📚 Strategies', value: Object.keys(scrapedData.strategies).length.toString(), inline: true },
                                { name: '💰 F2P Guides', value: Object.keys(scrapedData.f2pGuides).length.toString(), inline: true },
                                { name: '⚔️ PvP Guides', value: Object.keys(scrapedData.pvpGuides).length.toString(), inline: true },
                                { name: '📅 Last Updated', value: new Date(scrapedData.lastUpdated).toLocaleString(), inline: false }
                            )
                            .setColor(0x00FF88)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN Bot - Data Scraping' });
                        
                        await scrapingMsg.edit({ embeds: [successEmbed] });
                    } else {
                        throw new Error('Scraping failed');
                    }
                    
                } catch (error) {
                    console.error('❌ Data scraping error:', error);
                    await scrapingMsg.edit({ 
                        embeds: [new EmbedBuilder()
                            .setTitle('❌ Data Scraping Error')
                            .setDescription('Failed to scrape data. Check logs for details.')
                            .setColor(0xFF0000)
                        ]
                    });
                }
                break;
                
            case 'ai-toggle':
                // Toggle AI responses on/off (XYIAN OFFICIAL only)
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                aiResponseEnabled = !aiResponseEnabled;
                const status = aiResponseEnabled ? 'ENABLED' : 'DISABLED';
                const color = aiResponseEnabled ? 0x00FF00 : 0xFF0000;
                
                const toggleEmbed = new EmbedBuilder()
                    .setTitle(`🤖 AI Response Toggle`)
                    .setDescription(`AI responses are now **${status}**\n\n**Channel:** arch-ai (ID: ${AI_QUESTIONS_CHANNEL_ID})\n**Webhook:** ${webhooks.aiQuestions ? '✅ Connected' : '❌ Not configured'}`)
                    .setColor(color)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN OFFICIAL - AI Control' });
                
                await message.reply({ embeds: [toggleEmbed] });
                console.log(`🤖 AI Response Toggle: ${status} by ${message.author.username}`);
                break;
                
            case 'ai-feedback':
                // Provide feedback on AI responses
                const feedbackArgs = args.slice(1);
                if (feedbackArgs.length < 2) {
                    await message.reply('❌ Usage: `!ai-feedback [question] [feedback]`\n\n**Examples:**\n`!ai-feedback "best dragoon build" "wrong, dragoon is not a character"`\n`!ai-feedback "resonance" "good answer, but add more about 6-star unlock"`');
                    return;
                }
                
                const question = feedbackArgs[0].replace(/"/g, '');
                const feedback = feedbackArgs.slice(1).join(' ').replace(/"/g, '');
                
                // Process the correction and extract topics
                const topics = processCorrection(question, feedback);
                
                const questionKey = question.toLowerCase().trim();
                
                // Store feedback
                aiFeedback[questionKey] = {
                    question: question,
                    feedback: feedback,
                    wrong: feedback.toLowerCase().includes('wrong') || feedback.toLowerCase().includes('incorrect') || feedback.toLowerCase().includes('not right'),
                    correction: feedback.toLowerCase().includes('wrong') ? feedback : null,
                    notes: `User provided correction: ${feedback}. Focus on: ${topics.join(', ')}`,
                    timestamp: new Date().toISOString(),
                    user: message.author.username
                };
                
                // Save learning data
                saveAILearningData();
                
                const feedbackEmbed = new EmbedBuilder()
                    .setTitle('🧠 AI Feedback Received')
                    .setDescription(`**Question:** "${question}"\n**Feedback:** ${feedback}\n**Focus Topics:** ${topics.join(', ')}\n\nThank you for helping improve the AI! This feedback will be used to provide better responses in the future.`)
                    .setColor(0x00BFFF)
                    .setTimestamp()
                    .setFooter({ text: `Feedback from ${message.author.username}` });
                
                await message.reply({ embeds: [feedbackEmbed] });
                console.log(`🧠 AI Feedback received from ${message.author.username}: "${question}" -> "${feedback}"`);
                break;
                
            case 'memory':
                // Show conversation memory for the user
                const userId = message.author.id;
                const context = getConversationContext(userId);
                
                if (context) {
                    const memoryEmbed = new EmbedBuilder()
                        .setTitle('🧠 Your Conversation Memory')
                        .setDescription(`\`\`\`${context}\`\`\``)
                        .setColor(0x00BFFF)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN Bot - Memory System' });
                    
                    await message.reply({ embeds: [memoryEmbed] });
                } else {
                    await message.reply('❌ No conversation memory found. Start a conversation and I\'ll remember it!');
                }
                break;
                
            case 'teach':
                // Teach the bot a new answer
                const teachArgs = args.slice(1);
                if (teachArgs.length < 2) {
                    await message.reply('❌ Usage: `!teach "question" "answer"`\n\n**Example:** `!teach "what is resonance" "Resonance allows using another character\'s skill at 3-star and 6-star"`');
                    return;
                }
                
                const teachQuestion = teachArgs[0].replace(/"/g, '');
                const teachAnswer = teachArgs.slice(1).join(' ').replace(/"/g, '');
                
                // Teach the bot
                teachBot(teachQuestion, teachAnswer, message.author.username);
                
                const teachEmbed = new EmbedBuilder()
                    .setTitle('🎓 Bot Taught Successfully!')
                    .setDescription(`**Question:** "${teachQuestion}"\n**Answer:** ${teachAnswer}\n\nI've learned this and will remember it for future questions!`)
                    .setColor(0x00FF00)
                    .setTimestamp()
                    .setFooter({ text: `Taught by ${message.author.username}` });
                
                await message.reply({ embeds: [teachEmbed] });
                break;
                
            case 'unknown':
                // Show unknown questions that need answers (XYIAN OFFICIAL only)
                if (!hasXYIANOfficialAccess(message.member)) {
                    await message.reply('❌ This command requires XYIAN OFFICIAL role or higher.');
                    return;
                }
                
                const recentUnknown = unknownQuestions.slice(-10); // Last 10 unknown questions
                
                if (recentUnknown.length === 0) {
                    await message.reply('✅ No unknown questions! The bot knows everything asked recently.');
                    return;
                }
                
                let unknownList = '**Recent Unknown Questions:**\n\n';
                recentUnknown.forEach((q, index) => {
                    unknownList += `${index + 1}. "${q.question}"\n   *${q.timestamp}*\n\n`;
                });
                
                const unknownEmbed = new EmbedBuilder()
                    .setTitle('❓ Unknown Questions Log')
                    .setDescription(unknownList)
                    .setColor(0xFFA500)
                    .setTimestamp()
                    .setFooter({ text: `Total unknown: ${unknownQuestions.length}` });
                
                await message.reply({ embeds: [unknownEmbed] });
                break;
                
            case 'ai-thumbs-down':
                // Quick thumbs down for wrong responses
                const thumbsDownArgs = args.slice(1);
                if (thumbsDownArgs.length < 1) {
                    await message.reply('❌ Usage: `!ai-thumbs-down [question]`\n\n**Example:** `!ai-thumbs-down "best dragoon build"`');
                    return;
                }
                
                const thumbsDownQuestion = thumbsDownArgs.join(' ').replace(/"/g, '');
                const thumbsDownKey = thumbsDownQuestion.toLowerCase().trim();
                
                // Store thumbs down feedback
                aiFeedback[thumbsDownKey] = {
                    question: thumbsDownQuestion,
                    feedback: 'Thumbs down - response was incorrect',
                    wrong: true,
                    correction: null,
                    notes: 'User indicated response was wrong',
                    timestamp: new Date().toISOString(),
                    user: message.author.username
                };
                
                // Save learning data
                saveAILearningData();
                
                await message.reply('👎 Thumbs down recorded! The AI will learn from this feedback and provide better responses in the future.');
                console.log(`👎 AI Thumbs down from ${message.author.username}: "${thumbsDownQuestion}"`);
                break;
                
            default:
                // Let AI handle all questions - no hardcoded responses
                console.log(`🤖 Letting AI handle question: "${message.content}"`);
                // AI response will be handled by the main message handler below
        }
    } else {
        // Check if this is the AI questions channel
        if (message.channel.name === 'arch-ai') {
            // Check for help command
            if (message.content.toLowerCase().includes('!bothelp') || message.content.toLowerCase().includes('!bot help')) {
                const helpEmbed = getBotQuestionHelp();
                await message.reply({ embeds: [helpEmbed] });
                return;
            }
            
            // Let AI handle all questions in arch-ai channel
            console.log(`🤖 AI Question in arch-ai: "${message.content}"`);
            // AI response will be handled by the main message handler below
        }
        
        // This logic is now handled by the gate above - no duplicate checks needed
        
        // This code should never be reached for guild recruit channels due to the gate above
        
        // FINAL SAFETY CHECK: ONLY AI CHANNELS CAN HAVE LIVE RESPONSES
        if (!isAIChannel && !isCommand && !isDM) {
            console.log(`🚨 SAFETY CHECK FAILED: Attempted live response in non-AI channel (${message.channel.name})`);
            return;
        }
        
        // Q&A System with role-based access - PRIORITIZE DATABASE OVER AI
        if (!trackResponse(message, 'qa-response')) return;
        
        let answer = null;
        let isAIResponse = false;
        
        // Check if user has access to AI features
        const hasAIAccess = hasBasicAccess(message.member);
        
        // Special handling for identity questions
        const messageLower = message.content.toLowerCase().trim();
        if (messageLower.includes('what is your name') || messageLower.includes('who are you') || messageLower.includes('your name')) {
            answer = "I'm XY Elder, the trusted henchman and guild elder of XYIAN OFFICIAL! I'm here to help you dominate the leaderboards and master Archero 2!";
            isAIResponse = true;
            console.log(`✅ DIRECT IDENTITY RESPONSE for: "${message.content}"`);
        }
        // AI should ALWAYS work - no fallbacks, no excuses
        if (AIService && hasAIAccess) {
            try {
                console.log(`🤖 AI processing: "${message.content}" by ${message.author.username}`);
                
                // Get relevant knowledge first
                const relevantKnowledge = getRelevantKnowledge(message.content);
                console.log(`🎯 Found ${relevantKnowledge.length} relevant knowledge entries`);
                
                // Generate AI response with knowledge
                answer = await generateAIResponse(message.content, message.channel.name);
                
                if (answer && answer.length > 10) {
                    isAIResponse = true;
                    console.log(`✅ AI SUCCESS: "${message.content}" - Length: ${answer.length}`);
                } else {
                    // AI failed - this should NEVER happen, but if it does, use knowledge directly
                    console.log(`🚨 AI FAILED - Using knowledge directly for: "${message.content}"`);
                    if (relevantKnowledge.length > 0) {
                        const bestMatch = relevantKnowledge[0];
                        answer = `Hey ${message.author.username}! Based on my knowledge:\n\n**${bestMatch.key}:**\n${bestMatch.content}\n\n*This is from my knowledge base - let me know if you need more specific info!*`;
                        isAIResponse = true;
                        console.log(`✅ DIRECT KNOWLEDGE USED: ${bestMatch.key}`);
                    } else {
                        // This should NEVER happen with 650+ entries
                        console.log(`🚨 CRITICAL: No knowledge found for "${message.content}" - This is a bug!`);
                        answer = `Hey ${message.author.username}! I'm having trouble accessing my knowledge base right now. Please try rephrasing your question or contact XYIAN if this persists.`;
                    }
                }
            } catch (error) {
                console.error('🚨 AI ERROR:', error);
                // Even on error, try to use knowledge
                const relevantKnowledge = getRelevantKnowledge(message.content);
                if (relevantKnowledge.length > 0) {
                    const bestMatch = relevantKnowledge[0];
                    answer = `Hey ${message.author.username}! Based on my knowledge:\n\n**${bestMatch.key}:**\n${bestMatch.content}\n\n*This is from my knowledge base - let me know if you need more specific info!*`;
                    isAIResponse = true;
                } else {
                    answer = `Hey ${message.author.username}! I'm experiencing technical difficulties. Please try again or contact XYIAN.`;
                }
            }
        } else {
            console.log(`❌ AI not available - AIService: ${!!AIService}, hasAIAccess: ${hasAIAccess}, user: ${message.author.username}`);
            answer = "❓ I'd love to help with your Archero 2 question! However, AI-powered responses require the **XYIAN Guild Verified** role or higher. You can still ask basic questions, or use `!menu` to see what I can help with!";
        }
        
        // Add feedback instructions to every response
        if (answer && isAIResponse) {
            answer += "\n\n💡 **Help me improve!** If this answer is wrong or needs tweaking, use:\n• `!ai-feedback \"your question\" \"what's wrong\"`\n• `!ai-thumbs-down \"your question\"`";
            
            // Automatically learn from every AI interaction
            const questionKey = message.content.toLowerCase().trim();
            aiLearningData[questionKey] = {
                question: message.content,
                response: answer,
                timestamp: new Date().toISOString(),
                channel: message.channel.name,
                user: message.author.username
            };
            
            // Save learning data
            saveAILearningData();
        }
        
        const qaEmbed = new EmbedBuilder()
                .setTitle('❓ Archero 2 Q&A')
                .setDescription(answer)
                .setColor(0x00BFFF)
                .setTimestamp()
                .setFooter({ text: 'XYIAN Bot' });
        
        const response = await message.reply({ embeds: [qaEmbed] });
        
        // Store conversation memory for all messages (not just AI responses)
        addToConversationMemory(message.author.id, message.content, answer || null);
        
        // Add reaction feedback for AI responses
        if (isAIResponse) {
            await response.react('👍');
            await response.react('👎');
            
            // Set up reaction collector for automatic feedback
            const filter = (reaction, user) => {
                return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
            };
            
            const collector = response.createReactionCollector({ filter, time: 300000 }); // 5 minutes
            
            collector.on('collect', async (reaction, user) => {
                const questionKey = message.content.toLowerCase().trim();
                const isGood = reaction.emoji.name === '👍';
                
                // Store feedback
                aiFeedback[questionKey] = {
                    question: message.content,
                    feedback: isGood ? 'Thumbs up - response was helpful' : 'Thumbs down - response was incorrect',
                    wrong: !isGood,
                    correction: null,
                    notes: isGood ? 'User indicated response was helpful' : 'User indicated response was wrong',
                    timestamp: new Date().toISOString(),
                    user: user.username
                };
                
                // Save learning data
                saveAILearningData();
                
                console.log(`👆 ${isGood ? 'Thumbs up' : 'Thumbs down'} from ${user.username} for: "${message.content}"`);
            });
        }
        
        // Mark message as processed and log response
        messageResponseTracker.set(spamKey, true);
        await logBotResponse(message.channel.name, message.content, 'Q&A Response', message.author.id, message.author.username);
    }    } catch (error) {
        console.error('❌ Error in message handler:', error);
        // Don't crash the bot - just log the error
        try {
            await sendToAdmin(`🚨 **Message Handler Error**: ${error.message}\n**Stack**: ${error.stack}`);
        } catch (adminError) {
            console.error('❌ Failed to send error to admin:', adminError);
        }
    }
});

// Track processed members to prevent duplicates
const processedMembers = new Set();

// SPAM FILTER - Track message responses to prevent multiple responses
const messageResponseTracker = new Map();
const auditLog = [];

// MANUAL MONITORING SYSTEM - Only when triggered by commands
let monitoringActive = false;
let testCounter = 0;

// Manual monitoring function (only called when !monitor-debug is used)
function startManualMonitoring() {
    if (monitoringActive) return;
    
    monitoringActive = true;
    console.log('🔍 Starting manual monitoring system...');
    
    // Single test run (not continuous)
    setTimeout(async () => {
        if (!monitoringActive) return;
        
        testCounter++;
        const testId = `MANUAL_MONITOR_${testCounter}_${Date.now()}`;
        
        try {
            // Check for recent duplicates
            const recentLogs = auditLog.slice(-10);
            const duplicateCheck = recentLogs.filter(log => 
                log.timestamp > new Date(Date.now() - 60000).toISOString()
            );
            
            // Send consolidated debug info in a single message
            const debugContent = `🔍 **MANUAL MONITOR TEST #${testCounter}** - Test ID: ${testId}
⏰ **TIMESTAMP**: ${new Date().toISOString()}
📊 **AUDIT LOGS**: ${auditLog.length} total entries
🚫 **SPAM FILTER**: ${messageResponseTracker.size} tracked messages
📝 **RECENT ACTIVITY**: ${duplicateCheck.length} entries in last minute${duplicateCheck.length > 5 ? '\n⚠️ **HIGH ACTIVITY DETECTED** - ' + duplicateCheck.length + ' responses in last minute' : ''}`;
            
            await sendToAdmin({ content: debugContent });
            
            // Stop monitoring after single test
            monitoringActive = false;
            
        } catch (error) {
            console.error('❌ Monitoring error:', error);
            monitoringActive = false;
        }
    }, 5000); // Single test after 5 seconds
}

// Helper function to log webhook responses for audit (only when webhooks are triggered)
async function logBotResponse(channelName, messageContent, responseType, userId, username) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        channel: channelName,
        message: messageContent,
        responseType: responseType,
        userId: userId,
        username: username,
        botResponse: true
    };
    
    auditLog.push(logEntry);
    
    // Keep only last 1000 entries to prevent memory leaks
    if (auditLog.length > 1000) {
        auditLog.shift();
    }
    
    console.log(`📊 AUDIT LOG: ${responseType} in ${channelName} by ${username} (${userId})`);
    
    // Only send to admin webhook for important events (not every response)
    if (responseType.includes('Error') || responseType.includes('Duplicate') || responseType.includes('Spam Filter')) {
        try {
            const auditEmbed = new EmbedBuilder()
                .setTitle('⚠️ Important Bot Event')
                .setColor(0xFF6B6B)
                .addFields(
                    { name: 'Channel', value: channelName, inline: true },
                    { name: 'User', value: `${username} (${userId})`, inline: true },
                    { name: 'Event Type', value: responseType, inline: true },
                    { name: 'Message', value: messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent, inline: false },
                    { name: 'Timestamp', value: new Date().toISOString(), inline: true }
                )
                .setTimestamp();
            
            await sendToAdmin({ embeds: [auditEmbed] });
        } catch (error) {
            console.error('❌ Failed to send audit log:', error);
        }
    }
}

// Welcome new members with error handling
client.on('guildMemberAdd', async (member) => {
    try {
        const memberId = member.user.id;
    
    // Check if we've already processed this member
    if (processedMembers.has(memberId)) {
        console.log(`⚠️ Duplicate member join event for ${member.user.username} (ID: ${memberId}) - skipping`);
        return;
    }
    
    // Mark as processed
    processedMembers.add(memberId);
    
    console.log(`👋 New member joined: ${member.user.username} (ID: ${memberId})`);
    console.log(`🔧 DEBUG: General webhook configured: ${webhooks.general ? '✅ YES' : '❌ NO'}`);
    
    // Send SINGLE welcome message to GENERAL CHAT - NO AI, NO SPAM
    try {
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`🎉 Welcome to Arch 2 Addicts, ${member.user.username}!`)
            .setDescription(`Welcome ${member} to the Arch 2 Addicts community - your destination for Archero 2 discussion and strategy!`)
            .setColor(0x00ff88)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage('https://cdn.discordapp.com/attachments/1268830572743102505/1279024218473758770/archero2-logo.png')
            .addFields(
                {
                    name: '🏰 XYIAN OFFICIAL - Guild Recruitment',
                    value: '**Guild ID: 213797**\n• **Grand Master**: XYIAN (Guild Commander)\n• **Requirements**: 2 daily boss battles + donations\n• **Goal**: Dominate leaderboards and become #1\n• **Looking for**: Active players with 300k+ power\n• **Focus**: Peak Arena and PvP excellence',
                    inline: false
                },
                {
                    name: '🎮 Community',
                    value: '• Daily tips and strategies from players\n• Guild recruitment opportunities\n• Event discussions and guides\n• General Archero 2 chat and help\n\n**XY Elder here** - XYIAN\'s trusted henchman ready to help you climb the ranks!',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Arch 2 Addicts Community' });
        
        await sendToGeneral({ embeds: [welcomeEmbed] });
        console.log(`✅ SINGLE welcome message sent for ${member.user.username} (ID: ${memberId})`);
        
        // Send "Wave to say hi!" button message
        const waveMessage = await sendToGeneral({ content: '🤖 **Wave to say hi!**' });
        console.log(`✅ Wave message sent for ${member.user.username}`);
        
        // Send personalized onboarding DM (only one additional message)
        await sendPersonalizedOnboarding(member);
        
    } catch (error) {
        console.error(`❌ Failed to send welcome message for ${member.user.username}:`, error);
    }
    
    // Clean up processed members after 5 minutes to prevent memory leaks
    setTimeout(() => {
        processedMembers.delete(memberId);
    }, 5 * 60 * 1000);
    } catch (error) {
        console.error('❌ Error in guildMemberAdd handler:', error);
        // Don't crash the bot - just log the error
    }
});

// Handle member leaving with error handling
client.on('guildMemberRemove', async (member) => {
    try {
        console.log(`👋 Member left: ${member.user.username}`);
    
    // Remove from activity tracking
    memberActivity.delete(member.id);
    
    // Send farewell message to GENERAL CHAT (not guild chat)
    const farewellEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left Arch 2 Addicts')
        .setDescription(`${member.user.username} has left the community.`)
        .setColor(0xff6b6b)
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts Community' });
    
    await sendToGeneral({ embeds: [farewellEmbed] });
    } catch (error) {
        console.error('❌ Error in guildMemberRemove handler:', error);
        // Don't crash the bot - just log the error
    }
});

// Error handling and crash prevention
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
    // Don't crash on Discord errors - just log them
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't crash on unhandled rejections - just log them
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Don't crash on uncaught exceptions - just log them
});

// Prevent multiple bot instances
const botLockFile = path.join(__dirname, '.bot.lock');
if (fs.existsSync(botLockFile)) {
    console.error('❌ Bot is already running! Another instance detected.');
    process.exit(1);
}

// Create lock file
fs.writeFileSync(botLockFile, process.pid.toString());

// Clean up lock file on exit
process.on('exit', () => {
    if (fs.existsSync(botLockFile)) {
        fs.unlinkSync(botLockFile);
    }
});

process.on('SIGINT', () => {
    console.log('🛑 Bot shutting down gracefully...');
    if (fs.existsSync(botLockFile)) {
        fs.unlinkSync(botLockFile);
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Bot shutting down gracefully...');
    if (fs.existsSync(botLockFile)) {
        fs.unlinkSync(botLockFile);
    }
    process.exit(0);
});

// Login to Discord with error handling
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    // Don't crash - just retry after a delay
    setTimeout(() => {
        console.log('🔄 Retrying Discord login...');
        client.login(process.env.DISCORD_TOKEN).catch(retryError => {
            console.error('❌ Retry failed:', retryError);
        });
    }, 5000);
});
