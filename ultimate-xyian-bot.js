const { Client, GatewayIntentBits, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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
    if (!AIService) return null;
    
    try {
        const context = getAIContext(channelName);
        const completion = await AIService.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: context },
                { role: "user", content: message }
            ],
            max_tokens: 800,
            temperature: 0.8,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        });
        
        const response = completion.choices[0]?.message?.content;
        if (response && response.length > 10) {
            console.log(`🤖 AI Response generated for ${channelName}: ${response.substring(0, 50)}...`);
            return response;
        }
        return null;
    } catch (error) {
        console.error('❌ OpenAI API error:', error.message);
        return null;
    }
}

function getAIContext(channelName) {
    const baseContext = `You are XY Elder, an expert Archero 2 bot assistant for the XYIAN guild community. You have deep knowledge of characters, game mechanics, strategies, and the competitive scene. Be helpful, enthusiastic, and knowledgeable. Use emojis appropriately and provide specific, actionable advice. Always mention relevant character names, weapon names, and specific strategies.`;
    
    const characterKnowledge = `Key Characters: Thor (Legendary - move while firing, weapon detach, hammers, lightning), Demon King (Epic - shield abilities, powerful skins), Rolla (Epic - freeze attacks, crit boost), Dracoola (Epic - life steal), Seraph (Epic - PvE bonuses), Loki (Epic - PvP specific, attack speed), Alex (Starting - heart drop bonus), Nyanja (Speed, cloudfooted), Helix (Damage scaling), Hela (Healing aura, crowd control cleanse).`;
    
    const gameMechanics = `Game Systems: Orbs (Fire/Ice/Lightning/Poison/Dark), Starcores (Razor starcore upgrades), Skins (provide abilities), Resonance (character synergies), Sacred Hall vs Tier Up (different progression paths), Supreme Arena (3 characters, 3 builds, item bonuses), Arena (Dragoon/Griffin top heroes), Guild requirements (2 daily boss battles, donations).`;
    
    const weaponDatabase = `WEAPON DATABASE: Only 3 S-tier weapons exist: Oracle Staff (mage), Griffin Claws (melee), Dragoon Crossbow (ranged). Tier progression: Epic → Legendary → Mythic → Chaotic (max). Basic weapons (Beam Staff, Claw, Bow) can only go to Legendary +3. Thor's Mjolnir is an ability, NOT a weapon.`;
    
    const upgradeSystem = `UPGRADE SYSTEM: Epic +1/+2 (1-2 epics), Legendary +1/+2/+3 (1-2 legendaries), Mythic +1/+2/+3/+4, Chaotic (mythic +4 + 14 epic griffin OR 42 epic OR 38 legendary). Only S-tier weapons can go past Legendary.`;
    
    const eventSystem = `EVENTS: Umbral Tempest currently active. Fishing event gives etched runes (free/gems). Otherworld summon gives Thor/Demon King (cash-only). Most events cost cash or gems.`;
    
    if (channelName === 'bot-questions' || channelName === 'bot-questions-advanced') {
        return `${baseContext} ${characterKnowledge} ${gameMechanics} ${weaponDatabase} ${upgradeSystem} ${eventSystem} This is the advanced bot questions channel. Provide detailed, technical answers about character abilities, builds, game mechanics, strategies, and competitive play. Include specific numbers, percentages, and optimal combinations. ONLY use information from the database - do not make up weapon names, abilities, or stats.`;
    } else if (channelName === 'xyian-guild') {
        return `${baseContext} ${characterKnowledge} ${gameMechanics} ${weaponDatabase} ${upgradeSystem} ${eventSystem} This is the XYIAN guild channel (Guild ID: 213797). Focus on guild requirements (2 daily boss battles, donations), Supreme Arena strategies, team coordination, and competitive guild management. Emphasize teamwork and optimization.`;
    } else if (channelName === 'arena' || channelName === 'supreme-arena') {
        return `${baseContext} ${characterKnowledge} ${weaponDatabase} ${upgradeSystem} ${eventSystem} Focus on Arena and Supreme Arena strategies. Dragoon and Griffin are top heroes (Dragoon preferred unless full Griffin build). Cover runes, builds, positioning, and competitive tactics.`;
    } else {
        return `${baseContext} ${characterKnowledge} ${weaponDatabase} ${upgradeSystem} ${eventSystem} This is a general Archero 2 community channel. Provide helpful advice about basic game mechanics, character recommendations, and beginner-friendly strategies.`;
    }
}

