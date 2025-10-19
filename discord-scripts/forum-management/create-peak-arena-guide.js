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
  console.log('🚀 Creating Peak Arena Guide...');
  
  const content = `# 🏟️ **Peak Arena Guide** (3v3 Mode)

## 🎯 **Peak Arena Overview**

**Peak Arena** is the **3v3 team-based PvP mode** where you battle with 2 other players against another team of 3.

### **Key Features**
- **3v3 Team Battles** - Coordinate with 2 teammates
- **Real-time Strategy** - Live team coordination
- **High Rewards** - Best PvP rewards in the game
- **Ranked System** - Competitive ranking progression

---

## 🏆 **Best Peak Arena Characters**

### **S-Tier (Must-Have)**
1. **Oracle** - Best overall for Peak Arena
2. **Thor** - High damage, lightning attacks
3. **Loki** - Deceptive tactics, high skill ceiling

### **A-Tier (Excellent)**
4. **Dragoon** - Balanced, versatile
5. **Griffin** - Tank role, high survivability
6. **Assassin** - Glass cannon, high risk/reward

---

## ⚔️ **Team Composition Strategies**

### **Balanced Team**
- **Oracle** (DPS) + **Dragoon** (Support) + **Griffin** (Tank)
- **Best For**: Most players, versatile

### **Aggressive Team**
- **Oracle** + **Thor** + **Loki**
- **Best For**: High-skill players, fast games

### **Defensive Team**
- **Griffin** + **Dragoon** + **Oracle**
- **Best For**: Newer players, longer games

---

## 🎯 **Peak Arena Tips**

### **Team Coordination**
- **Communicate** - Use voice chat if possible
- **Role Assignment** - Assign DPS, Tank, Support roles
- **Target Focus** - Focus fire on one enemy at a time
- **Positioning** - Spread out, don't cluster

### **Combat Strategy**
- **Focus Fire** - Kill enemies one by one
- **Protect DPS** - Keep your damage dealers alive
- **Use Terrain** - Use obstacles for cover
- **Ultimate Timing** - Coordinate ultimate abilities

---

*Master Peak Arena and dominate the 3v3 battlefield!* ⚔️🏆`;
  
  const success = await sendMessage(content, 'Peak Arena Guide');
  
  if (success) {
    console.log('✅ Peak Arena Guide created successfully!');
  } else {
    console.log('❌ Failed to create Peak Arena Guide');
  }
}

// Run the script
main().catch(console.error);
