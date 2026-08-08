'use strict';

/**
 * Which of our own posts may be deleted to keep a channel tidy — and which
 * must never be.
 *
 * `sendViaWebhook` deletes the previous message it sent to a channel before
 * posting a new one. That was written for ROTATING posts: only one recruitment
 * ad and one daily-reset notice should ever be visible.
 *
 * Welcome messages were quietly swept into the same mechanism, because they
 * post through `sendToGeneral()` and inherited its `'general'` tracking key —
 * the one whose own declaration comment reads "message ID of last daily reset
 * we sent". So a member joined, got a welcome, and the next daily reset deleted
 * it. On a quiet server that is every single welcome.
 *
 * Two things broke, not one:
 *   1. #general has no record that anybody joined.
 *   2. The welcome embed carries the 🤖 reaction role. Deleting it removes the
 *      only way a new member can grant themselves AI access, so they arrive to
 *      a channel with no welcome and no route in.
 *
 * A welcome is addressed to one person and is part of the channel history.
 * It is not a rotating notice and must never be deleted, nor recorded as
 * something a later post may delete.
 */

/** Tracking keys whose posts rotate — a newer one supersedes the older. */
const ROTATING_KEYS = new Set(['general', 'recruit']);

/**
 * Is this post one we are allowed to clean up later?
 *
 * Permanent posts pass a null/undefined tracking key, which means they neither
 * delete anything nor get recorded as deletable.
 */
function isRotatingPost(trackingKey) {
    return Boolean(trackingKey) && ROTATING_KEYS.has(trackingKey);
}

/**
 * Decide whether to delete our previous post before sending a new one.
 *
 * @param {object} args
 * @param {string|null|undefined} args.trackingKey  null for permanent posts
 * @param {string|null|undefined} args.previousId   our last message id, if any
 * @param {string|null|undefined} args.latestIdInChannel  newest message in the channel
 * @returns {boolean}
 */
function shouldDeletePrevious({ trackingKey, previousId, latestIdInChannel }) {
    if (!isRotatingPost(trackingKey)) return false;
    if (!previousId) return false;

    // Recruitment: always collapse to a single visible ad.
    if (trackingKey === 'recruit') return true;

    // #general: only tidy up if nobody has posted since. If a member replied to
    // our notice, deleting it would orphan their reply.
    return Boolean(latestIdInChannel) && latestIdInChannel === previousId;
}

module.exports = { isRotatingPost, shouldDeletePrevious, ROTATING_KEYS };
