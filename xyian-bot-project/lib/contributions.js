'use strict';

// ── Contribution / tier logic ────────────────────────────────────────────────
// Pure, dependency-free helpers for computing contributor standing from the
// suggestions ledger. Extracted so the rules that decide a member's rank are
// unit-testable without Discord.
//
// Background: every approval in the ledger was historically written by scripts
// (fact_sync / arch_ai_audit) that bypassed the tier-upgrade path, and
// permissions are gated on the Discord ROLE rather than the ledger count. So
// earned roles were silently never granted. reconcilePlan() closes that gap by
// recomputing the truth from the ledger so it can be re-applied at any time.

/** Count a user's approved contributions from the ledger. */
function approvedCountFor(suggestions, userId) {
    if (!Array.isArray(suggestions) || !userId) return 0;
    return suggestions.filter((s) => s && s.status === 'approved' && s.userId === userId).length;
}

/** Every distinct contributor with their approved count: [{userId, by, count}] */
function contributorTotals(suggestions) {
    const map = new Map();
    for (const s of suggestions || []) {
        if (!s || s.status !== 'approved' || !s.userId) continue;
        const cur = map.get(s.userId) || { userId: s.userId, by: s.by || 'unknown', count: 0 };
        cur.count++;
        if (s.by) cur.by = s.by;
        map.set(s.userId, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Highest tier earned for a count. `tiers` is CONFIG.roleTiers
 * ([{name, threshold, ...}] ascending). Returns null below the lowest.
 */
function earnedTier(tiers, count) {
    let best = null;
    for (const t of tiers || []) {
        if (count >= t.threshold) best = t;
    }
    return best;
}

/** All tier roles earned at `count` (a member should hold every one at/below). */
function earnedTierNames(tiers, count) {
    return (tiers || []).filter((t) => count >= t.threshold).map((t) => t.name);
}

/**
 * Diff ledger truth against currently-held roles.
 * @param {Array} suggestions ledger
 * @param {Array} tiers CONFIG.roleTiers
 * @param {(userId:string)=>string[]|null} getHeldRoleNames — null = member not resolvable
 * @returns {{userId,by,count,missing:string[]}[]} only members missing something
 */
function reconcilePlan(suggestions, tiers, getHeldRoleNames) {
    const plan = [];
    for (const c of contributorTotals(suggestions)) {
        const held = getHeldRoleNames(c.userId);
        if (!held) continue; // left the guild / unresolvable — skip, never fail
        const shouldHave = earnedTierNames(tiers, c.count);
        const missing = shouldHave.filter((n) => !held.includes(n));
        if (missing.length) plan.push({ ...c, missing });
    }
    return plan;
}

/**
 * Backfill approver attribution on records that predate it. Historical
 * script-written approvals are attributed to their script; anything else
 * falls back to the provided owner. Returns {records, changed}.
 */
function backfillApprovers(suggestions, { ownerId, ownerName }) {
    let changed = 0;
    const records = (suggestions || []).map((s) => {
        if (!s || s.status !== 'approved' || s.approvedBy) return s;
        const via = s.approvedVia;
        const isScript = via === 'fact_sync' || via === 'arch_ai_audit';
        changed++;
        return {
            ...s,
            approvedBy: ownerId,
            approvedByName: isScript ? `${ownerName} (via ${via})` : ownerName,
        };
    });
    return { records, changed };
}

function normalizeText(t) {
    return String(t || '').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 60);
}

/**
 * Non-destructively merge an archived ledger into the live one.
 *
 * A Railway volume mounts empty and shadows files baked into the image, so the
 * committed contribution ledger silently vanished in production — wiping every
 * member's earned standing. This restores archived records that the live ledger
 * is missing while NEVER overwriting or reordering live data (live always
 * wins), so it's safe to run on every boot.
 *
 * @returns {{records:Array, restored:number}}
 */
function mergeLedgers(live, archived) {
    const liveArr = Array.isArray(live) ? live : [];
    const archArr = Array.isArray(archived) ? archived : [];
    const seenIds = new Set(liveArr.map((s) => s && s.id).filter((v) => v !== undefined));
    const seenText = new Set(liveArr.map((s) => normalizeText(s && s.text)).filter(Boolean));

    const additions = [];
    for (const rec of archArr) {
        if (!rec) continue;
        const t = normalizeText(rec.text);
        if (rec.id !== undefined && seenIds.has(rec.id)) continue;
        if (t && seenText.has(t)) continue;
        additions.push({ ...rec, restoredFromArchive: true });
        if (rec.id !== undefined) seenIds.add(rec.id);
        if (t) seenText.add(t);
    }
    return { records: liveArr.concat(additions), restored: additions.length };
}

/**
 * Merge archived custom_facts into a live knowledge base. Same contract as
 * mergeLedgers: additive only, live wins, dedup by normalized text. This is how
 * curated fact drops (e.g. patch notes) reach production — the volume already
 * has a knowledge.json so first-mount seeding won't fire for it.
 * @returns {{knowledge:object, added:number}}
 */
function mergeCustomFacts(liveKb, seedKb) {
    const live = liveKb && typeof liveKb === 'object' ? liveKb : {};
    const seed = seedKb && typeof seedKb === 'object' ? seedKb : {};
    const seen = new Set();
    const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
            if (typeof o.text === 'string') seen.add(normalizeText(o.text));
            Object.values(o).forEach(walk);
        } else if (typeof o === 'string') seen.add(normalizeText(o));
    };
    walk(live);

    const additions = [];
    for (const rec of Array.isArray(seed.custom_facts) ? seed.custom_facts : []) {
        if (!rec || typeof rec.text !== 'string') continue;
        const t = normalizeText(rec.text);
        if (!t || seen.has(t)) continue;
        additions.push(rec);
        seen.add(t);
    }
    if (additions.length === 0) return { knowledge: live, added: 0 };
    const next = { ...live, custom_facts: [...(Array.isArray(live.custom_facts) ? live.custom_facts : []), ...additions] };
    return { knowledge: next, added: additions.length };
}


