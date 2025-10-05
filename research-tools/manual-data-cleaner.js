const fs = require('fs');
const path = require('path');

function cleanDataManually() {
    console.log('🧹 Manual Data Cleaning - Extracting Educational Content...');
    
    // Load the knowledge database
    const knowledgeFile = path.join(__dirname, '..', 'data', 'archero_qa_learned.json');
    if (!fs.existsSync(knowledgeFile)) {
        console.log('❌ Knowledge database not found');
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
    
    // Create cleaned database
    const cleanedDatabase = {
        metadata: {
            created: new Date().toISOString(),
            source: 'Manually cleaned from scraped data',
            quality: 'high',
            totalEntries: 0
        },
        categories: {
            weapons: [],
            skills: [],
            builds: [],
            strategies: [],
            mechanics: [],
            tips: []
        },
        entries: {}
    };
    
    // Process theorycrafting posts
    if (data.categories && data.categories.theorycrafting) {
        const entries = data.categories.theorycrafting;
        Object.keys(entries).forEach(key => {
            const entry = entries[key];
            const content = entry.content || '';
            
            // Extract useful information from each entry
            const usefulInfo = extractUsefulInfo(content);
            if (usefulInfo.length > 0) {
                usefulInfo.forEach((info, index) => {
                    const entryKey = `theorycrafting_${key}_${index}`;
                    cleanedDatabase.entries[entryKey] = {
                        content: info,
                        category: categorizeContent(info),
                        source: 'Theorycrafting Posts',
                        quality: 'high'
                    };
                    
                    // Add to appropriate category
                    const category = categorizeContent(info);
                    if (cleanedDatabase.categories[category]) {
                        cleanedDatabase.categories[category].push(entryKey);
                    }
                });
            }
        });
    }
    
    // Count total entries
    cleanedDatabase.metadata.totalEntries = Object.keys(cleanedDatabase.entries).length;
    
    // Save cleaned database
    const outputFile = path.join(__dirname, '..', 'data', 'cleaned-knowledge-database.json');
    fs.writeFileSync(outputFile, JSON.stringify(cleanedDatabase, null, 2));
    console.log(`💾 Cleaned database saved to: ${outputFile}`);
    console.log(`📊 Total cleaned entries: ${cleanedDatabase.metadata.totalEntries}`);
    
    // Show sample cleaned entries
    console.log('\n✅ Sample Cleaned Entries:');
    Object.keys(cleanedDatabase.entries).slice(0, 5).forEach(key => {
        const entry = cleanedDatabase.entries[key];
        console.log(`\n${key}:`);
        console.log(`  Category: ${entry.category}`);
        console.log(`  Content: ${entry.content}`);
    });
    
    return cleanedDatabase;
}

function extractUsefulInfo(content) {
    const usefulInfo = [];
    
    // Remove timestamps, usernames, and casual chat
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => {
        // Remove timestamp lines
        if (line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) || 
            line.match(/^\d{1,2}:\d{2}/) ||
            line.match(/^Yesterday at/) ||
            line.match(/^Today at/)) {
            return false;
        }
        
        // Remove username lines
        if (line.match(/^@\w+/) || 
            line.match(/^[A-Z][a-z]+ \|/) ||
            line.match(/^[A-Z][a-z]+$/)) {
            return false;
        }
        
        // Remove casual chat
        if (line.includes('lol') || line.includes('haha') || 
            line.includes('wtf') || line.includes('omg') ||
            line.includes('Click to see attachment') ||
            line.length < 10) {
            return false;
        }
        
        return true;
    });
    
    // Extract educational content
    cleanedLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 20) {
            // Check if line contains useful game information
            if (containsGameInfo(trimmedLine)) {
                usefulInfo.push(trimmedLine);
            }
        }
    });
    
    // Extract specific patterns
    const patterns = [
        // Weapon information
        /(?:weapon|staff|bow|crossbow|sword|claw).*?(?:damage|tier|best|recommend)/gi,
        // Skill combinations
        /(?:skill|combo|combination).*?(?:\+|and|with)/gi,
        // Build recommendations
        /(?:build|set|gear).*?(?:pve|pvp|arena|guild)/gi,
        // Strategy tips
        /(?:strategy|tip|guide|how to|recommend)/gi,
        // Mechanics
        /(?:rune|effect|buff|boost|mechanic)/gi
    ];
    
    patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach(match => {
                if (match.length > 30 && match.length < 200) {
                    usefulInfo.push(match.trim());
                }
            });
        }
    });
    
    return [...new Set(usefulInfo)]; // Remove duplicates
}

