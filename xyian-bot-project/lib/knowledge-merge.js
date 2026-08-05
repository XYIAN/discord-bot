'use strict';

// ── Knowledge fragment merge ────────────────────────────────────────────────
// Pure merge logic for folding a reviewed knowledge fragment into the live
// knowledge base. Extracted so the rules can be tested without touching a file.
//
// The live knowledge.json was wiped once by an infrastructure incident and
// painstakingly restored, so the default posture here is paranoid: ADDITIVE
// ONLY. An existing value is never changed unless the caller names that exact
// key path in `allowRepair`, which forces a human to have looked at it.

/** Deep-ish clone adequate for JSON knowledge data. */
function clone(o) {
    return JSON.parse(JSON.stringify(o));
}

function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Merge `fragment` into `live`.
 *
 * @param {object} live      the current knowledge base (not mutated)
 * @param {object} fragment  a fragment file's parsed contents; `_meta` is ignored
 * @param {{allowRepair?: string[]}} [opts]
 *        allowRepair: exact dotted key paths permitted to OVERWRITE an existing
 *        value. Anything not listed is reported as a conflict and left alone.
 * @returns {{merged:object, added:string[], repaired:string[], conflicts:string[], skippedMeta:boolean}}
 */
function mergeFragment(live, fragment, opts) {
    const allowRepair = new Set((opts && opts.allowRepair) || []);
    const merged = clone(live || {});
    const added = [];
    const repaired = [];
    const conflicts = [];

    function walk(target, source, prefix) {
        for (const key of Object.keys(source)) {
            // _meta is provenance for humans, never knowledge for the bot.
            if (key === '_meta') continue;
            const path = prefix ? `${prefix}.${key}` : key;
            const incoming = source[key];
            const current = target[key];

            if (current === undefined) {
                target[key] = clone(incoming);
                added.push(path);
                continue;
            }
            // Both sides are objects: recurse so a new sub-key can be added
            // without disturbing its siblings.
            if (isPlainObject(current) && isPlainObject(incoming)) {
                walk(current, incoming, path);
                continue;
            }
            // Leaf collision.
            if (JSON.stringify(current) === JSON.stringify(incoming)) continue; // identical, nothing to do
            if (allowRepair.has(path)) {
                target[key] = clone(incoming);
                repaired.push(path);
            } else {
                conflicts.push(path);
            }
        }
    }

    walk(merged, fragment || {}, '');
    return { merged, added, repaired, conflicts, skippedMeta: Boolean(fragment && fragment._meta) };
}

/**
 * Values get inlined into an LLM prompt, so an enormous string is a real cost.
 * Returns the paths of string values longer than `limit`.
 */
function oversizedValues(obj, limit, prefix) {
    const out = [];
    const max = limit || 400;
    for (const key of Object.keys(obj || {})) {
        if (key === '_meta') continue;
        const path = prefix ? `${prefix}.${key}` : key;
        const v = obj[key];
        if (typeof v === 'string') {
            if (v.length > max) out.push(`${path} (${v.length} chars)`);
        } else if (isPlainObject(v)) {
            out.push(...oversizedValues(v, max, path));
        }
    }
    return out;
}

/**
 * Values that look cut off mid-sentence — the damage found in live runes.*
 * entries, all of which landed at ~192 characters.
 *
 * Deliberately conservative: a value ending in a list item or a closing
 * bracket is NOT flagged, because lists legitimately end without punctuation.
 * Only a trailing partial word or a bare tier label counts.
 */
function truncatedValues(obj, prefix) {
    const out = [];
    for (const key of Object.keys(obj || {})) {
        if (key === '_meta') continue;
        const path = prefix ? `${prefix}.${key}` : key;
        const v = obj[key];
        if (typeof v === 'string') {
            const s = v.trimEnd();
            if (!s) continue;
            const lines = s.split('\n');
            const lastLine = lines[lines.length - 1].trim();
            // "Mythic" with nothing after it, at the end of a multi-line ladder —
            // a tier label whose value was cut off.
            //
            // Only counts in a MULTI-LINE value. A single-word `rarity: "Rare"`
            // is a legitimate field, not damage, and flagging it buries the real
            // findings in noise.
            const bareTier = lines.length > 1 && /^(Common|Fine|Rare|Epic|Legendary|Mythic)$/i.test(lastLine);
            // Ends on a connective, i.e. clearly mid-clause.
            const midClause = /\b(to|the|a|an|of|and|or|with|by|from|into|for|is|are|has|have)$/i.test(s);
            if (bareTier || midClause) out.push(path);
        } else if (isPlainObject(v)) {
            out.push(...truncatedValues(v, path));
        }
    }
    return out;
}

module.exports = { mergeFragment, oversizedValues, truncatedValues };
