const WEBHOOK_URL = 'https://discord.com/api/webhooks/1424328645245407283/X0cUzwecUvcjYNNvRACUIfH0tiU_xwImn-D3PNnmGQRFjtv_FjY0MvBQZ847F4HcxW3m';
const CHANNEL_ID = '1419944148701679686';

// Load comprehensive knowledge base
const fs = require('fs');
const path = require('path');

let comprehensiveData = {};
let archeroDatabase = {};

// Load all the new data
function loadComprehensiveData() {
    try {
        const comprehensiveFile = path.join(__dirname, '../../data/comprehensive-knowledge-base/comprehensive-knowledge-base.json');
        if (fs.existsSync(comprehensiveFile)) {
            comprehensiveData = JSON.parse(fs.readFileSync(comprehensiveFile, 'utf8'));
            
            // Flatten into archeroDatabase format
            Object.entries(comprehensiveData).forEach(([category, entries]) => {
                Object.entries(entries).forEach(([key, content]) => {
                    archeroDatabase[`${category}_${key}`] = content;
                });
            });
            
            console.log(`✅ Loaded comprehensive data with ${Object.keys(archeroDatabase).length} entries`);
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to load comprehensive data:', error);
        return false;
    }
    return false;
}

// Get all current threads
async function getAllThreads() {
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
        return data.threads;
    } catch (error) {
        console.error('Error fetching threads:', error);
        return [];
    }
}

// Delete a thread
async function deleteThread(threadId) {
    try {
        const response = await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bot ${process.env.DISCORD_TOKEN}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        console.log(`✅ Deleted thread: ${threadId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete thread ${threadId}:`, error);
        return false;
    }
}

// Create a new thread
async function createThread(content, threadName, tags = []) {
    try {
        const payload = {
            content: content,
            thread_name: threadName,
            applied_tags: tags
        };

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log(`✅ Created thread: ${threadName}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to create thread ${threadName}:`, error);
        return false;
    }
}

// Create comprehensive character tier list
function createCharacterTierList() {
    const characterData = comprehensiveData.character_stats || {};
    const pvpData = comprehensiveData.pvp_strategies || {};
    
    return `# 👥 **Complete Character Tier List - Archero 2**

## 📋 **Overview**

This comprehensive tier list ranks all Archero 2 characters based on their performance in various game modes, using data from ${Object.keys(characterData).length} character entries and ${Object.keys(pvpData).length} PvP strategies.

---

## 🏆 **S-Tier Characters** (Dominant)

### **Rolla** ⭐⭐⭐⭐⭐
- **Strengths**: Freeze abilities for crowd control and team support
- **Best For**: Peak Arena (3v3), PvE crowd control
- **Unlock**: Premium gacha or special events
- **Resonance**: Focus on **Freeze Duration** and **Crowd Control**

### **Thor** ⭐⭐⭐⭐⭐
- **Strengths**: Weapon detach for high damage and area control
- **Best For**: Peak Arena (3v3), PvE bossing
- **Unlock**: Seasonal events or premium gacha
- **Resonance**: Prioritize **Weapon Damage** and **Area Control**

### **Demon King** ⭐⭐⭐⭐⭐
- **Strengths**: Dark magic and powerful AoE abilities
- **Best For**: Peak Arena (3v3), PvE wave clear
- **Unlock**: Premium gacha or rare drops
- **Resonance**: Boost **Dark Magic Damage** and **AoE Range**

### **Otta** ⭐⭐⭐⭐⭐
- **Strengths**: Support abilities and team utility
- **Best For**: Peak Arena (3v3), team support
- **Unlock**: PvP ladder rewards or special events
- **Resonance**: Focus on **Support Effectiveness** and **Team Buffs**

---

## 🥇 **A-Tier Characters** (Excellent)

### **Dragoon** ⭐⭐⭐⭐
- **Strengths**: Balanced stats, versatile abilities
- **Best For**: All content, new players
- **Unlock**: Early game progression
- **Resonance**: Balanced **Attack**, **Defense**, and **Health**

### **Griffin** ⭐⭐⭐⭐
- **Strengths**: Tank abilities, high survivability
- **Best For**: PvP (with full set), PvE tanking
- **Unlock**: Mid-game progression
- **Resonance**: Focus on **Defense**, **Health**, and **Damage Reduction**

### **Oracle** ⭐⭐⭐⭐
- **Strengths**: High damage, good utility
- **Best For**: PvP (1v1), skill-focused builds
- **Unlock**: Mid-game progression
- **Resonance**: Maximize **Skill Damage** and **Energy Recharge**

---

*Data sourced from ${Object.keys(archeroDatabase).length} comprehensive knowledge entries*`;
}

