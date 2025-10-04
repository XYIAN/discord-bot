# Discord Community Management

## Server Structure

### Channel Organization
```
Arch 2 Addicts
├── 📢 Announcements
├── 📋 Rules & Info
├── 💬 General Chat
├── 🎮 Game Discussion
├── 🔧 Guild Management
│   ├── xyian-official-chat (XYIAN OFFICIAL role only)
│   ├── guild-announcements (XYIAN OFFICIAL role only)
│   └── guild-commands (XYIAN OFFICIAL role only)
├── 🤖 Bot Commands
└── 📊 Server Stats
```

### Role Hierarchy
```
@everyone (Base permissions)
├── Member (Verified users)
├── XYIAN OFFICIAL (Guild members)
├── Moderator (Server moderation)
├── Admin (Server administration)
└── Owner (Full control)
```

## Role Management

### Creating Roles
```javascript
// Create XYIAN OFFICIAL role
async function createXyianRole(guild) {
    const role = await guild.roles.create({
        name: 'XYIAN OFFICIAL',
        color: '#FFD700', // Gold color
        permissions: [
            'ViewChannel',
            'SendMessages',
            'ReadMessageHistory',
            'AddReactions',
            'UseExternalEmojis'
        ],
        mentionable: true,
        reason: 'Guild member role for Arch 2 Addicts'
    });
    
    return role;
}
```

### Role Assignment
```javascript
// Assign role to user
async function assignXyianRole(member) {
    const role = member.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
    
    if (role) {
        await member.roles.add(role);
        return true;
    }
    return false;
}

// Remove role from user
async function removeXyianRole(member) {
    const role = member.guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL');
    
    if (role) {
        await member.roles.remove(role);
        return true;
    }
    return false;
}
```

### Role Verification
```javascript
// Check if user has XYIAN OFFICIAL role
function isXyianMember(member) {
    return member.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
}

// Check if user can access guild channels
function canAccessGuildChannels(member) {
    return isXyianMember(member) || member.permissions.has('Administrator');
}
```

## Channel Permissions

### Setting Up Guild-Only Channels
```javascript
// Configure guild-only channel permissions
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

### Dynamic Channel Creation
```javascript
// Create guild-specific channel
async function createGuildChannel(guild, channelName) {
    const category = guild.channels.cache.find(c => c.name === 'Guild Management');
    
    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
            {
                id: guild.roles.everyone,
                deny: ['ViewChannel']
            },
            {
                id: guild.roles.cache.find(role => role.name === 'XYIAN OFFICIAL'),
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            }
        ]
    });
    
    return channel;
}
```

## Welcome System

### Welcome Message
```javascript
client.on('guildMemberAdd', async member => {
    const welcomeChannel = member.guild.channels.cache.find(
        channel => channel.name === 'general-chat'
    );
    
    if (welcomeChannel) {
        const embed = new EmbedBuilder()
            .setTitle('Welcome to Arch 2 Addicts!')
            .setDescription(`Welcome ${member} to our community!`)
            .setColor(0x00ff00)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: 'Server', value: 'Arch 2 Addicts', inline: true }
            )
            .setTimestamp();
        
        await welcomeChannel.send({ embeds: [embed] });
    }
});
```

### Auto-Role Assignment
```javascript
client.on('guildMemberAdd', async member => {
    // Assign base member role
    const memberRole = member.guild.roles.cache.find(role => role.name === 'Member');
    if (memberRole) {
        await member.roles.add(memberRole);
    }
    
    // Check if user should get XYIAN OFFICIAL role
    // This could be based on verification, invite code, etc.
    if (shouldGetXyianRole(member)) {
        await assignXyianRole(member);
    }
});
```

## Moderation Features

### Auto-Moderation
```javascript
// Spam detection
const userMessages = new Map();

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    const userId = message.author.id;
    const now = Date.now();
    
    if (!userMessages.has(userId)) {
        userMessages.set(userId, []);
    }
    
    const userMessageHistory = userMessages.get(userId);
    userMessageHistory.push(now);
    
    // Keep only messages from last 10 seconds
    const recentMessages = userMessageHistory.filter(time => now - time < 10000);
    userMessages.set(userId, recentMessages);
    
    // If more than 5 messages in 10 seconds, consider it spam
    if (recentMessages.length > 5) {
        await message.delete();
        await message.channel.send(`${message.author}, please slow down!`);
    }
});
```

### Content Filtering
```javascript
// Inappropriate content filter
const badWords = ['spam', 'scam', 'hack'];
const filter = new RegExp(badWords.join('|'), 'i');

client.on('messageCreate', async message => {
    if (filter.test(message.content)) {
        await message.delete();
        
        const warning = await message.channel.send(
            `${message.author}, please keep the chat appropriate!`
        );
        
        // Delete warning after 5 seconds
        setTimeout(() => warning.delete(), 5000);
    }
});
```

## Guild Management

### Guild Member Verification
```javascript
// Verify guild membership
async function verifyGuildMembership(member, verificationCode) {
    // Check against your guild's verification system
    const isValid = await checkGuildVerification(verificationCode);
    
    if (isValid) {
        await assignXyianRole(member);
        return true;
    }
    return false;
}

// Guild member commands
const guildCommands = {
    'verify': async (interaction) => {
        const code = interaction.options.getString('code');
        const isValid = await verifyGuildMembership(interaction.member, code);
        
        if (isValid) {
            await interaction.reply('You have been verified as a XYIAN OFFICIAL member!');
        } else {
            await interaction.reply('Invalid verification code.');
        }
    }
};
```

### Guild Statistics
```javascript
// Track guild activity
const guildStats = {
    totalMembers: 0,
    xyianMembers: 0,
    messagesToday: 0,
    activeChannels: new Set()
};

// Update stats
client.on('messageCreate', message => {
    if (message.guild.id === process.env.GUILD_ID) {
        guildStats.messagesToday++;
        guildStats.activeChannels.add(message.channel.id);
    }
});

// Display stats command
const statsCommand = {
    name: 'guildstats',
    description: 'Display guild statistics',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Arch 2 Addicts Statistics')
            .addFields(
                { name: 'Total Members', value: `${guildStats.totalMembers}`, inline: true },
                { name: 'XYIAN Members', value: `${guildStats.xyianMembers}`, inline: true },
                { name: 'Messages Today', value: `${guildStats.messagesToday}`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
```

## Webhook Integration

### General Chat Webhook
```javascript
const { WebhookClient } = require('discord.js');

const generalChatWebhook = new WebhookClient({
    url: process.env.GENERAL_CHAT_WEBHOOK
});

// Send message via webhook
async function sendWebhookMessage(content, username = 'Arch 2 Bot') {
    await generalChatWebhook.send({
        content,
        username
    });
}
```

### Automated Announcements
```javascript
// Send guild announcements
async function sendGuildAnnouncement(title, description, channel) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0xFFD700)
        .setTimestamp();
    
    await channel.send({ embeds: [embed] });
}
```

## Best Practices

1. **Clear Role Hierarchy**: Establish clear role permissions
2. **Consistent Naming**: Use consistent naming conventions
3. **Regular Cleanup**: Clean up inactive channels and roles
4. **Member Verification**: Implement proper verification systems
5. **Moderation Logs**: Keep logs of moderation actions
6. **Community Guidelines**: Enforce clear community guidelines

## Resources

- [Discord Server Setup Guide](https://support.discord.com/hc/en-us/articles/360040328352)
- [Discord Permissions Guide](https://support.discord.com/hc/en-us/articles/206029707)
- [Discord Community Guidelines](https://discord.com/guidelines)
