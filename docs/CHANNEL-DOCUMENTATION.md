# XYIAN Guild Bot - Channel Documentation

## 📋 **Channel Discovery System**

The XYIAN Guild Bot automatically discovers all channels in your Discord server and provides custom functionality for each one based on their purpose and content.

## 🔍 **Channel Types & Purposes**

### **Guild Channels**
- **Purpose**: XYIAN guild management and exclusive content
- **Features**: Daily requirements tracking, member activity monitoring, guild events
- **Commands**: `!help`, `!requirements`, `!activity`, `!boss`, `!donate`, `!inactive`, `!xyian`

### **PvP Channels (Including Umbral Tempest)**
- **Purpose**: PvP strategies, Umbral Tempest event discussions, and combat builds
- **Features**: Build recommendations, event strategies, combat tips and guides
- **Commands**: `!umbral`, `!build [class]`, `!weapon [name]`, `!skill [name]`, `!tips`, `!rewards`

### **Event Channels**
- **Purpose**: Event announcements and community news
- **Features**: Event announcements, reminder system, participation tracking
- **Commands**: `!events`, `!event [name]`, `!remind`

### **Bot Channels**
- **Purpose**: Bot commands and technical support
- **Features**: All bot functionality, technical support, command testing
- **Commands**: `!help`, `!ping`, `!channels`, `!status`, `!info`

### **Help Channels**
- **Purpose**: Help and support for community members
- **Features**: Community assistance, game guidance, technical support
- **Commands**: `!help`, `!faq`, `!guide`

### **General Channels**
- **Purpose**: General community discussions
- **Features**: General discussions, game tips and tricks, community engagement
- **Commands**: `!help`, `!info`, `!channels`

## 🌪️ **Umbral Tempest Event Information**

### **Event Overview**
- **Name**: Umbral Tempest
- **Type**: Challenging PvP event with unique mechanics
- **Duration**: Limited time event
- **Energy**: Uses special event energy
- **Matchmaking**: Skill-based matchmaking system
- **Ranking**: Global leaderboard with seasonal rewards

### **Available Classes**
1. **Dragon Knight**
   - Weapon: Dragon Knight Crossbow
   - Gear: Dragon Knight Set
   - Skills: Tracking Eye, Front Arrow, Giant's Strength
   - Strategy: High damage output with explosive arrows

2. **Griffin**
   - Weapon: Griffin Claw
   - Gear: Griffin Set
   - Skills: Tracking Eye, Multi-shot, Swift Arrow
   - Strategy: Consistent damage with multi-hit attacks

3. **Oracle**
   - Weapon: Oracle Spear
   - Gear: Oracle Set
   - Skills: Tracking Eye, Beam Staff, Revive
   - Strategy: Support and utility focused

4. **Echo**
   - Weapon: Echo Staff
   - Gear: Echo Set
   - Skills: Tracking Eye, Ricochet, Multi-shot
   - Strategy: Area control and crowd management

### **Event Tips**
- Focus on main hand weapon upgrades for maximum DPS
- Tracking Eye is essential for accuracy in PvP
- Position yourself strategically to avoid enemy attacks
- Use terrain to your advantage
- Save your ultimate ability for crucial moments
- Practice dodging and movement patterns
- Learn enemy attack patterns and timing
- Join guild events for better rewards

### **Event Rewards**
- **Daily**: Event Coins, Gems, Equipment
- **Weekly**: Rare Equipment, Runes, Guild Coins
- **Seasonal**: Exclusive Skins, S-Tier Equipment, Legendary Runes

## 🤖 **Bot Commands by Channel Type**

### **Universal Commands**
- `!ping` - Bot status check
- `!help` - View available commands
- `!channels` - List all discovered channels
- `!status` - Bot system status

### **Guild-Specific Commands**
- `!requirements` - Show daily guild requirements
- `!activity` - Check your activity status
- `!boss` - Record boss battle completion
- `!donate` - Record donation made
- `!inactive` - Show inactive members (officers only)
- `!xyian` - Guild information and status

### **PvP/Umbral Tempest Commands**
- `!umbral` - Umbral Tempest event information
- `!build [class]` - Show build for specific class
- `!weapon [name]` - Weapon information
- `!skill [name]` - Skill information
- `!tips` - Umbral Tempest tips
- `!rewards` - Event rewards information

### **Event Commands**
- `!events` - View upcoming events
- `!event [name]` - Event details
- `!remind` - Set event reminder

### **Help Commands**
- `!faq` - Frequently asked questions
- `!guide` - Game guides and tutorials

## 📊 **Channel Discovery Process**

1. **Automatic Discovery**: Bot scans all text channels in the guild
2. **Type Detection**: Determines channel type based on name keywords
3. **Webhook Detection**: Attempts to find webhooks for each channel
4. **Purpose Assignment**: Assigns appropriate purpose and features
5. **Command Routing**: Routes commands based on channel type

## 🔧 **Webhook Integration**

- **General Chat**: Uses provided webhook for announcements
- **XYIAN Guild**: Uses provided webhook for guild-specific content
- **Other Channels**: Attempts to discover existing webhooks
- **Fallback**: Uses direct channel messaging if no webhook available

## 📝 **Documentation Updates**

This documentation is automatically updated when:
- New channels are discovered
- Channel types are determined
- Webhooks are found or created
- New features are added

## 🎯 **Best Practices**

1. **Channel Naming**: Use descriptive names with keywords for better type detection
2. **Webhook Setup**: Create webhooks for channels that need bot announcements
3. **Role Permissions**: Ensure bot has appropriate permissions for each channel
4. **Command Usage**: Use channel-appropriate commands for best results
5. **Regular Updates**: Keep channel purposes and features up to date

## 🔄 **Maintenance**

- Bot automatically discovers new channels when they're created
- Channel types are re-evaluated on bot restart
- Webhook status is checked periodically
- Documentation is updated with new discoveries
