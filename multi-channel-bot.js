const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

console.log('🏰 XYIAN Multi-Channel Guild Bot - Initializing...');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Channel configuration
const channelConfig = {
    // Known webhooks
    webhooks: {
        generalChat: process.env.GENERAL_CHAT_WEBHOOK || '',
        xyianGuild: process.env.XYIAN_GUILD_WEBHOOK || ''
    },
    // Channel types and their purposes
    channelTypes: {
        'general': ['general', 'chat', 'main'],
        'guild': ['guild', 'xyian', 'official'],
        'pvp': ['pvp', 'battle', 'combat'],
        'events': ['event', 'announcement', 'news'],
        'bot': ['bot', 'command', 'commands'],
        'help': ['help', 'support', 'faq'],
        'lfg': ['lfg', 'looking', 'group', 'team'],
        'trading': ['trade', 'trading', 'market'],
        'memes': ['meme', 'funny', 'humor'],
        'suggestions': ['suggestion', 'feedback', 'idea']
    }
};

// Discovered channels
let discoveredChannels = new Map();

// Guild requirements tracking
const guildRequirements = {
    dailyBossBattles: 2,
    dailyDonations: 1,
    checkInactiveDays: 3,
    reminderTime: '18:00'
};

// Member activity tracking
const memberActivity = new Map();

// Q&A database for common questions
const qaDatabase = {
    'best etched rune': {
        answer: 'The **main hand etched rune** is considered the best for DPS. Most damage comes from your main hand weapon, so focusing on that rune will give you the highest damage output.',
        category: 'Equipment'
    },
    'best weapon': {
        answer: '**Dragon Knight Crossbow** and **Griffin Claw** are the top S-Tier weapons. Dragon Knight Crossbow has explosive arrows, while Griffin Claw has multi-hit attacks.',
        category: 'Weapons'
    },
    'guild requirements': {
        answer: 'XYIAN Guild Requirements:\n• **2 Daily Boss Battles** (minimum)\n• **1 Daily Donation** (minimum)\n• **Active participation** in guild events\n• Inactive players are removed after 3 days',
        category: 'Guild'
    },
    'donation priority': {
        answer: 'Guild Coin Spending Priority:\n1. **Epic Revive Rune** (if you don\'t have it)\n2. **Blessing Runes** (if no epic revive)\n3. **10x Chromatic Keys** (if epic revive owned)\n4. Wait for Guild Level 5 for 10% discount',
        category: 'Guild'
    },
    'best build': {
        answer: '**PvP Build**: Dragon Knight Crossbow + Griffin Set + Tracking Eye, Front Arrow, Giant\'s Strength\n**PvE Build**: Griffin Claw + Oracle Set + Revive, Tracking Eye, Swift Arrow',
        category: 'Builds'
    },
    'pvp tips': {
        answer: '**PvP Tips**:\n• Use Griffin Set for maximum damage\n• Tracking Eye is essential for accuracy\n• Focus on main hand weapon upgrades\n• Practice dodging and positioning',
        category: 'PvP'
    },
    'event rewards': {
        answer: '**Event Rewards**:\n• Complete daily challenges for gems\n• Participate in guild events for exclusive rewards\n• Check event shop for limited items\n• Save gems for S-Tier equipment',
        category: 'Events'
    }
};

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ XYIAN Multi-Channel Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('XYIAN Multi-Channel Management', { type: 'WATCHING' });
    
    // Discover all channels
    await discoverChannels();
    
    // Send startup messages to appropriate channels
    await sendStartupMessages();
    
    // Start daily reminder system
    startDailyReminders();
    
    console.log('✅ Multi-channel management systems activated!');
});

