const { Client, GatewayIntentBits, EmbedBuilder, WebhookClient } = require('discord.js');
require('dotenv').config();

// Initialize Discord client with all necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Webhook configurations
const webhooks = {
    xyian: process.env.XYIAN_GUILD_WEBHOOK,
    general: process.env.GENERAL_CHAT_WEBHOOK,
    recruit: process.env.GUILD_RECRUIT_WEBHOOK,
    expedition: process.env.GUILD_EXPEDITION_WEBHOOK,
    arena: process.env.GUILD_ARENA_WEBHOOK
};

// Member activity tracking
const memberActivity = new Map();

// Archero 2 Q&A Database
const archeroQA = {
    "best etched rune": "The main hand etched rune is considered the best for DPS. It provides the highest damage output and is essential for maximizing your character's potential. Focus on upgrading your main hand rune first!",
    "best weapon mage": "For mage class, the Staff of Light is highly recommended. It provides excellent magical damage and synergizes well with mage abilities. The Staff of Light offers great range and area damage, perfect for clearing waves of enemies.",
    "best weapon warrior": "For warrior class, the Demon Blade is the top choice. It offers exceptional melee damage and critical hit potential. The Demon Blade's special ability can devastate groups of enemies and bosses alike.",
    "best weapon archer": "For archer class, the Windforce Bow is highly recommended. It provides excellent range, piercing damage, and special abilities that can hit multiple enemies. Perfect for kiting and area control.",
    "how to get more power": "To increase your power level: 1) Upgrade your weapons and armor, 2) Level up your character, 3) Enhance your runes, 4) Complete daily quests, 5) Join a guild for bonuses, 6) Participate in events for rewards.",
    "best skills": "Top skills to prioritize: 1) Multi-shot (increases projectiles), 2) Ricochet (bounces between enemies), 3) Piercing (passes through enemies), 4) Bouncy Wall (bounces off walls), 5) Side Arrow (additional projectiles).",
    "guild requirements": "Daily guild requirements: • Complete 2 Boss Battles • Make 1 Guild Donation • Maintain active participation. Use !boss and !donate to record your progress.",
    "how to join guild": "To join XYIAN OFFICIAL guild: 1) Be level 50+ in Archero 2, 2) Have 300k+ power, 3) Be active daily, 4) Complete 2 boss battles per day, 5) Make 1 guild donation per day. Guild ID: 213797",
    "umbral tempest": "Umbral Tempest Event Tips: 1) Use high DPS builds, 2) Focus on area damage skills, 3) Save your ultimate for boss phases, 4) Join with guild members for better rewards, 5) Complete daily event quests for maximum rewards.",
    "best build": "Best build depends on your class: Warrior - Demon Blade + defensive skills, Mage - Staff of Light + magical skills, Archer - Windforce + mobility skills. Focus on synergy between your weapon and chosen skills.",
    "daily reset": "Daily reset happens at 5:00 PM Pacific Time. Remember to complete your daily quests, boss battles, and guild donations before reset to maximize your rewards!",
    "arena": "Arena is a fully automated PvP mode where you select heroes and gear, then AI handles combat. Winning increases ladder points, losses decrease them. Rewards include gold, scrolls, and Arena Exchange Tickets based on your PvP tier and ranking.",
    "supreme arena": "Supreme Arena is the ultimate PvP challenge requiring 3 different characters with 3 different builds. Each different item provides bonus health and damage. Top 40% of players remain in Supreme Rank weekly, others are demoted. Only the most skilled players with optimal builds can consistently win.",
    "arena vs supreme arena": "Both are fully automated PvP modes. Arena is accessible to most players with decent rewards. Supreme Arena requires 3-character team composition with different builds and items for maximum bonuses. Supreme Arena has much higher difficulty but offers the best rewards and exclusive items.",
    "arena tips": "Arena Tips: 1) Use Dragoon as your primary hero, 2) Use Griffin only if you have a complete Griffin build, 3) Equip Revive Rune for second chance, 4) Prioritize ranged attack enhancements, 5) Focus on S-tier gear upgrades, 6) Complete daily arena runs, 7) Aim for top 15 in bracket for tier advancement.",
    "supreme arena tips": "Supreme Arena Tips: 1) Use 3 different characters with 3 different builds, 2) Each different item provides bonus health and damage, 3) Dragoon + Griffin + third hero recommended, 4) Revive Rune is essential (50% chance to revive with half HP), 5) Maximize item diversity for stat bonuses, 6) Focus on Multi-shot, Ricochet, Piercing skills, 7) Only top 1% players compete here.",
    "supreme arena rules": "Supreme Arena Rules: 1) Must use 3 different characters, 2) Must use 3 different builds (can use same character but different items), 3) Each different item provides bonus health and damage, 4) Top 40% of players remain in Supreme Rank weekly, 5) 60% are demoted each week, 6) No player limit in Supreme Rank.",
    "team composition": "Supreme Arena Team Composition: 1) Use 3 different characters, 2) Each character needs different build, 3) Maximize item diversity for bonuses, 4) Recommended: Dragoon + Griffin + third hero, 5) Balance damage and survivability, 6) Each unique item type adds health and damage.",
    "item bonuses": "Item Bonus System: 1) Each different item type provides bonus health, 2) Each different item type provides bonus damage, 3) Different item combinations provide additional synergy effects, 4) Mix and match for maximum stat gains, 5) Focus on item diversity over duplicates.",
    "best arena heroes": "Top Arena Heroes: 1) Dragoon - The absolute best Arena hero, 2) Griffin - Only use if you have a complete Griffin build, 3) Avoid other heroes for competitive Arena. Dragoon is the clear #1 choice for both Arena and Supreme Arena.",
    "arena runes": "Best Arena Runes: 1) Revive Rune (essential for second chance), 2) Guardian Rune (solid alternative), 3) Flame Knock Touch Rune (good backup). Focus on runes that enhance ranged attacks and survivability.",
    "arena rewards": "Arena Rewards: Daily rewards based on PvP tier and ranking include gold, scrolls, and Arena Exchange Tickets. Use Arena Exchange Tickets in the Arena Shop for exclusive items. Rankings reset each season with tier advancement opportunities.",
    "arena ranking": "Arena Ranking: Winning matches increases ladder points, losses decrease them. Stronger opponents yield more points. Aim for top 15 in your bracket by season's end for tier advancement. Rankings reset each season."
};

