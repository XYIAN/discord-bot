# Release Guide — Commit, Push & Deploy

Every `git push` to `main` triggers a Railway deploy. The bot reads `CHANGELOG.md` on startup and posts to Discord automatically. This guide ensures nothing gets missed.

## Before You Push

### 1. Update CHANGELOG.md

This is the single source of truth. The bot parses the latest entry on startup and posts it to `#changelog`.

**Add a new entry at the top:**
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Short title describing the change

- Bullet point for each notable change
- Use emoji prefixes for visual scanning
```

**Version bumps:**
- **Major** (X.0.0) — Breaking changes or full rebuilds
- **Minor** (3.X.0) — New features, commands, systems
- **Patch** (3.2.X) — Knowledge updates, bug fixes, docs, fact syncs

### 2. Update README.md (if applicable)

Update if you changed:
- Commands (add/remove/modify)
- Role tiers or permissions
- Server channels or bot-managed content
- Documentation files
- The "What it does" feature list
- New member flow

Skip for knowledge-only patches or minor bug fixes.

### 3. Update knowledge docs (if applicable)

- **`docs/KNOWLEDGE-GUIDE.md`** — If you added a new category or changed the data format
- **`docs/PERSONA.md`** — If you changed the bot's voice, added templates, or modified the system prompt

### 4. Verify JSON (if you edited knowledge.json)

```bash
node -e "require('./data/knowledge.json'); console.log('✅ Valid JSON')"
```

A broken JSON file will crash the bot on deploy.

## The Push

```bash
git add <files>
git commit -m "vX.Y.Z: Short description of what changed"
git push
```

**Commit message format:** Start with the version number so it's easy to trace deploys to commits.

## What Happens on Deploy

Railway detects the push and redeploys automatically. On startup, the bot:

1. **Parses `CHANGELOG.md`** — Reads the latest version and bullet points
2. **Checks `#changelog`** — Fetches the last message; if the version was already posted, it skips
3. **Posts to `#changelog`** — New version gets a green embed with the release notes
4. **Posts to debug** — Deploy notification with version, fact count, OpenAI status, and changelog post status (posted / skipped / failed)
5. **Loads `knowledge.json`** — Fresh data for Q&A
6. **Resumes scheduled messages** — Daily reset and guild recruitment timers restart

## Checklist

Copy this for each release:

```
- [ ] CHANGELOG.md updated with new version entry
- [ ] README.md updated (if features/commands/docs changed)
- [ ] knowledge.json valid (if edited)
- [ ] Commit message starts with version number
- [ ] Pushed to main
- [ ] Verified deploy in #debug-logs
- [ ] Verified changelog posted (or correctly skipped) in #changelog
```

## Common Scenarios

### Knowledge-only update (fact sync, new data)
1. Edit `data/knowledge.json`
2. Add patch entry to `CHANGELOG.md`
3. Validate JSON
4. Commit, push

### New feature (command, system, integration)
1. Edit `bot.js`
2. Add minor entry to `CHANGELOG.md`
3. Update `README.md`
4. Update relevant docs if needed
5. Commit, push

### Docs-only update (no bot changes)
1. Edit the doc files
2. Add patch entry to `CHANGELOG.md`
3. Commit, push
4. Note: The bot will redeploy but `#changelog` will post the new version — this is fine and expected

### Posting content to Discord channels (rules, guides, etc.)
1. Post via terminal/API (not bot code)
2. Add patch entry to `CHANGELOG.md` describing what was posted
3. Update `README.md` if a new channel was filled
4. Commit, push

## ⚠️ CRITICAL: Version Ordering in CHANGELOG.md

The bot uses `md.match(/^## \[(\d+\.\d+\.\d+)\]/m)` to parse the version — it grabs the **first** `## [x.x.x]` entry. If an older version is listed above a newer one, the bot will think it's running the old version and may skip the changelog post entirely.

**Rules:**
- Newest version is ALWAYS the first `## [x.x.x]` entry in the file
- Entries go newest → oldest, top → bottom
- `3.10.0` comes before `3.9.17` in semver (10 > 9) — be careful with double-digit minor versions
- If you're adding a patch after a minor bump, the patch number must be higher than the current top entry

**What happens when this breaks:** The bot deploys with the wrong version, the changelog post is skipped (thinks it's a duplicate), and no debug notification shows the real version. The deploy becomes invisible.

## What NOT to Do

- **Don't push without updating CHANGELOG.md** — The deploy notification will show the old version and `#changelog` will skip (since it's a duplicate). This makes it impossible to trace what changed.
- **Don't break semver ordering in CHANGELOG.md** — Newest version must always be first. A v3.9.x entry above a v3.10.x entry will cause the bot to parse the wrong version.
- **Don't edit `bot.js` version manually** — Version comes from `CHANGELOG.md` only.
- **Don't push broken JSON** — This will crash the bot. Always validate first.
- **Don't push secrets** — `.env` is gitignored. Never commit tokens or API keys.
