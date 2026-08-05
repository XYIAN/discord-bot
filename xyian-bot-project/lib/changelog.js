'use strict';

// ── CHANGELOG.md parsing ─────────────────────────────────────────────────────
// CHANGELOG.md is the single source of truth for the bot's version and for the
// release notes posted to #changelog on boot. Extracted from bot.js so the
// parsing is testable — it silently failed for two releases and nobody noticed
// until the deploy log was read line by line.
//
// Entries come in two shapes, both of which must work:
//
//   BULLET   - `!role @user add|remove <role>` — add or remove a role
//   PROSE    **Arena modes (+55).** Ten of these collided with existing values…
//
// Only the bullet shape was ever handled. A prose entry parsed to zero lines,
// so v3.17.0 and v3.18.0 deployed fine, logged "no changelog entries", and
// their release notes never reached the community.

/** Split the section for one `## [x.y.z]` entry out of the file. */
function sectionFor(md, version) {
    const startIdx = md.indexOf(`## [${version}]`);
    if (startIdx === -1) return null;
    const after = md.slice(startIdx);
    const next = after.indexOf('\n## [');
    return next > -1 ? after.slice(0, next) : after;
}

/**
 * Pull the postable blocks out of one entry's section, in document order.
 *
 * Every non-empty line survives except the `## [x.y.z]` title, which the embed
 * already shows as its own heading. Each block is tagged so the renderer can
 * treat a bullet list and a paragraph differently.
 *
 * An earlier version had bullets win outright whenever any were present, so
 * that an entry pairing a paragraph of preamble with a bullet list posted just
 * the list. That reads fine until an entry has *substantial* prose AND a bullet
 * list — v3.19.0 was one, and the rule would have silently dropped its entire
 * first half. Dropping content quietly is the exact failure this module was
 * extracted to fix, so order is preserved and nothing is discarded.
 *
 * Discord renders `###` and `**bold**` inside an embed description, so prose is
 * passed through untouched.
 *
 * @returns {{blocks: Array<{kind:'bullet'|'prose', text:string}>, lines: string[]}}
 *          `lines` is the plain text of each block, for counting and messages.
 */
function linesFromSection(section) {
    const blocks = String(section || '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !/^## \[/.test(l))
        .map((l) =>
            /^- /.test(l)
                ? { kind: 'bullet', text: l.replace(/^- /, '') }
                : { kind: 'prose', text: l });

    return { blocks, lines: blocks.map((b) => b.text) };
}

/**
 * Version + release notes for the newest entry in the file.
 * @returns {{version: string, blocks: object[], lines: string[]}}
 */
function parseChangelog(md) {
    const text = String(md || '');
    const versionMatch = text.match(/^## \[(\d+\.\d+\.\d+)\]/m);
    const version = versionMatch ? versionMatch[1] : '0.0.0';

    const firstEntry = text.indexOf('## [');
    if (firstEntry === -1) return { version, blocks: [], lines: [] };
    const secondEntry = text.indexOf('## [', firstEntry + 1);
    const section = secondEntry > -1 ? text.slice(firstEntry, secondEntry) : text.slice(firstEntry);

    return { version, ...linesFromSection(section) };
}

/**
 * Release notes for one specific historical version — backs
 * `!post-changelog <version>` for releases whose original deploy failed to get
 * the embed out.
 * @returns {{blocks: object[], lines: string[]}|null} null when the version is absent
 */
function linesForVersion(md, targetVersion) {
    const section = sectionFor(String(md || ''), targetVersion);
    if (section === null) return null;
    return linesFromSection(section);
}

module.exports = { parseChangelog, linesForVersion, linesFromSection };
