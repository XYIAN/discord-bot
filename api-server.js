const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
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

// Simple JSON database
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'bot_analytics.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
        interactions: [],
        feedback: [],
        analytics: {
            totalInteractions: 0,
            aiInteractions: 0,
            averageResponseTime: 0
        }
    }));
}

// Helper functions for JSON database
function readData() {
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return {
            interactions: [],
            feedback: [],
            analytics: {
                totalInteractions: 0,
                aiInteractions: 0,
                averageResponseTime: 0
            }
        };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data file:', error);
    }
}

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
        version: '0.1.1'
    });
});

app.get('/api/status', (req, res) => {
    try {
        const data = readData();
        const uptime = process.uptime(); // Node.js process uptime
        res.status(200).json({
            status: 'running',
            uptime: uptime,
            totalInteractions: data.interactions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ API Status Error:', error);
        res.status(500).json({ error: 'Failed to retrieve status', details: error.message });
    }
});

// Protected endpoints (require API Key)
app.get('/api/analytics/overview', apiKeyAuth, (req, res) => {
    try {
        const data = readData();
        const totalInteractions = data.interactions.length;
        const aiInteractions = data.interactions.filter(i => i.ai_generated).length;
        const averageResponseTime = data.interactions.length > 0 
            ? data.interactions.reduce((sum, i) => sum + (i.response_time_ms || 0), 0) / data.interactions.length 
            : 0;
        
        // Get popular questions
        const questionCounts = {};
        data.interactions.forEach(i => {
            const question = i.question?.toLowerCase() || '';
            questionCounts[question] = (questionCounts[question] || 0) + 1;
        });
        
        const popularQuestions = Object.entries(questionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([question, count]) => ({ question, count }));

        res.status(200).json({
            totalInteractions,
            aiInteractions,
            averageResponseTime: Math.round(averageResponseTime),
            popularQuestions,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Analytics Overview Error:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics overview', details: error.message });
    }
});

app.get('/api/analytics/questions/popular', apiKeyAuth, (req, res) => {
    try {
        const data = readData();
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        
        const questionCounts = {};
        data.interactions.forEach(i => {
            const question = i.question?.toLowerCase() || '';
            questionCounts[question] = (questionCounts[question] || 0) + 1;
        });
        
        const popularQuestions = Object.entries(questionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([question, count]) => ({ question, count }));
            
        res.status(200).json({ popularQuestions, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('❌ Popular Questions Error:', error);
        res.status(500).json({ error: 'Failed to retrieve popular questions', details: error.message });
    }
});

app.get('/api/analytics/performance', apiKeyAuth, (req, res) => {
    try {
        const data = readData();
        const responseTimes = data.interactions.map(i => ({
            response_time_ms: i.response_time_ms || 0,
            ai_generated: i.ai_generated || false
        }));
        
        const channelStats = {};
        data.interactions.forEach(i => {
            const channel = i.channel || 'unknown';
            if (!channelStats[channel]) {
                channelStats[channel] = { count: 0, totalTime: 0 };
            }
            channelStats[channel].count++;
            channelStats[channel].totalTime += i.response_time_ms || 0;
        });
        
        const channelStatsArray = Object.entries(channelStats).map(([channel, stats]) => ({
            channel,
            count: stats.count,
            avg_response_time: stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0
        })).sort((a, b) => b.count - a.count);

        const aiResponses = responseTimes.filter(r => r.ai_generated);
        const dbResponses = responseTimes.filter(r => !r.ai_generated);

        res.status(200).json({
            responseTimes: {
                totalResponses: responseTimes.length,
                average: responseTimes.length > 0 ? Math.round(responseTimes.reduce((sum, r) => sum + r.response_time_ms, 0) / responseTimes.length) : 0,
                aiAverage: aiResponses.length > 0 ? Math.round(aiResponses.reduce((sum, r) => sum + r.response_time_ms, 0) / aiResponses.length) : 0,
                dbAverage: dbResponses.length > 0 ? Math.round(dbResponses.reduce((sum, r) => sum + r.response_time_ms, 0) / dbResponses.length) : 0,
            },
            channelStats: channelStatsArray,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Performance Metrics Error:', error);
        res.status(500).json({ error: 'Failed to retrieve performance metrics', details: error.message });
    }
});

app.post('/api/learning/feedback', apiKeyAuth, (req, res) => {
    try {
        const { interaction_id, user_id, rating, correction } = req.body;
        if (!interaction_id || !user_id || !rating) {
            return res.status(400).json({ error: 'Missing required fields: interaction_id, user_id, rating' });
        }

        const data = readData();
        const feedback = {
            id: Date.now().toString(),
            interaction_id,
            user_id,
            rating,
            correction: correction || null,
            timestamp: new Date().toISOString()
        };
        
        data.feedback.push(feedback);
        writeData(data);

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('❌ Feedback Submission Error:', error);
        res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
    }
});

app.get('/api/learning/suggestions', apiKeyAuth, (req, res) => {
    try {
        const data = readData();
        
        // Find questions with low feedback or no answers
        const questionFeedback = {};
        data.feedback.forEach(f => {
            const interaction = data.interactions.find(i => i.id === f.interaction_id);
            if (interaction) {
                const question = interaction.question?.toLowerCase() || '';
                if (!questionFeedback[question]) {
                    questionFeedback[question] = { ratings: [], count: 0 };
                }
                questionFeedback[question].ratings.push(f.rating);
                questionFeedback[question].count++;
            }
        });
        
        const lowFeedbackQuestions = Object.entries(questionFeedback)
            .map(([question, stats]) => ({
                question,
                avg_rating: stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length,
                feedback_count: stats.count
            }))
            .filter(q => q.avg_rating < 3 || q.feedback_count === 0)
            .sort((a, b) => a.avg_rating - b.avg_rating)
            .slice(0, 5);

        res.status(200).json({
            suggestions: lowFeedbackQuestions,
            message: 'Suggestions for improving bot responses based on feedback and unanswered questions.'
        });
    } catch (error) {
        console.error('❌ Learning Suggestions Error:', error);
        res.status(500).json({ error: 'Failed to retrieve learning suggestions', details: error.message });
    }
});

app.get('/api/export/interactions', apiKeyAuth, (req, res) => {
    try {
        const data = readData();
        const format = req.query.format || 'json';
        
        if (format === 'csv') {
            if (data.interactions.length === 0) {
                return res.status(200).send('No interactions found');
            }
            
            const csv = [
                Object.keys(data.interactions[0]).join(','),
                ...data.interactions.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            
            res.header('Content-Type', 'text/csv');
            res.attachment('interactions.csv');
            return res.send(csv);
        }

        res.status(200).json(data.interactions);
    } catch (error) {
        console.error('❌ Export Interactions Error:', error);
        res.status(500).json({ error: 'Failed to export interactions', details: error.message });
    }
});

app.get('/api/export/analytics', apiKeyAuth, (req, res) => {
    try {
        const data = readData();
        const format = req.query.format || 'json';
        
        const analyticsData = {
            totalInteractions: data.interactions.length,
            aiInteractions: data.interactions.filter(i => i.ai_generated).length,
            averageResponseTime: data.interactions.length > 0 
                ? Math.round(data.interactions.reduce((sum, i) => sum + (i.response_time_ms || 0), 0) / data.interactions.length)
                : 0,
            popularQuestions: (() => {
                const questionCounts = {};
                data.interactions.forEach(i => {
                    const question = i.question?.toLowerCase() || '';
                    questionCounts[question] = (questionCounts[question] || 0) + 1;
                });
                return Object.entries(questionCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([question, count]) => ({ question, count }));
            })(),
            feedbackSummary: (() => {
                const ratings = data.feedback.map(f => f.rating);
                return {
                    avg_rating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
                    total_feedback: ratings.length
                };
            })()
        };

        if (format === 'csv') {
            let csv = 'Metric,Value\n';
            csv += `Total Interactions,${analyticsData.totalInteractions}\n`;
            csv += `AI Interactions,${analyticsData.aiInteractions}\n`;
            csv += `Average Response Time,${analyticsData.averageResponseTime}ms\n`;
            csv += `Average Feedback Rating,${analyticsData.feedbackSummary.avg_rating ? analyticsData.feedbackSummary.avg_rating.toFixed(2) : 'N/A'}\n`;
            csv += `Total Feedback,${analyticsData.feedbackSummary.total_feedback}\n`;
            csv += '\nPopular Questions\nQuestion,Count\n';
            analyticsData.popularQuestions.forEach(q => {
                csv += `"${String(q.question).replace(/"/g, '""')}",${q.count}\n`;
            });
            
            res.header('Content-Type', 'text/csv');
            res.attachment('analytics_summary.csv');
            return res.send(csv);
        }

        res.status(200).json(analyticsData);
    } catch (error) {
        console.error('❌ Export Analytics Error:', error);
        res.status(500).json({ error: 'Failed to export analytics', details: error.message });
    }
});

// Start the API server
const startApiServer = () => {
    app.listen(PORT, () => {
        console.log(`🌐 API Server running on port ${PORT}`);
    }).on('error', (err) => {
        console.error(`❌ Failed to start API server on port ${PORT}:`, err.message);
    });
};

module.exports = startApiServer;