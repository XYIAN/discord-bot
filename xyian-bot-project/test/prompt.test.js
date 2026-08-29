// Golden + structural tests for lib/prompt.js.
//
// The prompt IS the bot's instructions. A silent change to it is a silent
// change to every answer, so the first tests are golden hashes — same posture
// as test/knowledge-render.test.js pins the rendered facts.
//
// The last two tests are the ones that matter most. They assert that bot.js
// and scripts/answer-check.js hold NO second copy of the prompt text. Three
// copies existed before this module: askAI(), askAIWithVision() (repeating the
// persona verbatim), and answer-check.js. v3.22.0 fixed exactly this shape for
// the render suppression list, where a comment claimed a test kept two copies
// in step and no test actually compared them. A comment is not a guard.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
    PERSONA, TEXT_RULES, FACTS_HEADER, visionRules, buildTextPrompt, buildVisionPrompt,
} = require('../lib/prompt');

let passed = 0;
function test(name, fn) {
    try { fn(); passed++; console.log(`  \u2713 ${name}`); }
    catch (e) { console.error(`  \u2717 ${name}\n    ${e.message}`); process.exitCode = 1; }
}
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

console.log('golden \u2014 what the bot is told must not change by accident');
test('persona is pinned', () => {
    assert.strictEqual(PERSONA.length, 412);
    assert.strictEqual(sha(PERSONA), '518a8e27af62a752efd8e679907534638d7149bab56471f51f7e4fcb43b3f396');
});
test('text rules are pinned', () => {
    assert.strictEqual(TEXT_RULES.length, 1075);
    assert.strictEqual(sha(TEXT_RULES), '96a0c2ea115ea51e30e96ac79baa70874508754ab4235a83400661baf30d3f4d');
});
test('vision rules are pinned', () => {
    const v = visionRules('CATEGORIES');
    assert.strictEqual(v.length, 2733);
    assert.strictEqual(sha(v), '8180e3dbf95ef530b7c0c9bce96ca18cbed1e6ebc600b28dfc12a497edd81d81');
});

console.log('composition');
test('the text prompt is persona + rules + facts, in that order', () => {
    const out = buildTextPrompt('SOME FACTS');
    assert.ok(out.startsWith(PERSONA));
    assert.ok(out.indexOf(TEXT_RULES) === PERSONA.length);
    assert.ok(out.endsWith(FACTS_HEADER + 'SOME FACTS'));
});
test('the vision prompt reuses the SAME persona, byte for byte', () => {
    // It used to be a second hand-written copy inside askAIWithVision().
    assert.ok(buildVisionPrompt('f', 'c').startsWith(PERSONA));
});
test('the category whitelist is injected, not hardcoded', () => {
    const out = buildVisionPrompt('', 'runes, characters');
    assert.ok(out.includes('runes, characters'));
    assert.ok(!out.includes('knowledgeCategoryList'), 'leaked the bot.js helper name');
});
test('an empty knowledge block still yields a valid prompt', () => {
    // knowledgeAsText() returns '' if knowledge.json failed to load. The prompt
    // must still be well-formed rather than throwing on undefined.
    for (const v of [undefined, null, '']) {
        assert.ok(buildTextPrompt(v).endsWith(FACTS_HEADER));
        assert.ok(buildVisionPrompt(v, 'c').endsWith(FACTS_HEADER));
    }
});

console.log('safety rules that must survive any edit');
test('the PRICES rule is present \u2014 it guards real-money claims', () => {
    assert.ok(TEXT_RULES.includes('PRICES:'));
    assert.ok(/may be out of date|check in-game/i.test(TEXT_RULES));
});
test('the never-fabricate rule is present in both modes', () => {
    assert.ok(/Never guess or fabricate/i.test(TEXT_RULES));
    assert.ok(/not fabrication|Do not invent/i.test(visionRules('c')));
});
test('"guild" never "clan" survives in both modes', () => {
    assert.ok(TEXT_RULES.includes('never "clan"'));
    assert.ok(visionRules('c').includes('never "clan"'));
});

console.log('single source \u2014 no second copy anywhere');
const PROMPT_FINGERPRINT = 'You are Arch AI \u2014 a cybernetic wizard';
test('bot.js holds no inline copy of the prompt', () => {
    const bot = read('bot.js');
    assert.ok(!bot.includes(PROMPT_FINGERPRINT),
        'bot.js has its own copy of the prompt again \u2014 it must call lib/prompt.js');
});
test('answer-check.js holds no inline copy of the prompt', () => {
    // This is the copy that caused the trouble: a verification script with its
    // own prompt keeps passing while validating a prompt that no longer ships.
    const ac = read('scripts/answer-check.js');
    assert.ok(!ac.includes(PROMPT_FINGERPRINT),
        'answer-check.js has its own copy of the prompt again \u2014 it must call lib/prompt.js');
});

console.log(`\n${passed} passed`);
