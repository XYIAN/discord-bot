# Railway Getting Started Tutorial

Complete step-by-step tutorial for deploying the NOVA-JIRA Slack app on Railway.

## Prerequisites

- GitHub account with repository access
- Railway account
- Node.js 18+ installed locally
- Git installed

## Step 1: Prepare Your Repository

### 1.1 Ensure Code is Ready
```bash
# Verify TypeScript compiles
npm run build

# Test locally
npm run slack

# Check health endpoint
curl http://localhost:3000/health
```

### 1.2 Verify Configuration Files
- `railway.json` - Railway configuration
- `Procfile` - Process definition
- `package.json` - Dependencies and scripts
- `.env.local` - Local environment variables (not committed)

## Step 2: Create Railway Project

### 2.1 Sign Up/Login
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub account
3. Authorize Railway to access your repositories

### 2.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `jira-manager` repository
4. Click **"Deploy Now"**

## Step 3: Configure Environment Variables

### 3.1 Add Required Variables
In Railway dashboard, go to **Variables** tab and add:

```bash
# Jira Configuration
JIRA_BASE_URL=https://cptgroup.atlassian.net
JIRA_EMAIL=your-email@cptgroup.com
JIRA_API_TOKEN=your-jira-api-token

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# Webhook URLs (replace with your actual webhook URLs)
JIRA_BOT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_WEBHOOK_TOKEN
BUG_REPORTS_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_WEBHOOK_TOKEN
GENERAL_CHAT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE/YOUR_CHANNEL/YOUR_WEBHOOK_TOKEN
```

### 3.2 Verify Variables
- All variables should be marked as **"Secret"** for sensitive data
- Check that variable names match exactly (case-sensitive)

## Step 4: Configure Build Settings

### 4.1 Set Config File
1. Go to **Settings** → **Config as Code**
2. Set **Config File Path**: `railway.json`
3. Click **Save**

### 4.2 Verify Build Configuration
Railway should automatically detect:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run railway:start`
- **Health Check**: `/health`

## Step 5: Deploy and Test

### 5.1 Initial Deployment
1. Railway automatically starts building
2. Monitor build logs for any errors
3. Wait for deployment to complete

### 5.2 Test Health Check
```bash
# Replace with your actual Railway URL
curl https://web-production-0375f.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "service": "NOVA-JIRA Slack Handler",
  "version": "1.0.0"
}
```

## Step 6: Configure Slack App

### 6.1 Update Request URLs
In your Slack app settings (https://api.slack.com/apps/A09MA2LRK1S):

#### Interactive Components
- **Request URL**: `https://web-production-0375f.up.railway.app/slack/interactive`

#### Slash Commands
For each command, set **Request URL** to:
`https://web-production-0375f.up.railway.app/slack/commands`

#### Event Subscriptions
- **Request URL**: `https://web-production-0375f.up.railway.app/slack/events`

### 6.2 Test Slack Integration
1. **Slash Commands**: Try `/jira-status` in any channel
2. **App Mentions**: Type `@nova-jira help`
3. **Ticket Detection**: Type `CM-1234` and see response

## Step 7: Monitor and Maintain

### 7.1 Monitor Deployment
- **Logs**: Check Railway logs for errors
- **Metrics**: Monitor CPU and memory usage
- **Health**: Verify health check endpoint

### 7.2 Set Up Monitoring
1. **Health Checks**: Railway automatically monitors `/health`
2. **Logs**: Use Railway's built-in log viewer
3. **Alerts**: Set up alerts for deployment failures

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
# Common fixes:
npm install  # Install dependencies
npm run build  # Test build locally
```

#### Environment Variable Issues
- Verify all required variables are set
- Check variable names are exact match
- Ensure sensitive variables are marked as "Secret"

#### Slack Integration Issues
- Verify Request URLs are correct
- Check Slack app permissions
- Verify signing secret matches

#### Health Check Failures
- Ensure `/health` endpoint returns 200 status
- Check application is running on correct port
- Verify no errors in application logs

### Debugging Steps
1. **Check Logs**: Review Railway deployment logs
2. **Test Locally**: Reproduce issues locally
3. **Verify Configuration**: Check `railway.json` and environment variables
4. **Health Check**: Test health endpoint manually

## Next Steps

### Production Readiness
- **Custom Domain**: Set up custom domain if needed
- **SSL Certificate**: Railway provides automatic SSL
- **Monitoring**: Set up comprehensive monitoring
- **Backup Strategy**: Implement data backup if needed

### Scaling
- **Resource Scaling**: Scale CPU/memory as needed
- **Horizontal Scaling**: Add multiple instances if required
- **Database**: Add database service if needed

### Team Collaboration
- **Team Members**: Add team members to Railway project
- **Environments**: Create staging/production environments
- **CI/CD**: Set up automated deployments

## Success Checklist

- [ ] Repository connected to Railway
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Health check passing
- [ ] Slack app URLs updated
- [ ] Slash commands working
- [ ] App mentions working
- [ ] Ticket detection working
- [ ] Monitoring set up

## Support Resources

- **Railway Documentation**: [docs.railway.com](https://docs.railway.com)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Slack API Docs**: [api.slack.com](https://api.slack.com)
- **Project Issues**: Create GitHub issues for bugs
