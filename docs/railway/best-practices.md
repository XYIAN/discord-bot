# Best Practices

Railway best practices for optimal deployment, performance, and maintainability.

## Keep Related Services Together

When you're building an application, it's common to have multiple services that work together. For example, you might have a web application, a database, and a cache service. Railway makes it easy to keep these services together in a single project.

**Why keep services together?**
- **Private Networking**: Services in the same project can communicate with each other privately
- **Variable Management**: You can share environment variables between services
- **Easier Management**: All related services are in one place
- **Cost Efficiency**: Railway's pricing is based on resource usage, not the number of services

**Example Project Structure:**
```
My App Project
├── Web Service (Next.js app)
├── Database (PostgreSQL)
└── Cache Service (Redis)
```

## Use Reference Variables

Instead of hardcoding values in your environment variables, use Railway's reference variables to reference other services.

**Example:**
Instead of hardcoding your database URL:
```bash
# ❌ Hardcoded
DATABASE_URL=postgresql://user:pass@host:port/db
```

Use a reference variable:
```bash
# ✅ Reference Variable
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

This way, if your database service changes, your web service will automatically get the new connection string.

## Use Health Checks

Health checks are essential for monitoring your application's health and ensuring reliable deployments.

**Why use health checks?**
- **Automatic Recovery**: Railway can automatically restart failed services
- **Load Balancer Health**: Unhealthy instances are removed from load balancing
- **Deployment Validation**: New deployments are validated before traffic is routed to them

**Example Health Check:**
```javascript
// Express.js example
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
```

## Use Proper Logging

Good logging is crucial for debugging and monitoring your application.

**Logging Best Practices:**
- **Structured Logging**: Use JSON format for logs
- **Log Levels**: Use appropriate log levels (debug, info, warn, error)
- **Context**: Include relevant context in your logs
- **Avoid Logging Sensitive Data**: Never log passwords, API keys, or other sensitive information

**Example Structured Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Usage
logger.info('User logged in', { userId: 123, email: 'user@example.com' });
logger.error('Database connection failed', { error: error.message });
```

## Use Environment Variables for Configuration

Never hardcode configuration values in your code. Use environment variables instead.

**Why use environment variables?**
- **Security**: Keep sensitive data out of your code
- **Flexibility**: Different values for different environments
- **Easy Management**: Change configuration without code changes

**Example:**
```javascript
// ❌ Hardcoded
const dbUrl = 'postgresql://user:pass@localhost:5432/mydb';

// ✅ Environment Variable
const dbUrl = process.env.DATABASE_URL;
```

## Use Proper Error Handling

Implement proper error handling throughout your application.

**Error Handling Best Practices:**
- **Catch All Errors**: Don't let unhandled errors crash your application
- **Log Errors**: Always log errors for debugging
- **Return Appropriate HTTP Status Codes**: Use the correct status codes
- **Don't Expose Internal Details**: Don't expose sensitive information in error messages

**Example Error Handling:**
```javascript
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Don't expose internal details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : error.message;
    
  res.status(500).json({ error: message });
});
```

## Use Connection Pooling

If you're using a database, use connection pooling to manage database connections efficiently.

**Why use connection pooling?**
- **Performance**: Reuse connections instead of creating new ones
- **Resource Management**: Limit the number of concurrent connections
- **Reliability**: Handle connection failures gracefully

**Example with PostgreSQL:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});
```

## Use Proper Security Practices

Security should be a priority from the start.

**Security Best Practices:**
- **Use HTTPS**: Always use HTTPS in production
- **Validate Input**: Validate and sanitize all input
- **Use Authentication**: Implement proper authentication
- **Keep Dependencies Updated**: Regularly update your dependencies
- **Use Secrets Management**: Store secrets securely

**Example Input Validation:**
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process validated data
});
```

## Use Monitoring and Observability

Monitor your application to detect issues early.

**Monitoring Best Practices:**
- **Health Checks**: Implement health check endpoints
- **Metrics**: Track important metrics
- **Logs**: Use structured logging
- **Alerts**: Set up alerts for critical issues

**Example Metrics:**
```javascript
const prometheus = require('prom-client');

// Create a Registry
const register = new prometheus.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'my-app'
});

// Enable the collection of default metrics
prometheus.collectDefaultMetrics({ register });

// Create a custom metric
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

register.registerMetric(httpRequestDuration);
```

## Use Proper Resource Management

Manage your application's resources efficiently.

**Resource Management Best Practices:**
- **Memory Management**: Monitor memory usage and clean up resources
- **Connection Management**: Close connections when done
- **File Handling**: Close files after reading/writing
- **Timer Management**: Clear timers and intervals

**Example Resource Cleanup:**
```javascript
// Clean up resources on shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  pool.end(() => {
    console.log('Database connections closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

## Use Proper Testing

Write tests for your application to ensure reliability.

**Testing Best Practices:**
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test how different parts work together
- **End-to-End Tests**: Test complete user workflows
- **Test Coverage**: Aim for good test coverage

**Example Test:**
```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
      
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});
```

## Use Proper Documentation

Document your application for maintainability.

**Documentation Best Practices:**
- **README**: Include a comprehensive README
- **API Documentation**: Document your API endpoints
- **Code Comments**: Add meaningful comments to your code
- **Deployment Guide**: Document how to deploy your application

**Example README:**
```markdown
# My Application

A simple web application built with Node.js and Express.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the application: `npm start`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Port number (default: 3000)
- `NODE_ENV`: Environment (development, production)

### API Endpoints
- `GET /health`: Health check endpoint
- `POST /api/users`: Create a new user
- `GET /api/users/:id`: Get user by ID
```

## Use Proper Version Control

Use version control effectively for your project.

**Version Control Best Practices:**
- **Meaningful Commits**: Write clear commit messages
- **Branch Strategy**: Use a consistent branching strategy
- **Code Reviews**: Review code before merging
- **Tags**: Tag releases for easy reference

**Example Commit Message:**
```
feat: add user authentication

- Add JWT-based authentication
- Add login and logout endpoints
- Add middleware for protected routes
- Add password hashing with bcrypt
```

## Use Proper CI/CD

Set up continuous integration and deployment.

**CI/CD Best Practices:**
- **Automated Testing**: Run tests on every commit
- **Automated Deployment**: Deploy automatically on successful builds
- **Environment Promotion**: Promote code through environments
- **Rollback Strategy**: Have a plan for rolling back deployments

**Example GitHub Actions:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```