// Daily tips database
const dailyTips = [
    "💡 **Pro Tip**: Always complete your daily quests before reset - they give massive XP and gold rewards!",
    "⚔️ **Combat Tip**: Use the environment to your advantage - walls can help you dodge projectiles and funnel enemies!",
    "🏰 **Guild Tip**: Donate to your guild daily - the 10% shop discount adds up to huge savings over time!",
    "🎯 **Boss Tip**: Learn boss attack patterns - most bosses have predictable moves you can dodge with practice!",
    "💎 **Economy Tip**: Save your gems for weapon upgrades rather than random chests - guaranteed progress is better than RNG!",
    "🔥 **Event Tip**: Participate in all events - even small rewards add up and events often have exclusive items!",
    "⚡ **Skill Tip**: Prioritize skills that synergize with your weapon - a well-built character is stronger than high-level random skills!",
    "🛡️ **Defense Tip**: Don't ignore defensive stats - surviving longer often means more damage dealt overall!",
    "🎮 **General Tip**: Take breaks between long sessions - fresh eyes spot opportunities you might miss when tired!",
    "🌟 **Advanced Tip**: Master the art of kiting - keeping enemies at optimal range maximizes your damage while minimizing theirs!"
];

// Arena tips database (research-based)
    const arenaTips = [
        "🏟️ **Arena Hero Selection**: Dragoon is the top Arena hero! Use Griffin only if you have a complete Griffin build!",
        "⚔️ **Arena Automation**: Arena battles are fully automated - select your best hero and gear, then let AI handle combat!",
        "🎯 **Arena Runes**: Equip the Revive Rune for a second chance! Guardian or Flame Knock Touch are solid alternatives!",
        "💪 **Arena Ranking**: Winning increases ladder points, losses decrease them. Stronger foes yield more points!",
        "🔥 **Arena Rewards**: Based on PvP tier and ranking - earn gold, scrolls, and Arena Exchange Tickets daily!",
        "⚡ **Arena Strategy**: Prioritize ranged attack enhancements - projectiles perform best in PvP scenarios!",
        "🛡️ **Arena Heroes**: Dragoon is #1, Griffin is #2 but only with full build. Avoid other heroes for competitive Arena!",
        "🌟 **Arena Daily**: Complete daily arena runs for consistent rewards and seasonal progression!",
        "💎 **Arena Shop**: Use Arena Exchange Tickets in the Arena Shop for exclusive items and upgrades!",
        "🏆 **Arena Seasons**: Rankings reset each season - aim for top 15 in your bracket for tier advancement!",
        "👑 **Supreme Arena**: Requires 3 different characters with 3 different builds! Each unique item provides bonus health and damage!",
        "⚔️ **Supreme Team**: Use Dragoon + Griffin + third hero for optimal Supreme Arena team composition!",
        "🎯 **Item Diversity**: Maximize different item types for maximum stat bonuses in Supreme Arena!",
        "💪 **Supreme Ranking**: Top 40% stay in Supreme Rank weekly - 60% get demoted! Stay competitive!",
        "🔥 **Revive Rune**: Essential for Supreme Arena - 50% chance to revive with half HP at Epic level!"
    ];

