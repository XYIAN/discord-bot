# Railway Health Checks

Health checks are essential for monitoring application health and ensuring reliable deployments on Railway.

## What are Health Checks?

Health checks are HTTP endpoints that Railway periodically calls to verify your application is running correctly. They help:
- **Monitor Application Health**: Detect when your app is unhealthy
- **Automatic Recovery**: Restart failed applications
- **Load Balancer Health**: Remove unhealthy instances from load balancing
- **Deployment Validation**: Ensure new deployments are working

## Health Check Configuration

### Basic Configuration
```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### Advanced Configuration
```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "healthcheckInterval": 30,
    "healthcheckRetries": 3,
    "healthcheckStartPeriod": 60
  }
}
```

## Implementing Health Checks

### Basic Health Check
```typescript
// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

### Advanced Health Check
```typescript
// Comprehensive health check
app.get('/health', async (req, res) => {
  const checks = {
    service: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {}
  };
  
  let allHealthy = true;
  
  // Check database
  try {
    await checkDatabase();
    checks.dependencies.database = 'ok';
  } catch (error) {
    checks.dependencies.database = 'error';
    allHealthy = false;
  }
  
  // Check external APIs
  try {
    await checkJiraAPI();
    checks.dependencies.jira = 'ok';
  } catch (error) {
    checks.dependencies.jira = 'error';
    allHealthy = false;
  }
  
  try {
    await checkSlackAPI();
    checks.dependencies.slack = 'ok';
  } catch (error) {
    checks.dependencies.slack = 'error';
    allHealthy = false;
  }
  
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

## NOVA-JIRA Health Check Implementation

### Current Implementation
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NOVA-JIRA Slack Handler',
    version: '1.0.0'
  });
});
```

### Enhanced Implementation
```typescript
// Enhanced health check for NOVA-JIRA
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NOVA-JIRA Slack Handler',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {
      jira: 'unknown',
      slack: 'unknown'
    }
  };
  
  let allHealthy = true;
  
  // Check Jira API
  try {
    await jiraClient.getMyself();
    healthCheck.dependencies.jira = 'ok';
  } catch (error) {
    healthCheck.dependencies.jira = 'error';
    allHealthy = false;
  }
  
  // Check Slack API
  try {
    await slackClient.auth.test();
    healthCheck.dependencies.slack = 'ok';
  } catch (error) {
    healthCheck.dependencies.slack = 'error';
    allHealthy = false;
  }
  
  res.status(allHealthy ? 200 : 503).json(healthCheck);
});
```

## Health Check Best Practices

### Response Format
```typescript
// Standard health check response
{
  "status": "ok" | "error",
  "timestamp": "2025-10-19T10:30:00.000Z",
  "service": "service-name",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000,
    "external": 1000000
  }
}
```

