# XYIAN Bot Knowledge Base Documentation

## Overview

The XYIAN Bot uses a comprehensive knowledge base system that extracts and organizes real game data from community sources. **No hardcoded responses or fallbacks are used** - all answers come from the actual scraped and processed data.

## Data Architecture

### 1. Raw Scraped Data Location
```
research-tools/raw-scraped-data/
├── discord-theorycrafting/     # 28 Discord theorycrafting posts
├── discord-additional-channels/ # 10 additional Discord channels  
├── wiki-pages/                 # 5 game-vault.net wiki pages
├── theria-games-wiki/          # 217+ Theria Games wiki pages
├── reddit/                     # 3 Reddit r/ArcheroV2 pages
├── bluestacks/                 # 1 BlueStacks guide
└── damage-calculator/          # 1 Google Sheets damage calculator
```

### 2. Processed Knowledge Base Location
```
data/comprehensive-knowledge-base/
├── comprehensive-knowledge-base.json  # Main knowledge base file
├── extraction-summary.json           # Extraction statistics
├── upgrade_requirements.json         # 32 upgrade requirements
├── dragoon_guides.json              # 226 Dragoon build guides
├── boss_guides.json                 # 140 boss encounter guides
├── events_modes.json                # 43 events & game modes
├── rune_mechanics.json              # 181 rune effects & bonuses
├── gear_details.json                # 240 gear & equipment stats
├── talent_cards.json                # 102 talent card effects
├── damage_calculations.json         # 127 damage formulas
├── character_stats.json             # 103 character abilities
├── pvp_strategies.json              # 75 PvP & arena strategies
└── pve_strategies.json              # 98 PvE & chapter guides
```

## Knowledge Base Categories

### High Priority Categories (1,269 entries)

#### 1. **Dragoon Build Guides** (226 entries)
- **Location**: `data/comprehensive-knowledge-base/dragoon_guides.json`
- **Content**: Build strategies, gear recommendations, PvP tactics
- **Source**: Discord theorycrafting posts, community discussions
- **Keywords**: dragoon, crossbow, pvp, build, strategy, gear

#### 2. **Gear & Equipment Details** (240 entries)
- **Location**: `data/comprehensive-knowledge-base/gear_details.json`
- **Content**: Weapon stats, armor sets, equipment bonuses
- **Source**: Wiki pages, community guides, theorycrafting
- **Keywords**: weapon, armor, gear, stats, oracle, griffin, dragoon

#### 3. **Rune Mechanics & Bonuses** (181 entries)
- **Location**: `data/comprehensive-knowledge-base/rune_mechanics.json`
- **Content**: Rune effects, bonuses, resonance combinations
- **Source**: Community discussions, wiki data
- **Keywords**: rune, etched, bonus, effect, resonance, synergy

#### 4. **Boss Guides & Encounters** (140 entries)
- **Location**: `data/comprehensive-knowledge-base/boss_guides.json`
- **Content**: Boss strategies, attack patterns, encounter guides
- **Source**: Discord guides, community strategies
- **Keywords**: boss, shackled jungle, encounter, strategy, fight

#### 5. **Damage Calculations & Formulas** (127 entries)
- **Location**: `data/comprehensive-knowledge-base/damage_calculations.json`
- **Content**: Damage formulas, DPS calculations, crit mechanics
- **Source**: Community research, wiki data, damage calculator
- **Keywords**: damage, formula, dps, calculation, crit, multiplier

#### 6. **Character Stats & Abilities** (103 entries)
- **Location**: `data/comprehensive-knowledge-base/character_stats.json`
- **Content**: Character abilities, stats, resonance effects
- **Source**: Wiki data, community guides
- **Keywords**: character, thor, otta, helix, ability, stats

#### 7. **PvP & Arena Strategies** (75 entries)
- **Location**: `data/comprehensive-knowledge-base/pvp_strategies.json`
- **Content**: Arena builds, PvP tactics, team compositions
- **Source**: Discord discussions, community strategies
- **Keywords**: pvp, arena, strategy, build, team, composition

#### 8. **Events & Game Modes** (43 entries)
- **Location**: `data/comprehensive-knowledge-base/events_modes.json`
- **Content**: Shackled Jungle, events, special modes, schedules
- **Source**: Discord event channels, community guides
- **Keywords**: event, shackled jungle, mode, schedule, reward

