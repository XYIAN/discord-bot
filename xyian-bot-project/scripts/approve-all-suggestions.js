#!/usr/bin/env node
/**
 * One-off: add every approved suggestion from suggestions.json into knowledge.json
 * custom_facts (skip only exact/obvious duplicates), then send DMs as if admin approved.
 * Usage: node scripts/approve-all-suggestions.js [--dry-run]
 */

const path = require('path');
const fs = require('fs');
const envDir = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(envDir, '.env') });
require('dotenv').config({ path: path.join(envDir, '.env.local'), override: true });

const KNOWLEDGE_PATH = path.join(envDir, 'data', 'knowledge.json');
const SUGGESTIONS_PATH = path.join(envDir, 'data', 'suggestions.json');
const dryRun = process.argv.includes('--dry-run');

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function alreadyInFacts(suggestionText, existingFacts) {
  const head = suggestionText.trim().substring(0, 60);
  return existingFacts.some(f => {
    const t = (f.text || '').trim();
    return t.substring(0, 60) === head || t.includes(head) || suggestionText.includes(t.substring(0, 60));
  });
}

(async () => {
  const knowledge = loadJSON(KNOWLEDGE_PATH);
  const suggestions = loadJSON(SUGGESTIONS_PATH) || [];
  if (!knowledge) { console.error('❌ No knowledge.json'); process.exit(1); }

  const approved = suggestions.filter(s => s.status === 'approved');
  const existing = knowledge.custom_facts || [];
  const existingTexts = existing.map(f => (f.text || '').trim());

  const toAdd = [];
  for (const s of approved) {
    const text = (s.text || '').trim();
    if (!text || text.length < 10) continue;
    if (alreadyInFacts(text, existing.concat(toAdd))) continue;
    toAdd.push({
      text,
      added_by: s.by || 'unknown',
      added_at: (s.at || '').toString().substring(0, 10) || '2026-03-01',
    });
  }

  console.log(`📋 Approved suggestions: ${approved.length}`);
  console.log(`   Already in custom_facts (by content): ${existing.length}`);
  console.log(`   New facts to add: ${toAdd.length}`);

  if (toAdd.length === 0) {
    console.log('✅ Nothing to add — all suggestion content already in knowledge.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Would add:');
    toAdd.forEach((f, i) => console.log(`   ${i + 1}. [${f.added_by}] ${f.text.substring(0, 80)}...`));
    process.exit(0);
  }

  knowledge.custom_facts = existing.concat(toAdd);
  saveJSON(KNOWLEDGE_PATH, knowledge);
  console.log(`\n✅ Added ${toAdd.length} facts to knowledge.json. custom_facts count: ${knowledge.custom_facts.length}`);

  // DMs: use same pattern as send-sync-dm.js — one DM per user with approved suggestions
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.log('⚠️ DISCORD_TOKEN not set — skipping DMs. Run send-sync-dm.js per user if needed.');
    process.exit(0);
  }

  const byUser = {};
  approved.forEach(s => {
    const u = s.by || 'unknown';
    if (!byUser[u]) byUser[u] = { userId: s.userId, suggestions: [] };
    byUser[u].suggestions.push(s);
  });

  const https = require('https');
  function discordRequest(method, apiPath, body) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const opts = {
        hostname: 'discord.com',
        path: '/api/v10' + apiPath,
        method,
        headers: {
          'Authorization': 'Bot ' + token,
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  const TIER = [{ name: 'Arch Scholar', threshold: 5 }, { name: 'Arch Sage', threshold: 15 }];
  for (const [username, data] of Object.entries(byUser)) {
    const total = data.suggestions.length;
    const nextTier = TIER.find(t => t.threshold > total);
    const progress = nextTier
      ? `You now have **${total}** approved contribution${total === 1 ? '' : 's'}. ${nextTier.threshold - total} more until **${nextTier.name}**!`
      : `You now have **${total}** approved contributions. You've reached the highest tier!`;
    const factLines = data.suggestions.map(s => `> ${(s.text || '').substring(0, 400)}${(s.text || '').length > 400 ? '…' : ''}`).join('\n\n');
    const body = `✅ **Your contributions have been approved!**\n\n` +
      `${total} of your facts have been added to the bot's knowledge base.\n\n**Fact(s):**\n\n${factLines}\n\n${progress}\n\n*Thank you for making the bot smarter for everyone!*`;
    const content = body.length > 2000 ? body.substring(0, 1990) + '\n\n…_(truncated)_' : body;

    try {
      const dmChannel = await discordRequest('POST', '/users/@me/channels', { recipient_id: data.userId });
      if (dmChannel && dmChannel.id) {
        await discordRequest('POST', `/channels/${dmChannel.id}/messages`, { content });
        console.log(`📬 DM sent to ${username}`);
      } else {
        console.log(`⚠️ Could not open DM with ${username} (${data.userId})`);
      }
    } catch (e) {
      console.log(`⚠️ DM failed for ${username}:`, e.message || e);
    }
  }

  console.log('\n✅ Done. Update CHANGELOG and commit.');
})();
