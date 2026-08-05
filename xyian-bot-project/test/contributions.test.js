'use strict';

// Regression tests for the contributor-tier bug: approvals written by scripts
// never granted roles, and nothing ever re-checked. Run:
//   node xyian-bot-project/test/contributions.test.js
const assert = require('assert');
const {
    approvedCountFor, contributorTotals, earnedTier, earnedTierNames,
    reconcilePlan, backfillApprovers,
} = require('../lib/contributions');

// Mirrors CONFIG.roleTiers
const TIERS = [
    { name: 'AI Enabled', threshold: 0 },
    { name: 'Arch Scholar', threshold: 5 },
    { name: 'Arch Sage', threshold: 15 },
];

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

// Ledger modeled on the real one: every approval script-written.
const LEDGER = [
    ...Array.from({ length: 35 }, (_, i) => ({ id: i + 1, status: 'approved', userId: 'u_fauk', by: 'faukkss', approvedVia: 'fact_sync', text: `f${i}` })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: 100 + i, status: 'approved', userId: 'u_fails', by: 'fails_8743', approvedVia: 'fact_sync', text: `g${i}` })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: 200 + i, status: 'approved', userId: 'u_faria', by: 'faria88pt', approvedVia: 'arch_ai_audit', text: `h${i}` })),
    { id: 300, status: 'pending', userId: 'u_new', by: 'newbie', text: 'pending one' },
];

test('approvedCountFor counts only approved records for that user', () => {
    assert.strictEqual(approvedCountFor(LEDGER, 'u_faria'), 5);
    assert.strictEqual(approvedCountFor(LEDGER, 'u_new'), 0, 'pending must not count');
    assert.strictEqual(approvedCountFor(LEDGER, 'nobody'), 0);
    assert.strictEqual(approvedCountFor(null, 'u_faria'), 0, 'null ledger is safe');
});

test('contributorTotals ranks contributors and ignores pending', () => {
    const t = contributorTotals(LEDGER);
    assert.deepStrictEqual(t.map((x) => [x.by, x.count]), [['faukkss', 35], ['fails_8743', 8], ['faria88pt', 5]]);
});

test('earnedTier picks the highest threshold met', () => {
    assert.strictEqual(earnedTier(TIERS, 0).name, 'AI Enabled');
    assert.strictEqual(earnedTier(TIERS, 4).name, 'AI Enabled');
    assert.strictEqual(earnedTier(TIERS, 5).name, 'Arch Scholar', 'exactly at threshold counts');
    assert.strictEqual(earnedTier(TIERS, 14).name, 'Arch Scholar');
    assert.strictEqual(earnedTier(TIERS, 15).name, 'Arch Sage');
    assert.strictEqual(earnedTier(TIERS, 999).name, 'Arch Sage');
});

test('earnedTierNames returns every tier at or below the count', () => {
    assert.deepStrictEqual(earnedTierNames(TIERS, 8), ['AI Enabled', 'Arch Scholar']);
    assert.deepStrictEqual(earnedTierNames(TIERS, 35), ['AI Enabled', 'Arch Scholar', 'Arch Sage']);
});

// THE regression: real roles held on 2026-07-29 vs what the ledger says.
test('reconcilePlan detects the exact production drift', () => {
    const held = {
        u_fauk: ['AI Enabled'],          // 35 approved → missing Arch Scholar + Sage
        u_fails: [],                     // 8 approved  → missing AI Enabled + Scholar
        u_faria: ['AI Enabled'],         // 5 approved  → missing Arch Scholar
    };
    const plan = reconcilePlan(LEDGER, TIERS, (id) => held[id] || null);
    const byUser = Object.fromEntries(plan.map((p) => [p.by, p.missing]));
    assert.deepStrictEqual(byUser.faukkss, ['Arch Scholar', 'Arch Sage']);
    assert.deepStrictEqual(byUser.fails_8743, ['AI Enabled', 'Arch Scholar']);
    assert.deepStrictEqual(byUser.faria88pt, ['Arch Scholar']);
});

test('reconcilePlan is a no-op once roles are correct (idempotent)', () => {
    const held = {
        u_fauk: ['AI Enabled', 'Arch Scholar', 'Arch Sage'],
        u_fails: ['AI Enabled', 'Arch Scholar'],
        u_faria: ['AI Enabled', 'Arch Scholar'],
    };
    const plan = reconcilePlan(LEDGER, TIERS, (id) => held[id] || null);
    assert.deepStrictEqual(plan, [], 'nothing to do on a healthy server');
});

