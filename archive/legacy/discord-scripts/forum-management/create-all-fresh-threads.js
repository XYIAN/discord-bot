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

const threads = [
  {
    name: 'Complete Runes System Guide',
    content: `# 🔮 **Complete Runes System Guide**

## 🎯 **Rune Types**

### **Attack Runes**
- **Fire Rune**: +15% damage, burn effect
- **Lightning Rune**: +20% crit chance, chain damage
- **Ice Rune**: +10% damage, slow effect

### **Defense Runes**
- **Earth Rune**: +25% health, damage reduction
- **Water Rune**: +20% healing, regeneration
- **Wind Rune**: +15% speed, dodge chance

### **Special Runes**
- **Void Rune**: +30% skill damage, cooldown reduction
- **Light Rune**: +25% crit damage, area damage
- **Dark Rune**: +20% lifesteal, shadow damage

---

## 🏆 **Best Rune Combinations**

### **DPS Build**
- Fire + Lightning + Void
- High damage output, crit focused

### **Tank Build**
- Earth + Water + Wind
- High survivability, balanced stats

### **PvP Build**
- Lightning + Void + Dark
- Burst damage, lifesteal sustain

---

*More detailed rune farming and optimization guides coming...*`
  },
  {
    name: 'Complete Farming Guide',
    content: `# 🌾 **Complete Farming Guide**

## 🎯 **Daily Farming Routine**

### **Morning (Reset)**
1. **Guild Boss** - High rewards, daily limit
2. **Gold Rush** - Essential currency
3. **Donations** - Guild contribution
4. **Daily Quests** - XP and resources

### **Evening (Before Sleep)**
1. **Endless Modes** - Long-term progression
2. **Floor Mode** - Character advancement
3. **Sky Tower** - Special rewards
4. **PvP Matches** - Arena rewards

---

## 💰 **Resource Priority**

### **High Priority**
- **Gold** - Upgrade everything
- **XP** - Character levels
- **Runes** - Equipment enhancement

### **Medium Priority**
- **Gems** - Premium currency
- **Materials** - Equipment crafting
- **Tickets** - Special events

---

## ⚡ **Efficiency Tips**

- **Auto-battle** when possible
- **Focus on one character** at a time
- **Join active guild** for bonuses
- **Complete daily quests** first

---

*Detailed farming strategies for each game mode coming...*`
  },
  {
    name: 'Complete PvE Guide',
    content: `# ⚔️ **Complete PvE Guide**

## 🎯 **Game Modes Overview**

### **Story Mode**
- **Purpose**: Main progression, character development
- **Rewards**: XP, gold, equipment
- **Strategy**: Focus on one character, upgrade gear

### **Floor Mode**
- **Purpose**: Character advancement, skill unlocks
- **Rewards**: Character XP, skill points
- **Strategy**: Use best character, optimize builds

### **Endless Modes**
- **Purpose**: Long-term progression, rare rewards
- **Rewards**: High XP, rare equipment
- **Strategy**: Auto-battle when possible, manual for bosses

---

## 🏆 **Best PvE Characters**

1. **Thor** - High damage, versatile
2. **Dragoon** - Balanced stats, good survivability
3. **Griffin** - Tank role, high health
4. **Axe Master** - Crowd control, area damage

---

## ⚔️ **Combat Tips**

- **Dodge attacks** - Timing is crucial
- **Use skills** - Don't save them
- **Positioning** - Stay mobile
- **Elemental advantage** - Match runes to enemies

---

*Detailed strategies for each PvE mode coming...*`
  },
  {
    name: 'Supreme Arena Guide',
    content: `# 🏟️ **Supreme Arena Guide**

## 🎯 **PvP Fundamentals**

### **Best PvP Characters**
1. **Oracle** - Best for PvP overall
2. **Loki** - High skill ceiling, deceptive tactics
3. **Thor** - High damage, lightning attacks
4. **Assassin** - Glass cannon, high risk/reward

### **Best PvP Builds**
- **Oracle Set** - PvP focused equipment
- **Dragoon Crossbow** - Best weapon for most situations
- **Lightning + Void Runes** - Burst damage combo

---

## ⚔️ **PvP Strategies**

### **Aggressive Play**
- **Oracle + Lightning Runes**
- **High damage, fast kills**
- **Risk**: Low survivability

### **Defensive Play**
- **Griffin Set + Earth Runes**
- **High health, sustain**
- **Risk**: Lower damage output

### **Balanced Play**
- **Dragoon Set + Mixed Runes**
- **Good damage and survivability**
- **Best for**: Most players

---

## 🏆 **Ranking Tips**

- **Play daily** - Consistent practice
- **Learn matchups** - Know your counters
- **Watch replays** - Learn from mistakes
- **Join active guild** - Team strategies

---

*Advanced PvP tactics and meta analysis coming...*`
  }
];

async function createAllThreads() {
  console.log('🚀 Creating all fresh threads...');
  
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    console.log(`📝 Creating thread ${i + 1}/${threads.length}: ${thread.name}`);
    
    const success = await sendMessage(thread.content, thread.name);
    
    if (success) {
      console.log(`✅ Thread ${i + 1} created successfully!`);
    } else {
      console.log(`❌ Failed to create thread ${i + 1}`);
    }
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎉 All threads creation completed!');
}

// Run the script
createAllThreads().catch(console.error);
