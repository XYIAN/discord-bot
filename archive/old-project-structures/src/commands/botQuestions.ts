import { EmbedBuilder } from 'discord.js';

// Advanced Archero 2 Q&A Database for Bot Questions Channel
export const advancedArcheroQA = {
    // Orb System
    "swapping orbs": "Orb Swapping allows you to change your character's elemental affinity. Each orb provides different bonuses: Fire (damage), Ice (slow effects), Lightning (chain damage), Poison (DoT), Dark (critical chance). Swapping costs gems but can dramatically change your build effectiveness.",
    "orb effects": "Orb Effects: Fire Orbs increase damage by 15-25%, Ice Orbs slow enemies by 20-30%, Lightning Orbs chain to 2-3 additional enemies, Poison Orbs deal 10-20% damage over time, Dark Orbs increase critical chance by 15-25%. Each orb has 3 tiers with increasing effectiveness.",
    "best orb combinations": "Best Orb Combinations: 1) Fire + Lightning (high damage + chain), 2) Ice + Dark (control + crit), 3) Poison + Fire (DoT + burst), 4) All 5 orbs (maximum versatility but expensive). Choose based on your playstyle and available resources.",
    "orb tier system": "Orb Tier System: Tier 1 (Basic) - 10-15% bonus, Tier 2 (Advanced) - 15-20% bonus, Tier 3 (Master) - 20-25% bonus. Upgrading requires orbs of the same type and elemental essence. Higher tiers unlock additional effects and synergies.",
    
    // Razor Starcore System
    "razor starcore": "Razor Starcore is a late-game enhancement system that provides massive stat bonuses. Each starcore can be upgraded using Razor Shards and provides unique abilities. There are 5 starcore slots: Weapon, Armor, Accessory, Rune, and Special.",
    "starcore upgrades": "Starcore Upgrades: Each starcore has 10 levels. Level 1-3: Basic stat bonuses, Level 4-6: Unlock special abilities, Level 7-9: Enhanced abilities, Level 10: Ultimate ability. Upgrading requires Razor Shards which are obtained from high-level content and events.",
    "starcore combinations": "Starcore Combinations: Weapon + Armor (damage + defense), Accessory + Rune (utility + survivability), Special + Weapon (unique abilities + damage). Some combinations provide synergy bonuses when used together.",
    "razor shards": "Razor Shards are rare materials used to upgrade starcores. Sources: Supreme Arena rewards, high-level dungeons, special events, guild activities. Save them for your most important starcores as they're extremely rare.",
    
    // Skin System
    "skin effects": "Skin Effects: Each skin provides unique stat bonuses and special abilities. Common skins: +5-10% damage, Rare skins: +10-15% damage + special effect, Epic skins: +15-20% damage + unique ability, Legendary skins: +20-25% damage + ultimate ability.",
    "skin resonance": "Skin Resonance occurs when you have multiple skins of the same character. Resonance provides additional bonuses: 2 skins: +5% all stats, 3 skins: +10% all stats + special effect, 4+ skins: +15% all stats + ultimate effect. This encourages collecting multiple skins.",
    "best skins": "Best Skins by Character: Dragoon - Dragon Lord (legendary), Griffin - Storm Wing (epic), Helix - Shadow Assassin (rare). Focus on skins that complement your build and provide useful abilities for your playstyle.",
    "skin upgrading": "Skin Upgrading: Use duplicate skins or skin fragments to upgrade. Each upgrade increases stat bonuses and unlocks new abilities. Max level is 10. Higher rarity skins have better base stats and more powerful abilities.",
    
    // Sacred Hall System
    "sacred hall": "Sacred Hall is a building system that provides permanent stat bonuses to all your characters. Each hall level increases specific stats: Attack Hall (damage), Defense Hall (health/armor), Speed Hall (movement/attack speed), Critical Hall (crit chance/damage).",
    "sacred hall vs tier up": "Sacred Hall vs Tier Up: Sacred Hall provides permanent bonuses to ALL characters, Tier Up improves individual character stats. Sacred Hall is better for long-term progression, Tier Up is better for immediate character power. Balance both for optimal growth.",
    "hall leveling priority": "Hall Leveling Priority: 1) Attack Hall (damage is king), 2) Critical Hall (crit chance/damage), 3) Defense Hall (survivability), 4) Speed Hall (quality of life). Focus on one hall at a time for maximum efficiency.",
    "hall materials": "Hall Materials: Sacred Stones (common), Sacred Crystals (rare), Sacred Gems (epic), Sacred Orbs (legendary). Higher tier materials provide more experience. Use them strategically based on your current hall levels.",
    
    // Resonance System
    "resonance": "Resonance is a system where matching equipment pieces provide bonus effects. Same weapon type: +10% damage, Same armor set: +15% defense, Same accessory type: +20% special ability cooldown. Mix and match for optimal bonuses.",
    "resonance levels": "Resonance Levels: Level 1 (2 pieces): Basic bonus, Level 2 (3 pieces): Enhanced bonus, Level 3 (4 pieces): Maximum bonus + special effect. Higher levels require rarer equipment but provide significantly better bonuses.",
    "resonance vs diversity": "Resonance vs Diversity: Resonance provides better individual bonuses, Diversity provides more overall stats. For Supreme Arena, diversity is better due to item bonus system. For regular content, resonance can be more effective.",
    
    // Advanced Mechanics
    "stat caps": "Stat Caps: Each stat has a soft cap where additional points provide diminishing returns. Attack: 50,000 (soft cap), Health: 100,000 (soft cap), Critical: 75% (hard cap), Speed: 200% (hard cap). Focus on balanced stats rather than maxing one stat.",
    "diminishing returns": "Diminishing Returns: After soft caps, each additional point provides 50% effectiveness. This encourages balanced builds rather than focusing on single stats. Plan your upgrades around these caps for maximum efficiency.",
    "meta shifts": "Meta Shifts: The game meta changes with updates and new content. Current meta (2024): Dragoon + Griffin + third hero for Supreme Arena, Fire + Lightning orbs, Attack + Critical halls, balanced resonance. Stay updated with community discussions.",
    "endgame progression": "Endgame Progression: 1) Max Sacred Halls, 2) Collect all character skins, 3) Upgrade Razor Starcores, 4) Perfect orb combinations, 5) Optimize resonance builds, 6) Master Supreme Arena strategies. Focus on one system at a time for steady progress.",
    
    // Guild Advanced Features
    "guild wars": "Guild Wars are competitive events where guilds battle for territory and rewards. Participate in guild wars for exclusive rewards, territory bonuses, and guild prestige. Coordinate with guild members for maximum effectiveness.",
    "guild research": "Guild Research provides permanent bonuses to all guild members. Research categories: Combat (damage/health), Economy (gold/exp), Social (guild activities), Special (unique abilities). Contribute to research for guild and personal benefits.",
    "guild rankings": "Guild Rankings are based on total guild power, activity, and achievements. Higher rankings provide better rewards and prestige. Focus on member activity and power growth to climb rankings.",
    
    // Event Strategies
    "event optimization": "Event Optimization: 1) Save resources for events, 2) Focus on event-specific rewards, 3) Coordinate with guild members, 4) Use event-specific strategies, 5) Maximize event participation. Events provide the best rewards in the game.",
    "seasonal events": "Seasonal Events: Each season brings unique events with exclusive rewards. Spring: Growth events, Summer: Battle events, Fall: Harvest events, Winter: Celebration events. Plan your progression around seasonal events for maximum rewards.",
    
    // PvP Advanced
    "pvp meta": "PvP Meta: Current meta focuses on burst damage and survivability. Dragoon + Griffin + third hero, Fire + Lightning orbs, Attack + Critical halls, balanced resonance. Adapt your build based on opponent strategies.",
    "pvp counters": "PvP Counters: High damage builds counter tank builds, Tank builds counter burst builds, Speed builds counter slow builds, Control builds counter speed builds. Learn to identify and counter different build types.",
    "pvp psychology": "PvP Psychology: Predict opponent moves, bait out abilities, control the battlefield, manage cooldowns, adapt strategies. Mental game is as important as mechanical skill in high-level PvP.",
    
    // Resource Management
    "resource priority": "Resource Priority: 1) Sacred Hall materials, 2) Character upgrades, 3) Equipment upgrades, 4) Orb upgrades, 5) Skin collection, 6) Starcore upgrades. Focus on permanent upgrades first, then temporary ones.",
    "gem spending": "Gem Spending: 1) Sacred Hall upgrades, 2) Character skins, 3) Orb swapping, 4) Event participation, 5) Equipment upgrades. Avoid spending gems on temporary items or low-value upgrades.",
    "gold efficiency": "Gold Efficiency: 1) Sacred Hall upgrades, 2) Character leveling, 3) Equipment upgrades, 4) Orb upgrades, 5) Skin upgrades. Gold is abundant, use it liberally for permanent upgrades.",
    
    // Build Optimization
    "build theory": "Build Theory: Every build should have a clear purpose and synergy. Damage builds focus on attack and critical, Tank builds focus on health and defense, Support builds focus on utility and team benefits. Choose based on your playstyle and goals.",
    "build testing": "Build Testing: Test builds in different content types, compare performance metrics, adjust based on results, seek community feedback, document successful builds. Regular testing ensures optimal performance.",
    "build adaptation": "Build Adaptation: Adapt builds based on content, opponent strategies, available resources, meta changes, personal preferences. Flexibility is key to long-term success in Archero 2.",
    
    // Community and Social
    "community resources": "Community Resources: Discord servers, Reddit communities, YouTube guides, Twitch streams, Guild discussions. Stay connected with the community for the latest strategies and updates.",
    "mentorship": "Mentorship: Find experienced players to guide your progression, ask questions regularly, share your knowledge with others, participate in discussions, help newer players. Teaching others helps you learn too.",
    "guild leadership": "Guild Leadership: Set clear expectations, organize events, manage resources, resolve conflicts, motivate members, plan strategies. Good leadership makes the difference between average and top guilds."
};

