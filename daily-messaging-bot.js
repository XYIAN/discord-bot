const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

console.log('🏰 XYIAN Daily Messaging Bot - Initializing...');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Webhook configurations
const webhooks = {
    general: process.env.GENERAL_CHAT_WEBHOOK || '',
    xyianGuild: process.env.XYIAN_GUILD_WEBHOOK || '',
    guildRecruit: 'https://discord.com/api/webhooks/1424160069024481462/XqKCTWh_bPPUwKvXWifeOHWtE33NNsfGwQ9yUvlkEQaxqyjlfD3rPtIGFU6KLDdDf3nw'
};

// Guild information
const guildInfo = {
    id: '213797',
    name: 'XYIAN OFFICIAL',
    powerRequirement: '300k+',
    status: 'Active and recruiting'
};

// Daily message templates
const dailyMessages = {
    tips: [
        {
            title: "💡 Daily Archero 2 Tip",
            content: "**Best F2P Gem Usage**: Focus on Mythstone Chests for S-Tier equipment. Don't spread your gems across multiple sets - pick one and max it out!",
            color: 0x00ff88
        },
        {
            title: "⚔️ Combat Strategy",
            content: "**PvP Positioning**: Always try to position yourself diagonally from enemies. This makes it harder for them to hit you while giving you better angles for attacks!",
            color: 0xff6b6b
        },
        {
            title: "🎯 Skill Priority",
            content: "**Essential Skills**: Tracking Eye is the #1 priority for any build. It makes all your projectiles home in on targets, dramatically increasing your accuracy!",
            color: 0x4ecdc4
        },
        {
            title: "🛡️ Gear Optimization",
            content: "**Main Hand Focus**: Most of your DPS comes from your main hand weapon. Focus your upgrades and runes on your primary weapon for maximum damage!",
            color: 0x45b7d1
        },
        {
            title: "🌪️ Umbral Tempest Tips",
            content: "**Event Strategy**: Use Griffin Set for consistent PvP performance. The multi-hit attacks and balanced stats make it perfect for sustained combat!",
            color: 0x8b5cf6
        },
        {
            title: "💰 Economy Tips",
            content: "**Guild Coins**: Save for Blessing Runes if you don't have an Epic Revive Rune. Otherwise, wait for Guild Level 5 for the 10% discount on Chromatic Keys!",
            color: 0xffd700
        }
    ],
    events: [
        {
            title: "📅 Daily Event Reminder",
            content: "**Don't forget your daily requirements!**\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Participate in guild events for better rewards!",
            color: 0xff9500
        },
        {
            title: "🎮 Weekly Challenge",
            content: "**This week's focus**: Try different weapon combinations! Experiment with Dragon Knight Crossbow + Oracle Spear for a balanced approach to both PvP and PvE!",
            color: 0x9c27b0
        },
        {
            title: "🏆 Guild Achievement",
            content: "**XYIAN Guild Status**: Level 5 achieved! 🎉\nWe now have access to 10% discounts on all guild shop items. Use this advantage wisely!",
            color: 0x4caf50
        }
    ],
    community: [
        {
            title: "👥 Community Spotlight",
            content: "**Welcome new members!** If you're new to XYIAN, don't hesitate to ask questions. Our community is here to help you succeed in Archero 2!",
            color: 0x2196f3
        },
        {
            title: "💬 Discussion Topic",
            content: "**What's your favorite weapon combination?** Share your builds and strategies in the chat! We love seeing creative approaches to the game!",
            color: 0xe91e63
        },
        {
            title: "🎯 Pro Tips",
            content: "**Movement is key!** Practice dodging patterns and learn enemy attack timings. Good positioning can make the difference between victory and defeat!",
            color: 0xff5722
        }
    ]
};

// Guild recruitment messages
const recruitmentMessages = [
    {
        title: "🏰 XYIAN OFFICIAL - Guild Recruitment",
        content: `**Guild ID: ${guildInfo.id}**\n\n**We're looking for dedicated players to join our elite community!**\n\n✨ **What we offer:**\n• Active daily community\n• Expert strategies and guides\n• Guild events and challenges\n• 10% discount on guild shop items\n• Supportive and friendly environment\n\n🎯 **Requirements:**\n• Daily participation in guild activities\n• 2 Boss Battles per day\n• 1 Guild Donation per day\n• Active in Discord community\n\n💪 **Power Level:** 300k+ recommended\n\n**Ready to join the elite? Apply now!**`,
        color: 0xffd700,
        footer: "XYIAN OFFICIAL - Arch 2 Addicts"
    },
    {
        title: "⚔️ Join XYIAN OFFICIAL Today!",
        content: `**Guild ID: ${guildInfo.id}**\n\n**Elite players wanted for XYIAN OFFICIAL!**\n\n🌟 **Why choose XYIAN?**\n• Top-tier strategies and builds\n• Daily tips and guidance\n• Active community support\n• Exclusive guild events\n• Guild shop discounts\n\n📋 **What we expect:**\n• Daily boss battles (2 minimum)\n• Regular guild donations\n• Active Discord participation\n• Team player attitude\n\n🔥 **Power requirement:** 300k+ (flexible for active players)\n\n**Don't miss out - limited spots available!**`,
        color: 0xff6b6b,
        footer: "XYIAN OFFICIAL - Arch 2 Addicts"
    },
    {
        title: "🎮 XYIAN OFFICIAL - Elite Guild",
        content: `**Guild ID: ${guildInfo.id}**\n\n**Join the premier Archero 2 guild!**\n\n🏆 **Our achievements:**\n• Guild Level 5 (10% shop discount)\n• Active daily community\n• Expert player base\n• Proven strategies\n\n💎 **Member benefits:**\n• Daily game tips and guides\n• Build recommendations\n• Event strategies\n• Community support\n\n📊 **Requirements:**\n• 300k+ power level\n• Daily participation\n• 2 boss battles daily\n• 1 donation daily\n• Discord activity\n\n**Apply now and level up your game!**`,
        color: 0x4caf50,
        footer: "XYIAN OFFICIAL - Arch 2 Addicts"
    }
];

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ XYIAN Daily Messaging Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('Daily Archero 2 Content', { type: 'WATCHING' });
    
    // Start daily messaging system
    startDailyMessaging();
    
    console.log('✅ Daily messaging systems activated!');
});

