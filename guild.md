# Guild

Accessed via the **Guild** button on the main screen quick-action row. The Guild hub presents a map view with 6+ buildings, each its own sub-feature. Guilds are persistent social groups with shared progression and competitive content.

## Guild fundamentals

From the in-game Rules popup:

1. **Up to 30 members** at base — raise the guild level to increase the member cap
2. **Leaders** can appoint **Vice Leaders** to help manage
3. Leaders cannot leave the guild — they must transfer leadership or be the last person to disband it
4. **Leadership auto-transfers when a leader is inactive for 7 days**

## The Guild hub map

The map shows 6 buildings/features, each opening a different sub-feature:

1. **Guild Hall** — central hub: members, roles, research, leaderboard
2. **Monster Invasion** — guild boss raids
3. **Guild Expedition** — multi-guild PvP tournament
4. **Shop** (Guild Store) — hero shards & random Epic runes
5. **Guild Merchant** — community bargain mechanic
6. **Guild Aid** — [TBD — no screenshots yet; likely member help requests]

A daily/weekly task indicator at the bottom (e.g., "Complete Monster Invasion 10 time(s) (28/30)") tracks guild-wide objectives.

---

## 1. Guild Hall

The main guild headquarters where membership, roles, and progression live.

### Top header

- **Guild name** (e.g., "XYIAN") + ID + emblem with level (Lv.9)
- **Member count** (e.g., 46/46)
- **Recruit** button
- **Power totals** (e.g., 160.96M aggregate guild power, 1,035 something else)
- **Guild progress bar** (e.g., 9,835,000 / 3,800,000 — guild XP toward next level)
- **Description box** — guild leader can post text describing the guild, requirements, Discord link, etc.

### Member roster

Each member row shows: avatar, role, name, power level, daily contribution count (X time(s)), contribution score, online/offline status.

Roles observed:
- **Leader** (1)
- **Vice Leader** (multiple — Leader can appoint)
- **Guild Members** (rest)

### Three action buttons at bottom

