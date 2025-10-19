// MASS UPDATE PREPARATION SCRIPT
// This script prepares for mass updates when new scraped data arrives

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m';
const CHANNEL_ID = '1419944148701679686';

// Current thread IDs (will be updated when new data arrives)
const CURRENT_THREAD_IDS = {
  'Complete Character Tier List': '1425344323599208479',
  'Complete Gear Guide': '1425344393455472750',
  'Complete Runes System Guide': '1425344506122731623',
  'Complete Farming Guide': '1425344516629463215',
  'Complete PvE Guide': '1425344525949341767',
  'PvP Guide': '1425346849933496351',
  'Peak Arena Guide': '1425346261711851592',
  'Table of Contents': '1425344658870898720'
};

// Function to get all current threads
async function getAllCurrentThreads() {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/1419944148701679686/threads/active`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    return data.threads;
  } catch (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
}

// Function to delete a thread
async function deleteThread(threadId) {
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    console.log(`✅ Deleted thread: ${threadId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete thread ${threadId}:`, error);
    return false;
  }
}

// Function to create a new thread
async function createThread(content, threadName, tags = []) {
  try {
    const payload = {
      content: content,
      thread_name: threadName,
      applied_tags: tags
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(`✅ Created thread: ${threadName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create thread ${threadName}:`, error);
    return false;
  }
}

// Function to update existing thread
async function updateThread(threadId, content) {
  try {
    // Get the first message in the thread
    const response = await fetch(`https://discord.com/api/v10/channels/${threadId}/messages`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const messages = await response.json();
    const firstMessage = messages[0];
    
    if (!firstMessage) {
      console.log(`No messages found in thread ${threadId}`);
      return false;
    }
    
    // Update the first message
    const updateResponse = await fetch(`https://discord.com/api/v10/channels/${threadId}/messages/${firstMessage.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`HTTP ${updateResponse.status}: ${await updateResponse.text()}`);
    }
    
    console.log(`✅ Updated thread: ${threadId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update thread ${threadId}:`, error);
    return false;
  }
}

// Main function to prepare for mass update
async function prepareMassUpdate() {
  console.log('🚀 Preparing for mass update...');
  
  // Get all current threads
  const threads = await getAllCurrentThreads();
  console.log(`Found ${threads.length} current threads`);
  
  // Log current thread structure
  console.log('\n📋 Current Thread Structure:');
  threads.forEach(thread => {
    console.log(`- ${thread.name} (${thread.id})`);
  });
  
  console.log('\n✅ Mass update preparation complete!');
  console.log('📝 Ready to process new scraped data when it arrives.');
}

// Export functions for use in other scripts
module.exports = {
  getAllCurrentThreads,
  deleteThread,
  createThread,
  updateThread,
  prepareMassUpdate,
  CURRENT_THREAD_IDS,
  WEBHOOK_URL,
  CHANNEL_ID
};

// Run if called directly
if (require.main === module) {
  prepareMassUpdate().catch(console.error);
}
