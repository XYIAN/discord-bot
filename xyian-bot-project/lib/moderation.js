'use strict';

// ── Moderation permission logic ──────────────────────────────────────────────
// Pure, dependency-free rules for who may run which moderation action and
// against whom. Extracted so the part that must never be wrong is testable
// without a Discord connection — bot.js holds only the plumbing.
//
// Ported from the Tempest bot (TypeScript), where this logic is covered by the
// same cases. Kept deliberately identical in behaviour so a fix in one bot can
// be applied to the other without re-deriving the rules.

/** Actions in rough order of how hard they are to undo. */
const MOD_ACTIONS = ['role', 'timeout', 'untimeout', 'kick', 'ban', 'unban'];

/**
 * Moderators handle day-to-day moderation; only admins and the owner can
 * remove someone from the server. A compromised moderator account should not
 * be able to empty the guild — timeouts are reversible, bans are not.
 */
const ADMIN_ONLY = ['kick', 'ban', 'unban'];

/**
 * @param {{isOwner:boolean, isAdmin:boolean, isModerator:boolean}} actor
 * @param {string} action
 */
function canRunAction(actor, action) {
    if (!actor) return false;
    if (actor.isOwner || actor.isAdmin) return true;
    if (!actor.isModerator) return false;
    return !ADMIN_ONLY.includes(action);
}

/**
 * Whether `memberOrId` is the configured owner.
 *
 * Takes a User/GuildMember object OR a raw id string, because bot.js called it
 * both ways: one call site passed `message.author.id`, the older implementation
 * read `.id` off it, got undefined, and could never match. It had an isAdmin
 * fallback so nothing visibly broke — which is why it survived unnoticed.
 *
 * An unconfigured ownerId means NOBODY is the owner. That is deliberate (fail
 * closed), but callers must say so out loud rather than refusing the real owner
 * with a bare "owner-only".
 */
function matchesOwner(memberOrId, ownerId) {
    const configured = String(ownerId == null ? '' : ownerId).trim();
    if (!configured || !memberOrId) return false;
    const id = typeof memberOrId === 'string' ? memberOrId : memberOrId.id;
    return Boolean(id) && String(id) === configured;
}

/**
 * Whether the actor may act on this target at all.
 *
 * Discord enforces its own hierarchy server-side, but a rejection there is an
 * opaque 50013. Checking first means the moderator gets a sentence explaining
 * why, and we never attempt something that was always going to fail.
 *
 * @returns {{ok:true}|{ok:false, reason:string}}
 */
function canTargetMember(input) {
    const {
        actorId, targetId, ownerId, guildOwnerId,
        actorTopRole, targetTopRole, botTopRole,
        targetIsBot, actorIsOwner,
    } = input;

    if (actorId === targetId) return { ok: false, reason: "You can't moderate yourself." };
    if (targetId === guildOwnerId) return { ok: false, reason: "The server owner can't be moderated." };
    if (ownerId && targetId === ownerId) return { ok: false, reason: "The bot owner can't be moderated." };
    if (targetIsBot) return { ok: false, reason: 'Use the server settings to manage bots.' };

    // The bot can only act below its own highest role — a Discord rule, not
    // ours, and the most common reason an action fails.
    if (botTopRole <= targetTopRole) {
        return {
            ok: false,
            reason: "That member is above the bot in the role list, so I can't action them. Move my role higher.",
        };
    }
    // The owner is exempt from the peer check: they are expected to outrank
    // everyone, and their role position may not reflect that.
    if (!actorIsOwner && actorTopRole <= targetTopRole) {
        return { ok: false, reason: 'You can only moderate members below you in the role list.' };
    }
    return { ok: true };
}

/** Discord allows a timeout of at most 28 days. */
const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

/**
 * Parse a human duration: `30m`, `2h`, `7d`, or a bare number of minutes.
 * Rejecting bad input beats silently defaulting — a timeout that quietly
 * became one minute instead of one day is worse than an error.
 *
 * @returns {{ok:true, minutes:number}|{ok:false, reason:string}}
 */
function parseDuration(input) {
    const trimmed = String(input == null ? '' : input).trim().toLowerCase();
    const match = /^(\d+)\s*(m|min|mins|minutes|h|hr|hrs|hours|d|day|days)?$/.exec(trimmed);
    if (!match) return { ok: false, reason: 'Use a duration like `30m`, `2h` or `7d`.' };
    const value = Number(match[1]);
    if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, reason: 'Duration must be greater than zero.' };
    }
    const unit = match[2] || 'm';
    const multiplier = unit.startsWith('d') ? 1440 : unit.startsWith('h') ? 60 : 1;
    const minutes = value * multiplier;
    if (minutes > MAX_TIMEOUT_MINUTES) {
        return { ok: false, reason: 'Discord allows a maximum timeout of 28 days.' };
    }
    return { ok: true, minutes };
}

/**
 * Pull a user id out of a mention or a raw id — `!kick @someone reason` and
 * `!kick 12345 reason` both work. Returns { userId, rest }.
 */
function parseTarget(argText) {
    const text = String(argText == null ? '' : argText).trim();
    const match = /^(?:<@!?(\d{5,25})>|(\d{5,25}))\s*([\s\S]*)$/.exec(text);
    if (!match) return { userId: null, rest: text };
    return { userId: match[1] || match[2], rest: (match[3] || '').trim() };
}

module.exports = {
    MOD_ACTIONS,
    ADMIN_ONLY,
    MAX_TIMEOUT_MINUTES,
    canRunAction,
    canTargetMember,
    matchesOwner,
    parseDuration,
    parseTarget,
};
