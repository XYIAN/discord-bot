const { WebhookClient, EmbedBuilder } = require('discord.js');
require('dotenv').config();

// XYIAN Guild webhook
const xyianGuildWebhook = new WebhookClient({
    url: process.env.XYIAN_GUILD_WEBHOOK
});

// General chat webhook (if available)
const generalWebhook = process.env.GENERAL_CHAT_WEBHOOK ? 
    new WebhookClient({ url: process.env.GENERAL_CHAT_WEBHOOK }) : null;

console.log('🤖 XYIAN Guild Bot - Webhook Mode');
console.log('=====================================');

// Send startup message
async function sendStartupMessage() {
    try {
        const embed = new EmbedBuilder()
            .setTitle('🏰 XYIAN Guild Bot Online!')
            .setDescription('Arch 2 Addicts community bot is now active!')
            .setColor(0x00ff00)
            .addFields(
                { name: 'Version', value: '0.0.1', inline: true },
                { name: 'Mode', value: 'Webhook', inline: true },
                { name: 'Status', value: '✅ Ready', inline: true },
                { name: 'Available Commands', value: 'Use webhook to send commands', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

        await xyianGuildWebhook.send({ embeds: [embed] });
        console.log('✅ Startup message sent to XYIAN guild!');
        
    } catch (error) {
        console.error('❌ Failed to send startup message:', error.message);
    }
}

// Send test commands info
async function sendCommandsInfo() {
    try {
        const embed = new EmbedBuilder()
            .setTitle('🏰 XYIAN Guild Commands')
            .setDescription('Available commands for XYIAN OFFICIAL members')
            .setColor(0xffd700)
            .addFields(
                { name: 'Weapon Info', value: 'Ask about weapons: Dragon Knight Crossbow, Griffin Claw, Beam Staff', inline: false },
                { name: 'Skill Info', value: 'Ask about skills: Tracking Eye, Revive, Giant\'s Strength', inline: false },
                { name: 'Build Guides', value: 'Ask about builds: PvP, PvE, Farming', inline: false },
                { name: 'Guild Stats', value: 'Ask about guild statistics and performance', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

        await xyianGuildWebhook.send({ embeds: [embed] });
        console.log('✅ Commands info sent!');
        
    } catch (error) {
        console.error('❌ Failed to send commands info:', error.message);
    }
}

// Send Archero 2 game info
async function sendGameInfo() {
    try {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Archero 2 Game Information')
            .setDescription('Essential game data for XYIAN guild members')
            .setColor(0x0099ff)
            .addFields(
                { name: 'Best Weapons (S-Tier)', value: 'Dragon Knight Crossbow\nGriffin Claw', inline: true },
                { name: 'Best Gear Sets', value: 'Griffin Set (PvP)\nOracle Set (PvE)', inline: true },
                { name: 'Legendary Skills', value: 'Tracking Eye\nRevive', inline: true },
                { name: 'Guild Coin Priority', value: '1. Epic Revive Rune\n2. Blessing Runes\n3. 10x Chromatic Keys', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

        await xyianGuildWebhook.send({ embeds: [embed] });
        console.log('✅ Game info sent!');
        
    } catch (error) {
        console.error('❌ Failed to send game info:', error.message);
    }
}

// Main function
async function main() {
    console.log('Starting XYIAN Guild Bot...');
    
    // Send startup sequence
    await sendStartupMessage();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    await sendCommandsInfo();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    await sendGameInfo();
    
    console.log('✅ All messages sent successfully!');
    console.log('Check your XYIAN guild Discord channel for the messages.');
    console.log('Bot is running in webhook mode - ready for testing!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down XYIAN Guild Bot...');
    process.exit(0);
});

// Start the bot
main().catch(console.error);
