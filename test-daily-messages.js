const { EmbedBuilder } = require('discord.js');

console.log('🎨 Testing Daily Message Formats...\n');

// Test daily tip
const tipEmbed = new EmbedBuilder()
    .setTitle('💡 Daily Archero 2 Tip')
    .setDescription('**Best F2P Gem Usage**: Focus on Mythstone Chests for S-Tier equipment. Don\'t spread your gems across multiple sets - pick one and max it out!')
    .setColor(0x00ff88)
    .setTimestamp()
    .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

console.log('📝 Daily Tip Example:');
console.log(JSON.stringify(tipEmbed.toJSON(), null, 2));

// Test guild recruitment
const recruitEmbed = new EmbedBuilder()
    .setTitle('🏰 XYIAN OFFICIAL - Guild Recruitment')
    .setDescription(`**Guild ID: 213797**\n\n**We're looking for dedicated players to join our elite community!**\n\n✨ **What we offer:**\n• Active daily community\n• Expert strategies and guides\n• Guild events and challenges\n• 10% discount on guild shop items\n• Supportive and friendly environment\n\n🎯 **Requirements:**\n• Daily participation in guild activities\n• 2 Boss Battles per day\n• 1 Guild Donation per day\n• Active in Discord community\n\n💪 **Power Level:** 300k+ recommended\n\n**Ready to join the elite? Apply now!**`)
    .setColor(0xffd700)
    .setTimestamp()
    .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

console.log('\n🏰 Guild Recruitment Example:');
console.log(JSON.stringify(recruitEmbed.toJSON(), null, 2));

// Test event reminder
const eventEmbed = new EmbedBuilder()
    .setTitle('📅 Daily Event Reminder')
    .setDescription('**Don\'t forget your daily requirements!**\n• Complete 2 Boss Battles\n• Make 1 Guild Donation\n• Participate in guild events for better rewards!')
    .setColor(0xff9500)
    .setTimestamp()
    .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

console.log('\n📅 Event Reminder Example:');
console.log(JSON.stringify(eventEmbed.toJSON(), null, 2));

console.log('\n✅ All message formats are ready!');
console.log('\n📅 Daily Schedule:');
console.log('  9 AM - Daily Archero 2 tip');
console.log('  3 PM - Daily event reminder');
console.log('  8 PM - Guild recruitment message');
console.log('\n🎯 Guild ID: 213797 - XYIAN OFFICIAL');
console.log('💪 Power requirement: 300k+ (subtle mention)');
