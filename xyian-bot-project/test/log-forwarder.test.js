'use strict';

// Plain-node test suite (this repo has no test framework). Run:
//   node xyian-bot-project/test/log-forwarder.test.js
const assert = require('assert');
const { createLogForwarder, alertFingerprint } = require('../lib/log-forwarder');

let passed = 0;
const cases = [];
function test(name, fn) { cases.push({ name, fn }); }

// A controllable clock + a fake send that records batches.
function harness(overrides = {}) {
    let t = 1_000_000;
    const sent = [];
    const fwd = createLogForwarder({
        send: async (text) => { sent.push(text); },
        now: () => t,
        flushMs: 999_999, // never auto-fire in tests; we call flush() manually
        ...overrides,
    });
    return { fwd, sent, advance: (ms) => { t += ms; }, at: () => t };
}

console.log('log-forwarder:');

test('fingerprint strips emoji/markdown and lowercases', () => {
    assert.strictEqual(alertFingerprint('🚨 **Daily reset NOT delivered** to #general'), 'daily reset not delivered to general');
});

test('a console line matching a recent explicit alert is deduped', async () => {
    const { fwd, sent } = harness();
    fwd.noteExplicitAlert({ content: '🚨 Daily reset NOT delivered to #general — webhook rotated' });
    fwd.capture('Daily reset NOT delivered to general (webhook returned null)');
    await fwd.flush();
    assert.strictEqual(sent.length, 0, 'should have suppressed the duplicate');
});

test('a console-only error (no matching alert) IS forwarded', async () => {
    const { fwd, sent } = harness();
    fwd.noteExplicitAlert({ content: '🚨 Daily reset NOT delivered' });
    fwd.capture('sendViaWebhook(admin) failed: 404 Unknown Webhook');
    await fwd.flush();
    assert.strictEqual(sent.length, 1);
    assert.ok(sent[0].includes('sendViaWebhook(admin) failed: 404'), 'batch should contain the console-only error');
    assert.ok(sent[0].startsWith('```') && sent[0].trimEnd().endsWith('```'), 'batch is code-fenced');
});

test('explicit-alert embed (EmbedBuilder-like) is matched for dedup', async () => {
    const { fwd, sent } = harness();
    fwd.noteExplicitAlert({ embeds: [{ toJSON: () => ({ title: 'Vision candidate error', description: 'OpenAI vision call failed' }) }] });
    fwd.capture('OpenAI vision call failed for user 123');
    await fwd.flush();
    assert.strictEqual(sent.length, 0, 'embed title/description should feed the dedup');
});

test('dedup window expires — same line forwards after the window', async () => {
    const h = harness({ dedupWindowMs: 20_000 });
    h.fwd.noteExplicitAlert({ content: 'transient upstream error occurred' });
    h.advance(25_000); // past the window
    h.fwd.capture('transient upstream error occurred again later');
    await h.fwd.flush();
    assert.strictEqual(h.sent.length, 1, 'stale alert should no longer suppress');
});

test('buffer cap drops excess and reports the count', async () => {
    const { fwd, sent } = harness({ maxLines: 3 });
    for (let i = 0; i < 7; i++) fwd.capture(`unique error number ${i} xyzzy`);
    await fwd.flush();
    assert.strictEqual(sent.length, 1);
    assert.ok(/…and 4 more suppressed/.test(sent[0]), 'should note 4 dropped lines');
});

test('empty / whitespace lines are never forwarded', async () => {
    const { fwd, sent } = harness();
    fwd.capture('');
    fwd.capture('   ');
    await fwd.flush();
    assert.strictEqual(sent.length, 0);
});

test('flush with an empty buffer sends nothing', async () => {
    const { fwd, sent } = harness();
    await fwd.flush();
    assert.strictEqual(sent.length, 0);
});

test('a throwing send never throws out of flush (no feedback loop)', async () => {
    const fwd = createLogForwarder({ send: async () => { throw new Error('discord down'); }, now: () => 1, flushMs: 999_999 });
    fwd.capture('some real error to forward');
    await assert.doesNotReject(() => fwd.flush());
});

test('code fences in a forwarded line are neutralized', async () => {
    const { fwd, sent } = harness();
    fwd.capture('error with ``` fence inside it that would break formatting');
    await fwd.flush();
    assert.ok(!sent[0].slice(3, -3).includes('```'), 'inner ``` should be replaced');
});

// Run all registered tests sequentially (awaiting async ones), then report.
(async () => {
    for (const { name, fn } of cases) {
        try { await fn(); console.log(`  ✓ ${name}`); passed++; }
        catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
    }
    console.log(`\n${passed}/${cases.length} passed${process.exitCode ? ' — FAILURES' : ''}`);
})();
