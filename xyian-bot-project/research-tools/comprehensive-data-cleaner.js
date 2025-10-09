#!/usr/bin/env node

// Comprehensive Data Cleaner
// Processes all raw scraped data to remove noise and extract factual information

const fs = require('fs');
const path = require('path');

class ComprehensiveDataCleaner {
    constructor() {
        this.rawDataDir = path.join(__dirname, 'raw-scraped-data');
        this.cleanDataDir = path.join(__dirname, '..', 'data', 'cleaned-comprehensive-knowledge');
        this.noisePatterns = this.initializeNoisePatterns();
        this.factPatterns = this.initializeFactPatterns();
        
        // Create clean data directory
        if (!fs.existsSync(this.cleanDataDir)) {
            fs.mkdirSync(this.cleanDataDir, { recursive: true });
        }
    }

    initializeNoisePatterns() {
        return {
            // Usernames and timestamps
            usernames: /@\w+|<\@\d+>|\[\d{2}:\d{2}\]|\[\d{1,2}\/\d{1,2}\/\d{4}\]/g,
            // Discord reactions and emojis
            reactions: /<:\w+:\d+>|👍|👎|😂|😭|🔥|💯|🎉|🤔|😱|😤|😡|😢|😊|😎|🤯|💀|👀|🙄|😅|😆|😇|😈|👻|🤖|👽|👾|🤡|💩|🎭|🎨|🎪|🎯|🎲|🎳|🎸|🎺|🎻|🎼|🎵|🎶|🎤|🎧|🎬|🎭|🎨|🎪|🎯|🎲|🎳|🎸|🎺|🎻|🎼|🎵|🎶|🎤|🎧|🎬/g,
            // Chat noise
            chatNoise: /\b(lol|haha|lmao|rofl|wtf|omg|fml|smh|tbh|imo|imho|nvm|btw|fyi|idk|idc|irl|afk|brb|gtg|ttyl|cya|gg|gl|hf|wp|ez|op|nerf|buff|meta|noob|pro|god|legend|king|queen|beast|monster|savage|fire|lit|based|cringe|sus|cap|facts|fax|periodt|slay|bet|fr|ngl|lowkey|highkey|main|alt|smurf|boost|carry|clutch|throw|feed|tilt|toxic|salty|mad|angry|sad|happy|excited|hyped|pumped|ready|lets go|go go go|come on|yes|no|maybe|sure|ok|okay|alright|cool|nice|sweet|awesome|amazing|incredible|unbelievable|insane|crazy|wild|nuts|bonkers|mental|psycho|insane|mad|angry|furious|rage|pissed|annoyed|frustrated|disappointed|sad|depressed|down|upset|hurt|pain|suffering|agony|torment|hell|nightmare|disaster|catastrophe|tragedy|horror|terror|fear|scared|afraid|worried|anxious|nervous|stressed|overwhelmed|confused|lost|clueless|dumb|stupid|idiot|moron|fool|jerk|asshole|dick|prick|bastard|bitch|whore|slut|cunt|fuck|shit|damn|hell|crap|bullshit|garbage|trash|junk|waste|useless|worthless|pointless|meaningless|stupid|dumb|idiotic|ridiculous|absurd|nonsense|gibberish|garbage|trash|junk|waste|useless|worthless|pointless|meaningless)\b/gi,
            // Discord formatting
            discordFormatting: /\*\*|\*|__|_|~~|`|```|> |>|>>>/g,
            // URLs and links
            urls: /https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+/g,
            // Numbers that are likely timestamps or IDs
            timestamps: /\b\d{10,}\b/g,
            // Common Discord bot responses
            botResponses: /(bot|Bot|BOT).*?(responding|response|answer|reply|help|assist)/gi,
            // Off-topic discussions
            offTopic: /\b(weather|food|music|movie|game|sport|news|politics|religion|family|work|school|college|university|job|career|money|finance|investment|stock|crypto|bitcoin|ethereum|dogecoin|shiba|meme|joke|funny|hilarious|comedy|entertainment|fun|enjoy|party|celebration|birthday|holiday|vacation|travel|trip|journey|adventure|explore|discover|learn|study|education|knowledge|wisdom|experience|skill|talent|gift|present|surprise|secret|mystery|puzzle|riddle|challenge|contest|competition|tournament|championship|league|season|episode|series|show|program|channel|video|stream|live|broadcast|recording|upload|download|file|document|folder|directory|path|link|url|website|site|page|post|article|blog|news|update|announcement|notification|alert|warning|error|bug|issue|problem|solution|fix|repair|maintain|update|upgrade|improve|enhance|optimize|performance|speed|efficiency|quality|quantity|amount|number|count|total|sum|average|mean|median|mode|range|min|max|minimum|maximum|limit|boundary|edge|corner|side|top|bottom|left|right|center|middle|beginning|end|start|finish|complete|done|finished|ready|prepared|set|go|begin|start|stop|pause|resume|continue|repeat|again|once|twice|thrice|multiple|many|few|some|all|none|nothing|everything|something|anything|someone|anyone|everyone|nobody|somebody|anybody|everybody|here|there|where|when|why|how|what|who|which|whose|whom|that|this|these|those|it|its|they|them|their|theirs|we|us|our|ours|you|your|yours|he|him|his|she|her|hers|i|me|my|mine)\b/gi
        };
    }

