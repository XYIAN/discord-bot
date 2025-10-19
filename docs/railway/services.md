# Railway Services

Railway services are individual applications or components that run within a project. Each service can be independently deployed, scaled, and managed.

## Service Overview

### What are Services?
- **Independent Units**: Each service runs as a separate application
- **Individual Scaling**: Scale services independently based on needs
- **Service Communication**: Services can communicate with each other
- **Resource Allocation**: Allocate different resources per service

### Service Types
- **Web Services**: HTTP applications (like our Slack handler)
- **Background Services**: Long-running processes (cron jobs, workers)
- **Databases**: PostgreSQL, MySQL, Redis, MongoDB
- **APIs**: REST APIs, GraphQL endpoints
- **Workers**: Background job processors

## NOVA-JIRA Service Architecture

### Current Service Structure
```
NOVA-JIRA Project
└── Web Service (Slack Handler)
    ├── Port: 3000
    ├── Health Check: /health
    ├── Endpoints:
    │   ├── /slack/interactive
    │   ├── /slack/commands
    │   └── /slack/events
    └── Dependencies: Node.js, TypeScript
```

### Potential Future Services
```
NOVA-JIRA Project
├── Web Service (Slack Handler)
├── Cache Service (Redis)
├── Database Service (PostgreSQL)
└── Worker Service (Cron Jobs)
```

## Service Configuration

### Basic Service Settings
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run railway:start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### Service-Specific Variables
```bash
# Web Service Variables
NODE_ENV=production
PORT=3000
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Database Service Variables
DATABASE_URL=postgresql://...
DB_POOL_SIZE=10

# Cache Service Variables
REDIS_URL=redis://...
CACHE_TTL=3600
```

## Service Communication

### Private Networking
Services in the same project can communicate privately:
```typescript
// Web service calling database service
const dbUrl = process.env.DATABASE_URL; // Private connection
const client = new Client({ connectionString: dbUrl });

// Web service calling cache service
const redisUrl = process.env.REDIS_URL; // Private connection
const redis = new Redis(redisUrl);
```

### Service Discovery
Railway provides environment variables for service discovery:
```bash
# Database service variables
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE_HOST=host
DATABASE_PORT=5432
DATABASE_NAME=db
DATABASE_USER=user
DATABASE_PASSWORD=pass

# Redis service variables
REDIS_URL=redis://host:port
REDIS_HOST=host
REDIS_PORT=6379
```

## Service Scaling

### Vertical Scaling
Increase resources for a single service:
- **CPU**: More processing power
- **Memory**: More RAM
- **Storage**: More disk space

### Horizontal Scaling
Add more instances of a service:
- **Load Balancing**: Distribute traffic across instances
- **Auto-scaling**: Scale based on metrics
- **Manual Scaling**: Manually set instance count

### Scaling Configuration
```json
{
  "deploy": {
    "replicas": 3,
    "resources": {
      "cpu": "1000m",
      "memory": "1Gi"
    }
  }
}
```

## Service Health and Monitoring

### Health Checks
Each service should implement health checks:
```typescript
// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'slack-handler',
    timestamp: new Date().toISOString()
  });
});

// Advanced health check with dependencies
app.get('/health', async (req, res) => {
  const checks = {
    service: 'ok',
    database: await checkDatabase(),
    cache: await checkCache(),
    external: await checkExternalAPIs()
  };
  
  const allHealthy = Object.values(checks).every(status => status === 'ok');
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

### Monitoring
- **Metrics**: CPU, memory, request rate, response time
- **Logs**: Application logs, error logs, access logs
- **Alerts**: Set up alerts for service failures
- **Dashboards**: Create custom monitoring dashboards

## Service Dependencies

### Dependency Management
```typescript
// Check service dependencies on startup
async function checkDependencies() {
  const dependencies = [
    { name: 'Database', check: checkDatabase },
    { name: 'Cache', check: checkCache },
    { name: 'Jira API', check: checkJiraAPI },
    { name: 'Slack API', check: checkSlackAPI }
  ];
  
  for (const dep of dependencies) {
    try {
      await dep.check();
      console.log(`✅ ${dep.name} is healthy`);
    } catch (error) {
      console.error(`❌ ${dep.name} is unhealthy:`, error);
      process.exit(1);
    }
  }
}
```

### Graceful Shutdown
```typescript
// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  
  // Close database connections
  await db.close();
  
  // Close cache connections
  await redis.quit();
  
  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