export function handleBotQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Direct matches
    if (advancedArcheroQA[lowerQuestion]) {
        return advancedArcheroQA[lowerQuestion];
    }
    
    // Partial matches
    for (const [key, answer] of Object.entries(advancedArcheroQA)) {
        if (lowerQuestion.includes(key) || key.includes(lowerQuestion)) {
            return answer;
        }
    }
    
    // Keyword matching
    const keywords = {
        'orb': 'swapping orbs',
        'starcore': 'razor starcore',
        'skin': 'skin effects',
        'resonance': 'resonance',
        'sacred hall': 'sacred hall',
        'tier up': 'sacred hall vs tier up',
        'meta': 'meta shifts',
        'pvp': 'pvp meta',
        'guild': 'guild wars',
        'event': 'event optimization',
        'build': 'build theory',
        'resource': 'resource priority'
    };
    
    for (const [keyword, topic] of Object.entries(keywords)) {
        if (lowerQuestion.includes(keyword)) {
            return advancedArcheroQA[topic];
        }
    }
    
    return "I don't have specific information about that topic yet. Could you rephrase your question or ask about orbs, starcores, skins, resonance, sacred halls, or other advanced game mechanics? I'm here to help with the deeper nuances of Archero 2!";
}

export function getBotQuestionHelp(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('🤖 Bot Questions Channel - Advanced Archero 2 Help')
        .setDescription('Ask me about advanced game mechanics, strategies, and nuances!')
        .setColor(0x00ff88)
        .addFields(
            {
                name: '🎯 **Orb System**',
                value: '• `swapping orbs` - Orb mechanics and effects\n• `orb combinations` - Best orb setups\n• `orb tier system` - Upgrading orbs',
                inline: true
            },
            {
                name: '⭐ **Razor Starcore**',
                value: '• `razor starcore` - Starcore system\n• `starcore upgrades` - Upgrading starcores\n• `razor shards` - Obtaining materials',
                inline: true
            },
            {
                name: '🎨 **Skin System**',
                value: '• `skin effects` - Skin bonuses\n• `skin resonance` - Multiple skin bonuses\n• `best skins` - Top skin recommendations',
                inline: true
            },
            {
                name: '🏛️ **Sacred Hall**',
                value: '• `sacred hall` - Hall system\n• `sacred hall vs tier up` - Comparison\n• `hall leveling priority` - Upgrade order',
                inline: true
            },
            {
                name: '⚡ **Resonance**',
                value: '• `resonance` - Equipment resonance\n• `resonance levels` - Resonance tiers\n• `resonance vs diversity` - Strategy comparison',
                inline: true
            },
            {
                name: '🎮 **Advanced**',
                value: '• `meta shifts` - Current meta\n• `endgame progression` - Late game tips\n• `build theory` - Build optimization',
                inline: true
            }
        )
        .setFooter({ text: 'Ask me anything about these topics for detailed explanations!' })
        .setTimestamp();
}
