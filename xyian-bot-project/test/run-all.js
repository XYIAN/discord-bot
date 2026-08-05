#!/usr/bin/env node
'use strict';

// Run every *.test.js in this directory.
//
// package.json used to chain the files by name with `&&`. That silently omits
// any test file nobody remembered to add — changelog.test.js was written,
// passed locally, and was not run by `npm test` at all. Discovery means a new
// test file counts the moment it exists.
//
// Each file runs in its own process so one crashing does not take the rest with
// it, and so a file that sets process.exitCode still reports correctly.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/** Generous — the slowest file here runs in well under a second. */
const TIMEOUT_MS = 60_000;

const dir = __dirname;
const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.test.js'))
    .sort();

if (files.length === 0) {
    console.error('No *.test.js files found — that is almost certainly wrong.');
    process.exit(1);
}

const failed = [];
for (const f of files) {
    console.log(`\n── ${f} ${'─'.repeat(Math.max(0, 60 - f.length))}`);
    // A timeout is not optional. Without one, a test file that never exits
    // hangs the whole run forever — in CI that is a stuck job rather than a
    // failure, which is strictly worse than a red build.
    const r = spawnSync(process.execPath, [path.join(dir, f)], {
        stdio: 'inherit',
        timeout: TIMEOUT_MS,
    });
    if (r.error && r.error.code === 'ETIMEDOUT') {
        console.error(`\n✗ ${f} exceeded ${TIMEOUT_MS / 1000}s and was killed`);
        failed.push(`${f} (timeout)`);
    } else if (r.status !== 0 || r.error) {
        if (r.error) console.error(`\n✗ ${f} failed to run: ${r.error.message}`);
        failed.push(f);
    }
}

console.log(`\n${'═'.repeat(64)}`);
if (failed.length) {
    console.error(`✗ ${failed.length} of ${files.length} test file(s) failed: ${failed.join(', ')}`);
    process.exit(1);
}
console.log(`✓ all ${files.length} test files passed`);
