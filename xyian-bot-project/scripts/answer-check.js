'use strict';

// Answer-level check: what does the bot SAY, not what does it retrieve.
//
//   node scripts/answer-check.js        (needs OPENAI_API_KEY; ~$0.05 a run)
//
// Deliberately NOT under test/ — test/run-all.js discovers every
// test/*.test.js, and `npm test` must stay free and offline. Run this by hand
// before shipping a change to data/knowledge.json or to the system prompt.
//
// Why it exists: every other test in this repo checks that a fact was RENDERED
// into the prompt. None checked what the member gets back. On its first run
// against the 2026-08-23 drop it caught two defects that the render tests
// passed clean:
//
//   1. `characters.acquisition_event_only_heroes` listed Nezha and Wukong, then
//      added Rick and Morty in a trailing sentence. The model answered "Nezha
//      and Wukong" and ignored the qualifier — it follows the leading directive
//      clause (see CLAUDE.md). Fixed by making the enumeration complete BEFORE
//      any qualification.
//   2. A custom_fact saying the Guild Hall description was out of date sat in
//      the ADDITIONAL FACTS bullet list, far from the GUILD: section. The model
//      read guild.guild_hall.contents and recited the old layout as current.
//      Fixed by moving the caveat INSIDE the entry being read.
//
// Both are the same shape: a caveat placed away from the data it qualifies
// loses to that data. The sibling Tempest bot shipped this exact bug class
// with 211 green tests — see its docs/coding-standards/knowledge-facts.md.
//
// The `notSay` half is the important one: it catches the bot DECLINING or
// under-answering something it holds, which render tests are structurally
// blind to.
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });
const OpenAI = require('openai');
const { renderKnowledge, PRODUCTION_OPTIONS } = require(path.join(ROOT, 'lib', 'knowledge-render'));
const prompts = require(path.join(ROOT, 'lib', 'prompt'));
const priceGuard = require(path.join(ROOT, 'lib', 'price-guard'));

const KB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'knowledge.json'), 'utf8'));

// The prompt comes from lib/prompt.js — the same module bot.js builds from.
// It used to be a verbatim copy pasted in here, which meant editing the prompt
// in bot.js would leave this script happily validating a prompt that no longer
// shipped. A test in test/prompt.test.js now fails if a copy reappears.
const systemPrompt = prompts.buildTextPrompt(renderKnowledge(KB, PRODUCTION_OPTIONS));

const MAX_RETRIES = 4;
// One prompt is ~40k tokens against a 200k/min org ceiling.
const PACING_MS = Number(process.env.ANSWER_CHECK_PACING_MS || 12000);

