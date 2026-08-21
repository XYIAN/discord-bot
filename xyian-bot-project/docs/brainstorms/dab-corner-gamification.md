# Brainstorm brief — #dab-corner roles, achievements & gamification

**Status:** the channel is live and empty of features. This document is the
starting prompt for a design conversation, not a plan. Nothing here is decided.

Paste-able kickoff for a fresh chat:

> Read `xyian-bot-project/docs/brainstorms/dab-corner-gamification.md` and let's
> brainstorm the #dab-corner gamification. Push back on anything in it. I want
> options with trade-offs, not a single recommendation.

---

## What exists right now

`#dab-corner` (id `1540418122996121720`) — public, zero permission overwrites,
in the Text Channels category below `#clips-and-highlights`. Created 2026-08-21
by `scripts/create-dab-corner.js`. One pinned welcome embed with house rules.

It has **no roles, no XP, no commands, no scheduled posts**. Everything is open.

Kyle's framing: *"we are basically trying to make a section for every big
demographic I notice."* So whatever gets designed here is a **template** — the
next one might be night-shift workers, parents, a country, a language. Design
for the second and third instance, not just this one.

## The one hard constraint

The pinned rules say **no sourcing, sales, or trades**. Discord permits
discussion of legal cannabis use but prohibits using the platform to arrange
drug sales — that distinction is what gets servers actioned rather than warned.

**No mechanic may reward, rank, or leaderboard anything that reads as
consumption volume or acquisition.** "Most sessions logged" is a bad idea for
reasons beyond taste. Reward *participation in the channel*, humour,
helpfulness, showing up — not intake. This is a design constraint, not a
disclaimer, and it rules out the most obvious first idea.

Also worth deciding early: should the channel get Discord's age-restricted
flag? It is currently OFF because Kyle asked for "available to everyone", and
the flag adds an 18+ gate. `scripts/create-dab-corner.js --age-restrict` flips
it. This is a real fork — it changes reach vs. compliance posture.

## Primitives already in the bot (reuse these, don't rebuild them)

| Thing | Where | Notes |
|---|---|---|
| Activity XP → tier roles | `bot.js` ~line 621–700, `CONFIG.activityTiers` | 1 point per message, **60s cooldown per user**, only in `CONFIG.activityChannelIds`. Grants a role and announces it. |
| Reaction roles | `bot.js` ~line 1857 `messageReactionAdd`, `CONFIG.reactionRole` | 🤖 → "AI Enabled". Tracked message ids are **persisted** (they weren't, and it broke every deploy). |
| Contribution tiers | `lib/contributions.js` | Approved-suggestion counts → Arch Scholar / Arch Sage, with a `reconcilePlan()` that recomputes truth from the ledger and re-applies it. Good model for any "recompute from history" need. |
| Rotating vs permanent posts | `lib/rotating-post.js` | Recurring posts replace their predecessor, keyed by **post identity, not channel**. Permanence is the default. |
| Scheduling | `lib/schedule.js` | `isDue` / `alreadyPostedToday` / `dayKey`. |
| Persistence | `lib/state-store.js` | Atomic tmp+rename. **Mandatory** for anything that must survive a deploy. |
| `!rank` / `!leaderboard` | `bot.js` ~2194 / ~2234 | Already exist for activity points. |

## A measured problem to learn from before copying it

The activity XP system is fully wired and its four roles exist in the guild —
**Arch Tactician (100 pts), Arch Veteran (350), Arch Warlord (750), Arch Legend
(1500)**. Verified 2026-08-21:

- **Zero members hold any of the four.** Not one, ever.
- Total **human** messages across all 13 XP channels, for their entire history
  (some back to 2025-09): **~1,033**.
- Only **4 members** have ever posted 100+ raw messages in them — and the 60s
  cooldown means raw messages overcount actual points, possibly by a lot.
- Role hierarchy is NOT the blocker: the bot's top role is position 12, all tier
  roles sit at position 1, so they are assignable.

So the first tier costs roughly **10% of everything the entire community has
ever said in those channels**. The ladder appears to have been calibrated for a
server perhaps 10× busier. (Not proven end-to-end — it is also possible the
grant path fails silently. Worth settling first: instrument it, or reconcile
from message history the way `contributions.js` does for suggestions.)

**The lesson for this brainstorm:** thresholds must be derived from measured
traffic, not from what sounds impressive. An achievement nobody reaches is
indistinguishable from a broken feature — and this server has now run that
experiment for months. Whatever gets designed should include the numbers that
justify its thresholds, and ideally a way to recompute standing from history so
a wrong guess is fixable without resetting everyone.

Useful measurement commands are in the repo — `scripts/read-channel.js`, and
the ad-hoc traffic count above can be rebuilt from the Discord API directly.

## Questions worth arguing about

1. **Entry: opt-in or earned?** A 🌿 reaction role is one line of existing code
   and lets people self-identify. An *earned* role is scarcer and more fun but
   needs a metric that isn't consumption. Could be both — a tier ladder.
2. **What is actually measurable and safe to reward?** Messages in channel,
   images posted, reactions received (peer approval rather than volume),
   showing up on N distinct days (rewards consistency, resists spam), replies
   to other people (rewards conversation over monologue).
3. **Does #dab-corner join `activityChannelIds`, or get its own track?** Joining
   means a social channel feeds the *strategy* ladder — arguably wrong, and it
   would let chatter outrank real strategy contribution. Its own track means new
   state, new roles, new commands.
4. **Anti-spam.** Any message-count metric invites one-word spam. The 60s
   cooldown is the existing answer; distinct-days is a stronger one.
5. **Perks with actual value?** Roles are cosmetic. Real perks the bot could
   grant: vision/image access in `#arch-ai` (currently gated to
   `visionTrustedRoleNames`), a custom colour, `!suggest` weight, a pinned
   "regular of the week".
6. **Scheduled content.** A daily/weekly prompt post ("4:20 roll call", a
   question of the day) drives activity — but see `lib/rotating-post.js` for how
   recurring posts must be keyed, and note recruitment posts every 48h already
   exist as a working example.
7. **How does this generalise?** If the next demographic channel wants the same
   treatment, is this a `lib/community-channel.js` with config per channel, or
   bespoke code each time? Kyle's stated intent implies the former.

## Repo rules the design must respect

- **`CHANGELOG.md` is the version source**, not package.json. A new `## [x.y.z]`
  section is what ships release notes to `#changelog`.
- **State that matters is persisted** via `lib/state-store.js`. Module-level
  variables are lost — Railway redeployed 32 times in one fortnight, and this
  has already broken reaction roles, the recruitment clock, and welcome DMs.
- New runtime state files need a `.gitignore` entry and no seed.
- **Messaging goes through per-channel webhooks** (historical, Kyle dislikes
  it). A new channel needs a webhook env var if the bot posts there on a
  schedule — or use the bot token, as the `#dab-corner` scripts do.
- **No `Co-Authored-By` / `Generated with` trailers in commits** — they surface
  to members in the deploy notice and `#changelog`.
- `bot.js` is a monolith; anything worth testing gets extracted to `lib/` with a
  `test/*.test.js` beside it. `npm test` auto-discovers.

## What a good output from the brainstorm looks like

A short menu of 2–4 coherent designs, each with: the metric, why it is safe
under the sourcing/sales constraint, **thresholds derived from the measured
traffic above**, what new state it needs, and roughly what it costs to build.
Then Kyle picks, and implementation happens in a normal working session.
