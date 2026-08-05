'use strict';

// ── Vision response parsing ──────────────────────────────────────────────────
// The vision prompt asks the model to answer the user, then emit a
// `=== CANDIDATES ===` block of new facts it spotted in the screenshot, as JSON.
// This splits the two apart and sanitises the candidates before they can reach
// the suggestions queue.
//
// Extracted from bot.js so it can be tested. It parses UNTRUSTED model output
// that flows into a moderator review queue, and it had no direct test coverage
// at all — every field here is a thing a confused model can get wrong.

/**
 * @param {string} rawAnswer      the model's full reply
 * @param {Set<string>} categories  valid knowledge categories; anything else
 *        becomes null so a moderator has to choose rather than the model
 *        inventing a category that would create a junk topic on approval.
 * @returns {{reply: string|null|undefined, candidates: object[]}}
 */
function splitVisionResponse(rawAnswer, categories) {
    const valid = categories instanceof Set ? categories : new Set();
    // Preserve the falsy value rather than normalising it: callers distinguish
    // null (no answer) from '' and the original code did too.
    if (!rawAnswer) return { reply: rawAnswer, candidates: [] };

    const marker = /===\s*CANDIDATES\s*===\s*([\s\S]*)$/i;
    const match = rawAnswer.match(marker);
    if (!match) return { reply: rawAnswer.trim(), candidates: [] };

    const reply = rawAnswer.slice(0, match.index).trim();
    let jsonText = match[1].trim();
    // Strip ``` fences if the model wrapped the JSON in them.
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed = [];
    try {
        const obj = JSON.parse(jsonText);
        parsed = Array.isArray(obj) ? obj : (Array.isArray(obj && obj.candidates) ? obj.candidates : []);
    } catch {
        // A model that emits malformed JSON should cost us the candidates, not
        // the answer the user is waiting for.
        parsed = [];
    }

    const cleaned = [];
    for (const c of parsed) {
        if (!c || typeof c !== 'object') continue;
        // Must be a type check, not `(c.text || '')`. A truthy non-string —
        // `"text": 123`, an object, an array — has no .trim(), and the
        // TypeError escapes this function into askAIWithVision's catch, where
        // it is reported as "OpenAI vision error" and the user gets no answer
        // at all. One odd model response should cost us a candidate, never the
        // reply someone is waiting for.
        const text = typeof c.text === 'string' ? c.text.trim() : '';
        if (text.length < 10) continue;
        const proposed_category = valid.has(c.category) ? c.category : null;
        const proposed_key = (typeof c.key === 'string' && /^[a-z0-9_]{2,40}$/i.test(c.key.trim()))
            ? c.key.trim().toLowerCase()
            : null;
        const confidence = ['high', 'medium', 'low'].includes(c.confidence) ? c.confidence : 'medium';
        cleaned.push({ text, proposed_category, proposed_key, confidence });
    }
    return { reply, candidates: cleaned };
}

module.exports = { splitVisionResponse };
