# #arch-ai full-channel audit

## What this is

`scripts/audit-arch-ai-full.js` pulls **every** message from #arch-ai (Discord pagination until exhausted), sorts **oldest → newest**, and compares:

| Source in Discord | Compared to |
|-------------------|-------------|
| `!addfact …` (body &gt; 20 chars) | All string content in `data/knowledge.json` (same loose matching as `sync-facts.js`) |
| `!suggest …` (not `!suggestions`) | `data/suggestions.json` (prefix / normalized match; `it'as` ↔ `it's` for typos) |

## Run

```bash
cd xyian-bot-project
node scripts/audit-arch-ai-full.js          # console report
node scripts/audit-arch-ai-full.js --json    # also writes data/arch-ai-audit-report.json
```

Requires `DISCORD_TOKEN` in `.env` (bot must read #arch-ai).

## Latest audit snapshot (2026-02-03)

| Metric | Value |
|--------|------|
| Total messages in channel | 188 |
| Oldest message | ~2025-10-09 |
| First `!addfact` | 2026-03-01 — _xyian — “The first guild donation of the day is free” |
| `!addfact` (valid length) | 30 — **all** present in knowledge |
| `!suggest` (valid) | 6 — 1 was Godforge (already credited as `!addfact` + suggestion #28); **4** were faria88pt damage-stat explains recovered into repo as suggestions **#30–33** + `custom_facts` + `damage_terminology` |

### Recovered gap (fixed in repo)

faria88pt used `!suggest` for detailed ATK / Main weapon DMG / DMG explanations. Those never hit the live bot’s `suggestions.json` (empty queue on Railway). They were restored from the audit and approved via `arch_ai_audit` in `suggestions.json`.

### Not facts

- `!suggestions`, `!approve`, `!removefact`, `!list facts`, `!ai-toggle`, etc. are commands, not content.
- One `suggest_too_short` from _xyian — body under 10 chars (ignored).

## Keeping sync in sync

- `sync-facts.js` still caps pages at 25×100; this channel currently has **&lt;200** messages, so both scripts see the full history.
- For very large channels, prefer `audit-arch-ai-full.js` for a guaranteed full scan.