// Start daily messaging system
function startDailyMessaging() {
    console.log('📅 Starting daily messaging system...');
    
    // Send initial messages
    sendInitialMessages();
    
    // Set up daily schedule
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        
        // Send messages at specific times
        if (hour === 9) { // 9 AM - Morning tip
            sendDailyTip();
        } else if (hour === 15) { // 3 PM - Afternoon content
            sendDailyEvent();
        } else if (hour === 20) { // 8 PM - Evening recruitment
            sendGuildRecruitment();
        }
    }, 60 * 60 * 1000); // Check every hour
    
    console.log('✅ Daily messaging schedule set!');
}

// Send initial messages
async function sendInitialMessages() {
    console.log('📢 Sending initial messages...');
    
    // Send welcome message to general chat
    if (webhooks.general) {
        await sendGeneralMessage();
    }
    
    // Send guild recruitment message
    await sendGuildRecruitment();
    
    console.log('✅ Initial messages sent!');
}

// Send daily tip
async function sendDailyTip() {
    const tip = dailyMessages.tips[Math.floor(Math.random() * dailyMessages.tips.length)];
    await sendToGeneral(tip);
    console.log('📝 Daily tip sent!');
}

// Send daily event
async function sendDailyEvent() {
    const event = dailyMessages.events[Math.floor(Math.random() * dailyMessages.events.length)];
    await sendToGeneral(event);
    console.log('📅 Daily event sent!');
}

// Send guild recruitment
async function sendGuildRecruitment() {
    const recruitment = recruitmentMessages[Math.floor(Math.random() * recruitmentMessages.length)];
    await sendToGuildRecruit(recruitment);
    console.log('🏰 Guild recruitment sent!');
}

// Send to general chat
async function sendToGeneral(message) {
    if (!webhooks.general) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.general });
        const embed = new EmbedBuilder()
            .setTitle(message.title)
            .setDescription(message.content)
            .setColor(message.color)
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
        
        await webhook.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Failed to send general message:', error.message);
    }
}

// Send to guild recruitment
async function sendToGuildRecruit(message) {
    try {
        const webhook = new WebhookClient({ url: webhooks.guildRecruit });
        const embed = new EmbedBuilder()
            .setTitle(message.title)
            .setDescription(message.content)
            .setColor(message.color)
            .setTimestamp()
            .setFooter({ text: message.footer });
        
        await webhook.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Failed to send recruitment message:', error.message);
    }
}

// Send general welcome message
async function sendGeneralMessage() {
    const embed = new EmbedBuilder()
        .setTitle('🎉 Welcome to XYIAN OFFICIAL!')
        .setDescription('**Your premier Archero 2 community is now enhanced with daily content!**\n\n✨ **What to expect:**\n• Daily tips and strategies\n• Event reminders and guides\n• Community discussions\n• Guild recruitment updates\n\n🎮 **Ready to level up your game?**\nAsk questions, share builds, and connect with fellow players!')
        .setColor(0x00ff88)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
    
    await sendToGeneral({ title: '', content: '', color: 0x00ff88 });
}

// Message handling
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        switch (commandName) {
            case 'ping':
                await message.reply('✅ Daily Messaging Bot - Online!');
                break;
            case 'tip':
                await sendDailyTip();
                await message.reply('📝 Daily tip sent!');
                break;
            case 'recruit':
                await sendGuildRecruitment();
                await message.reply('🏰 Guild recruitment sent!');
                break;
            case 'test':
                await sendInitialMessages();
                await message.reply('📢 Test messages sent!');
                break;
        }
    }
});

// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Start bot
client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('❌ Failed to login:', error.message);
    console.log('\n🔧 Make sure to:');
    console.log('1. Enable Message Content Intent in Discord Developer Portal');
    console.log('2. Invite bot to your server');
    console.log('3. Set proper permissions');
});
