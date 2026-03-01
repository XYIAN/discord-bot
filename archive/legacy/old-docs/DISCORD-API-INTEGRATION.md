# Discord API Integration Guide

This document outlines how to extract comprehensive information from Discord channels, guilds, and webhooks using the Discord API.

## 🔍 Channel Information Extraction

### Prerequisites
- Discord Bot Token (stored in `.env` file as `DISCORD_TOKEN`)
- Bot must have appropriate permissions in the target guild
- Channel ID and Guild ID

### Basic Channel Information

#### 1. Get Channel Details
```bash
curl -X GET "https://discord.com/api/v10/channels/{CHANNEL_ID}" \
  -H "Authorization: Bot $DISCORD_TOKEN" \
  -H "Content-Type: application/json"
```

**Example Response for Forum Channel:**
```json
{
  "id": "1421930658737164531",
  "type": 15,
  "last_message_id": "1425325135665299508",
  "flags": 0,
  "guild_id": "1419944148701679686",
  "name": "gear-rune-loadouts",
  "parent_id": "1421933219200372736",
  "rate_limit_per_user": 0,
  "topic": null,
  "position": 3,
  "permission_overwrites": [],
  "nsfw": false,
  "available_tags": [
    {
      "id": "1424149161753972747",
      "name": "Gear",
      "moderated": false,
      "emoji_id": null,
      "emoji_name": null
    }
  ],
  "default_reaction_emoji": null,
  "default_sort_order": null,
  "default_forum_layout": 0,
  "default_tag_setting": "match_some",
  "icon_emoji": null,
  "theme_color": null,
  "template": ""
}
```

#### 2. Get Guild Information
```bash
curl -X GET "https://discord.com/api/v10/guilds/{GUILD_ID}" \
  -H "Authorization: Bot $DISCORD_TOKEN" \
  -H "Content-Type: application/json"
```

### Channel Type Reference

| Type | Name | Description |
|------|------|-------------|
| 0 | Text Channel | Standard text channel |
| 1 | DM | Direct message |
| 2 | Voice Channel | Voice channel |
| 3 | Group DM | Group direct message |
| 4 | Category | Channel category |
| 5 | News Channel | Announcement channel |
| 10 | News Thread | Thread in news channel |
| 11 | Public Thread | Public thread |
| 12 | Private Thread | Private thread |
| 13 | Stage Channel | Stage channel |
| 14 | Directory | Directory listing |
| 15 | Forum Channel | Forum channel |
| 16 | Media Channel | Media channel |

### Forum Channel Specific Data

#### Available Tags Structure
```json
{
  "available_tags": [
    {
      "id": "string",
      "name": "string",
      "moderated": boolean,
      "emoji_id": "string|null",
      "emoji_name": "string|null"
    }
  ]
}
```

#### Forum Settings
- `default_tag_setting`: `"match_some"` or `"match_all"`
- `default_forum_layout`: `0` (List) or `1` (Gallery)
- `default_sort_order`: Sort order for threads

## 🔗 Webhook Integration

### Webhook Information Extraction

#### 1. Get Webhook Details
```bash
curl -X GET "https://discord.com/api/webhooks/{WEBHOOK_ID}/{WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json"
```

**Example Response:**
```json
{
  "application_id": null,
  "avatar": "395e8449992385ed37f82477a9c23cc5",
  "channel_id": "1421930658737164531",
  "guild_id": "1419944148701679686",
  "id": "1424328645245407283",
  "name": "XY Elder",
  "type": 1,
  "token": "X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m",
  "url": "https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m"
}
```

#### 2. Post to Forum Channel via Webhook
```bash
curl -X POST "https://discord.com/api/webhooks/{WEBHOOK_ID}/{WEBHOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Message content",
    "thread_name": "Thread Title",
    "applied_tags": ["TAG_ID_1", "TAG_ID_2"]
  }'
```

**Important:** Forum channels require either `thread_name` or `thread_id` in the payload.

## 🛠️ Implementation in Bot Code

### Channel Information Service

