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

module.exports = {
    approvedCountFor,
    contributorTotals,
    earnedTier,
    earnedTierNames,
    reconcilePlan,
    backfillApprovers,
};
