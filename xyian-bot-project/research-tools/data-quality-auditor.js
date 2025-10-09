const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function auditDataQuality() {
    console.log('🔍 Starting Data Quality Audit...');
    
    // Load the knowledge database
    const knowledgeFile = path.join(__dirname, '..', 'data', 'archero_qa_learned.json');
    if (!fs.existsSync(knowledgeFile)) {
        console.log('❌ Knowledge database not found');
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
    
    // Flatten the data like the bot does
    let archeroDatabase = {};
    const categories = ['theorycrafting', 'discordChannels', 'wikiPages', 'forumThreads', 'gameInfo', 'weapons', 'characters', 'mechanics', 'events', 'guild', 'artifacts', 'statistics'];
    
    categories.forEach(category => {
        if (data.categories && data.categories[category]) {
            Object.keys(data.categories[category]).forEach(key => {
                const entry = data.categories[category][key];
                if (entry && entry.content) {
                    const keywords = entry.keywords || [];
                    const source = entry.source || category;
                    
                    keywords.forEach(keyword => {
                        const dbKey = `${keyword}_${source}_${key}`;
                        archeroDatabase[dbKey] = entry.content.substring(0, 500);
                    });
                    
                    const generalKey = `${category}_${key}`;
                    archeroDatabase[generalKey] = entry.content.substring(0, 500);
                }
            });
        }
    });
    
    console.log(`📊 Total entries: ${Object.keys(archeroDatabase).length}`);
    
    // Analyze data quality
    const allEntries = Object.entries(archeroDatabase);
    
    // Categorize entries by quality
    const qualityAnalysis = {
        casualChat: [],
        educational: [],
        duplicate: [],
        tooShort: [],
        unclear: []
    };
    
    allEntries.forEach(([key, content]) => {
        // Check for casual chat indicators
        if (content.includes('lol') || content.includes('haha') || content.includes('wtf') || 
            content.includes('omg') || content.includes('@') || content.includes('yesterday') || 
            content.includes('today') || content.includes('Click to see attachment')) {
            qualityAnalysis.casualChat.push({ key, content });
        }
        // Check for educational content
        else if (content.includes('strategy') || content.includes('build') || content.includes('weapon') ||
                 content.includes('skill') || content.includes('damage') || content.includes('tier') ||
                 content.includes('recommend') || content.length > 100) {
            qualityAnalysis.educational.push({ key, content });
        }
        // Check for duplicates
        else if (content.length < 50) {
            qualityAnalysis.tooShort.push({ key, content });
        }
        else {
            qualityAnalysis.unclear.push({ key, content });
        }
    });
    
    console.log('\n📈 Quality Analysis Results:');
    console.log(`Casual chat entries: ${qualityAnalysis.casualChat.length}`);
    console.log(`Educational entries: ${qualityAnalysis.educational.length}`);
    console.log(`Too short entries: ${qualityAnalysis.tooShort.length}`);
    console.log(`Unclear entries: ${qualityAnalysis.unclear.length}`);
    
    // Show examples of each category
    console.log('\n🔍 Sample Casual Chat Entries:');
    qualityAnalysis.casualChat.slice(0, 3).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.key}: ${entry.content.substring(0, 100)}...`);
    });
    
    console.log('\n✅ Sample Educational Entries:');
    qualityAnalysis.educational.slice(0, 3).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.key}: ${entry.content.substring(0, 100)}...`);
    });
    
    // Save quality analysis
    const analysisFile = path.join(__dirname, '..', 'data', 'data-quality-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(qualityAnalysis, null, 2));
    console.log(`\n💾 Quality analysis saved to: ${analysisFile}`);
    
    return qualityAnalysis;
}

async function cleanDataWithAI(qualityAnalysis) {
    console.log('\n🤖 Starting AI-Powered Data Cleaning...');
    
    const cleanedEntries = [];
    const educationalEntries = qualityAnalysis.educational;
    
    console.log(`Processing ${educationalEntries.length} educational entries...`);
    
    // Process entries in batches to avoid API limits
    const batchSize = 5;
    for (let i = 0; i < educationalEntries.length; i += batchSize) {
        const batch = educationalEntries.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(educationalEntries.length / batchSize)}...`);
        
        for (const entry of batch) {
            try {
                const cleanedContent = await cleanEntryWithAI(entry.content);
                if (cleanedContent && cleanedContent.length > 50) {
                    cleanedEntries.push({
                        key: entry.key,
                        originalContent: entry.content,
                        cleanedContent: cleanedContent,
                        quality: 'high'
                    });
                }
            } catch (error) {
                console.log(`⚠️ Error processing entry ${entry.key}: ${error.message}`);
            }
        }
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Cleaned ${cleanedEntries.length} entries`);
    
    // Save cleaned data
    const cleanedFile = path.join(__dirname, '..', 'data', 'cleaned-knowledge-database.json');
    fs.writeFileSync(cleanedFile, JSON.stringify(cleanedEntries, null, 2));
    console.log(`💾 Cleaned data saved to: ${cleanedFile}`);
    
    return cleanedEntries;
}

