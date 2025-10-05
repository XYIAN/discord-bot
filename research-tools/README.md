# Archero 2 Research Tools

This directory contains research tools for scraping and gathering information about Archero 2. These tools are separate from the main bot deployment and should not be included in Railway builds.

## Tools

- `archero2-wiki-scraper.js` - Scrapes the official Archero 2 wiki pages
- `archero2-discord-scraper.js` - Scrapes the Archero 2 Discord server
- `archero2-info-gatherer.js` - Gathers information from Reddit and other sources

## Usage

```bash
# Install dependencies
npm install

# Scrape wiki pages
npm run scrape-wiki

# Scrape Discord server
npm run scrape-discord

# Gather info from multiple sources
npm run gather-info
```

## Note

These tools use Selenium WebDriver and are for research purposes only. They should not be deployed to production environments.
