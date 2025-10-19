# Discord API Documentation

This directory contains comprehensive documentation scraped from the official Discord Developer Documentation at [https://discord.com/developers/docs](https://discord.com/developers/docs).

## 📚 Documentation Structure

### Getting Started
- **Introduction** - Overview of Discord's API and development platform
- **Getting Started** - Basic setup and getting started guide
- **Setup** - Initial setup instructions
- **Creating an App** - How to create a Discord application
- **Creating a Bot** - How to create a Discord bot
- **Adding a Bot** - How to add a bot to your server
- **Installing Libraries** - Popular Discord libraries and SDKs
- **Your First Bot** - Tutorial for creating your first bot

### OAuth2
- **OAuth2** - Overview of Discord's OAuth2 implementation
- **OAuth2 Flow** - Step-by-step OAuth2 authorization flow
- **OAuth2 Scopes** - Available OAuth2 scopes and permissions
- **OAuth2 URLs** - OAuth2 endpoint URLs
- **OAuth2 Redirects** - Setting up OAuth2 redirects

### Gateway (WebSocket API)
- **Gateway** - Overview of Discord's Gateway API
- **Connecting** - How to connect to the Gateway
- **Identifying** - Bot identification process
- **Resuming** - Resuming dropped connections
- **Rate Limiting** - Gateway rate limiting
- **Payloads** - Gateway payload structure
- **Events** - Available Gateway events
- **Commands** - Gateway commands
- **Voice** - Voice-related Gateway events
- **WebSockets** - WebSocket connection details

### RPC (Rich Presence)
- **RPC** - Overview of Discord's RPC system
- **Connecting** - How to connect to RPC
- **Events** - RPC events
- **Commands** - RPC commands
- **Errors** - RPC error handling

### Voice Connections
- **Voice Connections** - Overview of voice functionality
- **Connecting** - How to connect to voice channels
- **Voice Protocol** - Voice protocol specification
- **Encryption** - Voice encryption details
- **Voice UDP** - UDP voice communication

### Rate Limits
- **Rate Limits** - Overview of Discord's rate limiting
- **Rate Limits Details** - Detailed rate limiting information
- **Global Rate Limits** - Global rate limiting rules
- **Rate Limits Example** - Rate limiting examples

### Opcodes and Status Codes
- **Opcodes and Status Codes** - Overview of opcodes and status codes
- **Gateway Opcodes** - Gateway-specific opcodes
- **Gateway Close Event Codes** - WebSocket close event codes
- **Voice Opcodes** - Voice-specific opcodes
- **Voice Close Event Codes** - Voice close event codes
- **HTTP Response Codes** - HTTP API response codes
- **RPC Error Codes** - RPC-specific error codes

### Permissions
- **Permissions** - Overview of Discord permissions
- **Permissions Details** - Detailed permission information
- **Permissions Bitwise** - Bitwise permission operations
- **Permissions List** - Complete list of permissions
- **Permissions Intents** - Gateway intents and permissions

### Teams
- **Teams** - Overview of Discord teams
- **Teams Details** - Detailed team information
- **Teams Members** - Team member management
- **Teams Applications** - Team application management

### Resources (Data Models)
- **Application Resource** - Application data model
- **Audit Log Resource** - Audit log data model
- **Auto Moderation Resource** - Auto moderation data model
- **Channel Resource** - Channel data model
- **Emoji Resource** - Emoji data model
- **Guild Resource** - Guild (server) data model
- **Guild Scheduled Event Resource** - Scheduled events data model
- **Guild Template Resource** - Guild templates data model
- **Invite Resource** - Invite data model
- **Stage Instance Resource** - Stage instances data model
- **Sticker Resource** - Sticker data model
- **User Resource** - User data model
- **Voice Resource** - Voice data model
- **Webhook Resource** - Webhook data model

## 🛠️ Usage

These documentation files are automatically scraped from the official Discord Developer Documentation and are kept up-to-date with the latest API changes. Each file contains:

- **Source URL** - Original documentation URL
- **Scraped Date** - When the documentation was last updated
- **Full Content** - Complete documentation content in Markdown format

## 🔄 Updating Documentation

To update the documentation with the latest changes from Discord:

```bash
cd scripts
node comprehensive-discord-scraper.js
```

This will scrape all Discord API documentation and update the files in this directory.

## 📖 Original Source

All documentation is sourced from the official Discord Developer Documentation:
- **Website**: [https://discord.com/developers/docs](https://discord.com/developers/docs)
- **Last Updated**: ${new Date().toISOString().split('T')[0]}

## ⚠️ Important Notes

- This documentation is for reference purposes only
- Always refer to the official Discord Developer Documentation for the most up-to-date information
- Discord's API may change, so always check the official documentation for breaking changes
- These files are automatically generated and may not always reflect the exact formatting of the original documentation

## 🤖 Bot Integration

This documentation is particularly useful for:
- Understanding Discord's API structure
- Learning about Gateway events and commands
- Implementing OAuth2 flows
- Understanding rate limiting
- Working with Discord's data models
- Implementing voice functionality
- Understanding permissions and intents

## 📝 Contributing

If you find any issues with the scraped documentation or want to improve the scraper, please:
1. Check the original Discord documentation
2. Update the scraper if needed
3. Re-run the scraper to update the files
4. Commit the changes

---

**Note**: This documentation is automatically generated and maintained as part of the XYIAN Discord Bot project.
