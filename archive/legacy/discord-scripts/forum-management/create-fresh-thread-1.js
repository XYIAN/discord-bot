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
  console.log('🚀 Creating first fresh thread...');
  
  const content = `# 👥 **Complete Character Tier List**

## 🏆 **S-Tier Characters** (Must-Have)

### **Thor** ⭐⭐⭐⭐⭐
- **Strengths**: Lightning-based attacks, high damage output
- **Best For**: All content types, aggressive playstyles
- **Unlock**: Premium/events
- **Resonance**: 3-star slot option

### **Loki** ⭐⭐⭐⭐⭐
- **Strengths**: Illusions and trickery, deceptive tactics
- **Best For**: PvP specific, high-skill players
- **Unlock**: PvP rewards
- **Resonance**: 6-star slot - TOP CHOICE

### **Hela** ⭐⭐⭐⭐⭐
- **Strengths**: Dark magic specialist, summoning abilities
- **Best For**: All content, support builds
- **Unlock**: Premium/events
- **Resonance**: 6-star slot option

---

## 🥇 **A-Tier Characters** (Excellent)

### **Axe Master** ⭐⭐⭐⭐
- **Strengths**: Multi-directional axe throws, excellent crowd control
- **Best For**: PvE, farming, team support
- **Unlock**: Various content

### **Assassin** ⭐⭐⭐⭐
- **Strengths**: Quick, high-damage attacks, high evasion
- **Best For**: PvP, glass cannon builds
- **Unlock**: Various content

### **Guardian** ⭐⭐⭐⭐
- **Strengths**: Tank role, high health and defense
- **Best For**: PvE, team content, tank builds
- **Unlock**: Various content

---

*Continue reading below for B-Tier and Epic characters...*`;
  
  const success = await sendMessage(content, 'Complete Character Tier List');
  
  if (success) {
    console.log('✅ First thread created successfully!');
  } else {
    console.log('❌ Failed to create first thread');
  }
}

// Run the script
main().catch(console.error);