/**
 * Apply seed-carried custom_facts REPAIRS to the live ledger.
 *
 * mergeCustomFacts() is additive and dedups by text, so when a curated fact is
 * CORRECTED in the repo (scripts/merge-knowledge.js --repair custom_facts), the
 * next boot ADDED the corrected text as a brand-new fact and left the stale one
 * standing beside it — a contradiction the small model resolves by coin-flip.
 *
 * Matched by normalised text, never by index. If the corrected text is already
 * live (an earlier boot added it), the stale entry is REMOVED rather than
 * rewritten, so no duplicate survives. A repair whose match_text is absent is
 * a no-op, which is what makes every boot idempotent.
 *
 * @returns {{knowledge: object, repaired: number, removed: number}}
 */
function applyCustomFactRepairs(liveKb, seedKb) {
    const live = liveKb && typeof liveKb === 'object' ? liveKb : {};
    const seed = seedKb && typeof seedKb === 'object' ? seedKb : {};
    const repairs = Array.isArray(seed._custom_facts_repairs) ? seed._custom_facts_repairs : [];
    if (repairs.length === 0 || !Array.isArray(live.custom_facts)) return { knowledge: live, repaired: 0, removed: 0 };
    const facts = live.custom_facts.slice();
    let repaired = 0;
    let removed = 0;
    for (const r of repairs) {
        const from = normalizeText(r && r.match_text);
        const to = normalizeText(r && r.text);
        if (!from || !to) continue;
        const idx = facts.findIndex((f) => f && normalizeText(f.text) === from);
        if (idx === -1) continue;
        const alreadyLive = facts.some((f, i) => i !== idx && f && normalizeText(f.text) === to);
        if (alreadyLive) {
            facts.splice(idx, 1);
            removed++;
        } else {
            facts[idx] = {
                ...facts[idx],
                text: r.text,
                ...(r.reason ? { repair_reason: r.reason } : {}),
                ...(r.repaired_at ? { repaired_at: r.repaired_at } : {}),
            };
            repaired++;
        }
    }
    if (repaired === 0 && removed === 0) return { knowledge: live, repaired: 0, removed: 0 };
    return { knowledge: { ...live, custom_facts: facts }, repaired, removed };
}

/**
 * Merge curated TOPICS from the seed snapshot into the live knowledge base.
 *
 * seedDataFiles() only hydrates a MISSING file, and mergeCustomFacts() only
 * appends custom_facts records — so a curated topic added to seeds/ after the
 * volume already existed could never reach production. That gap silently
 * stranded an entire knowledge import.
 *
 * ADDITIVE ONLY. Live always wins on any key that already exists, because live
 * carries community contributions that seeds/ does not know about. Repairs to
 * existing values are deliberately NOT handled here — those go through
 * scripts/merge-knowledge.js with an explicit --repair flag, so a human has
 * looked at them before they ship.
 *
 * @returns {{knowledge: object, addedPaths: string[]}}
 */
function mergeSeedTopics(liveKb, seedKb) {
    const live = liveKb && typeof liveKb === 'object' ? liveKb : {};
    const seed = seedKb && typeof seedKb === 'object' ? seedKb : {};
    // Explicit repair allowlist. A seed file may carry `_repairs: ["a.b", ...]`
    // naming paths that ARE permitted to overwrite live. This exists because
    // additive-only merging cannot fix DAMAGED live values — and production has
    // entries truncated mid-sentence since v3.9.9. Listing each path in the seed
    // file keeps the decision reviewable in a diff, and the merge is a no-op
    // once live already matches.
    const repairs = new Set(Array.isArray(seed._repairs) ? seed._repairs : []);
    // custom_facts and opinions are community-owned and handled elsewhere;
    // never let a stale seed snapshot resurrect or reorder them here.
    const SKIP = new Set(['custom_facts', 'opinions', '_meta', '_custom_facts_repairs']);
    const addedPaths = [];
    const next = { ...live };

    const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

    const walk = (target, source, prefix) => {
        for (const key of Object.keys(source)) {
            if (!prefix && (SKIP.has(key) || key === '_repairs')) continue;
            if (key === '_meta') continue;
            const path = prefix ? `${prefix}.${key}` : key;
            if (target[key] === undefined) {
                target[key] = JSON.parse(JSON.stringify(source[key]));
                addedPaths.push(path);
            } else if (isObj(target[key]) && isObj(source[key])) {
                // Copy-on-write so we never mutate the caller's live object.
                target[key] = { ...target[key] };
                walk(target[key], source[key], path);
            } else if (repairs.has(path) && JSON.stringify(target[key]) !== JSON.stringify(source[key])) {
                target[key] = JSON.parse(JSON.stringify(source[key]));
                addedPaths.push(`${path} (repair)`);
            }
            // Otherwise the existing leaf stands: live wins. That is the point.
        }
    };
    walk(next, seed, '');
    return { knowledge: addedPaths.length ? next : live, addedPaths };
}

module.exports = {
    applyCustomFactRepairs,
    mergeSeedTopics,
    approvedCountFor,
    contributorTotals,
    earnedTier,
    earnedTierNames,
    reconcilePlan,
    backfillApprovers,
    mergeLedgers,
    mergeCustomFacts,
};
