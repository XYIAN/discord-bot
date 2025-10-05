const { WebhookClient, EmbedBuilder } = require('discord.js');
require('dotenv').config();

async function testArenaWebhook() {
    console.log('🏟️ Testing Arena webhook...');
    
    const arenaWebhook = process.env.GUILD_ARENA_WEBHOOK;
    console.log('Arena webhook URL:', arenaWebhook ? 'Found' : 'Missing');
    
    if (!arenaWebhook) {
        console.error('❌ GUILD_ARENA_WEBHOOK not found in .env');
        return;
    }
    
    try {
        const webhook = new WebhookClient({ url: arenaWebhook });
        
        const embed = new EmbedBuilder()
            .setTitle('🏟️ Daily Arena Tips')
            .setDescription(`**Arena & Supreme Arena Strategies**\n\n🏟️ **Arena Hero Selection**: Dragoon is the top Arena hero! Use Griffin only if you have a complete Griffin build!\n\n👑 **Supreme Arena**: The ultimate PvP challenge requiring perfect hero selection and gear optimization!\n\n💪 **Key Differences:**\n• **Arena**: Focus on speed and efficiency\n• **Supreme Arena**: Ultimate challenge requiring perfect execution\n• **Rewards**: Supreme Arena offers the best rewards\n• **Strategy**: Both require high DPS and optimal positioning`)
            .setColor(0xFF4500) // Orange for arena
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arena Tips' });
        
        console.log('📤 Sending test arena message...');
        await webhook.send({ embeds: [embed] });
        console.log('✅ Test arena message sent successfully!');
        
    } catch (error) {
        console.error('❌ Error sending test arena message:', error.message);
        console.error('Full error:', error);
    }
}

testArenaWebhook();
