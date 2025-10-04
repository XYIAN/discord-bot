const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Create webhook clients
const generalWebhook = new WebhookClient({
    url: process.env.GENERAL_CHAT_WEBHOOK
});

const xyianGuildWebhook = new WebhookClient({
    url: process.env.XYIAN_GUILD_WEBHOOK
});

// Command collection
client.commands = new Collection();

// Bot ready event
client.once('ready', async () => {
    console.log(`Bot is online as ${client.user.tag}!`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('Arch 2 Addicts Community', { type: 'WATCHING' });
    
    // Send startup message to XYIAN guild
    await sendGuildAnnouncement(
        'Bot Online',
        'XYIAN Guild bot is now online and ready to serve! Use `!xyian help` for available commands.',
        'success'
    );
});

// Message handling
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Basic commands
        switch (commandName) {
            case 'ping':
                await message.reply('Pong!');
                break;
            case 'help':
                await showHelp(message);
                break;
            case 'info':
                await showServerInfo(message);
                break;
            case 'xyian':
                await handleXyianCommand(message, args);
                break;
        }
    }
});

// Member join event
client.on('guildMemberAdd', async member => {
    console.log(`${member.user.username} joined the server`);
    
    // Send welcome message
    const welcomeChannel = member.guild.channels.cache.find(
        channel => channel.name === 'general-chat'
    );
    
    if (welcomeChannel) {
        const embed = new EmbedBuilder()
            .setTitle('Welcome to Arch 2 Addicts!')
            .setDescription(`Welcome ${member} to our community!`)
            .setColor(0x00ff00)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: 'Server', value: 'Arch 2 Addicts', inline: true }
            )
            .setTimestamp();
        
        await welcomeChannel.send({ embeds: [embed] });
    }
    
    // Assign base member role
    const memberRole = member.guild.roles.cache.find(role => role.name === 'Member');
    if (memberRole) {
        await member.roles.add(memberRole);
    }
});

