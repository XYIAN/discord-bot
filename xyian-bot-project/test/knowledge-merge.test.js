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


console.log('custom_facts append — one path for every knowledge drop');
test('appends a new fact to an empty base', () => {
    const { merged, addedFacts } = mergeFragment({}, { custom_facts: [{ text: 'Bargain is not donation.' }] });
    assert.strictEqual(addedFacts.length, 1);
    assert.strictEqual(merged.custom_facts[0].text, 'Bargain is not donation.');
});
test('a re-run is a clean no-op — the whole point of applying by file', () => {
    const frag = { custom_facts: [{ text: 'The first guild donation of the day is free.' }] };
    const once = mergeFragment({}, frag);
    const twice = mergeFragment(once.merged, frag);
    assert.strictEqual(twice.addedFacts.length, 0);
    assert.strictEqual(twice.merged.custom_facts.length, 1);
});
test('a fact already stated ANYWHERE in the base is not duplicated', () => {
    // The same claim can already live as a structured entry. Re-adding it as a
    // loose bullet gives gpt-4o-mini the same fact twice in one prompt.
    const live = { guild: { donations: 'The first donation is free.' } };
    const { addedFacts } = mergeFragment(live, { custom_facts: [{ text: 'the first donation is free.' }] });
    assert.strictEqual(addedFacts.length, 0, 'duplicated a fact already present as a structured value');
});
test('dedup is whitespace- and case-insensitive but NOT prefix-based', () => {
    // The scripts this replaces keyed on the first 60 chars. Four facts sharing
    // a 39-char opening left 21 to tell them apart, and a collision dropped one
    // silently. These two share 44 characters and are different facts.
    const a = 'The hotfix announced on 2026-08-23 adds new chapters.';
    const b = 'The hotfix announced on 2026-08-23 adds new achievements.';
    const { addedFacts } = mergeFragment({}, { custom_facts: [{ text: a }, { text: b }] });
    assert.strictEqual(addedFacts.length, 2, 'a long shared prefix must not collapse two distinct facts');
    const same = mergeFragment({}, { custom_facts: [{ text: '  THE   Same  Fact. ' }, { text: 'the same fact.' }] });
    assert.strictEqual(same.addedFacts.length, 1, 'whitespace/case variants are the same fact');
});
test('entry metadata is carried through, not just the text', () => {
    const { merged } = mergeFragment({}, { custom_facts: [{ text: 'x', added_by: 'XYIAN', source: 'patch_notes' }] });
    assert.strictEqual(merged.custom_facts[0].added_by, 'XYIAN');
    assert.strictEqual(merged.custom_facts[0].source, 'patch_notes');
});
test('a malformed entry is skipped, never thrown on', () => {
    // Fragments are hand-authored; a missing text field must not abort a merge
    // that has already applied structured topics.
    const { merged, addedFacts } = mergeFragment({}, {
        custom_facts: [null, {}, { text: 123 }, { text: '' }, { text: 'the good one' }],
    });
    assert.strictEqual(addedFacts.length, 1);
    assert.strictEqual(merged.custom_facts.length, 1);
});
test('existing facts are never reordered or dropped', () => {
    // Contributor credit is computed elsewhere, but these are the visible half.
    const live = { custom_facts: [{ text: 'first' }, { text: 'second' }] };
    const { merged } = mergeFragment(live, { custom_facts: [{ text: 'third' }] });
    assert.deepStrictEqual(merged.custom_facts.map((f) => f.text), ['first', 'second', 'third']);
});
test('custom_facts never appears as a conflict or an added PATH', () => {
    const live = { custom_facts: [{ text: 'a' }] };
    const r = mergeFragment(live, { custom_facts: [{ text: 'b' }] });
    assert.deepStrictEqual(r.conflicts, []);
    assert.ok(!r.added.includes('custom_facts'), 'array leaked into the object-walk results');
});
test('the caller is not mutated', () => {
    const live = { custom_facts: [{ text: 'a' }] };
    mergeFragment(live, { custom_facts: [{ text: 'b' }] });
    assert.strictEqual(live.custom_facts.length, 1);
});

