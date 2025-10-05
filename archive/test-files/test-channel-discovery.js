const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

console.log('🔍 Testing Channel Discovery...');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Channel type detection
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

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}!`);
    
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
        console.error('❌ Guild not found!');
        return;
    }
    
    console.log(`📊 Discovering channels in guild: ${guild.name}`);
    
    const channels = guild.channels.cache;
    const discoveredChannels = new Map();
    
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
    
    console.log(`\n✅ Discovery complete: ${discoveredChannels.size} channels found`);
    console.log('\n📋 Channel Summary:');
    
    for (const [channelId, channelInfo] of discoveredChannels) {
        console.log(`  #${channelInfo.name}`);
        console.log(`    Type: ${channelInfo.type}`);
        console.log(`    Purpose: ${channelInfo.purpose}`);
        console.log(`    Webhook: ${channelInfo.webhook ? 'Available' : 'Not Available'}`);
        console.log('');
    }
    
    // Show channel type distribution
    const typeCount = {};
    for (const [channelId, channelInfo] of discoveredChannels) {
        typeCount[channelInfo.type] = (typeCount[channelInfo.type] || 0) + 1;
    }
    
    console.log('📊 Channel Type Distribution:');
    for (const [type, count] of Object.entries(typeCount)) {
        console.log(`  ${type}: ${count} channels`);
    }
    
    console.log('\n🎯 Bot will provide custom functionality for each channel type!');
    
    client.destroy();
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
