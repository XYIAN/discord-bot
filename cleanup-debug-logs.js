const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    
    try {
        // Get the guild
        const guild = client.guilds.cache.get('1419944148701679686');
        if (!guild) {
            console.log('❌ Guild not found');
            process.exit(1);
        }
        
        // Get the debug-logs channel
        const channel = guild.channels.cache.find(ch => ch.name === 'debug-logs');
        if (!channel) {
            console.log('❌ debug-logs channel not found');
            process.exit(1);
        }
        
        console.log(`🔍 Found channel: ${channel.name} (${channel.id})`);
        
        let totalDeleted = 0;
        let batchCount = 0;
        
        console.log('🔄 Starting debug-logs cleanup...');
        
        while (true) {
            const messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size === 0) break;
            
            batchCount++;
            console.log(`📊 Batch ${batchCount}: Found ${messages.size} messages`);
            
            // Delete messages one by one
            for (const [id, message] of messages) {
                try {
                    // Skip pinned messages
                    if (message.pinned) {
                        console.log(`⏭️ Skipping pinned message: ${id}`);
                        continue;
                    }
                    
                    await message.delete();
                    totalDeleted++;
                    console.log(`🗑️ Deleted message ${totalDeleted}: ${id}`);
                    
                    // Rate limit delay
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error(`❌ Error deleting message ${id}:`, error.message);
                }
            }
            
            console.log(`✅ Batch ${batchCount} complete. Total deleted: ${totalDeleted}`);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`🎉 DEBUG-LOGS CLEANUP COMPLETE! Deleted ${totalDeleted} messages from #debug-logs`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(process.env.DISCORD_TOKEN);
