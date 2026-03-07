# Knowledge Base Guide

How to add, update, and maintain data in `data/knowledge.json` — the single source of truth for everything Arch AI knows.

## Structure

`knowledge.json` is a flat JSON object with top-level categories. Each category holds structured entries or simple key-value pairs.

### Current Categories

| Category | Description | Status |
|----------|-------------|--------|
| `star_system` | Star pattern, shard costs, skill level unlocks | Complete |
| `resonance` | How resonance works, unlock stars, examples | Complete |
| `characters` | All 17 characters with skills, stats, levels | Complete |
| `pvp_meta` | Resonance combos ranked S-tier to budget F2P | Active |
| `skins` | Character skins with abilities (placeholder) | Needs data |
| `gold` | Currency uses, gear levels vs tiers | Active |
| `gear_sets` | Gear set bonuses and pairings | Empty |
| `weapons` | Weapon stats and recommendations | Empty |
| `runes` | Rune effects and combinations | Empty |
| `blessings` | Blessing descriptions and strategies | Empty |
| `game_modes` | PvE, PvP, events, expeditions | Empty |
| `tips` | General gameplay tips | Empty |
| `skills` | In-game skills (not character skills) | Started |
| `resources` | Useful links and references | Started |
| `privilege_cards` | Premium cards and their benefits | Active |
| `custom_facts` | One-off facts added via `!addfact` | Active |

## How to Add Data

### 1. Adding a new entry to an existing category

Open `data/knowledge.json` and add your entry under the right category. Follow the existing format for that category.

**Example — adding a weapon:**
```json
"weapons": {
  "griffin_claws": {
    "name": "Griffin Claws",
    "type": "melee",
    "gear_set": "Griffin",
    "best_for": ["PvP", "close range builds"],
    "note": "Broken OP at chaotic tier with full Griffin set"
  }
}
```

### 2. Adding a new character

Follow the exact format used by existing characters:

```json
"new_character": {
  "rarity": "rare|epic|legendary",
  "aka": ["nickname1", "nickname2"],
  "skill_name": "Skill Name",
  "stat_boost": "[All] Stat +X% (at stars 1, 4, and 7)",
  "skill_levels": {
    "1": "Description of skill level 1 (unlocked at 0 stars / just owning)",
    "2": "Description of skill level 2 (unlocked at 2 stars)",
    "3": "Description of skill level 3 (unlocked at 5 stars)",
    "4": "Description of skill level 4 (unlocked at 7 stars)"
  },
  "note": "Optional — any important context"
}
```

**Key:** Use lowercase with underscores for the key name (e.g. `demon_king_atreus`).

### 3. Adding a custom fact

Custom facts are simple text entries in the `custom_facts` array:

```json
"custom_facts": [
  {
    "text": "The first guild donation of the day is free.",
    "added_by": "username",
    "added_at": "2026-03-01"
  }
]
```

These are also added live by users via `!addfact` — see [Fact Sync Workflow](#fact-sync-workflow) below.

### 4. Adding a new category

If the data doesn't fit an existing category, add a new top-level key:

```json
"new_category": {
  "entry_name": {
    "description": "What this is",
    "details": "Specific info"
  }
}
```

The bot will automatically pick it up — `knowledgeAsText()` iterates all top-level keys.

## Data Quality Rules

**Always:**
- Use specific, verified in-game data
- Include all relevant fields for the category
- Use complete sentences for descriptions
- Include aliases in `aka` arrays for characters
- Double-check JSON syntax before saving

**Never:**
- Add Discord usernames or chat fragments
- Add timestamps from Discord messages
- Guess or assume — if unsure, leave it out
- Add duplicate entries
- Break existing JSON structure

## Fact Sync Workflow

Users add facts via `!addfact` on the live bot, stored in `knowledge.json` on Railway. Since Railway can wipe the filesystem on redeploy, these need to be synced to the repo:

1. Read the live bot's custom facts via Discord API
2. Review and structure the data — move raw facts into proper categories when possible
3. Add them to `data/knowledge.json` in the repo
4. Post a sync summary to **#arch-ai** (what was synced, who contributed, new count)
5. Post a sync confirmation to the **debug channel**
6. Commit, push, and update CHANGELOG

Each sync is a patch version bump with its own CHANGELOG entry.

## Validation

After editing, verify your JSON is valid:

```bash
node -e "require('./data/knowledge.json'); console.log('✅ Valid JSON')"
```

Or use the existing validator:

```bash
node validate-data-quality.js
```

## How the Bot Uses This Data

1. **Q&A** — `knowledgeAsText()` serializes all categories into a text block that's passed as context to OpenAI's system prompt. The AI answers questions using only this data.
2. **Daily questions** — `findKnowledgeGaps()` scans for empty categories and incomplete entries, then generates a persona-voiced question to ask the community.
3. **Random facts** — `getRandomFact()` pulls from notes, descriptions, and custom facts for tips.

The more complete and accurate the data, the better the bot answers. Every entry matters.
