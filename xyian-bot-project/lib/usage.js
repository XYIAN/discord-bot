'use strict';

// ── LLM usage accounting ─────────────────────────────────────────────────────
// Every OpenAI response carries a `usage` block saying exactly how many tokens
// the call consumed. The bot was throwing it away, so nobody could answer "what
// does this cost?" or "did that change help?" — which matters now that a
// knowledge import tripled the system prompt from ~12k to ~38k tokens.
//
// Pure and dependency-free so it can be tested without a network call. The
// caller supplies the day key, because a module that reads the clock cannot be
// tested deterministically.

/**
 * Published per-token prices, USD per 1M tokens. This is a local copy of an
 * external price list, so treat every figure it produces as an ESTIMATE and
 * label it as one — OpenAI can change pricing without this file knowing.
 * An unknown model yields null rather than a confidently wrong number.
 */
const PRICING_PER_MILLION = {
    'gpt-4o-mini': { input: 0.15, cachedInput: 0.075, output: 0.60 },
    'gpt-4o': { input: 2.50, cachedInput: 1.25, output: 10.00 },
};

/** How many days of history to keep. Enough to see a trend, small enough to stay tiny. */
const RETAIN_DAYS = 60;

function emptyState() {
    return { days: {} };
}

/**
 * Fold one API call's usage into the rolling state.
 *
 * Tolerates a missing or malformed `usage` block by recording the call with
 * zero tokens rather than throwing: losing the accounting for one call must
 * never break answering the question the user actually asked.
 *
 * `cachedTokens` comes from `usage.prompt_tokens_details.cached_tokens` and is
 * billed at half rate. It matters more than it looks: OpenAI caches on a stable
 * prompt PREFIX, so the current fixed knowledge dump is the most cache-friendly
 * shape possible. Any future change that reorders the prompt per question
 * forfeits that discount — and without this field there is no way to tell what
 * was given up.
 *
 * `promptChars` is what the bot BUILT, as opposed to what the tokenizer made of
 * it. Recording both means a prompt-size change shows up in the ledger directly
 * instead of being inferred.
 *
 * @param {object} state    previous state (not mutated)
 * @param {object} call     { dayKey, model, promptChars, usage }
 * @returns {object} new state
 */
function recordUsage(state, call) {
    const prev = state && typeof state === 'object' && state.days ? state : emptyState();
    const dayKey = String((call && call.dayKey) || '').trim();
    if (!dayKey) return prev; // no day, no bucket — drop rather than invent one

    const model = String((call && call.model) || 'unknown');
    const usage = (call && call.usage) || {};
    const promptTokens = Number(usage.prompt_tokens) || 0;
    const completionTokens = Number(usage.completion_tokens) || 0;
    const cachedTokens = Number((usage.prompt_tokens_details || {}).cached_tokens) || 0;
    const promptChars = Number(call && call.promptChars) || 0;

    const days = { ...prev.days };
    const day = days[dayKey]
        ? { ...days[dayKey], byModel: { ...days[dayKey].byModel } }
        : { calls: 0, promptTokens: 0, completionTokens: 0, cachedTokens: 0, promptChars: 0, byModel: {} };

    day.calls += 1;
    day.promptTokens += promptTokens;
    day.completionTokens += completionTokens;
    day.cachedTokens = (day.cachedTokens || 0) + cachedTokens;
    day.promptChars = (day.promptChars || 0) + promptChars;

    const m = day.byModel[model] || { calls: 0, promptTokens: 0, completionTokens: 0, cachedTokens: 0 };
    day.byModel[model] = {
        calls: m.calls + 1,
        promptTokens: m.promptTokens + promptTokens,
        completionTokens: m.completionTokens + completionTokens,
        cachedTokens: (m.cachedTokens || 0) + cachedTokens,
    };

    days[dayKey] = day;

    // Keep the file bounded. Day keys are ISO dates, so lexicographic sort is
    // chronological.
    const keys = Object.keys(days).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - RETAIN_DAYS))) delete days[k];

    return { days };
}

