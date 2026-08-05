'use strict';

// Tests for LLM usage accounting. Run:
//   node xyian-bot-project/test/usage.test.js
//
// Written because the bot discarded the `usage` block on every OpenAI response,
// so there was no way to answer "what does this cost?" — right after a knowledge
// import tripled the system prompt. The point of this module is to make the
// effect of a prompt-size change measurable rather than argued about.
const assert = require('assert');
const {
    emptyState, recordUsage, estimateCost, summarise, formatSummary, RETAIN_DAYS,
} = require('../lib/usage');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

const call = (dayKey, prompt, completion, model) => ({
    dayKey, model: model || 'gpt-4o-mini',
    usage: { prompt_tokens: prompt, completion_tokens: completion },
});

console.log('recordUsage');
test('records the first call', () => {
    const s = recordUsage(emptyState(), call('2026-08-04', 38000, 400));
    assert.strictEqual(s.days['2026-08-04'].calls, 1);
    assert.strictEqual(s.days['2026-08-04'].promptTokens, 38000);
    assert.strictEqual(s.days['2026-08-04'].completionTokens, 400);
});
test('accumulates across calls on the same day', () => {
    let s = recordUsage(emptyState(), call('2026-08-04', 38000, 400));
    s = recordUsage(s, call('2026-08-04', 38000, 300));
    assert.strictEqual(s.days['2026-08-04'].calls, 2);
    assert.strictEqual(s.days['2026-08-04'].promptTokens, 76000);
});
test('keeps days separate', () => {
    let s = recordUsage(emptyState(), call('2026-08-04', 100, 10));
    s = recordUsage(s, call('2026-08-05', 200, 20));
    assert.strictEqual(s.days['2026-08-04'].promptTokens, 100);
    assert.strictEqual(s.days['2026-08-05'].promptTokens, 200);
});
test('tracks per-model so a model switch is visible', () => {
    // The whole point of switching models is to see the effect; a single total
    // would hide it.
    let s = recordUsage(emptyState(), call('2026-08-04', 100, 10, 'gpt-4o-mini'));
    s = recordUsage(s, call('2026-08-04', 100, 10, 'gpt-4o'));
    assert.strictEqual(s.days['2026-08-04'].byModel['gpt-4o-mini'].calls, 1);
    assert.strictEqual(s.days['2026-08-04'].byModel['gpt-4o'].calls, 1);
});
test('never mutates the state it was given', () => {
    const before = recordUsage(emptyState(), call('2026-08-04', 100, 10));
    const snapshot = JSON.stringify(before);
    recordUsage(before, call('2026-08-04', 999, 99));
    assert.strictEqual(JSON.stringify(before), snapshot, 'input state was mutated');
});

console.log('recordUsage — malformed input must not break answering');
test('a missing usage block records the call with zero tokens', () => {
    // Losing accounting for one call is acceptable; throwing inside the answer
    // path is not.
    const s = recordUsage(emptyState(), { dayKey: '2026-08-04', model: 'gpt-4o-mini' });
    assert.strictEqual(s.days['2026-08-04'].calls, 1);
    assert.strictEqual(s.days['2026-08-04'].promptTokens, 0);
});
test('non-numeric token counts become zero rather than NaN', () => {
    const s = recordUsage(emptyState(), {
        dayKey: '2026-08-04', model: 'gpt-4o-mini',
        usage: { prompt_tokens: 'lots', completion_tokens: null },
    });
    assert.strictEqual(s.days['2026-08-04'].promptTokens, 0);
    assert.ok(!Number.isNaN(s.days['2026-08-04'].promptTokens));
});
test('a missing day key drops the record instead of inventing a bucket', () => {
    const s = recordUsage(emptyState(), { model: 'gpt-4o-mini', usage: { prompt_tokens: 5 } });
    assert.deepStrictEqual(s.days, {});
});
test('tolerates junk state', () => {
    assert.ok(recordUsage(null, call('2026-08-04', 1, 1)).days['2026-08-04']);
    assert.ok(recordUsage({}, call('2026-08-04', 1, 1)).days['2026-08-04']);
});

