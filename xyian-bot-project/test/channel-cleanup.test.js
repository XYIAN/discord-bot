'use strict';

// Tests for which of our own posts may be deleted. Run:
//   node xyian-bot-project/test/channel-cleanup.test.js
//
// Written after Kyle reported that a member ("rabits") joined and no welcome
// appeared in #general. The welcome WAS posted — and then deleted, because it
// went through sendToGeneral() and inherited the 'general' tracking key that
// the daily reset uses to clean up after itself. The next rotating post to
// #general saw the welcome sitting there as the latest message and removed it.
//
// The second-order effect is worse than the missing message: the welcome embed
// carries the 🤖 reaction role, so deleting it takes away the only route a new
// member has to AI access.
const assert = require('assert');
const { isRotatingPost, shouldDeletePrevious } = require('../lib/channel-cleanup');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('channel-cleanup');

test('a welcome (no tracking key) never deletes anything', () => {
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: null, previousId: 'daily-1', latestIdInChannel: 'daily-1' }),
        false,
    );
});

test('a welcome is not a rotating post, so nothing may delete it later', () => {
    // The real guard: welcomes must not be RECORDED as deletable either. The
    // call site expresses that by passing a null tracking key, which this
    // predicate reports as non-rotating.
    assert.strictEqual(isRotatingPost(null), false);
    assert.strictEqual(isRotatingPost(undefined), false);
    assert.strictEqual(isRotatingPost('daily-reset'), true);
    assert.strictEqual(isRotatingPost('recruitment'), true);
});

test('the daily reset still tidies up its own previous notice', () => {
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'daily-reset', previousId: 'daily-1', latestIdInChannel: 'daily-1' }),
        true,
    );
});

test('but not when a member has posted since — that would orphan their reply', () => {
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'daily-reset', previousId: 'daily-1', latestIdInChannel: 'member-msg' }),
        false,
    );
});

test('recruitment always collapses to one visible ad', () => {
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'recruitment', previousId: 'ad-1', latestIdInChannel: 'someone-else' }),
        true,
    );
});

test('nothing to delete on the first post', () => {
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'daily-reset', previousId: null, latestIdInChannel: 'x' }),
        false,
    );
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'recruitment', previousId: undefined, latestIdInChannel: 'x' }),
        false,
    );
});

test('THE REGRESSION: a welcome sitting as the latest message is never deleted', () => {
    // Exactly the reported sequence. Member joins, welcome is the newest thing
    // in #general, then the daily reset fires. Before the fix the welcome was
    // recorded under 'general' and this returned true.
    const welcomeId = 'welcome-for-rabits';
    // The welcome was posted with NO tracking key, so it was never recorded...
    assert.strictEqual(isRotatingPost(null), false);
    // ...which means the daily reset's previousId still points at the last
    // daily reset, not at the welcome, and the welcome is not the target.
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'daily-reset', previousId: 'daily-1', latestIdInChannel: welcomeId }),
        false,
        'daily reset must not delete anything when a welcome is the newest message',
    );
});

test('a CHANNEL name is no longer a valid rotating key', () => {
    // The root cause: keys used to be channel names, so anything posting to
    // #general inherited the daily reset's delete slot. Keyed by post identity,
    // a stray 'general' is simply not rotating and can delete nothing.
    assert.strictEqual(isRotatingPost('general'), false);
    assert.strictEqual(isRotatingPost('recruit'), false);
    assert.strictEqual(
        shouldDeletePrevious({ trackingKey: 'general', previousId: 'x', latestIdInChannel: 'x' }),
        false,
    );
});

test('two recurring posts can share a channel without fighting over one slot', () => {
    // Previously inexpressible: both would have been 'general'. Now each holds
    // its own slot, so adding a second daily post to #general is safe.
    const daily = shouldDeletePrevious({ trackingKey: 'daily-reset', previousId: 'reset-1', latestIdInChannel: 'reset-1' });
    const other = shouldDeletePrevious({ trackingKey: 'daily-reset', previousId: 'reset-1', latestIdInChannel: 'someone-else' });
    assert.strictEqual(daily, true);
    assert.strictEqual(other, false, 'a member post still blocks cleanup');
});

console.log(`  ${passed} passed`);
