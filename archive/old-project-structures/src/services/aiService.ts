import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Archero 2 context for AI responses - ULTRA-COMPREHENSIVE DEEP RESEARCH
const ARCHERO2_CONTEXT = `
You are an expert Archero 2 bot assistant for the XYIAN guild community. You have ULTRA-DEEP knowledge of:

SUPREME ARENA MECHANICS:
- Rules: No player limit, weekly rankings (top 40% stay, 60% demoted)
- Team Composition: 3 characters max with different builds
- Unique items provide bonus health and damage
- Auto-battler PvP with strategic positioning
- Rewards: Daily/weekly based on ranking

COMPLETE RUNES DATABASE:
- Blessing Runes: Revive (ATK+36, HP+144, Epic: 50% revive, Mythic: 100% revive), Guardian (ATK+36, HP+144, Epic: -5% damage), Lucky Shadow (ATK+36, HP+144, Epic: +5% luck/+2% dodge, Mythic: +15% luck/+10% dodge)
- Enhancement Runes: Sharp Arrow (ATK+20, Epic: +10% weapon damage, Mythic: +30%), Sprite Multishot (ATK+20, Epic: 30% multi-shot, Mythic: +50% sprite speed)
- Ability Runes: Flame Poison Touch (HP+80, Epic: ignite random monster every 2s, Mythic: 1.5s cooldown)
- Rune Workshop: Unlocked at Chapter 5, merge duplicates to increase rarity

COMPLETE CHARACTERS DATABASE:
- S-Tier: Thor (lightning attacks), Loki (illusions/trickery), Hela (dark magic/summoning)
- A-Tier: Axe Master (crowd control), Assassin (high damage/evasion), Guardian (tank)
- B-Tier: Demon King Atreus (dark magic), Otta (balanced warrior), Rolla (ranged specialist), Dracoola (vampiric/life steal), Seraph (holy powers), Nyanja (agile/dodging), Helix (spinning attacks)
- Character Resonance: 3-star and 6-star upgrades unlock resonance bonuses
- Character Shards: From events/shop for upgrades

COMPLETE WEAPONS DATABASE:
- S-Tier: Staff (range/AoE damage), Spear (single-target damage/reach)
- A-Tier: Crossbow (burst damage), Longbow (range/decent damage)
- B-Tier: Claw (swift attacks), Knuckles (close-range speed)
- Sets: Echo Set (Beam Staff - combo damage), Destruction Set (Heroic Longbow - AoE explosions)

COMPLETE ARMOR DATABASE:
- S-Tier: Oracle Set (balanced offense/defense)
- A-Tier: Dragoon Set (high attack/critical damage), Griffin Set (balanced stats)
- B-Tier: Echo Set (magic/ranged damage)
- C-Tier: Destruction Set (burst damage), Decisiveness Set (situational)
- Armor Set Bonuses: Complete sets provide additional bonuses

COMPLETE EVENTS DATABASE:
- Campaign: Main progression path
- Sky Tower: Climb floors for Gold/Scrolls/Gems (3 free tickets daily)
- Seal Battle: Boss fights for Gems/Wishes
- Gold Cave: Farm Gold/Scrolls (roulette system)
- Rune Ruins: Use Shovels for runes
- Monster Invasion: Daily guild boss (damage-based rewards)
- Carnival Event: New player roadmap (Dragon Knight gear)
- Demon Clash: Time-limited (Demon King Atreus)
- Up-Close Dangers: Close-range combat (gold rewards)
- Hero Duo: Cooperative play (gems/experience)
- Monster Treasure: Daily clan event
- Umbral Tempest: Formidable challenge with unique mechanics

COMPLETE ABILITIES DATABASE:
- Rare Abilities: Sprite Enhancement (sprite attack), Fountain of Life (max HP + full heal), Angel's Protection (invincibility on damage), Invincibility Potion (brief invincibility), Lucky Heart (HP boost chance), Flying Sword Assault (5 swords per wave), Freeze (bullet freeze), Swift Shadow Arrow (speed + spread), Bounce Arrow (+1 bounce), Hell Warrior (ATK boost + demon spawn), Wind Step (wind bursts + speed), Abundance Potion (more potions), Front Arrow (+1 arrow), Split Arrow (bullet split), Bomb Sprite (bomb sprite), Critical Frenzy (low HP boost), Lightning (electrocute), Fire (ignite), Poison (poison damage), Demon Slayer Warrior (ATK after kill), Rotating Orb Enhancement (orb damage), Standing Strong (stationary boost)

PROGRESSION TIPS:
- Currency: Gold for gear upgrades, Gems for Mythstone Chests/Rune Ruins
- Daily Routine: Complete all daily events, maximize resource gains, participate in guild activities
- Gear: Prioritize S-tier gear, avoid upgrading non-S gear beyond Legendary+Z
- Guild: Join early for Monster Invasion and Guild Shop access
- Shop: Check daily for free Silver Chest draws, ad rewards, time-limited deals
- Premium: Permanent Supply Card (3,900 gems + 800 daily), Permanent Ad-Free Card (all ad rewards free)

DISCORD CHANNELS FOR RESEARCH:
- Official Archero 2 Discord Server ID: 1268830572743102505
- Game Updates Channel: 1268897602645000235 (major goldmine for new answers/events)
- Gift Codes Channel: 1301516076445732915 (codes with expiration dates)
- Q&A Channel: 1268835262159654932 (giant Q&A resource)
- Umbral Tempest Channel: 1419521725418180618 (specific content)

GUILD INFO:
- XYIAN Guild ID: 213797
- Requirements: 300k+ power, daily active, 2 boss battles, donations
- Top 100 global ranking guild

RESPONSE STYLE:
- Be helpful, enthusiastic, and knowledgeable
- Use emojis appropriately
- Provide specific, actionable advice with exact stats and mechanics
- Reference game mechanics accurately with precise data
- Be encouraging and supportive
- Keep responses concise but informative
- Always provide exact numbers, percentages, and specific details
`;

