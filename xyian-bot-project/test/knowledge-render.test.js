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
    assert.strictEqual(out.length, 152616, 'rendered length changed');
    assert.strictEqual(
        sha(out),
        '9bae1c57f3eb2ae9dd7294e8da6d2600c2826ec021de72899d5a6551e9119ca8',
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

console.log(`\n${passed} passed`);
