'use strict';

// End-to-end wiring test: drives the SAME attachConsole + forwarder the bot
// uses, against a fake console and a recording send. Proves the interception
// filter + dedup + flush behave together. Run:
//   node xyian-bot-project/test/log-forwarder.integration.test.js
const assert = require('assert');
const { createLogForwarder, attachConsole } = require('../lib/log-forwarder');

(async () => {
    const sent = [];
    const printedErr = [];
    const printedLog = [];
    let t = 5_000_000;

    const fakeConsole = {
        error: (...a) => printedErr.push(a.join(' ')),
        log: (...a) => printedLog.push(a.join(' ')),
    };

    const fwd = createLogForwarder({
        send: async (text) => { sent.push(text); },
        now: () => t,
        flushMs: 999_999,
    });
    attachConsole(fwd, { console: fakeConsole });

    // 1) An explicit alert followed by a matching console.error → suppressed.
    fwd.noteExplicitAlert({ content: '🚨 Daily reset NOT delivered to #general' });
    fakeConsole.error('Daily reset NOT delivered to general — webhook returned null');

    // 2) A console-only error with no matching alert → forwarded.
    fakeConsole.error('sendViaWebhook(admin) failed: 404 Unknown Webhook');

    // 3) An info log (no problem prefix) → NOT captured.
    fakeConsole.log('✅ Guild recruitment sent');

    // 4) A ⚠️ warning on console.log → captured & forwarded.
    fakeConsole.log('⚠️ Could not post to changelog: request timeout');

    await fwd.flush();

    // Real console still printed everything.
    assert.strictEqual(printedErr.length, 2, 'both console.error calls still print to stdout');
    assert.strictEqual(printedLog.length, 2, 'both console.log calls still print to stdout');

    // Exactly one batch was forwarded.
    assert.strictEqual(sent.length, 1, 'one batch forwarded');
    const batch = sent[0];

    // Contains the console-only error and the ⚠️ warning...
    assert.ok(batch.includes('sendViaWebhook(admin) failed: 404'), 'forwards the console-only error');
    assert.ok(batch.includes('Could not post to changelog'), 'forwards the ⚠️ warning');

    // ...but NOT the alert-duplicated line or the ✅ info line.
    assert.ok(!batch.includes('Daily reset NOT delivered'), 'suppresses the line duplicating an explicit alert');
    assert.ok(!batch.includes('Guild recruitment sent'), 'ignores non-problem info logs');

    console.log('integration:');
    console.log('  ✓ real stdout preserved (2 err + 2 log printed)');
    console.log('  ✓ explicit-alert duplicate suppressed');
    console.log('  ✓ console-only error + ⚠️ warning forwarded');
    console.log('  ✓ info log ignored');
    console.log('\n4/4 passed');
})().catch((e) => { console.error('FAILURE:', e.message); process.exitCode = 1; });
