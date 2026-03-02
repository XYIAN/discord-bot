# XYIAN Bot — Archero 2 Community Bot

Discord bot for the Arch 2 Addicts server and XYIAN OFFICIAL guild (ID: 213797).

## What it does

- **Q&A in #arch-ai** — Ask any Archero 2 question; the bot answers using OpenAI + curated facts (verified roles + AI Enabled)
- **Daily reset reminder** — 4pm Pacific every day in general chat
- **Guild recruitment** — Every other day in the recruit channel
- **Welcome message** — Greets new members in general chat
- **Knowledge management** — Admins can add/remove facts via Discord commands
- **Feedback** — Thumbs-up/down reactions on Q&A answers, logged for review
- **Debug channel** — Errors and events go to admin webhook

## Commands

| Command | Who | What |
|---------|-----|------|
| `!ping` | Everyone | Bot status |
| `!help` / `!menu` | Everyone | Command list |
| `!suggest <text>` | AI Enabled / Verified | Suggest a correction or new info |
| `!faq` | Verified role | Topics the bot knows about |
| `!listfacts` | Verified role | Browse custom facts |
| `!addfact <text>` | XYIAN OFFICIAL / Admin | Add a fact |
| `!removefact <n>` | XYIAN OFFICIAL / Admin | Remove a custom fact by number |
| `!suggestions` | XYIAN OFFICIAL / Admin | Review pending suggestions |
| `!approve <#>` | XYIAN OFFICIAL / Admin | Approve suggestion → adds as fact |
| `!reject <#> [reason]` | XYIAN OFFICIAL / Admin | Reject a suggestion |
| `!grant @user` | XYIAN OFFICIAL / Admin | Manually assign the reaction role |
| `!setupreaction` | XYIAN OFFICIAL / Admin | Post a reaction-role message in current channel |
| `!recruit` | XYIAN OFFICIAL / Admin | Send recruitment now |
| `!reset` | XYIAN OFFICIAL / Admin | Send daily reset now |

## Setup

```bash
npm install
# Set env vars (see docs/ENV-AND-CHANNELS.md)
npm start
```

## Fact Sync Workflow

Members add facts via `!addfact` on the live bot — these are stored in `knowledge.json` on Railway's server. Since Railway can wipe the filesystem on redeploy, facts need to be synced to the repo periodically.

**How to sync:**
1. Ask the dev to "sync facts" or "check what's on the bot"
2. Dev reads the live bot's custom facts via Discord API (`/channels/{id}/messages`)
3. Reviews and structures the data — raw custom facts get organized into proper categories (skills, resources, etc.) when possible
4. Adds them to `data/knowledge.json` in the repo
5. Posts a **sync summary to #arch-ai** so contributors know their facts were saved to permanent memory (include what was synced, who contributed, and the new fact count)
6. Posts a **sync confirmation to the debug channel** for admin records
7. Commits, pushes, and updates the CHANGELOG

The #arch-ai notification is important — it lets users know their `!addfact` contributions were officially reviewed, approved, and made permanent. Example message:

> 📦 **Memory Sync Complete**
> 3 community-contributed facts have been reviewed and saved to permanent memory:
> ⚔️ Tracking Eye — skill info (contributed by fails_8743)
> 📊 Knowledge base: 35 facts | Custom facts queue: 0 pending
> _Keep using `!addfact` or `!suggest` to contribute!_

This ensures custom facts survive redeployments. Each fact sync counts as a patch version bump (e.g. 3.4.1 → 3.4.2) and gets its own CHANGELOG entry.

## Changelog Channel

The bot posts release notes to #changelog (`1424784471395274803`) on every deploy. Version and release notes are automatically parsed from `CHANGELOG.md` — just update this file and the bot picks it up on startup. No need to touch `bot.js` for version bumps.

### Versioning convention

- **Major** (X.0.0) — Breaking changes or full rebuilds
- **Minor** (3.X.0) — New features (commands, channels, integrations)
- **Patch** (3.2.X) — Fact syncs, bug fixes, doc updates, knowledge base growth

## Files

- `bot.js` — The bot (single file)
- `data/knowledge.json` — Game facts (curated + custom)
- `data/feedback.json` — Q&A feedback log (auto-created)
- `docs/` — ENV reference, restart plan, changelog

## Deployment

Runs on Railway 24/7. `npm start` runs `bot.js`. Health check at `GET /health`.
