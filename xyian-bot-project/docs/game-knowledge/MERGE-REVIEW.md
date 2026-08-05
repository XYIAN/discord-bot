# Merge review — community knowledge import

> **STATUS as of v3.18.0 — all 15 fragments are now merged.** Every merge was
> additive-only: not one pre-existing value in `knowledge.json` was altered or removed,
> verified leaf-by-leaf against git HEAD after each slice. Live keys went 344 → 1,083.
>
> What remains open is the short list in **§2 Contradictions**, which is now much shorter
> than it looked. Everything else below is kept as the record of how the import was
> reviewed.

Source: community contribution by stacey-fails, 2026-08-04, branch
`Knowledgebase-Add---Likely-real-out-of-date-lol`. 15 markdown files → 15 JSON
fragments, **1,569 keys**.

## Audit result

**No fabrications found.** All 17 character skill names, 380 of 383 rune ladder entries
verbatim (3 faithful paraphrases), and every numeric claim traced back to the source
markdown. This was tested hard because the sibling bot has shipped an invented name before.

One inversion worth noting: the fragment says **"Lifetime Ad-Free Card"**, which appears
three times in the source. Live production says **"Permanent Ad-Free Card"**, which appears
in no source file. On that one, production is the suspect.

---

## 1. Repair live data first (no decision needed)

Six entries in live `knowledge.json` are **truncated mid-sentence** — damage that predates
this import and is unrelated to it:

- `runes.enchantment_stats` — ends `"...only one enchantment selecti"`
- `runes.blessing_quality_revive` — ends at `"Mythic"`
- four `runes.etched_*` entries — end mid-clause

The fragments happen to contain complete text for these. This is the one unambiguous win
in the whole import.

## 2. Contradictions — pick a winner

### What the `characters` merge actually found (v3.18.0)

The headline number was **41 conflicts**, which read as "this topic needs a lot of human
decisions". Compared field by field, it does not:

- **27 of 41 are wording-only** — identical numbers, different house style. Live writes
  `(at stars 1, 4, and 7)` and `attack speed by 4%`; the contribution writes `(1★, 4★, 7★)`
  and `ATK SPD by 4%`. Nothing to decide, nothing lost by keeping live.
- **A further 5 agree in substance** and only tripped the numeric check on phrasing —
  the resonance entries and `star_pattern.3`/`.4` say the same thing two ways.
- **2 are the contribution being less complete than live**, not disagreeing with it:
  `dracoola.stat_boost` and `loki.stat_boost` record only `(4★)` where all 13 other heroes
  in the same fragment record `(1★, 4★, 7★)`. A transcription gap. Live wins on merit.
- **2 are complementary notes**, kept side by side as `phynx.note_kit` / `hou_yi.note_kit`.
- **3 are the same single disagreement** — the star ladder — showing up in `max_stars`,
  `star_pattern.7` and `skill_level_unlocks`.

That leaves **4 real skill contradictions and 1 real question**, below. The additive merge
protected live from all of them without needing the answer first, so the bot has the
contribution's 46 new character keys today and the open questions can wait.

Worth noting: the five *new* `star_system` keys that did merge (`all_buff_unlocks`,
`resonance_unlocks`, `all_buff_meaning`, `how_stars_are_earned`, `strategy`) all
**corroborate** live — buffs at 1/4/7, resonance at 3 and 6. Checked explicitly that none
of the 46 added keys smuggles in the 8-star claim, so the disagreement stays isolated to
the three paths above rather than leaking into the knowledge base as a second opinion.

### One name inconsistency inside live itself

`characters.hou_yi.skill_name` is `"Sun Piercer"` but live's own skill text for that hero
says `"Sunpiercer"` in all four levels, and so does the contribution. Live disagrees with
itself; the contribution is right. Left alone because it is cosmetic and the rule for this
import was that live wins — but it is a free correction whenever someone wants it.

### The open table

