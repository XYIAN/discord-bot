'use strict';

/**
 * When is a recurring post due?
 *
 * Pure functions over (last posted, now) so the answer does not depend on when
 * the process happened to start.
 *
 * THE BUG THIS FIXES. Recruitment ran on `setInterval(24h)` with a counter
 * starting at 0, sending only on even ticks — so the first automatic post was
 * 48 hours after BOOT, and the counter was a module-level variable that reset
 * on every deploy. Measured against the real history: 32 deploys in a
 * fortnight, only 2 gaps longer than 48h. The recruitment ad had therefore
 * almost never posted on its own; only the manual `!recruit` ever ran it.
 *
 * Anchoring on the last post instead of on boot means a redeploy no longer
 * restarts the clock, and a bot that was down over its window catches up on the
 * next check rather than silently skipping a cycle.
 */

const HOUR_MS = 60 * 60 * 1000;

/** Local calendar day in a timezone, as YYYY-MM-DD. Stable to compare. */
function dayKey(now, timeZone = 'America/Los_Angeles') {
    return new Date(now).toLocaleDateString('en-CA', { timeZone });
}

/**
 * Is a fixed-interval post due?
 *
 * A missing/unparseable timestamp means "never posted", which is due — so a
 * first boot, or a store lost with the volume, posts once rather than waiting
 * a full interval.
 */
function isDue(lastPostedAt, now, intervalHours) {
    if (!lastPostedAt) return true;
    const last = new Date(lastPostedAt).getTime();
    if (!Number.isFinite(last)) return true;
    return now - last >= intervalHours * HOUR_MS;
}

/** Milliseconds until due, or 0 if due now. For logging, not for correctness. */
function msUntilDue(lastPostedAt, now, intervalHours) {
    if (isDue(lastPostedAt, now, intervalHours)) return 0;
    return new Date(lastPostedAt).getTime() + intervalHours * HOUR_MS - now;
}

/**
 * Has a once-per-day post already gone out today?
 *
 * Guards the daily reset against a restart near its window double-posting, and
 * against a restart just after it silently skipping the day.
 */
function alreadyPostedToday(lastPostedDayKey, now, timeZone = 'America/Los_Angeles') {
    if (!lastPostedDayKey) return false;
    return lastPostedDayKey === dayKey(now, timeZone);
}

module.exports = { dayKey, isDue, msUntilDue, alreadyPostedToday, HOUR_MS };
