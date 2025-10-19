# Discord Interactions & Commands

## Overview

Discord interactions allow users to interact with your bot through UI elements like slash commands, buttons, and select menus.

## Slash Commands

### Basic Slash Command
```javascript
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

async function execute(interaction) {
    await interaction.reply('Pong!');
}

module.exports = { data, execute };
```

### Slash Commands with Options
```javascript
const data = new SlashCommandBuilder()
    .setName('user')
    .setDescription('Provides information about a user')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to get information about')
            .setRequired(true));

async function execute(interaction) {
    const user = interaction.options.getUser('target');
    await interaction.reply(`User: ${user.username}`);
}
```

### Subcommands
```javascript
const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure server settings')
    .addSubcommand(subcommand =>
        subcommand
            .setName('welcome')
            .setDescription('Configure welcome settings')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('Welcome channel')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('roles')
            .setDescription('Configure role settings')
            .addRoleOption(option =>
                option.setName('role')
                    .setDescription('Role to configure')
                    .setRequired(true)));
```

## Buttons

### Creating Buttons
```javascript
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('primary')
            .setLabel('Primary')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('secondary')
            .setLabel('Secondary')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('success')
            .setLabel('Success')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('danger')
            .setLabel('Danger')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setURL('https://discord.com')
            .setLabel('Link')
            .setStyle(ButtonStyle.Link)
    );

await interaction.reply({
    content: 'Choose an option:',
    components: [row]
});
```

### Handling Button Interactions
```javascript
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'primary') {
        await interaction.reply('You clicked the primary button!');
    } else if (interaction.customId === 'secondary') {
        await interaction.reply('You clicked the secondary button!');
    }
});
```

## Select Menus

### Creating Select Menus
```javascript
const { StringSelectMenuBuilder } = require('discord.js');

const select = new StringSelectMenuBuilder()
    .setCustomId('role-select')
    .setPlaceholder('Choose your role')
    .addOptions([
        {
            label: 'Gamer',
            description: 'For gaming enthusiasts',
            value: 'gamer',
        },
        {
            label: 'Developer',
            description: 'For developers',
            value: 'developer',
        },
        {
            label: 'XYIAN OFFICIAL',
            description: 'Official guild member',
            value: 'xyian-official',
        },
    ]);

const row = new ActionRowBuilder()
    .addComponents(select);

await interaction.reply({
    content: 'Select your role:',
    components: [row]
});
```

### Handling Select Menu Interactions
```javascript
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    
    if (interaction.customId === 'role-select') {
        const selectedRole = interaction.values[0];
        const role = interaction.guild.roles.cache.find(r => r.name === selectedRole);
        
        if (role) {
            await interaction.member.roles.add(role);
            await interaction.reply(`You've been assigned the ${role.name} role!`);
        }
    }
});
```

## Modals

### Creating Modals
```javascript
const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const modal = new ModalBuilder()
    .setCustomId('suggestion-modal')
    .setTitle('Submit a Suggestion');

const suggestionInput = new TextInputBuilder()
    .setCustomId('suggestion')
    .setLabel('Your suggestion')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter your suggestion here...')
    .setRequired(true)
    .setMaxLength(1000);

const row = new ActionRowBuilder().addComponents(suggestionInput);
modal.addComponents(row);

await interaction.showModal(modal);
```

### Handling Modal Submissions
```javascript
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === 'suggestion-modal') {
        const suggestion = interaction.fields.getTextInputValue('suggestion');
        
        // Process suggestion
        await interaction.reply('Thank you for your suggestion!');
    }
});
```

## Command Registration

### Global Commands
```javascript
const { REST, Routes } = require('discord.js');

const commands = [
    // Your command data here
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
```

### Guild-Specific Commands
```javascript
// Register commands for specific guild
await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
);
```

## Command Categories

### Moderation Commands
```javascript
const moderationCommands = [
    {
        name: 'kick',
        description: 'Kick a user from the server',
        options: [
            {
                name: 'user',
                description: 'User to kick',
                type: 6, // USER
                required: true
            },
            {
                name: 'reason',
                description: 'Reason for kick',
                type: 3, // STRING
                required: false
            }
        ]
    },
    {
        name: 'ban',
        description: 'Ban a user from the server',
        options: [
            {
                name: 'user',
                description: 'User to ban',
                type: 6, // USER
                required: true
            },
            {
                name: 'reason',
                description: 'Reason for ban',
                type: 3, // STRING
                required: false
            }
        ]
    }
];
```

### Community Commands
```javascript
const communityCommands = [
    {
        name: 'welcome',
        description: 'Send welcome message to new member',
        options: [
            {
                name: 'user',
                description: 'User to welcome',
                type: 6, // USER
                required: true
            }
        ]
    },
    {
        name: 'role',
        description: 'Manage user roles',
        options: [
            {
                name: 'action',
                description: 'Action to perform',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                ]
            },
            {
                name: 'user',
                description: 'User to modify',
                type: 6, // USER
                required: true
            },
            {
                name: 'role',
                description: 'Role to modify',
                type: 8, // ROLE
                required: true
            }
        ]
    }
];
```

## Error Handling

### Interaction Error Handling
```javascript
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName);
            if (!command) return;
            
            await command.execute(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        
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
});
```

## Best Practices

1. **Use Ephemeral Responses**: For sensitive operations, use ephemeral responses
2. **Validate Input**: Always validate user input before processing
3. **Handle Permissions**: Check user permissions before executing commands
4. **Rate Limiting**: Implement cooldowns for commands
5. **Error Messages**: Provide clear, helpful error messages
6. **Logging**: Log command usage and errors for debugging

## Resources

- [Discord Slash Commands Guide](https://discord.com/developers/docs/interactions/application-commands)
- [Discord Interactions Guide](https://discord.com/developers/docs/interactions/receiving-and-responding)
- [Discord.js Interactions Guide](https://discordjs.guide/interactions/)