// Discover all channels in the guild
async function discoverChannels() {
    console.log('🔍 Discovering channels...');
    
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
        console.error('❌ Guild not found!');
        return;
    }
    
    const channels = guild.channels.cache;
    
    for (const [channelId, channel] of channels) {
        if (channel.type === ChannelType.GuildText) {
            const channelInfo = {
                id: channelId,
                name: channel.name,
                type: determineChannelType(channel.name),
                purpose: getChannelPurpose(channel.name),
                webhook: null
            };
            
            // Try to get webhook for this channel
            try {
                const webhooks = await channel.fetchWebhooks();
                if (webhooks.size > 0) {
                    channelInfo.webhook = webhooks.first();
                }
            } catch (error) {
                console.log(`⚠️ No webhook access for #${channel.name}`);
            }
            
            discoveredChannels.set(channelId, channelInfo);
            console.log(`📋 Discovered: #${channel.name} (${channelInfo.type})`);
        }
    }
    
    console.log(`✅ Discovered ${discoveredChannels.size} text channels`);
}

// Determine channel type based on name
function determineChannelType(channelName) {
    const name = channelName.toLowerCase();
    
    for (const [type, keywords] of Object.entries(channelConfig.channelTypes)) {
        if (keywords.some(keyword => name.includes(keyword))) {
            return type;
        }
    }
    
    return 'general';
}

// Get channel purpose
function getChannelPurpose(channelName) {
    const name = channelName.toLowerCase();
    
    if (name.includes('xyian') || name.includes('guild')) {
        return 'XYIAN guild management and exclusive content';
    } else if (name.includes('pvp') || name.includes('battle')) {
        return 'PvP strategies, builds, and combat discussions';
    } else if (name.includes('event') || name.includes('announcement')) {
        return 'Event announcements and community news';
    } else if (name.includes('bot') || name.includes('command')) {
        return 'Bot commands and technical support';
    } else if (name.includes('help') || name.includes('support')) {
        return 'Help and support for community members';
    } else if (name.includes('lfg') || name.includes('group')) {
        return 'Looking for group and team coordination';
    } else if (name.includes('trade') || name.includes('market')) {
        return 'Trading and marketplace discussions';
    } else if (name.includes('meme') || name.includes('funny')) {
        return 'Memes and community humor';
    } else if (name.includes('suggestion') || name.includes('feedback')) {
        return 'Community suggestions and feedback';
    } else {
        return 'General community discussions';
    }
}

// Send startup messages to appropriate channels
async function sendStartupMessages() {
    for (const [channelId, channelInfo] of discoveredChannels) {
        if (channelInfo.webhook) {
            try {
                const embed = createChannelSpecificEmbed(channelInfo);
                await channelInfo.webhook.send({ embeds: [embed] });
                console.log(`✅ Startup message sent to #${channelInfo.name}`);
            } catch (error) {
                console.error(`❌ Failed to send message to #${channelInfo.name}:`, error.message);
            }
        }
    }
}

// Create channel-specific embed
function createChannelSpecificEmbed(channelInfo) {
    const baseEmbed = new EmbedBuilder()
        .setTitle(`🏰 XYIAN Guild Bot - ${channelInfo.name.charAt(0).toUpperCase() + channelInfo.name.slice(1)}`)
        .setDescription(`XYIAN Guild Management System is now operational in this channel.`)
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
    
    switch (channelInfo.type) {
        case 'guild':
            baseEmbed.addFields(
                { name: 'Guild Management', value: '• Track daily requirements\n• Monitor member activity\n• Manage guild events', inline: false },
                { name: 'Commands', value: '`!help` - View all commands\n`!requirements` - Daily requirements\n`!activity` - Check your status', inline: false }
            );
            break;
            
        case 'pvp':
            baseEmbed.addFields(
                { name: 'PvP Features', value: '• Build recommendations\n• Strategy discussions\n• Combat tips', inline: false },
                { name: 'Commands', value: '`!build pvp` - PvP build guide\n`!weapon [name]` - Weapon info\n`!skill [name]` - Skill info', inline: false }
            );
            break;
            
        case 'events':
            baseEmbed.addFields(
                { name: 'Event Management', value: '• Event announcements\n• Reminder system\n• Participation tracking', inline: false },
                { name: 'Commands', value: '`!events` - View upcoming events\n`!event [name]` - Event details', inline: false }
            );
            break;
            
        case 'bot':
            baseEmbed.addFields(
                { name: 'Bot Commands', value: '• All bot functionality\n• Technical support\n• Command testing', inline: false },
                { name: 'Available Commands', value: '`!help` - Full command list\n`!ping` - Bot status\n`!info` - Bot information', inline: false }
            );
            break;
            
        case 'help':
            baseEmbed.addFields(
                { name: 'Help & Support', value: '• Community assistance\n• Game guidance\n• Technical support', inline: false },
                { name: 'Quick Help', value: 'Ask any Arch 2 question!\nBot will provide instant answers', inline: false }
            );
            break;
            
        default:
            baseEmbed.addFields(
                { name: 'Community Features', value: '• General discussions\n• Game tips and tricks\n• Community engagement', inline: false },
                { name: 'Commands', value: '`!help` - View commands\nAsk questions about Arch 2!', inline: false }
            );
    }
    
    return baseEmbed;
}

