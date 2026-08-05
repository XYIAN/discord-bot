'use strict';

// Tests for rendering the knowledge base into prompt text. Run:
//   node xyian-bot-project/test/knowledge-render.test.js
//
// This text IS the bot's factual grounding — everything it is allowed to say
// about the game comes from here. A silent change to this renderer is a silent
// change to every answer, so the first test is a golden hash.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { renderKnowledge } = require('../lib/knowledge-render');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

const KNOWLEDGE = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'knowledge.json'), 'utf8'),
);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

console.log('golden — the extraction must not have changed a byte');
test('renders the live knowledge base to the pinned length and hash', () => {
    // Pinned by running the ORIGINAL knowledgeAsText() out of bot.js against
    // this same file and confirming both produce identical output.
    //
    // If this fails after you edited data/knowledge.json, that is expected —
    // re-pin both numbers in the same commit as the data change, and say in the
    // message what moved. If it fails after you edited lib/knowledge-render.js,
    // stop: you have changed what the bot is allowed to say.
    const out = renderKnowledge(KNOWLEDGE);
    assert.strictEqual(out.length, 152813, 'rendered length changed');
    assert.strictEqual(
        sha(out),
        '1299f3d0d0b0df0fef23453458121e76c3e186b820d617e453b571f549859827',
        'rendered content changed',
    );
});

console.log('structure — assertions that survive future knowledge edits');
test('community facts render under ADDITIONAL FACTS, all of them', () => {
    const out = renderKnowledge(KNOWLEDGE);
    assert.ok(out.includes('ADDITIONAL FACTS:'));
    for (const f of KNOWLEDGE.custom_facts || []) {
        assert.ok(out.includes(f.text), `missing community fact: ${f.text.slice(0, 40)}`);
    }
});
test('opinions render with their attribution', () => {
    const out = renderKnowledge({ opinions: [{ text: 'Dracoola is underrated', added_by: 'faria88pt' }] });
    assert.ok(out.includes('COMMUNITY OPINIONS'));
    assert.ok(out.includes('- Dracoola is underrated (by faria88pt)'));
});
test('an entry with .text renders as prose, not JSON', () => {
    const out = renderKnowledge({ runes: { a: { text: 'clean prose', added_by: 'x', source: 'vision' } } });
    assert.ok(out.includes('a: clean prose'));
    assert.ok(!out.includes('added_by'), 'leaked the record metadata into the prompt');
});
test('an entry without .text falls back to JSON', () => {
    const out = renderKnowledge({ characters: { alex: { rarity: 'Rare' } } });
    assert.ok(out.includes('alex: {"rarity":"Rare"}'));
});
test('categories are upper-cased headings', () => {
    assert.ok(renderKnowledge({ runes: { a: 'x' } }).startsWith('RUNES:\n'));
});
test('an empty category emits no section at all', () => {
    assert.strictEqual(renderKnowledge({ runes: {}, weapons: { a: 'x' } }), 'WEAPONS:\na: x');
});
test('empty custom_facts / opinions emit nothing', () => {
    assert.strictEqual(renderKnowledge({ custom_facts: [], opinions: [] }), '');
});
test('handles junk input without throwing', () => {
    assert.strictEqual(renderKnowledge(null), '');
    assert.strictEqual(renderKnowledge(undefined), '');
    assert.strictEqual(renderKnowledge({ a: null }), '');
});