// Supreme Arena tips database (research-based)
const supremeArenaTips = [
    "👑 **Supreme Arena**: The ultimate PvP challenge requiring 3 different characters with 3 different builds!",
    "⚔️ **Supreme Team**: Use Dragoon + Griffin + third hero for optimal team composition!",
    "🎯 **Item Bonuses**: Each different item provides bonus health and damage - maximize item diversity!",
    "💪 **Supreme Rules**: Top 40% stay in Supreme Rank weekly, 60% get demoted - stay competitive!",
    "🔥 **Revive Rune**: Essential for Supreme Arena - 50% chance to revive with half HP at Epic level!",
    "🌟 **Build Diversity**: Each character needs different build - can use same character but different items!",
    "🏆 **Supreme Strategy**: Balance damage and survivability across all 3 characters!",
    "💎 **Item Synergy**: Different item combinations provide additional synergy effects!",
    "⚡ **Supreme Skills**: Multi-shot, Ricochet, and Piercing are the top skills for Supreme Arena!",
    "🛡️ **Supreme Defense**: Focus on survivability - you need to outlast your opponents!",
    "🎮 **Team Building**: Must use 3 different characters - no duplicates allowed!",
    "🔥 **Stat Optimization**: Mix and match items for maximum health and damage bonuses!",
    "💪 **Supreme Ranking**: No player limit in Supreme Rank - compete with the best!",
    "🌟 **Meta Adaptation**: Stay updated with current Supreme Arena meta strategies!",
    "🏆 **Supreme Rewards**: The best rewards in the game - only top players compete here!"
];

// Umbral Tempest strategies
const umbralStrategies = [
    "🌙 **Umbral Tempest Strategy**: Use high DPS builds with area damage skills for maximum efficiency!",
    "⚡ **Event Tip**: Save your ultimate abilities for boss phases - they can turn the tide of battle!",
    "👥 **Team Play**: Coordinate with guild members for better rewards and faster completion!",
    "🎯 **Focus Fire**: Target elite enemies first - they drop better rewards and are easier to kill when isolated!",
    "💪 **Power Build**: Stack damage multipliers and critical hit chance for devastating combos!"
];

