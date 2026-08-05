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

/**
 * A release heading: `## [1.2.3]` at the start of a line.
 *
 * Anchored to a line start AND to a semantic version on purpose. A bare
 * indexOf('## [') matches any heading anywhere, including one inside a code
 * fence and — far more likely — a conventional `## [Unreleased]` section. With
 * that, the version came from the first SEMVER heading while the notes came
 * from whatever heading appeared first in the file, so adding an Unreleased
 * section would have made the bot announce the real release with the
 * work-in-progress notes underneath it.
 */
const RELEASE_HEADING = /^## \[(\d+\.\d+\.\d+)\]/m;
/** Any `## [...]` heading — the boundary a section ends at, Unreleased included. */
const ANY_ENTRY_HEADING = /^## \[/m;

/** Where a section that starts at `from` ends. */
function sectionEnd(md, from) {
    const rest = md.slice(from);
    // Skip the heading itself before looking for the next one.
    const firstNewline = rest.indexOf('\n');
    if (firstNewline === -1) return md.length;
    const after = rest.slice(firstNewline);
    const m = after.match(ANY_ENTRY_HEADING);
    return m ? from + firstNewline + m.index : md.length;
}

/** Split the section for one `## [x.y.z]` entry out of the file. */
function sectionFor(md, version) {
    const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm');
    const m = md.match(heading);
    if (!m) return null;
    return md.slice(m.index, sectionEnd(md, m.index));
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
    // Find the newest RELEASE heading, and read the notes from that same
    // heading — not from whatever `## [` appears first. Deriving the version
    // from one heading and the body from another is how an `## [Unreleased]`
    // section would have made the bot announce a real release with
    // work-in-progress notes.
    const m = text.match(RELEASE_HEADING);
    if (!m) return { version: '0.0.0', blocks: [], lines: [] };

    const section = text.slice(m.index, sectionEnd(text, m.index));
    return { version: m[1], ...linesFromSection(section) };
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
