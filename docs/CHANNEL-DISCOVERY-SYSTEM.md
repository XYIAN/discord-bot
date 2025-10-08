# Channel Discovery System

This document outlines the automated channel discovery and information extraction system implemented for the Arch 2 Addicts Discord bot.

## 🎯 Overview

The Channel Discovery System allows the bot to automatically extract comprehensive information about Discord channels, including:
- Channel types and configurations
- Available tags (for forum channels)
- Guild information and roles
- Webhook capabilities
- Permission structures

## 🔍 Discovery Process

### 1. Webhook Analysis
When a webhook URL is provided, the system can extract:
```javascript
// Webhook information extraction
const webhookInfo = await fetch(webhookURL, { method: 'GET' });
const data = await webhookInfo.json();

// Extracted data:
{
  channelId: data.channel_id,
  guildId: data.guild_id,
  webhookName: data.name,
  webhookType: data.type,
  avatar: data.avatar
}
```

### 2. Channel Type Detection
```javascript
// Channel type detection
const channelInfo = await getChannelInfo(channelId);
const channelType = getChannelTypeName(channelInfo.type);

// Channel types we can detect:
const CHANNEL_TYPES = {
  0: 'Text Channel',
  1: 'DM',
  2: 'Voice Channel',
  3: 'Group DM',
  4: 'Category',
  5: 'News Channel',
  10: 'News Thread',
  11: 'Public Thread',
  12: 'Private Thread',
  13: 'Stage Channel',
  14: 'Directory',
  15: 'Forum Channel',  // Our main focus
  16: 'Media Channel'
};
```

### 3. Forum Channel Analysis
For forum channels (type 15), we extract:
```javascript
// Forum-specific data
const forumData = {
  name: channelInfo.name,
  availableTags: channelInfo.available_tags,
  defaultTagSetting: channelInfo.default_tag_setting,
  defaultForumLayout: channelInfo.default_forum_layout,
  defaultSortOrder: channelInfo.default_sort_order,
  parentCategory: channelInfo.parent_id,
  position: channelInfo.position
};
```

## 🏷️ Tag System Integration

### Available Tags Structure
```javascript
// Tag information
const tags = channelInfo.available_tags.map(tag => ({
  id: tag.id,
  name: tag.name,
  moderated: tag.moderated,
  emoji: {
    id: tag.emoji_id,
    name: tag.emoji_name
  }
}));
```

### Tag Categories for Arch 2 Addicts
Based on our analysis, the forum channel has these tag categories:

#### **Gear & Equipment Tags**
- `Gear` - General gear discussions
- `Oracle` - Oracle set specific
- `Dragoon` - Dragoon set specific  
- `Griffin` - Griffin set specific

#### **Game Mode Tags**
- `PvP` - Player vs Player content
- `PvE` - Player vs Environment content
- `Farming` - Resource farming strategies
- `Floor Mode` - Floor-based gameplay
- `Endless Modes` - Endless mode strategies
- `Sky Tower Build` - Sky Tower specific builds

#### **Specialized Tags**
- `Runes` - Rune system discussions
- `Supreme Arena` - Supreme Arena strategies

## 🤖 Bot Integration Features

### 1. Smart Message Routing
```javascript
// Route messages based on channel capabilities
function routeMessage(channelId, messageType, content) {
  const channelInfo = getChannelInfo(channelId);
  
  if (channelInfo.type === 15) { // Forum channel
    return {
      method: 'webhook',
      requiresThread: true,
      suggestedTags: findRelevantTags(content, channelInfo.available_tags),
      threadName: generateThreadName(messageType)
    };
  }
  
  return {
    method: 'standard',
    requiresThread: false
  };
}
```

### 2. Dynamic Content Filtering
```javascript
// Filter content based on available tags
function filterContentByTags(content, availableTags) {
  const contentKeywords = extractKeywords(content);
  const relevantTags = availableTags.filter(tag => 
    contentKeywords.some(keyword => 
      tag.name.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  
  return {
    content,
    suggestedTags: relevantTags,
    confidence: relevantTags.length / availableTags.length
  };
}
```

