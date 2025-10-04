const { WebhookClient, EmbedBuilder } = require('discord.js');
require('dotenv').config();

console.log('Environment check:');
console.log('XYIAN_GUILD_WEBHOOK:', process.env.XYIAN_GUILD_WEBHOOK ? 'Found' : 'Missing');

// Test webhook connection
const webhookUrl = process.env.XYIAN_GUILD_WEBHOOK || 'https://discord.com/api/webhooks/1424140252716597429/qGg_RJXwAFO8FcMPGbHiILrTo7LI_Vox1B4x-TW2GDbEV3B-HUWThTszOZoqZqTVpij_';

const xyianGuildWebhook = new WebhookClient({
    url: webhookUrl
});

async function testWebhook() {
    console.log('Testing XYIAN Guild webhook...');
    
    try {
        // Send test message
        await xyianGuildWebhook.send('🤖 **Bot Test** - Webhook connection successful!');
        
        // Send test embed
        const embed = new EmbedBuilder()
            .setTitle('🏰 XYIAN Guild: Bot Test')
            .setDescription('Testing webhook integration for Arch 2 Addicts community!')
            .setColor(0x00ff00)
            .addFields(
                { name: 'Status', value: '✅ Connected', inline: true },
                { name: 'Version', value: '0.0.1', inline: true },
                { name: 'Features', value: 'XYIAN commands ready!', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
        
        await xyianGuildWebhook.send({ embeds: [embed] });
        
        console.log('✅ Webhook test successful! Check your Discord channel.');
        
    } catch (error) {
        console.error('❌ Webhook test failed:', error.message);
    }
}

testWebhook();
