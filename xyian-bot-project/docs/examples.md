# Discord Bot Examples & Tutorials

## Basic Bot Setup

### Simple Ping Bot
```javascript
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
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

### Slash Commands Example
```javascript
const { SlashCommandBuilder } = require('discord.js');

const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});
```

## Community Management Examples

### Welcome System
```javascript
client.on('guildMemberAdd', async member => {
    const welcomeChannel = member.guild.channels.cache.find(
        channel => channel.name === 'welcome'
    );
    
    if (welcomeChannel) {
        const embed = {
            title: 'Welcome!',
            description: `Welcome to Arch 2 Addicts, ${member}!`,
            color: 0x00ff00,
            thumbnail: { url: member.user.displayAvatarURL() },
            fields: [
                { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: 'Server', value: 'Arch 2 Addicts', inline: true }
            ],
            timestamp: new Date().toISOString()
        };
        
        await welcomeChannel.send({ embeds: [embed] });
    }
});
```

### Role Management
```javascript
// Assign XYIAN OFFICIAL role
async function assignXyianRole(member) {
    const role = member.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
    
    if (role) {
        await member.roles.add(role);
        return true;
    }
    return false;
}

// Check if user has XYIAN OFFICIAL role
function isXyianMember(member) {
    return member.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
}
```

### Channel Permissions
```javascript
// Set up guild-only channel
async function setupGuildChannel(channel) {
    const guild = channel.guild;
    const everyoneRole = guild.roles.everyone;
    const xyianRole = guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
    
    if (xyianRole) {
        // Deny access to @everyone
        await channel.permissionOverwrites.edit(everyoneRole, {
            ViewChannel: false
        });
        
        // Allow access to XYIAN OFFICIAL
        await channel.permissionOverwrites.edit(xyianRole, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });
    }
}
```

## Webhook Examples

### Basic Webhook Usage
```javascript
const { WebhookClient } = require('discord.js');

const webhook = new WebhookClient({
    url: process.env.GENERAL_CHAT_WEBHOOK
});

// Send simple message
await webhook.send('Hello from webhook!');

// Send with custom username
await webhook.send({
    content: 'Hello from Arch 2 Bot!',
    username: 'Arch 2 Bot',
    avatarURL: 'https://example.com/avatar.png'
});
```

### Webhook with Embeds
```javascript
const embed = {
    title: 'Arch 2 Update',
    description: 'New features have been added to Arch 2!',
    color: 0x00ff00,
    fields: [
        { name: 'New Features', value: 'Guild system, new weapons', inline: true },
        { name: 'Bug Fixes', value: 'Fixed various issues', inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Arch 2 Addicts Community' }
};

await webhook.send({ embeds: [embed] });
```

## Moderation Examples

### Kick Command
```javascript
const kickCommand = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to kick')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for kick')
            .setRequired(false));

async function execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
        await user.kick(reason);
        await interaction.reply(`Successfully kicked ${user.username}`);
    } catch (error) {
        await interaction.reply(`Failed to kick ${user.username}: ${error.message}`);
    }
}
```

### Ban Command
```javascript
const banCommand = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('User to ban')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for ban')
            .setRequired(false))
    .addIntegerOption(option =>
        option.setName('days')
            .setDescription('Days of messages to delete')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(7));

async function execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 0;
    
    try {
        await user.ban({ reason, deleteMessageDays: days });
        await interaction.reply(`Successfully banned ${user.username}`);
    } catch (error) {
        await interaction.reply(`Failed to ban ${user.username}: ${error.message}`);
    }
}
```

## Database Examples

### SQLite Setup
```javascript
const Database = require('better-sqlite3');
const db = new Database('bot.db');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        joined_at DATETIME,
        xyian_member BOOLEAN DEFAULT FALSE
    )
`);

// Insert user
const insertUser = db.prepare('INSERT INTO users (id, username, joined_at) VALUES (?, ?, ?)');

// Get user
const getUser = db.prepare('SELECT * FROM users WHERE id = ?');

// Update user
const updateUser = db.prepare('UPDATE users SET xyian_member = ? WHERE id = ?');
```

### User Management
```javascript
// Add user to database
async function addUser(user) {
    try {
        insertUser.run(user.id, user.username, new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Error adding user:', error);
        return false;
    }
}

// Check if user is XYIAN member
function isXyianMember(userId) {
    const user = getUser.get(userId);
    return user ? user.xyian_member : false;
}

// Set XYIAN membership
function setXyianMembership(userId, isMember) {
    try {
        updateUser.run(isMember, userId);
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}
```

## Event Examples

### Message Events
```javascript
// Message create
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    // Log message
    console.log(`${message.author.username}: ${message.content}`);
    
    // Check for commands
    if (message.content.startsWith('!')) {
        handleCommand(message);
    }
});

// Message update
client.on('messageUpdate', (oldMessage, newMessage) => {
    console.log(`Message edited: ${oldMessage.content} -> ${newMessage.content}`);
});

// Message delete
client.on('messageDelete', message => {
    console.log(`Message deleted: ${message.content}`);
});
```

### Member Events
```javascript
// Member join
client.on('guildMemberAdd', member => {
    console.log(`${member.user.username} joined the server`);
    // Add to database, send welcome message, etc.
});

// Member leave
client.on('guildMemberRemove', member => {
    console.log(`${member.user.username} left the server`);
    // Update database, send goodbye message, etc.
});

// Member update
client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        console.log(`${newMember.user.username} roles updated`);
        // Handle role changes
    }
});
```

## Error Handling Examples

### Global Error Handler
```javascript
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.on('error', error => {
    console.error('Discord client error:', error);
});
```

### Command Error Handling
```javascript
async function executeCommand(interaction) {
    try {
        // Command logic here
        await interaction.reply('Command executed successfully!');
    } catch (error) {
        console.error('Command error:', error);
        
        const errorMessage = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
}
```

## Configuration Examples

### Environment Variables
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
```

### Configuration Loading
```javascript
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    webhooks: {
        generalChat: process.env.GENERAL_CHAT_WEBHOOK
    },
    community: {
        guildRoleName: process.env.GUILD_ROLE_NAME,
        communityName: process.env.COMMUNITY_NAME,
        gameName: process.env.GAME_NAME
    }
};

// Validate configuration
function validateConfig() {
    const required = ['token', 'clientId', 'guildId'];
    
    for (const field of required) {
        if (!config[field]) {
            throw new Error(`Missing required configuration: ${field}`);
        }
    }
}
```

## Testing Examples

### Unit Tests
```javascript
const { Client } = require('discord.js');

describe('Bot Commands', () => {
    let client;
    
    beforeEach(() => {
        client = new Client({ intents: [] });
    });
    
    test('ping command responds with pong', () => {
        const mockMessage = {
            content: '!ping',
            reply: jest.fn()
        };
        
        // Execute command
        handleCommand(mockMessage);
        
        // Assert
        expect(mockMessage.reply).toHaveBeenCalledWith('Pong!');
    });
});
```

## Deployment Examples

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'discord-bot',
        script: 'index.js',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }]
};
```

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "index.js"]
```

## Resources

- [Discord.js Guide](https://discordjs.guide/)
- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord API Documentation](https://discord.com/developers/docs)
