const { WebhookClient, EmbedBuilder } = require('discord.js');
require('dotenv').config();

async function testExpeditionWebhook() {
    console.log('🏰 Testing Guild Expedition webhook...');
    
    const expeditionWebhook = process.env.GUILD_EXPEDITION_WEBHOOK;
    console.log('Expedition webhook URL:', expeditionWebhook ? 'Found' : 'Missing');
    
    if (!expeditionWebhook) {
        console.error('❌ GUILD_EXPEDITION_WEBHOOK not found in .env');
        return;
    }
    
    try {
        const webhook = new WebhookClient({ url: expeditionWebhook });
        
        const embed = new EmbedBuilder()
            .setTitle('🏰 XYIAN Guild Expedition')
            .setDescription('**Ready for another day of conquest and glory!**\n\n⚔️ **Expedition Focus:**\n• Complete daily expedition challenges\n• Maximize guild contribution points\n• Unlock rare rewards and materials\n• Support your fellow guild members\n\n🎯 **Today\'s Strategy:**\n• Focus on high-value targets\n• Coordinate with guild members\n• Use optimal builds for each stage\n• Share discoveries and tips\n\n💪 **Let\'s show everyone why XYIAN is the best!**')
            .setColor(0x8A2BE2) // Purple for expedition
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Guild Expedition' });
        
        console.log('📤 Sending test expedition message...');
        await webhook.send({ embeds: [embed] });
        console.log('✅ Test expedition message sent successfully!');
        
    } catch (error) {
        console.error('❌ Error sending test expedition message:', error.message);
        console.error('Full error:', error);
    }
}

testExpeditionWebhook();