console.log('\nmergeFragment — custom_facts repairs');
// custom_facts was append-only, so a fact filed from a provisional source could
// never be corrected when the official source renamed the thing. A stale name
// left in ADDITIONAL FACTS contradicts the corrected category, and gpt-4o-mini
// picks one of two disagreeing facts at random.
test('a repair rewrites the matching fact in place, keeping its other fields', () => {
    const live = { custom_facts: [
        { text: 'The Guild Starlight Celebration ships this week.', added_by: 'XYIAN', added_at: '2026-08-24' },
    ] };
    const r = mergeFragment(live, {
        custom_facts_repairs: [{ match_text: 'The Guild Starlight Celebration ships this week.', text: 'The Starlight Gala ships this week.', reason: 'official name' }],
    }, { allowRepair: ['custom_facts'] });
    assert.strictEqual(r.merged.custom_facts[0].text, 'The Starlight Gala ships this week.');
    assert.strictEqual(r.merged.custom_facts[0].added_by, 'XYIAN', 'provenance must survive a repair');
    assert.strictEqual(r.merged.custom_facts[0].repair_reason, 'official name');
    assert.deepStrictEqual(r.repaired, ['custom_facts[0]']);
});
test('WITHOUT --repair custom_facts it is a conflict, and the fact is untouched', () => {
    // The whole posture of this module: never change what you were not told to.
    const live = { custom_facts: [{ text: 'old name' }] };
    const r = mergeFragment(live, { custom_facts_repairs: [{ match_text: 'old name', text: 'new name' }] });
    assert.strictEqual(r.merged.custom_facts[0].text, 'old name');
    assert.deepStrictEqual(r.repaired, []);
    assert.deepStrictEqual(r.conflicts, ['custom_facts[0]']);
});
test('replaying an applied repair is a CLEAN no-op, not an error', () => {
    // "A fragment must replay as a clean no-op" — docs/KNOWLEDGE-GUIDE.md.
    const live = { custom_facts: [{ text: 'new name' }] };
    const r = mergeFragment(live, { custom_facts_repairs: [{ match_text: 'old name', text: 'new name' }] }, { allowRepair: ['custom_facts'] });
    assert.deepStrictEqual(r.repaired, []);
    assert.deepStrictEqual(r.conflicts, []);
    assert.deepStrictEqual(r.unmatchedRepairs, [], 'the replacement is already present, so nothing is stale');
});
test('a repair matching NOTHING at all is reported, never silent', () => {
    // A typo in match_text would otherwise no-op and look like success, leaving
    // the wrong fact live — the exact failure this whole module exists to prevent.
    const live = { custom_facts: [{ text: 'something else' }] };
    const r = mergeFragment(live, { custom_facts_repairs: [{ match_text: 'a typo', text: 'corrected' }] }, { allowRepair: ['custom_facts'] });
    assert.deepStrictEqual(r.unmatchedRepairs, ['a typo']);
    assert.deepStrictEqual(r.repaired, []);
});
test('matching is by TEXT, not index — the right fact is repaired after appends', () => {
    // Index-keyed repairs rewrite the wrong entry as soon as anything lands
    // before them, and custom_facts is appended to on every drop.
    const live = { custom_facts: [{ text: 'zero' }, { text: 'one' }, { text: 'target' }] };
    const r = mergeFragment(live, {
        custom_facts: [{ text: 'freshly appended' }],
        custom_facts_repairs: [{ match_text: 'target', text: 'repaired' }],
    }, { allowRepair: ['custom_facts'] });
    assert.strictEqual(r.merged.custom_facts[2].text, 'repaired');
    assert.strictEqual(r.merged.custom_facts[0].text, 'zero', 'an unrelated fact was rewritten');
    assert.strictEqual(r.merged.custom_facts[3].text, 'freshly appended');
});
test('custom_facts_repairs never leaks into the object walk as a topic', () => {
    const r = mergeFragment({}, { custom_facts_repairs: [{ match_text: 'a', text: 'b' }] });
    assert.strictEqual(r.merged.custom_facts_repairs, undefined);
    assert.ok(!r.added.includes('custom_facts_repairs'));
});
test('whitespace differences do not defeat a repair', () => {
    const live = { custom_facts: [{ text: 'a   fact  with   odd spacing' }] };
    const r = mergeFragment(live, { custom_facts_repairs: [{ match_text: 'a fact with odd spacing', text: 'fixed' }] }, { allowRepair: ['custom_facts'] });
    assert.strictEqual(r.merged.custom_facts[0].text, 'fixed');
});