console.log('retention');
test(`keeps at most ${RETAIN_DAYS} days so the file stays small`, () => {
    let s = emptyState();
    for (let i = 1; i <= RETAIN_DAYS + 20; i++) {
        s = recordUsage(s, call(`2026-01-${String(i).padStart(3, '0')}`, 10, 1));
    }
    assert.strictEqual(Object.keys(s.days).length, RETAIN_DAYS);
});
test('retention drops the OLDEST days, not arbitrary ones', () => {
    let s = emptyState();
    for (let i = 1; i <= RETAIN_DAYS + 2; i++) {
        s = recordUsage(s, call(`2026-01-${String(i).padStart(3, '0')}`, 10, 1));
    }
    const keys = Object.keys(s.days).sort();
    assert.strictEqual(keys[0], '2026-01-003');
    assert.strictEqual(keys[keys.length - 1], `2026-01-${String(RETAIN_DAYS + 2).padStart(3, '0')}`);
});

console.log('cached tokens — what prompt-prefix caching is worth');
test('records cached_tokens from prompt_tokens_details', () => {
    const s = recordUsage(emptyState(), {
        dayKey: '2026-08-04', model: 'gpt-4o-mini',
        usage: { prompt_tokens: 38273, completion_tokens: 300, prompt_tokens_details: { cached_tokens: 37000 } },
    });
    assert.strictEqual(s.days['2026-08-04'].cachedTokens, 37000);
    assert.strictEqual(s.days['2026-08-04'].byModel['gpt-4o-mini'].cachedTokens, 37000);
});
test('an absent prompt_tokens_details records zero and does not throw', () => {
    // The existing malformed-usage tolerance must survive this addition.
    const s = recordUsage(emptyState(), call('2026-08-04', 100, 10));
    assert.strictEqual(s.days['2026-08-04'].cachedTokens, 0);
});
test('records promptChars so a prompt-size change is visible, not inferred', () => {
    const s = recordUsage(emptyState(), {
        dayKey: '2026-08-04', model: 'gpt-4o-mini', promptChars: 152616,
        usage: { prompt_tokens: 38273, completion_tokens: 300 },
    });
    assert.strictEqual(s.days['2026-08-04'].promptChars, 152616);
    assert.strictEqual(summarise(s, {}).avgPromptChars, 152616);
});
test('summarise reports the cached percentage', () => {
    const s = recordUsage(emptyState(), {
        dayKey: '2026-08-04', model: 'gpt-4o-mini',
        usage: { prompt_tokens: 1000, completion_tokens: 10, prompt_tokens_details: { cached_tokens: 750 } },
    });
    assert.strictEqual(summarise(s, {}).cachedPct, 75);
});
test('formatSummary surfaces the cached share', () => {
    const s = recordUsage(emptyState(), {
        dayKey: '2026-08-04', model: 'gpt-4o-mini',
        usage: { prompt_tokens: 1000, completion_tokens: 10, prompt_tokens_details: { cached_tokens: 500 } },
    });
    assert.match(formatSummary(summarise(s, {})), /50% of prompt tokens cached/);
});

console.log('estimateCost');
test('prices gpt-4o-mini per published rates', () => {
    // 1M input @ $0.15 + 1M output @ $0.60
    assert.strictEqual(estimateCost('gpt-4o-mini', 1e6, 0), 0.15);
    assert.strictEqual(estimateCost('gpt-4o-mini', 0, 1e6), 0.60);
});
test('returns null for an unknown model rather than guessing', () => {
    assert.strictEqual(estimateCost('some-future-model', 1e6, 1e6), null);
});
test('cached prompt tokens bill at half rate, not double-counted', () => {
    // 1M prompt tokens all cached = $0.075, not $0.15 and not $0.225.
    assert.strictEqual(estimateCost('gpt-4o-mini', 1e6, 0, 1e6), 0.075);
    // Half cached = midpoint.
    assert.ok(Math.abs(estimateCost('gpt-4o-mini', 1e6, 0, 5e5) - 0.1125) < 1e-9);
});
test('nonsensical cached counts clamp instead of going negative', () => {
    // cached > prompt would be an API bug; the cost must not go below the
    // all-cached price or above the none-cached price.
    assert.strictEqual(estimateCost('gpt-4o-mini', 1e6, 0, 5e6), 0.075);
    assert.strictEqual(estimateCost('gpt-4o-mini', 1e6, 0, -100), 0.15);
});
test('one 38k-token question costs well under a cent', () => {
    // Sanity-check the scale of the problem: the prompt tripling is a real
    // multiplier but a small absolute number at guild volumes.
    const c = estimateCost('gpt-4o-mini', 38000, 400);
    assert.ok(c > 0.005 && c < 0.007, `expected ~$0.0059, got ${c}`);
});

