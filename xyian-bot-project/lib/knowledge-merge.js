'use strict';

// ── Knowledge fragment merge ────────────────────────────────────────────────
// Pure merge logic for folding a reviewed knowledge fragment into the live
// knowledge base. Extracted so the rules can be tested without touching a file.
//
// The live knowledge.json was wiped once by an infrastructure incident and
// painstakingly restored, so the default posture here is paranoid: ADDITIVE
// ONLY. An existing value is never changed unless the caller names that exact
// key path in `allowRepair`, which forces a human to have looked at it.

/** Normalised form used to decide whether a fact is already known. */
function normFactText(t) {
    return String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Every piece of prose already in the knowledge base, normalised.
 *
 * Deliberately an EXACT normalised match, not a prefix match. The scripts this
 * replaces keyed on the first 60 characters, and a curated batch routinely
 * shares a long opening clause — "The hotfix announced on 2026-08-23 adds …"
 * is 39 of those 60 characters, leaving 21 to tell four facts apart. A
 * collision there drops a fact silently and reports a smaller count with no
 * warning. Fragments are authored, not scraped, so exact matching is the right
 * trade: it cannot produce a false duplicate, and a genuine re-run is still a
 * clean no-op.
 */
function collectFactTexts(kb) {
    const out = new Set();
    const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === 'object') {
            if (typeof o.text === 'string') out.add(normFactText(o.text));
            return Object.values(o).forEach(walk);
        }
        if (typeof o === 'string') out.add(normFactText(o));
    };
    walk(kb);
    return out;
}

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
 * @returns {{merged:object, added:string[], repaired:string[], conflicts:string[], addedFacts:string[], skippedMeta:boolean}}
 */
