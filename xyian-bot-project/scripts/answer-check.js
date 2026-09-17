'use strict';

// Answer-level check: what does the bot SAY, not what does it retrieve.
//
//   node scripts/answer-check.js        (needs OPENAI_API_KEY; ~$0.40 a run)
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
// One prompt is ~55k tokens (since the Version 1.1.9 drop) against a 200k/min
// org ceiling, so one call every 18s stays clear of it.
const PACING_MS = Number(process.env.ANSWER_CHECK_PACING_MS || 18000);

const CASES = [
    { q: 'What power do I need to join XYIAN OFFICIAL?',        say: [/8 ?m/i],            notSay: [/\b(?:4|6) ?m\+? (?:power )?(?:required|minimum|to join)/i] },
    { q: 'What is the power requirement for ProjectXY?',        say: [/4 ?m/i],            notSay: [/\b6 ?m\+? (?:power )?(?:required|minimum|to join)/i] },
    // The everyday names. "XY" must land on XYIAN OFFICIAL (8M), never on
    // ProjectXY, whose full name also contains the letters XY.
    { q: 'How much power do I need for XY?',                    say: [/8 ?m/i],            notSay: [/\b(?:4|6) ?m\+? (?:power )?(?:required|minimum|to join)/i] },
    // Kyle: 'we are all one clan but we are all competitive and PXY is no different' — the live bot
    // called PXY 'a great place to start', which is the little-brother framing he rejects.
    // NOTE the shape: the KB itself says "not a feeder, a starter guild, or a
    // 'little brother'", so a CORRECT answer echoes those words negated — and a
    // negation distributes across "or", which no lookbehind can see. So forbid
    // the AFFIRMATIVE construction a wrong answer must use ("is a great place to
    // start", "serves as a feeder", "before moving up to XY"), never the words.
    // Below the floor is NOT a flat no. A wrong answer opens with "No" or "not
    // eligible"; a right one mentions the exception and what earns it.
    { q: "I'm only 3M power, can I still join PXY?",             say: [/exception|active daily|discord/i], notSay: [/^\s*(?:no|unfortunately)\b/i, /\bnot (?:eligible|able to join|possible)\b/i] },
    { q: 'What is PXY?',                                        say: [/projectxy/i, /4 ?m/i, /competitive|same ambition|in its own right|not (?:a )?(?:feeder|stepping)/i], notSay: [/(?:\bis|it's|\bits|\bas|serves as|think of it as|acts as) (?:a |the )?(?:great |good |perfect |ideal |natural )?(?:place to start|stepping.?stone|starter guild|feeder(?: guild)?|little brother)/i, /before (?:moving|joining|graduating) (?:up |on )?(?:to )?(?:xy\b|xyian)/i] },
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
    // Re-pinned for Version 1.1.9 (2026-09-17): 201-210 and "past Chapter 100" are
    // now the newest; 191-200 / Chapter 130 are history and may be mentioned as such.
    { q: 'What new campaign stages were added?',                 say: [/201|210/], notSay: [] },
    { q: 'After which chapter was campaign difficulty reduced in the newest update?', say: [/\b100\b/], notSay: [] },
    // Version 1.1.9 in-game notice (2026-09-17). The notSay shapes are the
    // AFFIRMATIVE wrong answers — a right answer legitimately mentions the old
    // 6-tier Arena, Supreme II, or Peak Arena while ruling them out.
    { q: 'What are the Arena tiers now?',                        say: [/transcendant/i, /supreme ii/i, /\b(?:8|eight)\b/], notSay: [/\b(?:there are|has|arena has|into) (?:6|six) tiers\b/i] },
    { q: 'I was in Supreme tier, where do I land after the arena rework?', say: [/supreme i\b(?!i)/i], notSay: [/you(?:'ll| will)? (?:move|be placed|land|go) (?:directly )?(?:in|into|to) \[?supreme ii\b/i] },
    { q: 'Does the arena tier rework apply to Peak Arena?',      say: [/standard arena|main arena|does not (?:apply|affect)|doesn't (?:apply|affect)|not affect|unaffected|only/i], notSay: [/^\s*yes\b/i, /\b(?:also )?applies to peak arena\b/i] },
    { q: 'How many free arena refreshes do I get?',              say: [/\b(?:two|2)\b/], notSay: [] },
    { q: 'When does the fishing event start and what is the new mystling?', say: [/(?:september|sept?\.?)\s*19|19(?:th)?\s*(?:of\s*)?(?:september|sept)|0?9\/19/i, /dragon gate koi/i], notSay: [] },
    { q: 'What skins can I get from Starfall Disc?',             say: [/moonwake shimmer/i, /silkveil harvest/i], notSay: [] },
    { q: 'When does the next Guild Expedition season start and what is the new tier?', say: [/(?:october|oct\.?)\s*5|5(?:th)?\s*(?:of\s*)?(?:october|oct)|10\/0?5/i, /starbound eternity/i], notSay: [] },
    { q: 'What is the new All-Star Cup season theme?',           say: [/plant build/i, /(?:october|oct\.?)\s*5|5(?:th)?\s*(?:of\s*)?(?:october|oct)|10\/0?5/i], notSay: [] },
    { q: 'Did the Dragoon set get nerfed?',                      say: [/not (?:say|state|document|specif)|unclear|(?:doesn't|does not) (?:say|state|specify)|neither|old (?:version|and new)/i], notSay: [/^\s*yes\b.{0,40}nerf/i, /\bwas nerfed\b/i, /\b(?:is|was) (?:a )?(?:buff|nerf)\b/i] },
    { q: 'Can I switch the Dragoon set back to the old version?', say: [/\byes\b|can (?:be )?switch|switch(?:ed)? (?:back|between|manually)/i], notSay: [/^\s*no\b/i, /\bcannot switch|can't switch|not possible to switch/i] },
    { q: 'When is Rumble Ladder open?',                          say: [/1:00/, /10:00/, /utc/i], notSay: [/19:00|13:00|7:00-10:00/] },
    { q: 'What happens if I score own goals in Football Rumble?', say: [/cred score/i, /\b(?:3|three)\b/], notSay: [] },
    { q: 'Does Guild Raid start automatically now?',             say: [/24 hours|auto/i], notSay: [] },
    { q: 'How many times can I discard skills for free each day?', say: [/\b(?:3|three)\b/], notSay: [] },
    { q: 'What version is the game on?',                         say: [/1\.1\.9/], notSay: [/(?:is|on|running) (?:version )?1\.1\.[78]\b/i] },
    // Negative control: named in the notice, not explained. Must decline, not invent.
    { q: 'What is Football Rumble?',                             say: [/not documented|doesn't (?:describe|say|explain)|does not (?:describe|say|explain)|!suggest|rumble ladder/i], notSay: [] },
    { q: 'Can I unequip a whole gear preset at once?',           say: [/unequip all|one tap|clear/i], notSay: [] },
    { q: 'What is the Solitary Trial?',                          say: [/7-day|seven-day|task|season launch/i], notSay: [] },
    { q: 'What does the Guild Hall screen show?',               say: [/upgrad|new ui|2026-08-23|predates/i], notSay: [] },
    // The official notice calls ONE mode two different names in ONE document:
    // "Mega All-Star Cup" in the optimization list, "Super All-Star Cup" in the
    // bug-fix list. A member who read the notice may ask either way, and the
    // decline this used to produce is the exact failure answer-check exists for.
    { q: 'What is the Super All-Star Cup?',                     say: [/mega all-?star cup/i], notSay: [/no (?:data|information)|not documented.{0,40}(?:at all|entirely)/i] },
    // A correct answer ALSO says Mega/Super is "a different name from the regular
    // All-Star Cup", so bare "different" flags the right answer. Forbid only the
    // shape a wrong answer takes: "No" / "are two different modes".
    { q: 'Is Mega All-Star Cup the same as Super All-Star Cup?', say: [/\b(?:yes|same|both names|interchangeab)/i], notSay: [/^\s*no\b|are (?:two |completely |entirely )?(?:different|separate|distinct) (?:modes|events|tournaments|things|cups)\b/i] },
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
