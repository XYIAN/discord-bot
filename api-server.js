const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

app.use('/api/', limiter);

// Database connection
const dataDir = path.join(__dirname, 'data');
const db = new Database(path.join(dataDir, 'bot_analytics.db'));

// API Key middleware (simple implementation)
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY || 'xyian-bot-api-2024';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Invalid or missing API key' });
    }
    next();
};

// Public endpoints (no auth required)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '0.0.9'
    });
});

app.get('/api/status', (req, res) => {
    try {
        const totalInteractions = db.prepare('SELECT COUNT(*) as count FROM interactions').get();
        const recentInteractions = db.prepare(`
            SELECT COUNT(*) as count 
            FROM interactions 
            WHERE timestamp > datetime('now', '-1 hour')
        `).get();
        
        res.json({
            status: 'operational',
            totalInteractions: totalInteractions.count,
            recentInteractions: recentInteractions.count,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Protected endpoints (require API key)
app.use('/api/analytics', apiKeyAuth);
app.use('/api/learning', apiKeyAuth);
app.use('/api/export', apiKeyAuth);

// Analytics endpoints
app.get('/api/analytics/overview', (req, res) => {
    try {
        const totalInteractions = db.prepare('SELECT COUNT(*) as count FROM interactions').get();
        const aiInteractions = db.prepare('SELECT COUNT(*) as count FROM interactions WHERE ai_generated = 1').get();
        const avgResponseTime = db.prepare('SELECT AVG(response_time_ms) as avg FROM interactions').get();
        const todayInteractions = db.prepare(`
            SELECT COUNT(*) as count 
            FROM interactions 
            WHERE date(timestamp) = date('now')
        `).get();
        
        res.json({
            totalInteractions: totalInteractions.count,
            aiInteractions: aiInteractions.count,
            databaseInteractions: totalInteractions.count - aiInteractions.count,
            averageResponseTime: Math.round(avgResponseTime.avg || 0),
            todayInteractions: todayInteractions.count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics overview' });
    }
});

app.get('/api/analytics/questions/popular', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const popularQuestions = db.prepare(`
            SELECT question, COUNT(*) as count 
            FROM interactions 
            GROUP BY LOWER(question) 
            ORDER BY count DESC 
            LIMIT ?
        `).all(limit);
        
        res.json({
            popularQuestions: popularQuestions.map(q => ({
                question: q.question,
                frequency: q.count
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular questions' });
    }
});

app.get('/api/analytics/performance', (req, res) => {
    try {
        const responseTimes = db.prepare(`
            SELECT 
                AVG(response_time_ms) as avg_time,
                MIN(response_time_ms) as min_time,
                MAX(response_time_ms) as max_time,
                COUNT(*) as total_responses
            FROM interactions 
            WHERE response_time_ms IS NOT NULL
        `).get();
        
        const channelStats = db.prepare(`
            SELECT channel, COUNT(*) as count
            FROM interactions 
            GROUP BY channel 
            ORDER BY count DESC
        `).all();
        
        res.json({
            responseTimes: {
                average: Math.round(responseTimes.avg_time || 0),
                minimum: responseTimes.min_time || 0,
                maximum: responseTimes.max_time || 0,
                totalResponses: responseTimes.total_responses || 0
            },
            channelStats: channelStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

// Learning endpoints
app.post('/api/learning/feedback', (req, res) => {
    try {
        const { interaction_id, rating, correction } = req.body;
        
        if (!interaction_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid feedback data' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO feedback (interaction_id, rating, correction)
            VALUES (?, ?, ?)
        `);
        
        stmt.run(interaction_id, rating, correction || null);
        
        res.json({ 
            success: true, 
            message: 'Feedback recorded successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to record feedback' });
    }
});

app.get('/api/learning/suggestions', (req, res) => {
    try {
        // Get questions with low feedback scores
        const poorResponses = db.prepare(`
            SELECT i.question, i.response, AVG(f.rating) as avg_rating, COUNT(f.rating) as feedback_count
            FROM interactions i
            LEFT JOIN feedback f ON i.id = f.interaction_id
            GROUP BY i.id
            HAVING avg_rating < 3 AND feedback_count > 0
            ORDER BY avg_rating ASC
            LIMIT 10
        `).all();
        
        // Get questions with no feedback
        const noFeedback = db.prepare(`
            SELECT question, response, COUNT(*) as frequency
            FROM interactions i
            LEFT JOIN feedback f ON i.id = f.interaction_id
            WHERE f.id IS NULL
            GROUP BY LOWER(question)
            ORDER BY frequency DESC
            LIMIT 5
        `).all();
        
        res.json({
            poorResponses: poorResponses,
            noFeedback: noFeedback,
            suggestions: [
                'Consider improving responses with low ratings',
                'Add more detailed explanations for complex questions',
                'Include specific character and item recommendations'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate learning suggestions' });
    }
});

// Export endpoints
app.get('/api/export/interactions', (req, res) => {
    try {
        const format = req.query.format || 'json';
        const dateFrom = req.query.date_from || '2024-01-01';
        
        const interactions = db.prepare(`
            SELECT * FROM interactions 
            WHERE date(timestamp) >= date(?)
            ORDER BY timestamp DESC
        `).all(dateFrom);
        
        if (format === 'csv') {
            // Convert to CSV
            const csv = [
                'id,timestamp,user_id,channel,question,response,response_time_ms,ai_generated',
                ...interactions.map(i => 
                    `${i.id},"${i.timestamp}","${i.user_id}","${i.channel}","${i.question}","${i.response}",${i.response_time_ms},${i.ai_generated}`
                )
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=interactions.csv');
            res.send(csv);
        } else {
            res.json({
                interactions: interactions,
                count: interactions.length,
                exportDate: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to export interactions' });
    }
});

app.get('/api/export/analytics', (req, res) => {
    try {
        const format = req.query.format || 'json';
        
        const overview = db.prepare('SELECT COUNT(*) as count FROM interactions').get();
        const aiCount = db.prepare('SELECT COUNT(*) as count FROM interactions WHERE ai_generated = 1').get();
        const avgTime = db.prepare('SELECT AVG(response_time_ms) as avg FROM interactions').get();
        
        const analytics = {
            totalInteractions: overview.count,
            aiInteractions: aiCount.count,
            averageResponseTime: Math.round(avgTime.avg || 0),
            exportDate: new Date().toISOString()
        };
        
        if (format === 'csv') {
            const csv = `metric,value\ntotalInteractions,${analytics.totalInteractions}\naiInteractions,${analytics.aiInteractions}\naverageResponseTime,${analytics.averageResponseTime}`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
            res.send(csv);
        } else {
            res.json(analytics);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to export analytics' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /api/health',
            'GET /api/status',
            'GET /api/analytics/overview',
            'GET /api/analytics/questions/popular',
            'GET /api/analytics/performance',
            'POST /api/learning/feedback',
            'GET /api/learning/suggestions',
            'GET /api/export/interactions',
            'GET /api/export/analytics'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics/overview`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