function mergeFragment(live, fragment, opts) {
    const allowRepair = new Set((opts && opts.allowRepair) || []);
    const merged = clone(live || {});
    const added = [];
    const repaired = [];
    const conflicts = [];
    const addedFacts = [];
    const unmatchedRepairs = [];
    const renamed = [];
    const unmatchedRenames = [];

    // custom_facts is an ARRAY, so the object walk below would see two arrays,
    // find them unequal and report a conflict — it could never append. That gap
    // is why a curated drop needed a hand-written one-shot script beside this
    // one, with its own dedup rule and no backup. Appending here means one path
    // for every knowledge drop, and the caller's backup covers all of it.
    const incomingFacts = fragment && Array.isArray(fragment.custom_facts) ? fragment.custom_facts : null;
    if (incomingFacts) {
        const known = collectFactTexts(merged);
        if (!Array.isArray(merged.custom_facts)) merged.custom_facts = [];
        for (const entry of incomingFacts) {
            const text = entry && typeof entry.text === 'string' ? entry.text : null;
            if (!text) continue;                       // a fact with no text is not a fact
            const key = normFactText(text);
            if (!key || known.has(key)) continue;      // already known; a re-run is a no-op
            merged.custom_facts.push(clone(entry));
            known.add(key);
            addedFacts.push(text);
        }
    }

    // ── KEY RENAMES ────────────────────────────────────────────────────────
    // Object KEYS are rendered into the prompt verbatim ("starlight_celebration:
    // {...}"), so a key is a retrieval label, not just an internal handle. When
    // an official source renames a feature, repairing only the string values
    // leaves the old name sitting in the prompt as the topic heading.
    //
    // A rename cannot be expressed as an add: adding the new key would leave the
    // old one beside it, and the same content under two names is worse than the
    // stale name alone — that IS the contradiction we are removing.
    //
    // Gated on --repair <from-path>, same as any other overwrite.
    const renames = fragment && Array.isArray(fragment._renames) ? fragment._renames : null;
    if (renames) {
        for (const r of renames) {
            const from = r && typeof r.from === 'string' ? r.from : null;
            const to = r && typeof r.to === 'string' ? r.to : null;
            if (!from || !to) continue;
            const fromParts = from.split('.');
            const toParts = to.split('.');
            const fromKey = fromParts[fromParts.length - 1];
            const toKey = toParts[toParts.length - 1];
            const parentPath = fromParts.slice(0, -1);
            if (toParts.slice(0, -1).join('.') !== parentPath.join('.')) {
                unmatchedRenames.push(`${from} -> ${to} (must stay in the same parent)`);
                continue;
            }
            let parent = merged;
            for (const seg of parentPath) {
                if (!isPlainObject(parent[seg])) { parent = null; break; }
                parent = parent[seg];
            }
            if (!parent) { unmatchedRenames.push(from); continue; }
            if (!(fromKey in parent)) {
                // Already renamed by an earlier run → clean no-op on replay.
                if (!(toKey in parent)) unmatchedRenames.push(from);
                continue;
            }
            if (toKey in parent) { conflicts.push(to); continue; }   // never clobber a destination
            if (!allowRepair.has(from)) { conflicts.push(from); continue; }
            // Rebuild the parent so the renamed key keeps its original position
            // rather than jumping to the end — key order is prompt order.
            const rebuilt = {};
            for (const k of Object.keys(parent)) {
                if (k === fromKey) rebuilt[toKey] = parent[k];
                else rebuilt[k] = parent[k];
            }
            for (const k of Object.keys(parent)) delete parent[k];
            Object.assign(parent, rebuilt);
            renamed.push(`${from} -> ${to}`);
        }
    }

    // ── custom_facts REPAIRS ────────────────────────────────────────────────
    // custom_facts is append-only above, which left no way to correct a fact
    // once filed. That gap bites hardest exactly when it matters: when an
    // official source renames something a provisional source got wrong. The
    // stale fact keeps sitting in ADDITIONAL FACTS contradicting the corrected
    // category, and gpt-4o-mini does not reconcile two facts that disagree — it
    // picks one. So a wrong name left here is a coin-flip on the answer.
    //
    // Matched by VERBATIM TEXT, never by array index: indices shift every time
    // a fact is appended, so an index-keyed repair silently rewrites the wrong
    // entry the moment anything lands before it.
    //
    // Still gated on --repair custom_facts, so a human had to look.
    const repairs = fragment && Array.isArray(fragment.custom_facts_repairs) ? fragment.custom_facts_repairs : null;
    if (repairs) {
        const allowed = allowRepair.has('custom_facts');
        if (!Array.isArray(merged.custom_facts)) merged.custom_facts = [];
        for (const r of repairs) {
            const from = r && typeof r.match_text === 'string' ? r.match_text : null;
            const to = r && typeof r.text === 'string' ? r.text : null;
            if (!from || !to) continue;
            const fromKey = normFactText(from);
            const toKey = normFactText(to);
            const idx = merged.custom_facts.findIndex((f) => f && normFactText(f.text) === fromKey);
            if (idx === -1) {
                // Already repaired by an earlier run → a clean no-op, which is
                // what "a fragment must replay as a no-op" requires. Only report
                // when the replacement is absent too, i.e. the repair is stale
                // and matched nothing at all.
                const satisfied = merged.custom_facts.some((f) => f && normFactText(f.text) === toKey);
                if (!satisfied) unmatchedRepairs.push(from);
                continue;
            }
            if (!allowed) { conflicts.push(`custom_facts[${idx}]`); continue; }
            const entry = clone(merged.custom_facts[idx]);
            entry.text = to;
            if (r.reason) entry.repair_reason = r.reason;
            if (r.repaired_at) entry.repaired_at = r.repaired_at;
            merged.custom_facts[idx] = entry;
            repaired.push(`custom_facts[${idx}]`);
        }
    }

    function walk(target, source, prefix) {
        for (const key of Object.keys(source)) {
            // _meta is provenance for humans, never knowledge for the bot.
            if (key === '_meta' || key === '_renames') continue;
            // handled above — never let the array reach the leaf comparison
            if (!prefix && (key === 'custom_facts' || key === 'custom_facts_repairs')) continue;
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
    return { merged, added, repaired, conflicts, addedFacts, unmatchedRepairs, renamed, unmatchedRenames, skippedMeta: Boolean(fragment && fragment._meta) };
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

/**
 * Build what seeds/knowledge.json must contain: the merged knowledge PLUS the
 * two repair manifests the boot merge honours.
 *
 * WHY: mergeSeedTopics() in lib/contributions.js is additive — live wins on any
 * key that already exists — unless the path is named in `seed._repairs`. This
 * script wrote repaired values into seeds/ for weeks without ever naming them
 * there, so every --repair reached the repo and stopped. Production kept the
 * old value, and the live bot kept giving the answer the repair had fixed.
 *
 * Manifests accumulate across runs (a repair recorded once must survive every
 * later seed rewrite) and are deduplicated. custom_facts repairs are matched by
 * text at boot, so the recorded shape is {match_text, text, reason?, repaired_at?}.
 */
function withSeedManifests(existingSeed, merged, repairedPaths, customRepairs) {
    const prev = existingSeed && typeof existingSeed === 'object' ? existingSeed : {};
    const repairs = new Set(Array.isArray(prev._repairs) ? prev._repairs : []);
    for (const p of repairedPaths || []) if (p && !p.startsWith('custom_facts[')) repairs.add(p);

    const cf = Array.isArray(prev._custom_facts_repairs) ? prev._custom_facts_repairs.slice() : [];
    const seen = new Set(cf.map((r) => normFactText(r && r.match_text)));
    for (const r of customRepairs || []) {
        if (!r || typeof r.match_text !== 'string' || typeof r.text !== 'string') continue;
        const key = normFactText(r.match_text);
        if (!key || seen.has(key)) continue;
        cf.push({
            match_text: r.match_text,
            text: r.text,
            ...(r.reason ? { reason: r.reason } : {}),
            ...(r.repaired_at ? { repaired_at: r.repaired_at } : {}),
        });
        seen.add(key);
    }

    const out = clone(merged);
    delete out._repairs;
    delete out._custom_facts_repairs;
    if (repairs.size) out._repairs = [...repairs];
    if (cf.length) out._custom_facts_repairs = cf;
    return out;
}

/** The seed file with its manifests stripped — what must equal data/knowledge.json. */
function withoutSeedManifests(seed) {
    const out = clone(seed || {});
    delete out._repairs;
    delete out._custom_facts_repairs;
    return out;
}

module.exports = { mergeFragment, oversizedValues, truncatedValues, normFactText, collectFactTexts, withSeedManifests, withoutSeedManifests };
