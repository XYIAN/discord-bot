# Gear

The bottom-nav **Gear** tab. Three sub-tabs: **Characters | Gear | Runes**. This file covers the **Gear** sub-tab specifically. Characters and Runes are separate files.

## Top-level structure

- **Characters / Gear / Runes** sub-tabs along the top
- Inside the **Gear** sub-tab: two views — **By Quality** (filter inventory by rarity) and **Blacksmith** (upgrade and forge gear)
- Center of screen: active hero portrait with stats (ATK / HP) and 6 equipped gear slots arranged around it
- Inventory grid below with all owned gear pieces

## The 6 gear slots

1. **Helmet**
2. **Armor**
3. **Weapon**
4. **Boots**
5. **Ring**
6. **Amulet**

## Loadout system

Every player has **8 saved loadouts** they can name and configure however they want. Loadouts persist independent of which hero is selected — they're player-level slots, not hero-level. Switch loadouts via the dropdown above the hero portrait.

Common naming conventions players use: hero names, content-specific labels (e.g., "Peak1", "Peak2", "Peak3" for Peak Arena setups), or numeric placeholders ("0").

## Gear sets

Six core gear sets total — three **base sets** and three **S-Ranked** counterparts.

| Base set (caps at Legendary) | S-Ranked counterpart (can reach Chaotic) |
|---|---|
| Destruction | **Dragoon** |
| Decisiveness | **Griffin** |
| Echo | **Oracle** |

> **Each S-Ranked set has a distinct role/playstyle** — pick the set that matches your hero and content. Griffin and Oracle role/theme detail is documented in their per-set sections below; Dragoon detail pending screenshots.

### S-Ranked indicator

