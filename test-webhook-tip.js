const { WebhookClient, EmbedBuilder } = require('discord.js');
require('dotenv').config();

async function testWebhookTip() {
    console.log('🧪 Testing webhook tip sending...');
    
    const generalWebhook = process.env.GENERAL_CHAT_WEBHOOK;
    console.log('General webhook URL:', generalWebhook ? 'Found' : 'Missing');
    
    if (!generalWebhook) {
        console.error('❌ GENERAL_CHAT_WEBHOOK not found in .env');
        return;
    }
    
    try {
        const webhook = new WebhookClient({ url: generalWebhook });
        
        const embed = new EmbedBuilder()
            .setTitle('💡 Daily Archero 2 Tip')
            .setDescription('**Pro Tip**: Always complete your daily quests before reset - they give massive XP and gold rewards!')
            .setColor(0x00BFFF) // Light blue
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Daily Tips' });
        
        console.log('📤 Sending test tip to general chat...');
        await webhook.send({ embeds: [embed] });
        console.log('✅ Test tip sent successfully!');
        
    } catch (error) {
        console.error('❌ Error sending test tip:', error.message);
        console.error('Full error:', error);
    }
}

testWebhookTip();
