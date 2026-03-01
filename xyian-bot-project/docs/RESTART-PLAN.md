# XYIAN Bot Restart Plan

**Goal:** Keep the parts that work (daily reset, guild recruit, debug channel, one main Q&A channel), drop the failed knowledge-bot approach, and rebuild with small features one at a time.

---

## What We're Keeping

### 1. Scheduled messages (cron-like)

| What | When | Where it goes |
|------|------|----------------|
| **Daily reset reminder** | 4:00 PM Pacific every day | General chat (via `GENERAL_CHAT_WEBHOOK`) |
| **Guild recruitment** | Every other day (day 2, 4, 6…) | Guild recruit channel (via `GUILD_RECRUIT_WEBHOOK`) |

- No startup blast: nothing is sent when the bot starts.
- Locks prevent duplicate sends (e.g. 5-minute cooldown after sending).

### 2. Channel and webhook behavior

- **General chat:** Bot does **not** reply to random messages. Only `!help` and `!menu` (and you can point people to the Q&A channel).
- **Guild recruit channel:** Bot **never** replies to messages there. Only the scheduled recruitment post is sent via webhook.
- **One “main” channel (arch-ai):** This is the only channel where the bot tries to respond to normal messages (no `!` required). Right now we’re replacing the old RAG/knowledge logic with a simple placeholder so the pipeline is ready for future features.
- **Debug / admin channel:** All errors and important events go to one place via `ADMIN_WEBHOOK` (the “debug” channel). No more scattered logs.

### 3. Env variables and channel IDs (single reference)

**Required for the bot to run:**

- `DISCORD_TOKEN` – Bot token from Discord Developer Portal.
- `CLIENT_ID` – Application ID (same place as token).

**Webhooks (post messages into a channel as the “webhook user”):**

- `GENERAL_CHAT_WEBHOOK` – Where daily reset goes.
- `GUILD_RECRUIT_WEBHOOK` – Where guild recruitment goes.
- `ADMIN_WEBHOOK` – Debug/errors (the “debug messages” channel).

**Optional (used by full bot or future features):**

- `XYIAN_GUILD_WEBHOOK`, `GUILD_EXPEDITION_WEBHOOK`, `GUILD_ARENA_WEBHOOK`, `AI_QUESTIONS_WEBHOOK`, `UMBRAL_TEMPEST_WEBHOOK`, `GEAR_RUNE_WEBHOOK`
- `OPENAI_API_KEY` – Only if you add back AI (e.g. welcome messages).
- `OWNER_ID` – Your Discord user ID for owner-only commands.

**Channel IDs (hardcoded in bot for safety):**

- **Main Q&A channel (arch-ai):** `1424322391160393790` – only channel where bot replies to non-command messages.
- **Guild recruit channel (ignore list):** `1419944464608268410` – bot never responds here, only cron sends recruitment.

### 4. How “debug” works

- **Admin webhook** = the Discord channel you use for “debug messages.”
- `sendToAdmin(content)` in code = post to that channel (errors, duplicate/spam events, manual debug from `!monitor-debug`, etc.).
- So: one channel, one webhook URL, all important bot events in one place.

---

## What We're Dropping (For Now)

- **RAG / knowledge base** – No more `working-rag-system.js`, no `unified_game_data.json` for answers.
- **Training system** – No `/train`, `/correct`, training logs, or merging into a knowledge file.
- **Complex AI Q&A** – No OpenAI-based answers in the main channel until we deliberately add a small, well-scoped feature.
- **All other scheduled content** – No daily tip, arena tip, expedition message, guild reset message (only daily reset + guild recruit).
- **Heavy commands** – No `!ai-feedback`, `!teach`, `!ai rag-test`, `!unknown`, analytics, etc. We can add back minimal versions later if needed.

---

## Discord Bot 101 (For a Web Dev)