console.log('summarise');
test('totals a window and computes the average prompt size', () => {
    let s = recordUsage(emptyState(), call('2026-08-04', 38000, 400));
    s = recordUsage(s, call('2026-08-05', 12000, 200));
    const sum = summarise(s, { days: 7 });
    assert.strictEqual(sum.calls, 2);
    assert.strictEqual(sum.promptTokens, 50000);
    assert.strictEqual(sum.avgPromptTokens, 25000);
    assert.strictEqual(sum.dayCount, 2);
});
test('costUsd is arithmetically correct, not merely non-null', () => {
    // The one figure a moderator actually reads was never checked for VALUE —
    // only for whether it was null. A refactor of the per-model fold could have
    // shipped a wrong dollar amount with every test still green.
    // 1,000,000 prompt @ $0.15/M + 1,000,000 completion @ $0.60/M = $0.75
    let s = recordUsage(emptyState(), call('2026-08-04', 1e6, 1e6));
    assert.ok(Math.abs(summarise(s, {}).costUsd - 0.75) < 1e-9, `got ${summarise(s, {}).costUsd}`);

    // Half the prompt cached: 500k @ $0.15/M + 500k @ $0.075/M = $0.1125
    s = recordUsage(emptyState(), {
        dayKey: '2026-08-04', model: 'gpt-4o-mini',
        usage: { prompt_tokens: 1e6, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 5e5 } },
    });
    assert.ok(Math.abs(summarise(s, {}).costUsd - 0.1125) < 1e-9, `got ${summarise(s, {}).costUsd}`);
});
test('costUsd sums across models and across days', () => {
    let s = recordUsage(emptyState(), call('2026-08-04', 1e6, 0, 'gpt-4o-mini')); // $0.15
    s = recordUsage(s, call('2026-08-05', 1e6, 0, 'gpt-4o'));                     // $2.50
    assert.ok(Math.abs(summarise(s, { days: 7 }).costUsd - 2.65) < 1e-9);
});
test('formatSummary renders the unpriced-model branch', () => {
    // summarise's costKnown:false was covered; the string it produces was not.
    let s = recordUsage(emptyState(), call('2026-08-04', 100, 10, 'mystery-model'));
    assert.match(formatSummary(summarise(s, {})), /cost unknown/);
});
test('the window actually excludes older days', () => {
    let s = emptyState();
    for (let i = 1; i <= 10; i++) s = recordUsage(s, call(`2026-08-${String(i).padStart(2, '0')}`, 100, 10));
    assert.strictEqual(summarise(s, { days: 3 }).calls, 3);
});
test('reports cost as UNKNOWN when any model in the window is unpriced', () => {
    // A partial total presented as a total is worse than admitting the gap.
    let s = recordUsage(emptyState(), call('2026-08-04', 100, 10, 'gpt-4o-mini'));
    s = recordUsage(s, call('2026-08-04', 100, 10, 'mystery-model'));
    const sum = summarise(s, { days: 7 });
    assert.strictEqual(sum.costKnown, false);
    assert.strictEqual(sum.costUsd, null);
});
test('handles an empty state', () => {
    const sum = summarise(emptyState(), { days: 7 });
    assert.strictEqual(sum.calls, 0);
    assert.strictEqual(sum.avgPromptTokens, 0);
});

console.log('formatSummary');
test('says so plainly when there is nothing recorded', () => {
    assert.match(formatSummary(summarise(emptyState(), {})), /No AI calls recorded/);
});
test('labels the cost as an estimate, never as fact', () => {
    // The price table is a local copy of an external list and will drift.
    const s = recordUsage(emptyState(), call('2026-08-04', 38000, 400));
    assert.match(formatSummary(summarise(s, {})), /estimate/);
});
test('surfaces the average prompt size — the number this work is about', () => {
    const s = recordUsage(emptyState(), call('2026-08-04', 38000, 400));
    assert.match(formatSummary(summarise(s, {})), /38,000 prompt tokens\/call/);
});

console.log(`\n${passed} passed`);
