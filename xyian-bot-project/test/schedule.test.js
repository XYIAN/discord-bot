'use strict';

// Tests for recurring-post scheduling. Run:
//   node xyian-bot-project/test/schedule.test.js
//
// Recruitment used setInterval(24h) with a counter starting at 0, sending only
// on even ticks — first automatic post 48h after BOOT, counter reset by every
// deploy. Real history: 32 deploys in a fortnight, only 2 gaps over 48h. So the
// ad had effectively never posted by itself; only !recruit ever ran it.
const assert = require('assert');
const { dayKey, isDue, msUntilDue, alreadyPostedToday, HOUR_MS } = require('../lib/schedule');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('schedule');

const NOW = Date.parse('2026-08-06T20:00:00Z');
const iso = (msAgo) => new Date(NOW - msAgo).toISOString();

test('never posted is due — a first boot posts once, not after a full cycle', () => {
    assert.strictEqual(isDue(null, NOW, 48), true);
    assert.strictEqual(isDue(undefined, NOW, 48), true);
    assert.strictEqual(isDue('', NOW, 48), true);
});

test('a corrupt timestamp is treated as never posted rather than never due', () => {
    assert.strictEqual(isDue('not-a-date', NOW, 48), true);
});

test('due exactly on the boundary and after', () => {
    assert.strictEqual(isDue(iso(48 * HOUR_MS), NOW, 48), true);
    assert.strictEqual(isDue(iso(72 * HOUR_MS), NOW, 48), true);
});

test('not due before the interval elapses', () => {
    assert.strictEqual(isDue(iso(47 * HOUR_MS), NOW, 48), false);
    assert.strictEqual(isDue(iso(1 * HOUR_MS), NOW, 48), false);
});

test('THE BUG: a redeploy no longer restarts the clock', () => {
    // Posted 47h ago, then the bot redeploys. Under the old counter the clock
    // restarted and the next post was 48h from THAT moment — 95h after the
    // last ad. Anchored on the last post, it is due in one hour regardless of
    // how many times the process restarted.
    const lastPosted = iso(47 * HOUR_MS);
    assert.strictEqual(isDue(lastPosted, NOW, 48), false);
    assert.strictEqual(msUntilDue(lastPosted, NOW, 48), 1 * HOUR_MS);
    // ...and an hour later it fires, whatever happened to the process.
    assert.strictEqual(isDue(lastPosted, NOW + HOUR_MS, 48), true);
});

test('downtime spanning the window catches up instead of skipping', () => {
    // Bot down for three days. On the next check it is due immediately.
    assert.strictEqual(isDue(iso(96 * HOUR_MS), NOW, 48), true);
    assert.strictEqual(msUntilDue(iso(96 * HOUR_MS), NOW, 48), 0);
});

test('dayKey is a stable Pacific calendar day', () => {
    // 20:00 UTC on the 6th is 13:00 Pacific on the 6th.
    assert.strictEqual(dayKey(Date.parse('2026-08-06T20:00:00Z')), '2026-08-06');
    // 01:00 UTC on the 7th is still the 6th in Pacific — the reset window.
    assert.strictEqual(dayKey(Date.parse('2026-08-07T01:00:00Z')), '2026-08-06');
});

test('the daily reset cannot double-post after a restart in its window', () => {
    const today = dayKey(NOW);
    assert.strictEqual(alreadyPostedToday(today, NOW), true);
    assert.strictEqual(alreadyPostedToday('2026-08-05', NOW), false);
    assert.strictEqual(alreadyPostedToday(null, NOW), false);
});

test('a new Pacific day releases the guard', () => {
    const posted = dayKey(Date.parse('2026-08-06T20:00:00Z'));
    const nextDay = Date.parse('2026-08-07T20:00:00Z');
    assert.strictEqual(alreadyPostedToday(posted, nextDay), false);
});

console.log(`  ${passed} passed`);
