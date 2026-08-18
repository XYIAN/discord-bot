'use strict';

// Tests for guild-verification argument parsing. Run:
//   node xyian-bot-project/test/guild-verify.test.js
const assert = require('assert');
const { GUILDS, resolveGuildArg } = require('../lib/guild-verify');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('guild-verify');

test('the two canonical names resolve', () => {
    assert.strictEqual(resolveGuildArg('xyian').roleName, 'XYIAN Guild Verified');
    assert.strictEqual(resolveGuildArg('projectxy').roleName, 'ProjectXY Guild Verified');
});

test('mod-typed variants resolve: case, punctuation, aliases, game guild ids', () => {
    assert.strictEqual(resolveGuildArg('XYIAN').key, 'xyian');
    assert.strictEqual(resolveGuildArg('ProjectXY').key, 'projectxy');
    assert.strictEqual(resolveGuildArg('official').key, 'xyian');
    assert.strictEqual(resolveGuildArg('pxy').key, 'projectxy');
    assert.strictEqual(resolveGuildArg('213797').key, 'xyian');
    assert.strictEqual(resolveGuildArg('214890').key, 'projectxy');
    assert.strictEqual(resolveGuildArg('Project-XY').key, 'projectxy');
});

test('the guild arg is found even with the mention token in the text', () => {
    // argText for "!verify @user projectxy" arrives as "<@123456> projectxy".
    assert.strictEqual(resolveGuildArg('<@123456789> projectxy').key, 'projectxy');
    assert.strictEqual(resolveGuildArg('<@!123456789> xyian').key, 'xyian');
});

test('NO DEFAULT: missing or unknown guild returns null, never a guess', () => {
    // Two guilds means a silent default verifies people into the wrong one.
    assert.strictEqual(resolveGuildArg(''), null);
    assert.strictEqual(resolveGuildArg(null), null);
    assert.strictEqual(resolveGuildArg('<@123456789>'), null);
    assert.strictEqual(resolveGuildArg('yes please'), null);
});

test('descriptors carry what the DM and admin log need', () => {
    assert.strictEqual(GUILDS.xyian.gameGuildId, '213797');
    assert.strictEqual(GUILDS.projectxy.gameGuildId, '214890');
    assert.strictEqual(GUILDS.projectxy.label, 'ProjectXY');
});

console.log(`  ${passed} passed`);