const CASES = [
    { q: 'What power do I need to join XYIAN OFFICIAL?',        say: [/8 ?m/i],            notSay: [/\b6 ?m\+? (?:power )?(?:required|minimum|to join)/i] },
    { q: 'What is the power requirement for ProjectXY?',        say: [/6 ?m/i],            notSay: [] },
    // The everyday names. "XY" must land on XYIAN OFFICIAL (8M), never on
    // ProjectXY, whose full name also contains the letters XY.
    { q: 'How much power do I need for XY?',                    say: [/8 ?m/i],            notSay: [/\b6 ?m\+? (?:power )?(?:required|minimum|to join)/i] },
    // Kyle: 'we are all one clan but we are all competitive and PXY is no different' — the live bot
    // called PXY 'a great place to start', which is the little-brother framing he rejects.
    { q: 'What is PXY?',                                        say: [/projectxy/i, /6 ?m/i], notSay: [/place to start|starter|beginner|feeder|little brother|before (?:moving|joining) (?:up|xy)/i] },
    { q: 'How many guild donations do I need per day?',         say: [/\b2\b|two/i], notSay: [] },
    { q: 'How many MI do I need to do daily?',                  say: [/\b2\b|two/i, /monster invasion/i], notSay: [] },
    // The daily requirement is DONATIONS, not bargain — different systems, and
    // the recruitment post asked for the wrong one until v3.32.0.
    { q: 'What are the daily requirements to stay in the guild?', say: [/donation/i], notSay: [/bargain/i] },
    // The four Class Ability names come from the OFFICIAL notes (2026-08-28) and
    // replaced the in-game preview's 'Sword Intent' / 'Boiling'. Asserting the
    // two corrected names is the proof the repair reached the answer; the old
    // names are deliberately still in the corpus as a superseded-name alias, so
    // forbidding them outright would fail a correct "Sword Will (formerly …)".
    { q: 'What is Umbral Tempest Season 4 adding?',             say: [/sword will/i, /thermancy/i], notSay: [] },
    { q: 'What ability does the Ranger get in Season 4?',       say: [/sword will/i], notSay: [] },
    { q: 'What is Sword Intent?',                               say: [/sword will/i], notSay: [] },
    { q: 'When does Umbral Tempest Season 4 start?',            say: [/august 31|aug 31|31 august/i], notSay: [] },
    { q: 'Who is Mr. Meeseeks?',                                say: [/mystling/i, /meeseeks directive/i], notSay: [] },
    { q: 'Which characters can only be obtained during events?', say: [/rick/i, /morty/i], notSay: [] },
    { q: 'When does the Rick and Morty event end?',             say: [/(september|sept)\s*11|11\s*(september|sept)/i], notSay: [] },
    { q: 'Is Heroic mode the same as Hard mode?',               say: [/same/i], notSay: [/\b(different|not the same|separate)\b/i] },
    { q: 'Should I wait for my guild to bargain before I buy the daily item?', say: [/no advantage|no need to wait|refund|difference is return|get.*back|mail/i], notSay: [] },
    // The count may be worded "5 per day", "5 times a day" or "up to five times
    // a day" — all correct. An assertion that only accepts one phrasing tests
    // the model's wording, not its knowledge, and fails for the wrong reason.
    { q: "What's the difference between guild donations and bargain?", say: [/\b(5|five)\b[^.]{0,20}\b(times|per)?\b[^.]{0,10}day/i, /rotat|daily item|price/i], notSay: [] },
    // INVERTED on 2026-08-28. This was a negative control asserting Starlight Cup
    // was undocumented — because the in-game preview named it and said nothing
    // else. The official notes attribute that exact change to All-Star Cup, so
    // the old entry was a wrong standing instruction ("do not merge with All
    // Star Cup") that outranked every correct All-Star Cup fact. Now the bot
    // must resolve the alias and answer from the documented entries.
    // notSay is the load-bearing half here: the first fix mentioned All-Star Cup
    // but described the GALA's award ceremony, because the Cup/Gala guard lived in
    // a sibling key. A caveat placed away from the data it qualifies loses to it.
    { q: 'What is the Starlight Cup and how does it work?',      say: [/all[- ]star cup/i], notSay: [/award ceremony|guild mvp|honor award/i] },
    { q: 'What is the Starlight Gala?',                          say: [/mvp/i], notSay: [/boss death|stage timer/i] },
    // Alias: members read the preview name for a week before the official notes.
    { q: 'What is the Guild Starlight Celebration?',             say: [/starlight gala/i], notSay: [] },
    // Negative control that MOVED rather than disappeared: Mega All-Star Cup is
    // now the thing that is named but undocumented. If this starts answering
    // confidently, the alias fix has swung too far into invention.
    { q: 'What are the rules of the Mega All-Star Cup?',         say: [/not documented|no.*(?:detail|data|record)|!suggest|don't (?:have|know)/i], notSay: [] },
    // New content from the official notes.
    { q: 'What new campaign stages were added?',                 say: [/191|200/], notSay: [] },
    { q: 'After which chapter was campaign difficulty reduced in the newest update?', say: [/130/], notSay: [] },
    { q: 'Can I unequip a whole gear preset at once?',           say: [/unequip all|one tap|clear/i], notSay: [] },
    { q: 'What is the Solitary Trial?',                          say: [/7-day|seven-day|task|season launch/i], notSay: [] },
    { q: 'What does the Guild Hall screen show?',               say: [/upgrad|new ui|2026-08-23|predates/i], notSay: [] },
    // The official notice calls ONE mode two different names in ONE document:
    // "Mega All-Star Cup" in the optimization list, "Super All-Star Cup" in the
    // bug-fix list. A member who read the notice may ask either way, and the
    // decline this used to produce is the exact failure answer-check exists for.
    { q: 'What is the Super All-Star Cup?',                     say: [/mega all-?star cup/i], notSay: [/no (?:data|information)|not documented.{0,40}(?:at all|entirely)/i] },
    { q: 'Is Mega All-Star Cup the same as Super All-Star Cup?', say: [/same|both|interchangeab/i], notSay: [/\b(different|separate|not the same)\b/i] },
];

/** Sleep, used only to stay under the org's tokens-per-minute ceiling. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Ask the model, retrying on 429.
 *
 * The whole prompt is ~40k tokens, so a 16-case run asks for ~640k tokens. The
 * org ceiling is 200k/min, which this WILL hit — and did: an unguarded run died
 * on case 2 and exited non-zero, which reads as "the answers are wrong" when
 * nothing about the answers was wrong. A gate that cannot tell a rate limit
 * from a failure is worse than no gate, because it trains you to ignore it.
 */
async function askWithRetry(openai, question, attempt = 0) {
    try {
        return await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
            max_tokens: 600, temperature: 0.4,
        });
    } catch (e) {
        if (e.status !== 429 || attempt >= MAX_RETRIES) throw e;
        // OpenAI tells us how long to wait; trust it, with a floor.
        const hinted = Number((/try again in ([\d.]+)s/.exec(e.message) || [])[1]);
        const waitMs = Math.max(2000, Math.ceil((hinted || 15) * 1000) + 500);
        console.log(`   … rate limited, waiting ${Math.round(waitMs / 1000)}s (retry ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(waitMs);
        return askWithRetry(openai, question, attempt + 1);
    }
}

(async () => {
    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not set. This script calls the real model on purpose —\n' +
            'put the key in xyian-bot-project/.env or pass it inline:\n' +
            '  OPENAI_API_KEY=sk-... node scripts/answer-check.js');
        process.exit(2);
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log(`prompt: ${systemPrompt.length} chars\n`);
    let fails = 0, tin = 0, tout = 0;
    for (const c of CASES) {
        const res = await askWithRetry(openai, c.q);
        // bot.js askAI() runs every answer through appendPriceCaveat before
        // replying. Asserting on the raw completion would measure a different
        // string than the member receives — the exact trap debugging.md names.
        const a = priceGuard.appendPriceCaveat(res.choices[0]?.message?.content?.trim() || '') || '';
        tin += res.usage.prompt_tokens; tout += res.usage.completion_tokens;
        const missing = c.say.filter((r) => !r.test(a));
        const forbidden = c.notSay.filter((r) => r.test(a));
        const ok = !missing.length && !forbidden.length;
        if (!ok) fails++;
        console.log(`${ok ? '✓' : '✗'} ${c.q}`);
        console.log(`   ${a.replace(/\n+/g, ' ').slice(0, 300)}`);
        if (missing.length) console.log(`   MISSING: ${missing.join(', ')}`);
        if (forbidden.length) console.log(`   SAID FORBIDDEN: ${forbidden.join(', ')}`);
        console.log('');
        // Pace against the TPM ceiling instead of sprinting into a 429 and
        // relying on the retry. One prompt is ~40k tokens; at a 200k/min limit
        // that is roughly one call every 12s to stay clear.
        if (c !== CASES[CASES.length - 1]) await sleep(PACING_MS);
    }
    console.log(`${CASES.length - fails}/${CASES.length} passed  ·  ${tin} prompt + ${tout} completion tokens  ·  ~$${(tin / 1e6 * 0.15 + tout / 1e6 * 0.6).toFixed(4)}`);
    process.exitCode = fails ? 1 : 0;
})();
