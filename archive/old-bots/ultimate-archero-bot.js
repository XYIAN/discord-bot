const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

console.log('🏰 XYIAN Ultimate Archero 2 Bot - Initializing...');

// Create Discord client with minimal intents to avoid issues
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Discovered channels and their configurations
let discoveredChannels = new Map();
let channelWebhooks = new Map();

// Comprehensive Archero 2 Database (from official Discord server)
const archero2Database = {
    // Weapons (S-Tier to A-Tier)
    weapons: {
        'dragon knight crossbow': {
            tier: 'S-Tier',
            type: 'Crossbow',
            description: 'Explosive arrows with area damage',
            bestFor: 'PvP, Boss fights',
            skills: ['Tracking Eye', 'Front Arrow', 'Giant\'s Strength'],
            stats: 'High damage, explosive effect'
        },
        'griffin claw': {
            tier: 'S-Tier',
            type: 'Claw',
            description: 'Multi-hit attacks with consistent damage',
            bestFor: 'PvP, Sustained combat',
            skills: ['Tracking Eye', 'Multi-shot', 'Swift Arrow'],
            stats: 'Reliable damage, good mobility'
        },
        'beam staff': {
            tier: 'A-Tier',
            type: 'Staff',
            description: 'Continuous beam damage',
            bestFor: 'PvE, Area control',
            skills: ['Tracking Eye', 'Beam Staff', 'Revive'],
            stats: 'Continuous damage, good for crowds'
        },
        'oracle spear': {
            tier: 'A-Tier',
            type: 'Spear',
            description: 'Piercing attacks with good range',
            bestFor: 'PvE, Support',
            skills: ['Tracking Eye', 'Front Arrow', 'Revive'],
            stats: 'Good range, piercing damage'
        },
        'echo staff': {
            tier: 'A-Tier',
            type: 'Staff',
            description: 'Ricochet attacks for multiple targets',
            bestFor: 'PvE, Crowd control',
            skills: ['Tracking Eye', 'Ricochet', 'Multi-shot'],
            stats: 'Area damage, crowd control'
        }
    },
    
    // Skills (Legendary to Epic)
    skills: {
        'tracking eye': {
            tier: 'Legendary',
            description: 'Projectiles track enemies automatically',
            effect: 'Makes all projectiles home in on targets',
            bestFor: 'All builds, essential for PvP',
            rarity: 'Very Rare'
        },
        'revive': {
            tier: 'Legendary',
            description: 'Gain an extra life when defeated',
            effect: 'Revive once per run with full health',
            bestFor: 'PvE, Boss fights',
            rarity: 'Very Rare'
        },
        'giant strength': {
            tier: 'Epic',
            description: 'Increases Attack Power by 20%',
            effect: 'Multiplicative damage boost',
            bestFor: 'All builds',
            rarity: 'Rare'
        },
        'front arrow': {
            tier: 'Epic',
            description: 'Shoots additional arrows forward',
            effect: 'Increases projectile count',
            bestFor: 'DPS builds',
            rarity: 'Rare'
        },
        'multi-shot': {
            tier: 'Epic',
            description: 'Shoots multiple projectiles',
            effect: 'Increases projectile count',
            bestFor: 'Area damage builds',
            rarity: 'Rare'
        },
        'swift arrow': {
            tier: 'Epic',
            description: 'Increases projectile speed',
            effect: 'Faster projectiles, better accuracy',
            bestFor: 'PvP builds',
            rarity: 'Rare'
        },
        'ricochet': {
            tier: 'Epic',
            description: 'Projectiles bounce between enemies',
            effect: 'Area damage, crowd control',
            bestFor: 'PvE builds',
            rarity: 'Rare'
        }
    },
    
    // Gear Sets
    gearSets: {
        'dragon knight': {
            tier: 'S-Tier',
            type: 'DPS Set',
            description: 'High damage output with explosive effects',
            bestFor: 'PvP, Boss fights',
            bonuses: ['Attack Power +25%', 'Critical Damage +30%', 'Explosive Damage +40%'],
            recommendedWeapon: 'Dragon Knight Crossbow'
        },
        'griffin': {
            tier: 'S-Tier',
            type: 'PvP Set',
            description: 'Balanced stats with PvP focus',
            bestFor: 'PvP, General use',
            bonuses: ['Attack Power +20%', 'Critical Rate +25%', 'Movement Speed +15%'],
            recommendedWeapon: 'Griffin Claw'
        },
        'oracle': {
            tier: 'A-Tier',
            type: 'Support Set',
            description: 'Support and utility focused',
            bestFor: 'PvE, Support',
            bonuses: ['Health +30%', 'Skill Cooldown -20%', 'Revive Chance +15%'],
            recommendedWeapon: 'Oracle Spear'
        },
        'echo': {
            tier: 'A-Tier',
            type: 'Area Control Set',
            description: 'Area damage and crowd control',
            bestFor: 'PvE, Crowd control',
            bonuses: ['Area Damage +35%', 'Ricochet Damage +25%', 'Projectile Count +2'],
            recommendedWeapon: 'Echo Staff'
        },
        'destruction': {
            tier: 'A-Tier',
            type: 'Boss Set',
            description: 'Specialized for boss fights',
            bestFor: 'PvE Bosses',
            bonuses: ['Boss Damage +40%', 'Critical Damage +25%', 'Attack Speed +20%'],
            recommendedWeapon: 'Any high DPS weapon'
        }
    },
    
    // Umbral Tempest Event
    umbralTempest: {
        name: 'Umbral Tempest',
        description: 'Challenging PvP event with unique mechanics and rewards',
        duration: 'Limited time event',
        energy: 'Uses special event energy',
        matchmaking: 'Skill-based matchmaking system',
        ranking: 'Global leaderboard with seasonal rewards',
        classes: 'All classes available with unique advantages',
        bestBuilds: {
            'dragon knight': {
                weapon: 'Dragon Knight Crossbow',
                gear: 'Dragon Knight Set',
                skills: ['Tracking Eye', 'Front Arrow', 'Giant\'s Strength'],
                strategy: 'High damage output with explosive arrows. Focus on positioning and timing.',
                advantages: 'Excellent for burst damage and area control'
            },
            'griffin': {
                weapon: 'Griffin Claw',
                gear: 'Griffin Set',
                skills: ['Tracking Eye', 'Multi-shot', 'Swift Arrow'],
                strategy: 'Consistent damage with multi-hit attacks. Great for sustained combat.',
                advantages: 'Reliable damage output and good mobility'
            },
            'oracle': {
                weapon: 'Oracle Spear',
                gear: 'Oracle Set',
                skills: ['Tracking Eye', 'Beam Staff', 'Revive'],
                strategy: 'Support and utility focused. Use beam attacks for consistent damage.',
                advantages: 'Great survivability and team support'
            },
            'echo': {
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
    },
    
    // Guild Requirements
    guildRequirements: {
        dailyBossBattles: 2,
        dailyDonations: 1,
        checkInactiveDays: 3,
        reminderTime: '18:00',
        benefits: [
            '10% discount on guild shop items',
            'Exclusive guild events',
            'Guild coin rewards',
            'Priority support',
            'Exclusive channels access'
        ]
    },
    
    // Game Tips (from official Discord)
    gameTips: {
        general: [
            'Focus on one S-Tier set for maximum efficiency',
            'Save gems for mythstone chests',
            'Complete daily challenges for consistent rewards',
            'Join guild events for better rewards',
            'Practice dodging and movement patterns'
        ],
        pvp: [
            'Use Tracking Eye for accuracy',
            'Focus on main hand weapon upgrades',
            'Learn enemy attack patterns',
            'Use terrain to your advantage',
            'Save ultimate abilities for crucial moments'
        ],
        pve: [
            'Use area damage skills for crowds',
            'Focus on survivability for boss fights',
            'Use revive skill for difficult content',
            'Position yourself strategically',
            'Learn boss attack patterns'
        ],
        economy: [
            'Save gems for S-Tier equipment',
            'Use guild coins for blessing runes',
            'Wait for guild level 5 for 10% discount',
            'Complete daily challenges for gems',
            'Participate in events for exclusive rewards'
        ]
    }
};

// Guild requirements tracking
const guildRequirements = archero2Database.guildRequirements;

// Member activity tracking
const memberActivity = new Map();

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ XYIAN Ultimate Archero 2 Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('Archero 2 Ultimate Guide', { type: 'WATCHING' });
    
    // Discover all channels and webhooks
    await discoverAllChannels();
    
    // Send startup messages
    await sendStartupMessages();
    
    // Start daily reminder system
    startDailyReminders();
    
    console.log('✅ Ultimate Archero 2 management systems activated!');
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
    } else if (name.includes('event') || name.includes('announcement')) {
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
        .setTitle(`🏰 XYIAN Ultimate Archero 2 Bot - ${channelInfo.name.charAt(0).toUpperCase() + channelInfo.name.slice(1)}`)
        .setDescription(`Ultimate Archero 2 management system with comprehensive database from official Discord server.`)
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
                { name: 'Quick Help', value: 'Ask any Archero 2 question!\nBot will provide instant answers', inline: false }
            );
            break;
            
        default:
            baseEmbed.addFields(
                { name: 'Community Features', value: '• General discussions\n• Game tips and tricks\n• Community engagement', inline: false },
                { name: 'Commands', value: '`!help` - View commands\nAsk questions about Archero 2!', inline: false }
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
            .setDescription(`Welcome ${member} to the elite XYIAN guild - the premier Archero 2 Addicts community.`)
            .setColor(0xffd700)
            .addFields(
                { name: 'Daily Requirements', value: '• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Maintain active participation', inline: false },
                { name: 'Management Commands', value: 'Use `!help` to view all available commands', inline: false },
                { name: 'Game Assistance', value: 'Ask any Archero 2 related questions for instant answers', inline: false }
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
        case 'gear':
            await showGearInfo(message, args);
            break;
        case 'tips':
            await showPvPTips(message);
            break;
        case 'rewards':
            await showUmbralTempestRewards(message);
            break;
        default:
            await handleQuestion(message, { type: 'pvp' });
    }
}

// Show weapon information
async function showWeaponInfo(message, args) {
    const weaponName = args.join(' ').toLowerCase();
    const weapon = archero2Database.weapons[weaponName];
    
    if (!weapon) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ Available Weapons')
            .setDescription('Available weapons: Dragon Knight Crossbow, Griffin Claw, Beam Staff, Oracle Spear, Echo Staff')
            .setColor(0x0099ff)
            .addFields(
                { name: 'Usage', value: '`!weapon dragon knight crossbow` - Get weapon info', inline: false }
            );
        await message.reply({ embeds: [embed] });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`⚔️ ${weaponName.charAt(0).toUpperCase() + weaponName.slice(1)}`)
        .setColor(0x00ff00)
        .addFields(
            { name: 'Tier', value: weapon.tier, inline: true },
            { name: 'Type', value: weapon.type, inline: true },
            { name: 'Best For', value: weapon.bestFor, inline: true },
            { name: 'Description', value: weapon.description, inline: false },
            { name: 'Recommended Skills', value: weapon.skills.join(', '), inline: false },
            { name: 'Stats', value: weapon.stats, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show skill information
async function showSkillInfo(message, args) {
    const skillName = args.join(' ').toLowerCase();
    const skill = archero2Database.skills[skillName];
    
    if (!skill) {
        const embed = new EmbedBuilder()
            .setTitle('🎯 Available Skills')
            .setDescription('Available skills: Tracking Eye, Revive, Giant Strength, Front Arrow, Multi-shot, Swift Arrow, Ricochet')
            .setColor(0x0099ff)
            .addFields(
                { name: 'Usage', value: '`!skill tracking eye` - Get skill info', inline: false }
            );
        await message.reply({ embeds: [embed] });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`🎯 ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}`)
        .setColor(0x0099ff)
        .addFields(
            { name: 'Tier', value: skill.tier, inline: true },
            { name: 'Rarity', value: skill.rarity, inline: true },
            { name: 'Best For', value: skill.bestFor, inline: true },
            { name: 'Description', value: skill.description, inline: false },
            { name: 'Effect', value: skill.effect, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show gear information
async function showGearInfo(message, args) {
    const gearName = args.join(' ').toLowerCase();
    const gear = archero2Database.gearSets[gearName];
    
    if (!gear) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Available Gear Sets')
            .setDescription('Available sets: Dragon Knight, Griffin, Oracle, Echo, Destruction')
            .setColor(0x0099ff)
            .addFields(
                { name: 'Usage', value: '`!gear dragon knight` - Get gear info', inline: false }
            );
        await message.reply({ embeds: [embed] });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${gearName.charAt(0).toUpperCase() + gearName.slice(1)} Set`)
        .setColor(0xff6b6b)
        .addFields(
            { name: 'Tier', value: gear.tier, inline: true },
            { name: 'Type', value: gear.type, inline: true },
            { name: 'Best For', value: gear.bestFor, inline: true },
            { name: 'Description', value: gear.description, inline: false },
            { name: 'Bonuses', value: gear.bonuses.join('\n'), inline: false },
            { name: 'Recommended Weapon', value: gear.recommendedWeapon, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show Umbral Tempest information
async function showUmbralTempestInfo(message) {
    const embed = new EmbedBuilder()
        .setTitle('🌪️ Umbral Tempest Event')
        .setDescription(archero2Database.umbralTempest.description)
        .setColor(0x8B5CF6)
        .addFields(
            { name: 'Duration', value: archero2Database.umbralTempest.duration, inline: true },
            { name: 'Energy', value: archero2Database.umbralTempest.energy, inline: true },
            { name: 'Matchmaking', value: archero2Database.umbralTempest.matchmaking, inline: true },
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
    const build = archero2Database.umbralTempest.bestBuilds[className];
    
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

// Show PvP tips
async function showPvPTips(message) {
    const embed = new EmbedBuilder()
        .setTitle('⚔️ PvP Tips')
        .setDescription('Essential tips for PvP success')
        .setColor(0xff6b6b)
        .addFields(
            { name: 'Combat Tips', value: archero2Database.gameTips.pvp.join('\n• '), inline: false }
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
            { name: 'Daily Rewards', value: archero2Database.umbralTempest.rewards.daily.join(', '), inline: true },
            { name: 'Weekly Rewards', value: archero2Database.umbralTempest.rewards.weekly.join(', '), inline: true },
            { name: 'Seasonal Rewards', value: archero2Database.umbralTempest.rewards.seasonal.join(', '), inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show channel list
async function showChannelList(message) {
    const embed = new EmbedBuilder()
        .setTitle('📋 Discovered Channels')
        .setDescription('All channels managed by the XYIAN Ultimate Archero 2 Bot')
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
    
    // Check for weapon questions
    for (const [weaponName, weapon] of Object.entries(archero2Database.weapons)) {
        if (content.includes(weaponName)) {
            const embed = new EmbedBuilder()
                .setTitle(`⚔️ ${weaponName.charAt(0).toUpperCase() + weaponName.slice(1)}`)
                .setDescription(`${weapon.description}\n\n**Tier**: ${weapon.tier}\n**Best For**: ${weapon.bestFor}`)
                .setColor(0x00ff00)
                .setTimestamp();
            await message.reply({ embeds: [embed] });
            return;
        }
    }
    
    // Check for skill questions
    for (const [skillName, skill] of Object.entries(archero2Database.skills)) {
        if (content.includes(skillName)) {
            const embed = new EmbedBuilder()
                .setTitle(`🎯 ${skillName.charAt(0).toUpperCase() + skillName.slice(1)}`)
                .setDescription(`${skill.description}\n\n**Tier**: ${skill.tier}\n**Effect**: ${skill.effect}`)
                .setColor(0x0099ff)
                .setTimestamp();
            await message.reply({ embeds: [embed] });
            return;
        }
    }
    
    // Check for gear questions
    for (const [gearName, gear] of Object.entries(archero2Database.gearSets)) {
        if (content.includes(gearName)) {
            const embed = new EmbedBuilder()
                .setTitle(`🛡️ ${gearName.charAt(0).toUpperCase() + gearName.slice(1)} Set`)
                .setDescription(`${gear.description}\n\n**Tier**: ${gear.tier}\n**Best For**: ${gear.bestFor}`)
                .setColor(0xff6b6b)
                .setTimestamp();
            await message.reply({ embeds: [embed] });
            return;
        }
    }
    
    // Check for Umbral Tempest questions
    if (content.includes('umbral tempest') || content.includes('umbral')) {
        const embed = new EmbedBuilder()
            .setTitle('🌪️ Umbral Tempest Event')
            .setDescription('Challenging PvP event with unique mechanics and rewards. Use `!umbral` for detailed information.')
            .setColor(0x8B5CF6)
            .setTimestamp();
        await message.reply({ embeds: [embed] });
        return;
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
