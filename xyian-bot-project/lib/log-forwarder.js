'use strict';

// ── Debug log forwarder ──────────────────────────────────────────────────────
// Streams runtime errors/warnings to #debug-logs WITHOUT double-posting the
// explicit sendToAdmin alerts already scattered through bot.js. The bot's
// console still prints normally (Railway logs are unaffected); a filtered,
// deduped copy is batched and forwarded via a caller-injected `send`.
//
// Pure and dependency-injected (send + clock) so it can be unit-tested with no
// Discord connection — see test/log-forwarder.test.js.

// Fuzzy fingerprint for dedup: strip markdown/emoji/punctuation, lowercase, cap.
function alertFingerprint(text) {
    return String(text || '')
        .replace(/[*_`>#~]/g, '')
        .replace(/[^\p{L}\p{N} ]/gu, ' ') // drop emoji + punctuation
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .slice(0, 80);
}

// Pull comparable text out of a sendToAdmin payload (string, {content}, or
// {embeds:[EmbedBuilder|data]}).
function extractAlertText(content) {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object') {
        let text = content.content || '';
        const e = content.embeds && content.embeds[0];
        if (e) {
            const data = typeof e.toJSON === 'function' ? e.toJSON() : e;
            text += ' ' + (data.title || '') + ' ' + (data.description || '');
        }
        return text;
    }
    return '';
}

function fmtArg(a) {
    if (a instanceof Error) return a.stack || a.message;
    if (a && typeof a === 'object') {
        try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
}

/**
 * @param {object} opts
 * @param {(text:string)=>Promise<void>} opts.send  posts one batch to the channel
 * @param {()=>number} [opts.now]  clock (injectable for tests)
 */
function createLogForwarder({
    send,
    now = () => Date.now(),
    flushMs = 20_000,
    maxLines = 15,
    dedupWindowMs = 20_000,
    maxChars = 1800,
} = {}) {
    const buffer = [];
    let dropped = 0;
    const recentAlerts = []; // { fp, at }
    let timer = null;

    function pruneAlerts() {
        const cutoff = now() - dedupWindowMs;
        while (recentAlerts.length && recentAlerts[0].at < cutoff) recentAlerts.shift();
        if (recentAlerts.length > 50) recentAlerts.splice(0, recentAlerts.length - 50);
    }

    // Record an explicit alert so a matching console line gets suppressed.
    function noteExplicitAlert(content) {
        const fp = alertFingerprint(extractAlertText(content));
        if (fp) recentAlerts.push({ fp, at: now() });
        pruneAlerts();
    }

    // Would this console line just duplicate a recent explicit alert? Uses
    // significant-token overlap (robust to different framing around the same
    // message) rather than prefix matching. Alerts with <2 significant tokens
    // are too generic to dedup safely, so they never suppress.
    function significantTokens(fp) {
        return new Set(fp.split(' ').filter((w) => w.length >= 4));
    }
    function isDuplicateOfAlert(line) {
        const fp = alertFingerprint(line);
        if (!fp) return true; // nothing meaningful to forward
        const lineTokens = significantTokens(fp);
        if (lineTokens.size < 2) return false;
        const cutoff = now() - dedupWindowMs;
        for (const a of recentAlerts) {
            if (a.at < cutoff) continue;
            const alertTokens = significantTokens(a.fp);
            if (alertTokens.size < 2) continue;
            let common = 0;
            for (const t of lineTokens) if (alertTokens.has(t)) common++;
            const smaller = Math.min(lineTokens.size, alertTokens.size);
            if (common / smaller >= 0.6) return true;
        }
        return false;
    }

    function capture(line) {
        if (!line) return;
        if (buffer.length >= maxLines) { dropped++; return; }
        buffer.push(line);
    }

    async function flush() {
        if (buffer.length === 0) return;
        const lines = buffer.splice(0, buffer.length).filter((l) => !isDuplicateOfAlert(l));
        const d = dropped; dropped = 0;
        if (lines.length === 0) return;
        const extra = d > 0 ? `\n…and ${d} more suppressed` : '';
        const body = lines.join('\n').replace(/```/g, "'''").slice(0, maxChars);
        try {
            await send('```\n' + body + extra + '\n```');
        } catch {
            // Swallow — the forwarder must NEVER log through the intercepted
            // console, or a failing send would feed itself forever.
        }
    }

    function start() {
        if (timer) return;
        timer = setInterval(() => { flush().catch(() => {}); }, flushMs);
        if (timer && typeof timer.unref === 'function') timer.unref();
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    return {
        noteExplicitAlert,
        isDuplicateOfAlert,
        capture,
        flush,
        start,
        stop,
        _state: { buffer, recentAlerts },
    };
}

// Wrap a console so error lines (all) and log lines that look like problems
// (⚠️/❌/🚨/🛑) are captured by the forwarder, while real stdout output is
// preserved. `console` is injectable for tests. Returns a restore() fn.
function attachConsole(forwarder, { console: con = console } = {}) {
    const origError = con.error.bind(con);
    const origLog = con.log.bind(con);
    con.error = (...args) => {
        origError(...args);
        try { forwarder.capture(args.map(fmtArg).join(' ')); } catch { /* never break console */ }
    };
    con.log = (...args) => {
        origLog(...args);
        try {
            const text = args.map(fmtArg).join(' ');
            if (/^\s*(⚠️|❌|🚨|🛑)/u.test(text)) forwarder.capture(text);
        } catch { /* never break console */ }
    };
    return () => { con.error = origError; con.log = origLog; };
}

module.exports = { createLogForwarder, attachConsole, alertFingerprint, extractAlertText, fmtArg };
