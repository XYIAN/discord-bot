// MASS UPDATE EXISTING THREADS SCRIPT
// Use this to update existing threads with new data (without deleting)

const { getAllCurrentThreads, updateThread } = require('./prepare-mass-update');

// New content data (to be filled with scraped data)
const NEW_CONTENT_DATA = {
  'Complete Character Tier List': 'PLACEHOLDER - Will be filled with new character data',
  'Complete Gear Guide': 'PLACEHOLDER - Will be filled with new gear data',
  'Complete Runes System Guide': 'PLACEHOLDER - Will be filled with new runes data',
  'Complete Farming Guide': 'PLACEHOLDER - Will be filled with new farming data',
  'Complete PvE Guide': 'PLACEHOLDER - Will be filled with new PvE data',
  'PvP Guide': 'PLACEHOLDER - Will be filled with new PvP data',
  'Peak Arena Guide': 'PLACEHOLDER - Will be filled with new Peak Arena data'
};

// Function to update all existing threads
async function massUpdateExistingThreads() {
  console.log('🚀 Starting mass update of existing threads...');
  
  try {
    // Get all current threads
    const threads = await getAllCurrentThreads();
    console.log(`Found ${threads.length} threads to update`);
    
    if (threads.length === 0) {
      console.log('No threads found to update');
      return;
    }
    
    let updatedCount = 0;
    
    for (const thread of threads) {
      const threadName = thread.name;
      const threadId = thread.id;
      
      // Skip table of contents for now
      if (threadName.includes('KNOWLEDGE HUB') || threadName.includes('Table of Contents')) {
        console.log(`⏭️ Skipping: ${threadName} (will update separately)`);
        continue;
      }
      
      // Check if we have new content for this thread
      if (NEW_CONTENT_DATA[threadName]) {
        console.log(`📝 Updating: ${threadName}`);
        const success = await updateThread(threadId, NEW_CONTENT_DATA[threadName]);
        
        if (success) {
          updatedCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`⚠️ No new content found for: ${threadName}`);
      }
    }
    
    console.log(`\n✅ Mass update complete!`);
    console.log(`📊 Updated ${updatedCount} threads`);
    
  } catch (error) {
    console.error('❌ Error during mass update:', error);
  }
}

// Function to update specific thread content
function updateThreadContent(threadName, newContent) {
  NEW_CONTENT_DATA[threadName] = newContent;
  console.log(`✅ Updated content for: ${threadName}`);
}

// Function to add new thread content
function addNewThreadContent(threadName, content) {
  NEW_CONTENT_DATA[threadName] = content;
  console.log(`✅ Added new thread content: ${threadName}`);
}

// Run the script
if (require.main === module) {
  massUpdateExistingThreads().catch(console.error);
}

module.exports = { 
  massUpdateExistingThreads, 
  updateThreadContent, 
  addNewThreadContent,
  NEW_CONTENT_DATA 
};