#### 9. **Upgrade Requirements & Resources** (32 entries)
- **Location**: `data/comprehensive-knowledge-base/upgrade_requirements.json`
- **Content**: Resource costs, material requirements, upgrade paths
- **Source**: Community research, wiki data
- **Keywords**: upgrade, cost, require, resource, material, gold

### Medium Priority Categories (200 entries)

#### 10. **PvE Strategies & Chapters** (98 entries)
- **Location**: `data/comprehensive-knowledge-base/pve_strategies.json`
- **Content**: Chapter guides, PvE builds, farming strategies
- **Source**: Community guides, Discord discussions
- **Keywords**: pve, chapter, guide, farm, strategy, build

#### 11. **Talent Cards & Abilities** (102 entries)
- **Location**: `data/comprehensive-knowledge-base/talent_cards.json`
- **Content**: Talent card effects, abilities, skill descriptions
- **Source**: Wiki data, community guides
- **Keywords**: talent, card, ability, skill, effect, passive

## Data Processing Pipeline

### 1. **Scraping Phase**
- **Tool**: `research-tools/comprehensive-single-session-scraper.js`
- **Sources**: 265+ URLs across Discord, wikis, Reddit, guides
- **Output**: Raw scraped data in `research-tools/raw-scraped-data/`

### 2. **Extraction Phase**
- **Tool**: `research-tools/advanced-data-extractor.js`
- **Process**: Pattern matching, noise filtering, categorization
- **Output**: Cleaned, categorized data in `data/comprehensive-knowledge-base/`

### 3. **RAG Integration**
- **Tool**: `ultimate-rag-system.js`
- **Process**: Intelligent search, confidence scoring, response generation
- **Output**: Contextual responses from knowledge base

## Data Quality & Filtering

### Noise Removal
- ❌ Usernames and timestamps
- ❌ Discord reactions and emojis
- ❌ Chat noise ("lol", "haha", etc.)
- ❌ Off-topic discussions
- ❌ Duplicate information

### Fact Extraction
- ✅ Game mechanics and stats
- ✅ Build strategies and guides
- ✅ Upgrade requirements and costs
- ✅ Boss encounter strategies
- ✅ Event information and schedules
- ✅ Damage calculations and formulas

## Usage in Bot

### RAG System Integration
```javascript
const UltimateRAGSystem = require('./ultimate-rag-system');
const ragSystem = new UltimateRAGSystem();

// Generate response from knowledge base
const response = ragSystem.generateResponse(userQuery, username);
```

### Search Capabilities
- **Category-specific search**: Target specific knowledge areas
- **Confidence scoring**: Rank results by relevance
- **Multi-word matching**: Handle complex queries
- **Context awareness**: Understand game terminology

### Response Generation
- **No hardcoded responses**: All answers from real data
- **Source attribution**: Track data origin
- **Confidence indicators**: Show response reliability
- **Related information**: Provide additional context

## Maintenance & Updates

### Adding New Data
1. Run scraper: `node research-tools/comprehensive-single-session-scraper.js`
2. Extract data: `node research-tools/advanced-data-extractor.js`
3. Restart bot to load new knowledge base

### Monitoring Data Quality
- Check `data/comprehensive-knowledge-base/extraction-summary.json`
- Monitor bot responses for accuracy
- Update extraction patterns as needed

### Data Validation
- All entries have confidence scores
- Source tracking for verification
- Category-based organization
- Regular quality audits

## Statistics

- **Total Entries**: 1,367
- **Categories**: 11
- **High Priority**: 1,269 entries
- **Medium Priority**: 200 entries
- **Sources**: 265+ URLs
- **Data Size**: ~3MB raw, ~1MB processed

## File Locations Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| **RAG System** | `ultimate-rag-system.js` | Main knowledge search engine |
| **Knowledge Base** | `data/comprehensive-knowledge-base/` | Processed game data |
| **Raw Data** | `research-tools/raw-scraped-data/` | Original scraped content |
| **Extractor** | `research-tools/advanced-data-extractor.js` | Data processing tool |
| **Scraper** | `research-tools/comprehensive-single-session-scraper.js` | Web scraping tool |
| **Documentation** | `KNOWLEDGE-BASE-DOCUMENTATION.md` | This file |

---

**Last Updated**: 2025-01-07
**Version**: 2.0.0
**Status**: Active - No hardcoded fallbacks, RAG-only responses
