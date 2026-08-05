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
 * Pull the postable lines out of one entry's section.
 *
 * Bullets win when present — they are the deliberate, already-formatted shape.
 * Prose is the fallback rather than the default so that an entry mixing a
 * paragraph of preamble with a bullet list still posts just the bullets, which
 * is what the older entries expect.
 *
 * @returns {{lines: string[], style: 'bullets'|'prose'}}
 */
function linesFromSection(section) {
    const raw = String(section || '').split('\n');

    const bullets = raw
        .filter((l) => /^- /.test(l.trim()))
        .map((l) => l.trim().replace(/^- /, ''));
    if (bullets.length) return { lines: bullets, style: 'bullets' };

    // Prose: keep the `###` subheading and the paragraphs, drop the `## [x.y.z]`
    // title (the embed already shows the version) and blank lines. Discord
    // renders `###` and `**bold**` inside an embed description, so the text is
    // passed through untouched.
    const prose = raw
        .map((l) => l.trim())
        .filter((l) => l && !/^## \[/.test(l));
    return { lines: prose, style: 'prose' };
}

/**
 * Version + release notes for the newest entry in the file.
 * @returns {{version: string, lines: string[], style: string}}
 */
function parseChangelog(md) {
    const text = String(md || '');
    const versionMatch = text.match(/^## \[(\d+\.\d+\.\d+)\]/m);
    const version = versionMatch ? versionMatch[1] : '0.0.0';

    const firstEntry = text.indexOf('## [');
    if (firstEntry === -1) return { version, lines: [], style: 'prose' };
    const secondEntry = text.indexOf('## [', firstEntry + 1);
    const section = secondEntry > -1 ? text.slice(firstEntry, secondEntry) : text.slice(firstEntry);

    return { version, ...linesFromSection(section) };
}

/**
 * Release notes for one specific historical version — backs
 * `!post-changelog <version>` for releases whose original deploy failed to get
 * the embed out.
 * @returns {{lines: string[], style: string}|null} null when the version is absent
 */
function linesForVersion(md, targetVersion) {
    const section = sectionFor(String(md || ''), targetVersion);
    if (section === null) return null;
    return linesFromSection(section);
}

module.exports = { parseChangelog, linesForVersion, linesFromSection };
