# Bot maintenance scripts (`xyian-bot-project/scripts`)

| Script | Purpose |
|--------|---------|
| **`sync-facts.js`** | Pull `!addfact` from #arch-ai, merge into `knowledge.json`, credit `suggestions.json`. `--apply`, `--notify`. |
| **`audit-arch-ai-full.js`** | Full #arch-ai history vs repo; finds missed `!addfact` / `!suggest`. `--json` for report file. |
| **`categorize-knowledge.js`** | Move bulk `custom_facts` prefixed with `weapons category` / `Runes:` / Godforge into **weapons** / **runes** / **gear_sets`. Re-run after large uncategorized dumps. |
| **`approve-all-suggestions.js`** | Recovery: approve all `suggestions.json` entries as facts + DMs. `--dry-run`. |
| **`send-sync-dm.js`** | Retroactive DM to one user by username after a sync. |

Post bot messages to any channel: use Discord API with `DISCORD_TOKEN` (see root README / `docs/ENV-AND-CHANNELS.md`).
