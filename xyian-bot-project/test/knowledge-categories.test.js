'use strict';

// One category list, and it covers the live knowledge base. Run:
//   node xyian-bot-project/test/knowledge-categories.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { KNOWLEDGE_CATEGORIES } = require('../lib/knowledge-categories');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('knowledge categories — one list');
test('neither bot.js nor sync-facts.js keeps a private copy any more', () => {
    // They had drifted to 22 vs 20 entries before this existed.
    assert.ok(!/const KNOWLEDGE_CATEGORIES = new Set\(/.test(read('bot.js')), 'bot.js defines its own list');
    assert.ok(!/const KNOWLEDGE_CATEGORIES = new Set\(/.test(read('scripts/sync-facts.js')), 'sync-facts.js defines its own list');
    assert.ok(/require\('\.\/lib\/knowledge-categories'\)/.test(read('bot.js')));
    assert.ok(/require\('\.\.\/lib\/knowledge-categories'\)/.test(read('scripts/sync-facts.js')));
});
test('every top-level category in the live knowledge base can be filed into', () => {
    // A category absent here cannot be extended by !approve — the community
    // gap docs/KNOWLEDGE-GUIDE.md warned about.
    const kb = JSON.parse(read('data/knowledge.json'));
    const missing = Object.keys(kb).filter((k) => !k.startsWith('_') && !['custom_facts', 'opinions'].includes(k) && !KNOWLEDGE_CATEGORIES.has(k));
    assert.deepStrictEqual(missing, []);
});

console.log(`\n${passed} passed`);
