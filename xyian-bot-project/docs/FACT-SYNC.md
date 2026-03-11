# Fact Sync — Pulling Live Facts Into the Repo

## Why This Exists

Users add facts to the bot via `!addfact` and admins approve suggestions via `!approve`. These get stored in `knowledge.json` on Railway's filesystem. But Railway can wipe the filesystem on redeploy, so facts must be synced back into the repo to become permanent.

The script also **credits contributors** — every `!addfact` message is linked to its author and recorded in `suggestions.json` as an approved contribution. This is how the role tier system (Arch Scholar @ 5, Arch Sage @ 15) tracks progress regardless of whether a user contributed via `!suggest` or `!addfact`.

## The Script

**Location:** `scripts/sync-facts.js`

The script automates what was previously a manual process:
1. Pulls all `!addfact` messages from `#arch-ai` via Discord API
2. Checks `suggestions.json` for approved suggestions
3. Compares against the current `knowledge.json` to find new facts
4. Adds new facts to `custom_facts` in `knowledge.json`
5. **Credits contributors**: ensures every `!addfact` author has matching approved entries in `suggestions.json` (with `approvedVia: "fact_sync"`)
6. Optionally posts a sync summary to `#arch-ai` and `#debug-logs`
7. Optionally DMs contributors about their credited contributions with tier progress

### Usage

```bash
cd xyian-bot-project

# Dry run — see what would be added/credited without changing anything
node scripts/sync-facts.js

# Apply — write new facts to knowledge.json + credit contributors in suggestions.json
node scripts/sync-facts.js --apply

# Apply + notify — write facts, credit contributors, post to Discord, and DM contributors
node scripts/sync-facts.js --notify
```

### What each mode does

| Mode | Reads Discord | Writes knowledge.json | Credits in suggestions.json | Posts to Discord | DMs contributors |
|------|--------------|----------------------|----------------------------|-----------------|-----------------|
| (default) | Yes | No | No | No | No |
| `--apply` | Yes | Yes | Yes | No | No |
| `--notify` | Yes | Yes | Yes | Yes (#arch-ai + #debug-logs) | Yes |

## Full Sync Workflow

When the user asks to "sync facts", "update knowledge from Discord", "pull live facts", or similar:

### Step 1: Run the dry run
```bash
cd xyian-bot-project
node scripts/sync-facts.js
```
Review what it found. If there are 0 new facts, the repo is already up to date.

### Step 2: Apply with notification
```bash
node scripts/sync-facts.js --notify
```
This writes to `knowledge.json` and posts the sync summary to Discord.

### Step 3: Review the diff
```bash
git diff data/
```
Review both `knowledge.json` (new facts) and `suggestions.json` (contributor credits). If any facts should be moved from `custom_facts` into a proper category (e.g. a character skill should go in `characters`), do that manually now.

### Step 4: Update CHANGELOG.md
Add a patch entry:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Fact sync

- 📦 Synced N community-contributed facts from live bot into permanent memory
- Contributors: user1, user2
```

### Step 5: Commit and push
```bash
git add data/knowledge.json CHANGELOG.md
git commit -m "vX.Y.Z: Fact sync — N new facts from community"
git push
```

### Step 6: Verify deploy
Check `#debug-logs` for the deploy notification and `#changelog` for the version post.

## How Roles and Promotions Work

The fact sync interacts with the role tier system:

### Live (handled by the bot automatically)
- **`!suggest`** — Any AI Enabled user can submit a suggestion
- **`!approve`** — Admin approves → fact added to live knowledge.json → DM sent to contributor with progress → `checkTierUpgrade()` runs automatically:
  - **5 approved** → Auto-promote to **Arch Scholar** + DM + debug notification
  - **15 approved** → Auto-promote to **Arch Sage** + DM + debug notification
- **`!reject`** — Admin rejects → DM sent to contributor with reason

### Repo sync (handled by this script + manual steps)
- The script syncs facts that were added via `!addfact` (direct adds by Arch Scholar+)
- Approved suggestions are already in the live `knowledge.json` — the script catches any that aren't in the repo yet
- **Contributor credit**: the script scans ALL `!addfact` messages and creates matching approved entries in `suggestions.json` for any that aren't already tracked. This means `!addfact` contributions count toward tier progression just like `!suggest` → `!approve` ones.
- With `--notify`, the script DMs contributors about their newly credited contributions and tier progress
- Role promotions themselves happen on the next bot deploy when `checkTierUpgrade()` runs, or can be triggered manually

## Role Tier Reference

| Tier | Role | Threshold | Can Do |
|------|------|-----------|--------|
| 1 | AI Enabled | React with 🤖 | Ask questions, `!suggest` |
| 2 | Arch Scholar | 5 approved suggestions | + `!addfact`, `!faq`, `!listfacts` |
| 3 | Arch Sage | 15 approved suggestions | + `!removefact` |

Admins and verified guild members bypass all tier checks.

## Troubleshooting

**Script says "0 new facts" but I know there are facts on the live bot:**
- The script compares by text content (fuzzy match on first 40 chars). If you manually added a cleaned-up version, it may already match.
- Check if the facts are in a proper category instead of `custom_facts` — they count either way.
- Even if 0 new facts, there may still be uncredited contributions — check the "Contributor Credit" section of the output.

**Contributor has facts but 0 approved count:**
- This happens when `!addfact` was used before the credit system existed. Run the sync script with `--apply` to retroactively credit all `!addfact` contributions.
- Credits are tagged with `approvedVia: "fact_sync"` to distinguish them from regular `!suggest` → `!approve` entries.

**DISCORD_TOKEN not set:**
- Make sure `.env` exists in `xyian-bot-project/` with the real token.
- The script loads from `.env` relative to its location.

**JSON validation failed after sync:**
- Run `node -e "require('./data/knowledge.json'); console.log('✅ Valid')"` to check.
- If broken, check for trailing commas or unclosed quotes in the new entries.

## How Contributor Credit Works

The tier system counts approved entries in `suggestions.json` by `userId`. There are two paths to get entries there:

1. **`!suggest` → `!approve`**: The bot writes directly to `suggestions.json` at approve time (live).
2. **`!addfact` → fact sync**: The sync script retroactively creates approved entries for any `!addfact` contribution that doesn't already have a matching `suggestions.json` entry.

Both paths result in identical entries for tier counting. The only difference is the `approvedVia` field:
- `!approve` entries: no `approvedVia` field (standard flow)
- Fact sync entries: `approvedVia: "fact_sync"`

The script skips the owner (`OWNER_ID`) when sending DMs but still credits their contributions.
