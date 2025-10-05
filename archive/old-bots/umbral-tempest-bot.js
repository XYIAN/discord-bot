const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

console.log('🏰 XYIAN Umbral Tempest Event Bot - Initializing...');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Discovered channels and their configurations
let discoveredChannels = new Map();
let channelWebhooks = new Map();

// Umbral Tempest Event Information
const umbralTempestInfo = {
    name: 'Umbral Tempest',
    description: 'A challenging PvP event in Archero 2 with unique mechanics and rewards',
    duration: 'Limited time event',
    rewards: {
        common: ['Gems', 'Gold', 'Experience'],
        rare: ['Epic Equipment', 'Rare Runes', 'Guild Coins'],
        legendary: ['S-Tier Equipment', 'Legendary Runes', 'Exclusive Skins']
    },
    mechanics: {
        energy: 'Uses special event energy',
        matchmaking: 'Skill-based matchmaking system',
        ranking: 'Global leaderboard with seasonal rewards',
        classes: 'All classes available with unique advantages'
    },
    bestBuilds: {
        'Dragon Knight': {
            weapon: 'Dragon Knight Crossbow',
            gear: 'Dragon Knight Set',
            skills: ['Tracking Eye', 'Front Arrow', 'Giant\'s Strength'],
            strategy: 'High damage output with explosive arrows. Focus on positioning and timing.',
            advantages: 'Excellent for burst damage and area control'
        },
        'Griffin': {
            weapon: 'Griffin Claw',
            gear: 'Griffin Set',
            skills: ['Tracking Eye', 'Multi-shot', 'Swift Arrow'],
            strategy: 'Consistent damage with multi-hit attacks. Great for sustained combat.',
            advantages: 'Reliable damage output and good mobility'
        },
        'Oracle': {
            weapon: 'Oracle Spear',
            gear: 'Oracle Set',
            skills: ['Tracking Eye', 'Beam Staff', 'Revive'],
            strategy: 'Support and utility focused. Use beam attacks for consistent damage.',
            advantages: 'Great survivability and team support'
        },
        'Echo': {
            weapon: 'Echo Staff',
            gear: 'Echo Set',
            skills: ['Tracking Eye', 'Ricochet', 'Multi-shot'],
            strategy: 'Area control and crowd management. Use ricochet for multiple targets.',
            advantages: 'Excellent for handling multiple enemies'
        }
    },
    tips: [
        'Focus on main hand weapon upgrades for maximum DPS',
        'Tracking Eye is essential for accuracy in PvP',
        'Position yourself strategically to avoid enemy attacks',
        'Use terrain to your advantage',
        'Save your ultimate ability for crucial moments',
        'Practice dodging and movement patterns',
        'Learn enemy attack patterns and timing',
        'Join guild events for better rewards'
    ],
    rewards: {
        daily: ['Event Coins', 'Gems', 'Equipment'],
        weekly: ['Rare Equipment', 'Runes', 'Guild Coins'],
        seasonal: ['Exclusive Skins', 'S-Tier Equipment', 'Legendary Runes']
    }
};

// Guild requirements tracking
const guildRequirements = {
    dailyBossBattles: 2,
    dailyDonations: 1,
    checkInactiveDays: 3,
    reminderTime: '18:00'
};

// Member activity tracking
const memberActivity = new Map();

// Comprehensive Q&A database
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
    'umbral tempest': {
        answer: `**Umbral Tempest Event**:\n• Challenging PvP event with unique mechanics\n• Skill-based matchmaking system\n• Global leaderboard with seasonal rewards\n• All classes available with unique advantages\n\n**Best Classes**: Dragon Knight, Griffin, Oracle, Echo\n**Key Strategy**: Focus on main hand weapon upgrades and Tracking Eye skill`,
        category: 'Events'
    },
    'umbral tempest builds': {
        answer: `**Umbral Tempest Best Builds**:\n\n**Dragon Knight**: Dragon Knight Crossbow + Dragon Knight Set + Tracking Eye, Front Arrow, Giant's Strength\n**Griffin**: Griffin Claw + Griffin Set + Tracking Eye, Multi-shot, Swift Arrow\n**Oracle**: Oracle Spear + Oracle Set + Tracking Eye, Beam Staff, Revive\n**Echo**: Echo Staff + Echo Set + Tracking Eye, Ricochet, Multi-shot`,
        category: 'Events'
    },
    'umbral tempest tips': {
        answer: `**Umbral Tempest Tips**:\n• Focus on main hand weapon upgrades for maximum DPS\n• Tracking Eye is essential for accuracy in PvP\n• Position yourself strategically to avoid enemy attacks\n• Use terrain to your advantage\n• Save your ultimate ability for crucial moments\n• Practice dodging and movement patterns`,
        category: 'Events'
    },
    'pvp tips': {
        answer: '**PvP Tips**:\n• Use Griffin Set for maximum damage\n• Tracking Eye is essential for accuracy\n• Focus on main hand weapon upgrades\n• Practice dodging and positioning\n• Learn enemy attack patterns\n• Use terrain to your advantage',
        category: 'PvP'
    },
    'event rewards': {
        answer: '**Event Rewards**:\n• Complete daily challenges for gems\n• Participate in guild events for exclusive rewards\n• Check event shop for limited items\n• Save gems for S-Tier equipment\n• Join guild events for better rewards',
        category: 'Events'
    }
};

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ XYIAN Umbral Tempest Event Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('Umbral Tempest Event Management', { type: 'WATCHING' });
    
    // Discover all channels and webhooks
    await discoverAllChannels();
    
    // Send startup messages
    await sendStartupMessages();
    
    // Start daily reminder system
    startDailyReminders();
    
    console.log('✅ Umbral Tempest event management systems activated!');
});

