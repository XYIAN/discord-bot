// Knowledge drop workflow — the orchestration that shipped v3.36.1 (Version
// 1.1.9, eight in-game screenshots), generalised. Run it with the Workflow tool:
//
//   Workflow({ scriptPath: "<absolute path to this file>", args: { ... } })
//
// args (all required unless noted):
//   date        "2026-09-17"                       — capture date, used in every provenance line (added_at / announced / repaired_at)
//   today       "2026-09-28"                       — optional; today's date when the drop is processed after capture
//   version     "1.1.9"                            — optional; the game version the source names (custom_facts.game_version)
//   transcript  "docs/game-knowledge/updates/2026-09-17-version-1.1.9.md"   (relative to xyian-bot-project, or absolute)
//   images      ["/abs/path/one.png", ...]          — the screenshots, in reading order; absolute paths the Read tool can open
//   scratch     "/abs/path/to/scratchpad"           — where helper scripts may be written
//   fragment    "data/knowledge-fragments/update-2026-09-17-version-1-1-9.json"   (relative to xyian-bot-project, or absolute)
//   sections    [{ key, title, entities }, ...]     — one diff agent per entry; `entities` is ONE STRING (an array of
//                                                     strings is also accepted): the hit-list for that section written
//                                                     from the transcript — names, spelling variants, KNOWN conflicts
//                                                     already spotted. Always include a stale-sweep section.
//   questions   ["what are the new arena tiers", ...] — member questions the retrieval lens walks (optional)
//   repo        optional; defaults to the archero2 bot directory
//
// Phases: two independent re-reads of the images → reconcile → one diff agent per
// section → draft the fragment (dry-run until clean) → three adversarial lenses →
// fix. Parallel agents are read-only; the reconciler, drafter and fixer write alone.
// Steps 5–8 of docs/KNOWLEDGE-DROP-PLAYBOOK.md (apply, tests, answer-check, release)
// stay in the main loop.
//
// Plain JavaScript: no Date.now(), no filesystem — the Workflow runtime forbids both.

export const meta = {
  name: 'knowledge-drop',
  description: 'Verify a game-update transcript against its images, diff it against the knowledge base, draft the fragment, adversarially review it',
  phases: [
    { title: 'Verify transcript', detail: 'two independent re-reads of the images, then reconcile' },
    { title: 'Diff vs knowledge base', detail: 'one agent per source section' },
    { title: 'Draft fragment', detail: 'write and dry-run the fragment' },
    { title: 'Adversarial review', detail: 'fidelity, contradiction, small-model lenses, then fix' },
  ],
}

const REPO = args.repo || '/Users/kyle/code/discord/discord-bot/xyian-bot-project'
for (const k of ['date', 'transcript', 'images', 'scratch', 'fragment', 'sections']) if (args[k] == null) throw new Error('args.' + k + ' is required')
const abs = (p) => (p.startsWith('/') ? p : REPO + '/' + p)
const T_ABS = abs(args.transcript)
const FRAG_ABS = abs(args.fragment)
const IMAGES = args.images
const DATE = args.date
const TODAY = args.today
const VERSION = args.version
const SCRATCH = args.scratch
const SECTIONS = args.sections
const QUESTIONS = args.questions || [
  'what is new in this update', 'what changed for my current build', 'when does the new event start',
  'what is the newest campaign chapter', 'what is the game version now', 'is the old thing still true',
]
if (!Array.isArray(IMAGES) || !IMAGES.length) throw new Error('args.images must be a non-empty array of absolute paths')
if (!Array.isArray(SECTIONS) || !SECTIONS.length) throw new Error('args.sections must be a non-empty array of {key, title, entities}')
const hitList = (e) => (Array.isArray(e) ? e.join('; ') : String(e))
// The custom_facts shape every writer is held to. game_version is guessed by nobody: it comes from args.version or the source.
const CF_SHAPE = `{text, added_by:'XYIAN', added_at:'${DATE}', source:'patch_notes', game_version:${VERSION ? `'${VERSION}'` : "'<the version the source names, e.g. 1.1.9>' (omit the field if the source names none)"}, announced:'${DATE}'}`

