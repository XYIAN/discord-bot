# Railway Build & Start Commands

Railway uses build and start commands to compile and run your application. Understanding these commands is crucial for successful deployments.

## Build Commands

### What are Build Commands?
Build commands prepare your application for deployment by:
- Installing dependencies
- Compiling source code
- Running tests
- Creating production artifacts
- Optimizing assets

### Build Command Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  }
}
```

### Common Build Commands

#### Node.js/TypeScript
```bash
# Basic build
npm install && npm run build

# With caching
npm ci && npm run build

# With testing
npm ci && npm test && npm run build

# With linting
npm ci && npm run lint && npm run build
```

#### Python
```bash
# Basic build
pip install -r requirements.txt

# With virtual environment
python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

#### Docker
```bash
# Build Docker image
docker build -t myapp .

# Multi-stage build
docker build --target production -t myapp .
```

## Start Commands

### What are Start Commands?
Start commands run your application after successful build:
- Start the main process
- Set up listeners
- Initialize connections
- Begin serving requests

### Start Command Configuration
```json
{
  "deploy": {
    "startCommand": "npm run railway:start"
  }
}
```

### Common Start Commands

#### Node.js Applications
```bash
# Direct node execution
node dist/index.js

# Using npm scripts
npm start

# With environment
NODE_ENV=production node dist/index.js

# With process manager
pm2 start dist/index.js
```

#### Python Applications
```bash
# Direct Python execution
python app.py

# Using gunicorn
gunicorn app:app

# With environment
FLASK_ENV=production python app.py
```

#### Docker Applications
```bash
# Run Docker container
docker run -p 3000:3000 myapp

# With environment variables
docker run -e NODE_ENV=production -p 3000:3000 myapp
```

## NOVA-JIRA Build & Start Configuration

### Current Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run railway:start"
  }
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "railway:start": "npm run build && npm run slack:prod",
    "slack:prod": "node dist/src/slack-interactive-handler.js"
  }
}
```

### Build Process
1. **Install Dependencies**: `npm install`
2. **Compile TypeScript**: `npm run build` (runs `tsc`)
3. **Create Production Build**: Outputs to `dist/` directory
4. **Start Application**: `npm run railway:start`

## Build Optimization

### Dependency Management
```bash
# Use npm ci for faster, reliable builds
npm ci

# Clean install
rm -rf node_modules package-lock.json && npm install

# Install only production dependencies
npm ci --only=production
```

### TypeScript Compilation
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Build Caching
Railway caches build artifacts between deployments:
- **node_modules**: Cached between builds
- **Build artifacts**: Cached when possible
- **Dependencies**: Cached based on package-lock.json

## Start Command Optimization

### Process Management
```typescript
// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
```

### Health Check Integration
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

### Error Handling
```typescript
// Global error handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

## Build Troubleshooting

### Common Build Issues

#### Dependency Issues
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm ls
npm outdated
```

#### TypeScript Compilation Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix type errors
npx tsc --noEmit --pretty

# Check specific files
npx tsc src/slack-interactive-handler.ts --noEmit
```

#### Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 dist/index.js

# Use npm scripts with memory limit
"start": "node --max-old-space-size=4096 dist/index.js"
```

### Build Debugging
```bash
# Verbose build output
npm run build -- --verbose

# Check build output
ls -la dist/

# Test build locally
npm run build && npm run start
```

## Start Command Troubleshooting

### Common Start Issues

#### Port Binding
```typescript
// Use Railway's PORT environment variable
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

#### Environment Variables
```typescript
// Check required environment variables
const requiredVars = [
  'JIRA_BASE_URL',
  'JIRA_API_TOKEN',
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET'
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}
```

#### Dependency Issues
```typescript
// Check external dependencies on startup
async function checkDependencies() {
  try {
    // Check Jira API
    await jiraClient.getMyself();
    console.log('✅ Jira API connection successful');
    
    // Check Slack API
    await slackClient.auth.test();
    console.log('✅ Slack API connection successful');
  } catch (error) {
    console.error('❌ Dependency check failed:', error);
    process.exit(1);
  }
}
```

## Performance Optimization

### Build Performance
```bash
# Use npm ci for faster installs
npm ci

# Parallel builds
npm run build -- --parallel

# Skip unnecessary steps
npm run build -- --skip-tests
```

### Runtime Performance
```typescript
// Connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## Monitoring Build & Start

### Build Monitoring
- **Build Logs**: Monitor build process logs
- **Build Time**: Track build duration
- **Build Success Rate**: Monitor build success percentage
- **Dependency Updates**: Track dependency changes

### Runtime Monitoring
- **Startup Time**: Monitor application startup time
- **Memory Usage**: Track memory consumption
- **CPU Usage**: Monitor CPU utilization
- **Response Time**: Track API response times

### Alerts
```typescript
// Build failure alerts
if (process.env.NODE_ENV === 'production') {
  // Send alert to Slack
  await slackClient.chat.postMessage({
    channel: '#alerts',
    text: '🚨 NOVA-JIRA build failed!'
  });
}

// Runtime error alerts
process.on('uncaughtException', async (error) => {
  await slackClient.chat.postMessage({
    channel: '#alerts',
    text: `🚨 NOVA-JIRA crashed: ${error.message}`
  });
});
```

## Best Practices

### Build Best Practices
1. **Use npm ci**: Faster, more reliable than npm install
2. **Cache Dependencies**: Leverage Railway's caching
3. **Optimize Build**: Remove unnecessary files
4. **Test Builds**: Run tests during build process
5. **Version Pinning**: Pin dependency versions

### Start Best Practices
1. **Graceful Shutdown**: Handle SIGTERM and SIGINT
2. **Health Checks**: Implement health check endpoints
3. **Error Handling**: Comprehensive error handling
4. **Logging**: Structured logging
5. **Monitoring**: Set up monitoring and alerts

### NOVA-JIRA Specific
1. **TypeScript Compilation**: Ensure clean TypeScript builds
2. **Environment Validation**: Validate all required variables
3. **Dependency Checks**: Verify external API connections
4. **Health Monitoring**: Monitor Slack and Jira integrations
5. **Error Recovery**: Implement retry logic for external calls
