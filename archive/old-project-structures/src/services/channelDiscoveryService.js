/**
 * Discord Channel Discovery Service
 * 
 * This service provides comprehensive channel information extraction
 * and analysis capabilities for the Arch 2 Addicts Discord bot.
 */

const fetch = require('node-fetch');

class ChannelDiscoveryService {
  constructor(botToken) {
    this.token = botToken;
    this.baseURL = 'https://discord.com/api/v10';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive channel information
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<Object>} Channel information object
   */
  async getChannelInfo(channelId) {
    // Check cache first
    if (this.cache.has(channelId)) {
      const cached = this.cache.get(channelId);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseURL}/channels/${channelId}`, {
        headers: {
          'Authorization': `Bot ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and enhance the data
      const enhancedData = this.enhanceChannelData(data);
      
      // Cache the result
      this.cache.set(channelId, {
        data: enhancedData,
        timestamp: Date.now()
      });

      return enhancedData;
    } catch (error) {
      console.error(`Error fetching channel info for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get guild information
   * @param {string} guildId - Discord guild ID
   * @returns {Promise<Object>} Guild information object
   */
  async getGuildInfo(guildId) {
    try {
      const response = await fetch(`${this.baseURL}/guilds/${guildId}`, {
        headers: {
          'Authorization': `Bot ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching guild info for ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze webhook and extract channel information
   * @param {string} webhookURL - Discord webhook URL
   * @returns {Promise<Object>} Webhook and channel analysis
   */
  async analyzeWebhook(webhookURL) {
    try {
      const response = await fetch(webhookURL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Webhook Error: ${response.status} ${response.statusText}`);
      }

      const webhookData = await response.json();
      
      // Get additional channel and guild info
      const channelInfo = await this.getChannelInfo(webhookData.channel_id);
      const guildInfo = await this.getGuildInfo(webhookData.guild_id);

      return {
        webhook: webhookData,
        channel: channelInfo,
        guild: guildInfo,
        analysis: this.analyzeChannelCapabilities(channelInfo)
      };
    } catch (error) {
      console.error(`Error analyzing webhook ${webhookURL}:`, error);
      throw error;
    }
  }

  /**
   * Enhance channel data with additional processing
   * @param {Object} channelData - Raw channel data from API
   * @returns {Object} Enhanced channel data
   */
  enhanceChannelData(channelData) {
    const enhanced = { ...channelData };
    
    // Add channel type name
    enhanced.typeName = this.getChannelTypeName(channelData.type);
    
    // Add forum-specific enhancements
    if (channelData.type === 15) { // Forum channel
      enhanced.isForum = true;
      enhanced.tagCategories = this.categorizeTags(channelData.available_tags || []);
      enhanced.forumSettings = {
        defaultTagSetting: channelData.default_tag_setting,
        defaultForumLayout: channelData.default_forum_layout,
        defaultSortOrder: channelData.default_sort_order
      };
    } else {
      enhanced.isForum = false;
    }

    // Add capability flags
    enhanced.capabilities = this.determineChannelCapabilities(channelData);

    return enhanced;
  }

  /**
   * Get human-readable channel type name
   * @param {number} type - Channel type number
   * @returns {string} Channel type name
   */
  getChannelTypeName(type) {
    const types = {
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
      15: 'Forum Channel',
      16: 'Media Channel'
    };
    return types[type] || 'Unknown';
  }

  /**
   * Categorize forum tags for better organization
   * @param {Array} tags - Available tags array
   * @returns {Object} Categorized tags
   */
  categorizeTags(tags) {
    const categories = {
      gear: [],
      gameModes: [],
      specialized: []
    };

    tags.forEach(tag => {
      const name = tag.name.toLowerCase();
      
      if (['gear', 'oracle', 'dragoon', 'griffin'].includes(name)) {
        categories.gear.push(tag);
      } else if (['pvp', 'pve', 'farming', 'floor mode', 'endless modes', 'sky tower build'].includes(name)) {
        categories.gameModes.push(tag);
      } else if (['runes', 'supreme arena'].includes(name)) {
        categories.specialized.push(tag);
      }
    });

    return categories;
  }

  /**
   * Determine channel capabilities
   * @param {Object} channelData - Channel data
   * @returns {Object} Capability flags
   */
  determineChannelCapabilities(channelData) {
    return {
      canPostMessages: true,
      canPostEmbeds: true,
      canPostFiles: true,
      requiresThread: channelData.type === 15, // Forum channels
      supportsTags: channelData.type === 15 && channelData.available_tags?.length > 0,
      supportsReactions: true,
      supportsPins: true,
      isVoiceChannel: channelData.type === 2,
      isForumChannel: channelData.type === 15,
      isTextChannel: [0, 5].includes(channelData.type)
    };
  }

  /**
   * Analyze channel capabilities for bot integration
   * @param {Object} channelInfo - Enhanced channel information
   * @returns {Object} Analysis results
   */
  analyzeChannelCapabilities(channelInfo) {
    const analysis = {
      recommendedUse: [],
      limitations: [],
      features: [],
      webhookRequirements: {}
    };

    if (channelInfo.isForum) {
      analysis.recommendedUse.push('Structured discussions', 'Build sharing', 'Strategy guides');
      analysis.features.push('Tag-based organization', 'Thread management');
      analysis.webhookRequirements.requiresThread = true;
      analysis.webhookRequirements.supportsTags = true;
    }

    if (channelInfo.type === 0 || channelInfo.type === 5) {
      analysis.recommendedUse.push('General chat', 'Announcements', 'Quick questions');
      analysis.features.push('Direct messaging', 'Embed support');
    }

    if (channelInfo.type === 2) {
      analysis.recommendedUse.push('Voice coordination', 'Team communication');
      analysis.limitations.push('No text messaging', 'Voice only');
    }

    return analysis;
  }

  /**
   * Get channel tags for forum channels
   * @param {string} channelId - Channel ID
   * @returns {Promise<Array>} Available tags
   */
  async getChannelTags(channelId) {
    const channelInfo = await this.getChannelInfo(channelId);
    return channelInfo.available_tags || [];
  }

  /**
   * Find relevant tags for content
   * @param {string} content - Content to analyze
   * @param {Array} availableTags - Available tags
   * @returns {Array} Relevant tags
   */
  findRelevantTags(content, availableTags) {
    const contentLower = content.toLowerCase();
    const relevantTags = [];

    availableTags.forEach(tag => {
      const tagName = tag.name.toLowerCase();
      
      // Direct name match
      if (contentLower.includes(tagName)) {
        relevantTags.push(tag);
        return;
      }

      // Keyword matching
      const keywords = this.getTagKeywords(tagName);
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        relevantTags.push(tag);
      }
    });

    return relevantTags;
  }

  /**
   * Get keywords for tag matching
   * @param {string} tagName - Tag name
   * @returns {Array} Keywords
   */
  getTagKeywords(tagName) {
    const keywordMap = {
      'gear': ['equipment', 'weapon', 'armor', 'item'],
      'runes': ['rune', 'enhancement', 'blessing'],
      'pvp': ['player vs player', 'arena', 'battle', 'combat'],
      'pve': ['player vs environment', 'campaign', 'adventure'],
      'farming': ['farm', 'grind', 'resource', 'gold', 'xp'],
      'oracle': ['oracle set', 'oracle gear'],
      'dragoon': ['dragoon set', 'dragoon gear'],
      'griffin': ['griffin set', 'griffin gear'],
      'supreme arena': ['supreme', 'arena', 'competitive']
    };

    return keywordMap[tagName] || [];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = ChannelDiscoveryService;
