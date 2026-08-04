#!/usr/bin/env node
/**
 * One-off script: posts three XY Elder announcements for the v3.12 release.
 *
 *   1. #changelog                — richer release announcement (the auto-post
 *                                  on deploy got chunked into bullet lists; this
 *                                  is the human-readable narrative version).
 *   2. #community-ai-discussion  — community-friendly explainer of the vision
 *                                  feature, who can use it, where to go if not.
 *   3. XYIAN-Guild leadership ch — officer-targeted explainer of how XYIAN
 *                                  OFFICIAL / Admin / Moderator / Arch Legend
 *                                  can use vision in #arch-ai.
 *
 * Discovers the guild leadership channel by name. Prefers `leadership-roundtable`
 * and falls back to `rune-gear-strategy-and-presets` if the former isn't
 * present. Both live under the private `XYIAN-Guild` category.
 *
 * Usage:
 *   node scripts/post-v3.12-announcements.js              # post all three
 *   node scripts/post-v3.12-announcements.js --dry        # print embeds only
 *   node scripts/post-v3.12-announcements.js --only=cha   # cha|com|guild
 */

const path = require('path');
const envDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(envDir, '.env') });
require('dotenv').config({ path: path.join(envDir, '.env.local'), override: true });

const https = require('https');

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('❌ DISCORD_TOKEN not set'); process.exit(1); }

const GUILD_ID = '1419944148701679686';
const CHANNELS = {
	changelog: '1424784471395274803',
	communityAi: '1424785709914521701',
};
const FALLBACK_LEADERSHIP_CHANNEL = '1487167729910677564'; // rune-gear-strategy-and-presets

const args = process.argv.slice(2);
const isDry = args.includes('--dry');
const onlyArg = (args.find(a => a.startsWith('--only=')) || '').split('=')[1] || '';

