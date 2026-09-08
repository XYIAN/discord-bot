'use strict';

// ── Knowledge categories the community may file into ───────────────────────
// ONE list. bot.js (the !approve <#> <category> <key> gate and the vision
// candidate proposer) and scripts/sync-facts.js (the round-trip that files
// approved suggestions into the repo) each used to carry a private copy, and
// they had drifted (22 vs 20). A category missing here cannot be extended by
// the community at all — docs/KNOWLEDGE-GUIDE.md lists ten that were.
//
// test/knowledge-categories.test.js asserts every top-level category in
// data/knowledge.json is here, so a new category cannot ship uncovered.
const KNOWLEDGE_CATEGORIES = new Set([
    'star_system',
    'resonance',
    'characters',
    'pvp_meta',
    'skins',
    'gold',
    'guild',
    'gear_sets',
    'weapons',
    'runes',
    'blessings',
    'game_modes',
    'profile_experience',
    'tips',
    'skills',
    'resources',
    'privilege_cards',
    'sacred_hall',
    'damage_terminology',
    'collectibles',
    'umbral_tempest',
    'collaborations',
    'hunt',
    'battle_pass',
    'mystlings',
    'currencies',
    'daily_rewards',
    'main_screen',
    'event_shop',
    'skin_exchange_shop',
    'reach_rewards',
    'shop',
]);

module.exports = { KNOWLEDGE_CATEGORIES };