// Member join event
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 New member joined: ${member.user.username}`);
    
    // Send welcome message to general channel
    const generalChannel = Array.from(discoveredChannels.values()).find(ch => ch.type === 'general');
    if (generalChannel && generalChannel.webhook) {
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🏰 Welcome to XYIAN OFFICIAL')
            .setDescription(`Welcome ${member} to the elite XYIAN guild - the premier Arch 2 Addicts community.`)
            .setColor(0xffd700)
            .addFields(
                { name: 'Daily Requirements', value: '• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Maintain active participation', inline: false },
                { name: 'Management Commands', value: 'Use `!help` to view all available commands', inline: false },
                { name: 'Game Assistance', value: 'Ask any Arch 2 related questions for instant answers', inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        
        await generalChannel.webhook.send({ embeds: [welcomeEmbed] });
    }
    
    // Assign XYIAN OFFICIAL role if it exists
    const xyianRole = member.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
    if (xyianRole) {
        try {
            await member.roles.add(xyianRole);
            console.log(`✅ Assigned XYIAN OFFICIAL role to ${member.user.username}`);
        } catch (error) {
            console.error(`❌ Failed to assign role: ${error.message}`);
        }
    }
    
    // Initialize member activity tracking
    memberActivity.set(member.id, {
        joinedAt: new Date(),
        lastBossBattle: null,
        lastDonation: null,
        totalBossBattles: 0,
        totalDonations: 0,
        isActive: true
    });
});

// Message handling
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const channelInfo = discoveredChannels.get(message.channel.id);
    if (!channelInfo) return;
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        console.log(`Command: ${commandName} from ${message.author.username} in #${channelInfo.name}`);
        
        // Route commands based on channel type
        await handleChannelSpecificCommand(message, commandName, args, channelInfo);
    } else {
        // Check for questions in regular messages
        await handleQuestion(message, channelInfo);
    }
});

// Handle channel-specific commands
async function handleChannelSpecificCommand(message, commandName, args, channelInfo) {
    switch (channelInfo.type) {
        case 'guild':
            await handleGuildCommands(message, commandName, args);
            break;
        case 'pvp':
            await handlePvPCommands(message, commandName, args);
            break;
        case 'events':
            await handleEventCommands(message, commandName, args);
            break;
        case 'bot':
            await handleBotCommands(message, commandName, args);
            break;
        case 'help':
            await handleHelpCommands(message, commandName, args);
            break;
        default:
            await handleGeneralCommands(message, commandName, args);
    }
}

// Guild-specific commands
async function handleGuildCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('✅ XYIAN Guild Management System - Online');
            break;
        case 'help':
            await showGuildHelp(message);
            break;
        case 'requirements':
            await showRequirements(message);
            break;
        case 'activity':
            await showActivity(message);
            break;
        case 'boss':
            await recordBossBattle(message);
            break;
        case 'donate':
            await recordDonation(message);
            break;
        case 'inactive':
            await showInactiveMembers(message);
            break;
        case 'xyian':
            await showGuildInfo(message);
            break;
        default:
            await handleQuestion(message, { type: 'guild' });
    }
}