### Error Handling
```typescript
// Graceful error handling
app.get('/health', async (req, res) => {
  try {
    const health = await performHealthChecks();
    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

### Timeout Handling
```typescript
// Health check with timeout
app.get('/health', async (req, res) => {
  const timeout = 5000; // 5 seconds
  const timeoutId = setTimeout(() => {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check timeout'
    });
  }, timeout);
  
  try {
    const health = await performHealthChecks();
    clearTimeout(timeoutId);
    res.status(200).json(health);
  } catch (error) {
    clearTimeout(timeoutId);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

## Health Check Monitoring

### Railway Dashboard
- **Health Status**: View health check status in Railway dashboard
- **Health History**: Track health check history over time
- **Alerts**: Set up alerts for health check failures

### Custom Monitoring
```typescript
// Health check monitoring
class HealthMonitor {
  private healthStatus: 'ok' | 'error' = 'ok';
  private lastCheck: Date = new Date();
  
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/health');
      const health = await response.json();
      
      this.healthStatus = health.status === 'ok' ? 'ok' : 'error';
      this.lastCheck = new Date();
      
      return this.healthStatus === 'ok';
    } catch (error) {
      this.healthStatus = 'error';
      this.lastCheck = new Date();
      return false;
    }
  }
  
  getStatus(): { status: string; lastCheck: Date } {
    return {
      status: this.healthStatus,
      lastCheck: this.lastCheck
    };
  }
}
```

## Health Check Troubleshooting

### Common Issues

#### Health Check Failures
```bash
# Check health endpoint manually
curl https://web-production-0375f.up.railway.app/health

# Check response status
curl -I https://web-production-0375f.up.railway.app/health
```

#### Timeout Issues
```typescript
// Reduce health check complexity
app.get('/health', (req, res) => {
  // Simple, fast health check
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

#### Dependency Issues
```typescript
// Check dependencies separately
app.get('/health', async (req, res) => {
  const basicHealth = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
  
  // Return basic health immediately
  res.status(200).json(basicHealth);
  
  // Check dependencies asynchronously
  checkDependenciesAsync();
});
```

### Debugging Steps
1. **Test Locally**: Run health check locally
2. **Check Logs**: Review Railway logs for errors
3. **Verify Dependencies**: Ensure all dependencies are available
4. **Test Endpoints**: Verify health check endpoint responds correctly

## Health Check Security

### Authentication
```typescript
// Secure health check with authentication
app.get('/health', (req, res) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.HEALTH_CHECK_TOKEN;
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

### Rate Limiting
```typescript
// Rate limit health checks
const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60 // 60 requests per minute
});

app.get('/health', healthCheckLimiter, (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

## Health Check Metrics

### Custom Metrics
```typescript
// Health check metrics
class HealthMetrics {
  private checks: Map<string, { count: number; failures: number }> = new Map();
  
  recordCheck(name: string, success: boolean) {
    const current = this.checks.get(name) || { count: 0, failures: 0 };
    current.count++;
    if (!success) current.failures++;
    this.checks.set(name, current);
  }
  
  getMetrics() {
    const metrics: any = {};
    for (const [name, data] of this.checks) {
      metrics[name] = {
        total: data.count,
        failures: data.failures,
        successRate: (data.count - data.failures) / data.count
      };
    }
    return metrics;
  }
}
```

### Prometheus Metrics
```typescript
// Prometheus health check metrics
import { register, Counter, Gauge } from 'prom-client';

const healthCheckCounter = new Counter({
  name: 'health_check_total',
  help: 'Total number of health checks',
  labelNames: ['status']
});

const healthCheckGauge = new Gauge({
  name: 'health_check_duration_seconds',
  help: 'Duration of health checks in seconds'
});

app.get('/health', async (req, res) => {
  const start = Date.now();
  
  try {
    const health = await performHealthChecks();
    healthCheckCounter.inc({ status: 'success' });
    res.status(200).json(health);
  } catch (error) {
    healthCheckCounter.inc({ status: 'failure' });
    res.status(503).json({ status: 'error' });
  } finally {
    const duration = (Date.now() - start) / 1000;
    healthCheckGauge.set(duration);
  }
});
```

## NOVA-JIRA Health Check Strategy

### Health Check Levels
1. **Basic Health**: Service is running and responding
2. **Dependency Health**: External APIs are accessible
3. **Functional Health**: Core functionality is working
4. **Performance Health**: Response times are acceptable

### Monitoring Integration
```typescript
// Health check with Slack notifications
app.get('/health', async (req, res) => {
  const health = await performHealthChecks();
  
  if (health.status === 'error') {
    // Send alert to Slack
    await slackClient.chat.postMessage({
      channel: '#alerts',
      text: `🚨 NOVA-JIRA health check failed: ${JSON.stringify(health)}`
    });
  }
  
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});
```

### Health Check Endpoints
- **Basic**: `/health` - Simple health check
- **Detailed**: `/health/detailed` - Comprehensive health check
- **Dependencies**: `/health/dependencies` - Check external dependencies
- **Metrics**: `/health/metrics` - Health check metrics
