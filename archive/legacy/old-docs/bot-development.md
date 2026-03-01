# Discord Bot Development Guide

## Bot Architecture

### Event-Driven Design
Discord bots are event-driven applications that respond to various Discord events:

```javascript
// Basic event structure
client.on('eventName', (parameter) => {
    // Handle event
});
```

### Command Structure
```javascript
// Command handler pattern
const commands = new Collection();

// Register command
commands.set('ping', {
    name: 'ping',
    description: 'Pong!',
    execute(message, args) {
        message.reply('Pong!');
    }
});
```

## Core Features

### Message Handling
```javascript
client.on('messageCreate', message => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check for command prefix
    if (!message.content.startsWith(prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Execute command
    const command = commands.get(commandName);
    if (command) {
        command.execute(message, args);
    }
});
```

### Slash Commands
```javascript
// Register slash command
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

// Handle slash command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});
```

### Role Management
```javascript
// Assign role to user
async function assignRole(member, roleName) {
    const role = member.guild.roles.cache.find(role => role.name === roleName);
    if (role) {
        await member.roles.add(role);
        return true;
    }
    return false;
}

// Check if user has role
function hasRole(member, roleName) {
    return member.roles.cache.some(role => role.name === roleName);
}
```

## Advanced Features

### Database Integration
```javascript
// Using SQLite with better-sqlite3
const Database = require('better-sqlite3');
const db = new Database('bot.db');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        joined_at DATETIME
    )
`);

// Insert user
const insertUser = db.prepare('INSERT INTO users (id, username, joined_at) VALUES (?, ?, ?)');
```

### Moderation Features
```javascript
// Kick user
async function kickUser(member, reason) {
    try {
        await member.kick(reason);
        return true;
    } catch (error) {
        console.error('Failed to kick user:', error);
        return false;
    }
}

// Ban user
async function banUser(member, reason, days = 0) {
    try {
        await member.ban({ reason, deleteMessageDays: days });
        return true;
    } catch (error) {
        console.error('Failed to ban user:', error);
        return false;
    }
}
```

### Auto-Moderation
```javascript
// Filter inappropriate content
const badWords = ['spam', 'scam'];
const filter = new RegExp(badWords.join('|'), 'i');

client.on('messageCreate', async message => {
    if (filter.test(message.content)) {
        await message.delete();
        await message.channel.send(`${message.author}, please keep the chat appropriate!`);
    }
});
```

## Community Features

### Welcome System
```javascript
client.on('guildMemberAdd', async member => {
    const welcomeChannel = member.guild.channels.cache.find(
        channel => channel.name === 'welcome'
    );
    
    if (welcomeChannel) {
        const embed = new EmbedBuilder()
            .setTitle('Welcome!')
            .setDescription(`Welcome to Arch 2 Addicts, ${member}!`)
            .setColor(0x00ff00);
        
        await welcomeChannel.send({ embeds: [embed] });
    }
});
```

### Reaction Roles
```javascript
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    
    const message = reaction.message;
    const member = message.guild.members.cache.get(user.id);
    
    // Check if it's the role assignment message
    if (message.id === 'ROLE_MESSAGE_ID') {
        const role = message.guild.roles.cache.find(
            role => role.name === 'XYIAN OFFICIAL'
        );
        
        if (role && reaction.emoji.name === '✅') {
            await member.roles.add(role);
        }
    }
});
```

## Error Handling

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
// Wrap command execution in try-catch
try {
    await command.execute(interaction);
} catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
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
```

## Performance Optimization

### Caching
```javascript
// Cache frequently accessed data
const guildCache = new Map();

function getGuildData(guildId) {
    if (!guildCache.has(guildId)) {
        // Fetch from database or API
        const data = fetchGuildData(guildId);
        guildCache.set(guildId, data);
    }
    return guildCache.get(guildId);
}
```

### Rate Limiting
```javascript
// Implement custom rate limiting
const userCooldowns = new Map();

function isOnCooldown(userId, command, cooldownTime) {
    const key = `${userId}-${command}`;
    const now = Date.now();
    
    if (userCooldowns.has(key)) {
        const lastUsed = userCooldowns.get(key);
        if (now - lastUsed < cooldownTime) {
            return true;
        }
    }
    
    userCooldowns.set(key, now);
    return false;
}
```

## Testing

### Unit Testing
```javascript
// Using Jest
const { Client } = require('discord.js');

describe('Bot Commands', () => {
    let client;
    
    beforeEach(() => {
        client = new Client({ intents: [] });
    });
    
    test('ping command responds with pong', () => {
        // Mock message
        const mockMessage = {
            content: '!ping',
            reply: jest.fn()
        };
        
        // Execute command
        commands.get('ping').execute(mockMessage, []);
        
        // Assert
        expect(mockMessage.reply).toHaveBeenCalledWith('Pong!');
    });
});
```

## Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
DISCORD_TOKEN=your_production_token
DATABASE_URL=your_database_url
```

### Process Management
```javascript
// Using PM2
const pm2 = require('pm2');

pm2.start({
    name: 'discord-bot',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork'
});
```

## Resources

- [Discord.js Guide](https://discordjs.guide/)
- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [Discord Developer Portal](https://discord.com/developers/applications)