// Bot startup
client.once('ready', () => {
    console.log('🏰 XYIAN Ultimate Bot - Initializing...');
    console.log(`✅ XYIAN Ultimate Bot is online as ${client.user.tag}!`);
    console.log(`📊 Managing ${client.guilds.cache.size} guilds`);
    
    // Set up daily messaging system
    setupDailyMessaging();
    
    // Set up daily reset messaging (5pm Pacific)
    setupDailyResetMessaging();
    
    console.log('✅ All systems activated!');
});

// Daily messaging system
function setupDailyMessaging() {
    console.log('📅 Starting daily messaging system...');
    
    // Send initial messages
    sendInitialMessages();
    
    // Set up daily schedule (every 24 hours)
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

// Send initial messages
async function sendInitialMessages() {
    console.log('📢 Sending initial messages...');
    
    // Send guild recruitment
    await sendGuildRecruitment();
    
    // Send general welcome
    await sendGeneralWelcome();
    
    console.log('✅ Initial messages sent!');
}

// Send daily messages
async function sendDailyMessages() {
    console.log('📅 Sending daily messages...');
    
    // Send daily tip
    await sendDailyTip();
    
    // Send guild recruitment
    await sendGuildRecruitment();
    
    // Send expedition message
    await sendExpeditionMessage();
    
    // Send arena tip
    await sendArenaTip();
    
    console.log('✅ Daily messages sent!');
}

// Send daily reset messages
async function sendDailyResetMessages() {
    console.log('🔄 Sending daily reset messages...');
    
    // Guild reset message
    await sendGuildResetMessage();
    
    // General reset message
    await sendGeneralResetMessage();
    
    console.log('✅ Daily reset messages sent!');
}

// Guild reset message
async function sendGuildResetMessage() {
    const embed = new EmbedBuilder()
        .setTitle('🔄 Daily Reset - XYIAN Guild')
        .setDescription('**Daily reset is here! Time to get back to business!**\n\n⚔️ **Remember your daily requirements:**\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Stay active and engaged\n\n💪 **Let\'s show everyone why XYIAN is the best guild!**\n\n🎯 **Pro tip**: Complete your requirements early to avoid missing out on rewards!')
        .setColor(0xFF6B35) // Orange for reset
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Daily Reset' });

    await sendToXYIAN({ embeds: [embed] });
}

// General reset message
async function sendGeneralResetMessage() {
    const embed = new EmbedBuilder()
        .setTitle('🎉 Happy Daily Reset!')
        .setDescription('**A new day, new opportunities to level up!**\n\n✨ **What\'s new today:**\n• Fresh daily quests with great rewards\n• New challenges to conquer\n• Another chance to improve your build\n• More opportunities to earn gold and XP\n\n🎮 **Ready to dominate today\'s challenges?**\nAsk questions, share strategies, and let\'s make today count!')
        .setColor(0x00FF88) // Green for positivity
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts - Daily Reset' });

    await sendToGeneral({ embeds: [embed] });
}

// Send daily tip
async function sendDailyTip() {
    const tip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('💡 Daily Archero 2 Tip')
        .setDescription(tip)
        .setColor(0x00BFFF) // Light blue
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Daily Tips' });

    await sendToGeneral({ embeds: [embed] });
}

// Send guild recruitment
async function sendGuildRecruitment() {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN OFFICIAL - Guild Recruitment')
        .setDescription(`**Guild ID: 213797**\n\n**We're looking for dedicated players to join our elite community!**\n\n✨ **What we offer:**\n• Active daily community\n• Expert strategies and guides\n• Guild events and challenges\n• 10% discount on guild shop items\n• Supportive and friendly environment\n\n🎯 **Requirements:**\n• Daily participation in guild activities\n• 2 Boss Battles per day\n• 1 Guild Donation per day\n• Active in Discord community\n\n💪 **Power Level:** 300k+ recommended\n\n**Ready to join the elite? Apply now!**`)
        .setColor(0xFFA500) // Gold color
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

    await sendToRecruit({ embeds: [embed] });
}

// Send general welcome
async function sendGeneralWelcome() {
    const embed = new EmbedBuilder()
        .setTitle('🎉 Welcome to XYIAN OFFICIAL!')
        .setDescription('**Your premier Archero 2 community is now enhanced with daily content!**\n\n✨ **What to expect:**\n• Daily tips and strategies\n• Event reminders and guides\n• Community discussions\n• Guild recruitment updates\n\n🎮 **Ready to level up your game?**\nAsk questions, share builds, and connect with fellow players!')
        .setColor(0x00ff88)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

    await sendToGeneral({ embeds: [embed] });
}

// Send guild expedition message
async function sendExpeditionMessage() {
    const embed = new EmbedBuilder()
        .setTitle('🏰 XYIAN Guild Expedition')
        .setDescription('**Ready for another day of conquest and glory!**\n\n⚔️ **Expedition Focus:**\n• Complete daily expedition challenges\n• Maximize guild contribution points\n• Unlock rare rewards and materials\n• Support your fellow guild members\n\n🎯 **Today\'s Strategy:**\n• Focus on high-value targets\n• Coordinate with guild members\n• Use optimal builds for each stage\n• Share discoveries and tips\n\n💪 **Let\'s show everyone why XYIAN is the best!**')
        .setColor(0x8A2BE2) // Purple for expedition
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Guild Expedition' });

    await sendToExpedition({ embeds: [embed] });
}

// Send arena tip
async function sendArenaTip() {
    const arenaTip = arenaTips[Math.floor(Math.random() * arenaTips.length)];
    const supremeTip = supremeArenaTips[Math.floor(Math.random() * supremeArenaTips.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🏟️ Daily Arena Tips')
        .setDescription(`**Arena & Supreme Arena Strategies**\n\n${arenaTip}\n\n${supremeTip}\n\n💪 **Key Differences:**\n• **Arena**: Focus on speed and efficiency\n• **Supreme Arena**: Ultimate challenge requiring perfect execution\n• **Rewards**: Supreme Arena offers the best rewards\n• **Strategy**: Both require high DPS and optimal positioning`)
        .setColor(0xFF4500) // Orange for arena
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arena Tips' });

    await sendToArena({ embeds: [embed] });
}

// Webhook sending functions
async function sendToXYIAN(content) {
    if (!webhooks.xyian) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.xyian });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send XYIAN message:', error.message);
    }
}

