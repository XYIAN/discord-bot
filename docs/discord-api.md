# Discord API Reference

## Overview

The Discord API allows you to interact with Discord's features programmatically. It consists of two main components:

1. **REST API** - For sending requests to Discord
2. **Gateway API** - For real-time event handling

## Authentication

### Bot Tokens
```javascript
// Include bot token in requests
const headers = {
    'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
    'Content-Type': 'application/json'
};
```

### Application Commands
```javascript
// For slash commands
const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
};
```

## REST API Endpoints

### Guilds (Servers)
- `GET /guilds/{guild.id}` - Get guild information
- `PATCH /guilds/{guild.id}` - Modify guild
- `DELETE /guilds/{guild.id}` - Delete guild

### Channels
- `GET /guilds/{guild.id}/channels` - Get guild channels
- `POST /guilds/{guild.id}/channels` - Create channel
- `PATCH /channels/{channel.id}` - Modify channel
- `DELETE /channels/{channel.id}` - Delete channel

### Messages
- `GET /channels/{channel.id}/messages` - Get messages
- `POST /channels/{channel.id}/messages` - Send message
- `PATCH /channels/{channel.id}/messages/{message.id}` - Edit message
- `DELETE /channels/{channel.id}/messages/{message.id}` - Delete message

### Roles
- `GET /guilds/{guild.id}/roles` - Get guild roles
- `POST /guilds/{guild.id}/roles` - Create role
- `PATCH /guilds/{guild.id}/roles/{role.id}` - Modify role
- `DELETE /guilds/{guild.id}/roles/{role.id}` - Delete role

## Gateway Events

### Connection Events
- `READY` - Bot is ready
- `RESUMED` - Session resumed
- `INVALID_SESSION` - Session invalid

### Guild Events
- `GUILD_CREATE` - Joined guild
- `GUILD_UPDATE` - Guild updated
- `GUILD_DELETE` - Left guild

### Message Events
- `MESSAGE_CREATE` - Message sent
- `MESSAGE_UPDATE` - Message edited
- `MESSAGE_DELETE` - Message deleted

### Member Events
- `GUILD_MEMBER_ADD` - User joined
- `GUILD_MEMBER_UPDATE` - Member updated
- `GUILD_MEMBER_REMOVE` - User left

## Rate Limits

Discord implements rate limiting to prevent API abuse:

- **Global Rate Limit**: 50 requests per second
- **Per-Route Rate Limits**: Vary by endpoint
- **429 Response**: Rate limit exceeded

### Handling Rate Limits
```javascript
// Wait for rate limit reset
if (response.status === 429) {
    const retryAfter = response.headers['retry-after'];
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
}
```

## Webhooks

Webhooks allow sending messages without a bot:

```javascript
const webhook = new WebhookClient({
    url: process.env.GENERAL_CHAT_WEBHOOK
});

webhook.send({
    content: 'Hello from webhook!',
    username: 'Arch 2 Bot'
});
```

## Error Handling

### Common Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Response Format
```json
{
    "code": 50001,
    "message": "Missing Access"
}
```

## Best Practices

1. **Use Intents**: Only request necessary intents
2. **Handle Rate Limits**: Implement proper retry logic
3. **Cache Data**: Store frequently accessed data
4. **Error Handling**: Always handle API errors gracefully
5. **Logging**: Log important events and errors

## Resources

- [Official Discord API Docs](https://discord.com/developers/docs/reference)
- [Discord.js Documentation](https://discord.js.org/)
- [Discord.py Documentation](https://discordpy.readthedocs.io/)