## Service Security

### Environment Variables
- **Secrets**: Mark sensitive variables as secret
- **Encryption**: Railway encrypts secrets at rest
- **Access Control**: Control who can access variables

### Network Security
- **Private Networking**: Services communicate privately
- **TLS**: Automatic TLS for external connections
- **Firewall**: Configure firewall rules if needed

### API Security
```typescript
// Verify Slack requests
import { createHmac } from 'crypto';

function verifySlackRequest(body: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = 'v0=' + hmac.digest('hex');
  return hmac.compare(signature, expectedSignature);
}

// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/slack/', limiter);
```

## Service Deployment

### Deployment Strategies
1. **Blue-Green**: Deploy new version alongside old version
2. **Rolling**: Gradually replace old instances with new ones
3. **Canary**: Deploy to subset of users first

### Deployment Configuration
```json
{
  "deploy": {
    "strategy": "rolling",
    "maxUnavailable": 1,
    "maxSurge": 1,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### Deployment Process
1. **Build**: Compile and prepare application
2. **Test**: Run automated tests
3. **Deploy**: Deploy to Railway
4. **Health Check**: Verify service is healthy
5. **Traffic Switch**: Route traffic to new version

## Service Troubleshooting

### Common Issues
1. **Service Won't Start**: Check start command and dependencies
2. **Health Check Failures**: Verify health check endpoint
3. **Memory Issues**: Monitor memory usage and optimize
4. **Network Issues**: Check service communication

### Debugging Steps
1. **Check Logs**: Review service logs for errors
2. **Verify Configuration**: Check service configuration
3. **Test Locally**: Reproduce issues locally
4. **Monitor Resources**: Check CPU and memory usage

### Log Analysis
```bash
# View service logs
railway logs

# Filter logs by level
railway logs --level error

# Follow logs in real-time
railway logs --follow
```

## Service Best Practices

### Design Principles
- **Single Responsibility**: Each service has one clear purpose
- **Loose Coupling**: Minimize dependencies between services
- **High Cohesion**: Related functionality in same service
- **Stateless**: Services should be stateless when possible

### Performance
- **Caching**: Implement caching for frequently accessed data
- **Connection Pooling**: Use connection pooling for databases
- **Async Processing**: Use async/await for I/O operations
- **Resource Optimization**: Optimize CPU and memory usage

### Reliability
- **Error Handling**: Implement comprehensive error handling
- **Retry Logic**: Implement retry logic for external calls
- **Circuit Breakers**: Use circuit breakers for external services
- **Monitoring**: Set up comprehensive monitoring

## NOVA-JIRA Service Implementation

### Current Implementation
```typescript
// Slack Interactive Handler Service
class SlackInteractiveHandler {
  private app: Express;
  private jiraClient: JiraClient;
  private slackClient: SlackClient;
  
  constructor() {
    this.app = express();
    this.jiraClient = new JiraClient();
    this.slackClient = new SlackClient();
    this.setupRoutes();
  }
  
  private setupRoutes() {
    // Health check
    this.app.get('/health', this.healthCheck);
    
    // Slack endpoints
    this.app.post('/slack/interactive', this.handleInteractive);
    this.app.post('/slack/commands', this.handleCommands);
    this.app.post('/slack/events', this.handleEvents);
  }
  
  private healthCheck(req: Request, res: Response) {
    res.json({
      status: 'ok',
      service: 'NOVA-JIRA Slack Handler',
      timestamp: new Date().toISOString()
    });
  }
}
```

### Future Enhancements
- **Database Service**: Add PostgreSQL for data persistence
- **Cache Service**: Add Redis for caching
- **Worker Service**: Add background job processing
- **API Service**: Add REST API for external integrations