| Topic | Source says | Live says | Why it matters |
|---|---|---|---|
| `star_system.max_stars` | **8** stars (skill Lv4 at 8★) | **7** (skill Lv4 at 7★) | Changes every progression calculation downstream. **Needs Kyle** — he plays the game. The source is internally consistent across 5 separate passages, and its ladder is more regular (skills at 0/2/5/8, buffs at 1/4/7, resonance at 3/6, no star doing double duty) where live has star 7 granting both a buff and Skill Lv4. That is suggestive, not proof. |
| `characters.mymu` skill | Consumes 50–100% of **HP**, **reduced** ATK/MOV SPD | 50–100% of **ATK**, **increased** speed | These describe opposite effects |
| `characters.loki` Focus | 15s | 3s | 5× difference |
| `characters.helix` Lv4 | ATK +20% | ATK **SPD** | Different stat |
| Ad-free card name | Lifetime Ad-Free Card | Permanent Ad-Free Card | Source has it 3×, live has it 0× |
| Sacred Hall currency | Character Shadows + Abyssal Stonework | earned from Abyssal Tide | Flagged from both sides independently |
| Star buff cadence | Dracoola/Loki at 4★ only | all heroes 1/4/7 | **Resolved — live wins.** All 13 other heroes in the same fragment say 1/4/7. A transcription gap, not a claim. |
| `characters.wukong` Lv1 | Summons **1** Monkey Mirage | Summons **3** | Newly surfaced in the v3.18.0 pass; not in the original review |

Also several rune ladder tiers disagree (Rootguard, Vine Bind, Melee/Healing Sprite,
Ring of Agony, Equinox Bloom's Frenzy vs Berserk, Frostshock Seal tiers swapped).

## 3. Do NOT seed — contributor's account state, not game constants

These are true of one player at one moment. Seeding them would repeat the mistake the
Tempest bot made with hero levels:

- Sacred Hall Lv.46 bonuses (ATK +5,000 / HP +20,000)
- Blessing Rune baseline at Legendary +2 (ATK PWR +570 / Max HP +2,280)
- Enhancement Rune base values, and all 13 `observed_enchantment` figures
- Daily Shop prices — a single snapshot of 24h-rotating stock

## 4. Volatile — seed with a staleness caveat or not at all

Most likely to have drifted since contribution:

- **Drop rates**: Enchantizer (Legendary 0.50% / Mythic 0.25%), Rune Ruins chest rates
- **Costs**: all gem and Enchantium prices, the escalating 300→400 gems/attempt ladder
- **Exchange rates**: gold-for-gems, "1 Advanced Enchantium per 100 standard pulls"
- **Real-money SKUs**: Aurocite ladder, pack pricing, "% Value" badges
- **Per-event values**: Event Shop token costs, Island Points thresholds — stale by
  design for any event other than the one captured

## 5. Source contradicts itself (unresolved, recorded not guessed)

- `characters.md`: heading says 6 Rare heroes documented, lists 6, then closes with
  "The 7 documented heroes appear to be the complete Rare roster." Only the 6 actually
  described were emitted.
- `more_shops.md` lists a "Legendary Character Universal Shard" while `currencies.md`
  says there are no universal shards. Same contributor, same day.
- 24 Mythic Specialized Enchantment rows are `[pending]` placeholders, not data —
  recorded as a coverage note so absence is not mistaken for "this rune has none".

## Suggested order

1. ~~Repair the six truncated live entries~~ — **done, v3.17.0.** Five `runes.etched_*`
   repaired and verified in production; the bot returns all 9 tiers of Arrow of Echoes.
2. ~~Merge the 10 genuinely new topics~~ — **done, v3.17.0.**
3. ~~Merge the 5 remaining topics~~ — **done, v3.18.0.** guild, gear_sets, rune systems,
   privilege_cards, events/game_modes, characters. All additive.
4. **Work the contradiction table with Kyle** — 5 items, starting with `max_stars`.
5. Decide policy on volatile numbers: seed with caveat, or leave to `!suggest`.
6. Still unrepaired: **11 `weapons.*` entries truncated at 183 chars** since v3.9.9. The
   contribution describes that gear as a flat effects list rather than a per-rarity ladder,
   so tier attribution cannot be reconstructed from it faithfully. Needs a different source
   or a decision to change the topic's shape.
7. Deliberately not merged: the four `*_rune_ladders` objects. They restate what live holds
   as flat ladder strings — better structured, and covering 13 etched runes to live's 5, but
   adopting them is a *replacement*, not a merge, and deserves its own slice.
