'use strict';

// Ask the REAL model a handful of questions with the production prompt and
// print the FULL answers.
//
//   node scripts/ask.js "What does Sprite's Awe do at Mythic?" "What is AoE?"
//   node scripts/ask.js --repeat 3 "What does Healing Sprite do at Mythic?"
//
// Why this exists beside answer-check.js: answer-check prints only the first
// 300 characters of an answer and runs every case (~25 min, ~$0.65). When one
// case fails you need the WHOLE answer, several samples of it, in under two
// minutes — a wrong answer that repeats 3 times in 3 is a defect in the entry;
// one that appears 1 time in 3 is sampling. Each call costs about a cent.
//
// It builds the prompt exactly as answer-check.js and bot.js do (lib/prompt.js
// over the PRODUCTION render) and runs the reply through the price guard, so
// what it prints is what a member would receive.
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(ROOT, '.env') });
const OpenAI = require('openai');
const { renderKnowledge, PRODUCTION_OPTIONS } = require(path.join(ROOT, 'lib', 'knowledge-render'));
const prompts = require(path.join(ROOT, 'lib', 'prompt'));
const priceGuard = require(path.join(ROOT, 'lib', 'price-guard'));

const argv = process.argv.slice(2);
let repeat = 1;
const at = argv.indexOf('--repeat');
if (at !== -1) { repeat = Math.max(1, Number(argv[at + 1]) || 1); argv.splice(at, 2); }
const questions = argv.flatMap((q) => Array.from({ length: repeat }, () => q));
if (!questions.length) { console.error('Usage: node scripts/ask.js [--repeat N] "question" ["question" ...]'); process.exit(2); }
if (!process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY is not set (xyian-bot-project/.env).'); process.exit(2); }

const KB = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'knowledge.json'), 'utf8'));
const systemPrompt = prompts.buildTextPrompt(renderKnowledge(KB, PRODUCTION_OPTIONS));
// Same ceiling answer-check.js paces against: tokens ≈ chars / 4, 200k per minute.
const PACING_MS = Number(process.env.ANSWER_CHECK_PACING_MS || Math.ceil((systemPrompt.length / 4) / 180000 * 60000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log(`prompt: ${systemPrompt.length} chars · ${questions.length} call(s) · ${Math.round(PACING_MS / 1000)}s apart`);
    for (let i = 0; i < questions.length; i++) {
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: questions[i] }],
            max_tokens: 600, temperature: 0.4,
        });
        const a = priceGuard.appendPriceCaveat(res.choices[0]?.message?.content?.trim() || '') || '';
        console.log(`\n### ${questions[i]}  [${res.choices[0].finish_reason}, ${res.usage.completion_tokens} tokens]\n${a}`);
        if (i < questions.length - 1) await sleep(PACING_MS);
    }
})();
