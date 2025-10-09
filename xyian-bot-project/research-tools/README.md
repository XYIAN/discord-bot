# Research Tools Directory

This directory contains all scraping and research tools for the Arch 2 Addicts Discord Bot project. These tools are designed to gather comprehensive game knowledge from various sources.

## Overview

The research tools are organized to scrape data from:
- **Discord Channels**: Official Archero 2 Discord server channels
- **Wiki Pages**: Official Archero 2 wiki content
- **Forum Threads**: Discord forum discussions and theorycrafting posts
- **Community Content**: User-generated guides and discussions

## Tools Available

### Core Scrapers

#### `theorycrafting-posts-scraper.js`
- **Purpose**: Scrapes 28 theorycrafting posts organized by category
- **Categories**: General, PVE, PVP, Events, Other
- **Features**: 
  - Cache clearing and hard refresh
  - 3-minute manual login timer
  - Human-like delays and behavior
  - Category organization
  - Error handling for each post

#### `human-like-forum-scraper.js`
- **Purpose**: Scrapes Discord forum threads with human-like behavior
- **Features**:
  - 3-minute manual login timer
  - Random delays and scrolling
  - Human-like pauses between threads
  - Multiple CSS selector attempts

#### `working-discord-scraper.js`
- **Purpose**: Scrapes Discord channels with manual login support
- **Features**:
  - Manual login timer
  - Discord app navigation
  - Human-like behavior patterns
  - Content extraction from messages

### Knowledge Injectors

#### `ultimate-knowledge-injector.js`
- **Purpose**: Injects scraped Discord channel data into bot knowledge base
- **Features**: Processes JSON data files and updates bot database

#### `complete-knowledge-injector.js`
- **Purpose**: Injects comprehensive Discord channel knowledge
- **Features**: Handles multiple channel data sources

#### `final-knowledge-injector.js`
- **Purpose**: Final knowledge injection from all sources
- **Features**: Consolidates all research data

### Utility Scripts

#### `knowledge-summary-report.js`
- **Purpose**: Generates comprehensive summary of bot knowledge
- **Features**: Shows all scraped data in organized tables

#### `ultimate-knowledge-cleaner.js`
- **Purpose**: Cleans up old, incorrect data files
- **Features**: Removes outdated information and consolidates knowledge base

## Usage

### Prerequisites
```bash
cd research-tools
npm install
```

### Running Scrapers
```bash
# Theorycrafting posts (28 posts, 5 categories)
# Use "begin scrape" command to auto-start this scraper
node theorycrafting-posts-scraper.js

# Forum threads with human-like behavior
node human-like-forum-scraper.js

# Discord channels with manual login
node working-discord-scraper.js
```

### Knowledge Injection
```bash
# Inject scraped data into bot knowledge base
node ultimate-knowledge-injector.js
node complete-knowledge-injector.js
node final-knowledge-injector.js
```

## Data Sources

### Discord Channels (12 channels)
- General discussion channels
- Game update channels
- Q&A channels
- Event-specific channels
- Theorycrafting channels

### Wiki Pages
- Official Archero 2 wiki
- Artifacts system documentation
- Character guides
- Gear and rune information

### Forum Threads
- Theorycrafting discussions
- Build guides
- Event strategies
- PVP tips and arena guides

## Output Files

### Scraped Data
- `theorycrafting-posts-data-*.json`: Theorycrafting posts by category
- `discord-channels-data-*.json`: Discord channel content
- `wiki-data-*.json`: Wiki page content
- `forum-threads-data-*.json`: Forum thread discussions

### Knowledge Base
- `archero_qa_learned.json`: Bot's knowledge database
- `knowledge-summary-*.json`: Comprehensive knowledge reports

## Features

### Human-like Behavior
- Random delays between actions (2-15 seconds)
- Random scrolling patterns
- Realistic pause times
- Manual login support

### Error Handling
- Graceful failure handling
- Retry logic for failed requests
- Progress tracking
- Detailed logging

### Data Organization
- Category-based organization
- URL tracking
- Timestamp logging
- Content validation

## Best Practices

1. **Manual Login**: Always use the 3-minute manual login timer
2. **Human-like Delays**: Use random delays to avoid detection
3. **Cache Clearing**: Start with fresh browser sessions
4. **Error Handling**: Check for cooldown periods and retry
5. **Data Validation**: Verify scraped content before injection

## Troubleshooting

### Common Issues
- **Cooldown Periods**: Wait 10-15 minutes between scraping attempts
- **Login Issues**: Use manual login timer and fresh browser sessions
- **Detection**: Use human-like delays and behavior patterns
- **Data Quality**: Validate scraped content before injection

### Solutions
- Clear browser cache and cookies
- Use hard refresh before scraping
- Implement longer delays between requests
- Check for Discord rate limits

## Integration

All scraped data is automatically integrated into the bot's knowledge base through the knowledge injector scripts. The bot uses this data to provide accurate, community-sourced information to users.

## Maintenance

- Regular updates to scraped data
- Monitoring for new content sources
- Updating scraper logic for Discord changes
- Maintaining human-like behavior patterns