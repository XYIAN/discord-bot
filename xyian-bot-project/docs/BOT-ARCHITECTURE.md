# XYIAN Bot Architecture & Working Examples

## Overview

The XYIAN Discord Bot is a comprehensive Archero 2 community management system built with Node.js, Discord.js, and OpenAI integration. This document provides working examples and architectural patterns.

## Core Architecture

### File Structure
```
discord-bot/
├── ultimate-xyian-bot.js          # Main bot file (production)
├── api-server.js                  # Express API server
├── src/                           # TypeScript source (development)
│   ├── commands/                  # Command modules
│   ├── services/                  # Service layer
│   ├── utils/                     # Utility functions
│   └── types/                     # TypeScript definitions
├── docs/                          # Documentation
├── archive/                       # Legacy files
├── config/                        # Configuration files
└── research-tools/                # Knowledge base integration tools
```

## Working Examples

### 1. AI Integration Pattern

**Implementation:**
```javascript
// AI Service initialization with fallback
let AIService = null;
try {
    OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY) {
        AIService = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ AI Service loaded successfully');
    }
} catch (error) {
    console.log('⚠️ OpenAI package not installed. AI features disabled.');
}

// AI Response with context awareness
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
        });
        
        const response = completion.choices[0]?.message?.content;
        return response && response.length > 10 ? response : null;
    } catch (error) {
        console.error('❌ OpenAI API error:', error.message);
        return null;
    }
}
```

**Usage Example:**
```javascript
// In message handler
let answer = null;
let isAIResponse = false;

if (AIService) {
    try {
        answer = await generateAIResponse(message.content, message.channel.name);
        if (answer && answer.length > 10) {
            isAIResponse = true;
        }
    } catch (error) {
        console.error('❌ AI response error:', error);
    }
}

// Fallback to database if AI didn't respond
if (!answer || !isAIResponse) {
    answer = getAnswer(message.content);
    if (!answer) {
        answer = getFallbackResponse(message.content);
    }
}
```

### 2. Webhook Service Pattern

**Implementation:**
```javascript
// Webhook configuration
const webhooks = {
    xyian: process.env.XYIAN_GUILD_WEBHOOK,
    general: process.env.GENERAL_CHAT_WEBHOOK,
    recruit: process.env.GUILD_RECRUIT_WEBHOOK,
    expedition: process.env.GUILD_EXPEDITION_WEBHOOK,
    arena: process.env.GUILD_ARENA_WEBHOOK
};

// Webhook sending functions
async function sendToXYIAN(content) {
    if (!webhooks.xyian) {
        console.error('❌ XYIAN webhook not configured');
        return;
    }
    
    try {
        const webhook = new WebhookClient({ url: webhooks.xyian });
        await webhook.send(content);
        console.log('✅ Message sent to XYIAN guild');
    } catch (error) {
        console.error('❌ Failed to send to XYIAN:', error);
    }
}
```

**Usage Example:**
```javascript
// Sending daily tips
async function sendDailyTip() {
    const tips = [
        "💡 **Daily Tip**: Focus on upgrading your main weapon first - it provides the most DPS increase!",
        "⚔️ **Strategy**: Complete 2 daily boss battles for 2x rewards and guild contribution!",
        "🏰 **Guild Tip**: Donations help the entire guild - aim for daily contributions!"
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    await sendToGeneral({ content: randomTip });
}
```

### 3. Command System Pattern

**Implementation:**
```javascript
// Command routing
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(' ');
        const command = args.shift().toLowerCase();
        
        switch (command) {
            case 'xyian':
                await handleXYIANCommand(message, args);
                break;
            case 'tip':
                await sendDailyTip();
                await message.reply('📢 Daily tip sent!');
                break;
            case 'help':
                await showHelp(message);
                break;
        }
    }
});
```

**XYIAN Command Handler:**
```javascript
async function handleXYIANCommand(message, args) {
    // Check for XYIAN OFFICIAL role
    const member = message.member;
    const hasXYIANRole = member.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
    
    if (!hasXYIANRole) {
        await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
        return;
    }
    
    const subcommand = args[0]?.toLowerCase();
    
    switch (subcommand) {
        case 'info':
            await showGuildInfo(message);
            break;
        case 'weapon':
            await showWeaponInfo(message, args[1]);
            break;
        case 'skill':
            await showSkillInfo(message, args[1]);
            break;
        default:
            await showXYIANHelp(message);
    }
}
```

### 4. Fallback System Pattern

