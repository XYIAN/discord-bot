'use strict';

/**
 * Tiny persistent state store — one JSON file per named store, atomic writes.
 *
 * Written because the bot kept losing things that matter across deploys. Every
 * id the runtime cared about lived in a module-level variable, and Railway
 * redeploys often (32 deploys in a fortnight, only 2 gaps longer than 48h). The
 * visible symptoms:
 *
 *   - `reactionRoleMessages` rebuilt at boot from three hardcoded ids, so a
 *     member who joined before the last deploy could react 🤖 on their welcome
 *     and get NOTHING — the handler returns before it logs anything.
 *   - `lastBotMessage` forgotten, so the "only one daily reset visible"
 *     guarantee silently did not hold across a deploy.
 *   - `recruitDayCounter` reset to 0, so the recruitment ad's 48h countdown
 *     restarted every deploy and it effectively never posted on its own.
 *
 * Deliberately SYNCHRONOUS. The shutdown path (bot.js) states "data is written
 * synchronously, so there's nothing to flush" — keeping that true means no new
 * shutdown ordering to get wrong.
 *
 * Deliberately ATOMIC. The six existing load/save pairs in bot.js all write
 * straight over the target, so a SIGKILL mid-write truncates the file and the
 * next load silently swallows it into defaults — which is how a store gets
 * wiped. tmp-file + rename means a reader sees either the old file or the new
 * one, never half of one.
 */

const fs = require('fs');
const path = require('path');

/** Same directory the rest of the bot uses — a mounted Railway volume in prod. */
const DATA_DIR = path.join(__dirname, '..', 'data');

function filePathFor(name) {
    if (!/^[a-z0-9-]+$/i.test(name)) {
        throw new Error(`Invalid state store name: ${name}`);
    }
    return path.join(DATA_DIR, `${name}.json`);
}

/**
 * Read a store. Missing or unreadable → `defaults`.
 *
 * A corrupt file returning defaults is the same failure the ad-hoc loaders
 * have, but here it is at least loud: the corruption is reported rather than
 * swallowed silently, so a wipe is visible in the logs.
 */
function loadState(name, defaults) {
    let raw;
    try {
        raw = fs.readFileSync(filePathFor(name), 'utf8');
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.error(`⚠️  Could not read state "${name}": ${e.message} — using defaults`);
        }
        return defaults;
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error(`❌ State "${name}" is corrupt (${e.message}) — using defaults, NOT overwriting yet`);
        return defaults;
    }
}

/**
 * Write a store atomically. Returns true on success.
 *
 * Never throws: callers are event handlers, and a failed write must not take
 * down a welcome or a role grant.
 */
function saveState(name, value) {
    const target = filePathFor(name);
    const tmp = `${target}.tmp`;
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
        fs.renameSync(tmp, target);
        return true;
    } catch (e) {
        console.error(`❌ Could not save state "${name}": ${e.message}`);
        try { fs.unlinkSync(tmp); } catch { /* nothing to clean */ }
        return false;
    }
}

module.exports = { loadState, saveState, DATA_DIR, filePathFor };