test('reconcilePlan skips members who left the guild', () => {
    const plan = reconcilePlan(LEDGER, TIERS, () => null);
    assert.deepStrictEqual(plan, [], 'unresolvable members never break reconciliation');
});

test('backfillApprovers attributes script approvals and is idempotent', () => {
    const { records, changed } = backfillApprovers(LEDGER, { ownerId: 'owner1', ownerName: 'XYIAN' });
    assert.strictEqual(changed, 48, 'all approved records get an approver');
    const fauk = records.find((r) => r.userId === 'u_fauk');
    assert.strictEqual(fauk.approvedBy, 'owner1');
    assert.strictEqual(fauk.approvedByName, 'XYIAN (via fact_sync)');
    const pending = records.find((r) => r.status === 'pending');
    assert.ok(!pending.approvedBy, 'pending records are never given an approver');

    const second = backfillApprovers(records, { ownerId: 'owner1', ownerName: 'XYIAN' });
    assert.strictEqual(second.changed, 0, 'running twice changes nothing');
});

test('backfillApprovers preserves an existing approver', () => {
    const led = [{ id: 1, status: 'approved', userId: 'u', approvedBy: 'someone_else', approvedByName: 'Mod' }];
    const { records, changed } = backfillApprovers(led, { ownerId: 'owner1', ownerName: 'XYIAN' });
    assert.strictEqual(changed, 0);
    assert.strictEqual(records[0].approvedByName, 'Mod');
});


// ── Ledger restore (the volume-wipe regression) ─────────────────────────────
test('mergeLedgers restores an empty live ledger from the archive', () => {
    const { mergeLedgers } = require('../lib/contributions');
    const { records, restored } = mergeLedgers([], LEDGER);
    assert.strictEqual(restored, LEDGER.length, 'all archived records come back');
    assert.strictEqual(records.length, LEDGER.length);
    assert.ok(records.every(r => r.restoredFromArchive), 'restored records are marked');
});

test('mergeLedgers never overwrites or duplicates live records', () => {
    const { mergeLedgers } = require('../lib/contributions');
    const live = [{ id: 1, status: 'approved', userId: 'u_fauk', by: 'faukkss', text: 'f0' }];
    const { records, restored } = mergeLedgers(live, LEDGER);
    assert.strictEqual(records[0], live[0], 'live record object is untouched');
    assert.strictEqual(records.filter(r => r.id === 1).length, 1, 'no duplicate id');
    assert.strictEqual(restored, LEDGER.length - 1);
});

test('mergeLedgers dedupes by text even when ids differ', () => {
    const { mergeLedgers } = require('../lib/contributions');
    const live = [{ id: 999, status: 'approved', userId: 'u_faria', text: 'h0' }];
    const { restored } = mergeLedgers(live, LEDGER);
    assert.strictEqual(restored, LEDGER.length - 1, 'same text is not restored twice');
});

test('mergeLedgers is idempotent', () => {
    const { mergeLedgers } = require('../lib/contributions');
    const once = mergeLedgers([], LEDGER).records;
    const twice = mergeLedgers(once, LEDGER);
    assert.strictEqual(twice.restored, 0, 'second run restores nothing');
});

test('mergeCustomFacts adds curated facts and dedupes by text', () => {
    const { mergeCustomFacts } = require('../lib/contributions');
    const live = { custom_facts: [{ text: 'Existing fact about runes' }], weapons: { bow: { text: 'Bow info' } } };
    const seed = { custom_facts: [
        { text: 'Existing fact about runes' },   // dup -> skipped
        { text: 'Bow info' },                     // dup found in a category -> skipped
        { text: 'Update 1.1.7 added Guild Bounty' },
    ] };
    const { knowledge, added } = mergeCustomFacts(live, seed);
    assert.strictEqual(added, 1);
    assert.strictEqual(knowledge.custom_facts.length, 2);
    assert.ok(knowledge.custom_facts.some(f => /Guild Bounty/.test(f.text)));
    assert.deepStrictEqual(live.custom_facts.length, 1, 'input is not mutated');
});

test('mergeCustomFacts is idempotent and safe on empty input', () => {
    const { mergeCustomFacts } = require('../lib/contributions');
    const seed = { custom_facts: [{ text: 'A brand new fact' }] };
    const once = mergeCustomFacts({}, seed);
    assert.strictEqual(once.added, 1);
    const twice = mergeCustomFacts(once.knowledge, seed);
    assert.strictEqual(twice.added, 0);
    assert.strictEqual(mergeCustomFacts(null, null).added, 0);
});

