const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { WebhookClient } = require('discord.js');
require('dotenv').config();

console.log('🏰 XYIAN Guild Management Bot - Initializing...');

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

// Guild requirements tracking
const guildRequirements = {
    dailyBossBattles: 2,
    dailyDonations: 1,
    checkInactiveDays: 3, // Remove after 3 days inactive
    reminderTime: '18:00' // 6 PM daily reminders
};

// Member activity tracking (in production, use a database)
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
    }
};

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ XYIAN Guild Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('XYIAN Guild Management', { type: 'WATCHING' });
    
    // Send startup message
    await sendGuildAnnouncement('System Online', 'XYIAN Guild Management System is now operational. All monitoring and tracking systems are active.', 'success');
    
    // Start daily reminder system
    startDailyReminders();
    
    console.log('✅ XYIAN Guild Management System - Fully Operational');
});

// Member join event
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 New member joined: ${member.user.username}`);
    
    // Send welcome message
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
    
    await xyianGuildWebhook.send({ embeds: [welcomeEmbed] });
    
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
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        
        console.log(`Command: ${commandName} from ${message.author.username}`);
        
        switch (commandName) {
            case 'ping':
                await message.reply('✅ XYIAN Guild Management System - Online');
                break;
                
            case 'help':
                await showHelp(message);
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
                // Check if it's a question
                await handleQuestion(message);
        }
    } else {
        // Check for questions in regular messages
        await handleQuestion(message);
    }
});

// Show help command
async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN Guild Commands')
        .setDescription('Available commands for guild management')
        .setColor(0xffd700)
        .addFields(
            { name: '!requirements', value: 'Show guild requirements', inline: true },
            { name: '!activity', value: 'Check your activity status', inline: true },
            { name: '!boss', value: 'Record boss battle completion', inline: true },
            { name: '!donate', value: 'Record donation made', inline: true },
            { name: '!inactive', value: 'Show inactive members (officers only)', inline: true },
            { name: '!xyian', value: 'Guild information', inline: true },
            { name: 'Questions', value: 'Ask me anything about Arch 2!', inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show guild requirements
async function showRequirements(message) {
    const embed = new EmbedBuilder()
        .setTitle('📋 XYIAN Guild Requirements')
        .setDescription('Daily requirements to stay active in the guild')
        .setColor(0xff6b6b)
        .addFields(
            { name: 'Daily Boss Battles', value: `${guildRequirements.dailyBossBattles} required`, inline: true },
            { name: 'Daily Donations', value: `${guildRequirements.dailyDonations} required`, inline: true },
            { name: 'Inactive Period', value: `${guildRequirements.checkInactiveDays} days before removal`, inline: true },
            { name: 'Reminder Time', value: `Daily at ${guildRequirements.reminderTime}`, inline: true },
            { name: 'Commands', value: 'Use `!boss` and `!donate` to record your activity', inline: false },
            { name: 'Status', value: 'Use `!activity` to check your current status', inline: false }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Show member activity
async function showActivity(message) {
    const memberId = message.author.id;
    const activity = memberActivity.get(memberId);
    
    if (!activity) {
        await message.reply('❌ No activity data found. You may not be tracked yet.');
        return;
    }
    
    const today = new Date();
    const lastBoss = activity.lastBossBattle ? new Date(activity.lastBossBattle) : null;
    const lastDonation = activity.lastDonation ? new Date(activity.lastDonation) : null;
    
    const bossToday = lastBoss && lastBoss.toDateString() === today.toDateString();
    const donationToday = lastDonation && lastDonation.toDateString() === today.toDateString();
    
    const embed = new EmbedBuilder()
        .setTitle(`📊 Activity Status - ${message.author.username}`)
        .setColor(bossToday && donationToday ? 0x00ff00 : 0xffaa00)
        .addFields(
            { name: 'Boss Battles Today', value: bossToday ? '✅ Completed' : '❌ Not completed', inline: true },
            { name: 'Donation Today', value: donationToday ? '✅ Completed' : '❌ Not completed', inline: true },
            { name: 'Total Boss Battles', value: activity.totalBossBattles.toString(), inline: true },
            { name: 'Total Donations', value: activity.totalDonations.toString(), inline: true },
            { name: 'Status', value: activity.isActive ? '✅ Active' : '❌ Inactive', inline: true },
            { name: 'Joined', value: activity.joinedAt.toDateString(), inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Record boss battle
async function recordBossBattle(message) {
    const memberId = message.author.id;
    const activity = memberActivity.get(memberId) || {
        joinedAt: new Date(),
        lastBossBattle: null,
        lastDonation: null,
        totalBossBattles: 0,
        totalDonations: 0,
        isActive: true
    };
    
    const today = new Date();
    const lastBoss = activity.lastBossBattle ? new Date(activity.lastBossBattle) : null;
    const isNewDay = !lastBoss || lastBoss.toDateString() !== today.toDateString();
    
    if (isNewDay) {
        activity.lastBossBattle = today;
        activity.totalBossBattles += 1;
        activity.isActive = true;
        memberActivity.set(memberId, activity);
        
        await message.reply('✅ Boss battle recorded. Excellent progress!');
        
        // Check if they've completed both requirements
        const lastDonation = activity.lastDonation ? new Date(activity.lastDonation) : null;
        const donationToday = lastDonation && lastDonation.toDateString() === today.toDateString();
        
        if (donationToday) {
            await message.reply('🎉 Daily requirements completed. Outstanding dedication to the guild!');
        }
    } else {
        await message.reply('ℹ️ Boss battle already recorded for today.');
    }
}

// Record donation
async function recordDonation(message) {
    const memberId = message.author.id;
    const activity = memberActivity.get(memberId) || {
        joinedAt: new Date(),
        lastBossBattle: null,
        lastDonation: null,
        totalBossBattles: 0,
        totalDonations: 0,
        isActive: true
    };
    
    const today = new Date();
    const lastDonation = activity.lastDonation ? new Date(activity.lastDonation) : null;
    const isNewDay = !lastDonation || lastDonation.toDateString() !== today.toDateString();
    
    if (isNewDay) {
        activity.lastDonation = today;
        activity.totalDonations += 1;
        activity.isActive = true;
        memberActivity.set(memberId, activity);
        
        await message.reply('✅ Donation recorded. Thank you for supporting the guild!');
        
        // Check if they've completed both requirements
        const lastBoss = activity.lastBossBattle ? new Date(activity.lastBossBattle) : null;
        const bossToday = lastBoss && lastBoss.toDateString() === today.toDateString();
        
        if (bossToday) {
            await message.reply('🎉 Daily requirements completed. Outstanding dedication to the guild!');
        }
    } else {
        await message.reply('ℹ️ Donation already recorded for today.');
    }
}

// Show inactive members (officers only)
async function showInactiveMembers(message) {
    // Check if user has permission (simplified check)
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        await message.reply('❌ Access denied. Officer permissions required.');
        return;
    }
    
    const today = new Date();
    const inactiveMembers = [];
    
    for (const [memberId, activity] of memberActivity.entries()) {
        const lastBoss = activity.lastBossBattle ? new Date(activity.lastBossBattle) : null;
        const lastDonation = activity.lastDonation ? new Date(activity.lastDonation) : null;
        
        const daysSinceBoss = lastBoss ? Math.floor((today - lastBoss) / (1000 * 60 * 60 * 24)) : 999;
        const daysSinceDonation = lastDonation ? Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24)) : 999;
        
        if (daysSinceBoss >= guildRequirements.checkInactiveDays || daysSinceDonation >= guildRequirements.checkInactiveDays) {
            inactiveMembers.push({
                memberId,
                daysSinceBoss,
                daysSinceDonation,
                activity
            });
        }
    }
    
    if (inactiveMembers.length === 0) {
        await message.reply('✅ All guild members are currently active.');
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('⚠️ Inactive Member Report')
        .setDescription('Members requiring attention due to inactivity')
        .setColor(0xff6b6b);
    
    for (const member of inactiveMembers.slice(0, 10)) { // Limit to 10 for readability
        const memberObj = await message.guild.members.fetch(member.memberId).catch(() => null);
        const username = memberObj ? memberObj.user.username : 'Unknown';
        
        embed.addFields({
            name: username,
            value: `Boss: ${member.daysSinceBoss}d ago, Donation: ${member.daysSinceDonation}d ago`,
            inline: true
        });
    }
    
    if (inactiveMembers.length > 10) {
        embed.setFooter({ text: `And ${inactiveMembers.length - 10} more...` });
    }
    
    await message.reply({ embeds: [embed] });
}

// Show guild info
async function showGuildInfo(message) {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN OFFICIAL Guild Status')
        .setDescription('Premier Arch 2 Addicts guild information and statistics')
        .setColor(0xffd700)
        .addFields(
            { name: 'Guild Level', value: 'Level 5', inline: true },
            { name: 'Members', value: `${memberActivity.size}/50`, inline: true },
            { name: 'Guild Coins', value: '12,500', inline: true },
            { name: 'Daily Requirements', value: '2 Boss Battles + 1 Donation', inline: false },
            { name: 'Best Weapon', value: 'Dragon Knight Crossbow', inline: true },
            { name: 'Recommended Set', value: 'Griffin Set (PvP)', inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Handle questions
async function handleQuestion(message) {
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

// Send guild announcement
async function sendGuildAnnouncement(title, description, type = 'info') {
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
        .setColor(colors[type])
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
    
    try {
        await xyianGuildWebhook.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Failed to send guild announcement:', error.message);
    }
}

// Start daily reminders
function startDailyReminders() {
    console.log('⏰ Starting daily reminder system...');
    
    // Check every hour for reminder time
    setInterval(() => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        
        if (currentTime === guildRequirements.reminderTime) {
            sendDailyReminders();
        }
    }, 60000); // Check every minute
}

// Send daily reminders
async function sendDailyReminders() {
    const today = new Date();
    const inactiveMembers = [];
    
    for (const [memberId, activity] of memberActivity.entries()) {
        const lastBoss = activity.lastBossBattle ? new Date(activity.lastBossBattle) : null;
        const lastDonation = activity.lastDonation ? new Date(activity.lastDonation) : null;
        
        const bossToday = lastBoss && lastBoss.toDateString() === today.toDateString();
        const donationToday = lastDonation && lastDonation.toDateString() === today.toDateString();
        
        if (!bossToday || !donationToday) {
            inactiveMembers.push(memberId);
        }
    }
    
    if (inactiveMembers.length > 0) {
    await sendGuildAnnouncement(
        'Daily Requirements Reminder',
        `⏰ Daily guild requirements reminder:\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n\nUse \`!boss\` and \`!donate\` to record your progress.\n\n${inactiveMembers.length} members pending completion.`,
        'warning'
    );
    }
}

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
