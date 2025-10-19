# Railway Environments

Railway environments allow you to create parallel, identical environments for different purposes like development, staging, and production.

## Environment Overview

### What are Environments?
- **Isolated Deployments**: Each environment is completely separate
- **Independent Variables**: Different environment variables per environment
- **Parallel Development**: Work on features without affecting production
- **Easy Promotion**: Promote code from dev → staging → production

### Environment Types
- **Production**: Live environment for end users
- **Staging**: Pre-production testing environment
- **Development**: Feature development and testing
- **Preview**: Automatic environments for pull requests

## Creating Environments

### 1. From Railway Dashboard
1. Go to your project
2. Click **"New Environment"**
3. Choose **"Fork from Production"** or **"Empty Environment"**
4. Configure environment-specific variables
5. Deploy your code

### 2. From CLI
```bash
# Create new environment
railway environment create staging

# Switch to environment
railway environment use staging

# Deploy to specific environment
railway up --environment staging
```

## Environment Configuration

### Environment Variables
Each environment can have different variables:

```bash
# Production Environment
NODE_ENV=production
JIRA_BASE_URL=https://cptgroup.atlassian.net
SLACK_BOT_TOKEN=xoxb-prod-token

# Staging Environment
NODE_ENV=staging
JIRA_BASE_URL=https://cptgroup-staging.atlassian.net
SLACK_BOT_TOKEN=xoxb-staging-token

# Development Environment
NODE_ENV=development
JIRA_BASE_URL=https://cptgroup-dev.atlassian.net
SLACK_BOT_TOKEN=xoxb-dev-token
```

### Service Configuration
- **Different Domains**: Each environment gets unique URLs
- **Independent Databases**: Separate database instances
- **Isolated Resources**: CPU/memory limits per environment

## NOVA-JIRA Environment Strategy

### Recommended Setup
```
NOVA-JIRA Project
├── Production Environment
│   ├── Web Service (Slack Handler)
│   └── Production Variables
├── Staging Environment
│   ├── Web Service (Slack Handler)
│   └── Staging Variables
└── Development Environment
    ├── Web Service (Slack Handler)
    └── Development Variables
```

### Environment-Specific Configuration

#### Production Environment
```bash
# Production Variables
NODE_ENV=production
JIRA_BASE_URL=https://cptgroup.atlassian.net
JIRA_EMAIL=production@cptgroup.com
JIRA_API_TOKEN=prod-api-token
SLACK_BOT_TOKEN=xoxb-prod-token
SLACK_SIGNING_SECRET=prod-signing-secret

# Production Webhooks
JIRA_BOT_WEBHOOK_URL=https://hooks.slack.com/services/PROD/...
BUG_REPORTS_WEBHOOK_URL=https://hooks.slack.com/services/PROD/...
GENERAL_CHAT_WEBHOOK_URL=https://hooks.slack.com/services/PROD/...
```

#### Staging Environment
```bash
# Staging Variables
NODE_ENV=staging
JIRA_BASE_URL=https://cptgroup-staging.atlassian.net
JIRA_EMAIL=staging@cptgroup.com
JIRA_API_TOKEN=staging-api-token
SLACK_BOT_TOKEN=xoxb-staging-token
SLACK_SIGNING_SECRET=staging-signing-secret

# Staging Webhooks
JIRA_BOT_WEBHOOK_URL=https://hooks.slack.com/services/STAGING/...
BUG_REPORTS_WEBHOOK_URL=https://hooks.slack.com/services/STAGING/...
GENERAL_CHAT_WEBHOOK_URL=https://hooks.slack.com/services/STAGING/...
```

#### Development Environment
```bash
# Development Variables
NODE_ENV=development
JIRA_BASE_URL=https://cptgroup-dev.atlassian.net
JIRA_EMAIL=dev@cptgroup.com
JIRA_API_TOKEN=dev-api-token
SLACK_BOT_TOKEN=xoxb-dev-token
SLACK_SIGNING_SECRET=dev-signing-secret

# Development Webhooks
JIRA_BOT_WEBHOOK_URL=https://hooks.slack.com/services/DEV/...
BUG_REPORTS_WEBHOOK_URL=https://hooks.slack.com/services/DEV/...
GENERAL_CHAT_WEBHOOK_URL=https://hooks.slack.com/services/DEV/...
```

