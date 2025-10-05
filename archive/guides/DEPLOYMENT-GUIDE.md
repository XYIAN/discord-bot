# XYIAN Guild Bot - Deployment Guide

## 🔧 **Discord Developer Portal Setup**

### Application Details:
- **Application ID**: 1424152001670938695
- **Public Key**: 08b85c144b825f5df52d12d0c23c0e084a8444721136aaa9cf174c56a323bda7

### Required Intents:
1. Go to https://discord.com/developers/applications/1424152001670938695
2. Navigate to "Bot" section
3. Enable these Privileged Gateway Intents:
   - ✅ **Message Content Intent** (Required)
   - ✅ **Server Members Intent** (Optional)
   - ✅ **Server Messages Intent** (Optional)
4. Click "Save Changes"

### Bot Invite Link:
```
https://discord.com/api/oauth2/authorize?client_id=1424152001670938695&permissions=8&scope=bot
```

## 🚀 **Hosting Options**

### Option 1: Railway (Recommended - Free)
1. Push code to GitHub
2. Go to https://railway.app
3. Connect GitHub repository
4. Add environment variables:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `XYIAN_GUILD_WEBHOOK`
5. Deploy!

### Option 2: Replit (Free with Always On)
1. Go to https://replit.com
2. Create new Repl
3. Import from GitHub
4. Add environment variables
5. Enable "Always On" (paid feature)

### Option 3: DigitalOcean ($5/month)
1. Create Ubuntu droplet
2. Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
3. Clone repository
4. Install dependencies: `npm install`
5. Install PM2: `npm install -g pm2`
6. Start bot: `pm2 start guild-management-bot.js --name "xyian-bot"`
7. Save PM2: `pm2 save && pm2 startup`

## 📋 **Environment Variables**

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=1424152001670938695
GUILD_ID=your_guild_id_here
XYIAN_GUILD_WEBHOOK=your_webhook_url_here
```

## ✅ **Testing Checklist**

- [ ] Message Content Intent enabled
- [ ] Bot invited to server
- [ ] Environment variables set
- [ ] Bot responds to `!ping`
- [ ] Bot welcomes new members
- [ ] Bot tracks activity with `!boss` and `!donate`
- [ ] Bot answers questions about Arch 2

## 🎯 **Bot Features**

### For Members:
- `!help` - View all commands
- `!requirements` - See daily requirements
- `!activity` - Check your status
- `!boss` - Record boss battle
- `!donate` - Record donation
- `!xyian` - Guild information
- Ask questions like "what is the best etched rune?"

### For Officers:
- `!inactive` - View inactive members
- Automatic role assignment
- Activity monitoring

## 🔄 **Maintenance**

- Bot automatically tracks daily requirements
- Sends daily reminders at 6 PM
- Monitors inactive members
- Answers common game questions
- Welcomes new members automatically
