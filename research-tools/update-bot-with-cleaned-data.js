const fs = require('fs');
const path = require('path');

async function updateBotWithCleanedData() {
    console.log('🔄 Updating Bot with Cleaned, High-Quality Data...');
    
    // Load cleaned data
    const cleanedFile = path.join(__dirname, '..', 'data', 'cleaned-knowledge-database.json');
    const tipsFile = path.join(__dirname, '..', 'data', 'high-quality-tips.json');
    
    if (!fs.existsSync(cleanedFile)) {
        console.log('❌ Cleaned data not found. Run data-quality-auditor.js first.');
        return;
    }
    
    const cleanedEntries = JSON.parse(fs.readFileSync(cleanedFile, 'utf8'));
    const tips = fs.existsSync(tipsFile) ? JSON.parse(fs.readFileSync(tipsFile, 'utf8')) : [];
    
    console.log(`📊 Loaded ${cleanedEntries.length} cleaned entries and ${tips.length} high-quality tips`);
    
    // Create new high-quality knowledge database
    const highQualityDatabase = {
        metadata: {
            created: new Date().toISOString(),
            totalEntries: cleanedEntries.length,
            totalTips: tips.length,
            quality: 'high',
            source: 'AI-cleaned from scraped data'
        },
        entries: {},
        tips: {},
        categories: {
            weapons: [],
            skills: [],
            builds: [],
            strategy: [],
            mechanics: []
        }
    };
    
    // Process cleaned entries
    cleanedEntries.forEach(entry => {
        highQualityDatabase.entries[entry.key] = {
            content: entry.cleanedContent,
            originalContent: entry.originalContent,
            quality: entry.quality,
            source: 'AI-cleaned'
        };
        
        // Categorize entries
        const content = entry.cleanedContent.toLowerCase();
        if (content.includes('weapon') || content.includes('sword') || content.includes('bow') || content.includes('staff')) {
            highQualityDatabase.categories.weapons.push(entry.key);
        }
        if (content.includes('skill') || content.includes('ability') || content.includes('power')) {
            highQualityDatabase.categories.skills.push(entry.key);
        }
        if (content.includes('build') || content.includes('strategy') || content.includes('guide')) {
            highQualityDatabase.categories.builds.push(entry.key);
        }
        if (content.includes('strategy') || content.includes('tactic') || content.includes('approach')) {
            highQualityDatabase.categories.strategy.push(entry.key);
        }
        if (content.includes('mechanic') || content.includes('system') || content.includes('feature')) {
            highQualityDatabase.categories.mechanics.push(entry.key);
        }
    });
    
    // Process tips
    tips.forEach(tip => {
        highQualityDatabase.tips[tip.category] = tip.tip;
    });
    
    // Save new high-quality database
    const outputFile = path.join(__dirname, '..', 'data', 'high-quality-knowledge-database.json');
    fs.writeFileSync(outputFile, JSON.stringify(highQualityDatabase, null, 2));
    console.log(`💾 High-quality database saved to: ${outputFile}`);
    
    // Update bot to use cleaned data
    await updateBotCode(highQualityDatabase);
    
    console.log('✅ Bot updated with cleaned, high-quality data!');
}

async function updateBotCode(database) {
    console.log('🔧 Updating bot code to use cleaned data...');
    
    const botFile = path.join(__dirname, '..', 'ultimate-xyian-bot.js');
    let botCode = fs.readFileSync(botFile, 'utf8');
    
    // Update the loadKnowledgeDatabase function
    const newLoadFunction = `
// Load high-quality knowledge database
let archeroDatabase = {};
function loadKnowledgeDatabase() {
    try {
        const highQualityFile = path.join(__dirname, 'data', 'high-quality-knowledge-database.json');
        if (fs.existsSync(highQualityFile)) {
            const data = JSON.parse(fs.readFileSync(highQualityFile, 'utf8'));
            
            // Load cleaned entries
            archeroDatabase = {};
            Object.keys(data.entries).forEach(key => {
                archeroDatabase[key] = data.entries[key].content;
            });
            
            console.log(\`✅ Loaded high-quality knowledge database with \${Object.keys(archeroDatabase).length} entries\`);
            console.log(\`📊 Quality: \${data.metadata.quality}\`);
            console.log(\`📊 Source: \${data.metadata.source}\`);
        } else {
            console.log('⚠️ High-quality database not found, using empty database');
            archeroDatabase = {};
        }
    } catch (error) {
        console.error('❌ Failed to load high-quality knowledge database:', error);
        archeroDatabase = {};
    }
}`;

    // Replace the existing loadKnowledgeDatabase function
    const functionRegex = /\/\/ Load comprehensive knowledge database[\s\S]*?loadKnowledgeDatabase\(\);/;
    botCode = botCode.replace(functionRegex, newLoadFunction + '\n\n// Load knowledge database on startup\nloadKnowledgeDatabase();');
    
    // Update tip generation to use high-quality tips
    const newTipFunction = `
// Send daily tip using high-quality database
async function sendDailyTip() {
    // Get random tip from our high-quality database
    const tipKeys = Object.keys(archeroDatabase);
    if (tipKeys.length === 0) {
        // Fallback to basic tip
        const embed = new EmbedBuilder()
            .setTitle('💡 Daily Archero 2 Tip')
            .setDescription('Focus on upgrading your main weapon first - it provides the most DPS increase!')
            .setColor(0x00BFFF)
            .setTimestamp()
            .setFooter({ text: 'XYIAN OFFICIAL - Daily Tips' });
        await sendToGeneral({ embeds: [embed] });
        return;
    }
    
    const randomKey = tipKeys[Math.floor(Math.random() * tipKeys.length)];
    const tip = archeroDatabase[randomKey];
    
    const embed = new EmbedBuilder()
        .setTitle('💡 Daily Archero 2 Tip')
        .setDescription(tip)
        .setColor(0x00BFFF)
        .setTimestamp()
        .setFooter({ text: 'XYIAN OFFICIAL - High-Quality Tips' });

    await sendToGeneral({ embeds: [embed] });
}`;

    // Replace the existing sendDailyTip function
    const tipRegex = /\/\/ Send daily tip using comprehensive database[\s\S]*?await sendToGeneral\(\{ embeds: \[embed\] \}\);\n\}/;
    botCode = botCode.replace(tipRegex, newTipFunction);
    
    // Save updated bot code
    fs.writeFileSync(botFile, botCode);
    console.log('✅ Bot code updated with high-quality data integration');
}

// Main execution
async function main() {
    try {
        await updateBotWithCleanedData();
    } catch (error) {
        console.error('❌ Error updating bot:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { updateBotWithCleanedData };
