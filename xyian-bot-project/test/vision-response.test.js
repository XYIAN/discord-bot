'use strict';

// Tests for vision response parsing. Run:
//   node xyian-bot-project/test/vision-response.test.js
//
// This parses UNTRUSTED model output that flows into the moderator suggestions
// queue, and it had no direct coverage. The final block also pins the exact
// composition used in bot.js — splitVisionResponse feeding appendPriceCaveat —
// because that seam was changed without being exercised end to end.
const assert = require('assert');
const { splitVisionResponse } = require('../lib/vision-response');
const { appendPriceCaveat, CAVEAT } = require('../lib/price-guard');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

const CATEGORIES = new Set(['runes', 'characters', 'weapons', 'game_modes']);
const split = (s) => splitVisionResponse(s, CATEGORIES);

console.log('splitting reply from candidates');
test('no marker — the whole thing is the reply', () => {
    const r = split('That is a Griffin Armor at Epic.');
    assert.strictEqual(r.reply, 'That is a Griffin Armor at Epic.');
    assert.deepStrictEqual(r.candidates, []);
});
test('splits at the marker and trims', () => {
    const r = split('Your rune is Epic.\n\n=== CANDIDATES ===\n[{"text":"Meteor rune reaches Epic at 40 shards","category":"runes"}]');
    assert.strictEqual(r.reply, 'Your rune is Epic.');
    assert.strictEqual(r.candidates.length, 1);
    assert.strictEqual(r.candidates[0].proposed_category, 'runes');
});
test('tolerates marker spacing and casing', () => {
    for (const m of ['===CANDIDATES===', '===  candidates  ===', '=== Candidates ===']) {
        const r = split(`Answer.\n${m}\n[]`);
        assert.strictEqual(r.reply, 'Answer.', m);
    }
});
test('strips ``` fences the model may add', () => {
    const r = split('Answer.\n=== CANDIDATES ===\n```json\n[{"text":"a fact long enough to keep"}]\n```');
    assert.strictEqual(r.candidates.length, 1);
});
test('accepts {candidates:[...]} as well as a bare array', () => {
    const r = split('A.\n=== CANDIDATES ===\n{"candidates":[{"text":"a fact long enough to keep"}]}');
    assert.strictEqual(r.candidates.length, 1);
});

console.log('malformed model output costs the candidates, never the answer');
test('unparseable JSON still returns the reply', () => {
    const r = split('The real answer.\n=== CANDIDATES ===\nnot json at all {[');
    assert.strictEqual(r.reply, 'The real answer.');
    assert.deepStrictEqual(r.candidates, []);
});
test('JSON of the wrong shape yields no candidates', () => {
    for (const junk of ['"a string"', '42', 'null', '{"nope":1}']) {
        assert.deepStrictEqual(split(`A.\n=== CANDIDATES ===\n${junk}`).candidates, [], junk);
    }
});
test('non-object entries inside the array are skipped', () => {
    const r = split('A.\n=== CANDIDATES ===\n[null, 5, "str", {"text":"a fact long enough to keep"}]');
    assert.strictEqual(r.candidates.length, 1);
});
test('preserves a falsy reply rather than normalising it', () => {
    assert.strictEqual(split(null).reply, null);
    assert.strictEqual(split('').reply, '');
    assert.strictEqual(split(undefined).reply, undefined);
});

console.log('sanitising untrusted candidate fields');
test('drops candidates whose text is too short to be a fact', () => {
    const r = split('A.\n=== CANDIDATES ===\n[{"text":"short"},{"text":"   "},{"text":"a fact long enough to keep"}]');
    assert.strictEqual(r.candidates.length, 1);
});
test('an invented category becomes null so a human must choose', () => {
    // Otherwise approving the suggestion would create a junk top-level topic.
    const r = split('A.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep","category":"made_up_topic"}]');
    assert.strictEqual(r.candidates[0].proposed_category, null);
});
test('a malformed key becomes null; a good key is lower-cased', () => {
    const bad = split('A.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep","key":"has spaces!"}]');
    assert.strictEqual(bad.candidates[0].proposed_key, null);
    const good = split('A.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep","key":"Meteor_Rune"}]');
    assert.strictEqual(good.candidates[0].proposed_key, 'meteor_rune');
});
test('an over-long key is rejected rather than truncated', () => {
    const r = split(`A.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep","key":"${'x'.repeat(60)}"}]`);
    assert.strictEqual(r.candidates[0].proposed_key, null);
});
test('confidence falls back to medium for anything unexpected', () => {
    for (const c of ['certain', '', null, 5]) {
        const r = split(`A.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep","confidence":${JSON.stringify(c)}}]`);
        assert.strictEqual(r.candidates[0].confidence, 'medium', String(c));
    }
});
test('only the four expected fields survive — no extras smuggled through', () => {
    const r = split('A.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep","added_by":"attacker","status":"approved"}]');
    assert.deepStrictEqual(Object.keys(r.candidates[0]).sort(),
        ['confidence', 'proposed_category', 'proposed_key', 'text']);
});

console.log('the bot.js composition — split, then price-guard the reply');
// Mirrors askAIWithVision exactly:
//   const { reply: rawReply, candidates } = splitVisionResponse(raw);
//   const reply = priceGuard.appendPriceCaveat(rawReply);
const compose = (raw) => {
    const { reply: rawReply, candidates } = split(raw);
    return { reply: appendPriceCaveat(rawReply), candidates };
};
test('a priced vision answer gets the caveat, candidates intact', () => {
    const r = compose('That bundle is 499 Aurocite.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep"}]');
    assert.ok(r.reply.includes('499 Aurocite'));
    assert.ok(r.reply.includes(CAVEAT));
    assert.strictEqual(r.candidates.length, 1);
});
test('an unpriced vision answer is untouched', () => {
    const r = compose('Your Meteor rune is at Epic.');
    assert.strictEqual(r.reply, 'Your Meteor rune is at Epic.');
});
test('the composition survives every falsy reply without throwing', () => {
    // The seam that was changed. appendPriceCaveat(null) must not blow up, and
    // the result must stay falsy so the caller falls through to its null branch.
    for (const v of [null, undefined, '']) {
        const r = compose(v);
        assert.ok(!r.reply, `expected falsy reply for ${String(v)}, got ${JSON.stringify(r.reply)}`);
        assert.deepStrictEqual(r.candidates, []);
    }
});
test('the caveat is never appended into the candidates block', () => {
    const r = compose('Costs $4.99.\n=== CANDIDATES ===\n[{"text":"a fact long enough to keep"}]');
    assert.ok(!r.candidates[0].text.includes('⚠️'));
    assert.ok(r.reply.includes(CAVEAT));
});

console.log(`\n${passed} passed`);
