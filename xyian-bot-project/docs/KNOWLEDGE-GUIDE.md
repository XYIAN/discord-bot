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
| `game_modes` | PvE, PvP, events, expeditions (campaign farming strategy) | Active |
| `tips` | General gameplay tips | Empty |
| `skills` | In-game skills (not character skills) | Started |
| `resources` | Useful links and references | Started |
| `privilege_cards` | Premium cards and their benefits | Active |
| `profile_experience` | Profile level, 10-level cards for gold, campaign-only source | Active |
| `umbral_tempest` | The Umbral Tempest seasonal event | **Season 4 announcement only** — carries a `coverage_caveat` |
| `collaborations` | Limited-time crossover events (Rick and Morty) | Active |
| `custom_facts` | One-off facts added via `!addfact` | Active |
| `opinions` | Unverified player opinions/theories via `!opinion` | Active |

## How to add data — use a fragment, don't hand-edit

`data/knowledge.json` is applied to, never typed into. Write a fragment under
`data/knowledge-fragments/` and merge it:

```bash
node scripts/merge-knowledge.js data/knowledge-fragments/my-drop.json --dry-run
node scripts/merge-knowledge.js data/knowledge-fragments/my-drop.json
```

A fragment mirrors the knowledge base's own shape, plus an optional `_meta`
block recording where the data came from and how confident you are. It can carry
structured topics **and** a `custom_facts` array; both are applied by the same
command, which takes a timestamped backup, validates the JSON before writing,
and mirrors `seeds/`.

The merge is **additive only**. An existing value is never overwritten unless
you name its exact dotted path with `--repair`, which forces a human to have
looked at it — the file was wiped once by an infrastructure incident and the
posture is deliberately paranoid.

### Correcting a `custom_fact` — `custom_facts_repairs`

`custom_facts` is an ARRAY, so the additive merge can only ever append to it.
That left no way to correct a fact once filed, which bites hardest exactly when
it matters most: when a provisional source (an in-game *Update Preview*, a
leak, a translation) gets a NAME wrong and the official notes later correct it.
The stale fact keeps sitting in the `ADDITIONAL FACTS` block contradicting the
corrected category — and gpt-4o-mini does not reconcile two facts that
disagree, it picks one. A wrong name left behind is a coin-flip on the answer.

A fragment may therefore carry a `custom_facts_repairs` array:

```json
"custom_facts_repairs": [
  {
    "match_text": "the EXACT existing fact text, verbatim",
    "text": "the corrected fact text",
    "reason": "official patch notes name it X, not Y",
    "repaired_at": "2026-08-28"
  }
]
```

- Matching is by **verbatim text, never by array index** — indices shift on
  every append, so an index-keyed repair rewrites the wrong entry as soon as
  anything lands before it. (Whitespace and case are normalised.)
- It is gated on `--repair custom_facts` (the array, not an index). Without the
  flag it reports a `custom_facts[N]` conflict and changes nothing.
- The entry keeps its `added_by` / `added_at` provenance and gains
  `repair_reason`.
- A repair whose `match_text` matches **nothing at all** is reported loudly, so
  a typo cannot no-op and look like success.
- Re-running an applied repair is a clean no-op — the replacement is already
  present, so there is nothing stale to report.

### How a repair reaches production — the seed manifests

The Railway volume is NOT overwritten on deploy. On boot the bot folds
`seeds/knowledge.json` into the volume **additively** — a key that already
exists on the volume keeps its live value — *unless* the path is named in
`seeds/knowledge.json._repairs`. Custom-fact corrections likewise only apply if
listed in `_custom_facts_repairs`.

`merge-knowledge.js` writes both manifests automatically whenever `--repair`
is used, and `sync-facts.js` preserves them when it mirrors seeds. **You never
edit them by hand**, but you should know they exist, because for three
releases they didn't: every `--repair` from v3.33.0 to v3.33.3 reached the
repo and stopped, and the live bot kept reciting the sentence the repair had
fixed. `test/seed-manifest.test.js` now fails if a fragment's applied repair
is missing from the manifest.

Consequences worth remembering:

- `seeds/knowledge.json` == `data/knowledge.json` **plus** the two manifests.
  Do not `cp data → seeds`; that drops them. Let the scripts write seeds.
- A key **deleted** from the repo is *not* deleted from the volume. Prefer
  repairing a value to a corrected one over deleting the key.
- The only proof a repair is live is the answer in `#arch-ai`. Ask.

