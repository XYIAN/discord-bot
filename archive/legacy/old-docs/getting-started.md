# Getting Started with Discord Bot Development

## Prerequisites

- Basic programming knowledge (JavaScript/Node.js or Python recommended)
- A Discord account
- Node.js (v16.9.0 or higher) or Python 3.8+
- Git for version control

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your application a name (e.g., "Arch 2 Addicts Bot")
4. Click "Create"

## Step 2: Create a Bot Account

1. In your application, navigate to the "Bot" section
2. Click "Add Bot"
3. Customize your bot's username and avatar
4. **Important**: Copy and save the bot token (you'll need this later)

## Step 3: Set Up Bot Permissions

### Required Permissions for Community Management:
- `Send Messages` - Send messages in channels
- `Manage Messages` - Delete and manage messages
- `Manage Roles` - Assign and remove roles
- `Manage Channels` - Create and manage channels
- `Read Message History` - Read previous messages
- `Use Slash Commands` - Use application commands
- `Embed Links` - Send rich embeds
- `Attach Files` - Send files and images
- `Read Message History` - Access message history
- `Add Reactions` - Add emoji reactions

### Generate Invite Link:
1. Go to "OAuth2" > "URL Generator"
2. Select "bot" scope
3. Select the permissions listed above
4. Copy the generated URL
5. Use this URL to invite your bot to your server

## Step 4: Development Environment Setup

### For Node.js/JavaScript:

```bash
# Create project directory
mkdir discord-bot
cd discord-bot

# Initialize package.json
npm init -y

# Install discord.js
npm install discord.js

# Install additional dependencies
npm install dotenv axios
```

### For Python:

```bash
# Create project directory
mkdir discord-bot
cd discord-bot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install discord.py
pip install discord.py python-dotenv requests
```

## Step 5: Environment Configuration

Create a `.env` file in your project root:

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
```

## Step 6: Basic Bot Structure

### JavaScript/Node.js Example:

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.login(process.env.DISCORD_TOKEN);
```

### Python Example:

```python
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

load_dotenv()

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

@bot.command()
async def ping(ctx):
    await ctx.send('Pong!')

bot.run(os.getenv('DISCORD_TOKEN'))
```

## Step 7: Testing Your Bot

1. Run your bot script
2. Check the console for "Bot is online" message
3. Go to your Discord server
4. Try sending `!ping` in a channel
5. Verify the bot responds with "Pong!"

## Next Steps

- [Discord API Reference](./discord-api.md) - Learn about Discord's API
- [Bot Development Guide](./bot-development.md) - Advanced bot features
- [Interactions & Commands](./interactions-commands.md) - Slash commands
- [Community Management](./community-management.md) - Server management

## Troubleshooting

### Common Issues:

1. **Bot doesn't respond**: Check if the bot has proper permissions
2. **Token invalid**: Verify your bot token is correct
3. **Missing intents**: Ensure you've enabled the required intents
4. **Permission denied**: Check bot's role permissions in server settings

### Getting Help:

- [Discord.js Guide](https://discordjs.guide/)
- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [Discord Developer Support](https://discord.gg/discord-developers)
