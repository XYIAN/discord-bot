'use strict';

// ── Knowledge → prompt text ──────────────────────────────────────────────────
// Turns the knowledge base into the block that goes under "--- VERIFIED FACTS ---"
// in the system prompt. Extracted verbatim from bot.js so that changes to what
// the model sees can be unit-tested — this text IS the bot's factual grounding,
// and a silent change to it is a silent change to every answer.
//
// The extraction is byte-identical on purpose. A golden test pins the exact
// output length and hash against the live knowledge.json, so any future edit
// has to be deliberate.
//
// One thing measurement already ruled out: reformatting the ~100 entries that
// fall through to JSON.stringify into indented prose looks like it should save
// tokens, and does the opposite. It saves ~400 characters and COSTS ~590 tokens,
// because the tokenizer handles dense JSON punctuation better than it handles
// indentation and newlines. Do not "tidy" this renderer without measuring.

/**
 * Pure no-op plus-tier lines, e.g. "Epic +1: No additional buff".
 *
 * The negative lookahead is load-bearing. 26 of the 111 such lines continue
 * "... No additional buff but unlocked rune enchantment capabilities" — those
 * state when a rune gains enchantment and must survive. Without `(?! but)` a
 * naive collapse deletes the enchantment-unlock tier from 26 rune entries.
 *
 * Matches both real newlines (plain string values) and the literal backslash-n
 * that appears inside JSON.stringify'd entries.
 */
// The `[ \t]*` after the newline is load-bearing and was missing at first.
// In the real data these lines are INDENTED — "\n        Epic +1: No additional
// buff" — so without it the optional newline cannot match (the next character is
// a space, not "E"), the engine backtracks, and only the text is removed. That
// left 78 empty lines in the prompt, each still costing a token. The first
// version of the test used un-indented sample data and passed for the wrong
// reason; there is now a test with indentation.
const NO_OP_PLUS_TIER = /(?:\\n|\n)?[ \t]*(?:Epic|Legendary) \+\d+: No additional buff(?! but)\.?/g;

/** Leading whitespace on a continuation line, in either string form. */
const LEADING_INDENT = /(\\n|\n)[ \t]+/g;

/**
 * Only `runes` may have its no-op lines collapsed.
 *
 * The rule that licenses it — runes.stat_unlock_mechanics.plus_variants — says
 * plus tiers "add no new rows" explicitly and only for Ability, Enhancement and
 * Blessing Runes. No equivalent statement exists anywhere for gear, so removing
 * the 7 no-op lines in weapons.* would turn a confirmed negative ("Epic +1 gives
 * nothing") into silence with nothing to cover it — and the gear_sets fallback
 * is an unlabelled comma list a model would misread as a rarity ladder.
 */
const COLLAPSIBLE_CATEGORIES = new Set(['runes']);

/**
 * Render the knowledge base as prompt text.
 *
 * @param {object} knowledge  the knowledge base
 * @param {object} [options]
 * @param {string[]} [options.suppress]  dotted paths (`category.key` or
 *        `category.key.subkey`) to leave OUT of the rendered text. The knowledge
 *        object is never modified — suppression is a render-time decision, so it
 *        is revertible by one flag and can never damage the stored data.
 * @param {boolean} [options.compact]  strip leading indentation from continuation
 *        lines, and collapse no-op plus-tier lines within `runes`. Pure byte
 *        removal — no fact is lost, and the collapse is covered by a stated
 *        general rule that stays in the prompt.
 * @returns {string}
 */
