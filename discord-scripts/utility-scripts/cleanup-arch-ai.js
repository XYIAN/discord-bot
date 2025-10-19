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
            console.log('❌ Guild not found. Available guilds:');
            client.guilds.cache.forEach(g => console.log(`- ${g.name} (${g.id})`));
            process.exit(1);
        }
        
        // Get the arch-ai channel
        const channel = guild.channels.cache.find(ch => ch.name === 'arch-ai');
        if (!channel) {
            console.log('❌ arch-ai channel not found');
            process.exit(1);
        }
        
        console.log(`🔍 Found channel: ${channel.name} (${channel.id})`);
        
        // Fetch all messages
        let messageCount = 0;
        let deletedCount = 0;
        
        console.log('🔄 Fetching messages...');
        
        while (true) {
            const messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size === 0) break;
            
            messageCount += messages.size;
            console.log(`📊 Found ${messages.size} messages (total: ${messageCount})`);
            
            // Delete messages in batches
            const messageArray = Array.from(messages.values());
            const deletableMessages = messageArray.filter(msg => 
                !msg.pinned && 
                (Date.now() - msg.createdTimestamp) > 1209600000 // Older than 14 days
            );
            
            if (deletableMessages.length === 0) {
                console.log('⚠️ No messages older than 14 days to delete');
                break;
            }
            
            // Delete in batches of 10 (Discord rate limit)
            for (let i = 0; i < deletableMessages.length; i += 10) {
                const batch = deletableMessages.slice(i, i + 10);
                
                try {
                    if (batch.length === 1) {
                        await batch[0].delete();
                        deletedCount++;
                    } else {
                        await channel.bulkDelete(batch, true);
                        deletedCount += batch.length;
                    }
                    
                    console.log(`🗑️ Deleted ${batch.length} messages (total deleted: ${deletedCount})`);
                    
                    // Rate limit delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`❌ Error deleting batch:`, error.message);
                }
            }
        }
        
        console.log(`✅ Cleanup complete! Deleted ${deletedCount} messages from #arch-ai`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(process.env.DISCORD_TOKEN);
