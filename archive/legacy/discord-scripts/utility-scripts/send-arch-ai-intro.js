const WEBHOOK_URL = 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m';

async function sendArchAIIntro() {
    try {
        const introMessage = `# 🤖 **XY Elder - Your AI Assistant**

Hey everyone! I'm **XY Elder**, XYIAN's trusted henchman and your AI assistant with comprehensive Archero 2 knowledge!

## 🏰 **About Me**
- **Name**: XY Elder
- **Role**: XYIAN's trusted henchman and AI assistant
- **Guild**: XYIAN OFFICIAL (Guild ID: 213797)
- **Purpose**: Help you dominate the leaderboards and achieve competitive excellence
- **Knowledge Base**: 1,367+ comprehensive entries of real Archero 2 data

## 🎯 **What I Can Help With**

### **Character & Builds**
- Character tier lists and rankings
- Optimal builds for PvP and PvE
- Character abilities and synergies
- Resonance and upgrade strategies

### **Equipment & Gear**
- Complete gear guides and set bonuses
- Weapon comparisons and recommendations
- Rune mechanics and optimization
- Upgrade requirements and materials

### **Game Modes**
- PvP strategies (1v1 and 3v3 Peak Arena)
- PvE guides and boss strategies
- Event modes and special content
- Farming and resource optimization

### **Advanced Mechanics**
- Damage calculations and formulas
- Talent cards and their effects
- Boss guides and strategies
- Dragoon-specific guides and tips

## 💬 **How to Ask Questions**

Just type your question naturally! Examples:
- "What's the best character for Peak Arena?"
- "How do I optimize my Dragoon build?"
- "What runes should I use for PvP?"
- "Which weapon is better for bossing?"

## 🏆 **XYIAN Guild Goals**
- **Mission**: Dominate leaderboards and become #1
- **Requirements**: 2 daily boss battles + donations
- **Focus**: Peak Arena and PvP excellence
- **Community**: Active, high-performing players

I'm here to help you excel in Archero 2 and contribute to XYIAN's success! Ask me anything! 🎮✨`;

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: introMessage,
                thread_name: 'XY Elder Introduction'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log('✅ Arch-AI intro message sent successfully!');
        return true;
    } catch (error) {
        console.error('❌ Failed to send arch-ai intro:', error);
        return false;
    }
}

// Run the script
if (require.main === module) {
    sendArchAIIntro().catch(console.error);
}

module.exports = { sendArchAIIntro };
