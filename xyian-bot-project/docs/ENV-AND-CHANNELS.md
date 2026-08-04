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
| AI discussion + reaction-role (vision redirect target) | community-ai-discussion | `1424785709914521701` |
| cross-server (main/day-to-day chat; was Lobby) | cross-server | `1425322796820725760` |
| Guild recruit (never reply; only cron sends) | (your recruit channel) | `1419944464608268410` |
| Guild requirements (embed posted via !post-guild-requirements or script) | guild-requirements | `1425139641199235133` |
| Changelog (bot posts release notes on deploy) | changelog | `1424784471395274803` |

## Feature flags (`CONFIG.features` in `bot.js`)

In-memory feature flags. The owner can toggle some at runtime via `!ai on/off`. Static defaults live in `bot.js` and reset on every Railway redeploy.

| Flag | Default | Owner-toggleable | What it controls |
|------|---------|------------------|-------------------|
| `aiEnabled` | `true` | Yes (`!ai on`/`!ai off`) | Master kill switch for ALL OpenAI Q&A in `#arch-ai` (text + vision). When off, users see an offline embed and no OpenAI call is made. |
| `visionEnabled` | `true` | No (code only) | Vision-specific flag. If false but `aiEnabled` is true, image attachments are stripped and the question is answered text-only. |
| `visionMaxImages` | `2` | No | Hard cap on images per vision call. |
| `visionDetail` | `'low'` | No | OpenAI image-detail level. `'low'` ≈ 85 tokens/image; `'high'` is much pricier. |
| `visionCooldownMs` | `60_000` | No | Per-user cooldown between vision calls (in milliseconds). |
| `tipOfTheDay` | `false` | No | Adds a random fact to the daily reset embed. |

## Vision trusted roles (`CONFIG.visionTrustedRoleNames` in `bot.js`)

Image attachments in `#arch-ai` only trigger the vision pipeline for members holding one of these roles. Anyone else who attaches an image gets a redirect embed and no OpenAI call.

| Role | Source |
|------|--------|
| `XYIAN OFFICIAL` | Server role |
| `Admin` | Server role |
| `Moderator` | Server role |
| `Arch Legend` | Activity tier (1500 XP) |

### XYIAN Guild category (`XYIAN-Guild`)

Private to **XYIAN OFFICIAL**, **XYIAN Guild Verified**, **Admin**, and the bot (same overwrite pattern). Not listed in bot code unless a webhook is added later.

| Channel | ID |
|---------|-----|
| gvg-expedition-strategy (renamed from `expedition`) | `1424147322811580518` |
| boss-strategy | `1487167727608266863` |
| shackled-jungle | `1487167728556052752` |
| rune-gear-strategy-and-presets | `1487167729910677564` |
| leadership-roundtable | `1498069222801277038` |

### Strategy category (`Strategy`)

Public channels (no permission overwrites — @everyone can view and post). Welcome embeds posted in each.

| Channel | ID |
|---------|-----|
| arch2-wiki (forum) | `1421930658737164531` |
| umbral-tempest | `1419944602651197511` |
| arena-pvp | `1421948149827895498` |
| fishing-event | `1429496650627551332` |
| gem-spending | `1487582830702759936` |
| campaign-and-hard-mode | `1487582836327186482` |
| peak-arena | `1487582841507151883` |
| sky-tower-and-challenges | `1487582846548971620` |
| abyssal-tide | `1487582851808624731` |
| boss-strategy | `1487582856732606596` |
| rune-and-gear-builds | `1487582861912444979` |
| event-guides | `1487582867822215300` |
| all-star-cup | `1487582873094721789` |

### Strategy Activity Tiers

Activity-based leveling system for strategy channels. Users earn 1 XP per message (60s cooldown). All 13 Strategy channels award points.

| Tier | Threshold | Role Name | Color |
|------|-----------|-----------|-------|
| Base | 0 | ArchAddict | (existing) |
| 1 | 100 | Arch Tactician | `#7289DA` (Steel blue) |
| 2 | 350 | Arch Veteran | `#2ECC71` (Emerald) |
| 3 | 750 | Arch Warlord | `#FFD700` (Gold) |
| 4 | 1500 | Arch Legend | `#00FFFF` (Bright cyan) |

Role IDs: Arch Tactician `1488667635326386226`, Arch Veteran `1488667640384979012`, Arch Warlord `1488667645741105203`, Arch Legend `1488667650841116693`.

Commands: `!rank` / `!level` (check progress), `!leaderboard` / `!lb` (top 10).

### Read-only channels (Rules & Requirements category)

These channels have `@everyone` denied SEND_MESSAGES, ADD_REACTIONS, and CREATE_THREADS. Only the bot (ADMINISTRATOR) can post.

| Channel | ID |
|---------|-----|
| guild-requirements | `1425139641199235133` |
| archero-addicts-community-rules-and-safety | `1425139850599731365` |
| arch-ai-privacy-policy-and-disclosure | `1425139939758178375` |

### Server roles reference

| Role | ID | Purpose |
|------|-----|---------|
| XYIAN OFFICIAL | `1424144223501815808` | Guild leadership — admin bot commands, pin messages |
| Admin | `1424144920096014448` | Full admin — kick/ban/manage channels/roles (AI channels protected) |
| Moderator | `1492192809426620566` | Mod duties — kick, mute/timeout, delete messages, manage suggestions |
| XYIAN Guild Verified | `1424146498475659415` | Verified guild members — Q&A access, bypasses tier checks |

### AI channel protection

Admin and Moderator roles are denied MANAGE_CHANNELS and MANAGE_ROLES on:
- `#arch-ai` (`1424322391160393790`)
- `#community-ai-discussion` (`1424785709914521701`)

To get a channel ID: Discord → User Settings → App Settings → Developer Mode ON → right‑click channel → Copy ID.