async function cleanEntryWithAI(content) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Archero 2 game analyst. Your task is to clean and improve game-related content to make it educational and useful for players.

Rules:
1. Remove casual chat, opinions, and non-educational content
2. Extract only factual game information, strategies, and tips
3. Convert content into clear, educational format
4. Remove usernames, timestamps, and Discord formatting
5. Focus on actionable advice and game mechanics
6. If content is not educational, return "NOT_EDUCATIONAL"
7. Keep content concise but informative (100-300 characters)

Examples:
- "lol this weapon sucks" → "NOT_EDUCATIONAL"
- "Staff of Light has 15% crit chance and pierces enemies" → "Staff of Light: 15% crit chance, pierces enemies"
- "I think this build is good" → "NOT_EDUCATIONAL"`
                },
                {
                    role: "user",
                    content: `Clean this Archero 2 content: "${content}"`
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        });
        
        const cleanedContent = response.choices[0].message.content.trim();
        
        if (cleanedContent === "NOT_EDUCATIONAL" || cleanedContent.length < 20) {
            return null;
        }
        
        return cleanedContent;
    } catch (error) {
        console.error(`OpenAI API error: ${error.message}`);
        return null;
    }
}

async function createHighQualityTips(cleanedEntries) {
    console.log('\n💡 Creating High-Quality Tips...');
    
    const tips = [];
    const tipCategories = ['weapons', 'skills', 'builds', 'strategy', 'mechanics'];
    
    for (const category of tipCategories) {
        const categoryEntries = cleanedEntries.filter(entry => 
            entry.cleanedContent.toLowerCase().includes(category) ||
            entry.key.toLowerCase().includes(category)
        );
        
        if (categoryEntries.length > 0) {
            try {
                const tip = await generateTipWithAI(category, categoryEntries);
                if (tip) {
                    tips.push({
                        category: category,
                        tip: tip,
                        source: 'AI-Generated from Cleaned Data'
                    });
                }
            } catch (error) {
                console.log(`⚠️ Error generating tip for ${category}: ${error.message}`);
            }
        }
    }
    
    // Save high-quality tips
    const tipsFile = path.join(__dirname, '..', 'data', 'high-quality-tips.json');
    fs.writeFileSync(tipsFile, JSON.stringify(tips, null, 2));
    console.log(`💾 High-quality tips saved to: ${tipsFile}`);
    
    return tips;
}

async function generateTipWithAI(category, entries) {
    try {
        const sampleContent = entries.slice(0, 3).map(e => e.cleanedContent).join('\n');
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Archero 2 game guide writer. Create a helpful, educational tip about ${category} based on the provided game data.

Requirements:
1. Make it actionable and specific
2. Include concrete numbers/stats when available
3. Keep it concise (1-2 sentences)
4. Focus on practical advice
5. Use professional, educational tone
6. Avoid opinions, focus on facts`
                },
                {
                    role: "user",
                    content: `Based on this Archero 2 ${category} data, create a helpful tip:\n\n${sampleContent}`
                }
            ],
            max_tokens: 150,
            temperature: 0.4
        });
        
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error(`OpenAI API error for ${category}: ${error.message}`);
        return null;
    }
}

// Main execution
async function main() {
    try {
        console.log('🚀 Starting Data Quality Audit and Cleaning Process...\n');
        
        // Step 1: Audit current data quality
        const qualityAnalysis = await auditDataQuality();
        
        // Step 2: Clean educational entries with AI
        const cleanedEntries = await cleanDataWithAI(qualityAnalysis);
        
        // Step 3: Create high-quality tips
        const tips = await createHighQualityTips(cleanedEntries);
        
        console.log('\n✅ Data Quality Audit and Cleaning Complete!');
        console.log(`📊 Results:`);
        console.log(`- Original entries: ${Object.keys(qualityAnalysis.casualChat).length + Object.keys(qualityAnalysis.educational).length}`);
        console.log(`- Cleaned entries: ${cleanedEntries.length}`);
        console.log(`- High-quality tips: ${tips.length}`);
        
    } catch (error) {
        console.error('❌ Error during data cleaning:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { auditDataQuality, cleanDataWithAI, createHighQualityTips };