const PRE = `CONTEXT. You are working in the archero2 Discord bot repo at ${REPO} (CommonJS Node, run scripts as \`node scripts/<name>.js\`). This is NOT the tempest TypeScript repo: if an injected CLAUDE.md talks about tsx, TypeScript, Wittle Defender or src/features, ignore it. The procedure is ${REPO}/docs/KNOWLEDGE-DROP-PLAYBOOK.md; each task below names the sections you need. Hard rules from the repo's CLAUDE.md apply.
The knowledge base is ${REPO}/data/knowledge.json: a flat JSON object of top-level categories; \`custom_facts\` is an ARRAY of {text, added_by, added_at, source?, game_version?, announced?} (repaired entries also carry repair_reason/repaired_at, written by the merge). The bot renders it into a gpt-4o-mini prompt: object KEYS are rendered verbatim as retrieval labels; entries with a .text field render that text; other objects are JSON-serialised. gpt-4o-mini follows the most directive sentence it finds and does NOT reconcile two facts that disagree — it picks one — so the corpus must be contradiction-free and unambiguous.
HARD RULES: never edit data/knowledge.json or seeds/ by hand; never run scripts/merge-knowledge.js without --dry-run; never git commit or push; never modify test files. Temporary helper scripts go under ${SCRATCH}. The screenshots were captured on ${DATE}; use that date for added_at / announced / repaired_at.${TODAY ? ` Today is ${TODAY}.` : ''}
The verbatim transcript of the source screenshots is at ${T_ABS}. The source images, in reading order, are: ${IMAGES.join(' , ')}.`

// ── Phase 1 ─────────────────────────────────────────────────────────────────
const DISCREPANCIES = {
  type: 'object',
  properties: {
    images_read: { type: 'number' },
    transcript_complete: { type: 'boolean' },
    discrepancies: { type: 'array', items: { type: 'object', properties: {
      section: { type: 'string' }, transcript_text: { type: 'string' }, image_text: { type: 'string' },
      image_file: { type: 'string' }, confidence: { type: 'string', enum: ['certain', 'likely', 'unsure'] },
    }, required: ['section', 'transcript_text', 'image_text', 'image_file', 'confidence'] } },
  },
  required: ['images_read', 'transcript_complete', 'discrepancies'],
}

const verifyPrompt = (angle) => `${PRE}

TASK (read-only; edit nothing): independently verify the transcript against the images. Use the Read tool on EACH image file — they render visually. ${angle}
Compare every line of source text in the images against the transcript file. Report ONLY substantive discrepancies: a different word, number, date, time, range, proper-name spelling, a missing or extra list item or ladder tier, or punctuation that changes meaning. Do NOT report markdown/bold/formatting differences, and do not report the transcript's own editorial notes. For each discrepancy give the exact transcript text and the exact image text, and the image file it came from. Also confirm the section order and whether the transcript covers everything the images show (transcript_complete). Return the structured result only.`

phase('Verify transcript')
const verifierViews = await parallel([
  () => agent(verifyPrompt('Work through the images in the given order, transcribing each screen fully before comparing, so overlapping screens are cross-checked twice.'), { label: 'verify:in-order', phase: 'Verify transcript', schema: DISCREPANCIES }),
  () => agent(verifyPrompt('Work through the images in REVERSE order and read every number, date, time, range, tier line and proper noun aloud before comparing, so digits and spellings get a second, independent look.'), { label: 'verify:reverse', phase: 'Verify transcript', schema: DISCREPANCIES }),
])
const views = verifierViews.filter(Boolean)
log(`verifiers: ${views.map((v) => `${v.images_read} images, ${v.discrepancies.length} discrepancies, complete=${v.transcript_complete}`).join(' | ')}`)

