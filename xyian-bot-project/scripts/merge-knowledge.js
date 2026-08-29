#!/usr/bin/env node
'use strict';

// Fold a reviewed knowledge fragment into the live knowledge base.
//
//   node xyian-bot-project/scripts/merge-knowledge.js <fragment> --dry-run
//   node xyian-bot-project/scripts/merge-knowledge.js <fragment>
//   node xyian-bot-project/scripts/merge-knowledge.js <fragment> --repair a.b --repair c.d
//
// Defaults to ADDITIVE ONLY. An existing value is never changed unless its exact
// dotted path is passed with --repair, which forces a human to have looked at it.
// data/knowledge.json was wiped once by an infrastructure incident; this script
// exists so that never happens by accident.

const fs = require('fs');
const path = require('path');
const { mergeFragment, oversizedValues, truncatedValues } = require('../lib/knowledge-merge');

const LIVE = path.join(__dirname, '..', 'data', 'knowledge.json');
const SEED = path.join(__dirname, '..', 'seeds', 'knowledge.json');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const fragmentPath = argv.find((a) => !a.startsWith('--'));
const allowRepair = argv.reduce((acc, a, i) => {
    if (a === '--repair' && argv[i + 1]) acc.push(argv[i + 1]);
    return acc;
}, []);

if (!fragmentPath) {
    console.error('Usage: merge-knowledge.js <fragment.json> [--dry-run] [--repair <key.path>]...');
    process.exit(1);
}

function readJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function countKeys(o) {
    let n = 0;
    for (const k of Object.keys(o || {})) {
        if (k === '_meta') continue;
        n += 1;
        if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) n += countKeys(o[k]);
    }
    return n;
}

const live = readJson(LIVE);
const fragment = readJson(fragmentPath);

const { merged, added, repaired, conflicts, addedFacts, unmatchedRepairs, renamed, unmatchedRenames } = mergeFragment(live, fragment, { allowRepair });

console.log(`\nFragment: ${path.basename(fragmentPath)}`);
if (fragment._meta) {
    console.log(`  source:     ${fragment._meta.source || '(none)'}`);
    console.log(`  confidence: ${fragment._meta.confidence || '(none)'}`);
}
console.log(`\n  live keys before: ${countKeys(live)}`);
console.log(`  live keys after:  ${countKeys(merged)}`);

console.log(`\n  ADDED (${added.length}):`);
for (const a of added.slice(0, 20)) console.log(`    + ${a}`);
if (added.length > 20) console.log(`    … ${added.length - 20} more`);

if (addedFacts.length) {
    console.log(`\n  CUSTOM FACTS APPENDED (${addedFacts.length}):`);
    for (const f of addedFacts) console.log(`    + ${f.slice(0, 100)}${f.length > 100 ? '…' : ''}`);
}

if (repaired.length) {
    console.log(`\n  REPAIRED — existing values overwritten because you passed --repair (${repaired.length}):`);
    for (const r of repaired) console.log(`    ~ ${r}`);
}

if (renamed.length) {
    console.log(`\n  RENAMED KEYS — the old name is GONE from the prompt (${renamed.length}):`);
    for (const r of renamed) console.log(`    → ${r}`);
}

if (unmatchedRenames.length) {
    console.log(`\n  ⚠️  renames that matched NOTHING (${unmatchedRenames.length}):`);
    for (const u of unmatchedRenames) console.log(`     ? ${u}`);
}

if (unmatchedRepairs.length) {
    console.log(`\n  ⚠️  custom_facts repairs that matched NOTHING (${unmatchedRepairs.length}):`);
    for (const u of unmatchedRepairs) console.log(`     ? ${u.slice(0, 100)}${u.length > 100 ? '…' : ''}`);
    console.log('     The fact text must match VERBATIM. Check it still reads exactly like this.');
}

if (conflicts.length) {
    console.log(`\n  CONFLICTS — left untouched, live value kept (${conflicts.length}):`);
    for (const c of conflicts.slice(0, 30)) console.log(`    ! ${c}`);
    if (conflicts.length > 30) console.log(`    … ${conflicts.length - 30} more`);
    console.log('    Re-run with --repair <path> for each one you have reviewed and want replaced.');
    if (conflicts.some((c) => c.startsWith('custom_facts['))) {
        console.log("    For a custom_facts[N] conflict the flag is --repair custom_facts (the array, not the index).");
    }
}

// Quality gates on what would actually land.
const big = oversizedValues(merged, 400);
const cut = truncatedValues(merged);
if (big.length) {
    console.log(`\n  ⚠️  oversized values (inlined into the LLM prompt) (${big.length}):`);
    for (const b of big.slice(0, 10)) console.log(`     ${b}`);
    if (big.length > 10) console.log(`     … ${big.length - 10} more`);
}
if (cut.length) {
    console.log(`\n  ⚠️  values that look truncated mid-sentence (${cut.length}):`);
    for (const c of cut.slice(0, 10)) console.log(`     ${c}`);
    if (cut.length > 10) console.log(`     … ${cut.length - 10} more`);
}

if (dryRun) {
    console.log('\n  DRY RUN — nothing written.\n');
    process.exit(0);
}

if (!added.length && !repaired.length && !addedFacts.length && !renamed.length) {
    console.log('\n  Nothing to do.\n');
    process.exit(0);
}

// Timestamped backup before any write. Cheap insurance on a file that has been
// lost before.
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `${LIVE}.${stamp}.bak`;
fs.copyFileSync(LIVE, backup);

const out = `${JSON.stringify(merged, null, 2)}\n`;
JSON.parse(out); // fail loudly rather than write something unparseable
fs.writeFileSync(LIVE, out);
// seeds/ is what restores the volume on first mount — keep it in step or the
// next volume incident loses exactly this work.
if (fs.existsSync(SEED)) fs.writeFileSync(SEED, out);

console.log(`\n  ✅ written to data/knowledge.json${fs.existsSync(SEED) ? ' and seeds/knowledge.json' : ''}`);
console.log(`  backup: ${path.basename(backup)}\n`);