// Discover all channels and their webhooks
async function discoverAllChannels() {
    console.log('🔍 Discovering all channels and webhooks...');
    
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
                webhook: null,
                webhookUrl: null
            };
            
            // Try to get webhook for this channel
            try {
                const webhooks = await channel.fetchWebhooks();
                if (webhooks.size > 0) {
                    const webhook = webhooks.first();
                    channelInfo.webhook = webhook;
                    channelInfo.webhookUrl = webhook.url;
                    channelWebhooks.set(channelId, webhook);
                    console.log(`✅ Found webhook for #${channel.name}`);
                } else {
                    console.log(`⚠️ No webhook found for #${channel.name}`);
                }
            } catch (error) {
                console.log(`⚠️ No webhook access for #${channel.name}: ${error.message}`);
            }
            
            discoveredChannels.set(channelId, channelInfo);
            console.log(`📋 Discovered: #${channel.name} (${channelInfo.type}) - ${channelInfo.webhook ? 'Webhook Available' : 'No Webhook'}`);
        }
    }
    
    console.log(`✅ Discovery complete: ${discoveredChannels.size} channels, ${channelWebhooks.size} webhooks`);
}

// Determine channel type based on name
function determineChannelType(channelName) {
    const name = channelName.toLowerCase();
    
    if (name.includes('xyian') || name.includes('guild') || name.includes('official')) {
        return 'guild';
    } else if (name.includes('pvp') || name.includes('battle') || name.includes('combat') || name.includes('umbral-tempest')) {
        return 'pvp';
    } else if (name.includes('event') || name.includes('announcement') || name.includes('news')) {
        return 'events';
    } else if (name.includes('bot') || name.includes('command')) {
        return 'bot';
    } else if (name.includes('help') || name.includes('support') || name.includes('faq')) {
        return 'help';
    } else if (name.includes('lfg') || name.includes('group') || name.includes('team')) {
        return 'lfg';
    } else if (name.includes('trade') || name.includes('market') || name.includes('trading')) {
        return 'trading';
    } else if (name.includes('meme') || name.includes('funny') || name.includes('humor')) {
        return 'memes';
    } else if (name.includes('suggestion') || name.includes('feedback') || name.includes('idea')) {
        return 'suggestions';
    } else if (name.includes('general') || name.includes('chat') || name.includes('main')) {
        return 'general';
    } else {
        return 'general';
    }
}