console.log('suppression — render-time only, never touches stored data');
test('suppresses a whole entry by dotted path', () => {
    const kb = { shop: { a: 'keep', b: 'drop' } };
    const out = renderKnowledge(kb, { suppress: ['shop.b'] });
    assert.ok(out.includes('a: keep'));
    assert.ok(!out.includes('drop'));
});
test('suppresses a single SUB-KEY, keeping its evergreen siblings', () => {
    // The reason sub-key granularity exists: shop.top_up mixes dollar prices
    // that go stale with UI description that never does. Dropping the entry to
    // lose the prices would take the rest with it.
    const kb = { shop: { top_up: { overview: 'the top-up screen', gems: '$99 for 10000' } } };
    const out = renderKnowledge(kb, { suppress: ['shop.top_up.gems'] });
    assert.ok(out.includes('the top-up screen'), 'evergreen sibling was lost');
    assert.ok(!out.includes('$99'), 'suppressed price still rendered');
});
test('drops an entry entirely when every sub-key is suppressed', () => {
    const kb = { shop: { top_up: { gems: 'a', gold: 'b' } } };
    const out = renderKnowledge(kb, { suppress: ['shop.top_up.gems', 'shop.top_up.gold'] });
    assert.strictEqual(out, '', 'emitted an empty husk of an entry');
});
test('NEVER mutates the knowledge object it was given', () => {
    // knowledge.json was wiped once by an infrastructure incident. Suppression
    // is a render-time decision precisely so it can never damage stored data.
    const kb = { shop: { top_up: { overview: 'x', gems: '$99' } } };
    const before = JSON.stringify(kb);
    renderKnowledge(kb, { suppress: ['shop.top_up.gems'] });
    assert.strictEqual(JSON.stringify(kb), before, 'the knowledge object was mutated');
});
test('suppressing an unknown path is a no-op, not a crash', () => {
    const kb = { shop: { a: 'x' } };
    assert.strictEqual(renderKnowledge(kb, { suppress: ['nope.nope'] }), 'SHOP:\na: x');
});
test('community facts and opinions can never be suppressed', () => {
    // They carry attribution and are the visible half of the contribution
    // bargain. No allow-list entry should be able to reach them.
    const kb = { custom_facts: [{ text: 'a community fact' }] };
    const out = renderKnowledge(kb, { suppress: ['custom_facts', 'custom_facts.0'] });
    assert.ok(out.includes('a community fact'));
});

console.log('the live suppression list (slice 3)');
// Kept in step with bot.js by the test below that fails if a path stops existing.
const LIVE_SUPPRESSED = [
    'shop.top_up.gems',
    'shop.top_up.aurocite',
    'shop.top_up.gold',
    'event_shop.island_store.milestone_gates',
];
const get = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

test('every suppressed path still EXISTS in knowledge.json', () => {
    // A suppression entry for a path that has been renamed or removed is dead
    // weight that silently stops protecting anything. Fail loudly instead.
    for (const p of LIVE_SUPPRESSED) {
        assert.notStrictEqual(get(KNOWLEDGE, p), undefined, `suppressed path has rotted: ${p}`);
    }
});
test('suppressing them removes the bulk price ladders', () => {
    const out = renderKnowledge(KNOWLEDGE, { suppress: LIVE_SUPPRESSED });
    assert.ok(!out.includes('8,880 gold for 20 gems'), 'gem-priced gold ladder still rendered');
    assert.ok(!out.includes('Island Points reach'), 'per-event milestone gates still rendered');
});
test('their evergreen siblings SURVIVE — the point of sub-key granularity', () => {
    const out = renderKnowledge(KNOWLEDGE, { suppress: LIVE_SUPPRESSED });
    assert.ok(out.includes('Direct currency purchases'), 'lost the top-up overview');
    assert.ok(out.includes('treats Aurocite as the default'), 'lost currency display behaviour');
    assert.ok(out.includes('Refreshed when the Island Treasure Hunt'), 'lost the island shop refresh rule');
    assert.ok(out.includes('Top tier of the shop'), 'lost the always-available stock');
});
test('suppression does NOT by itself make the bot price-safe', () => {
    // Documented deliberately, because believing otherwise is the dangerous
    // part. Real-money figures live in at least eight further places
    // (privilege_cards.monthly_cards_overview, daily_rewards.packs.*.price,
    // currencies.aurocite.used_for, runes.rune_packs, shop.wish, ...). The
    // actual safety mechanism is the PRICES rule in the system prompt; this
    // list only removes the bulk ladders. If this assertion ever starts
    // failing, someone has tried to solve safety by whack-a-mole — check the
    // prompt rule is still there before deleting the test.
    const out = renderKnowledge(KNOWLEDGE, { suppress: LIVE_SUPPRESSED });
    assert.ok(out.includes('499 Aurocite'), 'expected residual prices to remain reachable');
});
test('community facts survive the live suppression list untouched', () => {
    const out = renderKnowledge(KNOWLEDGE, { suppress: LIVE_SUPPRESSED });
    for (const f of KNOWLEDGE.custom_facts || []) assert.ok(out.includes(f.text));
});