- **Bot token** – Like an API key: one per bot, keep it secret. From [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Token.
- **Intents** – You enable what the bot is allowed to see (e.g. `GuildMessages`, `MessageContent`). Without `MessageContent`, you don’t get message text.
- **Webhooks** – A URL that **posts into a channel** without the bot having to “be in” the channel. Perfect for scheduled messages (daily reset, recruit) and for a dedicated debug channel. You create them in Server Settings → Integrations → Webhooks.
- **Channel ID** – Every channel has a numeric ID. We use IDs (not names) so behavior doesn’t break if someone renames the channel. Right-click channel (with Developer Mode on) → Copy ID.
- **“Cron” in Node** – We don’t use real cron; we use `setTimeout`/`setInterval` and a function that computes “next 4pm Pacific” so daily reset runs once per day at the right time. Guild recruit runs every 24h but only sends on even “days” (counter % 2 === 0).
- **One channel for “replies”** – To avoid replying everywhere, we only handle “normal” messages in one channel (arch-ai). Everywhere else we either ignore or only respond to explicit commands like `!help`.

---

## Railway (production)

The bot runs on Railway 24/7. That’s what actually sends the daily reset and guild recruit messages to Discord.

- **Default (`npm start`):** Runs **skeleton** — `node xyian-bot-project/bot-skeleton.js`. This is what Railway uses, so after you deploy, the skeleton is what sends:
  - Daily reset at 4pm Pacific → general chat
  - Guild recruitment every other day → recruit channel
- **Env on Railway:** Set the same vars (DISCORD_TOKEN, CLIENT_ID, GENERAL_CHAT_WEBHOOK, GUILD_RECRUIT_WEBHOOK, ADMIN_WEBHOOK). No code changes needed.
- **Health check:** Skeleton exposes `GET /health`; Railway’s `healthcheckPath: "/health"` keeps working.
- **Old full bot:** To run the previous bot instead, use `npm run start:full` (e.g. in Railway’s start command override).

## Suggested Next Steps

1. **Run the skeleton**  
   Use the minimal bot (`bot-skeleton.js`) that only does:
   - Daily reset at 4pm PT → general.
   - Guild recruit every other day → recruit.
   - In arch-ai: placeholder reply (e.g. “Rebuilding — more soon. Use !help.”).
   - Errors and important events → admin webhook (debug channel).
   - `!ping`, minimal `!help`.

2. **Confirm env and channels**  
   Set the three webhooks + token + client ID. Confirm the channel IDs for arch-ai and guild recruit match your server.

3. **Add one feature at a time**  
   Examples:
   - Simple FAQ: a small JSON or object mapping keywords → one-line answers only for Archero 2.
   - Single manual command: e.g. `!recruit` to post the recruitment embed on demand.
   - Optional: welcome message in general (with or without OpenAI) when someone joins.

4. **Keep the old bot as reference**  
   Leave `ultimate-xyian-bot.js` and the RAG/training code in the repo but don’t run them for “production.” Use them only to copy patterns (e.g. embed format, webhook calls) into the skeleton.

---

## File Layout After Restart

- **`bot-skeleton.js`** – New minimal entrypoint (daily reset, guild recruit, debug, main-channel placeholder). Run this.
- **`ultimate-xyian-bot.js`** – Old full bot; keep for reference, don’t run.
- **`working-rag-system.js`**, **`training-system.js`**, **`data/real-structured-data/`** – Unused for now; keep or archive as you prefer.
- **Env** – Same `.env`; skeleton only needs token, client ID, and the three webhooks (general, recruit, admin) to do the “vital” things.

**Railway:** The repo is wired so `npm start` (and thus Railway’s default start command) runs the skeleton: `node xyian-bot-project/bot-skeleton.js`. That’s what runs 24/7 in production and sends the daily reset (4pm PT) and guild recruit (every other day) to Discord. Same env vars in Railway (DISCORD_TOKEN, CLIENT_ID, GENERAL_CHAT_WEBHOOK, GUILD_RECRUIT_WEBHOOK, ADMIN_WEBHOOK). To run the old full bot locally or on Railway, use `npm run start:full`.
