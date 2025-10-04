const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

console.log('🤖 Starting Simple Arch 2 Bot...');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Create webhook client
const xyianGuildWebhook = new WebhookClient({
    url: process.env.XYIAN_GUILD_WEBHOOK
});

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('Arch 2 Addicts Community', { type: 'WATCHING' });
    
    // Send startup message to XYIAN guild
    try {
        const embed = new EmbedBuilder()
            .setTitle('🏰 XYIAN Guild Bot Online!')
            .setDescription('Arch 2 Addicts bot is now online and ready!')
            .setColor(0x00ff00)
            .addFields(
                { name: 'Version', value: '0.0.1', inline: true },
                { name: 'Status', value: '✅ Connected', inline: true },
                { name: 'Commands', value: 'Type !help for commands', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
        
        await xyianGuildWebhook.send({ embeds: [embed] });
        console.log('✅ Startup message sent to XYIAN guild!');
    } catch (error) {
        console.error('❌ Failed to send startup message:', error.message);
    }
});

// Message handling
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        switch (commandName) {
            case 'ping':
                await message.reply('Pong! 🏓');
                break;
                
            case 'help':
                const helpEmbed = new EmbedBuilder()
                    .setTitle('🏰 XYIAN Guild Commands')
                    .setDescription('Available commands for XYIAN OFFICIAL members')
                    .setColor(0xffd700)
                    .addFields(
                        { name: '!ping', value: 'Check if bot is online', inline: true },
                        { name: '!help', value: 'Show this help message', inline: true },
                        { name: '!xyian', value: 'XYIAN guild commands', inline: true },
                        { name: '!weapon [name]', value: 'Get weapon information', inline: true },
                        { name: '!skill [name]', value: 'Get skill information', inline: true },
                        { name: '!build [type]', value: 'Get build recommendations', inline: true }
                    )
                    .setTimestamp();
                await message.reply({ embeds: [helpEmbed] });
                break;
                
            case 'xyian':
                const xyianEmbed = new EmbedBuilder()
                    .setTitle('🏰 XYIAN OFFICIAL Guild')
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
                    .setTimestamp();
                await message.reply({ embeds: [xyianEmbed] });
                break;
                
            case 'weapon':
                const weaponName = args.join(' ').toLowerCase();
                let weaponInfo = 'Weapon not found. Try: dragon knight crossbow, griffin claw, beam staff';
                
                if (weaponName.includes('dragon knight crossbow')) {
                    weaponInfo = '**Dragon Knight Crossbow** (S-Tier)\nExplosive arrows with area damage\n✅ Highly recommended';
                } else if (weaponName.includes('griffin claw')) {
                    weaponInfo = '**Griffin Claw** (S-Tier)\nMulti-hit attacks\n✅ Highly recommended';
                } else if (weaponName.includes('beam staff')) {
                    weaponInfo = '**Beam Staff** (A-Tier)\nContinuous beam damage\n✅ Good choice';
                }
                
                const weaponEmbed = new EmbedBuilder()
                    .setTitle('⚔️ Weapon Information')
                    .setDescription(weaponInfo)
                    .setColor(0x00ff00)
                    .setTimestamp();
                await message.reply({ embeds: [weaponEmbed] });
                break;
                
            case 'skill':
                const skillName = args.join(' ').toLowerCase();
                let skillInfo = 'Skill not found. Try: tracking eye, revive, giant strength';
                
                if (skillName.includes('tracking eye')) {
                    skillInfo = '**Tracking Eye** (Legendary)\nProjectiles track enemies automatically\nMakes all projectiles home in on targets';
                } else if (skillName.includes('revive')) {
                    skillInfo = '**Revive** (Legendary)\nGain an extra life when defeated\nRevive once per run with full health';
                } else if (skillName.includes('giant strength')) {
                    skillInfo = '**Giant\'s Strength** (Epic)\nIncreases Attack Power by 20%\nMultiplicative damage boost';
                }
                
                const skillEmbed = new EmbedBuilder()
                    .setTitle('🎯 Skill Information')
                    .setDescription(skillInfo)
                    .setColor(0x0099ff)
                    .setTimestamp();
                await message.reply({ embeds: [skillEmbed] });
                break;
                
            case 'build':
                const buildType = args.join(' ').toLowerCase();
                let buildInfo = 'Build not found. Try: pvp, pve, farming';
                
                if (buildType.includes('pvp')) {
                    buildInfo = '**PvP Build**\nWeapon: Dragon Knight Crossbow\nGear: Griffin Set\nSkills: Tracking Eye, Front Arrow, Giant\'s Strength\nOptimized for player vs player combat';
                } else if (buildType.includes('pve')) {
                    buildInfo = '**PvE Build**\nWeapon: Griffin Claw\nGear: Oracle Set\nSkills: Revive, Tracking Eye, Swift Arrow\nOptimized for player vs environment';
                } else if (buildType.includes('farming')) {
                    buildInfo = '**Farming Build**\nWeapon: Beam Staff\nGear: Echo Set\nSkills: Tracking Eye, Multi-shot, Ricochet\nOptimized for efficient farming';
                }
                
                const buildEmbed = new EmbedBuilder()
                    .setTitle('🏗️ Build Guide')
                    .setDescription(buildInfo)
                    .setColor(0xff6b6b)
                    .setTimestamp();
                await message.reply({ embeds: [buildEmbed] });
                break;
                
            default:
                await message.reply('Unknown command. Use `!help` to see available commands.');
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
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the bot token is correct');
    console.log('2. Make sure the bot is invited to your server');
    console.log('3. Verify bot permissions in server settings');
    console.log('\n📋 Bot Invite Link:');
    console.log(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot`);
});
