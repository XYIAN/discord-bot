# Merge review — community knowledge import

**Nothing here has been merged into `data/knowledge.json`.** The fragments in
`fragments/` are staged for review. `knowledge.json` is live production data that was
already wiped once by an infrastructure incident, so every conflict below needs a human
decision before anything lands.

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

| Topic | Source says | Live says | Why it matters |
|---|---|---|---|
| `star_system.max_stars` | **8** stars (skill Lv4 at 8★) | **7** | Changes every progression calculation downstream |
| `characters.mymu` skill | Consumes 50–100% of **HP**, **reduced** ATK/MOV SPD | 50–100% of **ATK**, **increased** speed | These describe opposite effects |
| `characters.loki` Focus | 15s | 3s | 5× difference |
| `characters.helix` Lv4 | ATK +20% | ATK **SPD** | Different stat |
| Ad-free card name | Lifetime Ad-Free Card | Permanent Ad-Free Card | Source has it 3×, live has it 0× |
| Sacred Hall currency | Character Shadows + Abyssal Stonework | earned from Abyssal Tide | Flagged from both sides independently |
| Star buff cadence | Dracoola/Loki at 4★ only | all heroes 1/4/7 | Probably a source transcription gap |

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

1. Repair the six truncated live entries — unambiguous.
2. Merge the 10 genuinely new topics (shop, events, hunt, battle_pass, currencies,
   daily_rewards, reach_rewards, camp_mystlings, main_screen, event_shop) — nothing to
   conflict with.
3. Work the contradiction table with Kyle, starting with `max_stars`.
4. Decide policy on volatile numbers: seed with caveat, or leave to `!suggest`.
