'use strict';

// seeds/knowledge.json vs data/knowledge.json vs the fragments. Run:
//   node xyian-bot-project/test/seed-manifest.test.js
//
// WHY THIS EXISTS. For three releases (v3.33.0 → v3.33.3) every --repair made
// with scripts/merge-knowledge.js landed in the repo and went no further. The
// boot merge is additive — live wins unless seed._repairs names the path — and
// nothing ever wrote that list. Production kept the old values, and a live test
// in #arch-ai caught it only because the bot recited a sentence that no longer
// existed in the repo. Every unit test was green the whole time: they checked
// the repo, and the repo was right.
//
// So this checks the ONE thing those tests could not: that what the repo
// believes it repaired is what seeds/ will actually push to the volume.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { withoutSeedManifests, normFactText } = require('../lib/knowledge-merge');

const ROOT = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const DATA = read('data/knowledge.json');
const SEED = read('seeds/knowledge.json');
const FRAG_DIR = path.join(ROOT, 'data', 'knowledge-fragments');

const get = (o, p) => p.split('.').reduce((a, b) => (a && typeof a === 'object' ? a[b] : undefined), o);
const leaves = (v, p) => (v && typeof v === 'object' && !Array.isArray(v))
    ? Object.keys(v).flatMap((k) => leaves(v[k], `${p}.${k}`))
    : [p];

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('seed manifests — what the repo repaired is what production receives');

test('seeds/ is data/ plus the two manifests and nothing else', () => {
    assert.deepStrictEqual(withoutSeedManifests(SEED), DATA, 'seeds/knowledge.json has drifted from data/knowledge.json');
});

test('the manifests live ONLY in seeds/ — never in data/, never rendered into the prompt', () => {
    assert.strictEqual(DATA._repairs, undefined);
    assert.strictEqual(DATA._custom_facts_repairs, undefined);
});

test('every path in _repairs exists in the repo (a repair of nothing is a typo)', () => {
    for (const p of SEED._repairs || []) assert.notStrictEqual(get(DATA, p), undefined, `_repairs names ${p}, which is not in data/`);
});

test('every custom fact repair resolves to a text the repo actually holds', () => {
    const live = new Set((DATA.custom_facts || []).map((f) => normFactText(f.text)));
    for (const r of SEED._custom_facts_repairs || []) {
        assert.ok(live.has(normFactText(r.text)), `_custom_facts_repairs points at text not in data/: ${r.text.slice(0, 60)}…`);
    }
});

test('THE GUARD: every repair a fragment applied is named in seeds/_repairs', () => {
    // A fragment records the paths it overwrote in _meta.conflictsWithLive. If
    // the repo now holds the fragment's value at such a path, the repair was
    // applied — and seeds/ must name it, or the volume never gets it.
    const repairs = new Set(SEED._repairs || []);
    const missing = [];
    for (const f of fs.readdirSync(FRAG_DIR).filter((n) => n.endsWith('.json'))) {
        const frag = read(`data/knowledge-fragments/${f}`);
        for (const p of (frag._meta && frag._meta.conflictsWithLive) || []) {
            const fv = get(frag, p);
            if (fv === undefined) continue;                       // deleted, not repaired
            for (const leaf of leaves(fv, p)) {
                if (JSON.stringify(get(frag, leaf)) === JSON.stringify(get(DATA, leaf)) && !repairs.has(leaf)) missing.push(`${f}: ${leaf}`);
            }
        }
    }
    assert.deepStrictEqual(missing, [], 'applied repairs that seeds/ will never push to production');
});

test('THE GUARD, for facts: every applied custom_facts repair is in seeds/_custom_facts_repairs', () => {
    const recorded = new Set((SEED._custom_facts_repairs || []).map((r) => normFactText(r.match_text)));
    const live = new Set((DATA.custom_facts || []).map((f) => normFactText(f.text)));
    const missing = [];
    for (const f of fs.readdirSync(FRAG_DIR).filter((n) => n.endsWith('.json'))) {
        const frag = read(`data/knowledge-fragments/${f}`);
        for (const r of frag.custom_facts_repairs || []) {
            if (live.has(normFactText(r.text)) && !recorded.has(normFactText(r.match_text))) missing.push(`${f}: ${r.match_text.slice(0, 50)}…`);
        }
    }
    assert.deepStrictEqual(missing, []);
});

console.log(`\n${passed} passed`);