**A fragment must replay as a clean no-op.** Re-run it after applying; if it
still reports additions or conflicts, the fragment and the knowledge base
disagree, and the fragment is no longer an accurate record of what landed.

The sections below describe the SHAPE of each category — what to put in a
fragment, not how to apply it.

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

> **The table above is not exhaustive.** `knowledge.json` has 34 top-level keys;
> the table lists the ones you are most likely to edit. `knowledgeAsText()`
> iterates every top-level key, so an unlisted category still reaches the prompt.
> Check the live file before assuming a category does not exist.

> **`KNOWLEDGE_CATEGORIES` in `bot.js` is a separate, narrower list.** It gates
> which categories `!approve <#> <category> <key>` will accept and which a vision
> candidate may propose. A live category missing from it cannot be extended by
> the community. Ten still are: `hunt`, `battle_pass`, `mystlings`, `currencies`,
> `daily_rewards`, `main_screen`, `event_shop`, `skin_exchange_shop`,
> `reach_rewards`, `shop`. Add a category to BOTH places when you create one.

### 5. Adding a community opinion

Opinions are gameplay theories or preferences — things that might help players but aren't fully confirmed. They're stored in the `opinions` array:

```json
"opinions": [
  {
    "text": "Griffin Claw feels stronger than Oracle Spear in PvP if you can get close",
    "added_by": "username",
    "added_at": "2026-04-09"
  }
]
```

Users add opinions live via `!opinion` (Arch Scholar+). The AI references these as "community opinions, not verified" so answers stay honest.

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

### 6. Approved-suggestion / vision entry shape

When a moderator runs `!approve <#> <category> <key>` (added in v3.12.0), the bot files the entry into the named structured category using a unified shape:

```json
"runes": {
  "frostshard_rune": {
    "text": "Frostshard rune slows enemies on hit and stacks up to 3 times.",
    "added_by": "stacey-fails (via suggestion)",
    "added_at": "2026-05-06",
    "source": "vision"
  }
}
```

Curated entries (objects with `skill_levels`, `rarity`, `aka`, etc.) and contributed entries (objects with `text`, `source`) coexist in the same category. `knowledgeAsText()` prefers the `.text` field when present and falls back to JSON-serializing structured entries that don't have one.

`source` is one of:
- `suggestion` — submitted via `!suggest`, approved by mod
- `vision` — extracted from a screenshot in #arch-ai
- `addfact` — committed via `!addfact` and synced via `scripts/sync-facts.js`

`scripts/sync-facts.js` round-trips this shape automatically — when an approved suggestion has `approved_category` set, the script files it into the correct structured category instead of always landing in `custom_facts`.

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

## `seeds/knowledge.json` — first-mount volume snapshot (v3.12.0+)

`xyian-bot-project/seeds/knowledge.json` is a tracked snapshot of `data/knowledge.json` that gets baked into the Docker image. On startup, the bot's `seedDataFiles()` hook copies `seeds/knowledge.json` into `data/knowledge.json` **only when the live file is missing** — this exists so that attaching a Railway Volume at `data/` doesn't wipe curated knowledge on first mount (an empty volume would otherwise shadow the baked-in `data/knowledge.json`).

**You don't normally edit `seeds/` directly.** It's kept in sync automatically:
- `scripts/sync-facts.js` mirrors every `data/knowledge.json` write into `seeds/knowledge.json` (look for `🌱 seeds/knowledge.json refreshed` in the script output).
- After any manual edit to `data/knowledge.json`, mirror it forward with: `cp xyian-bot-project/data/knowledge.json xyian-bot-project/seeds/knowledge.json` and commit both.

If `seeds/` and `data/` ever drift, the active bot keeps using `data/` — `seeds/` only matters on the first boot after a fresh volume attach.

## Verify the ANSWER, not just the render

A fact reaching the prompt is not the same as the bot saying it. Before shipping
a change to `knowledge.json`:

```bash
node scripts/answer-check.js     # needs OPENAI_API_KEY, ~$0.05 a run
```

Two rules this has already caught the hard way:

- **Make an enumeration complete before you qualify it.** "A and B are event-only.
  C and D are likewise limited-time" gets answered as "A and B" — a small model
  follows the leading directive clause and does not reconcile the qualifier
  behind it. Write "A, B, C and D are event-only" and qualify afterwards.
- **Put a caveat inside the value it qualifies.** A staleness warning filed as a
  `custom_fact` sits in the `ADDITIONAL FACTS` bullet list, nowhere near the
  category section holding the stale data — and loses to it. Prefix the entry
  itself, or add a sibling key inside the same object.

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
