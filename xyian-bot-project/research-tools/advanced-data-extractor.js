#!/usr/bin/env node

// Advanced Data Extractor
// Extracts and categorizes all valuable game data from scraped content
// Focuses on factual information: upgrades, guides, boss lists, events, runes, gear, etc.

const fs = require('fs');
const path = require('path');

class AdvancedDataExtractor {
    constructor() {
        this.rawDataDir = __dirname; // Look in current directory for JSON files
        this.cleanDataDir = path.join(__dirname, '..', 'data', 'comprehensive-knowledge-base');
        this.outdatedDataDir = path.join(__dirname, '..', 'data', 'outdated-data');
        
        // Create directories
        [this.cleanDataDir, this.outdatedDataDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        this.extractionPatterns = this.initializeExtractionPatterns();
        this.categories = this.initializeCategories();
    }

    initializeExtractionPatterns() {
        return {
            // Upgrade Requirements & Resources
            upgradeRequirements: {
                patterns: [
                    /upgrade.*?(?:requires?|needs?|costs?)\s*:?\s*([^.!?]+)/gi,
                    /(?:level|tier|rank)\s*(\d+).*?(?:requires?|needs?|costs?)\s*:?\s*([^.!?]+)/gi,
                    /(?:gold|coins?|gems?|materials?|resources?)\s*:?\s*(\d+[,\d]*)/gi,
                    /(?:shards?|fragments?|pieces?)\s*:?\s*(\d+[,\d]*)/gi
                ],
                category: 'upgrade_requirements'
            },

            // Dragoon Guides & Builds
            dragoonGuides: {
                patterns: [
                    /dragoon.*?(?:build|guide|strategy|setup|loadout|gear|weapon|rune)/gi,
                    /(?:dragoon|dragon).*?(?:set|armor|helmet|boots|amulet|ring)/gi,
                    /dragoon.*?(?:crossbow|weapon|damage|crit|critical)/gi,
                    /(?:pvp|arena).*?dragoon/gi
                ],
                category: 'dragoon_guides'
            },

            // Boss Lists & Encounters
            bossLists: {
                patterns: [
                    /boss.*?(?:list|guide|strategy|encounter|fight|battle)/gi,
                    /(?:chapter|stage|level).*?(?:boss|final|boss fight)/gi,
                    /(?:shackled jungle|boss).*?(?:guide|strategy|tips)/gi,
                    /boss.*?(?:health|hp|damage|attacks?|abilities?|moves?)/gi
                ],
                category: 'boss_guides'
            },

            // Events & Modes
            eventsModes: {
                patterns: [
                    /(?:shackled jungle|event|mode|challenge)/gi,
                    /(?:dice event|fishing event|atreus|thor|treasure wheel)/gi,
                    /(?:world tree|pulse|umbral tempest)/gi,
                    /event.*?(?:schedule|time|duration|rewards?)/gi
                ],
                category: 'events_modes'
            },

            // Rune Bonuses & Mechanics
            runeBonuses: {
                patterns: [
                    /rune.*?(?:bonus|effect|benefit|stat|damage|health|crit)/gi,
                    /(?:etched|engraved).*?rune/gi,
                    /rune.*?(?:level|tier|upgrade|enhancement)/gi,
                    /(?:rune|rune set).*?(?:resonance|synergy|combo)/gi
                ],
                category: 'rune_mechanics'
            },

            // Gear & Equipment Details
            gearDetails: {
                patterns: [
                    /(?:weapon|armor|helmet|boots|amulet|ring).*?(?:stats?|damage|health|crit)/gi,
                    /(?:oracle|griffin|dragoon).*?(?:set|gear|equipment)/gi,
                    /(?:staff|crossbow|claws).*?(?:damage|range|speed|crit)/gi,
                    /gear.*?(?:upgrade|enhancement|evolution|tier)/gi
                ],
                category: 'gear_details'
            },

            // Talent Cards & Abilities
            talentCards: {
                patterns: [
                    /(?:talent|card|ability|skill).*?(?:effect|bonus|damage|health)/gi,
                    /(?:passive|active).*?(?:talent|ability|skill)/gi,
                    /talent.*?(?:level|tier|upgrade|enhancement)/gi,
                    /(?:card|talent).*?(?:rarity|tier|grade)/gi
                ],
                category: 'talent_cards'
            },

            // Damage Calculations & Formulas
            damageCalculations: {
                patterns: [
                    /damage.*?(?:formula|calculation|formula|math)/gi,
                    /(?:dps|dph|damage per second|damage per hit)/gi,
                    /(?:crit|critical).*?(?:damage|chance|multiplier)/gi,
                    /(?:front arrow|side arrow|back arrow).*?(?:damage|calculation)/gi
                ],
                category: 'damage_calculations'
            },

            // Character Stats & Abilities
            characterStats: {
                patterns: [
                    /(?:thor|otta|helix|dracoola|rolla|seraph|loki).*?(?:stats?|abilities?|skills?)/gi,
                    /character.*?(?:level|tier|rank|grade)/gi,
                    /(?:resonance|3-star|6-star).*?(?:character|hero)/gi,
                    /character.*?(?:damage|health|crit|speed)/gi
                ],
                category: 'character_stats'
            },

            // PvP & Arena Strategies
            pvpStrategies: {
                patterns: [
                    /(?:pvp|arena|peak arena|supreme arena).*?(?:strategy|guide|tips)/gi,
                    /(?:3v3|team).*?(?:pvp|arena|battle)/gi,
                    /arena.*?(?:build|loadout|gear|weapon)/gi,
                    /(?:pvp|arena).*?(?:meta|tier list|ranking)/gi
                ],
                category: 'pvp_strategies'
            },

            // PvE Strategies & Chapters
            pveStrategies: {
                patterns: [
                    /(?:pve|chapter|stage|level).*?(?:strategy|guide|tips)/gi,
                    /chapter.*?(?:\d+).*?(?:guide|strategy|boss)/gi,
                    /(?:efficient|best).*?(?:chapter|stage|level)/gi,
                    /(?:grind|farm).*?(?:chapter|stage|level)/gi
                ],
                category: 'pve_strategies'
            }
        };
    }

    initializeCategories() {
        return {
            upgrade_requirements: {
                name: 'Upgrade Requirements & Resources',
                description: 'Resource costs, material requirements, upgrade paths',
                priority: 'high',
                data: []
            },
            dragoon_guides: {
                name: 'Dragoon Build Guides',
                description: 'Dragoon set builds, strategies, gear recommendations',
                priority: 'high',
                data: []
            },
            boss_guides: {
                name: 'Boss Guides & Encounters',
                description: 'Boss strategies, attack patterns, encounter guides',
                priority: 'high',
                data: []
            },
            events_modes: {
                name: 'Events & Game Modes',
                description: 'Shackled Jungle, events, special modes, schedules',
                priority: 'high',
                data: []
            },
            rune_mechanics: {
                name: 'Rune Mechanics & Bonuses',
                description: 'Rune effects, bonuses, resonance, combinations',
                priority: 'high',
                data: []
            },
            gear_details: {
                name: 'Gear & Equipment Details',
                description: 'Weapon stats, armor sets, equipment bonuses',
                priority: 'high',
                data: []
            },
            talent_cards: {
                name: 'Talent Cards & Abilities',
                description: 'Talent card effects, abilities, skill descriptions',
                priority: 'medium',
                data: []
            },
            damage_calculations: {
                name: 'Damage Calculations & Formulas',
                description: 'Damage formulas, DPS calculations, crit mechanics',
                priority: 'high',
                data: []
            },
            character_stats: {
                name: 'Character Stats & Abilities',
                description: 'Character abilities, stats, resonance effects',
                priority: 'high',
                data: []
            },
            pvp_strategies: {
                name: 'PvP & Arena Strategies',
                description: 'Arena builds, PvP tactics, team compositions',
                priority: 'high',
                data: []
            },
            pve_strategies: {
                name: 'PvE Strategies & Chapters',
                description: 'Chapter guides, PvE builds, farming strategies',
                priority: 'medium',
                data: []
            }
        };
    }

    async extractAllData() {
        console.log('🔍 Starting Advanced Data Extraction...');
        console.log('=====================================');
        console.log('🎯 Focus: Extract valuable game data while filtering noise');
        console.log('📊 Categories: Upgrades, Dragoon guides, Boss lists, Events, Runes, Gear, etc.');
        console.log('');

        // Get all scraped data files
        const rawFiles = this.getAllRawDataFiles();
        console.log(`📁 Found ${rawFiles.length} raw data files to process`);

        let totalExtracted = 0;
        let processedFiles = 0;

        for (const file of rawFiles) {
            console.log(`\n🔍 Processing: ${path.basename(file)}`);
            try {
                const rawData = JSON.parse(fs.readFileSync(file, 'utf8'));
                const extracted = this.extractFromFile(rawData, file);
                
                // Merge extracted data into categories
                this.mergeExtractedData(extracted);
                totalExtracted += extracted.totalExtracted;
                processedFiles++;
                
                console.log(`✅ Extracted ${extracted.totalExtracted} valuable entries`);
            } catch (error) {
                console.log(`❌ Error processing ${file}: ${error.message}`);
            }
        }

        // Clean and deduplicate data
        console.log('\n🧹 Cleaning and deduplicating data...');
        this.cleanAndDeduplicateData();

        // Save organized data
        console.log('\n💾 Saving organized knowledge base...');
        this.saveOrganizedData();

        console.log('\n🎉 Advanced Data Extraction Complete!');
        console.log(`📊 Processed ${processedFiles} files`);
        console.log(`📊 Total valuable entries extracted: ${totalExtracted}`);
        console.log(`📁 Organized data saved to: ${this.cleanDataDir}`);
        
        return this.categories;
    }

    getAllRawDataFiles() {
        const files = [];
        const walkDir = (dir) => {
            if (!fs.existsSync(dir)) return;
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

    extractFromFile(rawData, filename) {
        const extracted = {
            totalExtracted: 0,
            categories: {}
        };

        // Initialize categories
        for (const category of Object.keys(this.categories)) {
            extracted.categories[category] = [];
        }

        // Extract content from raw data
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
            for (const item of rawData) {
                if (item.content) {
                    content += item.content + '\n\n';
                }
            }
        } else if (rawData.content) {
            content = rawData.content;
        }

        // Clean content (remove noise)
        const cleanedContent = this.cleanContent(content);

        // Extract data using patterns
        for (const [patternName, patternData] of Object.entries(this.extractionPatterns)) {
            const matches = this.extractWithPatterns(cleanedContent, patternData.patterns);
            if (matches.length > 0) {
                extracted.categories[patternData.category] = matches.map(match => ({
                    content: match,
                    source: path.basename(filename),
                    category: patternData.category,
                    confidence: this.calculateConfidence(match),
                    extractedAt: new Date().toISOString()
                }));
                extracted.totalExtracted += matches.length;
            }
        }

        return extracted;
    }

    cleanContent(text) {
        if (!text) return '';

        let cleaned = text;

        // Remove Discord noise
        cleaned = cleaned.replace(/@\w+|<\@\d+>/g, ''); // Usernames
        cleaned = cleaned.replace(/\[\d{2}:\d{2}\]/g, ''); // Timestamps
        cleaned = cleaned.replace(/<:\w+:\d+>/g, ''); // Custom emojis
        cleaned = cleaned.replace(/👍|👎|😂|😭|🔥|💯|🎉|🤔|😱|😤|😡|😢|😊|😎|🤯|💀|👀|🙄|😅|😆|😇|😈|👻|🤖|👽|👾|🤡|💩|🎭|🎨|🎪|🎯|🎲|🎳|🎸|🎺|🎻|🎼|🎵|🎶|🎤|🎧|🎬/g, ''); // Emojis
        cleaned = cleaned.replace(/\b(lol|haha|lmao|rofl|wtf|omg|fml|smh|tbh|imo|imho|nvm|btw|fyi|idk|idc|irl|afk|brb|gtg|ttyl|cya|gg|gl|hf|wp|ez|op|nerf|buff|meta|noob|pro|god|legend|king|queen|beast|monster|savage|fire|lit|based|cringe|sus|cap|facts|fax|periodt|slay|bet|fr|ngl|lowkey|highkey)\b/gi, ''); // Chat noise
        cleaned = cleaned.replace(/\*\*|\*|__|_|~~|`|```|> |>|>>>/g, ''); // Discord formatting
        cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, ''); // URLs
        cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Extra whitespace

        return cleaned;
    }

    extractWithPatterns(content, patterns) {
        const matches = [];
        for (const pattern of patterns) {
            const found = content.match(pattern);
            if (found) {
                matches.push(...found);
            }
        }
        return [...new Set(matches)]; // Remove duplicates
    }

    calculateConfidence(content) {
        let confidence = 0.5; // Base confidence

        // Increase confidence for specific indicators
        if (/\d+/.test(content)) confidence += 0.1; // Contains numbers
        if (/(?:damage|health|crit|level|tier|rank)/i.test(content)) confidence += 0.1; // Game terms
        if (/(?:requires?|needs?|costs?|gives?|provides?)/i.test(content)) confidence += 0.1; // Action words
        if (content.length > 50) confidence += 0.1; // Longer content
        if (content.length > 100) confidence += 0.1; // Much longer content

        return Math.min(confidence, 1.0);
    }

    mergeExtractedData(extracted) {
        for (const [category, data] of Object.entries(extracted.categories)) {
            if (this.categories[category]) {
                this.categories[category].data.push(...data);
            }
        }
    }

    cleanAndDeduplicateData() {
        for (const [categoryName, category] of Object.entries(this.categories)) {
            // Remove duplicates based on content similarity
            const unique = [];
            const seen = new Set();

            for (const item of category.data) {
                const key = item.content.toLowerCase().trim();
                if (!seen.has(key) && item.confidence > 0.6) {
                    seen.add(key);
                    unique.push(item);
                }
            }

            // Sort by confidence
            unique.sort((a, b) => b.confidence - a.confidence);

            this.categories[categoryName].data = unique;
            console.log(`🧹 ${categoryName}: ${category.data.length} → ${unique.length} entries`);
        }
    }

    saveOrganizedData() {
        // Save main knowledge base
        const mainFile = path.join(this.cleanDataDir, 'comprehensive-knowledge-base.json');
        fs.writeFileSync(mainFile, JSON.stringify(this.categories, null, 2));

        // Save individual category files
        for (const [categoryName, category] of Object.entries(this.categories)) {
            const categoryFile = path.join(this.cleanDataDir, `${categoryName}.json`);
            fs.writeFileSync(categoryFile, JSON.stringify(category, null, 2));
        }

        // Create summary report
        const summary = {
            extractedAt: new Date().toISOString(),
            totalCategories: Object.keys(this.categories).length,
            totalEntries: Object.values(this.categories).reduce((sum, cat) => sum + cat.data.length, 0),
            categories: Object.entries(this.categories).map(([name, cat]) => ({
                name,
                count: cat.data.length,
                priority: cat.priority
            }))
        };

        const summaryFile = path.join(this.cleanDataDir, 'extraction-summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

        console.log(`📊 Summary saved to: ${summaryFile}`);
    }
}

// Run the extractor
if (require.main === module) {
    const extractor = new AdvancedDataExtractor();
    extractor.extractAllData()
        .then(() => {
            console.log('✅ Advanced data extraction completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Advanced data extraction failed:', error);
            process.exit(1);
        });
}

module.exports = AdvancedDataExtractor;