function discordRequest(method, apiPath, body) {
	return new Promise((resolve, reject) => {
		const payload = body ? JSON.stringify(body) : null;
		const options = {
			hostname: 'discord.com',
			path: '/api/v10' + apiPath,
			method,
			headers: {
				'Authorization': 'Bot ' + TOKEN,
				...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
			},
		};
		const req = https.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => { data += chunk; });
			res.on('end', () => {
				const parsed = (() => { try { return JSON.parse(data); } catch { return data; } })();
				if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`));
				else resolve(parsed);
			});
		});
		req.on('error', reject);
		if (payload) req.write(payload);
		req.end();
	});
}

async function findLeadershipChannel() {
	const channels = await discordRequest('GET', `/guilds/${GUILD_ID}/channels`);
	if (!Array.isArray(channels)) return FALLBACK_LEADERSHIP_CHANNEL;
	const byName = {};
	for (const c of channels) byName[c.name] = c;
	for (const candidate of ['leadership-roundtable', 'leadership', 'officers', 'guild-chat', 'xyian-leadership']) {
		if (byName[candidate]) return byName[candidate].id;
	}
	return FALLBACK_LEADERSHIP_CHANNEL;
}

// Each builder returns the embed payload as Discord expects it (NOT a discord.js
// EmbedBuilder — we're hitting the raw HTTP API, so plain JSON is the right
// shape). All descriptions are kept under 4096 chars to avoid the same overflow
// that broke the v3.12.0 auto-post.
function changelogEmbed() {
	return {
		title: '📦 XYIAN Bot v3.12.0 — Vision Q&A & the Learning Loop',
		color: 0x00ff88,
		description: [
			'A larger release than usual. Two big things and one small one.',
			'',
			'**📸 1. I can read screenshots now (in #arch-ai)**',
			'Drop an Archero 2 screenshot in <#1424322391160393790> with or without a question and I\'ll observe gear, stats panels, equipped runes/blessings/skills, sacred hall, event progress, leaderboard rank, and the active menu — using the same verified knowledge base I already use for text answers.',
			'',
			'**🔐 2. Vision is gated to trusted roles**',
			'`XYIAN OFFICIAL` · `Admin` · `Moderator` · `Arch Legend` (1500 strategy XP).',
			'Anyone else who attaches an image gets a polite redirect embed pointing at <#1424785709914521701> — **no OpenAI call is made for non-trusted users**, so vision spend is bounded by trust, not message volume.',
			'',
			'**💰 Cost guardrails (built in, no per-deploy tuning)**',
			'• Max **2 images** per message',
			'• `detail: low` (~85 tokens/image vs thousands at `high`)',
			'• Per-user **60-second cooldown** between vision calls',
			'• All exposed via `CONFIG.features` — tunable without redeploy logic changes',
			'',
			'**🧠 3. The learning loop**',
			'When a screenshot reveals a *universal* fact I don\'t already know (e.g. a rune\'s effect, a new event mechanic), I queue it as a **suggestion** with `source: vision`, the contributing user, and the screenshot URL. Personal stuff (your roll values, upgrade levels, owned counts, currency, rank) is explicitly excluded by the prompt rules — never ends up in `knowledge.json`.',
			'',
			'Mods review pending entries with `!suggestions`, then approve into structured categories:',
			'```!approve <#> runes frostshard_rune```',
			'…or with a cleanup override in the same shot:',
			'```!approve <#> runes frostshard_rune | Frostshard slows enemies on hit, stacks 3x.```',
			'Approved entries land as `{ text, added_by, added_at, source }` in the right top-level category — no more dumping everything into `custom_facts`.',
			'',
			'**🛡️ Owner kill switch — `!ai status` / `!ai on` / `!ai off`**',
			'Master switch for ALL OpenAI Q&A in <#1424322391160393790> (text + vision). When off, users see an offline embed; no calls are made. Resets to `on` on every Railway redeploy by design — the source of truth is code, not state.',
			'',
			'**🪓 Plus a v3.12.1 patch (already live)**',
			'The v3.12.0 startup post failed because its release notes blew Discord\'s 4096-char embed limit. v3.12.1 chunks long descriptions across multiple embeds and adds an owner-only `!post-changelog [version]` command for manual backfills.',
			'',
			'**📦 First-mount Railway Volume seeder (also v3.12.0)**',
			'I now ship a `seeds/knowledge.json` snapshot baked into the image. On startup, if the live `data/knowledge.json` is missing (e.g. a fresh Railway Volume just got attached), the seeder copies the snapshot in. Idempotent and non-destructive. This unblocks volume-backed cross-deploy persistence — `!approve` writes now survive redeploys directly. (Volume was attached tonight; verify: I came back online with `109 facts loaded`, not `0`.)',
		].join('\n'),
		footer: { text: 'XYIAN Bot — v3.12.0 release announcement (manual)' },
		timestamp: new Date().toISOString(),
	};
}

function communityEmbed() {
	return {
		title: '📸 Arch AI now reads screenshots',
		color: 0x00ff88,
		description: [
			'Hey <@&1488667650841116693> · <@&1424144223501815808> · <@&1424144920096014448> · <@&1492192809426620566> — quick heads-up.',
			'',
			'Starting tonight, I can analyze screenshots in <#1424322391160393790>. Drop an image with or without a question and I\'ll look at gear, runes, stats, sacred hall, event progress, leaderboard rank, the active menu — anything Archero 2 has put in front of you.',
			'',
			'**Who has access**',
			'> `XYIAN OFFICIAL` · `Admin` · `Moderator` · `Arch Legend` (1500 strategy XP).',
			'',
			'If you\'re not on that list and you attach an image in <#1424322391160393790>, I won\'t be rude about it — you\'ll get a friendly redirect embed pointing back here, and zero OpenAI calls will be made on your behalf. That keeps the bill bounded and the feature trustworthy.',
			'',
			'**For everyone (vision or not)**',
			'• Text questions in <#1424322391160393790> still work for anyone with the **AI Enabled** role (react with 🤖 on a welcome message to grab it).',
			'• Casual chat about AI / the bot / what to ask it lives here in this channel.',
			'',
			'**A note on what I learn from screenshots**',
			'I never store your personal stats — your roll values, upgrade levels, owned counts, currency, rank, power level. None of that touches the knowledge base. What I *will* do: if your screenshot shows a *universal* fact about Archero 2 that I didn\'t already know (e.g. a rune effect, a new event mechanic), I\'ll quietly queue it as a moderator-reviewable suggestion. Mods approve → it lands in `knowledge.json` → all future Q&A benefits.',
			'',
			'I\'m still a learning machine. Every approved fact makes me a little less embarrassed about the gaps.',
		].join('\n'),
		footer: { text: 'XYIAN Bot — v3.12.0' },
		timestamp: new Date().toISOString(),
	};
}

function leadershipEmbed() {
	return {
		title: '🛡️ XYIAN OFFICIAL — vision is live for you in #arch-ai',
		color: 0xFFD700,
		description: [
			'A new tool for officers and verified guild members specifically.',
			'',
			'**What you can do**',
			'Drop a screenshot in <#1424322391160393790> with or without a question. I\'ll read gear panels, equipped runes/blessings/skills, sacred hall, event progress, leaderboard rank, the active menu — anything Archero 2 has rendered.',
			'',
			'**Why this is for you, not the public**',
			'The vision pipeline is gated to `XYIAN OFFICIAL`, `Admin`, `Moderator`, and `Arch Legend` only. Anyone else who attaches an image gets a redirect embed; no OpenAI call is made for them. So your screenshots get full attention; nobody else can drive vision spend.',
			'',
			'**Cost guardrails (so we don\'t need to debate this)**',
			'• Max **2 images** per message',
			'• `detail: low` — efficient image tokenization',
			'• Per-user **60-second cooldown** — prevents accidental spam',
			'',
			'**The useful pattern: rune & gear analysis**',
			'Screenshot your rune board / sacred hall / equipped gear → ask "what should I prioritize?" or "is this build resonating?" → I cross-reference the verified knowledge base and answer in-character.',
			'',
			'**The other useful pattern: teach the wizard something**',
			'If your screenshot shows a *universal* fact I don\'t already know (rune effect, event mechanic, etc.), I\'ll queue it as a suggestion. You\'ll see something like *"📸 I noticed N things I don\'t have on file yet — queued for admin review."* `<@&1424144223501815808>` and mods approve via `!approve <#> [category] [key]` and it lands in the right structured slot — `runes.frostshard_rune`, not a flat `custom_facts` dump.',
			'',
			'**Things explicitly NOT recorded**',
			'Roll values, upgrade levels, owned counts, personal currency, ranks, power level. The prompt forbids the model from treating those as facts.',
			'',
			'**Owner-only kill switch**',
			'`!ai status` / `!ai on` / `!ai off`. If something goes sideways, Kyle can yank the whole AI Q&A subsystem in two characters.',
			'',
			'I\'ll let you go. Happy testing — and if I get something wrong about your gear, blame the screenshot first, the model second, and me third.',
		].join('\n'),
		footer: { text: 'XYIAN Bot — for XYIAN-Guild leadership' },
		timestamp: new Date().toISOString(),
	};
}

async function postEmbed(channelId, embed, label) {
	if (isDry) {
		console.log(`\n=== [DRY RUN] Would post to ${label} (${channelId}) ===`);
		console.log(JSON.stringify(embed, null, 2));
		console.log(`(description length: ${(embed.description || '').length})`);
		return null;
	}
	const res = await discordRequest('POST', `/channels/${channelId}/messages`, { embeds: [embed] });
	console.log(`✅ Posted to #${label} (${channelId}) — message id: ${res.id}`);
	console.log(`   https://discord.com/channels/${GUILD_ID}/${channelId}/${res.id}`);
	return res;
}

async function main() {
	const want = onlyArg ? onlyArg.toLowerCase().slice(0, 3) : '';

	if (isDry) {
		// Skip the API call for the channel lookup — print embeds only and report
		// description sizes so we can verify they fit Discord's 4096-char cap.
		if (!want || want === 'cha') await postEmbed(CHANNELS.changelog, changelogEmbed(), 'changelog');
		if (!want || want === 'com') await postEmbed(CHANNELS.communityAi, communityEmbed(), 'community-ai-discussion');
		if (!want || want === 'gui') await postEmbed('???-discovered-at-runtime', leadershipEmbed(), 'XYIAN-Guild leadership channel');
		return;
	}

	const leadershipId = (want === '' || want === 'gui') ? await findLeadershipChannel() : null;

	if (!want || want === 'cha') {
		await postEmbed(CHANNELS.changelog, changelogEmbed(), 'changelog');
	}
	if (!want || want === 'com') {
		await postEmbed(CHANNELS.communityAi, communityEmbed(), 'community-ai-discussion');
	}
	if (!want || want === 'gui') {
		await postEmbed(leadershipId, leadershipEmbed(), 'XYIAN-Guild leadership channel');
	}
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