function renderKnowledge(knowledge, options) {
    const opts = options || {};
    const suppress = new Set(opts.suppress || []);
    const compact = Boolean(opts.compact);
    const kb = knowledge && typeof knowledge === 'object' ? knowledge : {};

    const sections = [];
    for (const [category, entries] of Object.entries(kb)) {
        if (category === 'custom_facts') {
            // Community contributions. Never suppressed, never reordered —
            // contributor credit is computed from the suggestions ledger, but
            // these are the visible half of the same bargain.
            if (Array.isArray(entries) && entries.length > 0) {
                sections.push('ADDITIONAL FACTS:\n' + entries.map((f) => `- ${f.text}`).join('\n'));
            }
            continue;
        }
        if (category === 'opinions') {
            if (Array.isArray(entries) && entries.length > 0) {
                sections.push('COMMUNITY OPINIONS (not verified — present these as player opinions, not confirmed facts):\n' + entries.map((o) => `- ${o.text} (by ${o.added_by})`).join('\n'));
            }
            continue;
        }

        const lines = [];
        if (typeof entries === 'object' && entries !== null) {
            for (const [name, data] of Object.entries(entries)) {
                if (suppress.has(`${category}.${name}`)) continue;

                if (typeof data === 'string') {
                    lines.push(`${name}: ${data}`);
                } else if (typeof data === 'object' && data !== null) {
                    // Approved/vision entries store { text, added_by, added_at, source }.
                    // Prefer the human-readable .text so the AI sees clean prose
                    // instead of a JSON dump. Curated entries without .text
                    // (e.g. characters with skill_levels) still fall back to JSON.
                    if (typeof data.text === 'string' && data.text.length > 0) {
                        lines.push(`${name}: ${data.text}`);
                    } else {
                        // Sub-key suppression. Whole-entry suppression is too
                        // blunt for entries that mix volatile prices with
                        // evergreen UI description — dropping the entry to lose
                        // the prices would take the rest with it.
                        const kept = {};
                        let dropped = false;
                        for (const [sub, val] of Object.entries(data)) {
                            if (suppress.has(`${category}.${name}.${sub}`)) { dropped = true; continue; }
                            kept[sub] = val;
                        }
                        if (dropped && Object.keys(kept).length === 0) continue;
                        lines.push(`${name}: ${JSON.stringify(dropped ? kept : data)}`);
                    }
                }
            }
        }
        if (lines.length) {
            let body = lines.join('\n');
            if (compact) {
                if (COLLAPSIBLE_CATEGORIES.has(category)) body = body.replace(NO_OP_PLUS_TIER, '');
                body = body.replace(LEADING_INDENT, '$1');
            }
            sections.push(`${category.toUpperCase()}:\n${body}`);
        }
    }
    return sections.join('\n\n');
}

/**
 * Dotted paths held back from the prompt, with a mandatory reason each.
 *
 * Lives here rather than in bot.js so there is ONE copy. It was duplicated —
 * bot.js held the real list and the test file held a hand-typed replica with a
 * comment claiming they were kept in step by a test that did not actually
 * compare them. Two lists that can silently disagree are worse than one.
 *
 * This is a SAFETY list before it is an optimisation: the bot answers strangers
 * in a public channel, and quoting a stale real-money price is a claim about
 * money someone might spend. Note that removing these paths does NOT by itself
 * make the bot price-safe — figures also live in privilege_cards, daily_rewards,
 * currencies, runes and shop.wish. The actual guarantee is the PRICES rule in
 * the system prompt plus lib/price-guard.js; this only drops the bulk ladders.
 */
const SUPPRESSION_REASONS = {
    'shop.top_up.gems': 'Aurocite/USD pack ladder — real-money prices Habby changes at will.',
    'shop.top_up.aurocite': 'USD-only Aurocite ladder plus a Habby Store bonus percentage — all real-money.',
    'shop.top_up.gold': "Gem-priced gold packs; the entry's own note says the section refreshes daily.",
    'event_shop.island_store.milestone_gates': 'Island Points gates for one past Island Treasure Hunt run; the sibling `refresh` key says the whole stock cycles each event.',
};

/** The options the bot actually renders with in production. */
const PRODUCTION_OPTIONS = {
    suppress: Object.keys(SUPPRESSION_REASONS),
    compact: true,
};

module.exports = {
    renderKnowledge,
    SUPPRESSION_REASONS,
    PRODUCTION_OPTIONS,
    NO_OP_PLUS_TIER,
    COLLAPSIBLE_CATEGORIES,
};
