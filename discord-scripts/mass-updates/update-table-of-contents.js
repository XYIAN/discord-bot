// UPDATE TABLE OF CONTENTS SCRIPT
// Use this to update the table of contents with new thread IDs

const { createThread, CHANNEL_ID } = require('./prepare-mass-update');

// Function to get all current thread IDs
async function getAllThreadIds() {
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
    const threadMap = {};
    
    data.threads.forEach(thread => {
      threadMap[thread.name] = thread.id;
    });
    
    return threadMap;
  } catch (error) {
    console.error('Error fetching thread IDs:', error);
    return {};
  }
}

// Function to create updated table of contents
function createTableOfContents(threadIds) {
  return `# 📚 **ARCH 2 ADDICTS - KNOWLEDGE HUB** 📚

## 🎯 **Welcome to the Ultimate Archero 2 Resource Center!**

*Your one-stop destination for all things Archero 2 - from beginner guides to advanced strategies!*

---

## 🏆 **CORE GUIDES** 🏆

### **Character & Builds**
- **👥 [Complete Character Tier List](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Complete Character Tier List'] || 'PLACEHOLDER'})** - Master tier rankings & strategies
- **⚔️ [Complete Gear Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Complete Gear Guide'] || 'PLACEHOLDER'})** - Ultimate equipment optimization
- **🔮 [Complete Runes System Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Complete Runes System Guide'] || 'PLACEHOLDER'})** - Rune mastery & optimization

### **Game Modes & Strategies**
- **🌾 [Complete Farming Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Complete Farming Guide'] || 'PLACEHOLDER'})** - Maximize your resources
- **⚔️ [Complete PvE Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Complete PvE Guide'] || 'PLACEHOLDER'})** - Conquer all PvE content
- **⚔️ [PvP Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['PvP Guide'] || 'PLACEHOLDER'})** - Master 1v1 battles
- **🏟️ [Peak Arena Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Peak Arena Guide'] || 'PLACEHOLDER'})** - Master 3v3 PvP battles

### **Equipment & Builds**
- **🛡️ [Equipment Sets Guide](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Equipment Sets Guide'] || 'PLACEHOLDER'})** - Complete equipment set strategies
- **🧮 [Build Calculator](https://discord.com/channels/${CHANNEL_ID}/${threadIds['Build Calculator'] || 'PLACEHOLDER'})** - Optimize your builds

---

## ❓ **HELP & SUPPORT** ❓

### **📋 [FAQ](https://discord.com/channels/${CHANNEL_ID}/${threadIds['FAQ'] || 'PLACEHOLDER'})**
*Got questions? We've got answers!*

---

## 🎨 **NAVIGATION TIPS** 🎨

- **🔗 Click any link above** to jump directly to that guide
- **📌 Pin this thread** for quick access to all resources
- **💬 Ask questions** in the respective guide threads
- **🔄 Check back regularly** for updates and new content

---

## 🚀 **QUICK START** 🚀

**New to Archero 2?** Start here:
1. **Character Tier List** → Choose your main character
2. **Gear Guide** → Understand equipment basics
3. **Farming Guide** → Learn resource management
4. **PvE Guide** → Master the core gameplay

**Veteran player?** Jump to:
- **Runes System** → Optimize your builds
- **PvP Guide** → Master 1v1 battles
- **Peak Arena** → Dominate 3v3 battles

---

*Last updated: ${new Date().toLocaleDateString()} | Keep grinding, keep dominating!* 🎮✨`;
}

// Function to update table of contents
async function updateTableOfContents() {
  console.log('🚀 Updating table of contents...');
  
  try {
    // Get all current thread IDs
    const threadIds = await getAllThreadIds();
    console.log(`Found ${Object.keys(threadIds).length} threads`);
    
    // Create new table of contents
    const tocContent = createTableOfContents(threadIds);
    
    // Check if content is within Discord's limit
    if (tocContent.length > 2000) {
      console.log(`⚠️ Content is ${tocContent.length} characters (limit: 2000)`);
      console.log('📝 Truncating content...');
      
      const truncatedContent = tocContent.substring(0, 1950) + '\n\n*[Content truncated - see individual guides for full details]*';
      await createThread(truncatedContent, '📚 ARCH 2 ADDICTS - KNOWLEDGE HUB');
    } else {
      await createThread(tocContent, '📚 ARCH 2 ADDICTS - KNOWLEDGE HUB');
    }
    
    console.log('✅ Table of contents updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating table of contents:', error);
  }
}

// Run the script
if (require.main === module) {
  updateTableOfContents().catch(console.error);
}

module.exports = { updateTableOfContents, createTableOfContents, getAllThreadIds };