## Environment Promotion

### Manual Promotion
1. **Test in Development**: Deploy and test features
2. **Promote to Staging**: Copy code to staging environment
3. **Staging Testing**: Comprehensive testing
4. **Promote to Production**: Deploy to production

### Automated Promotion
```yaml
# GitHub Actions example
name: Deploy to Staging
on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway Staging
        run: railway up --environment staging
```

## Environment Management

### Switching Environments
```bash
# List environments
railway environment list

# Switch to environment
railway environment use staging

# Deploy to current environment
railway up

# Deploy to specific environment
railway up --environment production
```

### Environment Variables Management
```bash
# Set variable in current environment
railway variables set NODE_ENV=production

# Set variable in specific environment
railway variables set NODE_ENV=staging --environment staging

# List variables
railway variables list

# Delete variable
railway variables delete NODE_ENV
```

## Preview Environments

### Pull Request Environments
Railway can automatically create environments for pull requests:

1. **Enable Preview Deployments**: In project settings
2. **Create Pull Request**: Push to feature branch
3. **Automatic Deployment**: Railway creates preview environment
4. **Test Changes**: Review changes in isolated environment
5. **Merge**: Preview environment is automatically cleaned up

### Preview Environment Benefits
- **Isolated Testing**: Test changes without affecting other environments
- **Automatic Cleanup**: Environments are deleted when PR is closed
- **Easy Review**: Share preview URL with team members
- **No Manual Setup**: Automatic environment creation

## Environment Best Practices

### Naming Conventions
- **Production**: `prod` or `production`
- **Staging**: `staging` or `stage`
- **Development**: `dev` or `development`
- **Feature Branches**: `feature/feature-name`

### Variable Management
- **Environment-Specific**: Use different values per environment
- **Secrets**: Mark sensitive variables as secret
- **Documentation**: Document required variables per environment
- **Validation**: Validate variables on deployment

### Resource Allocation
- **Production**: Higher resources for performance
- **Staging**: Similar to production for accurate testing
- **Development**: Lower resources for cost efficiency

## Monitoring Environments

### Health Checks
Each environment should have health checks:
```typescript
// Environment-specific health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    service: 'NOVA-JIRA Slack Handler'
  });
});
```

### Logging
- **Environment Tags**: Tag logs with environment name
- **Separate Logs**: Keep environment logs separate
- **Monitoring**: Set up alerts per environment

### Metrics
- **Performance**: Monitor performance per environment
- **Errors**: Track errors per environment
- **Usage**: Monitor resource usage per environment

## Troubleshooting

### Common Issues
1. **Variable Mismatches**: Ensure variables are set in all environments
2. **Resource Limits**: Check resource allocation per environment
3. **Network Issues**: Verify network configuration per environment
4. **Dependencies**: Ensure all dependencies are available

### Debugging Steps
1. **Check Variables**: Verify environment variables are correct
2. **Review Logs**: Check logs for environment-specific issues
3. **Test Locally**: Reproduce issues in local environment
4. **Compare Environments**: Compare working vs. broken environments

## NOVA-JIRA Environment Workflow

### Development Workflow
1. **Feature Development**: Work in development environment
2. **Local Testing**: Test changes locally
3. **Deploy to Dev**: Deploy to development environment
4. **Integration Testing**: Test with other services
5. **Deploy to Staging**: Promote to staging for testing
6. **Production Deployment**: Deploy to production after approval

### Slack App Configuration
- **Production**: Use production Slack app
- **Staging**: Use staging Slack app
- **Development**: Use development Slack app

### Database Considerations
- **Separate Databases**: Use different databases per environment
- **Data Seeding**: Seed development/staging with test data
- **Backup Strategy**: Backup production data regularly
