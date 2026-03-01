# Env vars and channel IDs (single reference)

Use this when setting up `.env` or Railway. See **RESTART-PLAN.md** for how each is used.

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
| Guild recruit (never reply; only cron sends) | (your recruit channel) | `1419944464608268410` |

To get a channel ID: Discord → User Settings → App Settings → Developer Mode ON → right‑click channel → Copy ID.