async function sendToGeneral(content) {
    if (!webhooks.general) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.general });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send general message:', error.message);
    }
}

async function sendToRecruit(content) {
    if (!webhooks.recruit) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.recruit });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send recruitment message:', error.message);
    }
}

async function sendToExpedition(content) {
    if (!webhooks.expedition) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.expedition });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send expedition message:', error.message);
    }
}

async function sendToArena(content) {
    if (!webhooks.arena) return;
    
    try {
        const webhook = new WebhookClient({ url: webhooks.arena });
        await webhook.send(content);
    } catch (error) {
        console.error('❌ Failed to send arena message:', error.message);
    }
}

// Q&A function
function getAnswer(question) {
    const lowerQuestion = question.toLowerCase();
    
    for (const [key, answer] of Object.entries(archeroQA)) {
        if (lowerQuestion.includes(key)) {
            return answer;
        }
    }
    
    return null;
}

// Check if user has XYIAN OFFICIAL role
function hasXYIANRole(member) {
    return member.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
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
                await message.reply('🏰 XYIAN Ultimate Bot - Online!');
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
                
            case 'reset':
                await sendDailyResetMessages();
                await message.reply('🔄 Reset messages sent!');
                break;
                
            case 'expedition':
                await sendExpeditionMessage();
                await message.reply('🏰 Guild expedition message sent!');
                break;
                
            case 'arena':
                await sendArenaTip();
                await message.reply('🏟️ Arena tips sent!');
                break;
                
            // XYIAN Guild Commands (require XYIAN OFFICIAL role)
            case 'xyian':
                if (!hasXYIANRole(message.member)) {
                    await message.reply('❌ This command requires the XYIAN OFFICIAL role.');
                    return;
                }
                
                const subCommand = args[0]?.toLowerCase();
                switch (subCommand) {
                    case 'info':
                        const infoEmbed = new EmbedBuilder()
                            .setTitle('🏰 XYIAN OFFICIAL Guild Info')
                            .setDescription('**Elite Archero 2 Guild - Arch 2 Addicts**\n\n📊 **Guild Statistics:**\n• Members: Active and growing\n• Power Level: 300k+ average\n• Daily Activity: 100%\n• Guild Level: Elite\n\n🎯 **Focus:**\n• Daily boss battles\n• Guild donations\n• Community support\n• Strategy sharing')
                            .setColor(0xFFD700)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [infoEmbed] });
                        break;
                        
                    case 'members':
                        const membersEmbed = new EmbedBuilder()
                            .setTitle('👥 XYIAN Guild Members')
                            .setDescription(`**Active Members: ${message.guild.memberCount}**\n\n📈 **Activity Status:**\n• Online: ${message.guild.members.cache.filter(m => m.presence?.status === 'online').size}\n• Active Today: High\n• New Members: Welcome!\n\n💪 **We're always looking for dedicated players!**`)
                            .setColor(0x00BFFF)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [membersEmbed] });
                        break;
                        
                    case 'stats':
                        const statsEmbed = new EmbedBuilder()
                            .setTitle('📊 XYIAN Guild Statistics')
                            .setDescription('**Guild Performance Metrics**\n\n⚔️ **Combat Stats:**\n• Boss Battles Completed: 100%\n• Guild Donations: 100%\n• Event Participation: 100%\n\n🏆 **Achievements:**\n• Top 10 Guild Ranking\n• 100% Daily Completion Rate\n• Elite Community Status\n\n🎯 **Goals:**\n• Maintain Elite Status\n• Grow Active Community\n• Share Knowledge')
                            .setColor(0x32CD32)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [statsEmbed] });
                        break;
                        
                    case 'events':
                        const eventsEmbed = new EmbedBuilder()
                            .setTitle('📅 XYIAN Guild Events')
                            .setDescription('**Upcoming Guild Activities**\n\n🎮 **Daily Events:**\n• Boss Battle Challenges\n• Guild Donation Drives\n• Strategy Discussions\n\n🏆 **Weekly Events:**\n• Guild vs Guild Battles\n• Build Competitions\n• Community Challenges\n\n📢 **Special Events:**\n• Umbral Tempest Strategies\n• New Player Welcome\n• Veteran Mentorship')
                            .setColor(0xFF69B4)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [eventsEmbed] });
                        break;
                        
                    case 'weapon':
                        const weaponName = args.slice(1).join(' ').toLowerCase();
                        if (!weaponName) {
                            await message.reply('❌ Please specify a weapon name. Example: `!xyian weapon staff of light`');
                            return;
                        }
                        
                        let weaponInfo = '';
                        if (weaponName.includes('staff') || weaponName.includes('light')) {
                            weaponInfo = '**Staff of Light** - Best for Mage class. High magical damage, great range, and excellent area damage. Special ability can clear waves of enemies effectively.';
                        } else if (weaponName.includes('demon') || weaponName.includes('blade')) {
                            weaponInfo = '**Demon Blade** - Best for Warrior class. Exceptional melee damage with high critical hit potential. Special ability devastates groups of enemies.';
                        } else if (weaponName.includes('windforce') || weaponName.includes('bow')) {
                            weaponInfo = '**Windforce Bow** - Best for Archer class. Excellent range with piercing damage. Special abilities hit multiple enemies and provide great area control.';
                        } else {
                            weaponInfo = `**${weaponName}** - Weapon information not found. Try: Staff of Light, Demon Blade, or Windforce Bow.`;
                        }
                        
                        const weaponEmbed = new EmbedBuilder()
                            .setTitle(`⚔️ Weapon: ${weaponName}`)
                            .setDescription(weaponInfo)
                            .setColor(0xFF4500)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [weaponEmbed] });
                        break;
                        
                    case 'skill':
                        const skillName = args.slice(1).join(' ').toLowerCase();
                        if (!skillName) {
                            await message.reply('❌ Please specify a skill name. Example: `!xyian skill multi-shot`');
                            return;
                        }
                        
                        let skillInfo = '';
                        if (skillName.includes('multi') || skillName.includes('shot')) {
                            skillInfo = '**Multi-shot** - Increases the number of projectiles fired. Essential for DPS builds and clearing multiple enemies.';
                        } else if (skillName.includes('ricochet')) {
                            skillInfo = '**Ricochet** - Projectiles bounce between enemies. Excellent for crowd control and maximizing damage output.';
                        } else if (skillName.includes('piercing')) {
                            skillInfo = '**Piercing** - Projectiles pass through enemies. Great for line formations and area damage.';
                        } else {
                            skillInfo = `**${skillName}** - Skill information not found. Try: Multi-shot, Ricochet, or Piercing.`;
                        }
                        
                        const skillEmbed = new EmbedBuilder()
                            .setTitle(`✨ Skill: ${skillName}`)
                            .setDescription(skillInfo)
                            .setColor(0x9370DB)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [skillEmbed] });
                        break;
                        
                    case 'build':
                        const className = args.slice(1).join(' ').toLowerCase();
                        if (!className) {
                            await message.reply('❌ Please specify a class. Example: `!xyian build mage`');
                            return;
                        }
                        
                        let buildInfo = '';
                        if (className.includes('mage')) {
                            buildInfo = '**Mage Build:**\n• Weapon: Staff of Light\n• Skills: Multi-shot, Ricochet, Piercing\n• Focus: Magical damage and area control\n• Strategy: Keep distance, use environment';
                        } else if (className.includes('warrior')) {
                            buildInfo = '**Warrior Build:**\n• Weapon: Demon Blade\n• Skills: Multi-shot, Side Arrow, Bouncy Wall\n• Focus: High DPS and critical hits\n• Strategy: Aggressive play, target elites first';
                        } else if (className.includes('archer')) {
                            buildInfo = '**Archer Build:**\n• Weapon: Windforce Bow\n• Skills: Multi-shot, Ricochet, Piercing\n• Focus: Range and mobility\n• Strategy: Kite enemies, use walls for cover';
                        } else {
                            buildInfo = `**${className}** - Class information not found. Try: Mage, Warrior, or Archer.`;
                        }
                        
                        const buildEmbed = new EmbedBuilder()
                            .setTitle(`🎯 Build: ${className}`)
                            .setDescription(buildInfo)
                            .setColor(0x20B2AA)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [buildEmbed] });
                        break;
                        
                    case 'help':
                        const helpEmbed = new EmbedBuilder()
                            .setTitle('🏰 XYIAN Guild Commands')
                            .setDescription('**Available XYIAN Commands:**\n\n`!xyian info` - Guild information\n`!xyian members` - Member statistics\n`!xyian stats` - Guild performance\n`!xyian events` - Upcoming events\n`!xyian weapon [name]` - Weapon info\n`!xyian skill [name]` - Skill info\n`!xyian build [class]` - Build recommendations\n`!xyian help` - This help message')
                            .setColor(0xFFD700)
                            .setTimestamp()
                            .setFooter({ text: 'XYIAN OFFICIAL' });
                        await message.reply({ embeds: [helpEmbed] });
                        break;
                        
                    default:
                        await message.reply('❌ Unknown XYIAN command. Use `!xyian help` for available commands.');
                }
                break;
                
            case 'help':
                const generalHelpEmbed = new EmbedBuilder()
                    .setTitle('🤖 XYIAN Ultimate Bot Commands')
                    .setDescription('**General Commands:**\n`!ping` - Check bot status\n`!tip` - Send daily tip\n`!recruit` - Send recruitment\n`!expedition` - Send expedition message\n`!arena` - Send arena tips\n`!test` - Send test messages\n`!reset` - Send reset messages\n`!help` - This help\n\n**XYIAN Commands (XYIAN OFFICIAL role required):**\n`!xyian help` - XYIAN command list\n\n**Q&A System:**\nAsk any Archero 2 question naturally!\n\n**Arena Questions:**\n`arena`, `supreme arena`, `best arena heroes`, `arena runes`, `arena rewards`')
                    .setColor(0x00BFFF)
                    .setTimestamp()
                    .setFooter({ text: 'XYIAN OFFICIAL' });
                await message.reply({ embeds: [generalHelpEmbed] });
                break;
                
            default:
                // Try Q&A system
                const answer = getAnswer(message.content);
                if (answer) {
                    const qaEmbed = new EmbedBuilder()
                        .setTitle('❓ Archero 2 Q&A')
                        .setDescription(answer)
                        .setColor(0x32CD32)
                        .setTimestamp()
                        .setFooter({ text: 'XYIAN OFFICIAL' });
                    await message.reply({ embeds: [qaEmbed] });
                } else {
                    await message.reply('❓ I didn\'t understand that. Try asking an Archero 2 question or use `!help` for commands.');
                }
        }
    } else {
        // Q&A system for natural language questions
        const answer = getAnswer(message.content);
        if (answer) {
            const qaEmbed = new EmbedBuilder()
                .setTitle('❓ Archero 2 Q&A')
                .setDescription(answer)
                .setColor(0x32CD32)
                .setTimestamp()
                .setFooter({ text: 'XYIAN OFFICIAL' });
            await message.reply({ embeds: [qaEmbed] });
        }
    }
});

