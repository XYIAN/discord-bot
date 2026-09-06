'use strict';

// ── Guild membership requirements ───────────────────────────────────────────
// The single source for what the two guilds ask of their members.
//
// These numbers were previously written out in three unrelated bot.js strings
// (the recurring recruitment post, the new-member welcome, and the
// !post-guild-requirements embed) plus again in data/knowledge.json, with
// nothing binding them. When the power minimum last changed, all three code
// strings had to be found by grep — and the knowledge base was never updated at
// all, so the bot could not answer "what power do I need?" for its own guild.
//
// Four copies that can disagree is worse than a coin flip here: production runs
// gpt-4o-mini, and CLAUDE.md is explicit that a contradiction in the knowledge
// base is a coin-flip on the answer. A member could read one number in the
// recruitment ad and be told another by the bot in the next channel.
//
// test/guild-requirements.test.js asserts that data/knowledge.json agrees with
// this module and that bot.js holds no loose power literal, so a future change
// here cannot silently leave a surface behind.

/**
 * The two guilds. Power is the ONLY requirement that differs between them.
 *
 * `short` is what members actually type — XY and PXY are the everyday names in
 * chat, and a question about "XY" has to land on XYIAN OFFICIAL, not on
 * ProjectXY (whose full name also contains the letters XY).
 */
const GUILDS = Object.freeze({
    xyian: Object.freeze({
        name: 'XYIAN OFFICIAL',
        short: 'XY',
        id: '213797',
        power: '8M+',
        blurb: 'our founding guild',
    }),
    projectxy: Object.freeze({
        name: 'ProjectXY',
        short: 'PXY',
        id: '214890',
        power: '6M+',
        blurb: 'our sister guild and the primary home for new members',
    }),
});

/**
 * Requirements every member of either guild carries.
 *
 * `donations` is 2/day rather than 1 because the first donation of the day is
 * free — asking for one costs a member nothing and measures nothing.
 * `monsterInvasion` is the guild boss battle, called MI in chat; the alias is
 * recorded so the knowledge base and the bot answer to both names.
 */
const SHARED = Object.freeze({
    donations: 2,
    monsterInvasion: 2,
    monsterInvasionAlias: 'MI',
    research: true,
    discordActive: true,
});

/** "**8M+** for XYIAN OFFICIAL · **6M+** for ProjectXY" */
function powerSummary(separator) {
    const sep = separator || ' · ';
    return Object.values(GUILDS).map((g) => `**${g.power}** for ${g.name}`).join(sep);
}

/** Bullet lines for the recurring recruitment post. */
function recruitmentBullets() {
    return [
        `• 💪 Power: ${powerSummary()}`,
        `• Daily Monster Invasion (${SHARED.monsterInvasionAlias}) & research — ${SHARED.monsterInvasion}x minimum`,
        `• Daily guild donations — ${SHARED.donations}x minimum`,
        '• Active in Discord',
    ].join('\n');
}

/** One-liner for the new-member welcome embed. */
function welcomeLine() {
    return `Power: ${powerSummary(', ')}. Both: daily activity. One community, one Discord.`;
}

/** Field value for the !post-guild-requirements embed. */
function powerField() {
    return Object.values(GUILDS)
        .map((g) => `**${g.name}** (\`${g.id}\`) — **${g.power} required**`)
        .join('\n') + '\n• Minimum power to join and stay active';
}

module.exports = { GUILDS, SHARED, powerSummary, recruitmentBullets, welcomeLine, powerField };
