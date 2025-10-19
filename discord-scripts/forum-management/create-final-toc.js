const WEBHOOK_URL = 'https://discord.com/api/webhooks/REDACTED';

const CHANNEL_ID = '1419944148701679686';

// Real thread IDs from our fresh creation
const THREAD_IDS = {
  'Complete Character Tier List': '1425344323599208479',
  'Complete Gear Guide': '1425344393455472750',
  'Complete Runes System Guide': '1425344506122731623',
  'Complete Farming Guide': '1425344516629463215',
  'Complete PvE Guide': '1425344525949341767',
  'Supreme Arena Guide': '1425344535256502304'
};

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

function createTableOfContents() {
  return `# 📚 **ARCH 2 ADDICTS - KNOWLEDGE HUB** 📚

## 🎯 **Welcome to the Ultimate Archero 2 Resource Center!**

*Your one-stop destination for all things Archero 2 - from beginner guides to advanced strategies!*

---

## 🏆 **CORE GUIDES** 🏆

### **Character & Builds**
- **👥 [Complete Character Tier List](https://discord.com/channels/${CHANNEL_ID}/${THREAD_IDS['Complete Character Tier List']})** - Master tier rankings & strategies
- **⚔️ [Complete Gear Guide](https://discord.com/channels/${CHANNEL_ID}/${THREAD_IDS['Complete Gear Guide']})** - Ultimate equipment optimization
- **🔮 [Complete Runes System Guide](https://discord.com/channels/${CHANNEL_ID}/${THREAD_IDS['Complete Runes System Guide']})** - Rune mastery & optimization

### **Game Modes & Strategies**
- **🌾 [Complete Farming Guide](https://discord.com/channels/${CHANNEL_ID}/${THREAD_IDS['Complete Farming Guide']})** - Maximize your resources
- **⚔️ [Complete PvE Guide](https://discord.com/channels/${CHANNEL_ID}/${THREAD_IDS['Complete PvE Guide']})** - Conquer all PvE content
- **🏟️ [Supreme Arena Guide](https://discord.com/channels/${CHANNEL_ID}/${THREAD_IDS['Supreme Arena Guide']})** - PvP dominance

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
- **PvP Strategies** → Dominate the arena

---

*Last updated: ${new Date().toLocaleDateString()} | Keep grinding, keep dominating!* 🎮✨`;
}

async function main() {
  console.log('🚀 Creating final table of contents with correct thread IDs...');
  
  const tocContent = createTableOfContents();
  
  // Check if content is within Discord's limit
  if (tocContent.length > 2000) {
    console.log(`⚠️ Content is ${tocContent.length} characters (limit: 2000)`);
    console.log('📝 Truncating content...');
    
    // Truncate to fit within limit
    const truncatedContent = tocContent.substring(0, 1950) + '\n\n*[Content truncated - see individual guides for full details]*';
    
    const success = await sendMessage(truncatedContent, '📚 ARCH 2 ADDICTS - KNOWLEDGE HUB');
    
    if (success) {
      console.log('✅ Table of contents created successfully!');
    } else {
      console.log('❌ Failed to create table of contents');
    }
  } else {
    const success = await sendMessage(tocContent, '📚 ARCH 2 ADDICTS - KNOWLEDGE HUB');
    
    if (success) {
      console.log('✅ Table of contents created successfully!');
    } else {
      console.log('❌ Failed to create table of contents');
    }
  }
}

// Run the script
main().catch(console.error);
