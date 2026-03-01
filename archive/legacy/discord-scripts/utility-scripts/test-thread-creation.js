/**
 * Test Thread Creation and Editing Script
 * 
 * Tests creating a simple thread and then editing it to add content
 */

// Using built-in fetch (Node.js 18+)

// Forum channel webhook URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m';

// Tag IDs from our analysis
const TAGS = {
  GEAR: '1424149161753972747',
  RUNES: '1424149193265512529',
  ORACLE: '1424149242087473192',
  DRAGOON: '1424149274408517683',
  GRIFFIN: '1424149313113821355',
  FARMING: '1424149419254747331',
  PVP: '1424149478717264014',
  PVE: '1424149502004039681',
  FLOOR_MODE: '1424149536359845981',
  ENDLESS_MODES: '1424149572153774212',
  SKY_TOWER_BUILD: '1424149612264161390',
  SUPREME_ARENA: '1424149659508805653'
};

class TestThreadCreator {
  constructor() {
    this.createdThreads = [];
  }

  // Create a simple test thread
  async createTestThread() {
    const content = `# ⚔️ **Test Thread**

This is a test thread to verify creation and editing functionality.

---

*Testing thread creation and editing capabilities.*`;

    try {
      console.log('🧪 Creating test thread...');
      console.log(`📋 Content length: ${content.length} characters`);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          thread_name: '🧪 Test Thread - Creation & Editing',
          applied_tags: [TAGS.GEAR]
        })
      });

      console.log(`📊 Response status: ${response.status}`);

      if (response.ok) {
        console.log('✅ Test thread created successfully!');
        console.log('📊 Response status:', response.status);
        
        // For webhooks, we don't get thread info back, but creation was successful
        this.createdThreads.push({
          threadName: '🧪 Test Thread - Creation & Editing',
          created: true
        });
        
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create test thread');
        console.error(`📊 Status: ${response.status}`);
        console.error(`📝 Error: ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating test thread:', error);
      return false;
    }
  }

  // Add content to the test thread (as a new message)
  async addContentToTestThread() {
    if (this.createdThreads.length === 0) {
      console.log('❌ No threads to add content to. Create a thread first.');
      return false;
    }

    const content = `# ⚔️ **Test Thread - CONTENT ADDED**

This is additional content added to test the chunked approach.

---

## 📋 **Overview**

This thread has been **successfully created** and we're now adding content in chunks to work around character limits.

---

## 🎯 **Test Results**

✅ **Thread Creation**: Working
✅ **Content Addition**: Working  
✅ **Character Limits**: Can be managed with chunked approach

---

## 💡 **Strategy**

1. **Create Empty Threads** - Start with basic structure
2. **Add Content in Chunks** - Add content progressively as new messages
3. **Prioritize Content** - Most important info at top
4. **Handle Limits** - Stop before 2000 chars, add summary

---

*Testing thread creation and content addition capabilities - CHUNK 1.*`;

    try {
      console.log('📝 Adding content to test thread...');
      console.log(`📋 Content length: ${content.length} characters`);

      // Add content as a new message in the thread
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          thread_name: '🧪 Test Thread - Content Addition'
        })
      });

      console.log(`📊 Content addition response status: ${response.status}`);

      if (response.ok) {
        console.log('✅ Content added to test thread successfully!');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to add content to test thread');
        console.error(`📊 Status: ${response.status}`);
        console.error(`📝 Error: ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding content to test thread:', error);
      return false;
    }
  }

  // Run the test
  async runTest() {
    console.log('🚀 Starting thread creation and editing test...');
    
    // Step 1: Create test thread
    const created = await this.createTestThread();
    if (!created) {
      console.log('❌ Test failed at creation step');
      return;
    }

    // Wait a moment
    console.log('⏳ Waiting 3 seconds before editing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Add content to test thread
    const contentAdded = await this.addContentToTestThread();
    if (!contentAdded) {
      console.log('❌ Test failed at content addition step');
      return;
    }

    console.log('🎉 Test completed successfully!');
    console.log('📋 Next steps: Create all threads empty, then edit with content in chunks');
  }
}

// Run the test
const tester = new TestThreadCreator();
tester.runTest().catch(console.error);