### 3. Guild Role Integration
```javascript
// Extract guild roles for permission management
function extractGuildRoles(guildInfo) {
  return guildInfo.roles.map(role => ({
    id: role.id,
    name: role.name,
    color: role.color,
    position: role.position,
    permissions: role.permissions,
    isManaged: role.managed,
    isMentionable: role.mentionable
  }));
}
```

## 📊 Data Storage Structure

### Channel Cache
```javascript
const channelCache = {
  [channelId]: {
    basicInfo: {
      id: channelId,
      name: channelName,
      type: channelType,
      guildId: guildId
    },
    forumInfo: {
      availableTags: tags,
      defaultSettings: settings,
      parentCategory: parentId
    },
    guildInfo: {
      name: guildName,
      roles: roles,
      features: features
    },
    lastUpdated: timestamp
  }
};
```

### Webhook Registry
```javascript
const webhookRegistry = {
  [webhookId]: {
    url: webhookURL,
    channelId: channelId,
    guildId: guildId,
    name: webhookName,
    capabilities: {
      canPost: true,
      requiresThread: isForumChannel,
      supportsEmbeds: true,
      supportsTags: isForumChannel
    }
  }
};
```

## 🔧 Implementation Examples

### 1. Channel Discovery Command
```javascript
// Discord command to discover channel info
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!discover')) {
    const channelId = message.channel.id;
    const channelInfo = await discoverChannel(channelId);
    
    const embed = new EmbedBuilder()
      .setTitle(`Channel Discovery: ${channelInfo.name}`)
      .addFields(
        { name: 'Type', value: channelInfo.typeName, inline: true },
        { name: 'Guild', value: channelInfo.guildName, inline: true },
        { name: 'Position', value: channelInfo.position.toString(), inline: true }
      );
    
    if (channelInfo.isForum) {
      embed.addField('Available Tags', 
        channelInfo.tags.map(tag => tag.name).join(', '));
    }
    
    await message.reply({ embeds: [embed] });
  }
});
```

### 2. Auto-Tagging System
```javascript
// Automatically suggest tags for forum posts
function suggestTags(content, availableTags) {
  const suggestions = [];
  
  // Check for gear mentions
  if (content.toLowerCase().includes('oracle')) {
    suggestions.push(availableTags.find(tag => tag.name === 'Oracle'));
  }
  
  if (content.toLowerCase().includes('runes')) {
    suggestions.push(availableTags.find(tag => tag.name === 'Runes'));
  }
  
  // Check for game mode mentions
  if (content.toLowerCase().includes('pvp') || content.toLowerCase().includes('arena')) {
    suggestions.push(availableTags.find(tag => tag.name === 'PvP'));
  }
  
  return suggestions.filter(Boolean);
}
```

### 3. Channel Monitoring
```javascript
// Monitor channel changes and update cache
setInterval(async () => {
  for (const [channelId, cachedInfo] of Object.entries(channelCache)) {
    const currentInfo = await getChannelInfo(channelId);
    
    if (currentInfo.last_message_id !== cachedInfo.last_message_id) {
      console.log(`Channel ${channelId} has new activity`);
      // Update cache and handle changes
      updateChannelCache(channelId, currentInfo);
    }
  }
}, 30000); // Check every 30 seconds
```

## 🚀 Future Enhancements

### 1. Machine Learning Integration
- Train models to automatically categorize content
- Predict optimal tags based on content analysis
- Suggest thread names based on content

### 2. Advanced Analytics
- Track channel engagement metrics
- Analyze tag usage patterns
- Generate channel health reports

### 3. Automated Moderation
- Use channel tags for content filtering
- Auto-route messages to appropriate channels
- Implement smart thread management

## 📝 Usage Guidelines

1. **Respect Rate Limits**: Implement proper rate limiting for API calls
2. **Cache Strategically**: Store frequently accessed data to reduce API calls
3. **Handle Errors Gracefully**: Implement proper error handling for API failures
4. **Update Regularly**: Refresh channel information periodically
5. **Monitor Changes**: Track channel modifications and update accordingly

## 🔗 Related Files

- `docs/DISCORD-API-INTEGRATION.md` - Core API integration guide
- `src/services/channelService.js` - Channel discovery service implementation
- `src/services/webhookService.js` - Webhook management service
- `src/utils/channelUtils.js` - Channel utility functions