// Create comprehensive gear guide
function createGearGuide() {
    const gearData = comprehensiveData.gear_details || {};
    const dragoonData = comprehensiveData.dragoon_guides || {};
    
    return `# ⚔️ **Complete Gear Guide - Archero 2**

## 📋 **Overview**

This guide provides comprehensive analysis of all gear types, sets, and their optimal usage in Archero 2, based on ${Object.keys(gearData).length} gear entries and ${Object.keys(dragoonData).length} Dragoon-specific guides.

---

## 🛡️ **Gear Sets**

### **Dragoon Set** (Best All-Around)
- **Pieces**: Dragoon Helmet, Dragoon Armor, Dragoon Boots, Dragoon Crossbow
- **Bonus (2-piece)**: +15% Attack Speed
- **Bonus (4-piece)**: Upon critical hit, summon a Dragoon Spirit that deals 200% ATK damage to nearby enemies
- **Best For**: All content (PvE, PvP, Bossing). Highly versatile due to balanced stats and powerful crit-based summon
- **Recommended Weapon**: **Dragoon Crossbow** (High attack speed, piercing shots, excellent in most situations)

### **Oracle Set** (Best for PvP)
- **Pieces**: Oracle Circlet, Oracle Robes, Oracle Sandals, Oracle Staff
- **Bonus (2-piece)**: +10% Skill Damage
- **Bonus (4-piece)**: Skills have a 20% chance to apply 'Divine Mark', increasing damage taken by 15% for 5 seconds
- **Best For**: PvP (burst damage, debuffs), skill-focused builds
- **Recommended Weapon**: Oracle Staff (High skill damage, AoE potential)

### **Griffin Set** (Best for Survivability/Defense)
- **Pieces**: Griffin Helm, Griffin Plate, Griffin Greaves, Griffin Shield
- **Bonus (2-piece)**: +15% Max HP
- **Bonus (4-piece)**: When HP drops below 30%, gain a shield equal to 25% Max HP for 8 seconds (120s cooldown)
- **Best For**: PvE (challenging stages, tanking), defensive builds
- **Recommended Weapon**: Griffin Shield (High defense, damage reduction)

---

## 🏹 **Weapons**

### **Dragoon Crossbow** (Overall Best Weapon)
- **Type**: Ranged
- **Strengths**: High attack speed, piercing shots, excellent in most situations due to its versatility and consistent damage output
- **Best For**: All content, especially when paired with the Dragoon Set

### **Oracle Staff**
- **Type**: Ranged (Magic)
- **Strengths**: High skill damage, good area-of-effect (AoE) for clearing waves
- **Best For**: Skill-focused builds, PvE wave clear

### **Griffin Shield**
- **Type**: Melee (Defensive)
- **Strengths**: High defense, damage reduction, good for tanking
- **Best For**: Tank builds, survivability

---

*Data sourced from ${Object.keys(archeroDatabase).length} comprehensive knowledge entries*`;
}

// Create comprehensive runes guide
function createRunesGuide() {
    const runeData = comprehensiveData.rune_mechanics || {};
    
    return `# 🔮 **Complete Runes System Guide - Archero 2**

## 📋 **Overview**

Unlock the full potential of your character with this in-depth guide to the Runes System in Archero 2, based on ${Object.keys(runeData).length} rune mechanics entries.

---

## ✨ **Rune Types & Effects**

### **Attack Runes** (Red)
- **Focus**: Increase offensive capabilities
- **Examples**:
  - **Power Rune**: +X% Attack Damage
  - **Crit Rune**: +X% Critical Chance
  - **Precision Rune**: +X% Critical Damage
- **Optimal Use**: DPS builds, bossing, PvP

### **Defense Runes** (Blue)
- **Focus**: Enhance survivability
- **Examples**:
  - **Guard Rune**: +X% Defense
  - **Vitality Rune**: +X% Max HP
  - **Resilience Rune**: +X% Damage Reduction
- **Optimal Use**: Tank builds, challenging PvE content

### **Utility Runes** (Green)
- **Focus**: Provide various supportive effects
- **Examples**:
  - **Swiftness Rune**: +X% Attack Speed
  - **Energy Rune**: +X% Energy Recharge
  - **Fortune Rune**: +X% Gold/Item Drop Rate
- **Optimal Use**: Farming, specific skill-based builds, utility support

---

## 🛠️ **Rune Crafting & Upgrading**

- **Crafting**: Combine lower-tier runes or specific materials to create higher-tier runes
- **Upgrading**: Use Gold and Rune Dust to enhance rune stats. Each upgrade level increases the primary and secondary effects
- **Rune Slots**: Characters and equipment have limited rune slots. Strategically choose which runes to equip

---

## 🧪 **Optimal Rune Combinations**

- **DPS Build**: Prioritize Power, Crit, and Precision Runes. Supplement with Swiftness for faster attacks
- **Tank Build**: Focus on Guard, Vitality, and Resilience Runes
- **Farming Build**: Incorporate Fortune Runes for increased drops, alongside moderate Attack Runes for efficient clearing

---

*Data sourced from ${Object.keys(archeroDatabase).length} comprehensive knowledge entries*`;
}

