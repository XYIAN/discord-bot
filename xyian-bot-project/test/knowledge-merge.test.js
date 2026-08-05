'use strict';

// Tests for folding reviewed knowledge fragments into the live knowledge base. Run:
//   node xyian-bot-project/test/knowledge-merge.test.js
//
// The live knowledge.json was wiped once by an infrastructure incident, so the
// behaviour these tests pin down is "never change anything you were not explicitly
// told to change".
const assert = require('assert');
const { mergeFragment, oversizedValues, truncatedValues } = require('../lib/knowledge-merge');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('mergeFragment — additive');
test('adds a brand new top-level topic as one unit', () => {
    // A wholly new topic is reported as a single added path, not one per nested
    // key — "added hunt" is the useful signal, 39 sub-paths would be noise.
    const r = mergeFragment({ a: { x: 1 } }, { hunt: { overview: 'idle rewards', tiers: { a: 1 } } });
    assert.deepStrictEqual(r.merged.hunt, { overview: 'idle rewards', tiers: { a: 1 } });
    assert.deepStrictEqual(r.added, ['hunt']);
    assert.deepStrictEqual(r.conflicts, []);
});
test('adds a new sub-key without disturbing its siblings', () => {
    const live = { runes: { a: 'keep me', b: 'keep me too' } };
    const r = mergeFragment(live, { runes: { c: 'new' } });
    assert.deepStrictEqual(r.merged.runes, { a: 'keep me', b: 'keep me too', c: 'new' });
    assert.deepStrictEqual(r.added, ['runes.c']);
});
test('never mutates the input', () => {
    const live = { a: { x: 1 } };
    mergeFragment(live, { a: { y: 2 }, b: 3 });
    assert.deepStrictEqual(live, { a: { x: 1 } }, 'live was mutated');
});
test('ignores the _meta provenance block', () => {
    const r = mergeFragment({}, { _meta: { source: 'x' }, hunt: { a: 1 } });
    assert.strictEqual(r.merged._meta, undefined);
    assert.strictEqual(r.skippedMeta, true);
});

console.log('mergeFragment — conflicts');
test('REFUSES to overwrite an existing value, and reports it', () => {
    const live = { runes: { overview: 'the live text' } };
    const r = mergeFragment(live, { runes: { overview: 'different text' } });
    assert.strictEqual(r.merged.runes.overview, 'the live text', 'live value was clobbered');
    assert.deepStrictEqual(r.conflicts, ['runes.overview']);
    assert.deepStrictEqual(r.repaired, []);
});
test('overwrites ONLY a path explicitly allowed', () => {
    const live = { runes: { a: 'old a', b: 'old b' } };
    const r = mergeFragment(live, { runes: { a: 'new a', b: 'new b' } }, { allowRepair: ['runes.a'] });
    assert.strictEqual(r.merged.runes.a, 'new a');
    assert.strictEqual(r.merged.runes.b, 'old b', 'unlisted key was changed');
    assert.deepStrictEqual(r.repaired, ['runes.a']);
    assert.deepStrictEqual(r.conflicts, ['runes.b']);
});
test('identical values are not reported as conflicts', () => {
    const r = mergeFragment({ a: { x: 'same' } }, { a: { x: 'same' } });
    assert.deepStrictEqual(r.conflicts, []);
    assert.deepStrictEqual(r.added, []);
});
test('an object replacing a string is a conflict, not a silent overwrite', () => {
    const live = { runes: { etched: 'a flat string' } };
    const r = mergeFragment(live, { runes: { etched: { common: 'x' } } });
    assert.strictEqual(r.merged.runes.etched, 'a flat string');
    assert.deepStrictEqual(r.conflicts, ['runes.etched']);
});
test('handles an empty or missing fragment safely', () => {
    assert.deepStrictEqual(mergeFragment({ a: 1 }, {}).merged, { a: 1 });
    assert.deepStrictEqual(mergeFragment({ a: 1 }, null).merged, { a: 1 });
});

console.log('oversizedValues');
test('flags strings that would bloat the prompt', () => {
    const r = oversizedValues({ a: 'x'.repeat(500), b: 'short' }, 400);
    assert.strictEqual(r.length, 1);
    assert.ok(r[0].startsWith('a ('));
});
test('recurses into nested objects', () => {
    const r = oversizedValues({ t: { deep: 'y'.repeat(450) } }, 400);
    assert.deepStrictEqual(r, ['t.deep (450 chars)']);
});

console.log('truncatedValues');
test('flags a bare tier label with no value — the blessing_quality_revive damage', () => {
    const v = 'Rare: Max HP +240\n    Legendary: ATK PWR +20%\n    Mythic';
    assert.deepStrictEqual(truncatedValues({ runes: { blessing: v } }), ['runes.blessing']);
});
test('flags text ending mid-clause — the etched_* damage', () => {
    const v = 'Common: DMG+100\n Rare: Main weapon skills have increased chance to';
    assert.deepStrictEqual(truncatedValues({ runes: { etched: v } }), ['runes.etched']);
});
test('does NOT flag a list that legitimately ends without punctuation', () => {
    // overview_4_types ends on "Equinox Bloom" and is perfectly complete.
    const v = 'Strikes:\n    Sword of Time\nPlants:\n    Plant Summon\n    Equinox Bloom';
    assert.deepStrictEqual(truncatedValues({ runes: { overview: v } }), []);
});
test('does NOT flag a single-word rarity field', () => {
    // characters.*.rarity is legitimately just "Rare" — flagging it buried the
    // real findings under 17 false positives on the first dry run.
    assert.deepStrictEqual(truncatedValues({ characters: { alex: { rarity: 'Rare' } } }), []);
    assert.deepStrictEqual(truncatedValues({ a: { b: 'Mythic' } }), []);
});
test('does NOT flag ordinary complete sentences', () => {
    assert.deepStrictEqual(truncatedValues({ a: { b: 'This is a complete sentence.' } }), []);
    assert.deepStrictEqual(truncatedValues({ a: { b: 'Increases ATK by 20%' } }), []);
});

console.log(`\n${passed} passed`);