console.log('\nmergeFragment — key renames');
// Object KEYS are rendered into the prompt verbatim, so a key is a retrieval
// label. When an official source renames a feature, repairing only the string
// values leaves the old name standing as the topic heading.
test('a gated rename moves the value and REMOVES the old key', () => {
    const live = { guild: { starlight_celebration: { overview: 'x' }, other: 1 } };
    const r = mergeFragment(live, { _renames: [{ from: 'guild.starlight_celebration', to: 'guild.starlight_gala' }] },
        { allowRepair: ['guild.starlight_celebration'] });
    assert.deepStrictEqual(r.merged.guild.starlight_gala, { overview: 'x' });
    assert.ok(!('starlight_celebration' in r.merged.guild), 'the OLD key must be gone — it is rendered into the prompt');
    assert.deepStrictEqual(r.renamed, ['guild.starlight_celebration -> guild.starlight_gala']);
});
test('WITHOUT --repair the rename is a conflict and nothing moves', () => {
    const live = { guild: { starlight_celebration: { overview: 'x' } } };
    const r = mergeFragment(live, { _renames: [{ from: 'guild.starlight_celebration', to: 'guild.starlight_gala' }] });
    assert.ok('starlight_celebration' in r.merged.guild);
    assert.deepStrictEqual(r.renamed, []);
    assert.deepStrictEqual(r.conflicts, ['guild.starlight_celebration']);
});
test('key ORDER is preserved — key order is prompt order', () => {
    // A renamed key jumping to the end silently reorders the prompt, which
    // moves a fact away from the entries that give it context.
    const live = { guild: { a: 1, old: 2, z: 3 } };
    const r = mergeFragment(live, { _renames: [{ from: 'guild.old', to: 'guild.neu' }] }, { allowRepair: ['guild.old'] });
    assert.deepStrictEqual(Object.keys(r.merged.guild), ['a', 'neu', 'z']);
});
test('a rename NEVER clobbers an existing destination', () => {
    const live = { guild: { old: 'a', neu: 'ALREADY HERE' } };
    const r = mergeFragment(live, { _renames: [{ from: 'guild.old', to: 'guild.neu' }] }, { allowRepair: ['guild.old'] });
    assert.strictEqual(r.merged.guild.neu, 'ALREADY HERE');
    assert.deepStrictEqual(r.conflicts, ['guild.neu']);
    assert.deepStrictEqual(r.renamed, []);
});
test('replaying an applied rename is a CLEAN no-op', () => {
    const live = { guild: { starlight_gala: { overview: 'x' } } };
    const r = mergeFragment(live, { _renames: [{ from: 'guild.starlight_celebration', to: 'guild.starlight_gala' }] },
        { allowRepair: ['guild.starlight_celebration'] });
    assert.deepStrictEqual(r.renamed, []);
    assert.deepStrictEqual(r.conflicts, []);
    assert.deepStrictEqual(r.unmatchedRenames, []);
});
test('a rename matching nothing at all is reported, never silent', () => {
    const r = mergeFragment({ guild: {} }, { _renames: [{ from: 'guild.ghost', to: 'guild.spook' }] }, { allowRepair: ['guild.ghost'] });
    assert.deepStrictEqual(r.unmatchedRenames, ['guild.ghost']);
});
test('a rename across different parents is refused, not silently flattened', () => {
    const r = mergeFragment({ a: { k: 1 }, b: {} }, { _renames: [{ from: 'a.k', to: 'b.k' }] }, { allowRepair: ['a.k'] });
    assert.strictEqual(r.merged.a.k, 1);
    assert.deepStrictEqual(r.renamed, []);
    assert.strictEqual(r.unmatchedRenames.length, 1);
});
test('_renames never leaks into the object walk as a topic', () => {
    const r = mergeFragment({}, { _renames: [{ from: 'a.b', to: 'a.c' }] });
    assert.strictEqual(r.merged._renames, undefined);
    assert.ok(!r.added.includes('_renames'));
});
test('rename THEN add: the fragment can refill the renamed key in one pass', () => {
    // The real usage: rename the topic, then write corrected values into it.
    const live = { guild: { starlight_celebration: { overview: 'OLD NAME text', keep: 'kept' } } };
    const r = mergeFragment(live, {
        _renames: [{ from: 'guild.starlight_celebration', to: 'guild.starlight_gala' }],
        guild: { starlight_gala: { overview: 'Starlight Gala is …', cadence: 'weekly' } },
    }, { allowRepair: ['guild.starlight_celebration', 'guild.starlight_gala.overview'] });
    assert.strictEqual(r.merged.guild.starlight_gala.overview, 'Starlight Gala is …');
    assert.strictEqual(r.merged.guild.starlight_gala.cadence, 'weekly');
    assert.strictEqual(r.merged.guild.starlight_gala.keep, 'kept', 'untouched siblings survive');
    assert.ok(!('starlight_celebration' in r.merged.guild));
});

console.log(`\n${passed} passed`);
