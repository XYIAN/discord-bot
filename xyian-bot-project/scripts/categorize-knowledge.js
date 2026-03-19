#!/usr/bin/env node
/**
 * One-off: move categorizable content from custom_facts into weapons, runes, gear_sets
 * so !faq shows proper entry counts. Removes moved items from custom_facts.
 */

const path = require('path');
const fs = require('fs');
const KNOWLEDGE_PATH = path.join(__dirname, '..', 'data', 'knowledge.json');

const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
const facts = knowledge.custom_facts || [];

const weapons = {};
const runes = {};
const gear_sets = {};
const keepFacts = [];

for (const f of facts) {
  const t = (f.text || '').trim();
  if (!t) continue;
  if (t.startsWith('weapons category')) {
    if (t.includes('S-Rank Weapon Categories') && t.includes('Dragoon, Oracle, and Griffin')) {
      weapons.s_rank_overview = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Dragoon Pieces are') && t.includes('Oracle Pieces') && t.includes('Griffin Pieces') && !t.includes('Quality Skills')) {
      weapons.pieces_list = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Dragoon Crossbow') && t.includes('Base:')) {
      weapons.dragoon_crossbow = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Dragoon Amulet')) {
      weapons.dragoon_amulet = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Dragoon Helmet')) {
      weapons.dragoon_helmet = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Dragoon Ring')) {
      weapons.dragoon_ring = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Dragoon Armor')) {
      weapons.dragoon_armor = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Dragoon Boots')) {
      weapons.dragoon_boots = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Oracle Spear')) {
      weapons.oracle_spear = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Oracle Helmet')) {
      weapons.oracle_helmet = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Oracle Ring')) {
      weapons.oracle_ring = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Oracle Boots')) {
      weapons.oracle_boots = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Oracle Amulet')) {
      weapons.oracle_amulet = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Oracle Armor')) {
      weapons.oracle_armor = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Griffin Claw')) {
      weapons.griffin_claw = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Griffin Ring')) {
      weapons.griffin_ring = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Griffin Armor')) {
      weapons.griffin_armor = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Griffin Amulet')) {
      weapons.griffin_amulet = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Griffin Helmet')) {
      weapons.griffin_helmet = t.replace(/^weapons category\s*/i, '').trim();
    } else if (t.includes('Quality Skills') && t.includes('Griffin Boots')) {
      weapons.griffin_boots = t.replace(/^weapons category\s*/i, '').trim();
    } else {
      weapons._misc = weapons._misc ? weapons._misc + '\n\n' + t : t.replace(/^weapons category\s*/i, '').trim();
    }
  } else if (t.startsWith('Runes:')) {
    if (t.includes('4 different types') && t.includes('etched') && t.includes('blessing')) {
      runes.overview_4_types = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Enchantment Stats') && t.includes('Blessing, Enhancement')) {
      runes.enchantment_stats = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Blessing Runes Quality') && t.includes('Revive')) {
      runes.blessing_quality_revive = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Etched Runes Quality') && t.includes('Elemental')) {
      runes.etched_elemental = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Etched Runes Quality') && t.includes('Circles') && t.includes('Pulsing Orb')) {
      runes.etched_circles = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Etched Runes Quality') && t.includes('Meteors') && t.includes('Meteor Split')) {
      runes.etched_meteors = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Etched Runes Quality') && t.includes('Strikes') && t.includes('Sword Strike')) {
      runes.etched_strikes = t.replace(/^Runes:\s*/i, '').trim();
    } else if (t.includes('Etched Runes Quality') && t.includes('Main Weapon') && t.includes('Arrow of Echoes')) {
      runes.etched_main_weapon = t.replace(/^Runes:\s*/i, '').trim();
    } else {
      runes._misc = runes._misc ? runes._misc + '\n\n' + t : t.replace(/^Runes:\s*/i, '').trim();
    }
  } else if (t.startsWith('On Godforge,')) {
    gear_sets.godforge = t;
  } else if (t.startsWith('Attack Power (also ATK') || t.startsWith('Main weapon DMG:') || t.startsWith("DMG: it's") || t.startsWith('As explained before, Attack Power')) {
    // already in damage_terminology — drop from custom_facts
  } else {
    keepFacts.push(f);
  }
}

// Remove _misc if we want strict keys only; or keep for any uncategorized weapon/rune text
if (weapons._misc) delete weapons._misc;
if (runes._misc) delete runes._misc;

knowledge.weapons = weapons;
knowledge.runes = runes;
knowledge.gear_sets = gear_sets;
knowledge.custom_facts = keepFacts;

fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(knowledge, null, 2) + '\n');
console.log('weapons entries:', Object.keys(weapons).length);
console.log('runes entries:', Object.keys(runes).length);
console.log('gear_sets entries:', Object.keys(gear_sets).length);
console.log('custom_facts remaining:', keepFacts.length);
