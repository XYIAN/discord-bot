# 🔬 Research Tools Directory

## Purpose

This directory contains all scraping, extraction, and data processing tools used to gather and clean Archero 2 data from various sources.

## ⚠️ Important Note

**These tools are for DATA COLLECTION only. The bot does NOT use these files at runtime.**

The bot uses only: `../data/real-structured-data/unified_game_data.json`

## 📂 Directory Structure

### Main Scrapers

- **`ultimate-comprehensive-scraper.js`** - Master scraper for all sources
- **`theorycrafting-posts-scraper.js`** - Discord theorycrafting channel scraper
- **`robust-theria-scraper.js`** - Theria Games Wiki scraper
- **`comprehensive-discord-wiki-scraper.js`** - Combined Discord + Wiki scraper

### Discord Scrapers

Multiple iterations of Discord scrapers:
- `discord-scraper.js`, `discord-real-scraper.js`, `working-discord-scraper.js`
- `all-discord-channels-scraper.js`, `complete-discord-scraper.js`
- `theorycrafting-posts-scraper.js` - **Most reliable Discord scraper**

### Wiki Scrapers

- `archero2-wiki-scraper.js` - Early wiki scraper
- `archero2-official-wiki-scraper.js` - Official wiki scraper
- `robust-theria-scraper.js` - **Most reliable wiki scraper**
- `theria-wiki-sitemap-scraper.js` - Sitemap-based scraper

### Data Processors

- `comprehensive-data-extractor.py` - Python data extraction
- `advanced-data-extractor.js` - JavaScript data extraction
- `data-quality-auditor.js` - Data quality checking
- `comprehensive-data-cleaner.js` - Data cleaning

### Knowledge Injectors

Scripts to inject scraped data into the bot's knowledge base:
- `ultimate-knowledge-injector.js`
- `complete-knowledge-injector.js`
- Various specialized injectors

## 📦 Raw Scraped Data

The `raw-scraped-data/` directory contains organized scraping outputs:

```
raw-scraped-data/
├── discord-theorycrafting/    - Theorycrafting posts
├── discord-additional-channels/ - Other Discord channels
├── wiki-pages/                - Wiki page content
├── theria-games-wiki/         - Theria wiki data
├── reddit/                    - Reddit posts (if scraped)
├── bluestacks/                - BlueStacks guides (if scraped)
└── damage-calculator/         - Damage calc data (if scraped)
```

## 🔧 How to Use

### Run a Scraper

```bash
# Scrape Discord theorycrafting channel (5 min manual login timer)
node theorycrafting-posts-scraper.js

# Scrape Theria Games Wiki
node robust-theria-scraper.js

# Scrape everything (comprehensive)
node ultimate-comprehensive-scraper.js
```

### Extract Data

```bash
# Extract structured data with Python
cd /Users/kyle/code/discord-bot/xyian-bot-project
python3 research-tools/comprehensive-data-extractor.py

# Or use JavaScript extractor
node research-tools/advanced-data-extractor.js
```

### Process and Clean

```bash
# Clean extracted data
node research-tools/comprehensive-data-cleaner.js

# Audit data quality
node research-tools/data-quality-auditor.js
```

## 📊 Scraping Sources

1. **Discord - Theorycrafting Channel** (Primary source)
   - Expert player discussions
   - META strategies
   - Character/gear analysis

2. **Theria Games Wiki** (Secondary source)
   - Official game data
   - Stats and mechanics
   - Item descriptions

3. **Reddit** (Optional)
   - Community discussions
   - Guide posts

4. **BlueStacks Guides** (Optional)
   - External guides

5. **Google Sheets** (Optional)
   - Community spreadsheets

## ⚙️ Dependencies

All scrapers require:
```bash
npm install
```

Key packages:
- `selenium-webdriver` - Browser automation
- `chromedriver` - Chrome driver for Selenium
- `axios` - HTTP requests
- `cheerio` - HTML parsing
- `puppeteer` - Alternative browser automation

## 🎯 Current Status

**Data Collection**: ✅ Complete
- Scraped 1,367+ Discord messages
- Scraped Theria Games Wiki pages
- Organized by category

**Data Cleaning**: ✅ Complete
- Extracted facts from conversations
- Created structured data
- Removed Discord chat noise

**Bot Integration**: ✅ Complete
- Bot uses `unified_game_data.json`
- Clean, structured facts only

## 🚀 Future Scraping

To update data in the future:

1. Run scrapers to get fresh data
2. Review `raw-scraped-data/` outputs
3. Extract new facts manually or with Python
4. Update `../data/real-structured-data/unified_game_data.json`
5. Restart bot

## 📝 Notes

- **Manual Login**: Discord scrapers require manual login (5 min timer)
- **Rate Limits**: Use human-like delays to avoid rate limits
- **Data Quality**: Always manually review extracted data before adding to bot
- **Selenium**: Requires Chrome/Chromium installed

## 🔗 Related Files

- Main bot: `../ultimate-xyian-bot.js`
- RAG system: `../working-rag-system.js`
- Active data: `../data/real-structured-data/unified_game_data.json`
- Data docs: `../DATA-STRUCTURE.md`

---

**Remember**: These are research tools. The bot doesn't run these at runtime!
