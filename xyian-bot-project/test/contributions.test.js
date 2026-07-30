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

(async () => {
    let passed = 0;
    for (const { name, fn } of cases) {
        try { await fn(); console.log(`  ✓ ${name}`); passed++; }
        catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
    }
    console.log(`\n${passed}/${cases.length} passed${process.exitCode ? ' — FAILURES' : ''}`);
})();
