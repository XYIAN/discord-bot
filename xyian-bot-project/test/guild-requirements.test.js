// Binds lib/guild-requirements.js to every surface that states a requirement.
//
// Before this module the numbers lived in three unrelated bot.js strings and
// again in data/knowledge.json, with nothing comparing them. That is the shape
// v3.22.0 fixed for the render suppression list: two lists, a comment claiming
// a test kept them in step, and no test that actually compared them.
//
// The knowledge-base assertions are the important half. bot.js strings are what
// a member READS in a channel; knowledge.json is what the bot SAYS when asked.
// If they disagree, a member is told one number by the recruitment ad and
// another by Arch AI in the next channel — and on gpt-4o-mini a contradiction
// in the corpus is a coin-flip on which one comes out (see CLAUDE.md).
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { GUILDS, SHARED, powerSummary, recruitmentBullets, welcomeLine, powerField } = require('../lib/guild-requirements');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const KNOWLEDGE = JSON.parse(read('data/knowledge.json'));

console.log('the data itself');
test('both guilds are defined with an id and a power minimum', () => {
    for (const [key, g] of Object.entries(GUILDS)) {
        assert.ok(g.name, `${key} has no name`);
        assert.match(g.id, /^\d{6}$/, `${key} id looks wrong: ${g.id}`);
        assert.match(g.power, /^\d+M\+$/, `${key} power looks wrong: ${g.power}`);
    }
});
test('the two guilds have DIFFERENT power minimums', () => {
    // The whole reason this module exists. If these ever match, the split has
    // been undone somewhere and the surfaces below are saying nothing useful.
    assert.notStrictEqual(GUILDS.xyian.power, GUILDS.projectxy.power);
});
test('the donation minimum is above 1, because the first is free', () => {
    // A 1/day minimum asks a member for the free donation and measures nothing.
    assert.ok(SHARED.donations >= 2, 'donation minimum must exceed the free one');
});

console.log('every rendered surface carries every number');
test('the recruitment bullets state both power minimums', () => {
    const out = recruitmentBullets();
    for (const g of Object.values(GUILDS)) {
        assert.ok(out.includes(g.power), `recruitment post is missing ${g.power}`);
        assert.ok(out.includes(g.name), `recruitment post is missing ${g.name}`);
    }
    assert.ok(out.includes(`${SHARED.donations}x minimum`), 'missing the donation minimum');
    assert.ok(out.includes(SHARED.monsterInvasionAlias), 'missing the MI alias');
});
test('the welcome line states both power minimums', () => {
    const out = welcomeLine();
    for (const g of Object.values(GUILDS)) assert.ok(out.includes(g.power) && out.includes(g.name));
});
test('the requirements embed field states both, with guild ids', () => {
    const out = powerField();
    for (const g of Object.values(GUILDS)) assert.ok(out.includes(g.power) && out.includes(g.id));
});
test('powerSummary honours the separator it is given', () => {
    assert.ok(powerSummary(' | ').includes(' | '));
    assert.ok(!powerSummary(' | ').includes(' · '));
});

console.log('bot.js holds no loose copy');
test('no power literal is hardcoded in bot.js', () => {
    // Every surface must render from this module. A bare "8M+" in bot.js is a
    // fourth copy waiting to drift.
    const bot = read('bot.js');
    for (const g of Object.values(GUILDS)) {
        assert.ok(!bot.includes(g.power),
            `bot.js hardcodes ${g.power} again — render it from lib/guild-requirements.js`);
    }
});

console.log('knowledge.json agrees — what the bot SAYS matches what members READ');
const reqs = KNOWLEDGE.guild && KNOWLEDGE.guild.requirements;
test('guild.requirements exists at all', () => {
    // It did not until v3.32.0: the bot could not answer "what power do I need
    // for my own guild?" while three channels displayed the answer.
    assert.ok(reqs, 'knowledge.json has no guild.requirements');
});
test('each guild has a short name, and the two are distinct', () => {
    // XY and PXY are what members type. "XY" must not resolve by substring to
    // ProjectXY, whose full name also contains those letters.
    for (const g of Object.values(GUILDS)) assert.match(g.short, /^[A-Z]{2,4}$/, `${g.name} short name looks wrong`);
    assert.notStrictEqual(GUILDS.xyian.short, GUILDS.projectxy.short);
});
test('the knowledge base states each short name beside its FULL guild name', () => {
    // Beside, not merely somewhere: a small model reads the line it retrieved.
    const blob = JSON.stringify(reqs);
    for (const g of Object.values(GUILDS)) {
        const re = new RegExp(`${g.name}[^.]{0,40}\\b${g.short}\\b`);
        assert.ok(re.test(blob), `knowledge.json never says ${g.name} is ${g.short}`);
    }
});
test('each guild power minimum appears in the knowledge base', () => {
    const blob = JSON.stringify(reqs);
    for (const g of Object.values(GUILDS)) {
        assert.ok(blob.includes(g.power), `knowledge.json never states ${g.name} = ${g.power}`);
        assert.ok(blob.includes(g.id), `knowledge.json never states ${g.name}'s id ${g.id}`);
    }
});
test('the knowledge base states the SAME donation minimum as the code', () => {
    assert.ok(new RegExp(`${SHARED.donations}x minimum`).test(reqs.shared_activity),
        `shared_activity does not state ${SHARED.donations}x donations: ${reqs.shared_activity}`);
});
test('the knowledge base names Monster Invasion and its alias', () => {
    assert.ok(/Monster Invasion/i.test(reqs.shared_activity));
    assert.ok(reqs.shared_activity.includes(SHARED.monsterInvasionAlias));
});
test('no surface still asks for a daily BARGAIN as the requirement', () => {
    // Bargain and donation are different systems in different menus. The
    // recruitment post asked for a daily bargain while the embed asked for a
    // daily donation; at most one could be right, and it was the donation.
    assert.ok(!/bargain/i.test(recruitmentBullets()), 'recruitment post still asks for a bargain');
    assert.ok(!/bargain/i.test(reqs.shared_activity), 'knowledge base still asks for a bargain');
});

console.log(`\n${passed} passed`);
