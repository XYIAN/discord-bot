'use strict';

// Tests for CHANGELOG.md parsing. Run:
//   node xyian-bot-project/test/changelog.test.js
//
// Written after v3.17.0 and v3.18.0 both deployed successfully but posted
// nothing to #changelog: the parser only ever recognised `- ` bullets, and both
// entries were written as prose. The bug was silent — the deploy log said
// "no changelog entries" and that read like a statement of fact.
const assert = require('assert');
const { parseChangelog, linesForVersion, linesFromSection } = require('../lib/changelog');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

const BULLET_ENTRY = `# Changelog

## [3.16.0] - 2026-08-03

### Moderation commands

Moderators had no way to manage roles.

- \`!role @user add|remove <role>\` — add or remove a role
- \`!timeout @user <30m>\` — temporarily mute

## [3.15.0] - 2026-08-01

- older thing
`;

const PROSE_ENTRY = `# Changelog

## [3.18.0] - 2026-08-04

### Community knowledge import, slice 5

Knowledge base 730 to 1033 keys.

**Arena modes (+55).** Ten of these collided with existing values.

## [3.16.0] - 2026-08-03

- a bullet
`;

console.log('parseChangelog — version');
test('reads the newest version', () => {
    assert.strictEqual(parseChangelog(BULLET_ENTRY).version, '3.16.0');
    assert.strictEqual(parseChangelog(PROSE_ENTRY).version, '3.18.0');
});
test('falls back to 0.0.0 rather than throwing on junk', () => {
    assert.strictEqual(parseChangelog('no entries here').version, '0.0.0');
    assert.strictEqual(parseChangelog('').version, '0.0.0');
    assert.strictEqual(parseChangelog(null).version, '0.0.0');
});

console.log('parseChangelog — bullet entries (existing behaviour, must not regress)');
test('extracts bullets and strips the marker', () => {
    const r = parseChangelog(BULLET_ENTRY);
    assert.strictEqual(r.style, 'bullets');
    assert.deepStrictEqual(r.lines, [
        '`!role @user add|remove <role>` — add or remove a role',
        '`!timeout @user <30m>` — temporarily mute',
    ]);
});
test('does not bleed into the next version entry', () => {
    assert.ok(!parseChangelog(BULLET_ENTRY).lines.some((l) => /older thing/.test(l)));
});
test('prose preamble is dropped when bullets exist', () => {
    // Older entries pair a paragraph of context with a bullet list and expect
    // only the bullets to post.
    assert.ok(!parseChangelog(BULLET_ENTRY).lines.some((l) => /no way to manage/.test(l)));
});

console.log('parseChangelog — prose entries (the v3.17/v3.18 bug)');
test('a prose entry yields lines instead of silently yielding none', () => {
    const r = parseChangelog(PROSE_ENTRY);
    assert.strictEqual(r.style, 'prose');
    assert.ok(r.lines.length > 0, 'prose entry parsed to zero lines — the original bug');
});
test('keeps the subheading and the paragraphs, drops the version title', () => {
    const r = parseChangelog(PROSE_ENTRY);
    assert.deepStrictEqual(r.lines, [
        '### Community knowledge import, slice 5',
        'Knowledge base 730 to 1033 keys.',
        '**Arena modes (+55).** Ten of these collided with existing values.',
    ]);
});
test('does not bleed into the next entry', () => {
    assert.ok(!parseChangelog(PROSE_ENTRY).lines.some((l) => /a bullet/.test(l)));
});

console.log('linesForVersion');
test('finds a historical bullet release', () => {
    const r = linesForVersion(BULLET_ENTRY, '3.15.0');
    assert.deepStrictEqual(r.lines, ['older thing']);
});
test('finds a historical prose release — so !post-changelog can repair 3.17/3.18', () => {
    const r = linesForVersion(PROSE_ENTRY, '3.18.0');
    assert.strictEqual(r.style, 'prose');
    assert.ok(r.lines.length > 0);
});
test('returns null for a version that is not in the file', () => {
    assert.strictEqual(linesForVersion(BULLET_ENTRY, '9.9.9'), null);
});
test('distinguishes "absent" from "present but empty"', () => {
    // null means "no such release"; an empty list means "released, no notes".
    // Collapsing the two would make !post-changelog report the wrong thing.
    assert.strictEqual(linesForVersion('## [1.0.0] - x\n', '2.0.0'), null);
    assert.deepStrictEqual(linesForVersion('## [1.0.0] - x\n', '1.0.0').lines, []);
});

console.log('linesFromSection — edge cases');
test('handles an empty or missing section safely', () => {
    assert.deepStrictEqual(linesFromSection('').lines, []);
    assert.deepStrictEqual(linesFromSection(null).lines, []);
});
test('ignores a hyphen that is not a list marker', () => {
    // "-5% damage" must not be mistaken for a bullet.
    const r = linesFromSection('## [1.0.0] - x\n\n-5% damage on this build\n');
    assert.strictEqual(r.style, 'prose');
    assert.deepStrictEqual(r.lines, ['-5% damage on this build']);
});

console.log('the real CHANGELOG.md');
test('every release in the repo parses to at least one line', () => {
    const fs = require('fs');
    const path = require('path');
    const md = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
    const versions = [...md.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);
    assert.ok(versions.length > 5, 'expected a real changelog');
    const empty = versions.filter((v) => (linesForVersion(md, v) || { lines: [] }).lines.length === 0);
    assert.deepStrictEqual(empty, [], `these releases would post nothing: ${empty.join(', ')}`);
});

console.log(`\n${passed} passed`);