    initializeFactPatterns() {
        return {
            // Game mechanics
            damage: /\b(\d+)\s*(damage|dmg|atk|attack|power|strength|force|might|potency|effectiveness|efficiency|output|dps|dph|per hit|per second|per minute|per hour|per day|per week|per month|per year)\b/gi,
            health: /\b(\d+)\s*(health|hp|life|vitality|endurance|durability|toughness|resilience|survivability|longevity|sustainability|stamina|energy|mana|mp|sp|spirit|focus|concentration|willpower|determination|perseverance|patience|calm|peace|tranquility|serenity|harmony|balance|equilibrium|stability|consistency|reliability|dependability|trustworthiness|credibility|authenticity|genuineness|sincerity|honesty|integrity|honor|respect|dignity|pride|confidence|self-esteem|self-worth|self-respect|self-love|self-care|self-improvement|self-development|self-growth|self-actualization|self-realization|self-discovery|self-awareness|self-consciousness|self-reflection|self-analysis|self-evaluation|self-assessment|self-criticism|self-praise|self-encouragement|self-motivation|self-inspiration|self-empowerment|self-assertion|self-expression|self-communication|self-connection|self-relationship|self-bond|self-attachment|self-devotion|self-dedication|self-commitment|self-loyalty|self-fidelity|self-faithfulness|self-consistency|self-coherence|self-unity|self-wholeness|self-completeness|self-perfection|self-excellence|self-mastery|self-control|self-discipline|self-regulation|self-management|self-governance|self-leadership|self-direction|self-guidance|self-navigation|self-orientation|self-positioning|self-placement|self-location|self-situation|self-context|self-environment|self-surroundings|self-setting|self-scene|self-stage|self-platform|self-foundation|self-base|self-ground|self-root|self-source|self-origin|self-beginning|self-start|self-initiation|self-commencement|self-launch|self-kickoff|self-takeoff|self-liftoff|self-blastoff|self-launch|self-start|self-begin|self-commence|self-initiate|self-launch|self-start|self-begin|self-commence|self-initiate)\b/gi,
            // Character stats
            characterStats: /\b(level|lvl|rank|tier|grade|class|type|category|kind|sort|variety|species|breed|race|ethnicity|nationality|citizenship|residence|domicile|home|house|apartment|room|space|place|location|position|spot|point|area|region|zone|district|neighborhood|community|society|group|team|squad|crew|gang|clan|guild|alliance|federation|union|association|organization|institution|establishment|company|corporation|business|enterprise|venture|project|initiative|program|campaign|mission|quest|task|job|work|labor|effort|endeavor|undertaking|venture|adventure|journey|trip|voyage|expedition|exploration|discovery|investigation|research|study|analysis|examination|inspection|review|assessment|evaluation|appraisal|judgment|opinion|view|perspective|standpoint|position|stance|attitude|approach|method|technique|strategy|tactic|plan|scheme|design|blueprint|template|model|pattern|example|sample|specimen|instance|case|situation|circumstance|condition|state|status|situation|position|place|location|spot|point|area|region|zone|district|neighborhood|community|society|group|team|squad|crew|gang|clan|guild|alliance|federation|union|association|organization|institution|establishment|company|corporation|business|enterprise|venture|project|initiative|program|campaign|mission|quest|task|job|work|labor|effort|endeavor|undertaking|venture|adventure|journey|trip|voyage|expedition|exploration|discovery|investigation|research|study|analysis|examination|inspection|review|assessment|evaluation|appraisal|judgment|opinion|view|perspective|standpoint|position|stance|attitude|approach|method|technique|strategy|tactic|plan|scheme|design|blueprint|template|model|pattern|example|sample|specimen|instance|case|situation|circumstance|condition|state|status)\s*(\d+)\b/gi,
            // Weapon/gear information
            weaponGear: /\b(weapon|sword|bow|staff|wand|dagger|axe|hammer|mace|club|spear|lance|pike|halberd|glaive|scythe|sickle|flail|whip|chain|rope|cord|string|thread|fiber|fabric|cloth|leather|hide|skin|fur|hair|feather|scale|plate|armor|helmet|shield|gauntlet|boot|shoe|sandal|sock|glove|mitten|ring|necklace|amulet|pendant|charm|talisman|relic|artifact|treasure|loot|reward|prize|gift|present|surprise|bonus|extra|additional|supplementary|complementary|supplementary|auxiliary|secondary|tertiary|quaternary|quinary|senary|septenary|octonary|nonary|denary|undenary|duodenary|tredenary|quattuordenary|quindenary|sexdenary|septendenary|octodenary|novemdenary|vigenary|unvigenary|duovigenary|trevigenary|quattuorvigenary|quinvigenary|sexvigenary|septenvigenary|octovigenary|novemvigenary|trigenary|untrigenary|duotrigenary|tretrigenary|quattuortrigenary|quintrigenary|sextrigenary|septentrigenary|octotrigenary|novemtrigenary|quadragenary|unquadragenary|duoquadragenary|trequadragenary|quattuorquadragenary|quinquadragenary|sexquadragenary|septenquadragenary|octoquadragenary|novemquadragenary|quinquagenary|unquinquagenary|duoquinquagenary|trequinquagenary|quattuorquinquagenary|quinquinquagenary|sexquinquagenary|septenquinquagenary|octoquinquagenary|novemquinquagenary|sexagenary|unsexagenary|duosexagenary|tresexagenary|quattuorsexagenary|quinsexagenary|sexsexagenary|septensexagenary|octosexagenary|novemsexagenary|septuagenary|unseptuagenary|duoseptuagenary|treseptuagenary|quattuorseptuagenary|quinseptuagenary|sexseptuagenary|septenseptuagenary|octoseptuagenary|novemseptuagenary|octogenary|unoctogenary|duooctogenary|treoctogenary|quattuoroctogenary|quinoctogenary|sexoctogenary|septenoctogenary|octooctogenary|novemoctogenary|nonagenary|unnonagenary|duononagenary|trenonagenary|quattuornonagenary|quinnonagenary|sexnonagenary|septennonagenary|octononagenary|novemnonagenary|centenary|uncentenary|duocentenary|trecentenary|quattuorcentenary|quincentenary|sexcentenary|septencentenary|octocentenary|novemcentenary|ducentenary|unducentenary|duoducentenary|treducentenary|quattuorducentenary|quinducentenary|sexducentenary|septenducentenary|octoducentenary|novemducentenary|trecentenary|untrecentenary|duotrecentenary|tretrecentenary|quattuortrecentenary|quintrecentenary|sextrecentenary|septentrecentenary|octotrecentenary|novemtrecentenary|quadringentenary|unquadringentenary|duoquadringentenary|trequadringentenary|quattuorquadringentenary|quinquadringentenary|sexquadringentenary|septenquadringentenary|octoquadringentenary|novemquadringentenary|quingentenary|unquingentenary|duoquingentenary|trequingentenary|quattuorquingentenary|quinquingentenary|sexquingentenary|septenquingentenary|octoquingentenary|novemquingentenary|sescentenary|unsescentenary|duosescentenary|tresescentenary|quattuorsescentenary|quinsescentenary|sexsescentenary|septensescentenary|octosescentenary|novemsescentenary|septingentenary|unseptingentenary|duoseptingentenary|treseptingentenary|quattuorseptingentenary|quinseptingentenary|sexseptingentenary|septenseptingentenary|octoseptingentenary|novemseptingentenary|octingentenary|unoctingentenary|duooctingentenary|treoctingentenary|quattuoroctingentenary|quinoctingentenary|sexoctingentenary|septenoctingentenary|octooctingentenary|novemoctingentenary|nongentenary|unnongentenary|duonongentenary|trenongentenary|quattuornongentenary|quinnongentenary|sexnongentenary|septennongentenary|octonongentenary|novemnongentenary|millenary|unmillenary|duomillenary|tremillenary|quattuormillenary|quinmillenary|sexmillenary|septenmillenary|octomillenary|novemmillenary|duomillenary|unduomillenary|duodumillenary|tredumillenary|quattuordumillenary|quindumillenary|sexdumillenary|septendumillenary|octodumillenary|novemdumillenary|tremillenary|untremillenary|duotremillenary|tretremillenary|quattuortremillenary|quintremillenary|sextremillenary|septentremillenary|octotremillenary|novemtremillenary|quadringentenary|unquadringentenary|duoquadringentenary|trequadringentenary|quattuorquadringentenary|quinquadringentenary|sexquadringentenary|septenquadringentenary|octoquadringentenary|novemquadringentenary|quingentenary|unquingentenary|duoquingentenary|trequingentenary|quattuorquingentenary|quinquingentenary|sexquingentenary|septenquingentenary|octoquingentenary|novemquingentenary|sescentenary|unsescentenary|duosescentenary|tresescentenary|quattuorsescentenary|quinsescentenary|sexsescentenary|septensescentenary|octosescentenary|novemsescentenary|septingentenary|unseptingentenary|duoseptingentenary|treseptingentenary|quattuorseptingentenary|quinseptingentenary|sexseptingentenary|septenseptingentenary|octoseptingentenary|novemseptingentenary|octingentenary|unoctingentenary|duooctingentenary|treoctingentenary|quattuoroctingentenary|quinoctingentenary|sexoctingentenary|septenoctingentenary|octooctingentenary|novemoctingentenary|nongentenary|unnongentenary|duonongentenary|trenongentenary|quattuornongentenary|quinnongentenary|sexnongentenary|septennongentenary|octonongentenary|novemnongentenary)\b/gi,
            // Rune information
            runeInfo: /\b(rune|etched|engraved|inscribed|carved|sculpted|molded|shaped|formed|created|made|built|constructed|assembled|fabricated|manufactured|produced|generated|developed|designed|planned|prepared|arranged|organized|structured|systematized|methodized|standardized|normalized|regularized|uniformized|homogenized|harmonized|balanced|equilibrated|stabilized|fixed|secured|fastened|attached|connected|linked|joined|united|combined|merged|fused|blended|mixed|integrated|incorporated|included|encompassed|embraced|contained|held|possessed|owned|belonged|pertained|related|associated|connected|linked|joined|united|combined|merged|fused|blended|mixed|integrated|incorporated|included|encompassed|embraced|contained|held|possessed|owned|belonged|pertained|related|associated)\s*(\d+)\b/gi,
            // Event information
            eventInfo: /\b(event|festival|celebration|party|gathering|meeting|conference|convention|summit|assembly|congress|council|committee|board|panel|jury|court|tribunal|arbitration|mediation|negotiation|discussion|debate|argument|dispute|conflict|controversy|disagreement|discrepancy|difference|distinction|separation|division|split|break|fracture|crack|fissure|gap|space|interval|distance|length|width|height|depth|breadth|thickness|diameter|radius|circumference|perimeter|area|surface|volume|capacity|content|substance|matter|material|stuff|thing|object|item|article|piece|part|portion|fraction|segment|section|division|subdivision|category|class|type|kind|sort|variety|species|breed|race|ethnicity|nationality|citizenship|residence|domicile|home|house|apartment|room|space|place|location|position|spot|point|area|region|zone|district|neighborhood|community|society|group|team|squad|crew|gang|clan|guild|alliance|federation|union|association|organization|institution|establishment|company|corporation|business|enterprise|venture|project|initiative|program|campaign|mission|quest|task|job|work|labor|effort|endeavor|undertaking|venture|adventure|journey|trip|voyage|expedition|exploration|discovery|investigation|research|study|analysis|examination|inspection|review|assessment|evaluation|appraisal|judgment|opinion|view|perspective|standpoint|position|stance|attitude|approach|method|technique|strategy|tactic|plan|scheme|design|blueprint|template|model|pattern|example|sample|specimen|instance|case|situation|circumstance|condition|state|status)\s*(\d+)\b/gi
        };
    }

