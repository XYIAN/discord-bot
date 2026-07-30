'use strict';

// Credits contributions found by audit-contributions.js that were never
// recorded in the ledger. Approved on the owner's instruction ("approve them
// all, especially faria / XYIAN OFFICIAL"). Writes to data/ AND seeds/ so the
// credit survives the volume mount.
//
//   node scripts/credit-missing-contributions.js --dry-run
//   node scripts/credit-missing-contributions.js --apply

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const OWNER_ID = '528059607826825226';
const OWNER_NAME = 'XYIAN';
const TODAY = new Date().toISOString();

// From scripts/audit-contributions.js. The 2026-03-18 "DMG: it'as a mixed bag"
// message is deliberately excluded — it's a typo-variant of record #32, already
// credited, and re-adding it would double-count faria.
const MISSING = [
    {
        text: 'Twinborn forging is only accessible after you unlock your first mythic rune.',
        by: 'faria88pt', userId: '1429274216657719368', at: '2026-07-29T00:00:00.000Z',
    },
    {
        text: 'For PvP mixed set — Weapon: Crossbow, Amulet: Griffin Amulet, Ring: Griffin Ring, Helmet: Dragoon Helm.',
        by: 'faria88pt', userId: '1429274216657719368', at: '2026-06-23T00:00:00.000Z',
    },
    {
        text: 'Twinborn forging can only be done with specific runes of the same type, for example a Frost Shock rune.',
        by: '_xyian', userId: OWNER_ID, at: '2026-07-29T00:00:00.000Z',
    },
    {
        text: 'Twinborn runes are a new method of merging runes together and can be done from Legendary rarity or higher.',
        by: '_xyian', userId: OWNER_ID, at: '2026-07-29T00:00:00.000Z',
    },
];

function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 60); }

function nextId(list) {
    return list.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
}

function creditInto(suggestionsPath, knowledgePath) {
    const suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
    const kb = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
    if (!Array.isArray(kb.custom_facts)) kb.custom_facts = [];

    const haveSugg = new Set(suggestions.map((s) => norm(s.text)));
    const haveFact = new Set();
    const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
            if (typeof o.text === 'string') haveFact.add(norm(o.text));
            Object.values(o).forEach(walk);
        }
    };
    walk(kb);

    let credited = 0;
    let facted = 0;
    for (const m of MISSING) {
        if (!haveSugg.has(norm(m.text))) {
            suggestions.push({
                id: nextId(suggestions),
                text: m.text,
                by: m.by,
                userId: m.userId,
                at: m.at,
                status: 'approved',
                approvedVia: 'history_audit',
                approvedBy: OWNER_ID,
                approvedByName: `${OWNER_NAME} (history audit)`,
                note: 'Credited from #arch-ai history; contribution was never recorded.',
            });
            haveSugg.add(norm(m.text));
            credited++;
        }
        if (!haveFact.has(norm(m.text))) {
            kb.custom_facts.push({
                text: m.text,
                added_by: m.by,
                added_at: m.at.split('T')[0],
                source: 'history_audit',
            });
            haveFact.add(norm(m.text));
            facted++;
        }
    }

    if (APPLY) {
        if (credited) fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));
        if (facted) fs.writeFileSync(knowledgePath, JSON.stringify(kb, null, 2));
    }
    return { credited, facted };
}

for (const dir of ['data', 'seeds']) {
    const s = path.join(__dirname, '..', dir, 'suggestions.json');
    const k = path.join(__dirname, '..', dir, 'knowledge.json');
    if (!fs.existsSync(s) || !fs.existsSync(k)) { console.log(`skip ${dir}/ (missing files)`); continue; }
    const r = creditInto(s, k);
    console.log(`${APPLY ? 'APPLIED' : 'would apply'} → ${dir}/: +${r.credited} credited suggestion(s), +${r.facted} knowledge fact(s)`);
}
if (!APPLY) console.log('\nDry run — re-run with --apply to write.');
