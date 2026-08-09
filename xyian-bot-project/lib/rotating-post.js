'use strict';

/**
 * Replacing a recurring post: send first, then clean up the old one.
 *
 * Two problems this fixes.
 *
 * ORDER. The old code deleted the previous message BEFORE sending the new one.
 * If the send then failed — a rotated webhook returns 404 and sendViaWebhook
 * swallows it into a null — the channel was left with nothing at all until the
 * next cycle, which for recruitment is 48 hours. Two visible beats zero
 * visible, so the delete only happens once a replacement is actually up.
 *
 * ACCUMULATION. Kyle's rule is that a member posting between two daily resets
 * blocks cleanup, so their reply is never orphaned. That is the right call, but
 * the old code overwrote the stored id unconditionally — so a skipped delete
 * meant that message could never be cleaned up again, and the resets piled up
 * anyway. The very thing the mechanism exists to prevent. Skipped deletes now
 * go on a PENDING list and are retried on the next cycle, so "one visible at a
 * time" reasserts itself the moment the channel goes quiet.
 */

/** Discord's code for "this message no longer exists". */
const UNKNOWN_MESSAGE = 10008;

/**
 * Tracking keys whose posts rotate — a newer one supersedes the older.
 *
 * These name WHAT THE POST IS, not which channel it goes to, and that is the
 * root-cause fix. The keys used to be 'general' and 'recruit' — channel names —
 * so any caller reaching for the natural-looking sendToGeneral() silently
 * claimed the daily reset's delete slot. That is exactly how welcome messages
 * came to be deleted by the next daily reset, taking the 🤖 reaction role that
 * grants AI access with them.
 *
 * Keyed by post identity, two recurring posts can share a channel without
 * fighting over one slot, and a caller that is not a recurring post cannot
 * accidentally become one.
 */
const ROTATING_KEYS = new Set(['daily-reset', 'recruitment']);

/**
 * Is this post one we may clean up later?
 *
 * Permanent posts pass a null/undefined key: they neither delete anything nor
 * get recorded as deletable. Permanence is the DEFAULT — previously a new
 * caller was deletable unless it remembered to opt out, which is the mistake
 * the welcome made.
 */
function isRotatingPost(trackingKey) {
    return Boolean(trackingKey) && ROTATING_KEYS.has(trackingKey);
}

/**
 * May we delete this kind of post's backlog on this cycle?
 *
 *  - recruitment: always. Only one ad should ever be visible.
 *  - daily-reset: only if no MEMBER has posted since. Kyle's rule — "ideally
 *    no, it won't be deleted if someone posts between the reset messages" —
 *    because deleting then would orphan their reply.
 */
function mayDeleteFor(trackingKey, memberPosted) {
    if (!isRotatingPost(trackingKey)) return false;
    if (trackingKey === 'recruitment') return true;
    return !memberPosted;
}

/**
 * Did a real person post after our message?
 *
 * The bot's own posts do not count. A welcome landing between two daily resets
 * used to block cleanup forever; Kyle's phrasing was "if SOMEONE posts", and a
 * welcome is the bot, not someone.
 *
 * @param {Array<{webhookId?: string|null, authorId?: string|null}>} messagesAfter
 * @param {{webhookIds?: string[], botUserId?: string|null}} ours
 */
function memberPostedSince(messagesAfter, ours = {}) {
    const webhookIds = ours.webhookIds || [];
    const botUserId = ours.botUserId || null;
    return (messagesAfter || []).some((m) => {
        if (!m) return false;
        if (m.webhookId && webhookIds.includes(m.webhookId)) return false;
        if (botUserId && m.authorId === botUserId) return false;
        return true;
    });
}

/**
 * Work out which pending ids to attempt, and what to keep for next time.
 *
 * Pure so the policy is testable without a Discord client.
 *
 * @param {object} args
 * @param {string[]} args.pending      ids we still want gone, oldest first
 * @param {boolean}  args.mayDelete    false when a member has posted since
 * @param {number}   [args.maxAttempts] cap per cycle so one bad id cannot stall
 */
function planDeletions({ pending, mayDelete, maxAttempts = 5 }) {
    const list = Array.isArray(pending) ? pending.filter(Boolean) : [];
    if (!mayDelete) return { attempt: [], defer: list };
    return { attempt: list.slice(0, maxAttempts), defer: list.slice(maxAttempts) };
}

/**
 * Fold one delete result into the pending list.
 *
 * Success drops the id. "Unknown Message" also drops it — somebody removed it
 * by hand and retrying forever would be pointless. Anything else (a rate limit,
 * a transient 5xx, a permission blip) keeps it for the next cycle.
 */
function shouldKeepPending(error) {
    if (!error) return false;
    const code = error.code ?? error.rawError?.code;
    if (code === UNKNOWN_MESSAGE) return false;
    if (error.status === 404 || error.httpStatus === 404) return false;
    return true;
}

/**
 * Send the replacement, then clean up. Never deletes when the send failed.
 *
 * @param {object} args
 * @param {() => Promise<{id: string}|null>} args.send
 * @param {(id: string) => Promise<void>} args.deleteMessage
 * @param {string[]} args.pending
 * @param {boolean} args.mayDelete
 * @returns {Promise<{sent: object|null, pending: string[], deleted: string[], failed: Array<{id: string, message: string}>}>}
 */
async function replacePrevious({ send, deleteMessage, pending = [], mayDelete = true, maxAttempts = 5 }) {
    const sent = await send();

    // Nothing replaced it, so nothing may be removed. Keep every id for later.
    if (!sent?.id) {
        return { sent: null, pending: [...pending], deleted: [], failed: [] };
    }

    const { attempt, defer } = planDeletions({ pending, mayDelete, maxAttempts });
    const deleted = [];
    const failed = [];
    const keep = [...defer];

    for (const id of attempt) {
        try {
            await deleteMessage(id);
            deleted.push(id);
        } catch (e) {
            if (shouldKeepPending(e)) {
                keep.push(id);
                failed.push({ id, message: e.message || String(e) });
            } else {
                deleted.push(id); // already gone — treat as done
            }
        }
    }

    return { sent, pending: keep, deleted, failed };
}

module.exports = {
    ROTATING_KEYS,
    isRotatingPost,
    mayDeleteFor,
    memberPostedSince,
    planDeletions,
    shouldKeepPending,
    replacePrevious,
    UNKNOWN_MESSAGE,
};
