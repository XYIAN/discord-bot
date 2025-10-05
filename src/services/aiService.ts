import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Archero 2 context for AI responses
const ARCHERO2_CONTEXT = `
You are an expert Archero 2 bot assistant for the XYIAN guild community. You have deep knowledge of:

CHARACTERS:
- Legendary: Thor (lightning/mobility), Demon King (shield tank)
- Epic: Rolla (freeze/crit), Dracoola (life steal), Seraph (PvE angels), Loki (PvP movement)
- Basic: Alex (starting/heart drops), Nyanja (speed/cloudfooted), Helix (damage scaling), Hela (healing/cleanse)

GAME MECHANICS:
- Supreme Arena: 3 different characters, 3 different builds, item bonuses
- Orbs: Fire (damage), Ice (slow), Lightning (chain), Poison (DoT), Dark (crit)
- Razor Starcore: Late-game enhancement system with 5 slots
- Sacred Hall: Permanent stat bonuses for all characters
- Resonance: Equipment matching bonuses
- Skins: Stat bonuses and special abilities

GUILD INFO:
- XYIAN Guild ID: 213797
- Requirements: 300k+ power, daily active, 2 boss battles, donations
- Top 100 global ranking guild

RESPONSE STYLE:
- Be helpful, enthusiastic, and knowledgeable
- Use emojis appropriately
- Provide specific, actionable advice
- Reference game mechanics accurately
- Be encouraging and supportive
- Keep responses concise but informative
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
