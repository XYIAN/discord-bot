# Railway Platform Documentation

This directory contains comprehensive documentation for deploying and managing the NOVA-JIRA Slack app on Railway platform.

## 📁 Documentation Structure

### Railway Platform Documentation
- **[Config as Code](./config-as-code.md)** - Railway configuration files and settings
- **[Quick Start Guide](./quick-start.md)** - Getting started with Railway deployment
- **[Best Practices](./best-practices.md)** - Railway deployment best practices
- **[Health Checks](./healthchecks.md)** - Application health monitoring

### NOVA-JIRA Specific Documentation
- **[Railway Integration](./railway-integration.md)** - **🎯 START HERE** - Complete NOVA-JIRA Railway integration guide

## 🎯 NOVA-JIRA Specific Configuration

### Current Railway Setup
- **Project URL**: `https://web-production-0375f.up.railway.app`
- **Config File**: `railway.json` (root directory)
- **Start Command**: `npm run railway:start`
- **Health Check**: `/health` endpoint

### Environment Variables Required
```
JIRA_BASE_URL=https://cptgroup.atlassian.net
JIRA_EMAIL=your-email@cptgroup.com
JIRA_API_TOKEN=your-api-token
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
JIRA_BOT_WEBHOOK_URL=https://hooks.slack.com/services/...
BUG_REPORTS_WEBHOOK_URL=https://hooks.slack.com/services/...
GENERAL_CHAT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Slack App URLs
- **Interactive Components**: `https://web-production-0375f.up.railway.app/slack/interactive`
- **Slash Commands**: `https://web-production-0375f.up.railway.app/slack/commands`
- **Event Subscriptions**: `https://web-production-0375f.up.railway.app/slack/events`

## 🚀 Quick Deployment Steps

1. **Connect Repository**: Link GitHub repo to Railway project
2. **Set Environment Variables**: Add all required variables in Railway dashboard
3. **Configure Config File**: Set `railway.json` as config file in Railway settings
4. **Deploy**: Railway auto-deploys from GitHub commits
5. **Update Slack URLs**: Configure Slack app with Railway URLs
6. **Test**: Verify health check and Slack integration

## 📚 Additional Resources

- [Railway Official Documentation](https://docs.railway.com/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app/)