/**
 * Estimated USD for a token count.
 *
 * Cached prompt tokens bill at half rate, so they are subtracted from the
 * full-rate portion rather than double-counted. A cachedTokens larger than
 * promptTokens would be nonsense from the API; clamp instead of going negative.
 *
 * @returns {number|null} null when the model's price is unknown
 */
function estimateCost(model, promptTokens, completionTokens, cachedTokens) {
    const price = PRICING_PER_MILLION[model];
    if (!price) return null;
    const prompt = Number(promptTokens) || 0;
    const cached = Math.min(Math.max(Number(cachedTokens) || 0, 0), prompt);
    const full = prompt - cached;
    const cachedRate = price.cachedInput === undefined ? price.input : price.cachedInput;
    return (
        full * price.input / 1e6
        + cached * cachedRate / 1e6
        + (Number(completionTokens) || 0) * price.output / 1e6
    );
}

/**
 * Summarise the most recent `days` of usage.
 *
 * `costUsd` is null when ANY model in the window has unknown pricing — a
 * partial total presented as a total is worse than admitting the gap.
 *
 * @returns {{calls, promptTokens, completionTokens, avgPromptTokens, costUsd, costKnown, dayCount, perDay}}
 */
function summarise(state, options) {
    const opts = options || {};
    const window = Number(opts.days) > 0 ? Number(opts.days) : 7;
    const days = (state && state.days) || {};
    const keys = Object.keys(days).sort().slice(-window);

    let calls = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let cachedTokens = 0;
    let promptChars = 0;
    let costUsd = 0;
    let costKnown = true;

    for (const k of keys) {
        const d = days[k] || {};
        calls += d.calls || 0;
        promptTokens += d.promptTokens || 0;
        completionTokens += d.completionTokens || 0;
        cachedTokens += d.cachedTokens || 0;
        promptChars += d.promptChars || 0;
        for (const [model, m] of Object.entries(d.byModel || {})) {
            const c = estimateCost(model, m.promptTokens, m.completionTokens, m.cachedTokens);
            if (c === null) costKnown = false;
            else costUsd += c;
        }
    }

    return {
        calls,
        promptTokens,
        completionTokens,
        cachedTokens,
        promptChars,
        avgPromptTokens: calls ? Math.round(promptTokens / calls) : 0,
        avgPromptChars: calls ? Math.round(promptChars / calls) : 0,
        // What fraction of prompt tokens billed at the cheaper cached rate.
        // This is the number that says what prompt-prefix caching is worth here,
        // and therefore what any per-question reordering would give up.
        cachedPct: promptTokens ? Math.round(1000 * cachedTokens / promptTokens) / 10 : 0,
        costUsd: costKnown ? costUsd : null,
        costKnown,
        dayCount: keys.length,
        perDay: keys.map((k) => ({ day: k, ...days[k] })),
    };
}

/** Human-readable one-liner for the deploy notice / !usage. */
function formatSummary(summary) {
    if (!summary || !summary.calls) return 'No AI calls recorded yet.';
    const cost = summary.costKnown
        ? `~$${summary.costUsd.toFixed(2)} (estimate)`
        : 'cost unknown (unpriced model in window)';
    return (
        `${summary.calls} AI call${summary.calls === 1 ? '' : 's'} over ${summary.dayCount} day`
        + `${summary.dayCount === 1 ? '' : 's'} — ${summary.promptTokens.toLocaleString()} prompt + `
        + `${summary.completionTokens.toLocaleString()} completion tokens, `
        + `avg ${summary.avgPromptTokens.toLocaleString()} prompt tokens/call, `
        + `${summary.cachedPct}% of prompt tokens cached, ${cost}`
    );
}

module.exports = {
    PRICING_PER_MILLION,
    RETAIN_DAYS,
    emptyState,
    recordUsage,
    estimateCost,
    summarise,
    formatSummary,
};
