const axios = require('axios');
require('dotenv').config();

const API_BASE = `http://localhost:${process.env.API_PORT || 3001}`;
const API_KEY = process.env.API_KEY || 'xyian-bot-api-2024';

async function testAPI() {
    console.log('🧪 Testing XYIAN Bot API Endpoints...\n');
    
    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await axios.get(`${API_BASE}/api/health`);
        console.log(`   ✅ Health: ${healthResponse.data.status}`);
        
        // Test 2: System Status
        console.log('2. Testing System Status...');
        const statusResponse = await axios.get(`${API_BASE}/api/status`);
        console.log(`   ✅ Status: ${statusResponse.data.status}`);
        console.log(`   📊 Total Interactions: ${statusResponse.data.totalInteractions}`);
        console.log(`   ⏱️  Uptime: ${Math.round(statusResponse.data.uptime)}s`);
        
        // Test 3: Analytics Overview
        console.log('3. Testing Analytics Overview...');
        const analyticsResponse = await axios.get(`${API_BASE}/api/analytics/overview`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`   ✅ Analytics: ${analyticsResponse.data.totalInteractions} total interactions`);
        console.log(`   🤖 AI Responses: ${analyticsResponse.data.aiInteractions}`);
        console.log(`   ⚡ Avg Response Time: ${analyticsResponse.data.averageResponseTime}ms`);
        
        // Test 4: Popular Questions
        console.log('4. Testing Popular Questions...');
        const popularResponse = await axios.get(`${API_BASE}/api/analytics/questions/popular?limit=3`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`   ✅ Popular Questions: ${popularResponse.data.popularQuestions.length} found`);
        if (popularResponse.data.popularQuestions.length > 0) {
            console.log(`   🔥 Top Question: "${popularResponse.data.popularQuestions[0].question.substring(0, 50)}..."`);
        }
        
        // Test 5: Performance Metrics
        console.log('5. Testing Performance Metrics...');
        const performanceResponse = await axios.get(`${API_BASE}/api/analytics/performance`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`   ✅ Performance: ${performanceResponse.data.responseTimes.totalResponses} responses tracked`);
        console.log(`   📈 Channels: ${performanceResponse.data.channelStats.length} active channels`);
        
        // Test 6: Learning Suggestions
        console.log('6. Testing Learning Suggestions...');
        const learningResponse = await axios.get(`${API_BASE}/api/learning/suggestions`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`   ✅ Learning: ${learningResponse.data.suggestions.length} suggestions available`);
        
        // Test 7: Export Data
        console.log('7. Testing Data Export...');
        const exportResponse = await axios.get(`${API_BASE}/api/export/analytics`, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log(`   ✅ Export: Analytics data exported successfully`);
        console.log(`   📊 Export contains: ${exportResponse.data.totalInteractions} interactions`);
        
        console.log('\n🎉 All API tests passed successfully!');
        console.log('\n📋 Available Endpoints:');
        console.log('   • GET  /api/health - System health check');
        console.log('   • GET  /api/status - System status and metrics');
        console.log('   • GET  /api/analytics/overview - Full analytics dashboard');
        console.log('   • GET  /api/analytics/questions/popular - Most asked questions');
        console.log('   • GET  /api/analytics/performance - Performance metrics');
        console.log('   • POST /api/learning/feedback - Submit feedback');
        console.log('   • GET  /api/learning/suggestions - Learning suggestions');
        console.log('   • GET  /api/export/interactions - Export interaction data');
        console.log('   • GET  /api/export/analytics - Export analytics data');
        
    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the test
testAPI();
