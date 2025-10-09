const fs = require('fs');

async function injectForumKnowledge() {
    console.log('🚀 Injecting forum knowledge into bot database...');
    
    try {
        // Read the forum data
        const forumData = JSON.parse(fs.readFileSync('forum-threads-data-1759697201863.json', 'utf8'));
        
        // Read existing bot knowledge
        const botKnowledgePath = '../data/archero_qa_learned.json';
        let botKnowledge = {};
        
        if (fs.existsSync(botKnowledgePath)) {
            botKnowledge = JSON.parse(fs.readFileSync(botKnowledgePath, 'utf8'));
        }
        
        // Add forum data to existing knowledge
        const updatedKnowledge = {
            ...botKnowledge,
            forumThreads: forumData.forumThreads,
            forumGameInfo: forumData.gameInfo,
            lastUpdated: new Date().toISOString()
        };
        
        // Save updated knowledge
        fs.writeFileSync(botKnowledgePath, JSON.stringify(updatedKnowledge, null, 2));
        console.log(`✅ Forum knowledge saved to ${botKnowledgePath}`);
        
        console.log('📊 Forum Knowledge Injection Summary:');
        console.log(`- Forum threads: ${forumData.forumThreads.length}`);
        console.log(`- Forum game info: ${forumData.gameInfo.length}`);
        console.log(`- Unique keywords: ${[...new Set(forumData.gameInfo.flatMap(g => g.keywords))].length}`);
        
        return updatedKnowledge;
        
    } catch (error) {
        console.error('❌ Forum knowledge injection failed:', error);
        throw error;
    }
}

// Run the knowledge injector
if (require.main === module) {
    injectForumKnowledge()
        .then(data => {
            console.log('✅ Forum knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Forum knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = { injectForumKnowledge };
