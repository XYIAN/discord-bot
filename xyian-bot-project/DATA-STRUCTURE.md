# 📊 Data Structure Documentation

## Overview

The bot uses **CLEAN STRUCTURED GAME DATA** from a single source of truth. All Discord chatter and noisy data has been archived. The bot now provides accurate, specific responses about PVP weapons, builds, and strategies.

## ⚠️ CRITICAL: Data Quality Standards

### ✅ GOOD DATA
- Clean game facts (e.g., "Griffin Claws - S-tier PVP weapon")
- Specific weapon names and ratings
- Complete build strategies
- NO usernames, NO timestamps, NO chat fragments

### ❌ BAD DATA (ARCHIVED)
- Discord chatter: "Awesomethanu Senior Archer 827 AM..."
- Usernames and timestamps
- Incomplete sentences
- Chat noise: "(edited)", "@mentions"

**These have been moved to `data/outdated-data/` and are NOT used by the bot.**

## 🗂️ Data Location

```
xyian-bot-project/
└── data/
    ├── real-structured-data/
    │   └── unified_game_data.json  ← ✅ ONLY ACTIVE DATA SOURCE
    ├── user-training/
    │   ├── training-log.json       ← Training submissions
    │   └── pending-review.json     ← Pending approvals
    └── outdated-data/              ← ❌ ARCHIVED (not used)
        ├── comprehensive-knowledge-base/
        ├── cleaned-database/
        └── structured-tables/
```

## 📋 Data Categories

### 1. ⚔️ Gear Sets

Complete information about all gear sets in Archero 2:

- **Oracle**: Best for PvE and mixed builds
- **Dragoon**: PvP focused, needs mixing with Oracle  
- **Griffin**: Top tier PvP with Thor
- **Mixed Set**: Best overall build at mythic level (ENDGAME)

Each gear set includes:
- Description
- Set bonuses (2-piece, 4-piece)
- Best pieces to use
- Use cases (PvE, PvP, Guild Wars, etc.)
- Pro tips

### 2. 🔮 Runes

All major runes with complete details:

- **Meteor**: Offensive, best for PvP/GvG/Peak Arena
- **Sprite**: Summons, great for Oracle users
- **Circles**: AOE damage, essential for Shackled Jungle
- **Frost**: Elemental control, slows/freezes
- **Poison**: DOT (damage over time)
- **Flame**: Elemental burst
- **Elemental**: Boosts all elemental runes

Each rune includes:
- Type and effect
- Best use cases
- Etched rune information
- Recommended combinations
- Pro tips

### 3. 👥 Characters

Complete character profiles with META information:

- **Thor**: Versatile DPS, F2P friendly
- **Otta**: PvP META powerhouse (2 stars + Nian skin = META)
- **Helix**: PvP resonance character
- **Atreus**: Arena specialist
- **DK**: PvP endgame
- **Loki**: Currently bugged
- **Rolla**: PvE speed clear
- **Nyanja**: PvE support
- **Drac**: Situational

Each character includes:
- Role and description
- Star requirements and priorities
- Skin information and priorities
- Best use cases
- Build recommendations
- Pro tips and notes

### 4. ⚔️ Weapons

Complete weapon information:

- **Crossbow (Xbow)**: #1 priority weapon, mixed set main
- **Bow**: Bounce builds
- **Staff (Oracle Spear)**: Weakest weapon, don't prioritize
- **Scythe**: Situational
- **Claw**: Situational (Peak Arena front row)

Each weapon includes:
- Type and alternative names
- Priority level
- Best uses
- Skin recommendations
- Pro tips

### 5. 🛡️ Blessings

Key blessing information:

- **Lucky Shadow**: Dodge + elemental crit
- **Guardian**: Resilience/damage reduction
- **Revive**: Resurrection chance

### 6. 🎮 Game Modes

Complete strategies for each mode:

- **Peak Arena**: 3v3 team battles
- **Arena**: 1v1 PvP
- **Guild Wars (GvG)**: Guild battles
- **Shackled Jungle**: Special PvE mode
- **Expedition**: Speed clears

Each mode includes:
- Best builds
- Character recommendations
- Rune setups
- Pro tips and strategies

### 7. 💡 Tips System

Priority guides for players:

- **Gear Priority**: What to upgrade first
- **Character Priority**: Who to unlock/level first
- **Skin Priority**: Which skins are worth it
- **Chest Strategy**: Which chests to open
- **F2P Path**: Best progression for free players
- **PvP META**: Current meta rankings
- **Resource Farming**: Where to get materials
- **What NOT to waste resources on**

