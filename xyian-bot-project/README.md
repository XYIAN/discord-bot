# XYIAN Bot — Archero 2 Community Bot

## Why this exists

If you've played Archero 2, you know how hard it is to find real, accurate information about the game. There's no official wiki that's kept up to date, guides are scattered across random posts and Discord messages, and half the info out there is for the wrong Archero game entirely. I got tired of that.

I built this on my own time and my own dime because I believe the community deserves better. The goal is simple: create a knowledge base that actually has correct, verified game info — and make it accessible to everyone through a Discord bot that can answer your questions instantly. No ads, no paywalls, no gatekeeping.

But here's the thing — I can't do it alone. The bot gets smarter when real players contribute what they know. Every suggestion you submit, every fact you add, every correction you make — it all gets reviewed and becomes part of the bot's permanent memory. The more people help, the better it gets for everyone.

This is a community project. I just built the foundation. You all are building the knowledge.

— XYIAN

---

Discord bot for the Arch 2 Addicts server and XYIAN OFFICIAL guild (ID: 213797).

## What it does

- **Q&A in #arch-ai** — Ask any Archero 2 question; the bot answers using OpenAI + curated facts, in the Arch AI persona voice (cybernetic wizard with dry wit)
- **Screenshot Q&A (vision)** — Trusted contributors (XYIAN OFFICIAL · Admin · Moderator · Arch Legend) can attach an Archero 2 screenshot in #arch-ai and Arch AI will read gear, stats, runes, and answer questions about what it sees. Universal facts spotted in the screenshot get queued for admin approval. Cost-bound: max 2 images, low detail, 60s per-user cooldown.
- **Reputation-based role tiers** — Contributors earn roles (Arch Scholar, Arch Sage) by getting suggestions approved
- **Reaction-role access** — React with 🤖 in #cross-server or on welcome messages to get AI Enabled
- **Personal DMs** — Users get notified when suggestions are approved/rejected, roles are granted, or tiers are earned
- **Daily reset reminder** — 4pm Pacific every day in general chat, with Arch AI's daily knowledge gap question
- **Guild recruitment** — Every other day in the recruit channel
- **Welcome system** — Greets new members in #general with channel links, auto-assigns ArchAddict role, sends a personal DM with full community rundown, and ⚔️ guild verification request
- **Knowledge management** — Tiered access to add/remove facts and community opinions
- **Forum guides** — Verified character list in #gear-rune-loadouts with all 17 characters, skills, and star system
- **Channel content** — Guild requirements, community rules, and AI privacy policy all posted as embeds
- **Changelog dedup** — Bot checks #changelog before posting; skips if version already announced
- **Feedback** — Thumbs-up/down reactions on Q&A answers, logged for review
- **Owner kill switch** — `!ai status` / `!ai on` / `!ai off` lets the owner pause the OpenAI-backed Q&A in #arch-ai instantly without a redeploy
- **Debug channel** — Errors, events, role changes, deploy notifications, and changelog post status

## Role Tiers

| Tier | Role | How to earn | Access |
|------|------|-------------|--------|
| 1 | 🤖 **AI Enabled** | React with 🤖 in #cross-server or welcome message | Q&A in #arch-ai, `!suggest` |
| 2 | 🎓 **Arch Scholar** | 5 approved suggestions | + `!addfact`, `!opinion`, `!faq`, `!listfacts`, `!listopinions` |
| 3 | 🧙 **Arch Sage** | 15 approved suggestions | + `!removefact`, `!removeopinion` |

Tier upgrades happen automatically when an admin approves a suggestion. The contributor gets a personal DM congratulating them and explaining their new abilities. Admins and verified guild members bypass tier checks.

## Screenshot Q&A access (vision)

Image attachments in `#arch-ai` are gated tighter than text Q&A — they're the expensive path (~10–50× a text call on `gpt-4o-mini`). Only these roles can use vision:

