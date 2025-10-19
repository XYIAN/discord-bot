const WEBHOOK_URL = 'https://discord.com/api/webhooks/REDACTED';

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
  console.log('🚀 Creating second fresh thread...');
  
  const content = `# ⚔️ **Complete Gear Guide**

## 🏆 **Best Equipment Sets**

### **Dragoon Set** - Best All-Around
- **Weapon**: Dragoon Crossbow (best weapon overall)
- **Armor**: Dragoon Armor
- **Accessories**: Dragoon Ring, Dragoon Necklace
- **Why Best**: Versatile, good in most situations
- **Best For**: All content types

### **Oracle Set** - Best for PvP
- **Weapon**: Oracle Staff
- **Armor**: Oracle Robes
- **Accessories**: Oracle Ring, Oracle Amulet
- **Why Best**: High damage, PvP focused
- **Best For**: PvP, Supreme Arena

### **Griffin Set** - Best for Defense
- **Weapon**: Griffin Sword
- **Armor**: Griffin Plate
- **Accessories**: Griffin Shield, Griffin Helm
- **Why Best**: High survivability, tank builds
- **Best For**: PvE, tank builds

---

## 🎯 **Weapon Rankings**

1. **Dragoon Crossbow** - Best overall weapon
2. **Oracle Staff** - Best for PvP
3. **Griffin Sword** - Best for tank builds
4. **Assassin Daggers** - Best for speed builds

---

*More detailed stats and builds coming in individual set guides...*`;
  
  const success = await sendMessage(content, 'Complete Gear Guide');
  
  if (success) {
    console.log('✅ Second thread created successfully!');
  } else {
    console.log('❌ Failed to create second thread');
  }
}

// Run the script
main().catch(console.error);
