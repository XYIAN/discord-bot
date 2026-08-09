'use strict';

// Tests for replacing a recurring post. Run:
//   node xyian-bot-project/test/rotating-post.test.js
//
// Two behaviours are pinned here, both of which were wrong before.
//
// ORDER: the old code deleted the previous message before sending. A rotated
// webhook makes the send fail silently (sendViaWebhook swallows it to null), so
// the channel was left with NOTHING until the next cycle — 48h for recruitment.
//
// ACCUMULATION: Kyle chose that a member post between two daily resets blocks
// cleanup, so replies are never orphaned. But the old code overwrote the stored
// id regardless, so a skipped delete stranded that message permanently and the
// resets stacked up anyway — the exact outcome the mechanism exists to prevent.
const assert = require('assert');
const {
    memberPostedSince, planDeletions, shouldKeepPending, replacePrevious, UNKNOWN_MESSAGE,
    isRotatingPost, mayDeleteFor,
} = require('../lib/rotating-post');

let passed = 0;
function test(name, fn) {
    const r = fn();
    const done = () => { passed++; console.log(`  ✓ ${name}`); };
    const fail = (e) => { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; };
    if (r && typeof r.then === 'function') return r.then(done, fail);
    try { done(); } catch (e) { fail(e); }
}

console.log('rotating-post');

// ── which posts rotate (folded in from channel-cleanup) ─────────────────────
test('a welcome (no tracking key) never deletes anything', () => {
    assert.strictEqual(
        mayDeleteFor(null, false),
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
        mayDeleteFor('daily-reset', false),
        true,
    );
});

test('but not when a member has posted since — that would orphan their reply', () => {
    assert.strictEqual(
        mayDeleteFor('daily-reset', true),
        false,
    );
});

test('recruitment always collapses to one visible ad', () => {
    assert.strictEqual(
        mayDeleteFor('recruitment', true),
        true,
    );
});

test('THE REGRESSION: a welcome can neither delete nor be deleted', () => {
    // Member joins, welcome is newest in #general, daily reset fires. Before
    // the fix the welcome was recorded under the 'general' key and removed.
    assert.strictEqual(isRotatingPost(null), false, 'a welcome is never recorded as deletable');
    assert.strictEqual(mayDeleteFor(null, false), false, 'and can delete nothing itself');
});

test('a CHANNEL name is no longer a valid rotating key', () => {
    // The root cause: keys used to be channel names, so anything posting to
    // #general inherited the daily reset's delete slot. Keyed by post identity,
    // a stray 'general' is simply not rotating and can delete nothing.
    assert.strictEqual(isRotatingPost('general'), false);
    assert.strictEqual(isRotatingPost('recruit'), false);
    assert.strictEqual(
        mayDeleteFor('general', false),
        false,
    );
});


const OURS = { webhookIds: ['wh-general'], botUserId: 'bot-1' };