// Member leave event
client.on('guildMemberRemove', member => {
    console.log(`${member.user.username} left the server`);
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Command functions
async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('Arch 2 Addicts Bot Commands')
        .setDescription('Available commands for the community')
        .setColor(0x0099ff)
        .addFields(
            { name: '!ping', value: 'Check if bot is online', inline: true },
            { name: '!help', value: 'Show this help message', inline: true },
            { name: '!info', value: 'Show server information', inline: true },
            { name: '!xyian', value: 'XYIAN OFFICIAL commands', inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showServerInfo(message) {
    const guild = message.guild;
    const embed = new EmbedBuilder()
        .setTitle('Arch 2 Addicts Server Info')
        .setDescription('Community information and statistics')
        .setColor(0x0099ff)
        .addFields(
            { name: 'Server Name', value: guild.name, inline: true },
            { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
            { name: 'Created', value: guild.createdAt.toDateString(), inline: true },
            { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
            { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true }
        )
        .setThumbnail(guild.iconURL())
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function handleXyianCommand(message, args) {
    const member = message.member;
    const isXyianMember = member.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
    
    if (!isXyianMember) {
        await message.reply('This command is only available to XYIAN OFFICIAL members.');
        return;
    }
    
    const subcommand = args[0];
    
    switch (subcommand) {
        case 'info':
            await showXyianGuildInfo(message);
            break;
        case 'members':
            await showXyianMembers(message);
            break;
        case 'stats':
            await showGuildStats(message);
            break;
        case 'events':
            await showGuildEvents(message);
            break;
        case 'help':
            await showXyianHelp(message);
            break;
        case 'weapon':
            await showWeaponInfo(message, args.slice(1));
            break;
        case 'skill':
            await showSkillInfo(message, args.slice(1));
            break;
        case 'build':
            await showBuildGuide(message, args.slice(1));
            break;
        default:
            await showXyianHelp(message);
    }
}

async function showXyianGuildInfo(message) {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN OFFICIAL Guild Information')
        .setDescription('Welcome to the XYIAN guild - the elite force of Arch 2 Addicts!')
        .setColor(0xffd700)
        .addFields(
            { name: 'Guild Level', value: 'Level 5', inline: true },
            { name: 'Members', value: '25/50', inline: true },
            { name: 'Guild Coins', value: '12,500', inline: true },
            { name: 'Best Weapon', value: 'Dragon Knight Crossbow', inline: true },
            { name: 'Recommended Set', value: 'Griffin Set (PvP)', inline: true },
            { name: 'Guild Benefits', value: '10% discount on items', inline: true }
        )
        .setThumbnail('https://via.placeholder.com/100x100/FFD700/000000?text=XYIAN')
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showXyianMembers(message) {
    const embed = new EmbedBuilder()
        .setTitle('👥 XYIAN OFFICIAL Members')
        .setDescription('Elite guild members and their achievements')
        .setColor(0x0099ff)
        .addFields(
            { name: 'Guild Leader', value: 'Kyle (Power: 15,000)', inline: false },
            { name: 'Top Contributors', value: 'Member1, Member2, Member3', inline: false },
            { name: 'Recent Joiners', value: 'NewMember1, NewMember2', inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showGuildStats(message) {
    const embed = new EmbedBuilder()
        .setTitle('📊 XYIAN Guild Statistics')
        .setDescription('Current guild performance and metrics')
        .setColor(0x00ff00)
        .addFields(
            { name: 'Total Power', value: '375,000', inline: true },
            { name: 'Average Power', value: '15,000', inline: true },
            { name: 'Weekly Activity', value: '95%', inline: true },
            { name: 'Bosses Defeated', value: '1,250', inline: true },
            { name: 'Items Farmed', value: '5,000', inline: true },
            { name: 'Guild Rank', value: '#15', inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showGuildEvents(message) {
    const embed = new EmbedBuilder()
        .setTitle('🎯 XYIAN Guild Events')
        .setDescription('Upcoming and active guild events')
        .setColor(0xff6b6b)
        .addFields(
            { name: 'Active Events', value: 'Weekly Farming Challenge\nBoss Slayer Challenge', inline: false },
            { name: 'Upcoming', value: 'Guild Tournament (Next Week)\nEquipment Exchange Event', inline: false },
            { name: 'Rewards', value: 'Guild Coins + Exclusive Titles', inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showXyianHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN Guild Commands')
        .setDescription('Available commands for XYIAN OFFICIAL members')
        .setColor(0xffd700)
        .addFields(
            { name: '!xyian info', value: 'Guild information and status', inline: true },
            { name: '!xyian members', value: 'List guild members', inline: true },
            { name: '!xyian stats', value: 'Guild statistics', inline: true },
            { name: '!xyian events', value: 'Guild events and challenges', inline: true },
            { name: '!xyian weapon [name]', value: 'Weapon information', inline: true },
            { name: '!xyian skill [name]', value: 'Skill information', inline: true },
            { name: '!xyian build [type]', value: 'Build recommendations', inline: true },
            { name: '!xyian help', value: 'Show this help message', inline: true }
        )
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showWeaponInfo(message, args) {
    const weaponName = args.join(' ').toLowerCase();
    
    const weapons = {
        'dragon knight crossbow': {
            name: 'Dragon Knight Crossbow',
            tier: 'S-Tier',
            type: 'Crossbow',
            special: 'Explosive arrows with area damage',
            recommended: true
        },
        'griffin claw': {
            name: 'Griffin Claw',
            tier: 'S-Tier',
            type: 'Claw',
            special: 'Multi-hit attacks',
            recommended: true
        },
        'beam staff': {
            name: 'Beam Staff',
            tier: 'A-Tier',
            type: 'Staff',
            special: 'Continuous beam damage',
            recommended: true
        }
    };
    
    const weapon = weapons[weaponName] || {
        name: 'Weapon Not Found',
        tier: 'Unknown',
        type: 'Unknown',
        special: 'Use: !xyian weapon [dragon knight crossbow, griffin claw, beam staff]',
        recommended: false
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`⚔️ ${weapon.name}`)
        .setDescription(weapon.special)
        .setColor(weapon.recommended ? 0x00ff00 : 0xffaa00)
        .addFields(
            { name: 'Tier', value: weapon.tier, inline: true },
            { name: 'Type', value: weapon.type, inline: true },
            { name: 'Recommended', value: weapon.recommended ? '✅ Yes' : '❌ No', inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showSkillInfo(message, args) {
    const skillName = args.join(' ').toLowerCase();
    
    const skills = {
        'tracking eye': {
            name: 'Tracking Eye',
            rarity: 'Legendary',
            description: 'Projectiles track enemies automatically',
            effect: 'Makes all projectiles home in on targets'
        },
        'revive': {
            name: 'Revive',
            rarity: 'Legendary',
            description: 'Gain an extra life when defeated',
            effect: 'Revive once per run with full health'
        },
        'giant strength': {
            name: 'Giant\'s Strength',
            rarity: 'Epic',
            description: 'Increases Attack Power by 20%',
            effect: 'Multiplicative damage boost'
        }
    };
    
    const skill = skills[skillName] || {
        name: 'Skill Not Found',
        rarity: 'Unknown',
        description: 'Use: !xyian skill [tracking eye, revive, giant strength]',
        effect: 'Check available skills'
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`🎯 ${skill.name}`)
        .setDescription(skill.description)
        .setColor(skill.rarity === 'Legendary' ? 0xff6b6b : 0x0099ff)
        .addFields(
            { name: 'Rarity', value: skill.rarity, inline: true },
            { name: 'Effect', value: skill.effect, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

async function showBuildGuide(message, args) {
    const buildType = args.join(' ').toLowerCase();
    
    const builds = {
        'pvp': {
            name: 'PvP Build',
            weapon: 'Dragon Knight Crossbow',
            gear: 'Griffin Set',
            skills: 'Tracking Eye, Front Arrow, Giant\'s Strength',
            description: 'Optimized for player vs player combat'
        },
        'pve': {
            name: 'PvE Build',
            weapon: 'Griffin Claw',
            gear: 'Oracle Set',
            skills: 'Revive, Tracking Eye, Swift Arrow',
            description: 'Optimized for player vs environment'
        },
        'farming': {
            name: 'Farming Build',
            weapon: 'Beam Staff',
            gear: 'Echo Set',
            skills: 'Tracking Eye, Multi-shot, Ricochet',
            description: 'Optimized for efficient farming'
        }
    };
    
    const build = builds[buildType] || {
        name: 'Build Guide',
        weapon: 'See available builds',
        gear: 'Use: !xyian build [pvp, pve, farming]',
        skills: 'Check build types above',
        description: 'Choose your playstyle'
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`🏗️ ${build.name}`)
        .setDescription(build.description)
        .setColor(0x00ff00)
        .addFields(
            { name: 'Weapon', value: build.weapon, inline: true },
            { name: 'Gear Set', value: build.gear, inline: true },
            { name: 'Skills', value: build.skills, inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Webhook functions
async function sendWebhookMessage(content, username = 'Arch 2 Bot') {
    try {
        await generalWebhook.send({
            content,
            username
        });
    } catch (error) {
        console.error('Error sending webhook message:', error);
    }
}

// XYIAN Guild webhook functions
async function sendGuildMessage(content, username = 'XYIAN Guild Bot') {
    try {
        await xyianGuildWebhook.send({
            content,
            username
        });
    } catch (error) {
        console.error('Error sending guild webhook message:', error);
    }
}

async function sendGuildAnnouncement(title, description, eventType = 'info') {
    const colors = {
        'info': 0x0099ff,
        'success': 0x00ff00,
        'warning': 0xffaa00,
        'error': 0xff0000,
        'event': 0xff6b6b
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`🏰 XYIAN Guild: ${title}`)
        .setDescription(description)
        .setColor(colors[eventType])
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
    
    try {
        await xyianGuildWebhook.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending guild announcement:', error);
    }
}

// Export for testing
module.exports = { client, sendWebhookMessage };

// Start bot
if (require.main === module) {
    client.login(process.env.DISCORD_TOKEN);
}
