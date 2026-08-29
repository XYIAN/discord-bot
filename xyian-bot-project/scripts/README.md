# Bot maintenance scripts (`xyian-bot-project/scripts`)

| Script | Purpose |
|--------|---------|
| **`sync-facts.js`** | Pull `!addfact` from #arch-ai, merge into `knowledge.json`, credit `suggestions.json`. `--apply`, `--notify`. |
| **`audit-arch-ai-full.js`** | Full #arch-ai history vs repo; finds missed `!addfact` / `!suggest`. `--json` for report file. |
| **`categorize-knowledge.js`** | Move bulk `custom_facts` prefixed with `weapons category` / `Runes:` / Godforge into **weapons** / **runes** / **gear_sets`. Re-run after large uncategorized dumps. |
| **`approve-all-suggestions.js`** | Recovery: approve all `suggestions.json` entries as facts + DMs. `--dry-run`. |
| **`send-sync-dm.js`** | Retroactive DM to one user by username after a sync. |
| **`answer-check.js`** | Asks the REAL model the real questions and asserts on the ANSWER. Needs `OPENAI_API_KEY`; ~$0.08 and a few minutes (it paces under the 200k/min TPM ceiling and retries 429s). Run before shipping any `knowledge.json` or prompt change. |
| **`merge-knowledge.js`** | **The one way to fold knowledge in.** Applies a fragment from `data/knowledge-fragments/` — structured topics *and* `custom_facts` — additively. `--repair <path>` overwrites one reviewed value; `--dry-run` first. Backs up and validates before writing. |
| **`add-patch-notes.js`** | The v1.1.7 patch-notes drop (one-shot, pre-dates the fragment workflow; kept for the record). |

Post bot messages to any channel: use Discord API with `DISCORD_TOKEN` (see root README / `docs/ENV-AND-CHANNELS.md`).