console.log('compact mode (slice 4) — byte removal that must not remove a fact');
test('collapses no-op plus-tier lines inside runes', () => {
    const kb = { runes: { r: 'Epic: Big buff\nEpic +1: No additional buff\nLegendary: Bigger buff' } };
    const out = renderKnowledge(kb, { compact: true });
    assert.ok(!out.includes('No additional buff'));
    assert.ok(out.includes('Epic: Big buff') && out.includes('Legendary: Bigger buff'));
});
test('KEEPS "No additional buff BUT unlocked..." — the load-bearing lookahead', () => {
    // 26 lines in the live data continue "but unlocked rune enchantment
    // capabilities". They state when a rune gains enchantment. A collapse
    // without (?! but) deletes that tier from all 26 at once.
    const kb = { runes: { r: 'Epic +2: No additional buff but unlocked rune enchantment capabilities' } };
    assert.ok(renderKnowledge(kb, { compact: true }).includes('unlocked rune enchantment'));
});
test('does NOT collapse in weapons — the scope guard', () => {
    // The licensing rule (runes.stat_unlock_mechanics.plus_variants) is scoped
    // to Ability/Enhancement/Blessing runes. No equivalent exists for gear, so
    // collapsing there turns a confirmed negative into unlicensed silence.
    const kb = { weapons: { w: 'Epic: x\nEpic +1: No additional buff' } };
    assert.ok(renderKnowledge(kb, { compact: true }).includes('No additional buff'));
});
test('strips leading indentation without joining lines together', () => {
    const kb = { runes: { r: 'Tiers:\n    Common: a\n        Rare: b' } };
    const out = renderKnowledge(kb, { compact: true });
    assert.ok(out.includes('\nCommon: a'));
    assert.ok(out.includes('\nRare: b'));
    assert.ok(!/\n[ \t]+/.test(out), 'indentation survived');
});
test('compact is OFF by default — the golden hash stays meaningful', () => {
    const kb = { runes: { r: 'Epic +1: No additional buff' } };
    assert.ok(renderKnowledge(kb).includes('No additional buff'));
});

console.log('compact against the LIVE data — counts that must not move');
test('all 26 enchantment-unlock lines survive', () => {
    const out = renderKnowledge(KNOWLEDGE, { compact: true });
    assert.strictEqual((out.match(/No additional buff but/g) || []).length, 26);
});
test('all 15 real Legendary +N buff lines survive', () => {
    const out = renderKnowledge(KNOWLEDGE, { compact: true });
    assert.strictEqual((out.match(/Legendary \+\d+: (?!No additional buff)/g) || []).length, 15);
});
test('all 7 weapons no-op lines survive', () => {
    // Render the category alone rather than slicing it out of the full text:
    // weapons.griffin_armor contains a blank line, so slicing to the first
    // '\n\n' silently truncates the section and the assertion passes/fails for
    // the wrong reason. (It failed here first, which is how this was caught.)
    const out = renderKnowledge({ weapons: KNOWLEDGE.weapons }, { compact: true });
    assert.strictEqual((out.match(/(?:Epic|Legendary) \+\d+: No additional buff(?! but)/g) || []).length, 7);
});
test('the three general rules that LICENSE the collapse stay in the prompt', () => {
    // If these ever leave, the collapse is no longer covered and must be undone.
    const out = renderKnowledge(KNOWLEDGE, { compact: true });
    for (const rule of ['plus_variants', 'enchantment_system', 'unlock_counts_by_category']) {
        assert.ok(out.includes(rule), `licensing rule gone: ${rule}`);
    }
});

console.log(`\n${passed} passed`);
