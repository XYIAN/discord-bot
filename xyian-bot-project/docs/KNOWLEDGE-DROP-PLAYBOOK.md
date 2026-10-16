# Knowledge drop playbook — folding a game update into Arch AI

How to take an Archero 2 update — official patch notes, an in-game Notice, or
screenshots of runes, characters, skins, mystlings, events — and land it in
`data/knowledge.json` so the bot answers from it correctly, without breaking
anything it already knew. This is the procedure that shipped v3.36.1 (Version
1.1.9, eight screenshots, 52 additions, 47 structured + 6 custom-fact
repairs), carrying the lessons of v3.33.0–v3.33.4 (the August notes, whose
repairs stopped in the repo until the seed manifests existed), written down so
the next agent does not rediscover it.

Read in this order, then start:

1. this file;
2. [`KNOWLEDGE-GUIDE.md`](KNOWLEDGE-GUIDE.md) — read ONLY "How to add data —
   use a fragment", "Correcting a `custom_fact`", "How a repair reaches
   production", "Approved-suggestion / vision entry shape" and "Verify the
   ANSWER". Its older sections — "How to Add Data" 1–6 (hand-editing), the
   `cp data → seeds` line under "seeds/knowledge.json", the category Status
   column ("runes Empty", "All 17 characters"), the weapons object example and
   the "~$0.05 a run" figure — predate the fragment workflow and are wrong
   where they disagree with this file. This file wins;
3. [`RELEASE-GUIDE.md`](RELEASE-GUIDE.md) — CHANGELOG, version ordering,
   deploy. Its "Knowledge-only update" scenario ("Edit `data/knowledge.json`")
   also predates the fragment rule; the fragment path here wins;
4. the repo's agent notes at `../CLAUDE.md` (one level above
   `xyian-bot-project/`) — hard rules and gotchas;
5. the worked example: [`game-knowledge/updates/2026-09-17-version-1.1.9.md`](game-knowledge/updates/2026-09-17-version-1.1.9.md)
   and its fragment `data/knowledge-fragments/update-2026-09-17-version-1-1-9.json`.
   Its dry run reports one conflict today, `gold.community_weapon_cap` — see
   the replay invariant below; that is expected.

Paths below are relative to `xyian-bot-project/` unless they start with `/`.
The repo root is `/Users/kyle/code/discord/discord-bot`; the bot lives in
`/Users/kyle/code/discord/discord-bot/xyian-bot-project`.

## The invariants (break one and the drop is wrong)