- **Log** — guild activity history (member joins / leaves / kicks with timestamps; observed entries showed dates, member names, and the kicking member's name when relevant)
- **Guild Research** — research tree (see below)
- **Manage Member** — admin tools (kick, promote, etc. — Leader/Vice Leader only)

### Guild Research (the research tree)

A grid of unlockable nodes, each with 5 levels (Lv 1–5). Each node grants a buff that applies to **all members** of the guild.

- **Personal contribution shown** — "Your Weekly Contribution: 2,500"
- **Personal weekly ranking** — "Your Weekly Ranking: 13"
- **Guild Rankings** button — global guild leaderboards
- Currencies shown: 2.37M (gold) + 22.97K (gems)

#### How research nodes work

Each Research node shows on its detail popup:
- **Current level** (e.g., 1/5)
- **Needed Research EXP** progress bar (e.g., 2,600 / 6,800)
- **[Current Effect]** — the buff at the current level
- **[Next Level Effect]** — preview of next level's buff
- **Donation Rewards** — what you earn by donating to that node (EXP + currencies)
- **Today's battle chances left** — daily participation cap

Members donate to push the EXP bar; once filled, the node levels up and the buff applies guild-wide.

#### Research node tiers (I / II)

Most node names appear in **Tier I** and **Tier II** variants (e.g., Vitality I → Vitality II, Battle Will II, Wealth Boost I/II). Tier II is the higher unlock, only available after maxing Tier I.

#### Research nodes catalog (observed)

Each Lv 1 → Lv 5 ladder unlocks the listed effect at each level:

| Node | Tier | Effect type | Lv 1 → Lv 5 |
|---|---|---|---|
| **Vitality I** | I | Max HP | (Maxed at +10% — full ladder TBD) |
| **Vitality II** | II | Max HP | +4% / +8% / +12% / +16% / +20% (extrapolated) |
| **Battle Will II** | II | ATK PWR | +4% / +8% / +12% / +16% / +20% |
| **Wealth Boost I** | I | Stage/Hunt Gold Gain | +2% / +4% / +6% / +8% / +10% |
| **Wealth Boost II** | II | Stage/Hunt Gold Gain | +2% / +4% / +6% / +8% / +10% |
| **Scroll Boost I** | I | Stage/Hunt Scroll Gain | +2% / +4% / +6% / +8% / +10% (extrapolated) |
| **Training Boost II** | II | Stage/Hunt EXP Gain | +2% / +4% / +6% / +8% / +10% (extrapolated) |
| **Stamina Capacity** | (single tier) | Max Energy | (Maxed at +10) |
| **Purge** | (single tier) | More damage VS minions | +4% / +8% / +12% / +16% / +20% |
| **Assist Enhancement I** | I | Guild assist reward chances | +1 / +2 / +3 / +4 / +5 |
| **Coordinated Hunt** | (single tier) | More damage VS elites | +4% / +8% / +12% / +16% / +20% |
| **Clash Clearance II** | II | **Unlock Monster Invasion chest tiers** (e.g., Maxed = unlock Tier 10–12 chests) | content unlock |
| **Clash** | (visible 2/5) | PvP-related (probably Clash Clearance I) | TBD |
| **Stamina Cycle II** | II | Energy regen | TBD |
| **Contribution Return II** | II | Donation reward | TBD |
| **Assist Accel II** | II | Faster help | TBD |
| **Reflexes** | (visible 4/5) | Dodge? | TBD |
| **Assist Enhancement II** | II | Higher tier of Assist Enhancement | TBD |

> **Two types of nodes:** most nodes grant **incremental stat buffs** (Lv 1 → 5 ladder of increasing percentages), but some nodes are **content unlocks** like Clash Clearance II which unlocks higher-tier Monster Invasion chests (e.g., Tier 10-12 at max). These don't give a per-level stat — they unlock specific tiers/features at certain levels.

> **Strategic note:** Research is the cleanest source of permanent guild-wide stat buffs. Since these apply to every member, donating to push research is high-leverage even if you'll never use the specific node yourself. Focus on Tier II of stats your build prioritizes (Battle Will II for ATK builds, Vitality II for tanky builds, Wealth Boost II for gold farming).

---

## 2. Monster Invasion

A **guild-wide boss raid** where members collectively damage a single boss for tiered rewards.

### Mechanics

- **Boss rotates daily** (e.g., Stone Golem on this day; different boss tomorrow)
- **Damage thresholds** drive rewards: 30M / 60M / 100M+ chests — these are **per-day damage milestones each player must hit** to claim each reward tier
- **Player total daily damage** displayed prominently (e.g., 51.74B shown on screen = the player's accumulated damage to that boss for the day, not the boss's HP)
- **Rankings sidebar** shows top contributors in the guild (Willbro8aggins, XYIAN, Flower1, Faukss, etc.)
- **Boss Refresh Timer** — countdown to the next daily boss rotation
- **Chance Refresh Timer** — limits how many attempts each member gets per cycle

### Action buttons

- **Quick Raid** — auto-resolve attempts (Privilege Cards extend this — Sealing Master Card grants quick-raid; see [privilege_cards.md](privilege_cards.md))
- **Practice** — test runs (no rewards/depletes no chances)
- **Start** — manual run
- **Preset** — load a saved gear/rune loadout

### Currencies shown

- **Guild Coins** (orange icon, 1841 in snapshot) — earned from Monster Invasion guild ranking rewards and guild donation rewards
- 2.37M gold
- 22.97K gems

### Guild Ranking (separate leaderboard)

Monster Invasion has a **global guild ranking** based on total guild damage (sum across all members) for each daily boss rotation. Rewards are sent via mail at the end of each round.

#### Snapshot of leaderboard (player's bracket)

- **Rank 1: FreeToWinVN** — 9.63T total guild damage
- **Rank 2: TrackingEyeEnjoyer** — 13.79T (visual top spot)
- **Rank 3: XYIAN (your guild)** — 2.34T
- Rank 4: OurHome — 1.42T
- Rank 5: ElderlyBoy — 395.61B
- (descends to billions)
- Rank 100+: gradually dropping

Note: the visible top values aren't perfectly sorted — likely a sub-display ordering. XYIAN currently sits in Top 3 globally.

#### Ranking Rewards (Guild Coins + secondary currency)

Sent to all members of qualifying guilds via mail at end of each daily round:

| Rank | Reward (Guild Coins / secondary) |
|---|---|
| Top 4 | (above the visible cutoff — verify exact values) |
| 5 | 5,000 / 2,250 |
| 6–10 | 4,500 / 2,100 |
| 11–30 | 4,000 / 1,950 |
| 31–60 | 3,500 / 1,800 |
| 61–100 | 3,000 / 1,650 |
| 100+ | 2,500 / 1,500 |

> **Strategic note:** Being in a Top-100 guild for Monster Invasion is a meaningful daily Guild Coin source. Top-tier guilds (Top 10) get 4,500+ daily; even rank 100+ guilds still get 2,500 daily. The driver is total damage, so a guild with many members hitting the per-player damage milestones (30M / 60M / 100M+) easily out-damages one with few high-damage members.

---

## 3. Guild Expedition

A **multi-guild PvP tournament** with seasonal rounds. Your guild faces other guilds in deployment-based combat.

### Eligibility & participation

- Guild must be **Lv.3 or higher**
- Guild must have **at least 10 members registered**
- Members must **personally register** to participate
- Each route has a deploy cap; **stronger members are deployed first**
- All registered members earn rewards even if not deployed
- Guilds without enough registered members can't participate

### Weekly schedule (7-day cycle, all UTC+0)

| Phase | Window | What happens |
|---|---|---|
| **Registration** | Mon 00:00 – Tue 23:59 | Members register; select battle route |
| **Prep Phase** | Wed 00:00 – Thu 23:59 | Leaders & Vice Leaders assign deployed members for all 3 routes; members spend **Expedition Hearts** to recharge **Expedition Talents** and gain buffs |
| **Battle Phase** | Fri 00:00 – Sun 23:59 | Round-robin combat; deployments locked **Fri 12:00 UTC**; opposing guild's deployment visible 2h after lock |

### Round-robin format

- **Group of 4 guilds** competes round-robin → **3 matches per guild per cycle**
- **3 routes per match** (Left / Middle / Right) — each route has 8 deployed members; top 8 by Battle Power per lane fight
- Capturing flags across the 3 routes determines wins
- Matches use **spectator mode** with arena presets (HP and ATK use default values, NOT live character stats — so gear/runes don't directly determine fight outcome; talent and Expedition Talents do)

### Long season structure (from in-game Rules — "Season Info")

- **Season length:** **12 weeks** (84 days). Currently in **Guild Expedition Season 3**.
- **12 rounds total** — each round lasts 1 week
- Within each weekly round, your 4-guild bracket plays round-robin (3 matches per guild per week)
- Performance accumulates league points across rounds → promotion/demotion at end of season

### Per-match scoring (within a round)

- **Win (more flags captured):** **3 points**
- **Draw (equal flags):** **1 point each**
- These per-match points determine your placement within your weekly 4-guild bracket
- End-of-round bracket placement → league points (1st: +50, 2nd: +35, 3rd: +10, 4th: −15) toward your overall league standing

### Battle Phase rules (from in-game Rules)

- **Window:** Fri 00:00 – Sun 23:59 (UTC+0)
- During battle, opposing guilds try to **capture 3 flags across 3 routes**
- Matches employ **spectator mode** using the **arena's presets** to pit players' characters against one another
- **Characters' HP and ATK use default values** (gear/runes don't directly drive outcomes — Expedition Talents do)
- Deployments and character progress lock at **Fri 12:00 UTC**
- The opposing guild's deployment can be viewed within the next 2 hours after lock
- The guild that defeats all enemy players on 1 route is declared the winner and claims that route's flag
- After the server tallies each round's results, results are shown on the schedule and rankings; route replays may be viewed

### Season Reset Rules (from in-game Rules)

When a 12-week season resets, your guild's **points are auto-reset** to a soft floor based on where you finished. So you keep more progress the higher you finished, but everyone gets knocked down some.

| Final pts | Resets to |
|---|---|
| 0–599 | No reset (stays the same) |
| 600–699 | 550 |
| 700–799 | 600 |
| 800–899 | 650 |
| 900–999 | 750 |
| 1,000–1,099 | 850 |
| 1,100–1,199 | 950 |
| 1,200+ | 1,000 |

So a guild that ends at Thunderbound Oath (1,035 pts in current snapshot) would reset to 850 pts at season-end — staying within the same league band but starting near the bottom of it.

### Season Rewards eligibility

- Rewards tallied based on the **final tier reached** in the season
- **Players must be registered for at least 3 weeks of matches** to be eligible
- If the guild itself participated in fewer than 3 weeks, players must participate in [all available matches] to claim rewards (text cut off — verify exact wording)

### Round / cycle screen

- 4-guild VS view showing each guild's power and current league badge
- Example bracket (this player's snapshot):
  - **XYIAN** (your guild) — 160.96M power
  - **海绵决战帝国** — 214.20M
  - **어벡** — 119.46M
  - **Ravengerz** (Next Opponent) — 276.64M

### Deployment screen (Guild Deployment)

- 3 lanes shown (Left / Middle / Right) with current Participants (e.g., 8/8) and Total Power per lane
- "Among the members of each route, the top 8 in Battle Power will join the battle. Registered but undeployed members will also earn rewards."
- Buttons: View Routes / Preset (saved deployment configurations)

### Round-screen action buttons

- **Deploy** button (~16h prep timer per round) — set up guild loadout
- **Schedule** — round calendar
- **Scene Change** — view different scenes/maps
- **Exchange Shop** — see Guild Expedition Shop below

### Sub-tabs

- **Guild Ranking** — leaderboard of guilds in the season
- **Expedition Talents** — talent tree (see below)
- **Guild Expedition** — main view

### Expedition Talents

A talent tree unlocked through registration → Prep Phase. Members spend **Expedition Hearts** during Registration/Prep to power up the tree. Talents apply to the entire guild during the upcoming Battle Phase.

Example talents observed:
- All members gain **DMG Reflect** (CD: 1s)
- DMG Reflect reduced +15% (defensive)
- Healing reduced +20%
- Hit Rate +20%
- For each additional guild member that joins battle, all members on this lane gain +1% DMG (per lane, independently calculated)
- All members gain DMG Reflect (CD: 1.5s upgrade)

A "Charging Chests" indicator appears on the talents screen — likely accumulated reward chests pending claim.

### League system

The label under each guild's name on the round screen is the **league** they're competing in. Saw all 4 guilds in this bracket sharing the same league.

#### Leagues observed / known

- **Thunderbound Oath** — current league for XYIAN (mid-tier)
- **Dragonbound** — next/top league; XYIAN is working toward promotion

#### Point system

- **Current Points:** 1,035 (in the Thunderbound Oath league)
- **Point tier:** 900–1,199 for Thunderbound Oath; **sub-tier range = 100 points**
- **Round result points:**
  - 1st place: **+50** points
  - 2nd: **+35**
  - 3rd: **+10**
  - 4th: **−15**
- **Win streaks add bonus points:**
  - 2-match win streak: +5
  - 3-match win streak: +10
- Cross the league's point ceiling → promotion at end of season; drop below the floor → demotion.

> So progression to **Dragonbound** requires accumulating points by placing 1st/2nd consistently across the 72-day season. Win streaks accelerate the climb.

---

## 4. Shop (Guild Store)

The Guild's daily-rotating shop, primarily for hero shards and random Epic runes. Refreshes every 24h.

### Currencies

- **Guild Coins** (orange icon, displayed in top right alongside gold) — earned from guild activity
- Gold (yellow coin)

### Items observed (Guild Store tab)

| Item | Cost | Purchases left |
|---|---|---|
| Alex Shard | 900 Guild Coins | 50 |
| Nyanja Shard | 900 Guild Coins | 50 |
| Helix Shard | 900 Guild Coins | 50 |
| Hela Shard | 900 Guild Coins | 43 |
| Mymu Shard | 900 Guild Coins | 50 |
| Hou Yi Shard | 900 Guild Coins | 50 |
| Random Epic Enhancement Rune | (gem icon) | 10 |
| Random Epic Ability Rune | (gem icon) | 10 |
| Random Epic Blessing Rune | (gem icon) | 10 |

> **Strategic note:** All 6 hero shards available are **Rare-tier heroes** (matches the Rare Characters catalog in [characters.md](characters.md)). Guild Store is a great farm path for Rare hero progression. Daily limit 50 each → up to 300 Rare hero shards/day per member.

### Sub-tabs at bottom of Shop

- **Guild Store** (default)
- **Guild Expedition Shop** (see below)
- **Event Shop**
- **Arena Shop**
- **Skin Exchange Shop**

---

## 5. Guild Expedition Shop

Tab inside the Guild Store/Shop area. Sells **themed random Epic runes** plus specific named runes. Refreshes every ~2 days.

### Currencies

- 1841 Guild Coins
- 2,700 of an unspecified yellow currency (likely Expedition Coins, earned from Guild Expedition)

### Items observed

All cost **2,700 (Expedition Coins?)** with **Purchases left: 1**:

- **Random Epic Circle Rune**
- **Random Epic Meteor Rune**
- **Random Epic Sword Strike Rune**
- **Random Epic Sprite Rune**
- **Random Epic Main Weapon Rune**
- **Random Epic Elemental Rune**
- **Random Epic Plant Rune**
- **Random Epic Blessing Rune**
- **Arrow of Echoes** (specific Etched rune)

> **Strategic note:** This is the cleanest path for **theme-targeted rune farming**. If you're building a Sprite or Plant build, the Random Epic [Theme] Rune options here let you spend Expedition Coins directly toward your theme.

---

## 6. Guild Merchant

A **community-driven bargain mechanic**. Guild members collectively contribute "bargains" to lower the price of merchant items for the entire guild. **Items rotate daily** — different stock each day.

### How it works

- A panda merchant offers items each day with a base price in gems
- Each member can place a "Bargain" — small contribution toward the price cut
- The more members who Bargain, the cheaper items get for everyone
- Banner: "The price difference will be returned via mail the next day!" — meaning anyone who bought at higher price gets refunded the difference once the cut is finalized

### Mechanics observed

- **Time Left:** 06h 11m daily window
- **42 members have contributed** to today's bargain
- **Total price cut:** 879 gems
- Member contribution list shows individual Bargain count (4, 4, 5, etc.)
- **Items shown:** 5 of one item, 2 of another (player has already purchased today — "Purchased" button gray)

> **Daily rule:** Guild description requires daily bargain participation (1x). Bargaining once daily is a community expectation, not just a personal tool.

---

## 7. Guild Aid

A **Mystling-specific member help system**. Guildmates can speed up each other's:

- **Pact Sanctum upgrade timers**
- **Mystling egg hatch times**

Tied directly to the [Camp & Mystlings](camp_mystlings.md) system. The Mystling Collection track has milestones that improve this:
- "Guild assist reward chances +N" — boosts what you earn from helping others
- "Assisted help requests: extra −60s" — makes assistance you receive more impactful

> **Daily routine note:** Sending and receiving Guild Aid daily is part of an active guild member's loop, especially for guilds focused on Mystling progression.

> **Currency-source connection:** Guild Coins (the orange currency used in Guild Store) come from **Monster Invasion guild ranking rewards** and **guild donation rewards** — so consistent participation in Monster Invasion damage tiers + donating to Guild Research is the loop that funds your Guild Store purchases.

---

## Strategic guidance (for the bot)

- **Active guild membership is essential for endgame progression** — Monster Invasion rewards, Guild Expedition coins, daily merchant bargains, hero shard farming, and global research buffs all require active participation.
- **Daily routine within a Guild:**
  1. Claim Pact Sanctum if upgraded
  2. Run Monster Invasion (use Quick-Raid if Sealing Master Card owned)
  3. Place 1 Bargain at Guild Merchant
  4. Buy daily Hero Shards from Guild Store (especially focused on a target Rare hero)
  5. Contribute to Guild Research progress
  6. Engage in Guild Expedition during active rounds (deploy + battle)
- **Recruitment criteria** the player's guild XYIAN demands: 2M+ power, daily boss & research participation, daily bargain — typical for an active guild

## Open questions

- What does the **Manage Member** button reveal? (admin permissions / kick / promote)
- What are **Expedition Hearts** — the resource members spend during Prep Phase to power up Expedition Talents? (Earned passively? Daily allotment?)
- Full league ladder (Thunderbound Oath → Dragonbound is known; what's below Thunderbound, and what's between/at Dragonbound?)