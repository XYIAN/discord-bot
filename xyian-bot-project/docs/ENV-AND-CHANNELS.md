# Env vars and channel IDs (single reference)

Use this when setting up `.env` / `.env.local` or Railway. Scripts and the bot load `.env` then `.env.local` (`.env.local` overrides); keep secrets in `.env.local`. See **RESTART-PLAN.md** for how each is used.

## Required to run the skeleton bot

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal → Bot |
| `CLIENT_ID` | Application ID (Developer Portal → General Information) |
| `GENERAL_CHAT_WEBHOOK` | Webhook URL for channel that gets daily reset |
| `GUILD_RECRUIT_WEBHOOK` | Webhook URL for guild recruitment channel |
| `ADMIN_WEBHOOK` | Webhook URL for debug/errors channel |

## Optional (for full bot or future features)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Only if you add AI (e.g. welcome messages) |
| `OWNER_ID` | Your Discord user ID for owner-only commands |
| `XYIAN_GUILD_WEBHOOK` | Guild-specific webhook |
| `GUILD_EXPEDITION_WEBHOOK` | Expedition channel webhook |
| `GUILD_ARENA_WEBHOOK` | Arena channel webhook |
| `AI_QUESTIONS_WEBHOOK` | Can post to arch-ai via webhook (skeleton doesn’t use) |
| `UMBRAL_TEMPEST_WEBHOOK` | Event channel |
| `GEAR_RUNE_WEBHOOK` | Gear/rune channel |
| `PORT` | HTTP port for /health (default 3000) |

## Channel IDs (hardcoded in bot)

| Purpose | Channel name | ID |
|---------|--------------|-----|
| Main Q&A (only channel we reply to for normal messages) | arch-ai | `1424322391160393790` |
| cross-server (main/day-to-day chat; was Lobby) | cross-server | `1425322796820725760` |
| Guild recruit (never reply; only cron sends) | (your recruit channel) | `1419944464608268410` |
| Guild requirements (embed posted via !post-guild-requirements or script) | guild-requirements | `1425139641199235133` |
| Changelog (bot posts release notes on deploy) | changelog | `1424784471395274803` |

### XYIAN Guild category (`XYIAN-Guild`)

Private to **XYIAN OFFICIAL**, **XYIAN Guild Verified**, **Admin**, and the bot (same overwrite pattern). Not listed in bot code unless a webhook is added later.

| Channel | ID |
|---------|-----|
| gvg-expedition-strategy (renamed from `expedition`) | `1424147322811580518` |
| boss-strategy | `1487167727608266863` |
| shackled-jungle | `1487167728556052752` |
| rune-gear-strategy-and-presets | `1487167729910677564` |

To get a channel ID: Discord → User Settings → App Settings → Developer Mode ON → right‑click channel → Copy ID.
