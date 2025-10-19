// MASS DELETE ALL THREADS SCRIPT
// Use this when you want to completely start fresh with new data

const { getAllCurrentThreads, deleteThread } = require('./prepare-mass-update');

async function massDeleteAllThreads() {
  console.log('🚀 Starting mass deletion of all threads...');
  
  try {
    // Get all current threads
    const threads = await getAllCurrentThreads();
    console.log(`Found ${threads.length} threads to delete`);
    
    if (threads.length === 0) {
      console.log('No threads found to delete');
      return;
    }
    
    // Delete each thread
    let deletedCount = 0;
    for (const thread of threads) {
      console.log(`🗑️ Deleting: ${thread.name} (${thread.id})`);
      const success = await deleteThread(thread.id);
      if (success) {
        deletedCount++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Mass deletion complete!`);
    console.log(`📊 Deleted ${deletedCount}/${threads.length} threads`);
    
    if (deletedCount < threads.length) {
      console.log('⚠️ Some threads failed to delete. Check logs above.');
    }
    
  } catch (error) {
    console.error('❌ Error during mass deletion:', error);
  }
}

// Run the script
if (require.main === module) {
  massDeleteAllThreads().catch(console.error);
}

module.exports = { massDeleteAllThreads };
