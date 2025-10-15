# 📊 Data Directory Structure

## 🎯 ACTIVE DATA (Used by Bot)

### `real-structured-data/`
**STATUS**: ✅ **PRODUCTION - BOT USES THIS**

Contains the clean, structured game data that the bot actively uses:

- **`unified_game_data.json`** - Single source of truth for all game information
  - Gear sets (Oracle, Dragoon, Griffin, Mixed)
  - Runes (Meteor, Sprite, Circles, Frost, etc.)
  - Characters (Thor, Otta, Helix, etc.)
  - Weapons (Xbow, Bow, Staff, etc.)
  - Game modes (Peak Arena, Arena, GvG, Shackled Jungle)
  - Pro tips and strategies

**Size**: ~40 high-quality structured entries  
**Format**: Clean JSON with consistent schema  
**Quality**: Hand-curated facts from expert players  

---

## 📦 ARCHIVED DATA (Reference Only)

These directories contain old/intermediate data from the scraping and cleaning process. The bot does NOT use these files. They're kept for reference and future data extraction.

### `cleaned-database/`
**STATUS**: 🔄 Intermediate processing step

Contains partially cleaned data from Python cleaning pipeline:
- `clean-archero-database.json` - Still contains Discord chat noise
- `builds.json`, `characters.json`, `gear_sets.json`, `runes.json`, etc. - Extracted but noisy
- `quality-report.json` - Shows data quality metrics

**Issue**: Still had too much Discord chat content, not fully structured.

### `comprehensive-knowledge-base/`
**STATUS**: 📚 Raw scraped content organized by category

Contains categorized Discord chat and wiki data:
- `boss_guides.json`, `character_stats.json`, `damage_calculations.json`, etc.
- `comprehensive-knowledge-base.json` - All 1,367 entries combined

**Issue**: Good organization but still raw Discord messages, not structured facts.

### `structured-tables/`
**STATUS**: 📊 CSV extraction attempt

Contains CSV tables extracted from raw data:
- `character_table.csv`, `gear_table.csv`, `rune_table.csv`, `upgrade_materials_table.csv`

**Issue**: Incomplete extraction, missing many details.

### `outdated-data/`
**STATUS**: 🗑️ Old/incorrect data

Previously identified as outdated or incorrect.

---

## 📝 REFERENCE FILES (Bot Runtime)

These files are used by the bot for learning and analytics:

- **`archero_qa_learned.json`** - AI learning from user feedback
- **`bot_analytics.json`** - Bot usage statistics
- **`feedback_analysis.json`** - User feedback analysis
- **`learning_data.json`** - AI learning data

---

## 🗄️ RAW SCRAPED DATA (Archive)

Raw scraping outputs preserved for future processing:

- `non-discord-scraped-data-*.json` - Wiki scrapes
- `robust-theria-scraped-data-*.json` - Theria wiki scrapes
- `theria-all-urls-*.json` - URL collections
- `theria-filtered-urls.json` - Filtered URL lists
- `theria-nested-routes-data-*.json` - Nested route data

---

## 🔄 LEGACY FILES

Old data files from previous iterations:

- `corrected-resonance-info.json` - Manual corrections (may be outdated)
- `damage-calculator-info.json` - Damage calc data (needs verification)
- `high-quality-tips.json` - Tips collection (superseded by unified data)
- `real-archero2-facts.json` - Early fact extraction attempt
- `cleaned-real-facts.json` - Early cleaning attempt
- `knowledge-graph.json` - Graph structure attempt
- `rag-integration.json` - Old RAG format
- `structured-knowledge-base.json` - Old structure format

---

## 🚀 For Developers

### What the Bot Uses
```javascript
// In working-rag-system.js
this.dataPath = path.join(__dirname, 'data', 'real-structured-data', 'unified_game_data.json');
```

The bot ONLY loads `real-structured-data/unified_game_data.json`.

### To Update Game Data
1. Edit `real-structured-data/unified_game_data.json`
2. Add/update entries in the appropriate category
3. Restart bot to reload data

### Data Schema
```json
{
  "gear_sets": { "name": { "description": "", "best_for": [], "note": "" } },
  "runes": { "name": { "type": "", "effect": "", "best_for": [], "note": "" } },
  "characters": { "name": { "role": "", "stars_needed": "", "best_for": [], "note": "" } },
  "weapons": { "name": { "type": "", "best_for": [], "note": "" } },
  "blessings": { "name": { "effect": "", "note": "" } },
  "game_modes": { "name": { "best_build": {}, "note": "" } },
  "tips": { "category": "value" }
}
```

---

## 📊 Data Evolution

1. **Phase 1**: Raw scraping → comprehensive-knowledge-base/ (1,367 Discord messages)
2. **Phase 2**: Python cleaning → cleaned-database/ (still too noisy)
3. **Phase 3**: Manual curation → real-structured-data/ (40 clean facts) ✅

**Current Status**: Phase 3 complete. Bot uses clean structured data.

---

## 🧹 Future Cleanup

Safe to delete (if space is needed):
- `cleaned-database/` - Superseded by real-structured-data
- `comprehensive-knowledge-base/` - Raw data, keep for reference but not essential
- `structured-tables/` - Incomplete extraction
- Most legacy JSON files in root data directory

**Keep**:
- `real-structured-data/` - **REQUIRED FOR BOT**
- `archero_qa_learned.json` - Bot learning
- `bot_analytics.json` - Analytics
- `feedback_analysis.json` - Feedback
- `learning_data.json` - Learning data
- Raw scraped data (for future re-extraction if needed)

---

## 📞 Questions?

- **Where is the bot's data?** → `real-structured-data/unified_game_data.json`
- **How do I add new info?** → Edit unified_game_data.json
- **Why so many directories?** → Historical evolution, most are archives
- **Can I delete old data?** → Yes, but keep real-structured-data/ and learning files

