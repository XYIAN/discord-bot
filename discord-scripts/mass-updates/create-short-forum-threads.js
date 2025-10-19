const WEBHOOK_URL = 'https://discord.com/api/webhooks/REDACTED';

// Create short character tier list
function createShortCharacterTierList() {
    return `# 👥 **Complete Character Tier List**

## 🏆 **S-Tier Characters**
1. **Rolla** - Freeze abilities, crowd control
2. **Thor** - Weapon detach, high damage
3. **Demon King** - Dark magic, AoE abilities
4. **Otta** - Support abilities, team utility

## 🥇 **A-Tier Characters**
5. **Dragoon** - Balanced, versatile
6. **Griffin** - Tank abilities, high survivability
7. **Oracle** - High damage, good utility

## 🎯 **Best For Each Mode**
- **Peak Arena (3v3)**: Rolla, Thor, Demon King, Otta
- **PvP (1v1)**: Griffin (full set), Dragoon (overall)
- **PvE**: Thor, Demon King, Rolla

*Data from 1,367+ comprehensive knowledge entries*`;
}

// Create short gear guide
function createShortGearGuide() {
    return `# ⚔️ **Complete Gear Guide**

## 🛡️ **Best Gear Sets**
- **Dragoon Set** - Best all-around, versatile
- **Oracle Set** - Best for PvP, skill damage
- **Griffin Set** - Best for survivability

## 🏹 **Best Weapons**
- **Dragoon Crossbow** - Overall best weapon
- **Oracle Staff** - Skill damage builds
- **Griffin Shield** - Tank builds

## ⚡ **Set Bonuses**
- **2-piece**: +15% Attack Speed (Dragoon), +10% Skill Damage (Oracle), +15% Max HP (Griffin)
- **4-piece**: Special abilities and powerful effects

*Data from 1,367+ comprehensive knowledge entries*`;
}

// Create short runes guide
function createShortRunesGuide() {
    return `# 🔮 **Complete Runes System Guide**

## ✨ **Rune Types**
- **Attack (Red)** - Power, Crit, Precision runes
- **Defense (Blue)** - Guard, Vitality, Resilience runes
- **Utility (Green)** - Swiftness, Energy, Fortune runes

## 🛠️ **Best Combinations**
- **DPS Build**: Power + Crit + Precision + Swiftness
- **Tank Build**: Guard + Vitality + Resilience
- **Farming Build**: Fortune + moderate Attack runes

## 📈 **Upgrading**
- Use Gold and Rune Dust to enhance stats
- Each upgrade increases primary and secondary effects
- Strategically choose which runes to equip

*Data from 1,367+ comprehensive knowledge entries*`;
}

// Create short PvP guide
function createShortPvPGuide() {
    return `# ⚔️ **Complete PvP Strategies Guide**

## 🏆 **1v1 PvP (Regular PvP)**
- **Best Characters**: Griffin (full set), Dragoon (overall)
- **Strategy**: Focus on main weapon damage and positioning
- **Builds**: Tank (Griffin) or Balanced (Dragoon)

## 🏟️ **3v3 Peak Arena**
- **Best Characters**: Rolla, Thor, Demon King, Otta
- **Team Compositions**: Rolla + Thor + Demon King (aggressive)
- **Strategy**: Coordinate abilities, focus fire, use terrain

## 🎯 **Advanced Tactics**
- **Positioning**: Use terrain, stay mobile, don't cluster
- **Skill Management**: Time skills for maximum impact
- **Team Coordination**: Focus fire, communicate, coordinate ultimates

*Data from 1,367+ comprehensive knowledge entries*`;
}

// Create short boss guide
function createShortBossGuide() {
    return `# 👹 **Complete Boss Guides**

## 🎯 **General Boss Tactics**
- **Learn Patterns**: Each boss has predictable attacks
- **Dodge, Don't Tank**: Focus on evading attacks
- **Exploit Weaknesses**: Use specific damage types
- **Adapt Strategy**: Burst vs. sustained damage

## ⚔️ **Recommended Builds**
- **DPS Build**: Thor/Demon King + Dragoon Crossbow + Power/Crit runes
- **Tank Build**: Griffin + Griffin Shield + Guard/Vitality runes

## 🏆 **Boss-Specific Tips**
- **Dragon Boss**: Fire resistance, attack from range
- **Ice Boss**: Fire damage, avoid ice attacks
- **Lightning Boss**: Lightning resistance, stay mobile

*Data from 1,367+ comprehensive knowledge entries*`;
}

// Create table of contents
function createTableOfContents() {
    return `# 📚 **ARCH 2 ADDICTS - KNOWLEDGE HUB**

## 🎯 **Welcome to the Ultimate Archero 2 Resource Center!**

*Your one-stop destination for all things Archero 2 - from beginner guides to advanced strategies!*

---

## 🏆 **CORE GUIDES** 🏆

### **Character & Builds**
- **👥 [Complete Character Tier List](https://discord.com/channels/1419944148701679686/PLACEHOLDER)** - Master tier rankings & strategies
- **⚔️ [Complete Gear Guide](https://discord.com/channels/1419944148701679686/PLACEHOLDER)** - Ultimate equipment optimization
- **🔮 [Complete Runes System Guide](https://discord.com/channels/1419944148701679686/PLACEHOLDER)** - Rune mastery & optimization

### **Game Modes & Strategies**
- **⚔️ [Complete PvP Strategies Guide](https://discord.com/channels/1419944148701679686/PLACEHOLDER)** - Master 1v1 and 3v3 battles
- **👹 [Complete Boss Guides](https://discord.com/channels/1419944148701679686/PLACEHOLDER)** - Conquer all bosses

---

## 🎨 **NAVIGATION TIPS** 🎨

- **🔗 Click any link above** to jump directly to that guide
- **📌 Pin this thread** for quick access to all resources
- **💬 Ask questions** in the respective guide threads
- **🔄 Check back regularly** for updates and new content

---

*Last updated: ${new Date().toLocaleDateString()} | Keep grinding, keep dominating!* 🎮✨`;
}

// Create all threads
async function createAllThreads() {
    console.log('🚀 Creating short forum threads...');
    
    const threads = [
        {
            name: 'Complete Character Tier List',
            content: createShortCharacterTierList(),
            tags: ['1424149502004039681', '1424149161753972747', '1424149478717264014']
        },
        {
            name: 'Complete Gear Guide',
            content: createShortGearGuide(),
            tags: ['1424149161753972747']
        },
        {
            name: 'Complete Runes System Guide',
            content: createShortRunesGuide(),
            tags: ['1424149193265512529']
        },
        {
            name: 'Complete PvP Strategies Guide',
            content: createShortPvPGuide(),
            tags: ['1424149478717264014', '1424149659508805653']
        },
        {
            name: 'Complete Boss Guides',
            content: createShortBossGuide(),
            tags: ['1424149502004039681']
        },
        {
            name: '📚 ARCH 2 ADDICTS - KNOWLEDGE HUB',
            content: createTableOfContents(),
            tags: []
        }
    ];
    
    for (const thread of threads) {
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: thread.content,
                    thread_name: thread.name,
                    applied_tags: thread.tags
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            console.log(`✅ Created: ${thread.name}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
        } catch (error) {
            console.error(`❌ Failed to create ${thread.name}:`, error);
        }
    }
    
    console.log('✅ All short forum threads created!');
}

// Run the script
if (require.main === module) {
    createAllThreads().catch(console.error);
}

module.exports = { createAllThreads };
