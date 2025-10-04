# Discord Channel Following Feature

## Overview

Channel Following is a Discord feature that allows channels to follow other channels and receive updates. This is particularly useful for community management, especially for cross-server announcements and content sharing.

## How Channel Following Works

### Basic Concept
- One channel can "follow" another channel
- When the followed channel posts messages, they appear in the following channel
- The following channel shows a "Following" indicator
- Messages appear as if they're from the original channel

### Use Cases for Arch 2 Addicts

1. **Cross-Server Announcements**
   - Follow official Arch 2 game channels
   - Share updates across multiple community servers
   - Keep members informed of game updates

2. **Guild Coordination**
   - Follow guild-specific channels from other servers
   - Share strategies and information
   - Coordinate with other guilds

3. **Content Sharing**
   - Follow content creator channels
   - Share community highlights
   - Cross-promote related communities

## Setting Up Channel Following

### Prerequisites
- Both channels must be in different servers
- You need "Manage Webhooks" permission in the following channel
- The followed channel must allow following

### Steps to Follow a Channel

1. **In the Following Channel:**
   - Right-click on the channel name
   - Select "Edit Channel"
   - Go to "Integrations" tab
   - Click "Follow Channel"

2. **Enter Channel Information:**
   - Server ID of the followed channel
   - Channel ID of the followed channel
   - Choose what to follow (all messages or specific types)

3. **Configure Settings:**
   - Set notification preferences
   - Choose display options
   - Configure permissions

## Implementation in Bot Code

### Channel Following Management
```javascript
// Follow a channel programmatically
async function followChannel(followingChannel, followedChannelId, followedGuildId) {
    try {
        const webhook = await followingChannel.createWebhook({
            name: 'Channel Follower',
            reason: 'Following external channel'
        });
        
        // Store webhook info for management
        const followData = {
            webhookId: webhook.id,
            webhookToken: webhook.token,
            followedChannelId,
            followedGuildId,
            followingChannelId: followingChannel.id
        };
        
        // Save to database
        await saveFollowData(followData);
        
        return webhook;
    } catch (error) {
        console.error('Error following channel:', error);
        throw error;
    }
}
```

### Managing Followed Channels
```javascript
// List followed channels
async function getFollowedChannels(guildId) {
    const followedChannels = await db.prepare(
        'SELECT * FROM followed_channels WHERE guild_id = ?'
    ).all(guildId);
    
    return followedChannels;
}

// Unfollow a channel
async function unfollowChannel(webhookId) {
    try {
        const webhook = await client.fetchWebhook(webhookId);
        await webhook.delete('Unfollowing channel');
        
        // Remove from database
        await db.prepare(
            'DELETE FROM followed_channels WHERE webhook_id = ?'
        ).run(webhookId);
        
        return true;
    } catch (error) {
        console.error('Error unfollowing channel:', error);
        return false;
    }
}
```

### Database Schema for Following
```sql
CREATE TABLE followed_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    webhook_id TEXT NOT NULL,
    webhook_token TEXT NOT NULL,
    followed_guild_id TEXT NOT NULL,
    followed_channel_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## Arch 2 Addicts Implementation

### Following Game Channels
```javascript
// Follow official Arch 2 channels
const gameChannels = [
    {
        name: 'Arch 2 Announcements',
        guildId: 'OFFICIAL_GUILD_ID',
        channelId: 'ANNOUNCEMENTS_CHANNEL_ID'
    },
    {
        name: 'Arch 2 Updates',
        guildId: 'OFFICIAL_GUILD_ID',
        channelId: 'UPDATES_CHANNEL_ID'
    }
];

