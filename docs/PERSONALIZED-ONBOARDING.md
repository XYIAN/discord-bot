# Personalized Onboarding System

## Overview

The XYIAN Bot now features a comprehensive personalized onboarding system that greets new members with a DM and offers customized gameplay assistance based on their preferences.

## How It Works

### 1. **New Member Welcome**
When a new member joins the server:
- Public welcome message sent to general chat
- **Personalized DM sent** asking if they want customized assistance
- User preferences tracked for future personalized messages

### 2. **3-Step Setup Process**

#### **Step 1: Daily Reset Reminders**
- **Question**: "Would you like daily reset reminders?"
- **Benefits**: 
  - Daily boss battle reminders
  - Guild donation prompts
  - Event deadline alerts
  - Daily quest notifications

#### **Step 2: Build Optimization Tips**
- **Question**: "Would you like build optimization tips?"
- **If Yes**: Choose build type:
  - **Dragon** - High damage, tanky builds
  - **Oracle** - Balanced, versatile builds  
  - **Griffin** - Speed, mobility builds
- **Benefits**:
  - Character recommendations
  - Item synergies
  - Build strategies
  - Resonance optimization

#### **Step 3: Arena Strategy Tips**
- **Question**: "Would you like arena strategy tips?"
- **Benefits**:
  - Supreme Arena team composition
  - Character resonance strategies
  - Item bonuses and synergies
  - Competitive tactics

## Advanced Build Mechanics

### **Character Resonance System**

#### **Resonance Unlock Requirements**
- **3 Stars**: First resonance unlocks
- **6 Stars**: Second resonance unlocks
- **Higher character levels = stronger resonance effects**

#### **Recommended Resonance Characters**

**3-Star Resonance (First Slot):**
- **Rolla** ⭐⭐⭐ - **BEST CHOICE**
  - Freeze attacks provide vital crowd control
  - Any stop in opponent attacks = major advantage
  - Critical damage boost
- **Helix** ⭐⭐⭐ - Strong alternative
  - Damage scaling abilities
  - Good for DPS builds
- **Thor** ⭐⭐⭐ - Legendary option
  - Lightning abilities
  - Move while firing + weapon detach

**6-Star Resonance (Second Slot):**
- **Loki** ⭐⭐⭐⭐⭐⭐ - **TOP CHOICE**
  - PvP specific character
  - Attack speed boost when moving
  - Acquired from PvP rewards
- **Demon King** ⭐⭐⭐⭐⭐⭐ - Shield specialist
  - Powerful shield abilities
  - Skins enhance shield capabilities
- **Otta** ⭐⭐⭐⭐⭐⭐ - High-level option
  - Strong at higher levels
  - Good for advanced builds

**Alternative 3-Star Options:**
- **Nyanja** ⭐⭐⭐ - Speed specialist
  - Faster movement = harder to hit
  - Good for Griffin builds
  - Cloudfooted ability (damage + push)

### **Character Selection Strategy**

#### **Primary Character Selection**
1. **Use highest star character** (3+ stars for resonance)
2. **If you have a Legendary**: Usually best unless highest star is 3+
3. **Resonance unlocks at 3 stars** - this is the key threshold

#### **Resonance Power Scaling**
- **Level 7 Rolla** >> **3-star Rolla** for resonance
- Character level directly affects resonance strength
- Higher level = more powerful resonance effects

### **Build Type Recommendations**

#### **Dragon Builds**
- **Focus**: High damage, tanky gameplay
- **Best Characters**: Thor, Demon King
- **Resonance**: Rolla (freeze) + Loki (speed)
- **Items**: Dragon Knight set, high HP items

#### **Oracle Builds** 
- **Focus**: Balanced, versatile gameplay
- **Best Characters**: Helix, Alex
- **Resonance**: Rolla (freeze) + Demon King (shield)
- **Items**: Oracle set, balanced stats

#### **Griffin Builds**
- **Focus**: Speed, mobility gameplay
- **Best Characters**: Nyanja, Griffin
- **Resonance**: Nyanja (speed) + Loki (attack speed)
- **Items**: Griffin set, speed bonuses

## AI Questions Channel Integration

### **New Webhook Channel**
- **Purpose**: Advanced build questions and analysis
- **Webhook**: `https://discord.com/api/webhooks/1424322423901392957/r546eXCaL9I1W92YVMAuSoLfk2pbTWs3y8BDr7HTx8jk32-WfTqsID3Sshg8aV8mi6yf`
- **Features**: 
  - Complex build analysis
  - Item synergy calculations
  - Detailed character recommendations

### **Example Questions for AI Channel**
- "I have 3 Griffin items, 3 Oracle, and 2 Dragon - what's the best build?"
- "My highest character is 4-star Helix, should I use him or 2-star Thor?"
- "What's the best resonance combo for PvP with my current items?"

## User Preference Tracking

### **Stored Preferences**
```javascript
{
  userId: "123456789",
  status: "completed", // awaiting_response, in_setup, completed
  preferences: {
    dailyReminders: true,
    buildTips: true,
    buildType: "dragon", // dragon, oracle, griffin
    arenaTips: true
  },
  setupStep: 3
}
```

### **Personalized Message Examples**

#### **Daily Reminder (if enabled)**
```
🔄 Daily Reset Reminder
Hey [username]! Don't forget:
• Complete 2 boss battles
• Make guild donation
• Check daily quests
• Event deadlines
```

#### **Build Tips (if enabled)**
```
⚔️ Build Optimization Tip
For your Dragon build:
• Use Rolla in resonance (freeze is vital)
• Focus on high HP items
• Consider Thor for primary character
```

#### **Arena Tips (if enabled)**
```
🏟️ Arena Strategy
Supreme Arena team:
• Primary: Your highest star character
• Resonance 1: Rolla (3+ stars)
• Resonance 2: Loki (6+ stars)
• Focus on item synergies
```

## Technical Implementation

### **DM Processing**
- Detects DM channel type (`message.channel.type === 1`)
- Processes setup responses in sequence
- Stores preferences in memory (Map)
- Handles build type selection

### **Webhook Integration**
- New `sendToAIQuestions()` function
- Dedicated AI questions channel
- Advanced build analysis capabilities

### **Error Handling**
- Graceful fallback for DM failures
- User preference validation
- Setup step tracking

## Future Enhancements

### **Planned Features**
- Persistent preference storage (database)
- Advanced build calculator
- Item synergy analyzer
- Character recommendation engine
- Personalized daily tips based on preferences

### **Integration Opportunities**
- Guild recruitment based on build preferences
- Event-specific tips
- Competitive ranking advice
- Item upgrade recommendations

This personalized onboarding system transforms the bot from a simple Q&A tool into a comprehensive personal Archero 2 assistant, providing tailored guidance based on each user's specific needs and preferences.
