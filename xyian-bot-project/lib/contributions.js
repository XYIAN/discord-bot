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

module.exports = {
    approvedCountFor,
    contributorTotals,
    earnedTier,
    earnedTierNames,
    reconcilePlan,
    backfillApprovers,
    mergeLedgers,
};
