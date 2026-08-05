'use strict';

// Tests for the real-money price guard. Run:
//   node xyian-bot-project/test/price-guard.test.js
//
// Written after watching the live bot ignore the prompt rule it was given.
// Asked "how much does it cost to renew a monthly Privilege Card, and is it
// worth buying?" it correctly refused to recommend the purchase and then
// answered "499 Aurocite" with no staleness caveat at all — obeying one half of
// the instruction and dropping the other. These tests pin the deterministic
// half, which cannot be talked out of.
const assert = require('assert');
const {
    CAVEAT, mentionsRealMoneyPrice, hasPriceCaveat, appendPriceCaveat,
} = require('../lib/price-guard');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('mentionsRealMoneyPrice — catches what it must');
test('the exact answer that motivated this module', () => {
    assert.strictEqual(
        mentionsRealMoneyPrice('Renewing a monthly Privilege Card costs 499 Aurocite.'), true);
});
test('Aurocite in either word order', () => {
    assert.strictEqual(mentionsRealMoneyPrice('80 gems for 99 Aurocite'), true);
    assert.strictEqual(mentionsRealMoneyPrice('costs Aurocite 499'), true);
});
test('dollar and USD forms', () => {
    for (const s of ['That pack is $9.99', 'US$49.99 for the bundle', 'about 19.99 USD']) {
        assert.strictEqual(mentionsRealMoneyPrice(s), true, s);
    }
});
test('comma-grouped figures', () => {
    assert.strictEqual(mentionsRealMoneyPrice('1,299 Aurocite'), true);
});

console.log('mentionsRealMoneyPrice — does NOT over-flag');
test('soft currency is not a real-money claim', () => {
    // Gems and gold are earned in-game. Flagging them would attach the warning
    // to most answers in the file and train people to ignore it.
    assert.strictEqual(mentionsRealMoneyPrice('8,880 gold for 20 gems'), false);
    assert.strictEqual(mentionsRealMoneyPrice('Sky Tower 1525 unlocks campaign 126'), false);
    assert.strictEqual(mentionsRealMoneyPrice('Max HP +5% at Rare'), false);
});
test('bare numbers and percentages are not prices', () => {
    assert.strictEqual(mentionsRealMoneyPrice('13 rune slots, 4 ability and 2 blessing'), false);
    assert.strictEqual(mentionsRealMoneyPrice('CRIT DMG +15%'), false);
});
test('handles empty and junk input', () => {
    for (const v of ['', null, undefined]) assert.strictEqual(mentionsRealMoneyPrice(v), false, String(v));
});

console.log('appendPriceCaveat');
test('appends the caveat to a priced answer', () => {
    const out = appendPriceCaveat('Renewing a monthly Privilege Card costs 499 Aurocite.');
    assert.ok(out.includes('499 Aurocite'), 'lost the original answer');
    assert.ok(out.includes(CAVEAT), 'caveat not appended');
});
test('leaves an unpriced answer completely alone', () => {
    const a = 'You can equip 13 runes when everything is unlocked.';
    assert.strictEqual(appendPriceCaveat(a), a);
});
test('does not stack a second caveat when the model already gave one', () => {
    const a = 'It costs 499 Aurocite, though that may be out of date — check in-game.';
    assert.strictEqual(appendPriceCaveat(a), a);
});
test('recognises several phrasings of an existing caveat', () => {
    for (const phrase of ['may be out of date', 'might be out of date', 'prices can change', 'check in-game', 'may have changed']) {
        const a = `It costs $9.99 but ${phrase}.`;
        assert.strictEqual(appendPriceCaveat(a), a, phrase);
        assert.strictEqual(hasPriceCaveat(a), true, phrase);
    }
});
test('empty input passes straight through', () => {
    assert.strictEqual(appendPriceCaveat(''), '');
    assert.strictEqual(appendPriceCaveat('   '), '   ');
    assert.strictEqual(appendPriceCaveat(null), '');
});
test('is idempotent — running twice changes nothing', () => {
    // It wraps an answer path that may be retried; a doubled warning looks broken.
    const once = appendPriceCaveat('costs 499 Aurocite');
    assert.strictEqual(appendPriceCaveat(once), once);
});
test('does not mangle a long multi-paragraph answer', () => {
    const a = 'First paragraph about cards.\n\nSecond paragraph: renewal is 499 Aurocite.';
    const out = appendPriceCaveat(a);
    assert.ok(out.startsWith(a.trimEnd()), 'original answer was altered');
    assert.strictEqual(out.split(CAVEAT).length - 1, 1, 'caveat appears more than once');
});

console.log(`\n${passed} passed`);