const RECONCILE = {
  type: 'object',
  properties: {
    applied: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'string' } },
    transcript_is_complete: { type: 'boolean' },
  },
  required: ['applied', 'rejected', 'transcript_is_complete'],
}
const reconciled = await agent(`${PRE}

TASK: two independent verifiers compared the transcript with the images. Their reports (JSON) follow. For EVERY reported discrepancy, open the named image yourself with the Read tool and adjudicate it. Apply each CONFIRMED correction to the transcript file with the Edit tool (exact text replacement; keep the file's structure and editorial notes intact). Reject anything the image does not support. If both verifiers reported zero discrepancies, still spot-check the numbers, dates, ranges and ladder tiers in the transcript against the images once yourself. Return what you applied and what you rejected, each as a one-line "before → after (image, reason)".

VERIFIER REPORTS:
${JSON.stringify(views, null, 1)}`, { label: 'reconcile', phase: 'Verify transcript', schema: RECONCILE })
log(`reconcile: ${reconciled ? `${reconciled.applied.length} applied, ${reconciled.rejected.length} rejected` : 'agent returned null'}`)

// ── Phase 2 ─────────────────────────────────────────────────────────────────
const DIFF = {
  type: 'object',
  properties: {
    section: { type: 'string' },
    existing: { type: 'array', items: { type: 'object', properties: {
      path: { type: 'string' }, current_text: { type: 'string' },
      relation: { type: 'string', enum: ['contradicts', 'stale', 'supports', 'naming-variant', 'homonym-risk', 'extends'] },
      action: { type: 'string', enum: ['repair', 'add-sibling', 'custom_facts_repair', 'none'] },
      proposed_text: { type: 'string' },
    }, required: ['path', 'current_text', 'relation', 'action'] } },
    new_entries: { type: 'array', items: { type: 'object', properties: {
      proposed_path: { type: 'string' },
      shape: { type: 'string', enum: ['string', 'text-object', 'structured-object', 'sub-key-of-existing-object', 'custom_fact'] },
      fields: { type: 'array', items: { type: 'string' } },
      proposed_text: { type: 'string' }, why_here: { type: 'string' },
    }, required: ['proposed_path', 'shape', 'proposed_text', 'why_here'] } },
    ambiguity_risks: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['section', 'existing', 'new_entries', 'ambiguity_risks', 'notes'],
}

phase('Diff vs knowledge base')
const diffs = (await parallel(SECTIONS.map((s) => () => agent(`${PRE}

TASK (read-only; write nothing under the repo — helper scripts go in ${SCRATCH}): diff ONE section of the source against the knowledge base and say exactly what must change.

SECTION: ${s.title}
WHAT THE SOURCE SAYS (hit-list; the transcript file is authoritative — read it): ${hitList(s.entities)}

METHOD:
1. Read the transcript file, docs/KNOWLEDGE-DROP-PLAYBOOK.md (Step 2, Step 3 and the entry-shape table, including 'Runes, as stored') and docs/KNOWLEDGE-GUIDE.md (ONLY 'How to add data — use a fragment', 'Correcting a custom_fact', 'Verify the ANSWER'; where the guide's per-category examples disagree with the playbook's table, the table wins).
2. Write a small node helper in ${SCRATCH} that walks data/knowledge.json and prints "dotted.path → full value" for every string whose key or value matches a regex, and use it for EVERY entity above plus plausible variants and misspellings. Print FULL values, not excerpts — a contradiction can hide in the last clause.
3. For each existing entry that matters, classify the relation (contradicts / stale / supports / naming-variant / homonym-risk / extends) and the action: 'repair' (the value at that exact dotted path must change — give the full replacement text, which must keep every still-true fact of the old value and add the new one), 'add-sibling' (a new key next to it), 'custom_facts_repair' (give the verbatim existing text as current_text and the replacement as proposed_text), or 'none'.
4. For each entity the KB does not cover, propose the category and key — follow the naming and shape of the NEIGHBOURING keys in that category (plain string; {text, added_by, added_at, source} object; a structured object such as a hero, a gear piece or a skills entry — label it 'structured-object' and list its keys in \`fields\`; or a new sub-key inside an existing object — label it 'sub-key-of-existing-object'; the playbook table has every shape), and remember keys are retrieval labels: name them by what a member would ask about. Write the proposed text: complete sentences, absolute dates with the year, times with their zone, nothing the source does not state — where the source names a thing without saying what it IS, the text must say it is not documented and point at !suggest.
5. List ambiguity risks a small model would trip on: homonyms, incomplete enumerations, a caveat filed far from the value it qualifies, two entries that could disagree, relative dates, summary counts that the drop makes false.
Return the structured result only.`, { label: `diff:${s.key}`, phase: 'Diff vs knowledge base', schema: DIFF })))).filter(Boolean)
log(`diff: ${diffs.length}/${SECTIONS.length} sections; ${diffs.reduce((n, d) => n + d.existing.filter((e) => e.action !== 'none').length, 0)} existing entries need action, ${diffs.reduce((n, d) => n + d.new_entries.length, 0)} new entries proposed`)

// ── Phase 3 ─────────────────────────────────────────────────────────────────
const DRAFT = {
  type: 'object',
  properties: {
    fragment_path: { type: 'string' },
    repair_paths: { type: 'array', items: { type: 'string' } },
    custom_facts_added: { type: 'number' },
    custom_facts_repaired: { type: 'number' },
    dry_run_summary: { type: 'string' },
    open_questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['fragment_path', 'repair_paths', 'custom_facts_added', 'custom_facts_repaired', 'dry_run_summary', 'open_questions'],
}

phase('Draft fragment')
const draft = await agent(`${PRE}

TASK: write the knowledge fragment at ${FRAG_ABS} and dry-run it until it is exactly right. You are the ONLY writer in this phase.

INPUTS: the transcript file (authoritative — every fact must trace to it verbatim); the section diff reports below; the shape references data/knowledge-fragments/update-2026-08-28-official.json and data/knowledge-fragments/update-2026-09-17-version-1-1-9.json (_meta with source/confidence/transcript/conflictsWithLive, structured topics, custom_facts, custom_facts_repairs); docs/KNOWLEDGE-DROP-PLAYBOOK.md Step 3 (all of it, including the entry-shape table and 'Runes, as stored'); docs/KNOWLEDGE-GUIDE.md (only 'How to add data — use a fragment', 'Correcting a custom_fact' and 'How a repair reaches production'; where its examples disagree with the playbook table, the table wins).

RULES FOR THE FRAGMENT:
- _meta: {source, confidence, transcript, supersedes?, conflictsWithLive: [every dotted path whose live value the fragment changes — these are applied with --repair and MUST be exact, and each must be the path of a LEAF value, never a parent object]}. Record the source, who captured it, the capture date ${DATE}, and where the transcript is; if an earlier fragment under data/knowledge-fragments/ covered the same update, name it in supersedes and repair every name it introduced.
- _renames (same parent only; gated on --repair <from>, so list every from in conflictsWithLive) ONLY for a key this drop itself adds — a shipped key's old name stays on the production volume beside the new one. For a shipped key whose label is wrong, keep the key and repair its VALUE to state the resolution (playbook Step 3, rename rule).
- Fidelity: nothing the source does not state. Where the source names something without saying what it is, say what the source says and that the rest is not documented, pointing at !suggest — never guess, never turn silence into a negative, never define a term the source leaves undefined.
- A repaired value keeps every still-true fact of the old value and dates the superseded ones as history. Repair placeholders and summary counts the drop makes false. Caveat every copy of a fact you caveat (structured entry AND its custom-fact duplicate).
- Both spellings, once, inside the entry when the source and the KB disagree on a name; use the source's spelling for new names.
- Dates absolute with the year; times with their zone; distinguish what is live now from what is future-dated.
- Enumerations complete before qualifiers; caveats inside the value they qualify (or a sibling key in the same object), never only in custom_facts.
- Keys are retrieval labels: name new keys by what members will ask; prefer repairing an existing key to a versioned twin; match neighbouring naming and shape.
- custom_facts entries use ${CF_SHAPE}. Keep them few: one version/provenance fact, one headline list, the bug fixes — detail lives in structured entries. Use custom_facts_repairs (verbatim match_text) for stale custom facts; keep the first 40 characters of a community-contributed fact byte-identical when repairing it. Use --repair paths for stale structured values. Do not delete keys — repair them.
- Resolve disagreements between diff reports in favour of the transcript, then of the playbook, then of the KNOWLEDGE-GUIDE.

PROCESS: write the fragment; run \`node scripts/merge-knowledge.js ${FRAG_ABS} --dry-run\`; every conflict it reports must be a path you intend to repair (add it to conflictsWithLive) or a fact you must rethink — expect exactly one custom_facts[N] conflict per custom_facts_repairs entry and nothing else outside conflictsWithLive; then run the dry-run again adding \`--repair <path>\` for each conflictsWithLive path and \`--repair custom_facts\` if you have custom_facts_repairs (spawn node from a script so the flags are not word-split), and confirm it reports ONLY intended additions/repairs and no leftover conflicts. Read the two advisory lists at the bottom of the output ('oversized values', 'values that look truncated mid-sentence'): a path you repaired must not be in the second. Validate the JSON with node. Iterate until clean. Return the structured result, with dry_run_summary being the final dry-run output condensed, and open_questions for anything you had to decide that Kyle might want to override.

SECTION DIFF REPORTS:
${JSON.stringify(diffs, null, 1)}`, { label: 'draft', phase: 'Draft fragment', schema: DRAFT })
log(draft ? `draft: ${draft.repair_paths.length} repairs, +${draft.custom_facts_added} custom facts, ${draft.custom_facts_repaired} fact repairs` : 'draft: agent returned null')

// ── Phase 4 ─────────────────────────────────────────────────────────────────
const REVIEW = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
      where: { type: 'string' }, issue: { type: 'string' }, fix: { type: 'string' },
    }, required: ['severity', 'where', 'issue', 'fix'] } },
    uncovered_source_items: { type: 'array', items: { type: 'string' } },
  },
  required: ['lens', 'findings', 'uncovered_source_items'],
}
const LENSES = [
  { key: 'fidelity', prompt: `LENS: FIDELITY. Read the fragment sentence by sentence and trace EVERY factual claim to the transcript (and, for repaired values, to the old live value in data/knowledge.json for the parts that were kept). Flag anything not stated by the source: an inference, a hedge that adds a claim, a wrong number/date/time/range/tier, a name spelling that drifted, a mechanic described more specifically than the source does, a definition the source never gives, a negative drawn from silence, a release date the source never printed, a 'not documented' that is actually documented elsewhere in the KB (grep before flagging). Also list every source item that has NO representation anywhere in the fragment (uncovered_source_items).` },
  { key: 'contradiction', prompt: `LENS: CONTRADICTION AFTER MERGE. Simulate the post-merge knowledge base with the REAL merge, never a hand-rolled one: write a node script in ${SCRATCH} that does \`const { mergeFragment } = require('${REPO}/lib/knowledge-merge'); const frag = require('${FRAG_ABS}'); const { merged, conflicts } = mergeFragment(require('${REPO}/data/knowledge.json'), frag, { allowRepair: [...frag._meta.conflictsWithLive, ...(frag._renames || []).map((r) => r.from), 'custom_facts'] })\` — report any non-empty \`conflicts\` as a blocker (a conflictsWithLive typo, or a repair path that names a parent object instead of the leaf) — then walk \`merged\`. For every entity the fragment touches grep the merged corpus for any sentence that still disagrees with the fragment or that a small model could pick over it: superseded lists spelled out in full beside the new ones, uncaveated duplicate copies, placeholders that head a section, summary counts and enumerations the drop makes false ('13 Etched', '6 Rare, 6 Epic and 5 Legendary', 'any other skin is not documented'), 'newest/latest/in this update' pointing at the old thing, a 'not documented / named only' entry the fragment now documents beside instead of repairing, and a 'do not / never / not to be confused with' directive the source falsifies. Each finding must name the exact dotted path (or verbatim custom_fact text) and give the fix: an extra --repair path with full replacement text, a custom_facts_repairs entry, or a caveat placed inside the same object. Also check every conflictsWithLive path actually exists in the live KB (a typo there silently becomes an addition instead of a repair).` },
  { key: 'small-model', prompt: `LENS: SMALL-MODEL RETRIEVAL. The consumer is gpt-4o-mini reading the rendered KB. Check the fragment against docs/KNOWLEDGE-GUIDE.md 'Verify the ANSWER' and the CLAUDE.md gotchas: keys as retrieval labels (would a member's question retrieve this key?), enumerations complete before any qualifier, caveats inside the value they qualify, no relative dates, no two entries a model would have to choose between, future-dated items unmistakably future versus live-now items, homonyms disambiguated in-line. Then take these member questions and, for each, find the sentence(s) in the fragment or merged KB that answer it and judge whether a small model would answer correctly and unambiguously — flag the ones it would not: ${JSON.stringify(QUESTIONS)}.` },
]
phase('Adversarial review')
const reviews = (await parallel(LENSES.map((l) => () => agent(`${PRE}

The fragment under review is ${FRAG_ABS} (read it, the transcript, and data/knowledge.json as needed; write nothing under the repo — helpers go in ${SCRATCH}). Draft summary from its author: ${JSON.stringify(draft)}.

${l.prompt}

Be adversarial: default to reporting. Severity: blocker = a wrong or invented fact, or a contradiction that will flip an answer; major = ambiguity or placement that a small model will plausibly get wrong; minor = polish. Every finding needs a concrete fix. Return the structured result only.`, { label: `review:${l.key}`, phase: 'Adversarial review', schema: REVIEW })))).filter(Boolean)
const allFindings = reviews.flatMap((r) => r.findings.map((f) => ({ lens: r.lens, ...f })))
const uncovered = reviews.flatMap((r) => r.uncovered_source_items)
log(`review: ${allFindings.filter((f) => f.severity === 'blocker').length} blockers, ${allFindings.filter((f) => f.severity === 'major').length} major, ${allFindings.filter((f) => f.severity === 'minor').length} minor; ${uncovered.length} uncovered source items`)

