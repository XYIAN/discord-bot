# 🚀 Railway Deployment Guide

This guide explains how to deploy the XYIAN Discord Bot to Railway with proper configuration and persistent data storage.

## Prerequisites

1. [Railway.app](https://railway.app) account
2. Discord Bot Token and Client ID
3. Your Discord User ID (for owner-only training commands)

## Environment Variables

Configure these environment variables in your Railway project:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | `MTk5ODg4...` |
| `CLIENT_ID` | Your Discord application client ID | `1234567890` |
| `OWNER_ID` | Your Discord user ID (for training commands) | `9876543210` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | (disabled if not set) |
| `NODE_ENV` | Environment mode | `production` |

## Deployment Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### 2. Configure Environment Variables

In the Railway dashboard:

1. Go to your project
2. Click on "Variables"
3. Add all required environment variables listed above
4. Click "Deploy"

### 3. Deploy from GitHub (Recommended)

1. Connect your GitHub repository to Railway
2. Railway will automatically detect `railway.json` configuration
3. Select the `xyian-bot-project` directory as the root
4. Railway will deploy automatically on each push to main branch

### 4. Or Deploy Manually

```bash
cd xyian-bot-project
railway up
```

## Data Persistence

### Persistent Volume Configuration

Railway automatically persists the following data:

- `data/real-structured-data/unified_game_data.json` - Game knowledge base
- `data/user-training/` - Training logs and pending reviews

**Important**: Data persists across deployments and restarts.

### Backup Your Data

Regularly backup your training data:

```bash
# Download training data from Railway
railway run cat data/user-training/training-log.json > backup-training-log.json
railway run cat data/user-training/pending-review.json > backup-pending-review.json
```

## Verifying Deployment

### 1. Check Bot Status

In Railway logs, you should see:

```
✅ Working RAG System initialized with REAL game data
✅ Training System initialized
🔄 Registering slash commands...
✅ Slash commands registered successfully
✅ Logged in as [Your Bot Name]
```

### 2. Test Discord Commands

Try these slash commands in your Discord server:

- `/training-stats` - View training statistics (owner only)
- `/pending-reviews` - View pending training entries (owner only)
- `/train` - Add new game information (owner only)

### 3. Test Bot Responses

Ask the bot in a channel:
- "what's the best PVP weapon?"
- "tell me about Griffin claws"
- "best PVP build?"

The bot should respond with clean, structured data mentioning Griffin Claws, Dragoon Crossbow, and Dragoon Bow for PVP.

## Training the Bot

### Via Discord (Recommended)

Use `/train` command:

```
/train
  category: weapons
  topic: claw
  information: Griffin Claws deal massive damage in close range PVP
```

### Via Local CLI

```bash
# SSH into Railway instance
railway run bash

# Run training CLI
node training-system.js
```

Follow the interactive prompts to:
1. Add training data
2. View pending reviews
3. Approve/reject pending entries
4. View statistics

## Troubleshooting

### Bot Not Responding

1. Check Railway logs for errors
2. Verify `DISCORD_TOKEN` is correct
3. Ensure bot has proper Discord permissions
4. Check that `unified_game_data.json` exists

### Slash Commands Not Showing

1. Verify `CLIENT_ID` environment variable is set
2. Check Railway logs for command registration errors
3. Wait up to 1 hour for Discord to update global commands
4. Or register guild-specific commands for instant updates

### Training Data Not Saving

1. Check Railway persistent volume is configured
2. Verify write permissions in Railway logs
3. Ensure `data/user-training/` directory exists
4. Check disk space in Railway dashboard

### Data Quality Issues

Run the validation script:

```bash
railway run node validate-data-quality.js
```

Should output: `🎯 QUALITY SCORE: 100/100`

## Monitoring

### View Logs

```bash
# Real-time logs
railway logs

# Filter logs
railway logs | grep "✅"
railway logs | grep "❌"
```

### Check Memory Usage

In Railway dashboard:
- Monitor memory usage under "Metrics"
- Bot should use ~100-200MB typically
- High memory usage may indicate issues

### Check Response Times

Monitor bot response times in Discord:
- RAG system searches should be < 100ms
- Bot responses should be < 500ms
- Slow responses may indicate data quality issues

## Updating the Bot

### Deploy New Version

```bash
git add .
git commit -m "Update bot features"
git push origin main
```

Railway will automatically deploy the new version.

### Update Game Data

1. Edit `data/real-structured-data/unified_game_data.json` locally
2. Test with `node validate-data-quality.js`
3. Commit and push changes
4. Railway deploys automatically with new data

### Roll Back

If deployment fails:

```bash
# In Railway dashboard
1. Go to "Deployments"
2. Click on previous successful deployment
3. Click "Redeploy"
```

## Scaling

### Increase Resources

In Railway dashboard:
1. Go to "Settings"
2. Adjust resource limits if needed
3. Bot works fine with default limits

### Multiple Instances

**Not recommended** - Discord bots should run as single instance to avoid duplicate responses.

## Security

### Protect Environment Variables

- Never commit `.env` files
- Use Railway's encrypted variables
- Rotate tokens regularly

### Owner-Only Commands

Training commands are restricted to `OWNER_ID`:
- `/train`
- `/correct`
- `/training-stats`
- `/pending-reviews`

Only the user with matching `OWNER_ID` can use these commands.

## Cost Optimization

Railway offers free tier with limitations:
- $5/month credit
- Hobby plan sufficient for most Discord bots
- Monitor usage in Railway dashboard

## Support

If you encounter issues:

1. Check `.cursorrules` for data quality standards
2. Review `DATA-STRUCTURE.md` for data organization
3. Read `CHANGELOG.md` for recent changes
4. Run `validate-data-quality.js` to check data

---

**Last Updated**: 2025-01-14  
**Bot Version**: 2.3.0  
**Status**: ✅ Production Ready with Training System

