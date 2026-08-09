'use strict';

// Tests for the persistent state store. Run:
//   node xyian-bot-project/test/state-store.test.js
//
// The store exists because every id the runtime cared about lived in a
// module-level variable and Railway wipes those on each deploy. The one that
// bit members: reactionRoleMessages rebuilt at boot from three hardcoded ids,
// so anyone who joined before the last deploy could react 🤖 on their welcome
// and silently get no role.
//
// The atomicity tests matter as much as the roundtrip ones. The six existing
// load/save pairs in bot.js write straight over the target, so a kill mid-write
// truncates the file and the next load swallows it into defaults — a silent
// wipe. These pin that this store cannot do that.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadState, saveState, filePathFor, DATA_DIR } = require('../lib/state-store');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('state-store');

// Use a throwaway name so a real store is never touched.
const NAME = 'test-scratch-state';
const FILE = filePathFor(NAME);
function cleanup() {
    for (const f of [FILE, `${FILE}.tmp`]) {
        try { fs.unlinkSync(f); } catch { /* not there */ }
    }
}
cleanup();

test('missing file returns the defaults', () => {
    assert.deepStrictEqual(loadState(NAME, { a: 1 }), { a: 1 });
});

test('roundtrips a value', () => {
    assert.strictEqual(saveState(NAME, { ids: ['1', '2'], n: 7 }), true);
    assert.deepStrictEqual(loadState(NAME, null), { ids: ['1', '2'], n: 7 });
});

test('overwrites cleanly on a second save', () => {
    saveState(NAME, { v: 1 });
    saveState(NAME, { v: 2 });
    assert.deepStrictEqual(loadState(NAME, null), { v: 2 });
});

test('a corrupt file falls back to defaults instead of throwing', () => {
    fs.writeFileSync(FILE, '{ this is not json');
    assert.deepStrictEqual(loadState(NAME, { safe: true }), { safe: true });
});

test('a leftover .tmp from a killed write does NOT corrupt the real file', () => {
    // The failure mode the ad-hoc save pairs have: a process killed mid-write
    // leaves a truncated TARGET. Here the partial write can only ever land in
    // the .tmp, so the real file is still whatever it was.
    saveState(NAME, { good: 'data' });
    fs.writeFileSync(`${FILE}.tmp`, '{ half-written');
    assert.deepStrictEqual(loadState(NAME, null), { good: 'data' });
});

test('writes are atomic — the target is never a partial file', () => {
    // Prove the rename is what publishes the value: with the target absent and
    // only a tmp present, the store reports the DEFAULTS, not the tmp content.
    cleanup();
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(`${FILE}.tmp`, JSON.stringify({ never: 'published' }));
    assert.deepStrictEqual(loadState(NAME, { fallback: true }), { fallback: true });
});

test('rejects a name that would escape the data directory', () => {
    assert.throws(() => filePathFor('../../etc/passwd'));
    assert.throws(() => filePathFor('nested/name'));
    assert.strictEqual(path.dirname(filePathFor('ok-name-1')), DATA_DIR);
});

test('a Set roundtrips via array, which is how the caller uses it', () => {
    const ids = new Set(['111', '222']);
    saveState(NAME, [...ids]);
    const back = new Set(loadState(NAME, []));
    assert.strictEqual(back.has('111'), true);
    assert.strictEqual(back.has('222'), true);
    assert.strictEqual(back.size, 2);
});

cleanup();
console.log(`  ${passed} passed`);
