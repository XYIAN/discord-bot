'use strict';

// ── Real-money price guard ───────────────────────────────────────────────────
// The knowledge base is full of prices captured at one moment — Aurocite packs,
// USD bundles, gem costs — and Habby reprices them whenever it likes. The bot
// answers strangers in a public channel, so quoting one as current is a claim
// about money someone might actually spend.
//
// A system-prompt rule was tried first and is NOT sufficient on its own. Asked
// "how much does it cost to renew a monthly Privilege Card, and is it worth
// buying?", the bot obeyed the half of the rule about not recommending
// purchases and ignored the half about flagging staleness — it answered "499
// Aurocite" flat. One instruction among eight, inside a 36,000-token prompt, is
// a suggestion rather than a guarantee.
//
// So this is the guarantee: a deterministic post-check that appends the caveat
// when the answer actually contains a price. The prompt rule stays, because it
// produces better-phrased answers when it is followed; this catches the rest.

/**
 * Currency figures worth flagging.
 *
 * Deliberately narrow. Gems and gold are soft currencies earned in-game — the
 * warning is about REAL money and the hard currency bought with it, so
 * "8,880 gold for 20 gems" is not flagged. Over-flagging trains people to
 * ignore the notice, which costs more than it saves.
 */
const PRICE_PATTERNS = [
    /\d[\d,.]*\s*aurocite/i,      // 499 Aurocite
    /aurocite\s*[\d,.]+/i,        // Aurocite 499
    /(?:us)?\$\s?\d/i,            // $9.99, US$9.99
    /\d[\d,.]*\s*usd\b/i,         // 9.99 USD
    /\d[\d,.]*\s*(?:dollars|euros|pounds)\b/i,
];

/** Phrases that mean a caveat is already present — don't stack a second one. */
const ALREADY_CAVEATED = [
    /may be out of date/i,
    /might be out of date/i,
    /may have changed/i,
    /check in-?game/i,
    /prices? can change/i,
    /no longer accurate/i,
];

const CAVEAT = '⚠️ Prices in my notes are from when they were recorded and Habby changes them — check in-game before spending anything.';

/** Whether the text quotes a real-money or Aurocite figure. */
function mentionsRealMoneyPrice(text) {
    const s = String(text == null ? '' : text);
    return PRICE_PATTERNS.some((re) => re.test(s));
}

/** Whether the text already tells the reader the price might be stale. */
function hasPriceCaveat(text) {
    const s = String(text == null ? '' : text);
    return ALREADY_CAVEATED.some((re) => re.test(s));
}

/**
 * Append the staleness caveat when — and only when — the answer quotes a
 * real-money price and hasn't already flagged it.
 *
 * Returns the text unchanged in every other case, including empty input, so
 * this is safe to wrap around any answer.
 */
function appendPriceCaveat(text) {
    const s = String(text == null ? '' : text);
    if (!s.trim()) return s;
    if (!mentionsRealMoneyPrice(s)) return s;
    if (hasPriceCaveat(s)) return s;
    return `${s.trimEnd()}\n\n${CAVEAT}`;
}

module.exports = {
    CAVEAT,
    PRICE_PATTERNS,
    mentionsRealMoneyPrice,
    hasPriceCaveat,
    appendPriceCaveat,
};