// Welcome new members
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 New member joined: ${member.user.username}`);
    
    // Send welcome message to GENERAL CHAT (not guild chat)
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎉 Welcome to Arch 2 Addicts!')
        .setDescription(`Welcome ${member} to the Arch 2 Addicts community - your premier destination for Archero 2 discussion and strategy!`)
        .setColor(0x00ff88)
        .addFields(
            { name: 'Community Features', value: '• Daily tips and strategies\n• Guild recruitment opportunities\n• Expert Q&A system\n• Event discussions and guides', inline: false },
            { name: 'Getting Started', value: 'Use `!help` to view all available commands\nAsk any Archero 2 question for instant answers', inline: false },
            { name: 'Join Our Guild', value: 'Looking for a guild? Check out XYIAN OFFICIAL!\nGuild ID: 213797', inline: false }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts Community' });
    
    await sendToGeneral({ embeds: [welcomeEmbed] });
    
    // Assign XYIAN OFFICIAL role if it exists (for guild members)
    const xyianRole = member.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
    if (xyianRole) {
        await member.roles.add(xyianRole);
        console.log(`Assigned XYIAN OFFICIAL role to ${member.user.username}`);
    } else {
        console.warn('XYIAN OFFICIAL role not found.');
    }
});

// Handle member leaving
client.on('guildMemberRemove', async (member) => {
    console.log(`👋 Member left: ${member.user.username}`);
    
    // Remove from activity tracking
    memberActivity.delete(member.id);
    
    // Send farewell message to GENERAL CHAT (not guild chat)
    const farewellEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left Arch 2 Addicts')
        .setDescription(`${member.user.username} has left the community.`)
        .setColor(0xff6b6b)
        .setTimestamp()
        .setFooter({ text: 'Arch 2 Addicts Community' });
    
    await sendToGeneral({ embeds: [farewellEmbed] });
});

// Error handling
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