// Get channel purpose
function getChannelPurpose(channelName) {
    const name = channelName.toLowerCase();
    
    if (name.includes('xyian') || name.includes('guild')) {
        return 'XYIAN guild management and exclusive content';
    } else if (name.includes('pvp') || name.includes('battle') || name.includes('umbral-tempest')) {
        return 'PvP strategies, Umbral Tempest event discussions, and combat builds';
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

// Send startup messages to all channels with webhooks
async function sendStartupMessages() {
    console.log('📢 Sending startup messages to all channels...');
    
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
                { name: 'PvP & Umbral Tempest', value: '• Build recommendations\n• Event strategies\n• Combat tips and guides', inline: false },
                { name: 'Commands', value: '`!umbral` - Umbral Tempest info\n`!build [class]` - Class builds\n`!weapon [name]` - Weapon info', inline: false }
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
                { name: 'Available Commands', value: '`!help` - Full command list\n`!ping` - Bot status\n`!channels` - Channel list', inline: false }
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
        
        console.log(`Command: ${commandName} from ${message.author.username} in #${channelInfo.name} (${channelInfo.type})`);
        
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

// PvP-specific commands (including Umbral Tempest)
async function handlePvPCommands(message, commandName, args) {
    switch (commandName) {
        case 'ping':
            await message.reply('⚔️ PvP & Umbral Tempest Bot - Online');
            break;
        case 'help':
            await showPvPHelp(message);
            break;
        case 'umbral':
            await showUmbralTempestInfo(message);
            break;
        case 'build':
            await showUmbralTempestBuild(message, args);
            break;
        case 'weapon':
            await showWeaponInfo(message, args);
            break;
        case 'skill':
            await showSkillInfo(message, args);
            break;
        case 'tips':
            await showUmbralTempestTips(message);
            break;
        case 'rewards':
            await showUmbralTempestRewards(message);
            break;
        default:
            await handleQuestion(message, { type: 'pvp' });
    }
}

// Show Umbral Tempest information
async function showUmbralTempestInfo(message) {
    const embed = new EmbedBuilder()
        .setTitle('🌪️ Umbral Tempest Event')
        .setDescription(umbralTempestInfo.description)
        .setColor(0x8B5CF6)
        .addFields(
            { name: 'Duration', value: umbralTempestInfo.duration, inline: true },
            { name: 'Energy', value: umbralTempestInfo.mechanics.energy, inline: true },
            { name: 'Matchmaking', value: umbralTempestInfo.mechanics.matchmaking, inline: true },
            { name: 'Available Classes', value: 'Dragon Knight, Griffin, Oracle, Echo', inline: false },
            { name: 'Key Strategy', value: 'Focus on main hand weapon upgrades and Tracking Eye skill', inline: false },
            { name: 'Commands', value: '`!build [class]` - Class builds\n`!tips` - Event tips\n`!rewards` - Event rewards', inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show Umbral Tempest build for specific class
async function showUmbralTempestBuild(message, args) {
    const className = args.join(' ').toLowerCase();
    const build = umbralTempestInfo.bestBuilds[className];
    
    if (!build) {
        const embed = new EmbedBuilder()
            .setTitle('🌪️ Umbral Tempest Builds')
            .setDescription('Available classes: Dragon Knight, Griffin, Oracle, Echo')
            .setColor(0x8B5CF6)
            .addFields(
                { name: 'Usage', value: '`!build dragon knight` - Dragon Knight build\n`!build griffin` - Griffin build\n`!build oracle` - Oracle build\n`!build echo` - Echo build', inline: false }
            );
        await message.reply({ embeds: [embed] });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`🌪️ ${className.charAt(0).toUpperCase() + className.slice(1)} Umbral Tempest Build`)
        .setColor(0x8B5CF6)
        .addFields(
            { name: 'Weapon', value: build.weapon, inline: true },
            { name: 'Gear Set', value: build.gear, inline: true },
            { name: 'Skills', value: build.skills.join(', '), inline: false },
            { name: 'Strategy', value: build.strategy, inline: false },
            { name: 'Advantages', value: build.advantages, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show Umbral Tempest tips
async function showUmbralTempestTips(message) {
    const embed = new EmbedBuilder()
        .setTitle('🌪️ Umbral Tempest Tips')
        .setDescription('Essential tips for success in the Umbral Tempest event')
        .setColor(0x8B5CF6)
        .addFields(
            { name: 'Combat Tips', value: umbralTempestInfo.tips.slice(0, 4).join('\n• '), inline: false },
            { name: 'Strategy Tips', value: umbralTempestInfo.tips.slice(4).join('\n• '), inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show Umbral Tempest rewards
async function showUmbralTempestRewards(message) {
    const embed = new EmbedBuilder()
        .setTitle('🌪️ Umbral Tempest Rewards')
        .setDescription('Rewards available in the Umbral Tempest event')
        .setColor(0x8B5CF6)
        .addFields(
            { name: 'Daily Rewards', value: umbralTempestInfo.rewards.daily.join(', '), inline: true },
            { name: 'Weekly Rewards', value: umbralTempestInfo.rewards.weekly.join(', '), inline: true },
            { name: 'Seasonal Rewards', value: umbralTempestInfo.rewards.seasonal.join(', '), inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
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
                value: `${channelInfo.purpose}\nType: ${channelInfo.type} ${channelInfo.webhook ? '🔗' : '❌'}`,
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
            { name: 'Webhooks', value: channelWebhooks.size.toString(), inline: true },
            { name: 'Members Tracked', value: memberActivity.size.toString(), inline: true },
            { name: 'Uptime', value: `${Math.floor(process.uptime() / 60)} minutes`, inline: true },
            { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true }
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
