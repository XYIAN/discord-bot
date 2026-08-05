'use strict';

// Tests for the moderation permission rules. Run:
//   node xyian-bot-project/test/moderation.test.js
//
// These mirror the Tempest bot's permissions.test.ts case for case, so the two
// bots can be kept in step — if a rule changes in one, the same test should
// change in the other.
const assert = require('assert');
const {
    MOD_ACTIONS, MAX_TIMEOUT_MINUTES,
    canRunAction, canTargetMember, parseDuration, parseTarget, matchesOwner,
} = require('../lib/moderation');

let passed = 0;
function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.error(`  ✗ ${name}\n    ${e.message}`);
        process.exitCode = 1;
    }
}

const owner = { isOwner: true, isAdmin: false, isModerator: false };
const admin = { isOwner: false, isAdmin: true, isModerator: false };
const mod = { isOwner: false, isAdmin: false, isModerator: true };
const member = { isOwner: false, isAdmin: false, isModerator: false };

console.log('canRunAction');
test('owner and admins can do everything', () => {
    for (const a of MOD_ACTIONS) {
        assert.strictEqual(canRunAction(owner, a), true, a);
        assert.strictEqual(canRunAction(admin, a), true, a);
    }
});
test('moderators can manage roles and timeouts', () => {
    assert.strictEqual(canRunAction(mod, 'role'), true);
    assert.strictEqual(canRunAction(mod, 'timeout'), true);
    assert.strictEqual(canRunAction(mod, 'untimeout'), true);
});
test('moderators can NOT kick, ban or unban', () => {
    // The point of the split: a compromised moderator account cannot remove
    // people from the server.
    assert.strictEqual(canRunAction(mod, 'kick'), false);
    assert.strictEqual(canRunAction(mod, 'ban'), false);
    assert.strictEqual(canRunAction(mod, 'unban'), false);
});
test('ordinary members can do nothing', () => {
    for (const a of MOD_ACTIONS) assert.strictEqual(canRunAction(member, a), false, a);
});
test('a missing actor is refused rather than throwing', () => {
    assert.strictEqual(canRunAction(null, 'ban'), false);
});

const base = {
    actorId: 'actor', targetId: 'target',
    ownerId: 'botowner', guildOwnerId: 'guildowner',
    actorTopRole: 10, targetTopRole: 5, botTopRole: 20,
    targetIsBot: false, actorIsOwner: false,
};

console.log('canTargetMember');
test('allows acting on someone below you', () => {
    assert.deepStrictEqual(canTargetMember(base), { ok: true });
});
test('refuses self-moderation', () => {
    assert.strictEqual(canTargetMember({ ...base, targetId: 'actor' }).ok, false);
});
test('protects the server owner and the bot owner', () => {
    assert.strictEqual(canTargetMember({ ...base, targetId: 'guildowner' }).ok, false);
    assert.strictEqual(canTargetMember({ ...base, targetId: 'botowner' }).ok, false);
});
test('refuses to action bots', () => {
    assert.strictEqual(canTargetMember({ ...base, targetIsBot: true }).ok, false);
});
test('refuses a target at OR above the actor', () => {
    assert.strictEqual(canTargetMember({ ...base, targetTopRole: 10 }).ok, false);
    assert.strictEqual(canTargetMember({ ...base, targetTopRole: 11 }).ok, false);
});
test('exempts the bot owner from the peer check', () => {
    assert.strictEqual(
        canTargetMember({ ...base, targetTopRole: 99, botTopRole: 100, actorIsOwner: true }).ok, true);
});
test('refuses when the BOT is below the target, and says how to fix it', () => {
    const r = canTargetMember({ ...base, botTopRole: 3 });
    assert.strictEqual(r.ok, false);
    assert.ok(/above the bot/i.test(r.reason), r.reason);
});
test('checks the bot hierarchy even for the owner', () => {
    // Discord rejects it regardless of who asked, so we must too.
    assert.strictEqual(canTargetMember({ ...base, botTopRole: 1, actorIsOwner: true }).ok, false);
});

console.log('parseDuration');
test('reads minutes, hours and days', () => {
    assert.deepStrictEqual(parseDuration('30m'), { ok: true, minutes: 30 });
    assert.deepStrictEqual(parseDuration('2h'), { ok: true, minutes: 120 });
    assert.deepStrictEqual(parseDuration('7d'), { ok: true, minutes: 10080 });
});
test('treats a bare number as minutes', () => {
    assert.deepStrictEqual(parseDuration('45'), { ok: true, minutes: 45 });
});
test('accepts spacing and long unit names', () => {
    assert.deepStrictEqual(parseDuration(' 3 hours '), { ok: true, minutes: 180 });
    assert.deepStrictEqual(parseDuration('2 DAYS'), { ok: true, minutes: 2880 });
});
test('rejects nonsense rather than silently defaulting', () => {
    for (const bad of ['soon', '', '-5m', '0h', null, undefined]) {
        assert.strictEqual(parseDuration(bad).ok, false, String(bad));
    }
});
test("rejects durations past Discord's 28-day maximum", () => {
    assert.strictEqual(parseDuration('29d').ok, false);
    assert.deepStrictEqual(parseDuration('28d'), { ok: true, minutes: MAX_TIMEOUT_MINUTES });
});

console.log('parseTarget');
test('reads a mention and keeps the rest as the reason', () => {
    assert.deepStrictEqual(parseTarget('<@123456789> being rude'),
        { userId: '123456789', rest: 'being rude' });
});
test('reads a nickname mention (<@!id>)', () => {
    assert.deepStrictEqual(parseTarget('<@!123456789> spam'),
        { userId: '123456789', rest: 'spam' });
});
test('reads a raw id', () => {
    assert.deepStrictEqual(parseTarget('123456789 spam'),
        { userId: '123456789', rest: 'spam' });
});
test('handles a target with no reason', () => {
    assert.deepStrictEqual(parseTarget('<@123456789>'), { userId: '123456789', rest: '' });
});
test('returns null when there is no target', () => {
    assert.strictEqual(parseTarget('just words').userId, null);
    assert.strictEqual(parseTarget('').userId, null);
});

console.log('matchesOwner');
test('matches a member object', () => {
    assert.strictEqual(matchesOwner({ id: '123' }, '123'), true);
    assert.strictEqual(matchesOwner({ id: '999' }, '123'), false);
});
test('matches a raw id string too', () => {
    // bot.js called it both ways; the old version silently failed on strings
    // because it read `.id` off them, and an isAdmin fallback hid the bug.
    assert.strictEqual(matchesOwner('123', '123'), true);
    assert.strictEqual(matchesOwner('999', '123'), false);
});
test('nobody is the owner when OWNER_ID is unset', () => {
    // Fails closed on purpose — but callers must SAY the id is unconfigured,
    // not refuse the real owner with a bare "owner-only".
    for (const unset of ['', '   ', null, undefined]) {
        assert.strictEqual(matchesOwner({ id: '123' }, unset), false, String(unset));
    }
});
test('tolerates whitespace and numeric ids from env', () => {
    assert.strictEqual(matchesOwner({ id: '123' }, ' 123 '), true);
    assert.strictEqual(matchesOwner({ id: 123 }, '123'), true);
});
test('a missing or idless actor is refused rather than throwing', () => {
    assert.strictEqual(matchesOwner(null, '123'), false);
    assert.strictEqual(matchesOwner({}, '123'), false);
});

console.log(`\n${passed} passed`);