```javascript
class DiscordChannelService {
  constructor(botToken) {
    this.token = botToken;
    this.baseURL = 'https://discord.com/api/v10';
  }

  async getChannelInfo(channelId) {
    const response = await fetch(`${this.baseURL}/channels/${channelId}`, {
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  }

  async getGuildInfo(guildId) {
    const response = await fetch(`${this.baseURL}/guilds/${guildId}`, {
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  }

  async getChannelTags(channelId) {
    const channelInfo = await this.getChannelInfo(channelId);
    return channelInfo.available_tags || [];
  }

  isForumChannel(channelInfo) {
    return channelInfo.type === 15;
  }
}
```

### Webhook Service

```javascript
class DiscordWebhookService {
  constructor(webhookURL) {
    this.webhookURL = webhookURL;
  }

  async getWebhookInfo() {
    const response = await fetch(this.webhookURL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }

  async sendForumMessage(content, threadName, tags = []) {
    const payload = {
      content,
      thread_name: threadName,
      applied_tags: tags
    };

    const response = await fetch(this.webhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.status === 204; // Success
  }
}
```

## 📊 Data Integration Examples

### 1. Dynamic Channel Detection
```javascript
// Detect if channel is forum and get tags
const channelInfo = await channelService.getChannelInfo(channelId);
if (channelService.isForumChannel(channelInfo)) {
  const tags = await channelService.getChannelTags(channelId);
  console.log(`Forum channel with ${tags.length} available tags:`, 
    tags.map(tag => tag.name));
}
```

### 2. Smart Message Routing
```javascript
// Route messages based on channel type and tags
async function routeMessage(channelId, messageType) {
  const channelInfo = await channelService.getChannelInfo(channelId);
  
  if (channelInfo.type === 15) { // Forum channel
    const tags = channelInfo.available_tags;
    const relevantTags = tags.filter(tag => 
      messageType.toLowerCase().includes(tag.name.toLowerCase())
    );
    
    return {
      channelType: 'forum',
      suggestedTags: relevantTags.map(tag => tag.id),
      requiresThread: true
    };
  }
  
  return { channelType: 'standard', requiresThread: false };
}
```

### 3. Guild Role Integration
```javascript
// Get guild roles and integrate with bot features
async function getGuildRoles(guildId) {
  const guildInfo = await channelService.getGuildInfo(guildId);
  return guildInfo.roles.map(role => ({
    id: role.id,
    name: role.name,
    color: role.color,
    position: role.position,
    permissions: role.permissions
  }));
}
```

## 🔧 Error Handling

### Common API Errors
- `401 Unauthorized`: Invalid or missing bot token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Channel or guild doesn't exist
- `429 Rate Limited`: Too many requests

### Rate Limiting
Discord API has rate limits. Check response headers:
- `x-ratelimit-limit`: Maximum requests per window
- `x-ratelimit-remaining`: Remaining requests
- `x-ratelimit-reset`: When the limit resets

## 🚀 Advanced Features

### 1. Channel Monitoring
```javascript
// Monitor channel changes
async function monitorChannel(channelId) {
  const initialInfo = await channelService.getChannelInfo(channelId);
  
  setInterval(async () => {
    const currentInfo = await channelService.getChannelInfo(channelId);
    if (currentInfo.last_message_id !== initialInfo.last_message_id) {
      console.log('New message detected!');
      // Handle new message
    }
  }, 5000); // Check every 5 seconds
}
```

### 2. Tag-Based Content Filtering
```javascript
// Filter content based on channel tags
function filterContentByTags(content, availableTags) {
  const contentTags = availableTags.filter(tag => 
    content.toLowerCase().includes(tag.name.toLowerCase())
  );
  
  return {
    content,
    suggestedTags: contentTags,
    isRelevant: contentTags.length > 0
  };
}
```

## 📝 Best Practices

1. **Cache API Responses**: Store channel/guild info to avoid repeated API calls
2. **Handle Rate Limits**: Implement exponential backoff for rate-limited requests
3. **Validate Permissions**: Check bot permissions before attempting operations
4. **Use Webhooks Wisely**: Webhooks are great for posting but limited for reading
5. **Monitor Changes**: Track channel updates for dynamic features

## 🔗 Related Documentation

- [Discord API Documentation](https://discord.com/developers/docs)
- [Webhook Guide](https://discord.com/developers/docs/resources/webhook)
- [Channel Types](https://discord.com/developers/docs/resources/channel#channel-object-channel-types)
- [Forum Channels](https://discord.com/developers/docs/resources/channel#forum-channel-object)