**Implementation:**
```javascript
// Fallback response functions
function getFallbackResponse(message) {
    const fallbacks = [
        "🎮 **Great question!** While I'm processing that, here's some general Archero 2 advice: Focus on upgrading your main weapon and character abilities. The Staff of Light and Demon Blade are excellent choices for most builds!",
        "⚔️ **Interesting question!** For now, I'd recommend checking out our XYIAN guild strategies. We focus on Supreme Arena optimization and daily boss battles. Feel free to ask about specific characters or weapons!",
        "🏰 **Good question!** As a XYIAN guild member, I'd suggest focusing on your daily requirements (2 boss battles + donations) and optimizing your character builds. What specific aspect would you like to know more about?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function getAdvancedFallbackResponse(message) {
    const advancedFallbacks = [
        "🔬 **Advanced Question Detected!** While I'm analyzing that complex mechanic, here's some advanced Archero 2 knowledge: Orb swapping costs gems but provides massive build flexibility. Fire orbs boost damage, while Ice orbs provide crowd control. What specific advanced mechanic interests you?",
        "⚡ **Technical Question!** For advanced game mechanics like starcores and resonance, the key is understanding character synergies. Thor's lightning abilities pair well with electric orbs, while Demon King's shield benefits from defensive starcores. What advanced topic would you like to explore?"
    ];
    
    return advancedFallbacks[Math.floor(Math.random() * advancedFallbacks.length)];
}
```

### 5. Scheduled Messaging Pattern

**Implementation:**
```javascript
// Daily messaging system
function setupDailyMessaging() {
    console.log('📅 Starting daily messaging system...');
    
    // Set up daily schedule (every 24 hours) - NO initial messages on startup
    const dailyInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    setInterval(() => {
        sendDailyMessages();
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
```

## Environment Configuration

### Required Environment Variables
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id

# Guild Configuration
ARCH_GUILD_ID=213797

# Webhook URLs
XYIAN_GUILD_WEBHOOK=https://discord.com/api/webhooks/...
GENERAL_CHAT_WEBHOOK=https://discord.com/api/webhooks/...
GUILD_RECRUIT_WEBHOOK=https://discord.com/api/webhooks/...
GUILD_EXPEDITION_WEBHOOK=https://discord.com/api/webhooks/...
GUILD_ARENA_WEBHOOK=https://discord.com/api/webhooks/...

# AI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key

# Hosting Configuration
NODE_ENV=production
PORT=3000
BOT_PERMISSIONS=8
```

## Deployment Examples

### Railway Deployment
```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "node ultimate-xyian-bot.js",
    "build": "echo 'JavaScript deployment - no build step required' && exit 0",
    "dev": "ts-node --esm src/index.ts",
    "test": "node -c ultimate-xyian-bot.js"
  }
}
```

## Error Handling Patterns

### Graceful AI Failure
```javascript
// AI response with fallback
let response = null;
if (AIService) {
    try {
        response = await generateAIResponse(message.content, message.channel.name);
    } catch (error) {
        console.error('❌ AI response error:', error);
    }
}

// Always provide a response
if (!response) {
    response = getFallbackResponse(message.content);
}
```

### Webhook Error Handling
```javascript
async function sendToWebhook(webhookUrl, content) {
    if (!webhookUrl) {
        console.error('❌ Webhook URL not configured');
        return false;
    }
    
    try {
        const webhook = new WebhookClient({ url: webhookUrl });
        await webhook.send(content);
        return true;
    } catch (error) {
        console.error('❌ Webhook send failed:', error);
        return false;
    }
}
```

## Testing Examples

### Local Testing
```bash
# Test bot syntax
node -c ultimate-xyian-bot.js

# Test environment variables
node -e "require('dotenv').config(); console.log('Environment loaded:', Object.keys(process.env).length, 'variables')"

# Test webhook URLs
node -e "require('dotenv').config(); console.log('Webhooks:', Object.entries({xyian: process.env.XYIAN_GUILD_WEBHOOK, general: process.env.GENERAL_CHAT_WEBHOOK}).map(([k,v]) => \`\${k}: \${v ? '✅' : '❌'}\`).join(' '))"
```

### Production Testing
```bash
# Test build process
npm run build

# Test startup (should not send messages)
node ultimate-xyian-bot.js &
sleep 5
pkill -f "node ultimate-xyian-bot.js"
```

## Best Practices

1. **Always provide fallbacks** - Never leave users without a response
2. **Log everything** - Use structured logging for debugging
3. **Test before deploying** - Verify builds and functionality
4. **Handle errors gracefully** - Don't crash on API failures
5. **Use environment variables** - Keep secrets out of code
6. **Document working examples** - Show real usage patterns
7. **Version control everything** - Track all changes
8. **Monitor performance** - Watch for memory leaks and errors