// Set up following for game channels
async function setupGameChannelFollowing() {
    const announcementsChannel = client.channels.cache.find(
        channel => channel.name === 'announcements'
    );
    
    for (const gameChannel of gameChannels) {
        try {
            await followChannel(
                announcementsChannel,
                gameChannel.channelId,
                gameChannel.guildId
            );
            console.log(`Following ${gameChannel.name}`);
        } catch (error) {
            console.error(`Failed to follow ${gameChannel.name}:`, error);
        }
    }
}
```

### Guild Channel Following
```javascript
// Follow other guild channels
async function setupGuildChannelFollowing() {
    const guildChannel = client.channels.cache.find(
        channel => channel.name === 'guild-announcements'
    );
    
    // Follow other XYIAN guild channels
    const otherGuildChannels = [
        {
            name: 'XYIAN Guild Updates',
            guildId: 'OTHER_GUILD_ID',
            channelId: 'GUILD_CHANNEL_ID'
        }
    ];
    
    for (const guildChannel of otherGuildChannels) {
        try {
            await followChannel(
                guildChannel,
                guildChannel.channelId,
                guildChannel.guildId
            );
        } catch (error) {
            console.error('Failed to follow guild channel:', error);
        }
    }
}
```

## Monitoring and Management

### Follow Status Monitoring
```javascript
// Check if followed channels are still active
async function checkFollowStatus() {
    const followedChannels = await getFollowedChannels(process.env.GUILD_ID);
    
    for (const follow of followedChannels) {
        try {
            const webhook = await client.fetchWebhook(follow.webhook_id);
            // Webhook is still active
        } catch (error) {
            if (error.code === 10015) { // Unknown Webhook
                console.log(`Webhook ${follow.webhook_id} is no longer valid`);
                await unfollowChannel(follow.webhook_id);
            }
        }
    }
}

// Run status check every hour
setInterval(checkFollowStatus, 3600000);
```

### Follow Analytics
```javascript
// Track follow engagement
async function trackFollowEngagement(message) {
    if (message.webhookId) {
        const followData = await db.prepare(
            'SELECT * FROM followed_channels WHERE webhook_id = ?'
        ).get(message.webhookId);
        
        if (followData) {
            // Log engagement
            await db.prepare(`
                INSERT INTO follow_engagement 
                (follow_id, message_id, engagement_type, timestamp)
                VALUES (?, ?, ?, ?)
            `).run(
                followData.id,
                message.id,
                'message_received',
                new Date().toISOString()
            );
        }
    }
}
```

## Best Practices

### Channel Following Guidelines
1. **Permission Management**
   - Only follow channels you have permission to follow
   - Respect the followed channel's content policies
   - Ensure your community guidelines align

2. **Content Moderation**
   - Monitor followed content for appropriateness
   - Set up filters for sensitive content
   - Have a process for unfollowing if needed

3. **Community Management**
   - Inform members about followed channels
   - Provide context for external content
   - Encourage engagement with original sources

### Security Considerations
1. **Webhook Security**
   - Keep webhook tokens secure
   - Regularly rotate webhook tokens
   - Monitor for unauthorized access

2. **Content Filtering**
   - Implement content filters
   - Monitor for spam or inappropriate content
   - Have quick unfollow procedures

## Troubleshooting

### Common Issues
1. **Webhook Not Working**
   - Check if webhook still exists
   - Verify permissions
   - Check for rate limiting

2. **Missing Messages**
   - Ensure webhook is properly configured
   - Check if followed channel allows following
   - Verify channel permissions

3. **Permission Errors**
   - Ensure bot has "Manage Webhooks" permission
   - Check if followed channel allows following
   - Verify server permissions

## Resources

- [Discord Channel Following FAQ](https://support.discord.com/hc/en-us/articles/360028384531-Channel-Following-FAQ)
- [Discord Webhooks Documentation](https://discord.com/developers/docs/resources/webhook)
- [Discord Permissions Guide](https://support.discord.com/hc/en-us/articles/206029707)

## Integration with Arch 2 Project

Channel Following can enhance the Arch 2 Addicts community by:
- Keeping members updated with official game news
- Sharing content from other Arch 2 communities
- Coordinating with other guilds
- Providing a centralized hub for Arch 2 information

This feature works well with the existing webhook system and can be integrated into the bot's community management features.
