# 🚀 Railway Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Core Files Present
- [x] `ultimate-xyian-bot.js` - Main bot file
- [x] `working-rag-system.js` - RAG system
- [x] `data/real-structured-data/unified_game_data.json` - Game data
- [x] `package.json` - Dependencies
- [x] `railway.json` - Railway config
- [x] `.env` - Environment variables (not in git)

### 2. Dependencies Check
All required npm packages in `package.json`:
- [x] `discord.js` - Discord bot framework
- [x] `dotenv` - Environment variables
- [x] `openai` - AI features (optional)
- [x] `axios` - HTTP requests
- [x] `express` - Web server
- [x] `winston` - Logging

### 3. Configuration Files

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```
✅ Verified

#### `package.json` - Start Command
```json
{
  "main": "ultimate-xyian-bot.js",
  "scripts": {
    "start": "node ultimate-xyian-bot.js"
  }
}
```
✅ Verified

### 4. Environment Variables (Set in Railway Dashboard)

Required:
- [x] `DISCORD_TOKEN` - Your Discord bot token
- [x] `CLIENT_ID` - Discord application client ID

Optional (for full features):
- [ ] `OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `ADMIN_WEBHOOK_URL` - Admin channel webhook
- [ ] `GENERAL_WEBHOOK_URL` - General channel webhook
- [ ] `XYIAN_WEBHOOK_URL` - XYIAN channel webhook
- [ ] `DEBUG_WEBHOOK_URL` - Debug channel webhook
- [ ] `GUILD_ID` - Your Discord guild/server ID

### 5. Bot Permissions

Required Discord Bot Permissions:
- [x] Send Messages
- [x] Read Message History
- [x] Embed Links
- [x] Attach Files
- [x] Use External Emojis
- [x] Manage Messages (for cleanup commands)
- [x] Manage Roles (for XYIAN role checks)
- [x] View Channels

Required Intents:
- [x] GUILDS
- [x] GUILD_MESSAGES
- [x] GUILD_MEMBERS
- [x] MESSAGE_CONTENT

### 6. Data Verification

- [x] `unified_game_data.json` contains all game data
- [x] JSON is valid (no syntax errors)
- [x] All categories present (gear_sets, runes, characters, weapons, game_modes, tips)
- [x] File size reasonable (<1MB for fast loading)

### 7. Code Quality

- [x] No syntax errors
- [x] All requires/imports working
- [x] RAG system properly integrated
- [x] Bot version updated (2.2.0)
- [x] Changelog updated

## 🔧 Railway Deployment Steps

### 1. Connect Repository
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select `xyian-bot-project` as root directory (if needed)

### 2. Set Environment Variables
In Railway dashboard → Variables tab:
```
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
OPENAI_API_KEY=your_openai_key_here (optional)
```

### 3. Deploy
1. Railway will automatically detect Node.js project
2. It will run `npm install`
3. Then run `npm start` (which runs `node ultimate-xyian-bot.js`)
4. Monitor deployment logs

### 4. Verify Deployment
Check logs for:
- ✅ "Working RAG System initialized with REAL game data"
- ✅ "Bot is ready!"
- ✅ "Logged in as [Bot Name]"
- ✅ No error messages

## 🧪 Post-Deployment Testing

### 1. Bot Online Check
In Discord, run: `!ping`

Expected response:
```
🏰 XYIAN Ultimate Bot Status
Bot is ONLINE and ready to help!
📊 Version: v2.2.0
🧠 Game Data: ~40 entries
```

### 2. Test RAG System
Test queries in Discord:
- "What's the best gear set?"
- "Tell me about meteor runes"
- "How do I build Thor?"

Expected: Detailed, formatted responses with emojis and pro tips

### 3. Test Commands
- `!help` - Shows command list
- `!dev-menu` - Shows developer menu (XYIAN role required)
- `!clean-ai-chat` - Cleans arch-ai channel (XYIAN role required)
- `!clean-logs` - Cleans debug-logs channel (XYIAN role required)

### 4. Test AI Channel
- Post a question in arch-ai channel
- Verify bot responds with relevant information from RAG system
- Check that responses are accurate and helpful

### 5. Test Daily Reset Messages
- Wait for 5 PM Pacific or check logs
- Verify daily reset messages are sent to correct channels
- Check message content is appropriate

## 🐛 Troubleshooting

### Bot Won't Start
- Check Railway logs for errors
- Verify `DISCORD_TOKEN` is set correctly
- Check `package.json` start command

### RAG System Errors
- Verify `data/real-structured-data/unified_game_data.json` exists
- Check file path in `working-rag-system.js`
- Look for JSON parsing errors in logs

### Bot Online But Not Responding
- Check bot has correct permissions
- Verify MESSAGE_CONTENT intent is enabled
- Check for rate limiting in logs

### "No relevant data found" Messages
- Verify `unified_game_data.json` loaded successfully
- Check RAG system initialization logs
- Test with simple queries like "Thor" or "Oracle"

## 📊 Success Criteria

Deployment is successful when:
- [x] Bot shows online in Discord
- [x] `!ping` command works
- [x] RAG system returns accurate game data
- [x] AI channel responds to questions
- [x] Daily reset messages scheduled
- [x] No errors in Railway logs
- [x] All commands functional

## 🔄 Updates and Maintenance

### To Update Game Data
1. Edit `data/real-structured-data/unified_game_data.json`
2. Commit and push to GitHub
3. Railway will auto-deploy
4. Bot will restart with new data

### To Update Bot Code
1. Edit bot files
2. Update version in `ultimate-xyian-bot.js`
3. Update `CHANGELOG.md`
4. Commit and push
5. Railway auto-deploys

### To Update Dependencies
1. Update `package.json`
2. Test locally with `npm install`
3. Commit and push
4. Railway will install new dependencies

## 📝 Final Checklist

Before marking deployment complete:
- [ ] Bot is online in Discord
- [ ] `!ping` shows correct version (2.2.0)
- [ ] `!ping` shows game data count
- [ ] Test query returns structured data
- [ ] AI channel is responding
- [ ] No errors in logs
- [ ] All required environment variables set
- [ ] Bot has correct role permissions

## ✅ Deployment Complete!

Once all checks pass:
1. Monitor for 24 hours to ensure stability
2. Check daily reset messages trigger at 5 PM Pacific
3. Gather user feedback on response quality
4. Update data as needed based on feedback

---

**Version**: 2.2.0  
**Last Updated**: 2025-10-14  
**Status**: Ready for Deployment ✅