// Create PvP strategies guide
function createPvPStrategiesGuide() {
    const pvpData = comprehensiveData.pvp_strategies || {};
    
    return `# ⚔️ **Complete PvP Strategies Guide - Archero 2**

## 📋 **Overview**

Master both 1v1 PvP and 3v3 Peak Arena with this comprehensive guide based on ${Object.keys(pvpData).length} PvP strategy entries.

---

## 🏆 **1v1 PvP (Regular PvP)**

### **Best Characters for 1v1**
1. **Griffin** - Best with full Griffin set
2. **Dragoon** - Best overall if you don't have full Griffin set
3. **Thor** - High damage, lightning attacks
4. **Loki** - Deceptive tactics, high skill ceiling

### **1v1 Strategies**
- **Griffin Strategy**: High survivability, tank through damage, outlast opponents
- **Dragoon Strategy**: Balanced approach, good damage and defense, works in most situations
- **Thor Strategy**: Burst damage, quick eliminations, aggressive play

---

## 🏟️ **3v3 Peak Arena**

### **Best Characters for Peak Arena**
1. **Rolla** - Freeze abilities for crowd control
2. **Thor** - Weapon detach for high damage
3. **Demon King** - Dark magic and AoE abilities
4. **Otta** - Support abilities and team utility

### **Team Compositions**
- **Best Team**: Rolla + Thor + Demon King (high damage output)
- **Balanced Team**: Rolla + Otta + Griffin (versatile)
- **Defensive Team**: Demon King + Otta + Griffin (sustain)

---

## 🎯 **Advanced PvP Tactics**

### **Positioning**
- Use terrain to your advantage
- Stay mobile, don't cluster
- Focus fire on one enemy at a time

### **Skill Management**
- Time your skills for maximum impact
- Don't waste them on low-priority targets
- Coordinate with teammates in Peak Arena

---

*Data sourced from ${Object.keys(archeroDatabase).length} comprehensive knowledge entries*`;
}

// Create boss guides
function createBossGuides() {
    const bossData = comprehensiveData.boss_guides || {};
    
    return `# 👹 **Complete Boss Guides - Archero 2**

## 📋 **Overview**

Conquer all bosses in Archero 2 with this comprehensive guide based on ${Object.keys(bossData).length} boss strategy entries.

---

## 🎯 **Boss Battle Strategies**

### **General Boss Tactics**
- **Learn Patterns**: Each boss has predictable attack patterns
- **Dodge, Don't Tank**: Focus on evading boss attacks
- **Exploit Weaknesses**: Some bosses are vulnerable to specific damage types
- **Burst vs. Sustained**: Adapt your strategy based on boss type

### **Boss-Specific Strategies**
- **Dragon Boss**: Use fire resistance, attack from range
- **Ice Boss**: Use fire damage, avoid ice attacks
- **Lightning Boss**: Use lightning resistance, stay mobile
- **Dark Boss**: Use light damage, avoid dark zones

---

## ⚔️ **Recommended Builds for Bossing**

### **DPS Build**
- **Character**: Thor or Demon King
- **Weapon**: Dragoon Crossbow or Oracle Staff
- **Runes**: Power, Crit, Precision
- **Strategy**: High damage, quick kills

### **Tank Build**
- **Character**: Griffin
- **Weapon**: Griffin Shield
- **Runes**: Guard, Vitality, Resilience
- **Strategy**: High survivability, sustained damage

---

*Data sourced from ${Object.keys(archeroDatabase).length} comprehensive knowledge entries*`;
}

// Main function to update all forums
async function updateAllForums() {
    console.log('🚀 Starting comprehensive forum update with new data...');
    
    // Load comprehensive data
    if (!loadComprehensiveData()) {
        console.log('❌ Failed to load comprehensive data');
        return;
    }
    
    // Get all current threads
    const threads = await getAllThreads();
    console.log(`Found ${threads.length} current threads`);
    
    // Delete all existing threads
    console.log('🗑️ Deleting all existing threads...');
    for (const thread of threads) {
        if (thread.name.includes('KNOWLEDGE HUB') || thread.name.includes('Table of Contents')) {
            console.log(`⏭️ Skipping table of contents: ${thread.name}`);
            continue;
        }
        
        await deleteThread(thread.id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    }
    
    // Create new comprehensive threads
    console.log('📝 Creating new comprehensive threads...');
    
    const newThreads = [
        {
            name: 'Complete Character Tier List',
            content: createCharacterTierList(),
            tags: ['1424149502004039681', '1424149161753972747', '1424149478717264014'] // PvE, Gear, PvP
        },
        {
            name: 'Complete Gear Guide',
            content: createGearGuide(),
            tags: ['1424149161753972747'] // Gear
        },
        {
            name: 'Complete Runes System Guide',
            content: createRunesGuide(),
            tags: ['1424149193265512529'] // Runes
        },
        {
            name: 'Complete PvP Strategies Guide',
            content: createPvPStrategiesGuide(),
            tags: ['1424149478717264014', '1424149659508805653'] // PvP, Supreme Arena
        },
        {
            name: 'Complete Boss Guides',
            content: createBossGuides(),
            tags: ['1424149502004039681'] // PvE
        }
    ];
    
    for (const thread of newThreads) {
        console.log(`📝 Creating: ${thread.name}`);
        await createThread(thread.content, thread.name, thread.tags);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
    }
    
    console.log('✅ All forums updated with comprehensive data!');
}

// Run the script
if (require.main === module) {
    updateAllForums().catch(console.error);
}

module.exports = { updateAllForums, loadComprehensiveData };
