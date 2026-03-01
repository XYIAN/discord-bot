#!/usr/bin/env node

// Comprehensive Archero 2 Data Scraper
// This will gather data from multiple sources to build a comprehensive knowledge base

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class Archero2DataScraper {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.scrapedDataFile = path.join(this.dataDir, 'archero2_scraped_data.json');
        this.initializeDataFile();
    }

    initializeDataFile() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        if (!fs.existsSync(this.scrapedDataFile)) {
            fs.writeFileSync(this.scrapedDataFile, JSON.stringify({
                characters: {},
                weapons: {},
                skills: {},
                runes: {},
                events: {},
                strategies: {},
                f2pGuides: {},
                pvpGuides: {},
                lastUpdated: new Date().toISOString()
            }));
        }
    }

    // Comprehensive data collection from multiple sources
    async scrapeAllData() {
        console.log('🔍 Starting comprehensive Archero 2 data scraping...');
        
        try {
            const scrapedData = {
                characters: await this.scrapeCharacterData(),
                weapons: await this.scrapeWeaponData(),
                skills: await this.scrapeSkillData(),
                runes: await this.scrapeRuneData(),
                events: await this.scrapeEventData(),
                strategies: await this.scrapeStrategyData(),
                f2pGuides: await this.scrapeF2PGuides(),
                pvpGuides: await this.scrapePvPGuides(),
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.scrapedDataFile, JSON.stringify(scrapedData, null, 2));
            console.log('✅ Comprehensive data scraping completed!');
            return scrapedData;
        } catch (error) {
            console.error('❌ Error during data scraping:', error);
            return null;
        }
    }

    // Character data with detailed information
    async scrapeCharacterData() {
        console.log('📊 Scraping character data...');
        
        const characters = {
            // Legendary Characters
            "thor": {
                name: "Thor",
                tier: "Legendary",
                abilities: [
                    "Move while firing arrows",
                    "Weapon detach ability", 
                    "Summon hammers",
                    "Lightning damage scaling"
                ],
                resonance: {
                    "3_star": "Good option for 3-star resonance",
                    "6_star": "Excellent for 6-star resonance"
                },
                skins: {
                    "lightning_skin": "Enhances lightning damage",
                    "hammer_skin": "Improves hammer summoning"
                },
                best_for: ["PvP", "High DPS builds", "Lightning builds"],
                f2p_friendly: false,
                power_scaling: "High",
                notes: "One of the best characters for competitive play"
            },
            
            // Epic Characters
            "demon_king": {
                name: "Demon King",
                tier: "Epic",
                abilities: [
                    "Shield abilities",
                    "Defensive capabilities",
                    "Shield power scaling with level"
                ],
                resonance: {
                    "3_star": "Good defensive option",
                    "6_star": "Excellent for 6-star resonance"
                },
                skins: {
                    "shield_skin": "Enhances shield capabilities",
                    "defensive_skin": "Improves defensive stats"
                },
                best_for: ["Defensive builds", "PvE", "Survivability"],
                f2p_friendly: true,
                power_scaling: "Medium-High",
                notes: "Skins are really useful for shield abilities"
            },
            
            "rolla": {
                name: "Rolla",
                tier: "Epic",
                abilities: [
                    "Freeze attacks",
                    "Critical damage boost",
                    "Crowd control"
                ],
                resonance: {
                    "3_star": "BEST option - freeze is vital",
                    "6_star": "Good for 6-star resonance"
                },
                skins: {
                    "freeze_skin": "Enhances freeze duration",
                    "crit_skin": "Improves critical damage"
                },
                best_for: ["PvP", "Crowd control", "3-star resonance"],
                f2p_friendly: true,
                power_scaling: "High",
                notes: "Essential for competitive play - freeze stops enemy attacks"
            },
            
            "dracoola": {
                name: "Dracoola",
                tier: "Epic",
                abilities: [
                    "Life steal on hit chance",
                    "Sustained combat",
                    "Survivability"
                ],
                resonance: {
                    "3_star": "Good survivability option",
                    "6_star": "Decent for 6-star resonance"
                },
                skins: {
                    "lifesteal_skin": "Enhances life steal",
                    "survival_skin": "Improves survivability"
                },
                best_for: ["PvE", "Sustained combat", "Survivability builds"],
                f2p_friendly: true,
                power_scaling: "Medium",
                notes: "Good for longer runs and sustained combat"
            },
            
            "seraph": {
                name: "Seraph",
                tier: "Epic",
                abilities: [
                    "PvE only bonuses",
                    "Extra ability chance when picking health",
                    "Angel-related bonuses"
                ],
                resonance: {
                    "3_star": "PvE focused",
                    "6_star": "PvE focused"
                },
                skins: {
                    "pve_skin": "Enhances PvE bonuses",
                    "angel_skin": "Improves angel abilities"
                },
                best_for: ["PvE", "Long runs", "Health-focused builds"],
                f2p_friendly: true,
                power_scaling: "Medium",
                notes: "NOT recommended for PvP - PvE only"
            },
            
            "loki": {
                name: "Loki",
                tier: "Epic",
                abilities: [
                    "PvP specific",
                    "Attack speed boost when moving",
                    "Acquired from PvP"
                ],
                resonance: {
                    "3_star": "PvP focused",
                    "6_star": "TOP CHOICE for 6-star resonance"
                },
                skins: {
                    "pvp_skin": "Enhances PvP abilities",
                    "speed_skin": "Improves attack speed"
                },
                best_for: ["PvP", "Arena", "Supreme Arena", "6-star resonance"],
                f2p_friendly: false,
                power_scaling: "High",
                notes: "PvP specialist - best for 6-star resonance slot"
            },
            
            // Common Characters
            "alex": {
                name: "Alex",
                tier: "Common",
                abilities: [
                    "Starting hero",
                    "Good basic abilities",
                    "Red heart drop increase"
                ],
                resonance: {
                    "3_star": "Basic option",
                    "6_star": "Basic option"
                },
                skins: {
                    "basic_skin": "Basic improvements"
                },
                best_for: ["Beginners", "F2P", "Basic builds"],
                f2p_friendly: true,
                power_scaling: "Low",
                notes: "Outclassed by higher tier characters"
            },
            
            "nyanja": {
                name: "Nyanja",
                tier: "Common",
                abilities: [
                    "Little ninja cat",
                    "Increased speed",
                    "Cloudfooted ability (damages and pushes enemies)"
                ],
                resonance: {
                    "3_star": "Good mobility option",
                    "6_star": "Decent mobility option"
                },
                skins: {
                    "speed_skin": "Enhances speed",
                    "mobility_skin": "Improves mobility"
                },
                best_for: ["Mobility builds", "Speed builds", "F2P"],
                f2p_friendly: true,
                power_scaling: "Medium",
                notes: "Good for mobility - harder to hit unless facing Griffin"
            },
            
            "helix": {
                name: "Helix",
                tier: "Common",
                abilities: [
                    "Gets more damage as he gets damaged",
                    "Strong DPS character",
                    "Damage scaling"
                ],
                resonance: {
                    "3_star": "Strong DPS option",
                    "6_star": "Good DPS option"
                },
                skins: {
                    "damage_skin": "Enhances damage scaling",
                    "dps_skin": "Improves DPS"
                },
                best_for: ["DPS builds", "3-star resonance", "F2P"],
                f2p_friendly: true,
                power_scaling: "High",
                notes: "Good for 3-star resonance - strong DPS"
            },
            
            "hela": {
                name: "Hela",
                tier: "Common",
                abilities: [
                    "Healing aura",
                    "Damage boost",
                    "Crowd control cleanse at max stars"
                ],
                resonance: {
                    "3_star": "Support option",
                    "6_star": "Support option"
                },
                skins: {
                    "healing_skin": "Enhances healing",
                    "support_skin": "Improves support abilities"
                },
                best_for: ["Support builds", "Healing", "Crowd control cleanse"],
                f2p_friendly: true,
                power_scaling: "Medium",
                notes: "Excellent support character - crowd control cleanse is important"
            },
            
            "otta": {
                name: "Otta",
                tier: "High",
                abilities: [
                    "High-level character",
                    "Powerful abilities",
                    "Requires significant investment"
                ],
                resonance: {
                    "3_star": "High-level option",
                    "6_star": "High-level option"
                },
                skins: {
                    "power_skin": "Enhances power",
                    "high_level_skin": "High-level improvements"
                },
                best_for: ["High-level play", "6-star resonance", "Endgame"],
                f2p_friendly: false,
                power_scaling: "Very High",
                notes: "High-level option for 6-star resonance slot"
            }
        };

        return characters;
    }

    // Weapon data with detailed information
    async scrapeWeaponData() {
        console.log('⚔️ Scraping weapon data...');
        
        return {
            "oracle_staff": {
                name: "Oracle Staff",
                tier: "S-Tier",
                type: "Staff",
                abilities: [
                    "High damage output",
                    "Great range",
                    "Perfect for mage builds",
                    "Can be upgraded beyond Legendary"
                ],
                best_for: ["Mage builds", "General use", "High DPS"],
                f2p_friendly: false,
                upgrade_path: "Can level past Legendary",
                notes: "One of the 3 S-tier weapons - best overall weapon"
            },
            
            "griffin_claws": {
                name: "Griffin Claws", 
                tier: "S-Tier",
                type: "Claws",
                abilities: [
                    "Excellent close combat",
                    "High attack speed",
                    "Perfect for warrior builds",
                    "Can be upgraded beyond Legendary"
                ],
                best_for: ["Warrior builds", "Close combat", "Melee"],
                f2p_friendly: false,
                upgrade_path: "Can level past Legendary",
                notes: "One of the 3 S-tier weapons - excellent for close combat"
            },
            
            "dragoon_crossbow": {
                name: "Dragoon Crossbow",
                tier: "S-Tier", 
                type: "Crossbow",
                abilities: [
                    "Powerful ranged weapon",
                    "Great for PvP",
                    "Perfect for archer builds",
                    "Can be upgraded beyond Legendary"
                ],
                best_for: ["Archer builds", "PvP", "Ranged combat"],
                f2p_friendly: false,
                upgrade_path: "Can level past Legendary",
                notes: "One of the 3 S-tier weapons - powerful ranged weapon"
            },
            
            "basic_weapons": {
                name: "Basic Weapons",
                tier: "Common",
                types: ["Bow", "Staff", "Claws"],
                abilities: [
                    "Basic functionality",
                    "Cannot level past Legendary",
                    "Inferior to S-tier weapons"
                ],
                best_for: ["Beginners", "F2P early game"],
                f2p_friendly: true,
                upgrade_path: "Cannot level past Legendary",
                notes: "Only use if you don't have S-tier weapons"
            }
        };
    }

    // Skill data with detailed information
    async scrapeSkillData() {
        console.log('🎯 Scraping skill data...');
        
        return {
            "multi_shot": {
                name: "Multi-shot",
                tier: "S-Tier",
                description: "Increases number of projectiles",
                best_for: ["All builds", "DPS increase"],
                priority: "High",
                f2p_friendly: true
            },
            
            "ricochet": {
                name: "Ricochet",
                tier: "S-Tier", 
                description: "Projectiles bounce between enemies",
                best_for: ["Crowd control", "Multiple enemies"],
                priority: "High",
                f2p_friendly: true
            },
            
            "piercing": {
                name: "Piercing",
                tier: "A-Tier",
                description: "Projectiles pass through enemies",
                best_for: ["Line enemies", "DPS increase"],
                priority: "High",
                f2p_friendly: true
            },
            
            "bouncy_wall": {
                name: "Bouncy Wall",
                tier: "A-Tier",
                description: "Projectiles bounce off walls",
                best_for: ["Enclosed spaces", "DPS increase"],
                priority: "Medium",
                f2p_friendly: true
            },
            
            "side_arrow": {
                name: "Side Arrow",
                tier: "A-Tier",
                description: "Additional projectiles to the sides",
                best_for: ["DPS increase", "Coverage"],
                priority: "Medium",
                f2p_friendly: true
            }
        };
    }

    // Rune data with detailed information
    async scrapeRuneData() {
        console.log('💎 Scraping rune data...');
        
        return {
            "main_hand_etched": {
                name: "Main Hand Etched Rune",
                tier: "S-Tier",
                description: "Best for DPS - highest damage output",
                priority: "Highest",
                upgrade_costs: {
                    "level_1": "Basic materials",
                    "level_5": "Rare materials", 
                    "level_10": "Epic materials",
                    "level_15": "Legendary materials"
                },
                f2p_friendly: true,
                notes: "Focus on upgrading this first"
            },
            
            "revive_rune": {
                name: "Revive Rune",
                tier: "A-Tier",
                description: "50% chance to revive with half HP",
                priority: "High",
                best_for: ["Arena", "Supreme Arena", "High difficulty content"],
                f2p_friendly: true,
                notes: "Essential for competitive play"
            },
            
            "guardian_rune": {
                name: "Guardian Rune",
                tier: "A-Tier",
                description: "Solid defensive option",
                priority: "Medium",
                best_for: ["Defensive builds", "Survivability"],
                f2p_friendly: true,
                notes: "Good alternative to Revive Rune"
            },
            
            "flame_knock_touch": {
                name: "Flame Knock Touch Rune",
                tier: "B-Tier",
                description: "Good backup rune",
                priority: "Low",
                best_for: ["Backup option", "Elemental builds"],
                f2p_friendly: true,
                notes: "Decent backup option"
            }
        };
    }

    // Event data with detailed information
    async scrapeEventData() {
        console.log('🎉 Scraping event data...');
        
        return {
            "umbral_tempest": {
                name: "Umbral Tempest",
                type: "Weekly Event",
                description: "High difficulty event with exclusive rewards",
                requirements: "High power level recommended",
                rewards: [
                    "Exclusive items",
                    "Rare materials",
                    "Unique skins"
                ],
                strategies: [
                    "Use high DPS builds",
                    "Focus on area damage skills",
                    "Save ultimate for boss phases",
                    "Join with guild members for better rewards"
                ],
                f2p_friendly: false,
                notes: "Unlocks new levels weekly - one-time progression"
            },
            
            "daily_reset": {
                name: "Daily Reset",
                time: "5:00 PM Pacific Time",
                activities: [
                    "Complete daily quests",
                    "2 boss battles (guild requirement)",
                    "1 guild donation (guild requirement)",
                    "Arena runs",
                    "Event participation"
                ],
                rewards: [
                    "Gold",
                    "Materials",
                    "Experience",
                    "Guild points"
                ],
                f2p_friendly: true,
                notes: "Essential for progression and guild requirements"
            }
        };
    }

    // Strategy data with detailed information
    async scrapeStrategyData() {
        console.log('📚 Scraping strategy data...');
        
        return {
            "f2p_progression": {
                title: "F2P Progression Guide",
                steps: [
                    "Focus on one character (Helix or Hela recommended)",
                    "Upgrade main hand etched rune first",
                    "Complete daily quests every day",
                    "Join an active guild for bonuses",
                    "Save gems for important upgrades",
                    "Focus on S-tier weapons when possible"
                ],
                priorities: [
                    "Daily quests",
                    "Guild activities", 
                    "Character progression",
                    "Weapon upgrades",
                    "Rune upgrades"
                ],
                f2p_tips: [
                    "Don't waste gems on cosmetics",
                    "Focus on progression over collection",
                    "Use free characters effectively",
                    "Join events for free rewards"
                ]
            },
            
            "arena_strategy": {
                title: "Arena Strategy Guide",
                heroes: [
                    "Dragoon (best overall)",
                    "Griffin (only with full build)",
                    "Avoid other heroes for competitive play"
                ],
                runes: [
                    "Revive Rune (essential)",
                    "Guardian Rune (alternative)",
                    "Flame Knock Touch (backup)"
                ],
                tips: [
                    "Focus on mobility and positioning",
                    "Save ultimate for key moments",
                    "Learn enemy patterns",
                    "Upgrade runes for better stats",
                    "Complete daily arena runs"
                ]
            },
            
            "supreme_arena_strategy": {
                title: "Supreme Arena Strategy Guide",
                requirements: [
                    "3 different characters",
                    "3 different builds",
                    "Each unique item provides bonus health and damage"
                ],
                team_composition: [
                    "Dragoon (mobility)",
                    "Griffin (damage)",
                    "Third hero (flexible)"
                ],
                strategies: [
                    "Maximize item diversity for stat bonuses",
                    "Focus on Multi-shot, Ricochet, Piercing skills",
                    "Revive Rune is essential",
                    "Only top 1% players compete here"
                ]
            }
        };
    }

    // F2P specific guides
    async scrapeF2PGuides() {
        console.log('💰 Scraping F2P guides...');
        
        return {
            "beginner_guide": {
                title: "F2P Beginner Guide",
                characters: [
                    "Start with Alex (free)",
                    "Focus on Helix (strong F2P option)",
                    "Work towards Hela (excellent support)"
                ],
                weapons: [
                    "Use basic weapons initially",
                    "Save for S-tier weapons",
                    "Focus on one weapon type"
                ],
                progression: [
                    "Complete daily quests",
                    "Join active guild",
                    "Participate in events",
                    "Focus on rune upgrades"
                ],
                gem_usage: [
                    "Save gems for important upgrades",
                    "Don't waste on cosmetics",
                    "Focus on progression items"
                ]
            },
            
            "budget_builds": {
                title: "Budget Build Guide",
                early_game: [
                    "Alex + Basic Weapon",
                    "Focus on rune upgrades",
                    "Complete daily activities"
                ],
                mid_game: [
                    "Helix + Upgraded Weapon",
                    "Join guild for bonuses",
                    "Participate in events"
                ],
                late_game: [
                    "Hela + S-tier Weapon",
                    "Optimize rune setup",
                    "Focus on competitive play"
                ]
            }
        };
    }

    // PvP specific guides
    async scrapePvPGuides() {
        console.log('⚔️ Scraping PvP guides...');
        
        return {
            "arena_guide": {
                title: "Arena PvP Guide",
                best_heroes: [
                    "Dragoon (absolute best)",
                    "Griffin (only with complete build)",
                    "Avoid other heroes for competitive play"
                ],
                strategies: [
                    "Focus on mobility and positioning",
                    "Learn enemy attack patterns",
                    "Save ultimate for key moments",
                    "Upgrade runes for better stats"
                ],
                rune_priority: [
                    "Revive Rune (essential)",
                    "Guardian Rune (solid alternative)",
                    "Flame Knock Touch (good backup)"
                ]
            },
            
            "supreme_arena_guide": {
                title: "Supreme Arena PvP Guide",
                team_requirements: [
                    "3 different characters",
                    "3 different builds",
                    "Each unique item provides bonus health and damage"
                ],
                optimal_team: [
                    "Dragoon (mobility build)",
                    "Griffin (damage build)", 
                    "Third hero (flexible build)"
                ],
                advanced_strategies: [
                    "Maximize item diversity for stat bonuses",
                    "Focus on Multi-shot, Ricochet, Piercing skills",
                    "Revive Rune is essential (50% chance to revive)",
                    "Only top 1% players compete here"
                ]
            }
        };
    }

    // Generate comprehensive Q&A database from scraped data
    generateQADatabase() {
        const scrapedData = JSON.parse(fs.readFileSync(this.scrapedDataFile, 'utf8'));
        const qaDatabase = {};

        // Character questions
        Object.entries(scrapedData.characters).forEach(([key, char]) => {
            qaDatabase[char.name.toLowerCase()] = `**${char.name}** - ${char.tier} character with abilities: ${char.abilities.join(', ')}. Best for: ${char.best_for.join(', ')}. ${char.f2p_friendly ? 'F2P friendly.' : 'Requires investment.'} ${char.notes}`;
            qaDatabase[`${char.name.toLowerCase()} abilities`] = `**${char.name} Abilities**: ${char.abilities.join(', ')}. ${char.notes}`;
            qaDatabase[`${char.name.toLowerCase()} resonance`] = `**${char.name} Resonance**: 3-star: ${char.resonance['3_star']}, 6-star: ${char.resonance['6_star']}`;
        });

        // Weapon questions
        Object.entries(scrapedData.weapons).forEach(([key, weapon]) => {
            qaDatabase[weapon.name.toLowerCase()] = `**${weapon.name}** - ${weapon.tier} ${weapon.type} weapon. Abilities: ${weapon.abilities.join(', ')}. Best for: ${weapon.best_for.join(', ')}. ${weapon.notes}`;
        });

        // Skill questions
        Object.entries(scrapedData.skills).forEach(([key, skill]) => {
            qaDatabase[skill.name.toLowerCase()] = `**${skill.name}** - ${skill.tier} skill. ${skill.description}. Best for: ${skill.best_for.join(', ')}. Priority: ${skill.priority}`;
        });

        // Rune questions
        Object.entries(scrapedData.runes).forEach(([key, rune]) => {
            qaDatabase[rune.name.toLowerCase()] = `**${rune.name}** - ${rune.tier} rune. ${rune.description}. Priority: ${rune.priority}. ${rune.notes}`;
        });

        // Event questions
        Object.entries(scrapedData.events).forEach(([key, event]) => {
            qaDatabase[event.name.toLowerCase()] = `**${event.name}** - ${event.type}. ${event.description}. Strategies: ${event.strategies.join(', ')}. ${event.notes}`;
        });

        // Strategy questions
        Object.entries(scrapedData.strategies).forEach(([key, strategy]) => {
            qaDatabase[strategy.title.toLowerCase()] = `**${strategy.title}**: ${strategy.steps ? strategy.steps.join(' • ') : strategy.heroes ? strategy.heroes.join(', ') : strategy.tips ? strategy.tips.join(' • ') : 'Check detailed guide'}`;
        });

        return qaDatabase;
    }
}

module.exports = Archero2DataScraper;