    async cleanAllData() {
        console.log('🧹 Starting comprehensive data cleaning...');
        console.log('==========================================');
        
        const cleanedData = {
            characters: [],
            weapons: [],
            gear: [],
            runes: [],
            events: [],
            strategies: [],
            tips: [],
            mechanics: [],
            metadata: {
                cleanedAt: new Date().toISOString(),
                totalEntries: 0,
                sourceFiles: []
            }
        };

        // Process all raw data files
        const rawFiles = this.getAllRawDataFiles();
        console.log(`📁 Found ${rawFiles.length} raw data files to process`);

        for (const file of rawFiles) {
            console.log(`\n🔍 Processing: ${file}`);
            try {
                const rawData = JSON.parse(fs.readFileSync(file, 'utf8'));
                const cleaned = this.cleanFileData(rawData, file);
                
                // Merge cleaned data
                this.mergeCleanedData(cleanedData, cleaned);
                cleanedData.metadata.sourceFiles.push(file);
                
                console.log(`✅ Cleaned ${cleaned.totalEntries} entries from ${file}`);
            } catch (error) {
                console.log(`❌ Error processing ${file}: ${error.message}`);
            }
        }

        // Save cleaned data
        this.saveCleanedData(cleanedData);
        
        console.log('\n🎉 Data cleaning complete!');
        console.log(`📊 Total cleaned entries: ${cleanedData.metadata.totalEntries}`);
        console.log(`💾 Cleaned data saved to: ${this.cleanDataDir}`);
        
        return cleanedData;
    }

