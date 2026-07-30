'use strict';

// Adds the Archero 2 v1.1.7 patch notes to the knowledge base.
//
// Writes to BOTH data/knowledge.json (repo copy) and seeds/knowledge.json (the
// archive that survives the Railway volume mount). The bot merges any seeded
// facts it's missing on boot, so these reach production without a manual
// !addfact for each one.
//
//   node scripts/add-patch-notes.js --dry-run
//   node scripts/add-patch-notes.js --apply

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'knowledge.json');
const SEEDS = path.join(__dirname, '..', 'seeds', 'knowledge.json');
const APPLY = process.argv.includes('--apply');

const VERSION = '1.1.7';
const ADDED_AT = new Date().toISOString().split('T')[0];

// Source: in-game Notice screens (Version 1.1.7 update log + hotfix), captured 2026-07-30.
const FACTS = [
    // ── New content ──
    `Update ${VERSION} added new Campaign chapters 181-190, and lowered the difficulty of campaign stages after Chapter 80.`,
    `Update ${VERSION} added new Hard chapters 166-175.`,
    `Update ${VERSION} added new Shackled Jungle chapters 1501-1700.`,
    `Guild Community (added in ${VERSION}) unlocks alongside the guild and is entered via the Campaign button on the home screen. Guild members can view each other's camps, show off home appearances, and take part in guild interactions.`,
    `Guild Bounty (event added in ${VERSION}): guild members complete personal and guild bounties together to build event progress and unlock both personal and guild rewards.`,
    `Charm system 2.0 (${VERSION}): you raise Charm by obtaining designated appearances. Appearances that now count toward Charm include chat bubbles, personal cards, camp styles, and battle scenes.`,
    `Frenzy Challenge (added in ${VERSION}) is Guild Raid's highest difficulty tier: after clearing the highest difficulty you can push toward tougher goals for more rewards.`,
    `Daily Sign-in was upgraded in ${VERSION} from a 7-day to a 28-day cycle, with sign-in rewards raised to match. Players partway through the old 7-day cycle move to the 28-day cycle after finishing their current round.`,
    `Since ${VERSION}, Weekly Tasks grant Quick Raid Cards for specific modes: Seal Battle, Monster Invasion, Abyssal Tide, Shackled Jungle, and Magic Plant Defense.`,
    `The Stats screen (added in ${VERSION}) shows the stat bonuses you get from Artifacts, weapon skins, characters, and guild tech.`,
    `Privilege Card Deal Pack (added in ${VERSION}) unlocks after Chapter 21 and bundles the Cave Explorer Card, Sealing Master Card, and Abyssium Conqueror Card at a discount. Buying it also grants 3-Day Friend Trial Cards for all three Privilege Cards that you can gift; each player can claim up to 2 Trial Cards of the same type per 30 days.`,
    `Blessing Twinborn Rune fusion became available in update ${VERSION}.`,
    // ── Gameplay improvements ──
    `Guild Expedition presets (improved in ${VERSION}): you can view other members' presets, and last week's lane info is recorded automatically and reusable with one tap.`,
    `Since ${VERSION}, Max-Star Legendary character shards can be recycled into Character Shadows at a set ratio.`,
    `Since ${VERSION}, enemy summons no longer count toward damage stats in Peak Arena and Guild Expedition.`,
    `Since ${VERSION}, damage stats show a breakdown by Elemental DMG type.`,
    `Update ${VERSION} added a 3x battle speed option to Abyssal Tide.`,
    `Update ${VERSION} overhauled achievement rewards for Abyssal Tide, total logins, and character levels.`,
    `Update ${VERSION} increased Monster Invasion ranking rewards.`,
    `Since ${VERSION}, the max friend count is 200 and daily claimable friend Energy is 25.`,
    `Since ${VERSION}, the preview screen for Avatar and Frame Choice Chests shows which items you already own.`,
];

function norm(t) {
    return String(t || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 60);
}

function collectExisting(kb) {
    const out = new Set();
    const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
            if (typeof o.text === 'string') out.add(norm(o.text));
            Object.values(o).forEach(walk);
        } else if (typeof o === 'string') out.add(norm(o));
    };
    walk(kb);
    return out;
}

function addTo(file) {
    const kb = JSON.parse(fs.readFileSync(file, 'utf8'));
    const existing = collectExisting(kb);
    if (!Array.isArray(kb.custom_facts)) kb.custom_facts = [];

    let added = 0;
    for (const text of FACTS) {
        if (existing.has(norm(text))) continue;
        kb.custom_facts.push({
            text,
            added_by: 'XYIAN',
            added_at: ADDED_AT,
            source: 'patch_notes',
            game_version: VERSION,
        });
        existing.add(norm(text));
        added++;
    }
    if (APPLY && added > 0) fs.writeFileSync(file, JSON.stringify(kb, null, 2));
    return { file: path.basename(path.dirname(file)) + '/' + path.basename(file), added, total: kb.custom_facts.length };
}

for (const f of [DATA, SEEDS]) {
    if (!fs.existsSync(f)) { console.log(`skip ${f} (missing)`); continue; }
    const r = addTo(f);
    console.log(`${APPLY ? 'ADDED' : 'would add'} ${r.added} fact(s) to ${r.file} (custom_facts now ${r.total})`);
}
if (!APPLY) console.log('\nDry run — re-run with --apply to write.');
