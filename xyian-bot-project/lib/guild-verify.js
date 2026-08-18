'use strict';

/**
 * Guild-verification argument parsing: which guild is the member in, and which
 * Verified role does that map to?
 *
 * Written when ProjectXY (Guild ID 214890) joined XYIAN OFFICIAL (213797) as
 * the family's one sub-guild. The ⚔️ flow used to say "verify they're in XYIAN
 * OFFICIAL and use !grant" — but !grant assigns the AI-access role, not a
 * guild role, so verification was half-wired even for one guild. With two
 * guilds the admin must SAY which one they verified, so `!verify` takes the
 * guild as an argument and refuses to guess.
 */

const GUILDS = {
    xyian: {
        key: 'xyian',
        label: 'XYIAN OFFICIAL',
        gameGuildId: '213797',
        roleName: 'XYIAN Guild Verified',
    },
    projectxy: {
        key: 'projectxy',
        label: 'ProjectXY',
        gameGuildId: '214890',
        roleName: 'ProjectXY Guild Verified',
    },
};

/** Everything a mod might reasonably type for each guild. */
const ALIASES = new Map([
    ['xyian', 'xyian'], ['official', 'xyian'], ['xyianofficial', 'xyian'],
    ['main', 'xyian'], ['213797', 'xyian'],
    ['projectxy', 'projectxy'], ['project', 'projectxy'], ['pxy', 'projectxy'],
    ['sub', 'projectxy'], ['214890', 'projectxy'],
]);

/**
 * Resolve the guild argument of `!verify @user <guild>`.
 *
 * Returns the guild descriptor, or null when the argument is missing or
 * unrecognised — the caller shows usage. Deliberately NO default: with two
 * guilds, defaulting would verify people into the wrong one silently, and the
 * admin notification names both so the mod always knows which to type.
 */
function resolveGuildArg(argText) {
    const words = String(argText || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    for (const w of words) {
        // Mentions arrive as <@123…> tokens — skip anything mention-shaped.
        if (w.startsWith('<@')) continue;
        const key = ALIASES.get(w.replace(/[^a-z0-9]/g, ''));
        if (key) return GUILDS[key];
    }
    return null;
}

/** For usage messages and the ⚔️ admin ping. */
function usageLine() {
    return '`!verify @user xyian` or `!verify @user projectxy`';
}

module.exports = { GUILDS, resolveGuildArg, usageLine };
