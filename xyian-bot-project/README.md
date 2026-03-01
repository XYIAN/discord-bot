# XYIAN Bot — Archero 2 Community Bot

Discord bot for the Arch 2 Addicts server and XYIAN OFFICIAL guild (ID: 213797).

## What it does

- **Q&A in #arch-ai** — Ask any Archero 2 question; the bot answers using OpenAI + curated facts (verified roles only)
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
| `!faq` | Verified role | Topics the bot knows about |
| `!listfacts` | Verified role | Browse custom facts |
| `!addfact <text>` | XYIAN OFFICIAL / Admin | Add a fact |
| `!removefact <n>` | XYIAN OFFICIAL / Admin | Remove a custom fact by number |
| `!recruit` | XYIAN OFFICIAL / Admin | Send recruitment now |
| `!reset` | XYIAN OFFICIAL / Admin | Send daily reset now |

## Setup

```bash
npm install
# Set env vars (see docs/ENV-AND-CHANNELS.md)
npm start
```

## Files

- `bot.js` — The bot (single file)
- `data/knowledge.json` — Game facts (curated + custom)
- `data/feedback.json` — Q&A feedback log (auto-created)
- `docs/` — ENV reference, restart plan, changelog

## Deployment

Runs on Railway 24/7. `npm start` runs `bot.js`. Health check at `GET /health`.