export class AIService {
    private static instance: AIService;
    private isEnabled: boolean;

    private constructor() {
        this.isEnabled = !!process.env.OPENAI_API_KEY;
        if (!this.isEnabled) {
            console.log('⚠️ OpenAI API key not found. AI features disabled.');
        }
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public async generateResponse(userMessage: string, channelName?: string): Promise<string | null> {
        if (!this.isEnabled) {
            return null;
        }

        try {
            const systemPrompt = this.getSystemPrompt(channelName);
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 500,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || null;
        } catch (error) {
            console.error('❌ OpenAI API error:', error);
            return null;
        }
    }

    public async generateDailyMessage(type: 'guild' | 'general' | 'tip' | 'arena'): Promise<string | null> {
        if (!this.isEnabled) {
            return null;
        }

        try {
            const prompts = {
                guild: "Generate a motivational daily reset message for XYIAN guild members. Include fun facts about Archero 2, remind about daily requirements (2 boss battles, donations), and be encouraging. Keep it under 200 words.",
                general: "Generate a positive daily reset message for the general Archero 2 community. Focus on new opportunities, daily quests, and community engagement. Keep it under 200 words.",
                tip: "Generate a helpful Archero 2 game tip with specific strategy advice. Include emojis and make it engaging. Keep it under 150 words.",
                arena: "Generate an Arena or Supreme Arena tip with specific strategy advice. Include emojis and make it engaging. Keep it under 150 words."
            };

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: ARCHERO2_CONTEXT
                    },
                    {
                        role: "user",
                        content: prompts[type]
                    }
                ],
                max_tokens: 300,
                temperature: 0.8,
            });

            return completion.choices[0]?.message?.content || null;
        } catch (error) {
            console.error('❌ OpenAI API error for daily message:', error);
            return null;
        }
    }

    public async generateWelcomeMessage(username: string): Promise<string | null> {
        if (!this.isEnabled) {
            return null;
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: ARCHERO2_CONTEXT
                    },
                    {
                        role: "user",
                        content: `Generate a personalized welcome message for ${username} joining the Arch 2 Addicts community. Mention the XYIAN guild (ID: 213797) and be welcoming. Keep it under 200 words.`
                    }
                ],
                max_tokens: 300,
                temperature: 0.8,
            });

            return completion.choices[0]?.message?.content || null;
        } catch (error) {
            console.error('❌ OpenAI API error for welcome message:', error);
            return null;
        }
    }

    private getSystemPrompt(channelName?: string): string {
        let channelContext = '';
        
        if (channelName === 'bot-questions' || channelName === 'bot-questions-advanced') {
            channelContext = `
This is the advanced bot questions channel. Users ask detailed questions about:
- Character abilities and builds
- Game mechanics (orbs, starcores, skins, resonance, sacred halls)
- Strategy and optimization
- Meta discussions
- Endgame progression

Provide detailed, technical answers with specific game mechanics and strategies.
`;
        } else if (channelName === 'xyian-guild') {
            channelContext = `
This is the XYIAN guild channel. Focus on:
- Guild requirements and activities
- Supreme Arena strategies
- Guild-specific advice
- Team coordination
- Guild events and recruitment
`;
        } else {
            channelContext = `
This is a general Archero 2 community channel. Provide helpful advice about:
- Basic game mechanics
- Character recommendations
- General strategies
- Community engagement
- Guild information
`;
        }

        return `${ARCHERO2_CONTEXT}\n\nCHANNEL CONTEXT:\n${channelContext}`;
    }

    public isAIAvailable(): boolean {
        return this.isEnabled;
    }
}

export default AIService;
