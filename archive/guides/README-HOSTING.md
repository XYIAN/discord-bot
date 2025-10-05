# Discord Bot Hosting Guide

## 🚀 **Free Hosting Options**

### **1. Railway (Recommended)**
- **Cost**: Free tier available
- **Setup**: Connect GitHub repo, auto-deploy
- **Uptime**: 99.9%
- **Steps**:
  1. Push code to GitHub
  2. Connect Railway to GitHub
  3. Add environment variables
  4. Deploy!

### **2. Replit**
- **Cost**: Free with "Always On" option
- **Setup**: Import GitHub repo
- **Uptime**: 24/7 with paid plan
- **Steps**:
  1. Create new Repl
  2. Import from GitHub
  3. Add environment variables
  4. Run!

### **3. Heroku**
- **Cost**: Free tier (limited hours)
- **Setup**: Git-based deployment
- **Uptime**: 550 hours/month free
- **Steps**:
  1. Install Heroku CLI
  2. Create Heroku app
  3. Deploy with Git

## 💰 **Paid Hosting (Better Performance)**

### **1. DigitalOcean Droplet**
- **Cost**: $5/month
- **Setup**: Ubuntu server
- **Uptime**: 99.9%
- **Steps**:
  1. Create droplet
  2. Install Node.js
  3. Clone repo
  4. Set up PM2 for process management

### **2. AWS EC2**
- **Cost**: $3-10/month
- **Setup**: EC2 instance
- **Uptime**: 99.9%
- **Steps**:
  1. Launch EC2 instance
  2. Install dependencies
  3. Deploy application

## 🔧 **Environment Variables for Hosting**

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
XYIAN_GUILD_WEBHOOK=your_webhook_url
NODE_ENV=production
```

## 📋 **Deployment Checklist**

- [ ] Code pushed to GitHub
- [ ] Environment variables set
- [ ] Bot invited to server
- [ ] Intents enabled in Discord Developer Portal
- [ ] Webhook URLs configured
- [ ] Bot permissions set correctly

## 🎯 **Recommended Setup**

1. **For Testing**: Use your local machine
2. **For Production**: Use Railway (free) or DigitalOcean ($5/month)
3. **For Scale**: Use AWS or dedicated VPS

## 🔄 **Auto-Deploy with GitHub**

Set up automatic deployment so when you push code changes, the bot updates automatically!
