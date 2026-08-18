# Arch 2 Addicts bot (XY Elder) — agent notes

Discord bot for the **Arch 2 Addicts** community and the **XYIAN OFFICIAL**
guild in **Archero 2** (Habby). CommonJS Node, discord.js v14, deployed on
Railway (auto-deploy from `main`). The bot lives in `xyian-bot-project/`.

Sibling project: `../discord-bot-tempest` (Wittle Defender). Newer, TypeScript,
better structured — worth copying *decisions* from, not its architecture.

## Hard rules

- **No `Co-Authored-By` / `Generated with` trailers in commit messages.** Kyle's
  explicit rule — the deploy notice and #changelog both derive from the commit
  message, so trailers surface to members as noise.
- **Never modify `data/knowledge.json` without explicit review.** It is the live
  knowledge base, it was wiped once by an infrastructure incident, and
  `seeds/knowledge.json` is the committed fallback that rehydrates a fresh
  volume.
- **`CHANGELOG.md` is the version source**, not package.json — the opposite of
  the Tempest bot. `lib/changelog.js` parses it; a release is a new
  `## [x.y.z]` section. Entries may be prose OR bullets (v3.18.1 shipped
  nothing to #changelog because the parser only understood bullets).
- **Screenshots and images are gitignored** (`screenshots/`, `*.png`, `*.jpg`,
  …). Do not commit them.
- **Production runs OpenAI `gpt-4o-mini`.** Assume a SMALL model: it follows the
  most directive sentence it finds, does not reconcile facts that disagree — it
  picks one — and will not notice that a stale "no data on X" line is outranked
  by fifty facts about X. Every contradiction in `data/knowledge.json` is a
  coin-flip on the answer. The system has to do the reasoning, not the model.

## Commands

- `npm test` — `test/run-all.js` DISCOVERS every `test/*.test.js`. Do not chain
  files by name in package.json; one was written, passed locally and was never
  run for weeks because nobody added it to the `&&` chain.
- `node --check xyian-bot-project/bot.js` — bot.js is a large single file; check
  syntax before committing.

## Inspecting the live bot — read text, don't drive the screen

Full rule in `xyian-bot-project/docs/coding-standards/debugging.md`.

```bash
node xyian-bot-project/scripts/read-channel.js arch-ai 40
node xyian-bot-project/scripts/read-channel.js --list
gh api repos/XYIAN/discord-bot/deployments   # deploy status
```

Reviewing member conversations by screenshotting the Discord app is slow, takes
a dozen round trips to read what one command prints, and has already typed into
somebody's half-written DM. **Screen/browser control has exactly two legitimate
uses, each with its own tool: acting as Kyle on Discord (test messages, admin
commands like `!recruit`) via Claude in Chrome — his real logged-in browser,
never the desktop app — and iPhone Mirroring via desktop control, for game
data capture only.**
Everything else — reading, checking, measuring — has a text path. Find it or
write it.

## Architecture notes

- **`bot.js` is a monolith.** The pattern for anything worth testing is to
  extract it to `lib/` with a `test/*.test.js` beside it — see `changelog.js`,
  `usage.js`, `price-guard.js`, `knowledge-render.js`, `vision-response.js`,
  `rotating-post.js`, `state-store.js`.
- **Messaging goes through per-channel WEBHOOKS**, not the bot token. This is
  historical and Kyle dislikes it ("webhook spaghetti"). Notable consequences: a
  rotated webhook returns 404 and `sendViaWebhook` swallows it into a `null`
  that almost no caller distinguishes from success; webhook messages are owned
  by the webhook, so the bot cannot recover their ids after a restart. A boot
  health check now catches a dead webhook. No send anywhere sets `username` or
  `avatarURL`, so the webhooks buy nothing over the bot token — a migration is
  viable but is ~30 call sites and invalidates every tracked message id.
- **Recurring posts** (`daily-reset`, `recruitment`) rotate: the new one
  replaces the old. Keyed by WHAT THE POST IS, never by channel — keying on the
  channel is what made welcome messages inherit the daily reset's delete slot
  and get deleted. Permanence is the default; rotation is opt-in. See
  `lib/rotating-post.js`.
- **State that matters must be persisted** via `lib/state-store.js` (atomic
  tmp+rename under `data/`). Railway redeploys often — 32 times in one
  fortnight. Module-level variables holding message ids or clocks WILL be lost,
  and have been: reaction-role ids (the 🤖 stopped granting AI access after
  every deploy) and the recruitment counter (the ad effectively never posted).
- **`data/` is a mounted Railway volume.** `seeds/` rehydrates
  `knowledge.json` and `suggestions.json` on first mount. New runtime state
  files need a `.gitignore` entry and no seed — missing means empty.

## Gotchas

- `OWNER_ID` gates every owner-only command. It was unset in production for a
  long time, which disabled them for everyone with a message that read like a
  permissions error.
- The six older `load*/save*` pairs in bot.js (knowledge, usage, feedback,
  suggestions, activity, sync-report) write straight over their target — a
  SIGKILL mid-write truncates the file and the next load silently swallows it
  into defaults. Use `lib/state-store.js` for anything new.
- `findKnowledgeGaps()` derives the daily "🧙 Arch AI has a question…" post.
  It has been observed inventing gaps for topics the knowledge base fully
  documents, so the bot publicly announces ignorance it does not have.