// Fallback response functions for when AI fails
function getFallbackResponse(message) {
    const fallbacks = [
        "🎮 **Great question!** I know about the 3 S-tier weapons (Oracle Staff, Griffin Claws, Dragoon Crossbow), character resonance (3-star/6-star slots), and basic game mechanics. However, I'm not sure about that specific question. Could you rephrase it or ask about weapons, characters, or resonance?",
        "⚔️ **Interesting question!** I have detailed info about S-tier weapons, character abilities (Thor, Demon King, Rolla, etc.), and resonance systems. But I'm not prepared for that specific question. What would you like to know about weapons or characters?",
        "🏰 **Good question!** I know about guild requirements (2 daily boss battles + donations), Supreme Arena strategies, and character synergies. However, I don't have specific information about that topic. Could you ask about something I do know?",
        "💎 **Solid question!** I have comprehensive knowledge about Oracle/Griffin/Dragoon weapons, character resonance slots, and game mechanics. But I'm not sure about that specific question. What aspect of the game interests you?",
        "🔥 **Excellent question!** I know about Arena heroes (Dragoon/Griffin), character abilities, and weapon tiers. However, I'm not prepared for that specific question. Could you ask about something I can help with?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function getAdvancedFallbackResponse(message) {
    const advancedFallbacks = [
        "🔬 **Advanced Question Detected!** While I'm analyzing that complex mechanic, here's some advanced Archero 2 knowledge: Orb swapping costs gems but provides massive build flexibility. Fire orbs boost damage, while Ice orbs provide crowd control. What specific advanced mechanic interests you?",
        "⚡ **Technical Question!** For advanced game mechanics like starcores and resonance, the key is understanding character synergies. Thor's lightning abilities pair well with electric orbs, while Demon King's shield benefits from defensive starcores. What advanced topic would you like to explore?",
        "🎯 **Complex Strategy Question!** Supreme Arena requires 3 different characters with 3 different builds. Each unique item provides bonus health and damage. Dragoon excels with mobility builds, while Griffin dominates with full build optimization. What specific strategy are you working on?",
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
    aiQuestions: 'https://discord.com/api/webhooks/1424322423901392957/r546eXCaL9I1W92YVMAuSoLfk2pbTWs3y8BDr7HTx8jk32-WfTqsID3Sshg8aV8mi6yf',
    umbralTempest: 'https://discord.com/api/webhooks/1424327958687907860/VAjMj6kMDSyKdubcCVuEyu8pTB_Wutn0LZsELvpm8PNJgDVfvV4JQOmwJaR_TO2-wtit',
    gearRuneLoadouts: 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m',
    admin: 'https://discord.com/api/webhooks/1424329654738882647/hLSZIGm5GuhUlr_j4fa5K29ynnYu6htxdTGaoZ7fEyoAXFB0iZa8cJnVH7L6bZ0W5gM2'
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

// Start API server
const startApiServer = require('./api-server');
startApiServer();

// Initialize learning system
const ArcheroLearningSystem = require('./learning-system');
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
            .setDescription(`Hi ${member.user.username}! Welcome to our awesome Archero 2 community!\n\nI'm **XY Elder**, your personal bot assistant. I can help you with game strategies, builds, and guild information.`)
            .setColor(0x9b59b6)
            .addFields(
                { 
                    name: '🎮 Available Commands', 
                    value: '• `!ping` - Check if I\'m online\n• `!help` - See all commands\n• `!menu` - Public question menu\n• `!xyian info` - Guild information (requires role)\n• `!tip` - Daily Archero 2 tips (requires role)', 
                    inline: false 
                },
                { 
                    name: '💬 Ask Me Anything!', 
                    value: 'Just type your question naturally - no commands needed!\n\n**Examples:**\n• "What\'s the best weapon for beginners?"\n• "How do I get better at Arena?"\n• "What characters should I focus on?"\n• "Is Dragon Helmet + Oracle Spear good?"', 
                    inline: false 
                },
                { 
                    name: '🏰 XYIAN Guild', 
                    value: 'Guild ID: **213797**\nRequirements: 2 daily boss battles + donations\nLooking for active players with 300k+ power!', 
                    inline: false 
                },
                { 
                    name: '⚡ Personalized Setup', 
                    value: 'Want **personalized tips**? Reply with **"yes"** to set up custom daily reminders, build advice, and arena strategies!', 
                    inline: false 
                }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'XYIAN Bot - Your Archero 2 Assistant' });
        
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
        .setDescription('**Question 3:** Would you like arena strategy tips?\n\nThese will help you with:\n• Supreme Arena team composition\n• Character resonance strategies\n• Item bonuses and synergies\n• Competitive tactics')
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
    "razor shards": "Razor Shards are rare materials used to upgrade starcores. Sources: Supreme Arena rewards, high-level dungeons, special events, guild activities. Save them for your most important starcores as they're extremely rare.",
    
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
    "resonance": "**CORRECT RESONANCE INFO**: Resonance unlocks character abilities from other characters. 3-star resonance slot unlocks at 3 stars, 6-star resonance slot unlocks at 6 stars. You get abilities from other characters based on your resonance setup. This is NOT about equipment elements - it's about character synergies.",
    "resonance levels": "**CORRECT RESONANCE INFO**: 3-star resonance slot: Unlocks at 3 stars, gives you abilities from other characters. 6-star resonance slot: Unlocks at 6 stars, gives you additional abilities from other characters. The more leveled your characters are, the better the resonance effects.",
    "resonance vs diversity": "**CORRECT RESONANCE INFO**: Resonance is about character abilities, not equipment. 3-star slot: Rolla, Helix are best. 6-star slot: Loki, Demon King, Otta are best. This is about character synergies and abilities, not equipment matching.",
    
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
    "best characters": "Best Characters by Content: PvP - Thor, Loki, Demon King. PvE - Seraph, Dracoola, Rolla. Supreme Arena - Thor, Demon King, Griffin. Choose based on your preferred content and playstyle.",
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

// Archero 2 Q&A Database - CORRECTED AND COMPREHENSIVE
const archeroQA = {
    // WEAPONS - COMPREHENSIVE S-TIER DATABASE
    "best weapon": "**S-TIER WEAPONS**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff** (mage), **Griffin Claws** (melee), and **Dragoon Crossbow** (ranged). These are the ONLY weapons that can be upgraded beyond Legendary. Tier progression: Epic → Legendary → Mythic → Chaotic (max).",
    "strongest weapon": "**S-TIER WEAPONS**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff** (mage), **Griffin Claws** (melee), and **Dragoon Crossbow** (ranged). These are the ONLY weapons that can be upgraded beyond Legendary. Tier progression: Epic → Legendary → Mythic → Chaotic (max).",
    "weapons": "**S-TIER WEAPONS**: There are only 3 S-tier weapons in Archero 2: **Oracle Staff** (mage), **Griffin Claws** (melee), and **Dragoon Crossbow** (ranged). These are the ONLY weapons that can be upgraded beyond Legendary. Tier progression: Epic → Legendary → Mythic → Chaotic (max).",
    "oracle staff": "**Oracle Staff** - S-tier weapon (mage type). Tier progression: Epic → Legendary → Mythic → Chaotic (max). Best for mage builds with high damage and great range. Can be upgraded beyond Legendary unlike basic weapons.",
    "griffin claws": "**Griffin Claws** - S-tier weapon (melee type). Tier progression: Epic → Legendary → Mythic → Chaotic (max). Excellent for close combat with high attack speed. Perfect for warrior builds and melee combat.",
    "dragoon crossbow": "**Dragoon Crossbow** - S-tier weapon (ranged type). Tier progression: Epic → Legendary → Mythic → Chaotic (max). Powerful ranged weapon, great for PvP and archer builds. Can be upgraded beyond Legendary unlike basic weapons.",
    "weapon tiers": "**WEAPON TIER SYSTEM**: S-tier weapons (Oracle Staff, Griffin Claws, Dragoon Crossbow) follow this progression: Epic → Legendary → Mythic → Chaotic (max tier). Basic weapons (Bow, Staff, Claws) cannot level past Legendary and are inferior.",
    "chaotic tier": "**CHAOTIC TIER**: The maximum tier for S-tier weapons. Only Oracle Staff, Griffin Claws, and Dragoon Crossbow can reach Chaotic tier. Provides the highest stats and abilities in the game.",
    "mythic tier": "**MYTHIC TIER**: Second-highest tier for S-tier weapons. Only Oracle Staff, Griffin Claws, and Dragoon Crossbow can reach Mythic tier. Significant stat boost from Legendary.",
    "s tier weapons": "**S-TIER WEAPONS**: Oracle Staff (mage), Griffin Claws (melee), Dragoon Crossbow (ranged). These are the ONLY weapons that can be upgraded beyond Legendary. Tier progression: Epic → Legendary → Mythic → Chaotic (max).",
    
    // UPGRADE SYSTEM - COMPREHENSIVE DATABASE
    "upgrade system": "**UPGRADE SYSTEM**: Epic has +1 and +2 levels. +1 takes 1 other epic, +2 takes 2 other epics. To make Legendary: need another epic +2 of same type. Legendary has +1, +2, +3 levels. +1 and +2 need 1 other legendary, +3 needs 2 legendaries. To make Mythic: need two legendary +3. Mythic has +1, +2, +3, +4 levels. To make Chaotic: need mythic +4 + 14 epic griffin helmets OR 42 epic helmets OR 38 legendary helmets.",
    "epic upgrade": "**EPIC UPGRADE**: Epic items have +1 and +2 levels. +1 requires 1 other epic of same type, +2 requires 2 other epics. To upgrade to Legendary: need another epic +2 of the same type.",
    "legendary upgrade": "**LEGENDARY UPGRADE**: Legendary items have +1, +2, +3 levels. +1 and +2 require 1 other legendary, +3 requires 2 legendaries. To upgrade to Mythic: need two legendary +3 of the same type.",
    "mythic upgrade": "**MYTHIC UPGRADE**: Mythic items have +1, +2, +3, +4 levels. To upgrade to Chaotic: need mythic +4 + 14 epic griffin helmets OR 42 epic helmets OR 38 legendary helmets.",
    "chaotic upgrade": "**CHAOTIC UPGRADE**: To make Chaotic Oracle Helmet: need mythic +4 + 14 epic griffin helmets OR 42 epic helmets OR 38 legendary helmets. This system applies to all items (crossbow to mythic needs 43 epic weapons, etc.).",
    "basic weapons": "**BASIC WEAPONS**: Beam Staff, Claw, and Bow are NOT S-tier and can only go to Legendary +3. They cannot go past Legendary tier. Only S-tier weapons (Oracle Staff, Griffin Claws, Dragoon Crossbow) can reach Mythic and Chaotic tiers.",
    "upgrade costs": "**UPGRADE COSTS**: Epic +1 (1 epic), Epic +2 (2 epics), Legendary +1/+2 (1 legendary), Legendary +3 (2 legendaries), Mythic +1/+2/+3/+4 (various legendary costs), Chaotic (mythic +4 + 14 epic griffin OR 42 epic OR 38 legendary).",
    
    // EVENTS - CURRENT AND RECURRING
    "events": "**CURRENT EVENTS**: Umbral Tempest is currently active. Events change regularly and typically cost cash or gems. Some events like fishing give free rewards, others like Thor/Demon King events are cash-only.",
    "umbral tempest": "**UMBRAL TEMPEST**: Currently active event. Check the Umbral Tempest channel for specific details, rewards, and strategies. Events like this change regularly and may require cash or gems to participate fully.",
    "fishing event": "**FISHING EVENT**: One of the best events - gives etched runes and can be done for free or with gems. Provides good rewards without requiring cash. Focus on this event when it's available for free progression.",
    "otherworld summon": "**OTHERWORLD SUMMON**: Event where you can get Thor and Demon King characters. This event is typically cash-only, so requires real money to participate. Thor and Demon King are premium characters from this event.",
    "etched runes": "**ETCHED RUNES**: Special runes obtained from fishing event and other events. These are valuable upgrade materials that can significantly boost your character's power. Focus on events that give these for free progression.",
    "event costs": "**EVENT COSTS**: Most events cost cash or gems. Fishing event is one of the best for free players (can use gems). Thor/Demon King events are typically cash-only. Always check event requirements before participating.",
    "free events": "**FREE EVENTS**: Fishing event is the best free event - gives etched runes and can be done with gems. Most other events require cash. Focus on fishing when available for free progression.",
    "premium events": "**PREMIUM EVENTS**: Thor and Demon King events are cash-only. These give access to premium characters but require real money. Only participate if you're willing to spend cash.",
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
    "supreme arena": "Supreme Arena is the ultimate PvP challenge requiring 3 different characters with 3 different builds. Each different item provides bonus health and damage. Top 40% of players remain in Supreme Rank weekly, others are demoted. Only the most skilled players with optimal builds can consistently win.",
    "arena vs supreme arena": "Both are fully automated PvP modes. Arena is accessible to most players with decent rewards. Supreme Arena requires 3-character team composition with different builds and items for maximum bonuses. Supreme Arena has much higher difficulty but offers the best rewards and exclusive items.",
    "arena tips": "**Arena Tips**: 1) Use **Dragoon** as your primary hero, 2) Use **Griffin** only if you have a complete Griffin build, 3) Equip Revive Rune for second chance, 4) Prioritize ranged attack enhancements, 5) Focus on S-tier gear upgrades, 6) Complete daily arena runs, 7) Aim for top 15 in bracket for tier advancement. Dragoon excels with mobility builds, while Griffin dominates with full build optimization.",
    "supreme arena tips": "**Supreme Arena Tips**: 1) Use **3 different characters** with **3 different builds**, 2) Each different item provides **bonus health and damage**, 3) Dragoon + Griffin + third hero recommended, 4) Revive Rune is essential (50% chance to revive with half HP), 5) Maximize item diversity for stat bonuses, 6) Focus on Multi-shot, Ricochet, Piercing skills, 7) Only top 1% players compete here. Best characters: Dragoon (mobility), Griffin (damage), Thor (lightning), Demon King (defensive).",
    "supreme arena rules": "Supreme Arena Rules: 1) Must use 3 different characters, 2) Must use 3 different builds (can use same character but different items), 3) Each different item provides bonus health and damage, 4) Top 40% of players remain in Supreme Rank weekly, 5) 60% are demoted each week, 6) No player limit in Supreme Rank.",
    "team composition": "Supreme Arena Team Composition: 1) Use 3 different characters, 2) Each character needs different build, 3) Maximize item diversity for bonuses, 4) Recommended: Dragoon + Griffin + third hero, 5) Balance damage and survivability, 6) Each unique item type adds health and damage.",
    "item bonuses": "Item Bonus System: 1) Each different item type provides bonus health, 2) Each different item type provides bonus damage, 3) Different item combinations provide additional synergy effects, 4) Mix and match for maximum stat gains, 5) Focus on item diversity over duplicates.",
    "best arena heroes": "**Top Arena Heroes**: 1) **Dragoon** - The absolute best Arena hero, 2) **Griffin** - Only use if you have a complete Griffin build, 3) Avoid other heroes for competitive Arena. Dragoon is the clear #1 choice for both Arena and Supreme Arena.",
    "arena runes": "**Best Arena Runes**: 1) **Revive Rune** (essential for second chance), 2) **Guardian Rune** (solid alternative), 3) **Flame Knock Touch Rune** (good backup). Focus on runes that enhance ranged attacks and survivability.",
    "pvp": "**PvP Strategy**: Focus on mobility, positioning, and timing. Use characters like **Loki** (PvP specialist), **Dragoon** (mobility), or **Griffin** (damage). Learn enemy patterns and save ultimates for key moments. Arena and Supreme Arena are fully automated PvP modes.",
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
        "👑 **Supreme Arena**: Requires 3 different characters with 3 different builds! Each unique item provides bonus health and damage!",
        "⚔️ **Supreme Team**: Use Dragoon + Griffin + third hero for optimal Supreme Arena team composition!",
        "🎯 **Item Diversity**: Maximize different item types for maximum stat bonuses in Supreme Arena!",
        "💪 **Supreme Ranking**: Top 40% stay in Supreme Rank weekly - 60% get demoted! Stay competitive!",
        "🔥 **Revive Rune**: Essential for Supreme Arena - 50% chance to revive with half HP at Epic level!"
    ];

// Supreme Arena tips database (research-based)
const supremeArenaTips = [
    "👑 **Supreme Arena**: The ultimate PvP challenge requiring 3 different characters with 3 different builds!",
    "⚔️ **Supreme Team**: Use Dragoon + Griffin + third hero for optimal team composition!",
    "🎯 **Item Bonuses**: Each different item provides bonus health and damage - maximize item diversity!",
    "💪 **Supreme Rules**: Top 40% stay in Supreme Rank weekly, 60% get demoted - stay competitive!",
    "🔥 **Revive Rune**: Essential for Supreme Arena - 50% chance to revive with half HP at Epic level!",
    "🌟 **Build Diversity**: Each character needs different build - can use same character but different items!",
    "🏆 **Supreme Strategy**: Balance damage and survivability across all 3 characters!",
    "💎 **Item Synergy**: Different item combinations provide additional synergy effects!",
    "⚡ **Supreme Skills**: Multi-shot, Ricochet, and Piercing are the top skills for Supreme Arena!",
    "🛡️ **Supreme Defense**: Focus on survivability - you need to outlast your opponents!",
    "🎮 **Team Building**: Must use 3 different characters - no duplicates allowed!",
    "🔥 **Stat Optimization**: Mix and match items for maximum health and damage bonuses!",
    "💪 **Supreme Ranking**: No player limit in Supreme Rank - compete with the best!",
    "🌟 **Meta Adaptation**: Stay updated with current Supreme Arena meta strategies!",
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
client.once('ready', () => {
    console.log('🏰 XYIAN Ultimate Bot - Initializing...');
    console.log(`✅ XYIAN Ultimate Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set up daily messaging system
    setupDailyMessaging();
    
    // Set up daily reset messaging (5pm Pacific)
    setupDailyResetMessaging();
    
    console.log('✅ All systems activated!');
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
    if (AIService && AIService.isAIAvailable()) {
        try {
            const aiMessage = await AIService.generateDailyMessage('guild');
            if (aiMessage) {
                // Parse AI response (simple parsing)
                const lines = aiMessage.split('\n').filter(line => line.trim());
                title = lines[0] || '🔄 Daily Reset - XYIAN Guild';
                description = lines.slice(1).join('\n') || '**Daily reset is here! Time to get back to business!**';
                funFact = '💡 **AI Generated**: This message was created by AI for variety!';
            }
        } catch (error) {
            console.error('❌ AI daily message error:', error);
        }
    }
    
    // Fallback to database if AI didn't work
    if (!title) {
        const randomMessage = guildResetMessages[Math.floor(Math.random() * guildResetMessages.length)];
        title = randomMessage.title;
        description = randomMessage.description;
        funFact = randomMessage.funFact;
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

// General reset message
async function sendGeneralResetMessage() {
    const randomMessage = generalResetMessages[Math.floor(Math.random() * generalResetMessages.length)];
    
    const embed = new EmbedBuilder()
        .setTitle(randomMessage.title)
        .setDescription(randomMessage.description)
        .addFields({ name: 'Did You Know?', value: randomMessage.funFact, inline: false })
        .setColor(0x00FF88) // Green for positivity
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts - Daily Reset' });

    await sendToGeneral({ embeds: [embed] });
}

// Send daily tip
async function sendDailyTip() {
    const tip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('💡 Daily Archero 2 Tip')
        .setDescription(tip)
        .setColor(0x00BFFF) // Light blue
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Daily Tips' });

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
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN Guild Expedition')
        .setDescription('**Ready for another day of conquest and glory!**\n\n⚔️ **Expedition Focus:**\n• Complete daily expedition challenges\n• Maximize guild contribution points\n• Unlock rare rewards and materials\n• Support your fellow guild members\n\n🎯 **Today\'s Strategy:**\n• Focus on high-value targets\n• Coordinate with guild members\n• Use optimal builds for each stage\n• Share discoveries and tips\n\n💪 **Let\'s show everyone why XYIAN is the best!**')
        .setColor(0x8A2BE2) // Purple for expedition
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Guild Expedition' });

    await sendToExpedition({ embeds: [embed] });
}

// Send arena tip
async function sendArenaTip() {
    const arenaTip = arenaTips[Math.floor(Math.random() * arenaTips.length)];
    const supremeTip = supremeArenaTips[Math.floor(Math.random() * supremeArenaTips.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🏟️ Daily Arena Tips')
        .setDescription(`**Arena & Supreme Arena Strategies**\n\n${arenaTip}\n\n${supremeTip}\n\n💪 **Key Differences:**\n• **Arena**: Focus on speed and efficiency\n• **Supreme Arena**: Ultimate challenge requiring perfect execution\n• **Rewards**: Supreme Arena offers the best rewards\n• **Strategy**: Both require high DPS and optimal positioning`)
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
    if (!webhooks.general) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.general });
        await webhook.send(content);
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
    return member.roles.cache.some(role => role.name === 'Supreme Arena');
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

// Message handling
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
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
                    await message.reply('🏰 XYIAN Ultimate Bot - Online! (DM Mode)');
                    console.log(`✅ DM ping response sent to ${message.author.username}`);
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
                    // Try Q&A for unknown commands
                    const answer = getAnswer(message.content);
                    if (answer) {
                        const qaEmbed = new EmbedBuilder()
                            .setTitle('❓ Archero 2 Q&A (DM)')
                            .setDescription(answer)
                            .setColor(0x32CD32)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN Bot - DM Q&A' });
                        await message.reply({ embeds: [qaEmbed] });
                    } else {
                        await message.reply('❓ I didn\'t understand that. Try asking an Archero 2 question or use `!help` for commands.');
                    }
            }
        } else {
            // Check if user is in personalized setup
            if (await handlePersonalizedSetup(message) || await continuePersonalizedSetup(message)) {
                return;
            }
            
            // Handle Q&A for non-command messages
            const answer = getAnswer(message.content);
            if (answer) {
                const qaEmbed = new EmbedBuilder()
                    .setTitle('❓ Archero 2 Q&A (DM)')
                    .setDescription(answer)
                    .setColor(0x32CD32)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - DM Q&A' });
                await message.reply({ embeds: [qaEmbed] });
            } else {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🤖 XYIAN Bot - Direct Message')
                    .setDescription(`Hello ${message.author.username}! I'm the XYIAN Bot for the Arch 2 Addicts community.\n\n**Available Commands:**\n• \`!help\` - Show all commands\n• \`!menu\` - Show question menu\n• Ask any Archero 2 question!\n\n**Note:** For full functionality, please use me in the Arch 2 Addicts server!`)
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - DM Support' });
                await message.reply({ embeds: [dmEmbed] });
            }
        }
        return;
    }
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        switch (commandName) {
            case 'ping':
                await message.reply('🏰 XYIAN Ultimate Bot - Online!');
                break;
                
            case 'tip':
                // Only XYIAN OFFICIAL can trigger daily tips
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                await sendDailyTip();
                await message.reply('📝 Daily tip sent!');
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
                        
                        let weaponInfo = '';
                        if (weaponName.includes('staff') || weaponName.includes('light')) {
                            weaponInfo = '**Staff of Light** - Best for Mage class. High magical damage, great range, and excellent area damage. Special ability can clear waves of enemies effectively.';
                        } else if (weaponName.includes('demon') || weaponName.includes('blade')) {
                            weaponInfo = '**Demon Blade** - Best for Warrior class. Exceptional melee damage with high critical hit potential. Special ability devastates groups of enemies.';
                        } else if (weaponName.includes('windforce') || weaponName.includes('bow')) {
                            weaponInfo = '**Windforce Bow** - Best for Archer class. Excellent range with piercing damage. Special abilities hit multiple enemies and provide great area control.';
                        } else {
                            weaponInfo = `**${weaponName}** - Weapon information not found. Try: Staff of Light, Demon Blade, or Windforce Bow.`;
                        }
                        
                        const weaponEmbed = new EmbedBuilder()
                            .setTitle(`⚔️ Weapon: ${weaponName}`)
                            .setDescription(weaponInfo)
                            .setColor(0xFF4500)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [weaponEmbed] });
                        break;
                        
                    case 'skill':
                        const skillName = args.slice(1).join(' ').toLowerCase();
                        if (!skillName) {
                            await message.reply('❌ Please specify a skill name. Example: `!xyian skill multi-shot`');
                            return;
                        }
                        
                        let skillInfo = '';
                        if (skillName.includes('multi') || skillName.includes('shot')) {
                            skillInfo = '**Multi-shot** - Increases the number of projectiles fired. Essential for DPS builds and clearing multiple enemies.';
                        } else if (skillName.includes('ricochet')) {
                            skillInfo = '**Ricochet** - Projectiles bounce between enemies. Excellent for crowd control and maximizing damage output.';
                        } else if (skillName.includes('piercing')) {
                            skillInfo = '**Piercing** - Projectiles pass through enemies. Great for line formations and area damage.';
                        } else {
                            skillInfo = `**${skillName}** - Skill information not found. Try: Multi-shot, Ricochet, or Piercing.`;
                        }
                        
                        const skillEmbed = new EmbedBuilder()
                            .setTitle(`✨ Skill: ${skillName}`)
                            .setDescription(skillInfo)
                            .setColor(0x9370DB)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [skillEmbed] });
                        break;
                        
                    case 'build':
                        const className = args.slice(1).join(' ').toLowerCase();
                        if (!className) {
                            await message.reply('❌ Please specify a class. Example: `!xyian build mage`');
                            return;
                        }
                        
                        let buildInfo = '';
                        if (className.includes('mage')) {
                            buildInfo = '**Mage Build:**\n• Weapon: Staff of Light\n• Skills: Multi-shot, Ricochet, Piercing\n• Focus: Magical damage and area control\n• Strategy: Keep distance, use environment';
                        } else if (className.includes('warrior')) {
                            buildInfo = '**Warrior Build:**\n• Weapon: Demon Blade\n• Skills: Multi-shot, Side Arrow, Bouncy Wall\n• Focus: High DPS and critical hits\n• Strategy: Aggressive play, target elites first';
                        } else if (className.includes('archer')) {
                            buildInfo = '**Archer Build:**\n• Weapon: Windforce Bow\n• Skills: Multi-shot, Ricochet, Piercing\n• Focus: Range and mobility\n• Strategy: Kite enemies, use walls for cover';
                        } else {
                            buildInfo = `**${className}** - Class information not found. Try: Mage, Warrior, or Archer.`;
                        }
                        
                        const buildEmbed = new EmbedBuilder()
                            .setTitle(`🎯 Build: ${className}`)
                            .setDescription(buildInfo)
                            .setColor(0x20B2AA)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
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
                    .setDescription('**Public Commands:**\n`!ping` - Check bot status\n`!menu` - Show public question menu\n`!help` - This help\n\n**XYIAN OFFICIAL Commands:**\n`!tip` - Send daily tip\n`!recruit` - Send recruitment (guild chat only)\n`!xyian help` - XYIAN command list\n\n**XYIAN Guild Verified Commands:**\n`!expedition` - Send expedition message\n`!arena` - Send arena tips\n`!reset` - Send reset messages\n\n**Admin Commands:**\n`!test` - Send test messages\n\n**Q&A System:**\nAsk any Archero 2 question naturally!\n\n**Role Requirements:**\n- XYIAN OFFICIAL: Full access\n- XYIAN Guild Verified: Basic AI questions\n- Admin: Administrative commands')
                    .setColor(0x00BFFF)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN OFFICIAL' });
                await message.reply({ embeds: [generalHelpEmbed] });
                break;
                
            case 'menu':
                const menuEmbed = new EmbedBuilder()
                    .setTitle('🎮 Public Archero 2 Question Menu')
                    .setDescription('**Ask me anything about Archero 2!**\n\n**Popular Questions:**\n• "What\'s the best weapon?"\n• "Which character should I use?"\n• "Is Dragon Helmet + Oracle good?"\n• "What\'s the best set for PvP?"\n• "How do orbs work?"\n• "What\'s the difference between Sacred Hall and Tier Up?"\n\n**Just type your question naturally!**\nExample: "I have dragon helmet and oracle spear, is this a good combo?"')
                    .addFields(
                        { name: '💡 Pro Tip', value: 'Be specific! The more details you give, the better I can help you.', inline: false },
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
                    const Archero2DataScraper = require('./archero2-data-scraper');
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
                
            default:
                // Try Q&A system
                const answer = getAnswer(message.content);
                if (answer) {
                    const startTime = Date.now();
                    const qaEmbed = new EmbedBuilder()
                        .setTitle('❓ Archero 2 Q&A')
                        .setDescription(answer)
                        .setColor(0x32CD32)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN OFFICIAL' });
                    
                    const response = await message.reply({ embeds: [qaEmbed] });
                    const responseTime = Date.now() - startTime;
                    
                    // Log interaction and add feedback
                    logInteraction(message.content, answer, message.author.id, message.channel.name, responseTime, false);
                    await addReactionFeedback(response);
                } else {
                    await message.reply('❓ I didn\'t understand that. Try asking an Archero 2 question or use `!help` for commands.');
                }
        }
    } else {
        // Check if this is a bot questions channel
        if (message.channel.name === 'bot-questions' || message.channel.name === 'bot-questions-advanced') {
            // Check for help command
            if (message.content.toLowerCase().includes('!bothelp') || message.content.toLowerCase().includes('!bot help')) {
                const helpEmbed = getBotQuestionHelp();
                await message.reply({ embeds: [helpEmbed] });
                return;
            }
            
            // Use database only (AI will be handled in main Q&A section to prevent duplicates)
            const response = handleBotQuestion(message.content);
            
            if (response && response !== "I don't have specific information about that topic yet. Could you rephrase your question or ask about orbs, starcores, skins, resonance, sacred halls, or other advanced game mechanics? I'm here to help with the deeper nuances of Archero 2!") {
                const embed = new EmbedBuilder()
                    .setTitle('🤖 Advanced Archero 2 Answer')
                    .setDescription(response)
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - Advanced Game Mechanics' });
                
                await message.reply({ embeds: [embed] });
                return;
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('🤖 Advanced Archero 2 Answer')
                    .setDescription(getAdvancedFallbackResponse(message.content))
                    .setColor(0x9b59b6)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN Bot - Advanced Game Mechanics' });
                
                await message.reply({ embeds: [embed] });
                return;
            }
        }
        
        // Q&A System with role-based access
        let answer = null;
        let isAIResponse = false;
        
        // Check if user has access to AI features
        const hasAIAccess = hasBasicAccess(message.member);
        
        if (AIService && hasAIAccess) {
            try {
                answer = await generateAIResponse(message.content, message.channel.name);
                if (answer && answer.length > 10) {
                    isAIResponse = true;
                }
            } catch (error) {
                console.error('❌ AI response error:', error);
            }
        }
        
        // Fallback to database if AI didn't respond or user doesn't have access
        if (!answer || !isAIResponse) {
            answer = getAnswer(message.content);
            
            // If no database answer, provide a helpful fallback
            if (!answer) {
                if (hasAIAccess) {
                    answer = getFallbackResponse(message.content);
                } else {
                    answer = "❓ I'd love to help with your Archero 2 question! However, AI-powered responses require the **XYIAN Guild Verified** role or higher. You can still ask basic questions, or use `!menu` to see what I can help with!";
                }
            }
            
            const qaEmbed = new EmbedBuilder()
                .setTitle(isAIResponse ? '🤖 AI-Powered Archero 2 Answer' : '❓ Archero 2 Q&A')
                .setDescription(answer)
                .setColor(isAIResponse ? 0x32CD32 : (hasAIAccess ? 0x00BFFF : 0xFF6B35))
                .setTimestamp()
                .setFooter({ text: isAIResponse ? 'XYIAN Bot - AI Enhanced' : (hasAIAccess ? 'XYIAN OFFICIAL' : 'Basic Access') });
            await message.reply({ embeds: [qaEmbed] });
        } else {
            // AI response
            const startTime = Date.now();
            const qaEmbed = new EmbedBuilder()
                .setTitle('🤖 AI-Powered Archero 2 Answer')
                .setDescription(answer)
                .setColor(0x32CD32)
                .setTimestamp()
                .setFooter({ text: 'XYIAN Bot - AI Enhanced' });
            
            const response = await message.reply({ embeds: [qaEmbed] });
            const responseTime = Date.now() - startTime;
            
            // Log AI interaction and add feedback
            logInteraction(message.content, answer, message.author.id, message.channel.name, responseTime, true);
            await addReactionFeedback(response);
        }
    }
});