const FIX = {
  type: 'object',
  properties: {
    applied: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'string' } },
    repair_paths: { type: 'array', items: { type: 'string' } },
    has_custom_facts_repairs: { type: 'boolean' },
    final_dry_run: { type: 'string' },
  },
  required: ['applied', 'rejected', 'repair_paths', 'has_custom_facts_repairs', 'final_dry_run'],
}
const fixed = await agent(`${PRE}

TASK: you are the only writer. Apply the review findings below to ${FRAG_ABS}. Apply every blocker and major unless the transcript proves the reviewer wrong (then reject it and say why, citing the transcript line). Apply minors when they are cheap and safe. Cover every 'uncovered source item' that is a real gap. Keep the fragment rules from docs/KNOWLEDGE-DROP-PLAYBOOK.md Step 3: verbatim fidelity to the transcript, absolute dates, complete enumerations, caveats in place, exact leaf-level conflictsWithLive paths, no key deletions, _renames only for keys this drop adds, custom_facts shape ${CF_SHAPE}.
When done: validate the JSON with node; run \`node scripts/merge-knowledge.js ${FRAG_ABS} --dry-run\` and confirm every reported conflict is in conflictsWithLive (plus one custom_facts[N] line per custom_facts_repairs entry); then run it again with \`--repair <path>\` for each conflictsWithLive path (and \`--repair custom_facts\` if custom_facts_repairs is present) and confirm it reports only intended additions/repairs. Return the structured result; final_dry_run is that last output condensed, and repair_paths must equal the fragment's conflictsWithLive.

FINDINGS (${allFindings.length}):
${JSON.stringify(allFindings, null, 1)}

UNCOVERED SOURCE ITEMS:
${JSON.stringify(uncovered, null, 1)}`, { label: 'fix', phase: 'Adversarial review', schema: FIX })

return {
  reconciled,
  diffs_summary: diffs.map((d) => ({ section: d.section, actions: d.existing.filter((e) => e.action !== 'none').map((e) => `${e.action} ${e.path}`), new_entries: d.new_entries.map((n) => n.proposed_path), ambiguity_risks: d.ambiguity_risks })),
  draft,
  findings: allFindings,
  uncovered,
  fixed,
}
