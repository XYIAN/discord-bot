const WEBHOOK_URL = 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m';

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
  console.log('🚀 Fixing PvP Guide with correct character rankings...');
  
  const content = `# ⚔️ **PvP Guide** (1v1 Mode)

## 🎯 **PvP Overview**

**PvP** is the **1v1 player vs player mode** where you battle against another player using your best character and loadout.

### **Key Features**
- **1v1 Battles** - Direct player competition
- **Character Selection** - Use your strongest character
- **Loadout Optimization** - Best gear and runes
- **Ranked System** - Competitive progression

---

## 🏆 **Best PvP Characters**

### **S-Tier (Must-Have)**
1. **Griffin** - **Best for PvP** with full Griffin loadout
2. **Dragoon** - **Best overall** if you don't have full Griffin set
3. **Thor** - High damage, lightning attacks
4. **Loki** - Deceptive tactics, high skill ceiling

### **A-Tier (Excellent)**
5. **Oracle** - High damage, good utility
6. **Assassin** - Glass cannon, high risk/reward
7. **Rolla** - Freeze abilities, crowd control

---

## ⚔️ **Best PvP Builds**

### **Griffin Build** (Best with Full Set)
- **Weapon**: Griffin Shield
- **Armor**: Griffin Plate
- **Runes**: Earth + Defense + Vitality
- **Strategy**: Tank build, high survivability

### **Dragoon Build** (Best Overall)
- **Weapon**: Dragoon Crossbow
- **Armor**: Dragoon Armor
- **Runes**: Lightning + Fire + Void
- **Strategy**: Balanced damage and survivability

---

*Master PvP and climb the rankings!* ⚔️🏆`;
  
  const success = await sendMessage(content, 'PvP Guide');
  
  if (success) {
    console.log('✅ PvP Guide fixed with correct character rankings!');
  } else {
    console.log('❌ Failed to fix PvP Guide');
  }
}

// Run the script
main().catch(console.error);