(async () => {
    let passed = 0;
    for (const { name, fn } of cases) {
        try { await fn(); console.log(`  ✓ ${name}`); passed++; }
        catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
    }
    console.log(`\n${passed}/${cases.length} passed${process.exitCode ? ' — FAILURES' : ''}`);
})();

// ── mergeSeedTopics ─────────────────────────────────────────────────────────
// Regression cover for a gap that silently stranded a whole knowledge import:
// seedDataFiles() only hydrates a MISSING file and mergeCustomFacts() only
// appends custom_facts, so a curated TOPIC added to seeds/ after the volume
// existed could never reach production.
{
    const { mergeSeedTopics } = require('../lib/contributions');
    let n = 0;
    const t = (name, fn) => { try { fn(); n++; console.log(`  ✓ ${name}`); }
        catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; } };

    console.log('\nmergeSeedTopics');
    t('adds a topic that exists only in seeds', () => {
        const r = mergeSeedTopics({ a: 1 }, { a: 1, hunt: { x: 'y' } });
        assert.deepStrictEqual(r.knowledge.hunt, { x: 'y' });
        assert.deepStrictEqual(r.addedPaths, ['hunt']);
    });
    t('adds a new sub-key without disturbing siblings', () => {
        const r = mergeSeedTopics({ runes: { a: 'live' } }, { runes: { a: 'seed', b: 'new' } });
        assert.strictEqual(r.knowledge.runes.a, 'live', 'live value was overwritten');
        assert.strictEqual(r.knowledge.runes.b, 'new');
        assert.deepStrictEqual(r.addedPaths, ['runes.b']);
    });
    t('LIVE ALWAYS WINS on an existing value', () => {
        const r = mergeSeedTopics({ runes: { a: 'live text' } }, { runes: { a: 'seed text' } });
        assert.strictEqual(r.knowledge.runes.a, 'live text');
        assert.deepStrictEqual(r.addedPaths, []);
    });
    t('never touches custom_facts or opinions', () => {
        // Community-owned; a stale seed must not resurrect or reorder them.
        const live = { custom_facts: [{ text: 'mine' }], opinions: [] };
        const r = mergeSeedTopics(live, { custom_facts: [{ text: 'stale' }], opinions: [{ text: 'x' }] });
        assert.deepStrictEqual(r.knowledge.custom_facts, [{ text: 'mine' }]);
        assert.deepStrictEqual(r.addedPaths, []);
    });
    t('does not mutate the live object', () => {
        const live = { runes: { a: 'x' } };
        mergeSeedTopics(live, { runes: { b: 'y' }, hunt: {} });
        assert.deepStrictEqual(live, { runes: { a: 'x' } });
    });
    t('returns the original object when there is nothing to add', () => {
        const live = { a: 1 };
        assert.strictEqual(mergeSeedTopics(live, { a: 1 }).knowledge, live);
    });
    t('handles missing or malformed input', () => {
        assert.deepStrictEqual(mergeSeedTopics(null, null).addedPaths, []);
        assert.deepStrictEqual(mergeSeedTopics({ a: 1 }, undefined).knowledge, { a: 1 });
    });
    console.log(`  (${n} mergeSeedTopics tests)`);
}

{
    const { mergeSeedTopics } = require('../lib/contributions');
    let n = 0;
    const t = (name, fn) => { try { fn(); n++; console.log(`  ✓ ${name}`); }
        catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; } };
    console.log('\nmergeSeedTopics — _repairs allowlist');
    t('repairs ONLY a path named in seed._repairs', () => {
        const live = { runes: { a: 'truncated mid-', b: 'live b' } };
        const seed = { _repairs: ['runes.a'], runes: { a: 'truncated mid-sentence, now complete.', b: 'seed b' } };
        const r = mergeSeedTopics(live, seed);
        assert.strictEqual(r.knowledge.runes.a, 'truncated mid-sentence, now complete.');
        assert.strictEqual(r.knowledge.runes.b, 'live b', 'an unlisted key was overwritten');
        assert.deepStrictEqual(r.addedPaths, ['runes.a (repair)']);
    });
    t('is a no-op once live already matches the repair', () => {
        const same = { runes: { a: 'complete.' } };
        const r = mergeSeedTopics(same, { _repairs: ['runes.a'], runes: { a: 'complete.' } });
        assert.deepStrictEqual(r.addedPaths, []);
    });
    t('_repairs itself never lands in the knowledge base', () => {
        const r = mergeSeedTopics({}, { _repairs: ['x'], hunt: { a: 1 } });
        assert.strictEqual(r.knowledge._repairs, undefined);
    });
    console.log(`  (${n} allowlist tests)`);
}