S-Ranked gear pieces show a yellow **"S" badge** on the gear icon (which can look like a "5" at small sizes — it's an "S"). Only S-Ranked gear can be upgraded past Legendary.

### How to obtain S-Ranked gear

S-Ranked gear (Dragoon/Griffin/Oracle) **drops directly from Mythstone Chest and Chromatic Chest**. You don't need to build them up from base set pieces — you can pull them straight from chests.

> **Minimum rarity on pull: Epic.** S-Ranked gear is never dropped at Common / Fine / Rare. The lowest rarity an S-Ranked piece can come in at is **Epic**. From there, it can be upgraded all the way to Chaotic (the +tier ladder is what you progress through after pulling).

## Rarity / upgrade ladder

**14 tiers**, low → high:

1. Common
2. Fine
3. Rare
4. Epic
5. Legendary
6. Legendary +1
7. Legendary +2
8. Legendary +3
9. Mythic
10. Mythic +1
11. Mythic +2
12. Mythic +3
13. Mythic +4
14. **Chaotic** (top tier)

### Rarity caps by gear type

- **Base sets (Destruction / Decisiveness / Echo):** can be upgraded through **Legendary +3**, but cannot reach Mythic or beyond. Effective cap = Legendary +3.
- **S-Ranked sets (Dragoon / Griffin / Oracle):** can be upgraded all the way to **Chaotic** (the top of the 14-tier ladder).

> **Implication:** Past early game, base set pieces have no long-term upgrade ceiling — most players use them as upgrade fodder for S-Ranked pieces. See `hunt.md` for the per-set fodder source from idle drops.

## Gear levels

Each gear piece has a **Level** counter from 1 → 200, shown as e.g. "Level: 160/200" on the detail screen. Levels are upgraded with **Gear Scrolls** (slot-specific scrolls — Weapon Scroll for weapons, Armor Scroll for armor, etc.). Gear scrolls drop from Hunt and are sold in Daily Shop and as Reach milestone rewards.

**Gear levels and rarity are independent progression tracks.** A piece's level grows up to 200 on its own (via Gear Scrolls), and rarity is upgraded separately (via the Blacksmith). They do not affect each other.

## Gear piece detail screen

Tapping a gear piece opens a detail screen with:

- **Name + rarity tier** (e.g., "Griffin Claw" with "Chaotic" in subtitle)
- **Icon with S-badge** (if S-Ranked)
- **Level: X/200**
- **Skin Skills** — set-specific abilities granted by the piece (e.g., Griffin Claw: "Main weapon attacks have small chance to fire Snowball dealing 60% DMG and applying [Snow Cover]. Each stack reduces target's MOV SPD and ATK")
- **Quality Skills** — stat bonuses from the piece (e.g., ATK PWR +19,680, ATK PWR +5%, ATK SPD +5%, "Deal more DMG at closer distances, up to 10%", "Higher CRIT Rate at closer distances, up to 9%")
- **Action buttons:** Unequip / Upgrade / Quick Upgrade
- **Resource costs** for upgrades displayed at the bottom (Gold + slot-specific Scrolls)

## Hero stat sheet (the Details popup)

The full Details popup on the loadout screen shows every stat the hero has, organized into pages. Categories:

### Core
Total ATK, Total HP, ATK PWR, ATK Bonus %, Max HP, HP Bonus %, MOV SPD %, ATK SPD %.

### Crit
CRIT Rate, CRIT DMG, CRIT DMG REDUC, Reduced Crit DMG from Players (PvP-specific).

### Defense
Dodge, Effect RES, DMG REDUC, Final DMG REDUC, plus per-context: Barrage, Collision, Airborne, Ground, Minion, Elite, Boss.

### Offense
Final DMG Bonus, More damage VS [airborne / ground / minions / elites], Boss DMG, Main Weapon DMG (flat + %), Main Weapon CRIT Rate.

### Elemental
Poison DMG (flat), Lightning DMG (flat + %), Flame DMG %, Fire DMG (flat).

### Healing
Heal on Level Up, Red Heart Heal %, Heart Recovery %, Angel Recovery %.

### Misc
Devil's Pact HP cost reduced %.

> Most stats appear as both a flat + and a percentage variant — the game stacks both. Higher-tier gear and runes mostly contribute to the % multipliers.

---

## Griffin set — gear piece breakdown

All 6 Griffin S-Ranked pieces documented at the **Chaotic** rarity tier (the player's current state). Stats below are at Chaotic; lower rarities will show a subset of these effects.

### Recurring pattern across all Griffin pieces

Every piece has:
1. A **flat primary stat** (ATK PWR for offensive slots; Max HP for defensive slots)
2. A **% primary stat** matching #1
3. A **slot-flavored secondary stat** (e.g., Weapon → ATK SPD, Helmet → Red Heart Heal)
4. **[Slot]'s base stats +20% / +30% / +40%** appearing as 3 tiered upgrades (unlock as rarity climbs)
5. **One or two conditional/triggered effects** that scale by rarity tier (the second tier roughly doubles the first)

### Theme observed

Griffin's effects center on **proximity / melee-range bonuses** — multiple "more enemies in melee range = bigger bonus" effects, "Deal more DMG at closer distances", "Higher CRIT at closer distances", DOT auras within 7m, dodge while moving. This implies Griffin is built for **close-range crowd-fighting**. (Confirm interpretation when the player describes the set's role.)

### Per-piece details

#### Griffin Claw (Weapon)
- **Flavor:** "The Griffin's claws, sharp as if they could tear through the sky."
- **Skin Skill:** *(this slot displays the equipped weapon **skin's** ability, NOT a base Griffin Claw skill — see Gear Skins section below)*. Example skin currently equipped grants the **Snowball + Snow Cover** ability (Main weapon attacks have a small chance to fire Snowball dealing 60% DMG and applying Snow Cover, which reduces target MOV SPD and ATK; stacks).
- **Quality Skills:** ATK PWR +19,680 (flat), ATK PWR +5%, ATK SPD +5%, "Deal more DMG at closer distances, up to 10%", "Higher CRIT Rate at closer distances, up to 9% / 18%", Weapon's base stats +20% / +30% / +40%, "Close-range damage taken −20%"

#### Griffin Helmet
- **Flavor:** "The regal stance, wearing this makes your vision broader than the sky."
- **Quality Skills:** Max HP +60,960, Max HP +5%, Red Heart Heal +20%, "Higher CRIT DMG at closer distances, up to 36% / 72%", Max HP +10%, Helmet's base stats +20% / +30% / +40%, "Higher ATK SPD at closer distances to the target, up to 100%"

#### Griffin Armor
- **Flavor:** "Woven from the feathers of storms, it grants the wearer the protection of the king of the skies."
- **Quality Skills:** Max HP +59,520, Max HP +5%, Barrage DMG REDUC +5%, "Deals DMG over time to enemies within 7m", Max HP +10%, Armor's base stats +20% / +30% / +40%, "Doubles DMG over time to enemies within 7m", "Weakens enemies within 7m, deepens enemy wounds by 20%"

#### Griffin Boots
- **Flavor:** "Soaring through the clouds, these boots embody lofty ambition and swift winds."
- **Quality Skills:** Max HP +59,520, Max HP +5%, Dodge +5%, "The more enemies in melee range, the higher the CRIT DMG. Max at 4 enemies, up to 36% / 72% increase (Players/Bosses count as 2 units)", Max HP +10%, Boots' base stats +20% / +30% / +40%, "20% DMG REDUC when moving"

#### Griffin Ring
- **Flavor:** "Seize the gale, this ring symbolizes the perfect blend of freedom and power."
- **Quality Skills:** ATK PWR +15,720, ATK PWR +5%, CRIT Rate +3%, "The more enemies in melee range, the higher the CRIT Rate. Max at 3 enemies, up to 9% / 18% increase (Players/Bosses count as 2 units)", ATK PWR +10%, Ring's base stats +20% / +30% / +40%, "Hearts heal more at lower HP, up to 100%"

#### Griffin Amulet
- **Flavor:** "Wings' protection, the amulet contains formidable defense."
- **Quality Skills:** ATK PWR +17,160, ATK PWR +5%, CRIT DMG +12%, "Counter with 2x / 4x DMG to nearby enemies when damaged", ATK PWR +10%, Amulet's base stats +20% / +30% / +40%, "When taking DMG within distance of 7, chance to drop Hearts"

---

## Weapon Skins

**Skins exist only for the main weapon — there are no skins for Helmet / Armor / Boots / Ring / Amulet.** Only ONE weapon skin can be equipped at a time.

### Weapon types (3 base weapon archetypes)

Multiple skins exist for each archetype:

- **Crossbow** (the Heroic Longbow weapon family)
- **Staff** (the Beam Staff weapon family)
- **Claw** (the Agile Knuckles / Griffin Claw weapon family)

### How skins contribute to power

Each skin has two layers with **different activation rules**:

1. **Collectible Stats — STATIC, always active after owning** the skin. The "Always active after owning" wording on the in-game popup is literal. These per-piece-equipped bonuses (e.g., for every Griffin gear piece equipped: ATK+20, HP+80) apply **regardless of whether that skin is currently equipped**. Owning more skins **stacks their Collectible Stats permanently** across your account.

2. **Skin Skills — ONLY active while that skin is equipped**. The active ability proc (Snowball, Lacerate DoT, Cudgel Jab, summoned hoops, etc.) only triggers when you've selected that specific skin as your equipped weapon skin.

### Star upgrade levels (owned → 5★)

Every skin has 6 effective tiers: an **"owned"** baseline (the moment you acquire it, 0 stars filled) plus **1★ through 5★** upgrade levels. **You upgrade by acquiring duplicate skins** — each duplicate = 1 star upgrade. No currency-based upgrade path; only duplicates.

Higher stars unlock:
- Stronger Collectible Stats (bigger per-piece-equipped bonuses)
- Stronger Skin Skills (more damage, more procs, more stacks)

The lock icons on tiers above your current star count indicate locked tiers.

### Skin rarity affects Collectible Stats progression

Skins themselves have rarities (icon background color is a tell — purple-magenta = lower, gold-yellow = higher). **Higher-rarity skins give bigger Collectible Stats at every star tier.**

Two observed Collectible Stats progressions (per Griffin gear piece equipped):

**Higher-rarity skins (gold icon, e.g., Holly Blitz, Cosmic Hoop, Monarch's Fang):**
| Tier | ATK+ | HP+ |
|---|---|---|
| Owned (0★) | 20 | 80 |
| 1★ | 36 | 144 |
| 2★ | 52 | 208 |
| 3★ | 68 | 272 |
| 4★ | 84 | 336 |
| 5★ | 100 | 400 |

**Lower-rarity skins (purple icon, e.g., Shadesteal Claw):**
| Tier | ATK+ | HP+ |
|---|---|---|
| Owned (0★) | 10 | 40 |
| 1★ | 18 | 72 |
| 2★ | 26 | 104 |
| 3★ | 34 | 136 |
| 4★ | 42 | 168 |
| 5★ | 50 | 200 |

> **More skin rarity tiers exist beyond the two shown above** (more than just gold and purple). The 2× gap between purple and gold is one observed step, but the full ladder uses different ratios across tiers. Pending detailed capture — when more rarity examples are documented, fill in the per-tier Collectible Stats progression here.

### Set tie

**Each skin is tied to a specific gear set (Griffin / Dragoon / Oracle).** A Griffin skin's Collectible Stats reference "every Griffin gear piece equipped" — they only multiply against gear of the matching set. Equipping a Griffin skin while wearing Oracle gear means the Collectible Stats won't have anything to count.

### Where skins are acquired

- **Hero Skin Shop** — primary skin acquisition
- **Reforger Shop** — alternative source/exchange
- The skin tooltip header reads "Skin Exchange Shop" — likely related to either of the above

### Griffin weapon skin examples observed

#### Holly Blitz (Claw weapon skin, gold rarity)
- **Flavor:** "Crimson gauntlets trimmed with holly and berries, topped by a golden star. Every punch lands as a sharp, festive greeting."
- **Collectible Stats:** Higher-rarity progression (see table above)
- **Skin Skill:** Main weapon attacks have small chance to fire **Snowball** dealing X% Weapon DMG and applying **Snow Cover** (each stack reduces target's MOV SPD and ATK SPD by 2%; at 10 stacks, all stacks are consumed to **Stun for 1s**).
  - Owned: 60% — 1★: 90% — 2★: 120% — 3★: 160% — 4★: 200% — 5★: 240%

#### Monarch's Fang (gold rarity)
- **Flavor:** "Forged from crown fragments of an emperor long gone, symbolizing supreme sovereignty."
- **Collectible Stats:** Higher-rarity progression (see table above)
- **Skin Skill:** Main weapon attacks inflict **Lacerate** on enemies hit for 5s, dealing X% Weapon DMG every 0.5s. When Lacerated enemies are defeated, Y% chance to drop **Red Hearts**.
  - Owned: 4% / 5% — 1★: 6% / 8% — 2★: 8% / 11% — 3★: 10% / 14% — 4★: 12% / 17% — 5★: 15% / 20%

#### Shadesteal Claw (Claw weapon skin, 5★ tier)
- **Flavor:** "When swung, its claw afterimages are testament to its blinding speed."
- **Collectible Stats:** ATK+10, HP+40 per Griffin piece equipped (when equipped)
- **Skin Skill (scales by stars):** Main weapon attacks release N fist shadows, each dealing X% Weapon DMG
  - 1★: 5 shadows × 4% — 2★: 6 × 6% — 3★: 6 × 8% — 4★: 7 × 10% — 5★: 8 × 12%

#### Cosmic Hoop (5★ tier)
- **Collectible Stats (per Griffin piece equipped, when equipped):**
  - 1★: HP +144
  - 2★: ATK +52, HP +208
  - 3★: ATK +68, HP +272
  - 4★: ATK +84, HP +336
  - 5★: ATK +100, HP +400
- **Skin Skill (scales by stars):** Summon 2 Cosmic Hoops that gradually move outward, dealing X% ATK DMG. [Cosmic Hoop] has Y% chance to gain [Fiery Path]
  - 1★: — / 40%
  - 2★: 44% / 55%
  - 3★: 56% / 70%
  - 4★: 68% / 85%
  - 5★: 80% / 100%

> **Strategic note:** **Two different priorities apply:**
> - **For Collectible Stats:** owning MORE skins stacks more permanent passive bonuses across your account. Collecting a wide library of skins (even at low stars) builds a permanent power floor.
> - **For Skin Skills:** only the equipped skin's proc applies, so leveling your *best* equipped skin to 5★ via duplicates maximizes its active output.
>
> Both matter — Collectible Stats reward breadth (collect many skins), Skin Skills reward depth (level your best one high).

---

## Dragoon set — gear piece breakdown

[Pending — screenshots not yet provided. Same pattern as Griffin: 6 pieces (Helmet/Armor/Weapon/Boots/Ring/Amulet) each with flat + % primary stats, slot-flavored secondary, base-stat tiers, and conditional effects. Add details when screenshots are added to `Gear/Gear/Dragoon/`.]

## Oracle set — gear piece breakdown

All 6 Oracle S-Ranked pieces documented at the **Chaotic** rarity tier from screenshots. Same structural pattern as Griffin (flat + % primary stats, slot-flavored secondary, base-stat tiers, conditional effects).

### Theme observed

Oracle's effects revolve around **combo hits, multishot/projectile mechanics, and CRIT scaling with sustained combat**. Multiple pieces have "For every 5 combo hits..." / "When combo reaches +40 hits..." style triggers, plus piercing beams, +diagonal arrows, and Multishot procs. This implies Oracle is a **sustained DPS / ranged combo build** — opposite identity from Griffin's close-range melee.

### Per-piece details

#### Oracle Spear (Weapon)
- **Flavor:** "The weapon of prophecy that can discern enemies' weaknesses and bring justice in the light."
- **Skin Skill:** *(displays the equipped weapon skin's ability)*. Example skin currently equipped grants Thorn Tangle proc — when main weapon hits a target, Thorn Tangle spawns at the impact location; tangled enemies lose −20% MOV SPD and ATK SPD and take 2.5% Weapon DMG.
- **Quality Skills:** ATK PWR +16,560, ATK PWR +5%, "Fires a powerful piercing beam", "DMG increases with combo hits, up to 10%", "For every 5 combo hits, CRIT Rate +2%, up to 8%"

#### Oracle Helmet
- **Flavor:** "A protective shield infused with divine will, dispelling all doubts and confusion."
- **Quality Skills:** Max HP +59,520, Max HP +5%, Red Heart Heal +20%, "Gain 2× combo hits on CRIT", Max HP +10%, Helmet's base stats +20% / +30% / +40%, "Gain 3× combo hits on CRIT", "Chance to gain +1 Multishot on critical hit"

#### Oracle Armor
- **Flavor:** "Blessed by holy light, it guards the oracle from worldly corruption."
- **Quality Skills:** Barrage DMG REDUC +5%, Max HP +10%, "For every 5 combo hits, +2 diagonal arrows on next hit", Armor's base stats +20% / +30% / +40%, "For every 5 combo hits, +4 diagonal arrows on next hit", "When looting Hearts, chance to gain Invincibility Shield for 2s"

#### Oracle Boots
- **Flavor:** "With a divine mandate, the oracle's steps always lead the path of righteousness."
- **Quality Skills:** Max HP +58,860, Max HP +5%, Dodge +5%, "CRIT DMG +32% after 30 combo hits", Max HP +10%, Boots' base stats +20% / +30% / +40%, "CRIT DMG +48% after 20 combo hits", "20% DMG REDUC when stationary"

#### Oracle Ring
- **Flavor:** "Foreseeing the signs of victory, wear this ring to grasp the future."
- **Quality Skills:** ATK PWR (flat), CRIT Rate +5%, "For every 5 combo hits, ATK SPD +2%, up to 8%", ATK PWR +10%, Ring's base stats +20% / +30% / +40%, "For every 5 combo hits, ATK SPD +4%, up to 16%", "When combo reaches +40 hits, deal increased DMG to enemies at Max HP"

#### Oracle Amulet
- **Flavor:** "The oracle's revelation. The amulet holds wisdom of the future."
- **Quality Skills:** ATK PWR +5%, CRIT DMG +12%, "Every 5 combo hits doubles next attack DMG", ATK PWR +10%, Amulet's base stats +20% / +30% / +40%, "Every 3 combo hits doubles next attack DMG", "When combo reaches +40 hits, projectile splits +3"

### Oracle weapon skins (examples observed)

The Oracle weapon is shown as **"Oracle Spear"** on the gear page, but skins re-render it as different visual weapons (cudgels, towers, etc.). Likely the underlying archetype is **Staff** (one of the 3 weapon types in the skin system), with various visual flavors via skins.

#### Goldwish Cudgel (Oracle weapon skin, gold rarity)
- **Flavor:** "Golden cloud sigils coil along the staff. It shifts at will, each swing heaven-shaking, demon-vanquishing."
- **Collectible Stats:** ATK +20, HP +80 per Oracle gear piece (matches gold-rarity progression seen on Griffin)
- **Skin Skill:** Main Weapon hits have a chance to trigger **[Cudgel Jab]**, dealing 55% ATK DMG in a straight line and potentially applying **Paralyze**.

#### Eldritch Tower (Oracle weapon skin, gold rarity)
- **Collectible Stats:** Same gold-rarity progression as other Oracle/Griffin gold-tier skins (ATK +20→100, HP +80→400 across stars Owned → 5★)

> Oracle skins follow the same structural rules as Griffin skins (per-piece-equipped Collectible Stats, star upgrades via duplicates, only 1 skin equipped at a time, set-locked to Oracle gear).

---