function containsGameInfo(text) {
    const gameKeywords = [
        'weapon', 'skill', 'build', 'strategy', 'damage', 'tier', 'best', 'recommend',
        'staff', 'bow', 'crossbow', 'sword', 'claw', 'rune', 'effect', 'buff', 'boost',
        'pve', 'pvp', 'arena', 'guild', 'boss', 'combo', 'combination', 'guide', 'tip'
    ];
    
    return gameKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
    );
}

function categorizeContent(content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('weapon') || lowerContent.includes('staff') || 
        lowerContent.includes('bow') || lowerContent.includes('sword') ||
        lowerContent.includes('crossbow') || lowerContent.includes('claw')) {
        return 'weapons';
    }
    
    if (lowerContent.includes('skill') || lowerContent.includes('ability') ||
        lowerContent.includes('combo') || lowerContent.includes('combination')) {
        return 'skills';
    }
    
    if (lowerContent.includes('build') || lowerContent.includes('set') ||
        lowerContent.includes('gear') || lowerContent.includes('equipment')) {
        return 'builds';
    }
    
    if (lowerContent.includes('strategy') || lowerContent.includes('tip') ||
        lowerContent.includes('guide') || lowerContent.includes('how to')) {
        return 'strategies';
    }
    
    if (lowerContent.includes('rune') || lowerContent.includes('effect') ||
        lowerContent.includes('buff') || lowerContent.includes('boost') ||
        lowerContent.includes('mechanic')) {
        return 'mechanics';
    }
    
    return 'tips';
}

function createHighQualityTips(cleanedDatabase) {
    console.log('\n💡 Creating High-Quality Tips...');
    
    const tips = [];
    
    // Create tips from each category
    Object.keys(cleanedDatabase.categories).forEach(category => {
        const entries = cleanedDatabase.categories[category];
        if (entries.length > 0) {
            // Get a sample entry from this category
            const sampleEntry = cleanedDatabase.entries[entries[0]];
            if (sampleEntry) {
                tips.push({
                    category: category,
                    tip: createTipFromContent(sampleEntry.content, category),
                    source: 'Manually curated'
                });
            }
        }
    });
    
    // Save tips
    const tipsFile = path.join(__dirname, '..', 'data', 'high-quality-tips.json');
    fs.writeFileSync(tipsFile, JSON.stringify(tips, null, 2));
    console.log(`💾 High-quality tips saved to: ${tipsFile}`);
    
    return tips;
}

function createTipFromContent(content, category) {
    // Extract the most useful part of the content
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
    
    if (sentences.length === 0) return content;
    
    // Find the most informative sentence
    let bestSentence = sentences[0];
    let maxScore = 0;
    
    sentences.forEach(sentence => {
        let score = 0;
        const lowerSentence = sentence.toLowerCase();
        
        // Score based on game-related keywords
        if (lowerSentence.includes('weapon')) score += 2;
        if (lowerSentence.includes('skill')) score += 2;
        if (lowerSentence.includes('build')) score += 2;
        if (lowerSentence.includes('damage')) score += 1;
        if (lowerSentence.includes('tier')) score += 1;
        if (lowerSentence.includes('best')) score += 1;
        if (lowerSentence.includes('recommend')) score += 1;
        if (lowerSentence.includes('strategy')) score += 1;
        
        if (score > maxScore) {
            maxScore = score;
            bestSentence = sentence.trim();
        }
    });
    
    return bestSentence;
}

// Main execution
function main() {
    try {
        console.log('🚀 Starting Manual Data Cleaning Process...\n');
        
        // Step 1: Clean data manually
        const cleanedDatabase = cleanDataManually();
        
        // Step 2: Create high-quality tips
        const tips = createHighQualityTips(cleanedDatabase);
        
        console.log('\n✅ Manual Data Cleaning Complete!');
        console.log(`📊 Results:`);
        console.log(`- Cleaned entries: ${cleanedDatabase.metadata.totalEntries}`);
        console.log(`- High-quality tips: ${tips.length}`);
        console.log(`- Categories: ${Object.keys(cleanedDatabase.categories).join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error during manual data cleaning:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { cleanDataManually, createHighQualityTips };