| Role | Vision access |
|------|---------------|
| **XYIAN OFFICIAL** | ✅ |
| **Admin** | ✅ |
| **Moderator** | ✅ |
| **Arch Legend** (top activity tier, 1500 XP) | ✅ |
| Everyone else | ❌ — gets a redirect embed pointing at <#1424322391160393790> for text questions and <#1424785709914521701> for chat. **No OpenAI call is made.** |

Cost guardrails enforced in code:
- **Max 2 images** per message
- **`detail: 'low'`** (~85 tokens/image, vs. thousands at high detail)
- **60-second per-user cooldown** between vision calls

Owner can flip the master switch any time via `!ai off` (in-memory; resets on Railway redeploy).

## Server Roles

| Role | Discord Permissions | Bot Commands |
|------|-------------------|-------------|
| **XYIAN OFFICIAL** | Pin/delete messages in all channels | All admin bot commands |
| **Admin** | Kick, ban, manage channels/roles/messages, mute/timeout (AI channels protected) | All admin bot commands |
| **Moderator** | Kick, delete messages, mute/timeout, manage nicknames/threads | `!suggestions`, `!approve`, `!reject`, `!grant` |
| **XYIAN Guild Verified** | Standard member | Bypasses tier checks for Q&A |

AI channels (#arch-ai, #community-ai-discussion) are protected — Admin and Moderator cannot delete or modify them. Rules & Requirements channels (#guild-requirements, #community-rules, #privacy-policy) are read-only for everyone except the bot.

## Activity Leveling (Strategy Channels)

| Tier | Role | Points | Color |
|------|------|--------|-------|
| Base | **ArchAddict** | 0 (auto on join) | -- |
| 1 | ⚔️ **Arch Tactician** | 100 | Steel blue |
| 2 | 🛡️ **Arch Veteran** | 350 | Emerald |
| 3 | 👑 **Arch Warlord** | 750 | Gold |
| 4 | 🌟 **Arch Legend** | 1500 | Bright cyan |

Users earn 1 XP per message in any of the 13 Strategy channels (60-second cooldown). Tiers auto-promote with a DM and admin log. Separate from the AI suggestion tiers — users can hold both. Roles stack.

## Commands

| Command | Who | What |
|---------|-----|------|
| `!ping` | Everyone | Bot status |
| `!help` / `!menu` | Everyone | Command list |
| `!contributors` | Everyone | Leaderboard of top contributors |
| `!rank` / `!level` | Everyone | Check activity rank and progress |
| `!leaderboard` / `!lb` | Everyone | Top 10 strategy channel contributors |
| `!suggest <text>` | 🤖 AI Enabled+ | Suggest a correction or new info |
| `!addfact <text>` | 🎓 Arch Scholar+ | Add a fact to the knowledge base |
| `!opinion <text>` | 🎓 Arch Scholar+ | Share a gameplay opinion or theory |
| `!faq` | 🎓 Arch Scholar+ | View knowledge categories |
| `!listfacts` | 🎓 Arch Scholar+ | Browse custom facts |
| `!listopinions` | 🎓 Arch Scholar+ | Browse community opinions |
| `!removefact <n>` | 🧙 Arch Sage | Remove a custom fact by number |
| `!removeopinion <n>` | 🧙 Arch Sage | Remove an opinion by number |
| `!suggestions` | Moderator+ | Review pending suggestions (📸 = vision-extracted, 🖼️ = has screenshot) |
| `!edit <#> <text>` | Moderator+ | Replace a pending suggestion's text in place (preserves original) |
| `!approve <#> [category] [key] [\| override]` | Moderator+ | Approve into the right knowledge category (no args → custom_facts) |
| `!reject <#> [reason]` | Moderator+ | Reject suggestion, DMs user with reason |
| `!grant @user` | Moderator+ | Manually assign a role, DMs user |
| `!ai status` / `!ai on` / `!ai off` | Owner only | Master kill switch for OpenAI Q&A in #arch-ai |

### How to see and approve suggestions (Discord)

1. **See pending suggestions** — In any channel the bot reads, run:  
   `!suggestions`  
   The bot replies with an embed listing the last 15 pending items (ID, username, and a short preview of the text).

2. **Approve one** — Run:  
   `!approve <number>`  
   Example: `!approve 8` approves suggestion #8. The bot adds that text to the knowledge base, DMs the contributor, and updates their tier if they hit 5 or 15 approved.

3. **Reject one** — Run:  
   `!reject <number> [reason]`  
   Example: `!reject 9 Off-topic`. The user gets a DM with the reason.

Pending suggestions are stored in the bot’s `data/suggestions.json` (on Railway for the live bot). The sync script only credits **!addfact** from #arch-ai into that file; it does not create “pending” items. So the queue you see with `!suggestions` is only from users who used **!suggest** in Discord.
| `!setupreaction` | XYIAN OFFICIAL / Admin | Post a reaction-role message |
| `!recruit` | XYIAN OFFICIAL / Admin | Send recruitment now |
| `!post-guild-requirements` | XYIAN OFFICIAL / Admin | Post guild requirements embed in current channel (for #guild-requirements) |
| `!reset` | XYIAN OFFICIAL / Admin | Send daily reset now |

## Personal DMs

The bot sends personal DMs to users on key events:

| Event | DM Content |
|-------|-----------|
| New member joins | Full community rundown, channels, AI access, tiers, commands, ⚔️ guild verification, and thank-you |
| React 🤖 for role | Welcome + how to use #arch-ai |
| React ⚔️ on welcome DM | Guild verification request sent to admin, confirmation DM to user |
| `!grant` by admin | Onboarding + commands + tier path |
| Suggestion approved | Which text was approved, progress to next tier |
| Suggestion rejected | The text, reason, encouragement to try again |
| Tier → Arch Scholar | Personal message acknowledging contributions, new abilities, teases Arch Sage |
| Tier → Arch Sage | Special message: "There are no more tiers. You've reached the top." |

All DMs fail gracefully if the user has DMs disabled.

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

### Categorizing new facts (for contributors & maintainers)

The bot’s **`!faq`** counts entries per **top-level key** in `data/knowledge.json` (e.g. **weapons**, **runes**, **guild**, **gold**). Facts that only live in **`custom_facts`** do not increase those category counts — so prefer putting data in the right category when possible.

| Topic | Prefer this key in `knowledge.json` |
|-------|-------------------------------------|
| S-tier pieces, Dragoon/Oracle/Griffin quality skills | `weapons` |
| Rune types, etched/blessing quality lines | `runes` |
| Godforge, salvage, crystals | `gear_sets` |
| Guild donations, guild level | `guild` |
| Gold uses, weapon level cap | `gold` |
| All Star cup, campaign quirks | `game_modes` |
| ATK vs DMG vs main weapon DMG | `damage_terminology` |
| Wiki links | `resources` |
| Individual skills | `skills` |
| Privilege cards | `privilege_cards` |
| Truly one-off trivia | `custom_facts` (last resort) |

**Optional for users:** When using **`!addfact`** or **`!suggest`**, you can start the line with a short hint so maintainers know where to file it, e.g. `weapons: Griffin Claw epic effect is…` or `guild: donation costs are…`. Plain questions in **#arch-ai** do not need a prefix.

Maintainers: after sync, run **`node scripts/categorize-knowledge.js`** only when bulk `custom_facts` need moving into **weapons** / **runes** / **gear_sets** (see script header). See also **`docs/KNOWLEDGE-GUIDE.md`**.

### Full #arch-ai audit (every message)

To verify **no** `!addfact` or `!suggest` was missed (e.g. live bot lost `suggestions.json`):

```bash
node scripts/audit-arch-ai-full.js        # summary in terminal
node scripts/audit-arch-ai-full.js --json   # + data/arch-ai-audit-report.json
```

See **`docs/ARCH-AI-AUDIT.md`** for what it checks and the latest snapshot.

## New Member Flow

1. **Join** → Auto-receive **ArchAddict** role (purple community identity)
2. **#general** → Welcome embed with channel links (#cross-server, #community-ai-discussion, #clips-and-highlights) + 🤖 react
3. **DM** → Personal welcome with community intro, channels, AI access, role tiers, commands, ⚔️ guild verification, and thank-you
4. **React 🤖** → AI Enabled role + confirmation DM
5. **React ⚔️** (on welcome DM) → Guild verification request sent to admin + confirmation DM

## Server Channels (Bot-Managed Content)

| Channel | Content |
|---------|---------|
| #guild-requirements | Power minimum (2M+), daily boss battles, donation requirements and costs |
| #community-rules-and-safety | Community guidelines, prohibited behavior, violation consequences |
| #arch-ai-privacy-policy | AI data disclosure, OpenAI processing, what's not private |
| #community-ai-discussion | Quick-reference guide (commands, tiers) + 🤖 reaction-role |
| #arch-wiki | Forum: Complete Character List (17 verified characters) |
| #changelog | Auto-posted release notes (deduped by version) |

## Changelog Channel

The bot posts release notes to #changelog (`1424784471395274803`) on every deploy. Version and release notes are automatically parsed from `CHANGELOG.md` — just update this file and the bot picks it up on startup. If the version was already posted, it skips to avoid duplicates. No need to touch `bot.js` for version bumps.

### ⚠️ CRITICAL: Changelog Rules

> **Every push to main = a Railway deploy. The bot parses `CHANGELOG.md` to get the version and release notes. If the changelog is wrong or missing, the deploy is INVISIBLE — no debug log, no release notes, no notification.**

1. **ALWAYS update CHANGELOG.md before pushing.** Every single time. No exceptions.
2. **Newest version MUST be the first `## [x.x.x]` entry.** The bot regex grabs the first match. If an older version is above a newer one, the wrong version is used.
3. **Semver order: newest → oldest, top → bottom.** `3.10.0` comes before `3.9.17` (10 > 9).
4. **Verify after push:** #changelog and #debug-logs should show the new version within ~60 seconds.

### Versioning convention

- **Major** (X.0.0) — Breaking changes or full rebuilds
- **Minor** (3.X.0) — New features (commands, channels, integrations)
- **Patch** (3.2.X) — Fact syncs, bug fixes, doc updates, knowledge base growth

## Documentation

| Doc | What it covers |
|-----|---------------|
| [`docs/RELEASE-GUIDE.md`](docs/RELEASE-GUIDE.md) | Commit, push & deploy protocol — checklist, what to update before pushing, what happens on deploy |
| [`docs/FACT-SYNC.md`](docs/FACT-SYNC.md) | Syncing live facts into the repo — script usage, full workflow, role tiers, troubleshooting |
| [`docs/KNOWLEDGE-GUIDE.md`](docs/KNOWLEDGE-GUIDE.md) | How to add data to knowledge.json — formats, categories, quality rules, fact sync workflow |
| [`docs/PERSONA.md`](docs/PERSONA.md) | Arch AI's voice, tone, humor style, and inspiration references |
| [`docs/ENV-AND-CHANNELS.md`](docs/ENV-AND-CHANNELS.md) | Environment variables and Discord channel IDs |
| [`docs/RESTART-PLAN.md`](docs/RESTART-PLAN.md) | Original restart plan from the rebuild |
| [`CHANGELOG.md`](CHANGELOG.md) | Full release history (bot reads version + notes from this on startup) |

## Files

- `bot.js` — The bot (single file)
- `data/knowledge.json` — Game facts (characters, skills, resources, custom facts) — see [Knowledge Guide](docs/KNOWLEDGE-GUIDE.md)
- `data/activity.json` — Strategy channel XP tracking (auto-created)
- `data/suggestions.json` — User suggestion queue (auto-created)
- `data/feedback.json` — Q&A feedback log (auto-created)
- `CHANGELOG.md` — Release history (bot reads version + notes from this on startup)

## Deployment

Runs on Railway 24/7. `npm start` runs `bot.js`. Health check at `GET /health`.