## 🤖 How The Bot Uses This Data

### 1. Working RAG System (`working-rag-system.js`)

The bot uses a Retrieval-Augmented Generation (RAG) system to:

1. **Search**: Identify what the user is asking about (gear, runes, characters, etc.)
2. **Retrieve**: Pull the relevant structured data from `unified_game_data.json`
3. **Format**: Present it in a readable, helpful format with PVP ratings
4. **Respond**: Send accurate, fact-based answers (NO Discord chatter)

### 2. Quality Validation (`validate-data-quality.js`)

Before deployment, data is validated for:
- NO Discord usernames or timestamps
- NO chat fragments
- Complete, structured information
- Proper JSON format

Run validation: `node validate-data-quality.js`
Target score: **100/100**

### 2. Response Format

Bot responses include:
- **Category type** (gear_set, rune, character, etc.)
- **Name and description**
- **Key details** (effects, bonuses, use cases)
- **Pro tips** from expert players
- **Related information**

### 3. Example Queries

- "What's the best gear set?" → Returns Mixed Set info
- "Tell me about meteor runes" → Returns Meteor rune details
- "How do I build Thor?" → Returns Thor character profile
- "Best PvP build" → Returns Arena/Peak Arena strategies
- "Oracle vs Dragoon" → Returns both gear sets for comparison

## 📝 Data Quality

### Source

All data is **hand-curated** from:
- Expert player conversations
- Wiki information
- Verified game mechanics
- Community consensus

### Accuracy

- ✅ **No Discord chat noise** - Only facts
- ✅ **No opinions or speculation** - Just game data
- ✅ **Current META** - Up-to-date information
- ✅ **Verified** - Cross-referenced with multiple sources

### Maintenance

Data can be easily updated by editing `unified_game_data.json`:

1. Add new characters/gear/runes as they're released
2. Update META information when game changes
3. Add new strategies as discovered
4. Fix errors or add missing information

## 🎓 Training System

### Owner-Only Discord Commands

Train the bot directly from Discord:

- `/train` - Add new game information
- `/correct` - Fix incorrect bot responses
- `/training-stats` - View training statistics
- `/pending-reviews` - See what's waiting for approval

### Local Training CLI

```bash
node training-system.js
```

Interactive menu for:
1. Add training data
2. View pending reviews
3. Approve entries
4. Reject entries
5. View statistics

### Training Flow

1. **Submit** - Owner adds data via Discord or CLI
2. **Validate** - Automatic quality check (no Discord chatter)
3. **Review** - Stored in `pending-review.json`
4. **Approve** - Merged into `unified_game_data.json`
5. **Deploy** - Bot uses new data immediately

## 🔧 Technical Details

### File Format

```json
{
  "gear_sets": { ... },
  "runes": { ... },
  "characters": { ... },
  "weapons": { ... },
  "blessings": { ... },
  "game_modes": { ... },
  "tips": { ... }
}
```

### Schema

Each entry follows a consistent schema:
- **name**: Unique identifier
- **description**: What it is
- **details**: Specific information (varies by type)
- **best_for**: Use cases
- **note**: Pro tips

### Stats

Current data count:
- **Gear Sets**: 4 (Oracle, Dragoon, Griffin, Mixed)
- **Runes**: 7 (Meteor, Sprite, Circles, etc.)
- **Characters**: 9 (Thor, Otta, Helix, etc.)
- **Weapons**: 5 (Xbow, Bow, Staff, etc.)
- **Game Modes**: 5 (Peak Arena, Arena, GvG, etc.)
- **Tips**: Multiple categories

**Total: ~40 high-quality structured entries** (vs 1,367 Discord chat messages before)

## 🎯 Benefits

### For Players
- **Accurate answers** - No more "I don't know" responses
- **Quick information** - Get facts fast
- **META guidance** - Know what's best
- **Resource optimization** - Don't waste materials

### For Development
- **Easy to maintain** - Edit one JSON file
- **Easy to extend** - Add new categories/entries
- **Fast queries** - Structured data = instant searches
- **No noise** - Clean data = clean responses

### For Railway Deployment
- **Small file size** - Just one JSON file
- **Fast loading** - Instant startup
- **No external dependencies** - All data included
- **Reliable** - No API calls or scraping needed

## 🚀 Future Enhancements

Potential additions:
- Damage calculator integration
- Drop rate information
- Event schedules
- Guild requirements
- Equipment upgrade costs
- Skill descriptions
- Boss mechanics
- Achievement guides

All can be added by extending `unified_game_data.json` with new categories!



