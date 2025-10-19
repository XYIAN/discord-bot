# Discord Bot Security Best Practices

## Token Security

### Environment Variables
```javascript
// Never hardcode tokens
const token = process.env.DISCORD_TOKEN; // ✅ Good
const token = 'your_token_here'; // ❌ Bad

// Use .env file
require('dotenv').config();
```

### Token Rotation
```javascript
// Implement token rotation
async function rotateToken() {
    // Generate new token
    const newToken = await generateNewToken();
    
    // Update environment
    process.env.DISCORD_TOKEN = newToken;
    
    // Restart bot with new token
    process.exit(0);
}
```

## Permission Management

### Principle of Least Privilege
```javascript
// Only request necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Check permissions before actions
async function kickUser(member, targetMember) {
    if (!member.permissions.has('KickMembers')) {
        throw new Error('Insufficient permissions');
    }
    
    await targetMember.kick();
}
```

### Role-Based Access Control
```javascript
// Implement RBAC
const permissions = {
    'admin': ['KickMembers', 'BanMembers', 'ManageChannels'],
    'moderator': ['KickMembers', 'ManageMessages'],
    'member': ['SendMessages']
};

function hasPermission(user, action) {
    const userRoles = user.roles.cache.map(role => role.name);
    
    for (const role of userRoles) {
        if (permissions[role]?.includes(action)) {
            return true;
        }
    }
    
    return false;
}
```

## Input Validation

### Sanitize User Input
```javascript
// Sanitize user input
function sanitizeInput(input) {
    return input
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim()
        .substring(0, 100); // Limit length
}

// Validate command arguments
function validateCommand(args, expectedTypes) {
    if (args.length !== expectedTypes.length) {
        throw new Error('Invalid number of arguments');
    }
    
    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] !== expectedTypes[i]) {
            throw new Error(`Argument ${i} must be ${expectedTypes[i]}`);
        }
    }
}
```

### SQL Injection Prevention
```javascript
// Use parameterized queries
const db = require('better-sqlite3')('bot.db');

// ✅ Good - parameterized query
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// ❌ Bad - string concatenation
const user = db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();
```

## Rate Limiting

### Command Cooldowns
```javascript
// Implement command cooldowns
const cooldowns = new Map();

function isOnCooldown(userId, command, cooldownTime) {
    const key = `${userId}-${command}`;
    const now = Date.now();
    
    if (cooldowns.has(key)) {
        const lastUsed = cooldowns.get(key);
        if (now - lastUsed < cooldownTime) {
            return true;
        }
    }
    
    cooldowns.set(key, now);
    return false;
}

// Apply cooldown to command
if (isOnCooldown(interaction.user.id, 'ping', 5000)) {
    await interaction.reply('Command is on cooldown!', { ephemeral: true });
    return;
}
```

### API Rate Limiting
```javascript
// Implement API rate limiting
const rateLimiter = new Map();

async function makeAPICall(endpoint, data) {
    const key = endpoint;
    const now = Date.now();
    
    if (rateLimiter.has(key)) {
        const lastCall = rateLimiter.get(key);
        const timeDiff = now - lastCall;
        
        if (timeDiff < 1000) { // 1 second cooldown
            await new Promise(resolve => setTimeout(resolve, 1000 - timeDiff));
        }
    }
    
    rateLimiter.set(key, now);
    
    // Make API call
    return await fetch(endpoint, data);
}
```

## Error Handling

### Secure Error Messages
```javascript
// Don't expose sensitive information
try {
    await dangerousOperation();
} catch (error) {
    console.error('Error:', error); // Log full error
    
    // Send generic error to user
    await interaction.reply('An error occurred. Please try again later.');
}
```

### Error Logging
```javascript
// Implement proper error logging
const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log' }),
        new winston.transports.Console()
    ]
});

// Log errors
client.on('error', error => {
    logger.error('Discord client error:', error);
});
```

## Data Protection

### Encrypt Sensitive Data
```javascript
const crypto = require('crypto');

// Encrypt sensitive data
function encrypt(text, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decrypt sensitive data
function decrypt(encryptedText, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
```

### Secure Configuration
```javascript
// Use secure configuration
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    database: {
        url: process.env.DATABASE_URL,
        ssl: true
    }
};

// Validate configuration
function validateConfig(config) {
    const required = ['token', 'clientId', 'guildId'];
    
    for (const field of required) {
        if (!config[field]) {
            throw new Error(`Missing required configuration: ${field}`);
        }
    }
}
```

## Webhook Security

### Validate Webhook Signatures
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    return signature === expectedSignature;
}

// Use in webhook handler
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
        return res.status(401).send('Unauthorized');
    }
    
    // Process webhook
});
```

## Monitoring and Logging

### Security Event Logging
```javascript
// Log security events
function logSecurityEvent(event, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        severity: 'high'
    };
    
    logger.warn('Security event:', logEntry);
}

// Monitor suspicious activity
client.on('messageCreate', message => {
    if (message.content.includes('token') || message.content.includes('password')) {
        logSecurityEvent('suspicious_message', {
            user: message.author.id,
            content: message.content,
            channel: message.channel.id
        });
    }
});
```

### Health Checks
```javascript
// Implement health checks
app.get('/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    };
    
    res.json(health);
});
```

## Best Practices Summary

1. **Never expose tokens** - Use environment variables
2. **Validate all input** - Sanitize user input
3. **Implement rate limiting** - Prevent abuse
4. **Use least privilege** - Minimal permissions
5. **Log security events** - Monitor for issues
6. **Encrypt sensitive data** - Protect user data
7. **Handle errors securely** - Don't expose internals
8. **Regular updates** - Keep dependencies updated
9. **Monitor activity** - Watch for suspicious behavior
10. **Backup data** - Regular backups

## Resources

- [Discord Security Guidelines](https://discord.com/developers/docs/topics/oauth2#security)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