// Track processed members to prevent duplicates
const processedMembers = new Set();

// Welcome new members
client.on('guildMemberAdd', async (member) => {
    const memberId = member.user.id;
    
    // Check if we've already processed this member
    if (processedMembers.has(memberId)) {
        console.log(`⚠️ Duplicate member join event for ${member.user.username} (ID: ${memberId}) - skipping`);
        return;
    }
    
    // Mark as processed
    processedMembers.add(memberId);
    
    console.log(`👋 New member joined: ${member.user.username} (ID: ${memberId})`);
    
    // Send single AI-enhanced welcome message to GENERAL CHAT
    try {
        let welcomeMessage = `Welcome ${member} to the Arch 2 Addicts community - your premier destination for Archero 2 discussion and strategy!`;
        
        // Use AI to add unique flavor if available
        if (AIService) {
            try {
                const aiWelcome = await generateAIResponse(`Create a unique, welcoming message for a new member named ${member.user.username} joining the Arch 2 Addicts Discord community. Keep it short, friendly, and mention they can ask questions about Archero 2.`, 'general');
                if (aiWelcome && aiWelcome.length > 10) {
                    welcomeMessage = aiWelcome;
                }
            } catch (error) {
                console.error('❌ AI welcome generation failed:', error);
            }
        }
        
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🎉 Welcome to Arch 2 Addicts!')
            .setDescription(welcomeMessage)
            .setColor(0x00ff88)
            .addFields(
                { name: 'Community Features', value: '• Daily tips and strategies\n• Guild recruitment opportunities\n• Expert Q&A system\n• Event discussions and guides', inline: false },
                { name: 'Getting Started', value: 'Use `!help` to view all available commands\nAsk any Archero 2 question for instant answers', inline: false },
                { name: 'Join Our Guild', value: 'Looking for a guild? Check out XYIAN OFFICIAL!\nGuild ID: 213797', inline: false },
                { name: '🤖 AI-Powered Help', value: 'Check out the **Archero AI** channel for advanced build analysis and personalized strategies!', inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Arch 2 Addicts Community' });
        
        await sendToGeneral({ embeds: [welcomeEmbed] });
        console.log(`✅ Welcome message sent for ${member.user.username} (ID: ${memberId})`);
        
        // Send personalized onboarding DM (only one additional message)
        await sendPersonalizedOnboarding(member);
        
    } catch (error) {
        console.error(`❌ Failed to send welcome message for ${member.user.username}:`, error);
    }
    
    // Clean up processed members after 5 minutes to prevent memory leaks
    setTimeout(() => {
        processedMembers.delete(memberId);
    }, 5 * 60 * 1000);
});

// Handle member leaving
client.on('guildMemberRemove', async (member) => {
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
});

// Error handling
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
