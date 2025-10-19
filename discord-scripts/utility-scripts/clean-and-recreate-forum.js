const WEBHOOK_URL = 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m';

const CHANNEL_ID = '1419944148701679686';

async function sendMessage(content, threadName = '') {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        thread_name: threadName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`✅ Successfully sent: ${threadName || 'Message'}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending: ${threadName}`, error);
    return false;
  }
}

async function main() {
  console.log('🧹 Starting forum cleanup and recreation...');
  
  // Step 1: Request cleanup of all existing threads
  const cleanupMessage = `# 🧹 **FORUM CLEANUP REQUEST**

**Please DELETE ALL existing threads in this forum channel.**

**Reason:** We need to start fresh with only correct, professional threads.

**What to delete:**
- All test threads
- All threads with "REAL" in the title
- All threads with incorrect information
- All placeholder threads
- Everything in this forum

**After cleanup, we will recreate only the good, professional threads with correct data.**

This ensures a clean, organized forum! 🎯`;
  
  console.log('📤 Sending cleanup request...');
  const cleanupSuccess = await sendMessage(cleanupMessage, '🧹 FORUM CLEANUP REQUEST');
  
  if (cleanupSuccess) {
    console.log('✅ Cleanup request sent successfully!');
    console.log('⏳ Please delete all threads, then let me know when ready to recreate...');
  } else {
    console.log('❌ Failed to send cleanup request');
  }
}

// Run the script
main().catch(console.error);
