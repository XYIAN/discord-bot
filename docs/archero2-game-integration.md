# Archero 2 Game Integration

## Game Overview

Archero 2 is a legendary roguelike mobile game where players must master skills to save the world from the Demon King's forces. The game features:

- **Roguelike Mechanics**: Skills acquired during runs that last for single sessions
- **Character Progression**: Multiple heroes with unique abilities
- **Gear System**: Weapons, armor, and artifacts for customization
- **Guild System**: Community features with guild coins and benefits
- **Multiple Game Modes**: PvE, PvP, Arena, and special events

## Game Data Sources

### Primary Sources
- [Archero 2 Wiki (Game Vault)](https://archero-2.game-vault.net/wiki/Main_Page) - Community-maintained wiki with 33 articles, 456 files, and 1,626 edits
- [Archero 2 FAQ](https://archero-2.game-vault.net/wiki/FAQ) - Frequently asked questions and game mechanics
- [Archero 2 Skills Database](https://archero-2.game-vault.net/wiki/Skills) - Comprehensive skills and damage calculations
- [Reddit Archero Wiki](https://www.reddit.com/r/Archero/wiki/index/) - Community discussions and guides
- [Archero Fandom Wiki](https://archero.fandom.com/wiki/Archero_Wiki) - Legacy game information

## Core Game Mechanics

### Damage Calculation System
Archero 2 uses a hybrid system combining additive and multiplicative mechanics:

1. **Attack Power (ATK)**: Affects all damage sources
2. **Main Weapon DMG**: Only affects non-elemental main weapon damage
3. **DMG**: Mixed bag affecting various damage sources

**Formula**: `(Attack Power) × (Main Weapon DMG) × (DMG)`

### Best Equipment Recommendations

#### Weapons (S-Tier)
- **Dragon Knight Crossbow** - Top-tier weapon
- **Griffin Claw** - Excellent alternative
- **Beam Staff** - With Tracking Eye
- **Oracle Spear** - With Tracking Eye

#### Gear Sets
- **PvP**: Griffin or Decisiveness Set
- **PvE Bosses**: Dragon Knight or Destruction Set
- **PvE Monsters**: Oracle or Echo Set

#### Guild Coin Spending Priority
1. **Epic Revive Rune** (if not owned)
2. **Blessing Runes** (if no epic revive)
3. **10x Chromatic Keys** (if epic revive owned)
4. **Wait for Guild Level 5** (10% discount on items)

## Bot Integration Features

### Guild Management Commands
```javascript
// XYIAN Guild specific commands
const guildCommands = {
    'guild-stats': 'Display XYIAN guild statistics',
    'guild-members': 'List XYIAN guild members',
    'guild-events': 'Show upcoming guild events',
    'guild-coins': 'Check guild coin balance and spending advice',
    'guild-level': 'Display current guild level and benefits'
};
```

### Game Data Commands
```javascript
// Archero 2 game data commands
const gameCommands = {
    'weapon-info': 'Get detailed weapon information',
    'skill-info': 'Look up skill details and damage calculations',
    'build-guide': 'Get build recommendations for different playstyles',
    'farming-guide': 'Best floors and strategies for farming',
    'event-info': 'Current game events and rewards',
    'code-check': 'Check for active reward codes'
};
```

### Community Features
```javascript
// Community engagement commands
const communityCommands = {
    'build-share': 'Share your current build with the guild',
    'achievement': 'Share achievements and milestones',
    'help-request': 'Ask for help with specific game challenges',
    'strategy-discussion': 'Start strategy discussions',
    'guild-challenge': 'Participate in guild challenges'
};
```

## Database Schema for Game Data

### Players Table
```sql
CREATE TABLE players (
    id TEXT PRIMARY KEY,
    discord_id TEXT UNIQUE,
    archero_username TEXT,
    guild_id TEXT,
    level INTEGER,
    power_level INTEGER,
    current_weapon TEXT,
    current_gear_set TEXT,
    guild_coins INTEGER DEFAULT 0,
    last_active DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Guild Data Table
```sql
CREATE TABLE guild_data (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    member_count INTEGER DEFAULT 0,
    total_power INTEGER DEFAULT 0,
    guild_coins INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Game Events Table
```sql
CREATE TABLE game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    description TEXT,
    rewards TEXT,
    is_active BOOLEAN DEFAULT FALSE
);
```

### Skills Database Table
```sql
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rarity TEXT NOT NULL,
    description TEXT,
    damage_multiplier REAL,
    effect_type TEXT,
    category TEXT,
    is_legendary BOOLEAN DEFAULT FALSE
);
```

## Webhook Integration for XYIAN Guild

### Guild-Specific Webhook Features
```javascript
// XYIAN Guild webhook integration
const xyianGuildWebhook = new WebhookClient({
    url: process.env.XYIAN_GUILD_WEBHOOK
});

// Send guild announcements
async function sendGuildAnnouncement(title, description, eventType = 'info') {
    const colors = {
        'info': 0x0099ff,
        'success': 0x00ff00,
        'warning': 0xffaa00,
        'error': 0xff0000,
        'event': 0xff6b6b
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`🏰 XYIAN Guild: ${title}`)
        .setDescription(description)
        .setColor(colors[eventType])
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });
    
    await xyianGuildWebhook.send({ embeds: [embed] });
}
```

### Guild Event Notifications
```javascript
// Guild event management
async function notifyGuildEvent(event) {
    const embed = new EmbedBuilder()
        .setTitle('🎯 Guild Event')
        .setDescription(`**${event.name}**`)
        .addFields(
            { name: 'Type', value: event.type, inline: true },
            { name: 'Duration', value: event.duration, inline: true },
            { name: 'Rewards', value: event.rewards, inline: true }
        )
        .setColor(0xff6b6b)
        .setTimestamp();
    
    await xyianGuildWebhook.send({ embeds: [embed] });
}
```

## Game Data Scraping and Updates

### Skills Data Integration
```javascript
// Skills data from Archero 2 Wiki
const skillsData = {
    legendary: [
        { name: 'Revive', description: 'Gain an extra life', effect: 'defensive' },
        { name: 'Tracking Eye', description: 'Projectiles track enemies', effect: 'offensive' }
    ],
    epic: [
        { name: 'Giant\'s Strength', description: '+20% Attack Power', effect: 'buff' },
        { name: 'Front Arrow', description: '+15% Main Weapon DMG', effect: 'buff' }
    ]
};
```

### Equipment Database
```javascript
// Equipment data structure
const equipmentData = {
    weapons: {
        'Dragon Knight Crossbow': {
            tier: 'S',
            type: 'Crossbow',
            special: 'Explosive arrows',
            recommended: true
        },
        'Griffin Claw': {
            tier: 'S',
            type: 'Claw',
            special: 'Multi-hit attacks',
            recommended: true
        }
    },
    gearSets: {
        'Griffin Set': {
            tier: 'S',
            type: 'PvP',
            bonuses: ['+15% Crit Rate', '+20% Attack Speed']
        }
    }
};
```

## Community Engagement Features

### Build Sharing System
```javascript
// Build sharing functionality
async function shareBuild(user, buildData) {
    const embed = new EmbedBuilder()
        .setTitle(`🏗️ Build Share - ${user.username}`)
        .setDescription('Check out this build!')
        .addFields(
            { name: 'Weapon', value: buildData.weapon, inline: true },
            { name: 'Gear Set', value: buildData.gearSet, inline: true },
            { name: 'Power Level', value: buildData.powerLevel.toString(), inline: true },
            { name: 'Skills', value: buildData.skills.join(', '), inline: false }
        )
        .setColor(0x00ff00)
        .setTimestamp();
    
    await xyianGuildWebhook.send({ embeds: [embed] });
}
```

### Guild Challenges
```javascript
// Guild challenge system
const guildChallenges = {
    'weekly-farming': {
        name: 'Weekly Farming Challenge',
        description: 'Farm 1000 items this week',
        reward: 'Guild coins + exclusive title',
        progress: 0,
        target: 1000
    },
    'boss-kills': {
        name: 'Boss Slayer Challenge',
        description: 'Defeat 50 bosses this week',
        reward: 'Rare equipment + guild coins',
        progress: 0,
        target: 50
    }
};
```

## Integration with Existing Discord Features

### Role-Based Access
- **XYIAN OFFICIAL**: Full access to guild features
- **Member**: Basic game info and community features
- **Moderator**: Guild management and event creation

### Channel Organization
```
XYIAN Guild Channels:
├── 🏰 guild-announcements (webhook enabled)
├── ⚔️ guild-strategies
├── 🏆 guild-achievements
├── 📊 guild-stats
└── 🎯 guild-events
```

## Future Enhancements

### Planned Features
1. **Real-time Game Data**: Integration with game APIs
2. **Automated Event Detection**: Monitor game updates
3. **Guild Leaderboards**: Track member progress
4. **Build Optimizer**: Suggest optimal builds
5. **Event Calendar**: Automated event scheduling

### External Integrations
1. **Archero 2 Wiki API**: Real-time data updates
2. **Reddit Integration**: Community discussions
3. **Game Vault API**: Equipment and skill data
4. **Discord Rich Presence**: Show current game activity

## Resources

- [Archero 2 Wiki](https://archero-2.game-vault.net/wiki/Main_Page)
- [Archero 2 FAQ](https://archero-2.game-vault.net/wiki/FAQ)
- [Archero 2 Skills](https://archero-2.game-vault.net/wiki/Skills)
- [Reddit Archero Community](https://www.reddit.com/r/Archero/)
- [Archero Fandom Wiki](https://archero.fandom.com/wiki/Archero_Wiki)