- **`data/knowledge.json` is applied to, never typed into** — a fragment under
  `data/knowledge-fragments/` + `scripts/merge-knowledge.js`; `--repair
  <dotted.path>` for overwrites; `custom_facts_repairs` + `--repair
  custom_facts` for facts; never `cp data → seeds` (why: KNOWLEDGE-GUIDE "How
  to add data" and "How a repair reaches production"). A `--repair` path is
  the path of the LEAF value (string or array), never a parent object:
  `--repair characters.hou_yi` leaves `characters.hou_yi.note` a conflict. Use
  the exact path the dry run prints.
- **A fragment must replay as a clean no-op at the moment it is applied** (0
  added / 0 repaired / 0 facts / 0 renamed / 0 conflicts on the second dry
  run). That is what makes it a record. A later drop that repairs one of its
  paths makes the older fragment report exactly that path as a conflict — that
  is history; never edit an old fragment to silence it. (As of 2026-09-28 the
  1.1.9 fragment reports `gold.community_weapon_cap`, repaired again by
  `update-2026-09-28-sync-prefix.json`.)
- **Every fact traces to the source verbatim.** Where the source names a thing
  without saying what it is, the entry says what the source says and that the
  rest is *not documented*, and points at `!suggest`. No inference, no
  "probably", no negatives from silence ("there is no switch for runes" when
  the notes merely did not mention one).
- **The consumer is gpt-4o-mini** (`../CLAUDE.md`, "Production runs
  gpt-4o-mini"). So: repair the old entry instead of adding a contradicting
  sibling; put a caveat *inside* the value it qualifies; make an enumeration
  complete before any qualifier; keep dates absolute with the year; never leave
  "newest", "latest", "begins", "ends on", "in this update" pointing at a
  superseded thing; and treat a "do not / never / not to be confused with"
  sentence as outranking every fact beside it.
- **Object keys are rendered into the prompt** as retrieval labels. Name a key
  by what a member will ask (`main_arena_tiers`, `starfall_disc`), match the
  neighbouring keys' naming and shape, and prefer repairing an existing key to
  inventing a versioned twin.
- **No `Co-Authored-By` / `Generated with` trailers** in commit messages — they
  surface in #changelog and the deploy notice. Commit subject starts with the
  version (`v3.36.1: …`).
- **Only `screenshots/` directories are gitignored** (`*.png` is not —
  `git check-ignore` shows it). Save or copy every source
  image to `/Users/kyle/code/discord/discord-bot/screenshots/<YYYY-MM-DD>-<topic>/`
  and record each absolute path — the workflow's `images` arg needs them and the
  verifiers open them with Read. Images pasted into chat land at
  `/Users/kyle/.claude/uploads/<session id>/<hash>-image.png` (the session id
  is the folder name in your scratchpad path); copy them from there, in reading
  order. `git add` files by name, never `-A`. The transcript is what gets
  committed.
- **Run `npm test` from the repo root**, not from `xyian-bot-project/` (no
  `test` script there). `node --check` a script to syntax-check it — `node -e
  "require('./scripts/answer-check.js')"` RUNS the paid check.
- **Parallel shells share one working directory.** Use absolute paths in every
  command that runs beside another; never rely on a leading `cd`.

## Step 0 — prep (before any images arrive)

```bash
cd /Users/kyle/code/discord/discord-bot && git status --short && git log --oneline -1
node xyian-bot-project/scripts/sync-facts.js          # dry run: must print "NEW facts to add: 0" and "Approved suggestions not synced: 0"
node xyian-bot-project/scripts/read-channel.js debug-logs 60 | grep -B1 -A2 'Bot deployed'   # last boot notice: version + fact count (3 messages are not enough — role grants and welcomes land above it)
```

If `git status --short` prints anything, STOP and ask Kyle what it is before
touching the tree — never stash, reset or fold it into your drop. A dirty tree
is usually a release in flight (v3.36.2 sat uncommitted on 2026-09-28 while
these docs were reviewed).

If `sync-facts.js` lists live facts, they are community `!addfact` posts not yet
in the repo — sync them (`--apply`) in their own patch release first, or note
why not. One false positive is known: if an earlier repair changed the first 40
characters of a community fact, the matcher re-proposes the original. Keep the
first 40 characters of a repaired community fact byte-identical.

List the time-bound facts that the update is most likely to overturn:

```bash
cd /Users/kyle/code/discord/discord-bot/xyian-bot-project && node -e "
const kb=require('./data/knowledge.json');
const re=/\b(begins|ends on|upcoming|coming soon|newest|latest|currently|as of|this update|in this update|most recent|next season|starts on|will be|once .{0,20}go live|takes effect|opens|lasts|scheduled)\b/i;
(function walk(o,p){ if(o&&typeof o==='object'){for(const k of Object.keys(o))walk(o[k],p?p+'.'+k:k);} else if(typeof o==='string'&&re.test(o)) console.log(p+'\n    '+o.replace(/\s+/g,' ').slice(0,200)+'\n'); })(kb,'');"
```

Then the gaps the screenshots may fill and the directives they may falsify:

```bash
cd /Users/kyle/code/discord/discord-bot/xyian-bot-project && node -e "
const kb=require('./data/knowledge.json');
const gap=/\b(not documented|not explained|not recorded|unrecorded|unknown|named only|name only|no data|!suggest)\b/i;
const dir=/\b(do not|don't|never|not to be confused|is not a|are not)\b/i;
(function walk(o,p){ if(o&&typeof o==='object'){for(const k of Object.keys(o))walk(o[k],p?p+'.'+k:k);} else if(typeof o==='string'){ if(gap.test(o))console.log('GAP       '+p); if(dir.test(o))console.log('DIRECTIVE '+p); } })(kb,'');"
```

Filter both lists to the drop's entities. Every GAP the source fills (55 today:
`characters.artemis`, `characters.demeter`, `runes.twinborn_etched_runes`,
Starfall Disc, Football Rumble, …) is a `--repair` of that path, never a new
sibling — a stale "not documented" beside fifty new facts is the CLAUDE.md
coin-flip. Hand Kyle the gaps that match his topic so he can capture what is
still missing. A DIRECTIVE about a touched entity outranks every fact beside
it; if the source falsifies it, repair the value (Step 2, class "directive").

Post the Step 0 report and what the KB currently says about the topic,
pre-draft the `sections` array (with the stale-sweep entry) and the member
`questions` from the topic Kyle named, then ask for the screenshots and END
YOUR TURN. They arrive pasted into Kyle's next message; do not sleep, poll or
Monitor for them.

## Step 1 — transcribe

Copy the images to `/Users/kyle/code/discord/discord-bot/screenshots/<YYYY-MM-DD>-<topic>/`
first (see the invariant) and list the file names in the transcript preamble.
Then write
`docs/game-knowledge/updates/YYYY-MM-DD-<topic>.md`: a verbatim transcript,
reconstructed once in reading order when screens overlap, with an italic
preamble stating source, capture date, who captured it, and what is editorial.
Rules that have mattered:

- Copy exact strings: names, numbers, ranges, dates as printed (`09/19-10/02`
  is month/day), times with their zone, spellings even when odd
  (`Transcendant`). Note where a printed rule sits — an italic footer under one
  section belongs to that section, not to the whole notice.
- For stat screens (a rune's quality ladder, a hero's skill levels, a skin's
  abilities) transcribe as the ladder the game shows, one line per tier, in the
  game's order. Say when a list is cut off ("cut off after Epic") — that
  sentence goes into the entry too.
- Say what the screen does **not** show. "Named only; not explained" is a fact
  the entry will need.
- Two independent re-reads of every image against the transcript, one in
  reverse order, before anything else is built on it — the Workflow's first
  phase does these (two verifiers, then a reconciler that edits the
  transcript); do not do them by hand as well. Zero discrepancies is a normal
  result; one wrong digit is not.
- Add the transcript to the "Update notices" list in
  [`game-knowledge/INDEX.md`](game-knowledge/INDEX.md).

## Step 2 — diff against the knowledge base

First, `ls data/knowledge-fragments/` and read the `_meta` of every fragment
that names the same update, event or entity. If the new source corrects an
earlier one (official notes after a preview, screenshots after a text paste),
record `"supersedes": "data/knowledge-fragments/<old>.json"` in `_meta` and
repair every name the earlier fragment introduced (as
`update-2026-08-28-official.json` does); if part of the source is already in,
diff only the tail and say so in `_meta.source` (as
`update-2026-09-06-hotfix-tail.json` does).

One pass per section of the source (events, guild, arena, gear/runes,
progression, characters, quality-of-life, and always a **stale sweep** of dated
claims). For each, a helper that walks `data/knowledge.json` and prints
`dotted.path → FULL value` for every key or value matching a regex, run for
every entity and its variants (`Angler` and `fishing`; `Guild Raid`, `raid`
and `Monster Invasion`; `Transcendant` and `Transcendent`; the old chapter
ranges). Classify each hit: contradicts / stale / supports / naming variant /
homonym risk / extends / **directive** (a "do not / never / is not / not to
be confused with" sentence about a touched entity — it outranks every fact
beside it; if the source falsifies it, repair the value, and if the key itself
states the directive see the rename rule in Step 3) — and the action: repair
(full replacement text that keeps every still-true fact), add a sibling,
custom-fact repair (verbatim
`match_text`), or none. For each uncovered entity: proposed category and key,
following the neighbours. List homonyms a small model will trip on (`Sprite`
the summon vs Sprite damage, `Meteor` build vs weapon effect, `Etched` tier vs
Etched Twinborn, `Charm` the stat, `Pool` the fishing zone vs the map).

## Step 3 — draft the fragment

`data/knowledge-fragments/update-YYYY-MM-DD-<topic>.json`, shaped like the KB:

```json
{
  "_meta": {
    "source": "what, captured by whom, when, transcribed where",
    "confidence": "what is verbatim, what is a stated reading, what is unknown",
    "transcript": "docs/game-knowledge/updates/YYYY-MM-DD-<topic>.md",
    "supersedes": "data/knowledge-fragments/<earlier fragment this corrects, if any>.json",
    "conflictsWithLive": ["every.dotted.path", "this.fragment.overwrites", "and.every._renames.from"]
  },
  "_renames": [ { "from": "guild.old_key", "to": "guild.new_key", "reason": "…" } ],
  "game_modes": { "arena": { "main_arena_tiers": "…repaired full text…" } },
  "custom_facts": [ { "text": "…", "added_by": "XYIAN", "added_at": "YYYY-MM-DD", "source": "patch_notes", "game_version": "1.1.9", "announced": "YYYY-MM-DD" } ],
  "custom_facts_repairs": [ { "match_text": "EXACT existing text", "text": "corrected text", "reason": "…", "repaired_at": "YYYY-MM-DD" } ]
}
```

Rules learned the hard way:

- **A repaired value keeps the old facts and dates them.** "Three SEPARATE
  difficulty reductions: 1.1.7 after Chapter 80; the August 2026 hotfix after
  Chapter 130; Version 1.1.9 past Chapter 100. The newest is …". Never delete a
  key — a deleted key is not deleted from the volume.
- **Rename a key only if it has not shipped.** `_renames` moves a value to a
  new key in the same parent (gated on `--repair <from>`, so list `from` in
  `conflictsWithLive`; position kept). But the boot merge (`mergeSeedTopics`
  in `lib/contributions.js`) is additive and records no renames: the new key
  lands on the volume and the old key stays beside it with its old value —
  the same reason a deleted key is not deleted. So rename only a key your own
  drop added in this release. For a shipped key whose label is wrong (a
  preview-era name, a directive the source falsifies), keep the key and repair
  its VALUE to state the resolution, correct name first.
- **Caveat the copies too.** If a rune ladder or a build tip exists both as a
  structured entry and as a community custom fact, both get the "recorded
  before Version X" prefix, or the uncaveated copy wins.
- **Placeholders that head a section** ("Data to be filled in later") get
  repaired the moment real entries land beside them, or the model recites the
  placeholder.
- **Summary counts rot** ("the two leagues documented", "17 characters", "6
  tiers"). Repair them to enumerations or to "documented here: A, B, C".
- **Both spellings, once, inside the entry** when the source and the KB
  disagree on a name.
- **Say "Version 1.1.9", never "the hotfix"** when older entries already own
  "the August 2026 hotfix". One provenance/version custom fact per drop; keep
  custom facts to a version fact, a headline list, and the bug fixes — the
  per-item detail lives in structured entries (one source of truth per item).
- **Release date:** an in-game notice does not print one. Record the capture
  date and Kyle's report that the update had arrived; tell members whose
  client still shows the old thing that it has not reached them yet.
- **Prompt size is a budget.** The production render was ~220k characters
  (~55k tokens) after v3.36.1 and grows with every drop; every question pays
  for it and retrieval gets worse. Prefer repair over add, do not restate an
  item in three places, and read the two advisory lists at the bottom of the
  merge output: "oversized values" (>400 chars) and "values that look
  truncated mid-sentence" — a path you repaired must not appear in the second
  (three pre-existing entries do: `weapons.griffin_claw`,
  `weapons.dragoon_helmet`, `runes.blessing_quality_revive`; fix them if your
  drop touches them).

### Entry shapes, as they actually are in `data/knowledge.json`

Checked against the v3.36.2 working tree on 2026-09-28. After any later drop,
re-check a row before trusting it with a shape helper that walks the category
and prints `key → type → first 200 chars`.

| Category | Shape of a full entry | Notes |
|---|---|---|
| `characters.<snake_name>` | object: `rarity` (`rare`/`epic`/`legendary`), `aka` [], `skill_name`, `stat_boost` ("[All] X +N% (at stars 1, 4, and 7)"), `skill_levels` {"1"–"4"} — Lv1 at 0 stars (owning), Lv2 at 2, Lv3 at 5, Lv4 at 7 per `star_system.skill_level_unlocks`; the stored `skill_levels` values do NOT repeat the star numbers, keep it that way (`star_system.star_pattern` also carries an "8" row although `max_stars` is 7 — if the screens settle it, repair that in the same fragment); optional `acquisition`, `note`, `note_kit`; extra facts as sibling string keys (e.g. `bleed_resistance_fix_1_1_9`) | Name-only heroes are plain strings that say so (`artemis`, `demeter`); the other plain strings in the category are roster-level facts, not heroes (`rarity_*`, `acquisition_*`, `shards`, `shard_exchange`, `unique_skill_kits`, `outfit_button`). On ANY roster change repair all of: `_coverage` ("6 Rare, 6 Epic and 5 Legendary" + the name-only list), `acquisition_event_only_heroes` (enumerates Nezha, Wukong, Rick, Morty) if the hero is event-only, `hou_yi.note` ("was the newest Rare") if a newer Rare lands. When a name-only hero gets a kit, replace its string with the full object (`--repair characters.<name>`) and drop it from `_coverage`'s name-only list. |
| `runes.*` ladders | plain string, one tier per line: header, `<Theme>:`, `<Rune name>`, then the tiers — three DIFFERENT ladders by category, see "Runes, as stored" below | Keys, placement and the enumerations to repair: "Runes, as stored" below. "No additional buff" lines are counted by `test/knowledge-render.test.js` — see Step 6. |
| skins | Character skins: `skins.<hero>_<skin_name>` plain string (precedents `artemis_moonwake_shimmer`, `demeter_silkveil_harvest`; `mymu_skin_note` is the odd one). Weapon skins: `gear_sets.weapon_skins.<snake_name>` object `{set, type, flavor?, skin_skill?, skill_scaling?, collectible_stats \| collectible_stats_by_star}` — decide which from the screen (a hero's Outfit screen vs a gear piece's skin) | `skins._placeholder` enumerates the documented character skins BY NAME and ends "any other skin is not documented" — add every new character skin to it with `--repair skins._placeholder`, or the bot denies the skin exists. |
| `mystlings.<snake_name>` | plain string | Aspect, Active Skill, Collection Stat, acquisition — say "not documented" for each the source omits. Precedent for a new creature is `dragon_gate_koi` (plain snake name); `example_death_mage` is a one-off illustration key — do not copy the `example_` prefix. The remaining keys are Camp/Hatchery/collection-track facts, not creatures. |
| `gear_sets.<set>_set` / `weapons.<set>_<piece>` | `gear_sets.<set>_set` object: `griffin_set`/`oracle_set` have `theme`, `recurring_pattern`/`structure_note`, then one `<set>_<piece>` sub-object `{slot, flavor, quality_skills[, skin_skill_note]}` (`quality_skills` = comma list captured at Chaotic, see `stat_snapshot_caveat`); `dragoon_set` has NO per-piece sub-objects. `weapons.<set>_<piece>` plain string: `The <Set> Quality Skills:` / `<Piece>` / `Base:` (weapon only), Fine, Rare, Epic, `Epic +1: No additional buff`, `Epic +2: No additional buff`, Legendary … | Every stored `weapons.*` ladder is cut off at ~183 chars mid-line (a known truncation; merge-knowledge's "truncated" list flags only `griffin_claw` and `dragoon_helmet` because the check is conservative). The `dragoon_*` "cut off after the Epic tier" sentence is that truncation, not the source. A gear-ladder screenshot is a `--repair` of that `weapons` key restoring the full ladder (keep the dragoon pre-rebalance caveat prefix in place), and it moves the weapons 7-count in Step 6. |
| `skills.<snake_name>` | object `{name, description, added_by, added_at, source}` — no `.text`, renders as JSON | precedent `wheat_field` (Version 1.1.9); `tracking_eye` / `weaken` predate `added_at`/`source`. |
| `game_modes.events.<event>` | plain string | Dates absolute; the event's parts enumerated first. |
| `custom_facts[]` | `{text, added_by, added_at, source, game_version?, announced?}` | Array — append only; correct with `custom_facts_repairs`. `game_version` whenever the source is a versioned update (free-form provenance; the renderer uses only `text`). Repaired entries gain `repair_reason`/`repaired_at` from the merge — never hand-write them. Community facts have `added_by` = the member's handle ("(via suggestion)" suffix when sync-facts filed it) and `source` addfact / suggestion / history_audit — those are the ones whose first 40 characters must stay byte-identical on repair. |
| approved-suggestion shape | `{text, added_by, added_at, source}` inside a category | Coexists with curated objects; the renderer prefers `.text`. `added_by` is "<handle> (via suggestion)" when sync-facts files it; `source` ∈ suggestion / vision / addfact; live instance `gear_sets.pvp_mixed_set`. |

#### Runes, as stored

Three different ladders — quote the tier labels exactly; the compact renderer
and the Step 6 counts regex-match them:

- **Etched** (`etched_*`): header `Etched Runes Quality Skills:` / `<Theme>:` /
  `<Rune name>`, then Common, Fine, Rare, Epic, Legendary, Legendary +1,
  Legendary +2, Legendary +3, Mythic. Never an Epic +1/+2 line and never an
  enchantment line — Etched runes have no Enchantment slot
  (`enchantment_system.applies_to`, `twinborn_etched_runes`).
- **Ability / Enhancement** (`ability_*`, `enhancement_*`): header `Ability
  Runes` / `Enhancement Runes`, then `<Theme>:` / `<Rune>`, then Common, Fine,
  Rare, Epic, `Epic +1: No additional buff`, `Epic +2: No additional buff but
  unlocked rune enchantment capabilities`, Legendary, `Legendary +1: No
  additional buff`, `Legendary +2: No additional buff`, Mythic. No stored
  ladder has a Legendary +3 line although `rarity_ladder.order` lists one —
  transcribe it only if the screen shows it.
- **Blessing**: header `Blessing Runes Quality Skills:` / `<Rune>`, then Rare,
  Epic, Legendary, Mythic.

Keys are NOT `<category>_<theme>` × 7 themes. Etched: `etched_elemental`,
`etched_circles`, `etched_meteors`, `etched_strikes`, `etched_main_weapon`,
one rune each; no `etched_sprites` / `etched_plants` yet, and 8 of the 13
Etched runes `overview_4_types` names have no ladder at all. Enhancement:
`enhancement_overview` (name list AND the Sharp Arrow ladder),
`enhancement_elemental` (Flamenox Seal, Frostshock Seal, Spin SPD Up),
`enhancement_circles_meteors` (Sawblade Circle, Giant Meteor, Potion Magnet),
`enhancement_sprites`, `enhancement_strikes`, `enhancement_plants`. Ability:
`ability_overview` (names only), `ability_main_weapon_elemental` (Arrow Rain,
Flamenox Touch, Frostshock Touch), `ability_circles`, `ability_meteors`,
`ability_sprites`, `ability_strikes`, `ability_plants`. Blessing: one ladder
key, `blessing_quality_revive`, whose Mythic line is empty — a Revive
screenshot is a `--repair` of it.

Placement: a new Etched rune in Sprites or Plants → NEW key `etched_sprites` /
`etched_plants` in the Etched header shape. A new Etched rune in an existing
theme, or any new Ability/Enhancement rune → `--repair` of the key that holds
that theme (named above), the fragment carrying the WHOLE existing string plus
the new rune, old lines byte-identical (the merge replaces the leaf wholesale).
A new Blessing rune → new key `blessing_quality_<rune>` beside `revive`, never
the top-level `blessings` category (empty, renders nothing). Every rune
addition also repairs the enumerations that name runes: `runes._coverage`
("13 Ability, 13 Enhancement, 7 Blessing and 13 Etched"), `overview_4_types`
("Etched Runes (13):" + per-theme lists), `enhancement_overview` /
`ability_overview` ("There are currently 13 …" + the per-theme grouping),
`themes.count` if a theme is new, `unlock_counts_by_category` if the ladder
shape is new, `enchantment_categories.specialized_coverage` ("2 of 13"), and
`build_patterns` if the rune is a build piece.

## Step 4 — adversarial review before applying

Three read-only lenses, then one fixer, then a fresh dry run:

- **Fidelity** — every sentence traced to the transcript; list notice items
  with no entry. Hunt: invented definitions ("affix means…", "Sprite damage
  is…"), inferences ("new skin means an earlier skin existed"), negatives from
  silence, a release date the source never printed, glosses on quoted rules.
- **Contradiction after merge** — simulate the merged KB with the REAL merge
  (`require('./lib/knowledge-merge').mergeFragment(live, fragment, { allowRepair })`;
  a hand-rolled deep-merge reviews a KB that will never exist) and grep it for
  every sentence that still disagrees with the fragment (old tier lists, old windows
  spelled out in full beside the new ones, uncaveated copies, placeholders,
  counts). Check every `conflictsWithLive` path exists — a typo there becomes
  an addition, not a repair.
- **Small-model retrieval** — keys as labels, enumeration-first, caveats in
  place, absolute dates, future-dated vs live-now unmistakable, homonyms
  disambiguated in line; then walk 15–20 member questions through the merged
  text and say which a small model would get wrong.

## Step 5 — apply

```bash
cd /Users/kyle/code/discord/discord-bot/xyian-bot-project
export F=data/knowledge-fragments/update-YYYY-MM-DD-<topic>.json   # export — a plain F=… is invisible to node
node scripts/merge-knowledge.js $F --dry-run        # conflicts == conflictsWithLive, plus one custom_facts[N] line per custom_facts_repairs entry — nothing else
node - <<'JS'                                        # apply with every repair flag; avoids zsh word-splitting
const { spawnSync } = require('child_process');
const F = process.env.F; if (!F) { console.error('export F=<fragment> first'); process.exit(2); }
const f = require(require('path').resolve(F));
const args = ['scripts/merge-knowledge.js', F];
for (const p of f._meta.conflictsWithLive) args.push('--repair', p);
for (const r of f._renames || []) args.push('--repair', r.from);   // renames are gated on the FROM path
if (f.custom_facts_repairs) args.push('--repair', 'custom_facts');
const r = spawnSync('node', args, { encoding: 'utf8', stdio: 'inherit' });
process.exit(r.status);
JS
node scripts/merge-knowledge.js $F --dry-run        # replay: 0 added / 0 repaired / 0 facts / 0 renamed / 0 conflicts
```

The script writes `data/`, mirrors `seeds/` with the manifests, and leaves a
timestamped `.bak` (gitignored). Seed manifests and repair chains:
KNOWLEDGE-GUIDE "How a repair reaches production"; `test/seed-manifest.test.js`
follows the chains.

## Step 6 — tests

```bash
cd /Users/kyle/code/discord/discord-bot/xyian-bot-project && node -e "
const fs=require('fs'),crypto=require('crypto');
const {renderKnowledge,PRODUCTION_OPTIONS}=require('./lib/knowledge-render');
const KB=JSON.parse(fs.readFileSync('data/knowledge.json','utf8'));
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const d=renderKnowledge(KB),p=renderKnowledge(KB,PRODUCTION_OPTIONS);
console.log('default',d.length,sha(d));console.log('production',p.length,sha(p));"
```

Re-pin all four values in `test/knowledge-render.test.js` (two lengths, two
hashes) in the same commit as the data change. That file ALSO pins three line
counts against the live data: (a) 26 `No additional buff but…`
enchantment-unlock lines — one per Ability/Enhancement rune, so +1 per new
Ability or Enhancement ladder; (b) 15 real `Legendary +N:` buff lines — three
per Etched ladder, so +3 per new Etched rune; (c) 7 `Epic/Legendary +N: No
additional buff` no-op lines in the WEAPONS category only — moves when a
gear-piece ladder is added or repaired, never on a runes drop. A Blessing
ladder moves none of them. Read the assertions, count the new lines, update
the numbers and say so in the commit. A wording-only repair moves the hashes
and leaves both lengths unchanged — that is normal. Then:

```bash
cd /Users/kyle/code/discord/discord-bot && npm test      # every test/*.test.js, offline, must be green
```

## Step 7 — answer check (paid, mandatory before shipping)

`scripts/answer-check.js` asks the real gpt-4o-mini every case and asserts on
the ANSWER. Before running:

- re-pin cases that assumed the old "newest" values (chapter ranges, tiers);
- add 10–15 cases for the new content. `say` = what a right answer must contain;
  `notSay` = the AFFIRMATIVE shape of a WRONG answer only (`/\bwas nerfed\b/`),
  never a topic word a right answer also uses ("different", "6 tiers" when the
  right answer says "no longer 6 tiers");
- include one negative control: something the source names but never explains
  must be answered "not documented", not invented.

Run it with the Bash tool's `run_in_background: true` — foreground calls time
out at 2 min (10 max) and this takes ~14 min for the 45 existing cases, ~18
min once yours are added (18 s pacing). Cost ≈ $0.40 for 45 cases, ≈ $0.50
with yours; the script header is authoritative (KNOWLEDGE-GUIDE's "~$0.05"
predates the 1.1.9 prompt size). Log to your scratchpad, not `/tmp`:

```bash
cd /Users/kyle/code/discord/discord-bot/xyian-bot-project && node scripts/answer-check.js > "$SCRATCH/answer-check.log" 2>&1
```

The tool re-invokes you when it exits (no `&`, no `nohup`, no trailing
`tail`); then `tail -2 "$SCRATCH/answer-check.log"` — the last line,
`N/M passed · tokens · ~$`, is the tally to deliver.

Read every answer, not only the ✓ — an embellishment the regex did not catch
("later refreshes cost gems", which the notice never said) is a wording fix in
the entry.

## Step 8 — release

1. `CHANGELOG.md` is the ONLY version source (`lib/changelog.js` parses the
   first `## [x.y.z]` heading; both package.json files are stale — 3.22.2 at
   the root, 3.12.3 in `xyian-bot-project/` — and never consulted: do not bump
   them, whatever the sibling repo's CLAUDE.md says). Add the new
   `## [x.y.z] - YYYY-MM-DD` at the TOP (patch for knowledge-only), a
   member-facing title and bullets — this is what #changelog posts.
2. `README.md` only if commands/roles/channels/docs changed.
3. If the drop taught a mechanism (as the repair chain did in v3.36.1), add
   the gotcha to `../CLAUDE.md` and KNOWLEDGE-GUIDE in the same commit — the
   next agent reads those, not the commit message.
4. Commit (subject starts with the version, no trailers), push `main`.
5. Watch for the boot notice — poll every ~30 s (expect ~2.5 min), do not
   screenshot:
   ```bash
   node /Users/kyle/code/discord/discord-bot/xyian-bot-project/scripts/read-channel.js debug-logs 60 | grep -B1 -A2 'Bot deployed'
   ```
   Expect `🚀 Bot deployed! vX.Y.Z`, a fact count that moved, `📋 vX.Y.Z posted
   to #changelog`; other events may land above it. `gh api
   repos/XYIAN/discord-bot/deployments` shows the deploy but can report
   `in_progress` after the bot is already up.
6. The only proof a REPAIR reached the volume is a live answer in #arch-ai.
   Ask three: one whose right answer exists only in a repaired value, one on a
   new entry, one negative control (something the source named but did not
   explain — must decline) — as Kyle, via Claude in Chrome (his browser; ask
   which one if several are connected) — or ask Kyle to. Read the replies with
   `node …/read-channel.js arch-ai 10`, not the screen. A wrong answer here is
   a fragment fix and a patch release, as v3.33.3 was (three asked, one
   wrong). Additions are proven by the fact count.
7. Re-run the `sync-facts.js` dry run; it must still list nothing.

## Orchestration (ultracode)

The v3.36.1 drop ran as one Workflow of 16 agents (≈55 min, ≈2.7M subagent
tokens for eight screens): 2 transcript verifiers → 1 reconciler → 8 section
diffs → 1 drafter → 3 review lenses → 1 fixer. Parallel agents are read-only;
every writer runs alone. The generalised script is at
[`workflows/knowledge-drop.workflow.js`](workflows/knowledge-drop.workflow.js):

```
Workflow({ scriptPath: "/Users/kyle/code/discord/discord-bot/xyian-bot-project/docs/workflows/knowledge-drop.workflow.js",
           args: { date, transcript, images, scratch, fragment, sections, questions?, version?, today?, factSource? } })
```

`args` is a real JSON object, not a string. `transcript` and `fragment` may be
relative to `xyian-bot-project/` or absolute; `images`, `scratch` and
`scriptPath` are absolute. `sections` is the list of `{key, title, entities}`
the diff fans out over — `entities` is ONE string (an array of strings is also
accepted): the hit-list for that section written from the transcript — names,
spelling variants and the KNOWN conflicts you already spotted. Always include
the stale-sweep section. `questions` are the member questions the retrieval
lens walks. Example for a runes drop:

```
sections: [
  { key: 'runes', title: 'Gear / runes', entities: 'Etched Twinborn rune ladder (Common→Mythic, cut off after Epic); Dragoon Set old/new switch; Meteor build affixes; spelling variants: Twinborn/Twin-born' },
  { key: 'characters', title: 'Characters', entities: '…' },
  { key: 'stale', title: 'Stale sweep of dated claims', entities: 'every value matching newest|latest|currently|in this update|begins|ends on that the drop overturns (Step 0 list)' }
]
```

The tool result names a `runId` and a transcript directory. If a phase result
looks empty or a summary line says `agent returned null`, Read
`<transcriptDir>/journal.jsonl` before diagnosing — it records each agent's
real return value. After a kill, a pause or a script edit, relaunch with
`Workflow({ scriptPath, args, resumeFromRunId })`: unchanged agent calls replay
from cache, only edited or new ones run. If the tool refuses a repo
`scriptPath`, Read the file and pass its contents via `script` instead (same
`args`); the result then gives a persisted path to reuse.

Lessons from the 30 September 2026 hero-and-rune drop (37 screens in eleven
batches, v3.36.3):

- **Batches are intake, not runs.** Copy each batch to `screenshots/`, extend
  the transcript, report what is captured and what is clipped, and wait. Launch
  the Workflow once, after the last batch. If more screens arrive seconds after
  launch, stop it (TaskStop) and relaunch with the full image list rather than
  editing the transcript under the verifiers; if they arrive late, file them
  for a follow-up fragment.
- **The owner's statements are a source.** Record them in the transcript under
  their own heading, in his words, numbered, with corrections kept beside the
  statement they supersede. Entries attribute them ("per XYIAN, the guild
  owner, <date>") and never present them as screen text. Pass
  `factSource: "screenshot"` so custom facts are not labelled patch notes, and
  give no `version` when the source is not a game update.
- **Rune popups scroll and print no tier names.** A list that seems to start at
  the blue dot is scrolled; ask for the top. Tiers are coloured dots (grey,
  green, blue, purple, yellow, red = Common … Mythic) and numbered markers
  (1–3 = Legendary +1 … +3). Untiered sword / heart lines and the Enchantment
  Stats block belong to the copy, not the rune.
- **A repair that turns a stub into an object** (a name-only hero becoming a
  full entry) is recorded in the seed manifest with every leaf as well as the
  parent — `withSeedManifests` does it, and `test/seed-manifest.test.js`
  fails without it.
- **When a case fails, read the whole answer several times before rewording.**
  `node scripts/ask.js --repeat 3 "the question"` prints full answers from the
  real model with the production prompt (answer-check truncates at 300
  characters). Wrong 3 times in 3 is a defect in the entry; wrong 1 time in 3
  is sampling. What the v3.36.3 failures turned out to be, in the order to
  check them:
  1. *A second, partial copy of the fact.* Another entry in the same fragment
     summarised Sprite's Awe's Mythic line as "summons 1 random Elemental
     Sprite" and the model answered from the summary. Grep the PRODUCTION
     render for a distinctive phrase; every hit outside the ladder is a rival.
  2. *A caveat ahead of, or beside, the ladder.* "The heal amount is not
     documented — do not give one" and "may be out of date — say so" were each
     recited as the answer to an unrelated tier question, and the second made
     the bot decline a line it holds. A note about one tier attracts every
     tier question on that rune. Keep ladder keys to the ladder; if a note is
     unavoidable make it trailing, neutral and free of instructions.
  3. *A line that carries several effects.* "X and additionally Y. Also, Z"
     lost Z every time. Write "(three effects): (1) Z. (2) X. (3) Y" with the
     easiest-to-drop effect first; the transcript keeps the printed wording.
  4. *A hero question asked "at N stars".* The hero object does not say which
     star unlocks which level; one sentence in `star_system.skill_level_unlocks`
     telling the model which level answers such a question fixed it for every
     hero at once.
  5. *A limit of the model.* Two adjacent tier lines that differ by one token
     ("ATK" / "ATK SPD") are answered from the first about two times in three
     under every wording — proven by a Mythic line with no "ATK" in it still
     being answered "ATK". Stop there: record the limit in `_meta`, assert
     something the model gets right, and tell Kyle.
  And two regexes failed on CORRECT answers ("two different labels for the same
  track", "cannot say it was nerfed") — fix the regex, never the entry.
- **Answer-check pacing scales with the prompt.** tokens ≈ render chars ÷ 4;
  keep (60 ÷ pacing seconds) × tokens under the 200k/min ceiling. At 278k
  chars that is 24 s a call, ~30 min and ~$0.80 for 75 cases.

Steps 5–8 stay in the main loop: they are mechanical, sequential, and the paid
check should run exactly once. Timings from v3.36.1: ~55 min workflow, ~5 min
merge/replay/re-pin/`npm test`, ~14 min answer-check (45 cases, ≈ $0.40),
~2.5 min from push to boot notice.