    getAllRawDataFiles() {
        const files = [];
        
        // Get all JSON files from raw-scraped-data directory
        const walkDir = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walkDir(fullPath);
                } else if (item.endsWith('.json')) {
                    files.push(fullPath);
                }
            }
        };
        
        walkDir(this.rawDataDir);
        return files;
    }

    cleanFileData(rawData, filename) {
        const cleaned = {
            characters: [],
            weapons: [],
            gear: [],
            runes: [],
            events: [],
            strategies: [],
            tips: [],
            mechanics: [],
            totalEntries: 0
        };

        // Extract content based on file type
        let content = '';
        if (rawData.categories) {
            // Discord theorycrafting data
            for (const [category, data] of Object.entries(rawData.categories)) {
                if (data.posts) {
                    for (const post of data.posts) {
                        content += post.content + '\n\n';
                    }
                }
            }
        } else if (Array.isArray(rawData)) {
            // Array of posts/channels
            for (const item of rawData) {
                if (item.content) {
                    content += item.content + '\n\n';
                }
            }
        } else if (rawData.content) {
            // Single content item
            content = rawData.content;
        }

        // Clean the content
        const cleanedContent = this.cleanText(content);
        
        // Extract facts from cleaned content
        this.extractFacts(cleanedContent, cleaned, filename);

        return cleaned;
    }

    cleanText(text) {
        if (!text) return '';

        let cleaned = text;

        // Remove noise patterns
        for (const [patternName, pattern] of Object.entries(this.noisePatterns)) {
            cleaned = cleaned.replace(pattern, '');
        }

        // Remove extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        // Remove empty lines
        cleaned = cleaned.replace(/\n\s*\n/g, '\n');

        return cleaned;
    }

    extractFacts(content, cleaned, filename) {
        // Extract character information
        const characterMatches = content.match(this.factPatterns.characterStats);
        if (characterMatches) {
            for (const match of characterMatches) {
                cleaned.characters.push({
                    fact: match,
                    source: filename,
                    confidence: 0.8
                });
            }
        }

        // Extract weapon/gear information
        const weaponMatches = content.match(this.factPatterns.weaponGear);
        if (weaponMatches) {
            for (const match of weaponMatches) {
                cleaned.weapons.push({
                    fact: match,
                    source: filename,
                    confidence: 0.8
                });
            }
        }

        // Extract rune information
        const runeMatches = content.match(this.factPatterns.runeInfo);
        if (runeMatches) {
            for (const match of runeMatches) {
                cleaned.runes.push({
                    fact: match,
                    source: filename,
                    confidence: 0.8
                });
            }
        }

        // Extract event information
        const eventMatches = content.match(this.factPatterns.eventInfo);
        if (eventMatches) {
            for (const match of eventMatches) {
                cleaned.events.push({
                    fact: match,
                    source: filename,
                    confidence: 0.8
                });
            }
        }

        // Extract damage/health stats
        const damageMatches = content.match(this.factPatterns.damage);
        if (damageMatches) {
            for (const match of damageMatches) {
                cleaned.mechanics.push({
                    fact: match,
                    source: filename,
                    confidence: 0.9
                });
            }
        }

        // Count total entries
        cleaned.totalEntries = cleaned.characters.length + cleaned.weapons.length + 
                             cleaned.gear.length + cleaned.runes.length + 
                             cleaned.events.length + cleaned.strategies.length + 
                             cleaned.tips.length + cleaned.mechanics.length;
    }

    mergeCleanedData(target, source) {
        target.characters.push(...source.characters);
        target.weapons.push(...source.weapons);
        target.gear.push(...source.gear);
        target.runes.push(...source.runes);
        target.events.push(...source.events);
        target.strategies.push(...source.strategies);
        target.tips.push(...source.tips);
        target.mechanics.push(...source.mechanics);
        target.metadata.totalEntries += source.totalEntries;
    }

    saveCleanedData(cleanedData) {
        // Save main cleaned data file
        const mainFile = path.join(this.cleanDataDir, 'comprehensive-cleaned-data.json');
        fs.writeFileSync(mainFile, JSON.stringify(cleanedData, null, 2));

        // Save individual category files
        for (const [category, data] of Object.entries(cleanedData)) {
            if (Array.isArray(data)) {
                const categoryFile = path.join(this.cleanDataDir, `${category}.json`);
                fs.writeFileSync(categoryFile, JSON.stringify(data, null, 2));
            }
        }
    }
}

// Run the cleaner
if (require.main === module) {
    const cleaner = new ComprehensiveDataCleaner();
    cleaner.cleanAllData()
        .then(() => {
            console.log('✅ Data cleaning completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Data cleaning failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveDataCleaner;
