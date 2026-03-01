# Arch 2 Addicts Project

## Project Overview

The Arch 2 Addicts Discord community is designed to serve multiple purposes:
- **General Community**: Open to all Arch 2 players
- **Server Community**: Members of your specific server
- **Guild Community**: Exclusive to XYIAN OFFICIAL members

## Community Structure

### Channels
```
Arch 2 Addicts
├── 📢 announcements - Server-wide announcements
├── 📋 rules-info - Community rules and information
├── 💬 general-chat - Main community chat (webhook enabled)
├── 🎮 game-discussion - Arch 2 game discussions
├── 🔧 guild-management - Guild-specific channels
│   ├── xyian-official-chat (XYIAN OFFICIAL only)
│   ├── guild-announcements (XYIAN OFFICIAL only)
│   └── guild-commands (XYIAN OFFICIAL only)
├── 🤖 bot-commands - Bot command channel
└── 📊 server-stats - Server statistics
```

### Roles
- **@everyone** - Base permissions
- **Member** - Verified community members
- **XYIAN OFFICIAL** - Guild members (exclusive access)
- **Moderator** - Community moderation
- **Admin** - Server administration

## Webhook Configuration

### General Chat Webhook
```javascript
// Webhook URL (stored in .env)
GENERAL_CHAT_WEBHOOK=https://discord.com/api/webhooks/1424136765496758335/w_7dLPXq6KO2Lim9mN0kSVNmCO_1io7E83bc2iUProg9cB5vxmoGQOJidntrLA86CVo3

// Usage
const { WebhookClient } = require('discord.js');
const generalWebhook = new WebhookClient({
    url: process.env.GENERAL_CHAT_WEBHOOK
});
```

## Bot Features

### Community Management
- Welcome new members
- Auto-assign roles
- Moderate content
- Track statistics

### Guild Features
- XYIAN OFFICIAL role management
- Guild-only channels
- Exclusive commands
- Member verification

### Arch 2 Specific
- Game statistics
- Guild rankings
- Event announcements
- Community challenges

## Implementation Plan

### Phase 1: Basic Setup
1. Create Discord application
2. Set up bot with permissions
3. Configure channels and roles
4. Implement basic commands

### Phase 2: Community Features
1. Welcome system
2. Role management
3. Moderation tools
4. Statistics tracking

### Phase 3: Guild Features
1. XYIAN OFFICIAL verification
2. Guild-only channels
3. Exclusive commands
4. Member management

### Phase 4: Arch 2 Integration
1. Game API integration
2. Statistics display
3. Event management
4. Community challenges

## Commands

### General Commands
- `/ping` - Bot health check
- `/help` - Command list
- `/info` - Server information
- `/stats` - Server statistics

### Guild Commands (XYIAN OFFICIAL only)
- `/guild-info` - Guild information
- `/guild-members` - Member list
- `/guild-stats` - Guild statistics
- `/verify` - Verify guild membership

### Moderation Commands
- `/kick` - Kick user
- `/ban` - Ban user
- `/mute` - Mute user
- `/warn` - Warn user

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    discriminator TEXT,
    avatar TEXT,
    joined_at DATETIME,
    xyian_member BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    last_active DATETIME
);
```

### Guild Table
```sql
CREATE TABLE guild (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    member_count INTEGER,
    level INTEGER,
    experience INTEGER,
    created_at DATETIME
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    channel_id TEXT,
    content TEXT,
    timestamp DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Environment Variables

```env
# Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here

# Webhooks
GENERAL_CHAT_WEBHOOK=https://discord.com/api/webhooks/1424136765496758335/w_7dLPXq6KO2Lim9mN0kSVNmCO_1io7E83bc2iUProg9cB5vxmoGQOJidntrLA86CVo3

# Community Settings
GUILD_ROLE_NAME=XYIAN OFFICIAL
COMMUNITY_NAME=Arch 2 Addicts
GAME_NAME=Arch 2

# Database
DATABASE_URL=sqlite:./bot.db

# Security
ENCRYPTION_KEY=your_encryption_key_here
WEBHOOK_SECRET=your_webhook_secret_here
```

## Deployment

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run bot
npm start
```

### Production
```bash
# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

## Monitoring

### Health Checks
- Bot status
- Database connectivity
- API rate limits
- Error rates

### Logs
- Command usage
- Error logs
- Security events
- Performance metrics

## Future Enhancements

1. **Arch 2 API Integration**
   - Player statistics
   - Guild rankings
   - Game events

2. **Advanced Features**
   - Custom emojis
   - Voice channel management
   - Event scheduling

3. **Community Tools**
   - Polls and voting
   - Giveaways
   - Leaderboards

4. **Mobile App**
   - Community app
   - Push notifications
   - Offline access

## Resources

- [Arch 2 Game](https://arch2.com) - Game website
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Community Guidelines](https://discord.com/guidelines)
