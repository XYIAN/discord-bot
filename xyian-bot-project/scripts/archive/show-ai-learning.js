const fs = require('fs');
const path = require('path');

console.log('🧠 AI LEARNING SYSTEM STATUS');
console.log('============================');

// Check if AI learning data file exists
const learningFile = path.join(__dirname, 'data', 'ai-learning-data.json');

if (fs.existsSync(learningFile)) {
    const data = JSON.parse(fs.readFileSync(learningFile, 'utf8'));
    
    console.log('✅ AI Learning data file exists');
    console.log(`📊 Feedback entries: ${Object.keys(data.feedback || {}).length}`);
    console.log(`📊 Learning entries: ${Object.keys(data.learning || {}).length}`);
    console.log(`📅 Last updated: ${data.lastUpdated || 'Unknown'}`);
    
    if (Object.keys(data.feedback || {}).length > 0) {
        console.log('\n📋 RECENT FEEDBACK:');
        console.log('===================');
        Object.entries(data.feedback).slice(0, 5).forEach(([key, feedback]) => {
            console.log(`❓ Question: "${feedback.question}"`);
            console.log(`💬 Feedback: ${feedback.feedback}`);
            console.log(`❌ Wrong: ${feedback.wrong ? 'YES' : 'NO'}`);
            console.log(`👤 User: ${feedback.user}`);
            console.log(`📅 Time: ${feedback.timestamp}`);
            console.log('---');
        });
    } else {
        console.log('\n❌ No feedback entries found!');
        console.log('💡 Users can give feedback by:');
        console.log('   • Reacting with 👍 or 👎 to AI responses');
        console.log('   • Using !ai-feedback "question" "correction"');
        console.log('   • Using !ai-thumbs-down "question"');
    }
    
    if (Object.keys(data.learning || {}).length > 0) {
        console.log('\n📚 RECENT LEARNING:');
        console.log('==================');
        Object.entries(data.learning).slice(0, 3).forEach(([key, learning]) => {
            console.log(`❓ Question: "${learning.question}"`);
            console.log(`🤖 Response: ${learning.response.substring(0, 100)}...`);
            console.log(`👤 User: ${learning.user}`);
            console.log(`📅 Time: ${learning.timestamp}`);
            console.log('---');
        });
    }
    
} else {
    console.log('❌ AI Learning data file does not exist!');
    console.log('💡 The AI will create it automatically when users give feedback.');
}

console.log('\n🎯 HOW THE AI LEARNING WORKS:');
console.log('============================');
console.log('1. 🤖 AI gives a response');
console.log('2. 👆 User reacts with 👍 or 👎');
console.log('3. 💾 Feedback is automatically saved');
console.log('4. 🧠 AI learns from feedback for future similar questions');
console.log('5. 📈 Responses improve over time');
console.log('\n✅ NO MORE MANUAL CODE CHANGES NEEDED!');
