# Debugging and inspection

## Read data as data. Screen control is a last resort.

Reviewing how members are actually being answered means reading `#arch-ai`.
The first few times, that was done by driving the Discord desktop app with
screenshots — scrolling, zooming, reading text off images. It is slow, it takes
a dozen round trips to read what one command prints, and it risks real damage:
in one session it typed into somebody's half-written DM.

**The content is text. Fetch it as text.**

```bash
node xyian-bot-project/scripts/read-channel.js arch-ai 40
node xyian-bot-project/scripts/read-channel.js general 20
```

Reads `DISCORD_TOKEN` and `GUILD_ID` from `.env`, prints the messages with
authors, timestamps and reply context. One command, complete output, nothing to
misclick.

The same rule applies everywhere:

| want | use | not |
|---|---|---|
| recent channel messages | `scripts/read-channel.js` | screenshots of Discord |
| what the bot answers | an answer-level check | asking in Discord and reading it back |
| what a question retrieves | the retrieval report | reasoning about it |
| deploy status | `gh api repos/XYIAN/discord-bot/deployments` | the Railway dashboard |
| the knowledge base | read `data/knowledge.json` | `/fact list` in Discord |

**Check for an API, a file, or a CLI before reaching for the screen.** If none
exists and the task will recur, write the script — `scripts/read-channel.js` took five
minutes and replaced an activity that was costing many minutes every time.

## When screen control IS the right tool

Two cases, both because no API exists:

1. **iPhone Mirroring, to capture game data.** Archero 2 has no API and no
   wiki worth trusting; the only source is the game itself. See
   `the Tempest repo's docs/capture/treasures-runes.md`, and note the hard rules there — the Shop
   screen has cost real money.
2. **Acting as Kyle on Discord** — test messages, admin-only commands like
   `!recruit`. The bot cannot ask itself a question, and neither can a bot
   token: the bot ignores its own messages. Use **Claude in Chrome** (Kyle's
   real logged-in browser), NEVER desktop screen control of the Discord app.
   Desktop control is reserved for iPhone Mirroring alone.

Anything else — reading, checking, measuring — should be text.

## Verify the layer that matters

Both bots have been bitten by this.

- **Checking retrieval instead of the answer.** In the Tempest bot every test
  asked "is this fact retrieved?" and none asked "what does the bot say?", so a
  stale instruction suppressed correct data while 211 tests passed. This repo
  has the same exposure: nothing verifies what `#arch-ai` actually replies.
- **Measuring a different source than production reads.** Here, 11 of 14
  `weapons.*` entries are truncated at 183 characters in `data/knowledge.json`,
  so every Legendary and Mythic tier is missing from the rendered prompt — while
  reading the file casually suggests the data is present. Check
  `lib/knowledge-render.js` output, not the raw JSON, when asking "does the bot
  know X?".

Before trusting a measurement, ask what production reads and whether your tool
reads the same thing.

## Prove a fix by breaking it

A test that passes is not evidence until you have seen it fail. Reintroduce the
bug, watch the test go red, restore. Every guard added to this repo has been
verified by reinstating the bug and watching it fail — the welcome-deletion
test, the state-store atomicity tests, the schedule tests. In the sibling repo
several guards passed while the bug was live: one matched lowercase `runes` and
missed capital `Rune`; one used a ±260-character window to find an exemption and
picked the phrase up from a different sentence.

Each was found by sabotaging the input, not by reading the test.