// PvP-specific commands
async function handlePvPCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('⚔️ PvP Bot - Online');
            break;
        case 'help':
            await showPvPHelp(message);
            break;
        case 'build':
            await showPvPBuild(message, args);
            break;
        case 'weapon':
            await showWeaponInfo(message, args);
            break;
        case 'skill':
            await showSkillInfo(message, args);
            break;
        case 'tips':
            await showPvPTips(message);
            break;
        default:
            await handleQuestion(message, { type: 'pvp' });
    }
}

// Event-specific commands
async function handleEventCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('📅 Event Bot - Online');
            break;
        case 'help':
            await showEventHelp(message);
            break;
        case 'events':
            await showUpcomingEvents(message);
            break;
        case 'event':
            await showEventDetails(message, args);
            break;
        case 'remind':
            await setEventReminder(message, args);
            break;
        default:
            await handleQuestion(message, { type: 'events' });
    }
}

// Bot-specific commands
async function handleBotCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('🤖 Bot System - Online');
            break;
        case 'help':
            await showBotHelp(message);
            break;
        case 'channels':
            await showChannelList(message);
            break;
        case 'status':
            await showBotStatus(message);
            break;
        case 'info':
            await showBotInfo(message);
            break;
        default:
            await handleQuestion(message, { type: 'bot' });
    }
}

// Help-specific commands
async function handleHelpCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('❓ Help Bot - Online');
            break;
        case 'help':
            await showHelpHelp(message);
            break;
        case 'faq':
            await showFAQ(message);
            break;
        case 'guide':
            await showGuide(message, args);
            break;
        default:
            await handleQuestion(message, { type: 'help' });
    }
}

// General commands
async function handleGeneralCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('✅ Community Bot - Online');
            break;
        case 'help':
            await showGeneralHelp(message);
            break;
        case 'info':
            await showCommunityInfo(message);
            break;
        default:
            await handleQuestion(message, { type: 'general' });
    }
}

// Show channel list
async function showChannelList(message) {
    const embed = new EmbedBuilder()
        .setTitle('📋 Discovered Channels')
        .setDescription('All channels managed by the XYIAN Guild Bot')
        .setColor(0x0099ff);
    
    for (const [channelId, channelInfo] of discoveredChannels) {
        const channel = message.guild.channels.cache.get(channelId);
        if (channel) {
            embed.addFields({
                name: `#${channelInfo.name}`,
                value: `${channelInfo.purpose}\nType: ${channelInfo.type}`,
                inline: true
            });
        }
    }
    
    await message.reply({ embeds: [embed] });
}

// Show bot status
async function showBotStatus(message) {
    const embed = new EmbedBuilder()
        .setTitle('🤖 Bot Status')
        .setColor(0x00ff00)
        .addFields(
            { name: 'Status', value: '✅ Online', inline: true },
            { name: 'Channels', value: discoveredChannels.size.toString(), inline: true },
            { name: 'Members Tracked', value: memberActivity.size.toString(), inline: true },
            { name: 'Uptime', value: `${Math.floor(process.uptime() / 60)} minutes`, inline: true },
            { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
            { name: 'Node Version', value: process.version, inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Handle questions
async function handleQuestion(message, channelInfo) {
    const content = message.content.toLowerCase();
    
    for (const [question, data] of Object.entries(qaDatabase)) {
        if (content.includes(question)) {
            const embed = new EmbedBuilder()
                .setTitle(`❓ ${data.category} Question`)
                .setDescription(data.answer)
                .setColor(0x0099ff)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            return;
        }
    }
}

// Include all the existing command functions from guild-management-bot.js
// (showRequirements, showActivity, recordBossBattle, etc.)

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