(async () => {

// ── who counts as "someone" ─────────────────────────────────────────────────

await test('a member post counts — cleanup must be blocked', () => {
    assert.strictEqual(memberPostedSince([{ authorId: 'member-9' }], OURS), true);
});

await test("the bot's own webhook post does NOT count", () => {
    // A welcome landing between two resets used to block cleanup forever.
    assert.strictEqual(memberPostedSince([{ webhookId: 'wh-general' }], OURS), false);
});

await test("the bot's own user post does NOT count", () => {
    assert.strictEqual(memberPostedSince([{ authorId: 'bot-1' }], OURS), false);
});

await test('a member among our own posts still counts', () => {
    const after = [{ webhookId: 'wh-general' }, { authorId: 'member-9' }, { authorId: 'bot-1' }];
    assert.strictEqual(memberPostedSince(after, OURS), true);
});

await test('nothing posted since means nothing blocks cleanup', () => {
    assert.strictEqual(memberPostedSince([], OURS), false);
    assert.strictEqual(memberPostedSince(undefined, OURS), false);
});

await test('a webhook that is not ours counts as someone', () => {
    assert.strictEqual(memberPostedSince([{ webhookId: 'some-other-app' }], OURS), true);
});

// ── the pending list ────────────────────────────────────────────────────────

await test('a blocked cycle defers every id rather than dropping them', () => {
    // THE ACCUMULATION FIX. Previously the id was overwritten and lost.
    const { attempt, defer } = planDeletions({ pending: ['a', 'b'], mayDelete: false });
    assert.deepStrictEqual(attempt, []);
    assert.deepStrictEqual(defer, ['a', 'b']);
});

await test('an unblocked cycle attempts the backlog, oldest first', () => {
    const { attempt } = planDeletions({ pending: ['a', 'b', 'c'], mayDelete: true });
    assert.deepStrictEqual(attempt, ['a', 'b', 'c']);
});

await test('one bad id cannot stall the cycle — attempts are capped', () => {
    const { attempt, defer } = planDeletions({ pending: ['a','b','c','d','e','f','g'], mayDelete: true, maxAttempts: 5 });
    assert.strictEqual(attempt.length, 5);
    assert.deepStrictEqual(defer, ['f', 'g']);
});

await test('a transient failure is retried; a deleted message is not', () => {
    assert.strictEqual(shouldKeepPending({ code: 50013, message: 'Missing Permissions' }), true);
    assert.strictEqual(shouldKeepPending({ status: 500 }), true);
    assert.strictEqual(shouldKeepPending({ code: UNKNOWN_MESSAGE }), false);
    assert.strictEqual(shouldKeepPending({ status: 404 }), false);
    assert.strictEqual(shouldKeepPending(null), false);
});

// ── order ───────────────────────────────────────────────────────────────────

await test('THE ORDER FIX: a failed send deletes nothing', async () => {
    let deletes = 0;
    const r = await replacePrevious({
        send: async () => null,                       // webhook rotated
        deleteMessage: async () => { deletes++; },
        pending: ['old-1'],
        mayDelete: true,
    });
    assert.strictEqual(deletes, 0, 'must not delete when nothing replaced it');
    assert.strictEqual(r.sent, null);
    assert.deepStrictEqual(r.pending, ['old-1'], 'the old post is kept for next time');
});

await test('a throwing send also deletes nothing', async () => {
    let deletes = 0;
    await assert.rejects(() => replacePrevious({
        send: async () => { throw new Error('network'); },
        deleteMessage: async () => { deletes++; },
        pending: ['old-1'],
    }));
    assert.strictEqual(deletes, 0);
});

await test('a successful send deletes the backlog and clears it', async () => {
    const gone = [];
    const r = await replacePrevious({
        send: async () => ({ id: 'new-1' }),
        deleteMessage: async (id) => { gone.push(id); },
        pending: ['old-1', 'old-2'],
        mayDelete: true,
    });
    assert.deepStrictEqual(gone, ['old-1', 'old-2']);
    assert.deepStrictEqual(r.pending, []);
    assert.strictEqual(r.sent.id, 'new-1');
});

await test('a member posted, so the new post goes up and the backlog waits', async () => {
    let deletes = 0;
    const r = await replacePrevious({
        send: async () => ({ id: 'new-1' }),
        deleteMessage: async () => { deletes++; },
        pending: ['old-1'],
        mayDelete: false,
    });
    assert.strictEqual(deletes, 0);
    assert.deepStrictEqual(r.pending, ['old-1'], 'retried once the channel goes quiet');
});

await test('a failed delete stays pending; an already-deleted one does not', async () => {
    const r = await replacePrevious({
        send: async () => ({ id: 'new-1' }),
        deleteMessage: async (id) => {
            if (id === 'flaky') { const e = new Error('Missing Permissions'); e.code = 50013; throw e; }
            if (id === 'gone') { const e = new Error('Unknown Message'); e.code = UNKNOWN_MESSAGE; throw e; }
        },
        pending: ['flaky', 'gone', 'fine'],
        mayDelete: true,
    });
    assert.deepStrictEqual(r.pending, ['flaky']);
    assert.deepStrictEqual(r.deleted.sort(), ['fine', 'gone']);
    assert.strictEqual(r.failed.length, 1);
});

await test('the backlog drains once the channel goes quiet', async () => {
    // Three blocked cycles then a quiet one — everything is cleaned up, which
    // is precisely what the old overwrite-the-id behaviour made impossible.
    let pending = [];
    for (const id of ['r1', 'r2', 'r3']) {
        const r = await replacePrevious({
            send: async () => ({ id }),
            deleteMessage: async () => {},
            pending,
            mayDelete: false,
        });
        pending = [...r.pending, id];
    }
    assert.strictEqual(pending.length, 3);
    const final = await replacePrevious({
        send: async () => ({ id: 'r4' }),
        deleteMessage: async () => {},
        pending,
        mayDelete: true,
    });
    assert.deepStrictEqual(final.pending, [], 'backlog fully drained');
    assert.strictEqual(final.deleted.length, 3);
});

console.log(`  ${passed} passed`);
})();
