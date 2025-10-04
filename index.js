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

// Create webhook client for general chat
const generalWebhook = new WebhookClient({
    url: process.env.GENERAL_CHAT_WEBHOOK
});

// Command collection
client.commands = new Collection();

// Bot ready event
client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}!`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('Arch 2 Addicts Community', { type: 'WATCHING' });
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
            await message.reply('XYIAN OFFICIAL guild information will be displayed here.');
            break;
        case 'members':
            await message.reply('XYIAN OFFICIAL member list will be displayed here.');
            break;
        default:
            await message.reply('Available XYIAN commands: info, members');
    }
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

// Export for testing
module.exports = { client, sendWebhookMessage };

// Start bot
if (require.main === module) {
    client.login(process.env.DISCORD_TOKEN);
}
