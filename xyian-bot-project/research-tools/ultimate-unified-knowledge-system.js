#!/usr/bin/env node

// Ultimate Unified Knowledge System
// Processes ALL fragmented data sources and creates a single, comprehensive knowledge database

const fs = require('fs');
const path = require('path');

class UltimateUnifiedKnowledgeSystem {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.outputFile = path.join(this.dataDir, 'archero_qa_learned.json');
        this.researchDir = path.join(__dirname);
        this.initializeOutputFile();
    }

    initializeOutputFile() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    async processAllData() {
        console.log('🚀 Starting Ultimate Unified Knowledge System...');
        console.log('📊 Processing ALL fragmented data sources...');
        
        const unifiedKnowledge = {
            timestamp: new Date().toISOString(),
            sources: [],
            totalEntries: 0,
            categories: {
                theorycrafting: {},
                discordChannels: {},
                wikiPages: {},
                forumThreads: {},
                gameInfo: {},
                weapons: {},
                characters: {},
                mechanics: {},
                events: {},
                guild: {},
                artifacts: {},
                statistics: {}
            },
            lastUpdated: new Date().toISOString()
        };

        // Process all data files
        await this.processTheorycraftingData(unifiedKnowledge);
        await this.processDiscordData(unifiedKnowledge);
        await this.processWikiData(unifiedKnowledge);
        await this.processForumData(unifiedKnowledge);
        await this.processGameData(unifiedKnowledge);

        // Calculate total entries
        unifiedKnowledge.totalEntries = Object.values(unifiedKnowledge.categories).reduce((total, category) => {
            return total + Object.keys(category).length;
        }, 0);

        // Save unified knowledge
        fs.writeFileSync(this.outputFile, JSON.stringify(unifiedKnowledge, null, 2));
        
        console.log('✅ Ultimate Unified Knowledge System completed successfully');
        console.log(`📊 Total entries processed: ${unifiedKnowledge.totalEntries}`);
        console.log(`📊 Categories: ${Object.keys(unifiedKnowledge.categories).length}`);
        console.log(`📊 Sources: ${unifiedKnowledge.sources.length}`);
        
        return unifiedKnowledge;
    }

    async processTheorycraftingData(knowledge) {
        console.log('📚 Processing theorycrafting data...');
        
        const theorycraftingFile = path.join(this.researchDir, 'theorycrafting-posts-data-1759700707280.json');
        if (fs.existsSync(theorycraftingFile)) {
            const data = JSON.parse(fs.readFileSync(theorycraftingFile, 'utf8'));
            
            Object.entries(data.categories).forEach(([category, categoryData]) => {
                categoryData.posts.forEach((post, index) => {
                    const key = `${category}_${index}`;
                    knowledge.categories.theorycrafting[key] = {
                        url: post.url,
                        content: post.content,
                        scrapedAt: post.scrapedAt,
                        category: category,
                        keywords: this.extractKeywords(post.content),
                        source: 'Theorycrafting Posts',
                        contentLength: post.content.length
                    };
                });
            });
            
            knowledge.sources.push(`Theorycrafting Posts (${data.totalPosts} posts)`);
            console.log(`✅ Processed ${data.totalPosts} theorycrafting posts`);
        }
    }

    async processDiscordData(knowledge) {
        console.log('📱 Processing Discord data...');
        
        const discordFiles = [
            'complete-discord-channels-data-1759696039606.json',
            'comprehensive-discord-wiki-data-1759694708816.json',
            'comprehensive-discord-wiki-data-1759699388244.json',
            'archero2-discord-wiki-data-1759693742831.json',
            'missing-discord-channels-data-1759696277895.json',
            'discord-real-data-1759694215550.json'
        ];
        
        let totalChannels = 0;
        
        discordFiles.forEach(filename => {
            const filePath = path.join(this.researchDir, filename);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.discordChannels) {
                    data.discordChannels.forEach((channel, index) => {
                        if (channel.content && channel.content.length > 100) {
                            const key = `discord_${totalChannels}`;
                            knowledge.categories.discordChannels[key] = {
                                url: channel.url,
                                content: channel.content,
                                channelId: channel.channelId,
                                contentLength: channel.contentLength,
                                pageTitle: channel.pageTitle,
                                keywords: this.extractKeywords(channel.content),
                                source: 'Discord Channel',
                                timestamp: new Date().toISOString()
                            };
                            totalChannels++;
                        }
                    });
                }
            }
        });
        
        knowledge.sources.push(`Discord Channels (${totalChannels} channels)`);
        console.log(`✅ Processed ${totalChannels} Discord channels`);
    }

    async processWikiData(knowledge) {
        console.log('📖 Processing wiki data...');
        
        const wikiFiles = [
            'archero2-official-wiki-data-1759694294205.json',
            'comprehensive-artifact-data-1759694426991.json'
        ];
        
        let totalPages = 0;
        
        wikiFiles.forEach(filename => {
            const filePath = path.join(this.researchDir, filename);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.wikiPages) {
                    data.wikiPages.forEach((page, index) => {
                        if (page.content && page.content.length > 100) {
                            const key = `wiki_${totalPages}`;
                            knowledge.categories.wikiPages[key] = {
                                url: page.url,
                                content: page.content,
                                keywords: this.extractKeywords(page.content),
                                source: 'Official Wiki',
                                timestamp: new Date().toISOString(),
                                contentLength: page.content.length
                            };
                            totalPages++;
                        }
                    });
                }
            }
        });
        
        knowledge.sources.push(`Wiki Pages (${totalPages} pages)`);
        console.log(`✅ Processed ${totalPages} wiki pages`);
    }

    async processForumData(knowledge) {
        console.log('💬 Processing forum data...');
        
        const forumFiles = [
            'forum-threads-data-1759697201863.json',
            'human-like-forum-data-1759697815145.json',
            'human-like-forum-data-1759700896937.json',
            'comprehensive-forum-data-1759697330804.json'
        ];
        
        let totalThreads = 0;
        
        forumFiles.forEach(filename => {
            const filePath = path.join(this.researchDir, filename);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.threads) {
                    data.threads.forEach((thread, index) => {
                        if (thread.content && thread.content.length > 100) {
                            const key = `forum_${totalThreads}`;
                            knowledge.categories.forumThreads[key] = {
                                url: thread.url,
                                content: thread.content,
                                keywords: this.extractKeywords(thread.content),
                                source: 'Forum Thread',
                                timestamp: new Date().toISOString(),
                                contentLength: thread.content.length
                            };
                            totalThreads++;
                        }
                    });
                }
            }
        });
        
        knowledge.sources.push(`Forum Threads (${totalThreads} threads)`);
        console.log(`✅ Processed ${totalThreads} forum threads`);
    }

    async processGameData(knowledge) {
        console.log('🎮 Processing game data...');
        
        // Extract game-specific information from all sources
        const allContent = [];
        
        // Collect content from all categories
        Object.values(knowledge.categories).forEach(category => {
            Object.values(category).forEach(item => {
                if (item.content) {
                    allContent.push(item.content);
                }
            });
        });
        
        // Process content for game-specific categories
        this.processGameCategories(knowledge, allContent);
        
        console.log('✅ Processed game data');
    }

    processGameCategories(knowledge, allContent) {
        const content = allContent.join(' ');
        
        // Extract weapons information
        const weaponKeywords = ['oracle staff', 'griffin claws', 'dragoon crossbow', 'weapon', 'staff', 'claws', 'crossbow'];
        weaponKeywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                const key = `weapon_${keyword.replace(/\s+/g, '_')}`;
                knowledge.categories.weapons[key] = {
                    name: keyword,
                    content: this.extractRelevantContent(content, keyword),
                    keywords: this.extractKeywords(this.extractRelevantContent(content, keyword)),
                    source: 'Unified Knowledge',
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        // Extract characters information
        const characterKeywords = ['thor', 'demon king', 'rolla', 'dracoola', 'seraph', 'loki', 'alex', 'nyanja', 'helix', 'hela', 'otta'];
        characterKeywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                const key = `character_${keyword.replace(/\s+/g, '_')}`;
                knowledge.categories.characters[key] = {
                    name: keyword,
                    content: this.extractRelevantContent(content, keyword),
                    keywords: this.extractKeywords(this.extractRelevantContent(content, keyword)),
                    source: 'Unified Knowledge',
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        // Extract mechanics information
        const mechanicsKeywords = ['resonance', 'rune', 'etched', 'revive', 'guardian', 'arena', 'supreme', 'pvp', 'pve'];
        mechanicsKeywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                const key = `mechanics_${keyword}`;
                knowledge.categories.mechanics[key] = {
                    name: keyword,
                    content: this.extractRelevantContent(content, keyword),
                    keywords: this.extractKeywords(this.extractRelevantContent(content, keyword)),
                    source: 'Unified Knowledge',
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        // Extract events information
        const eventKeywords = ['umbral tempest', 'event', 'daily', 'guild', 'expedition', 'arena'];
        eventKeywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                const key = `event_${keyword.replace(/\s+/g, '_')}`;
                knowledge.categories.events[key] = {
                    name: keyword,
                    content: this.extractRelevantContent(content, keyword),
                    keywords: this.extractKeywords(this.extractRelevantContent(content, keyword)),
                    source: 'Unified Knowledge',
                    timestamp: new Date().toISOString()
                };
            }
        });
    }

    extractRelevantContent(content, keyword) {
        const sentences = content.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence => 
            sentence.toLowerCase().includes(keyword.toLowerCase())
        );
        return relevantSentences.slice(0, 5).join('. ').substring(0, 500);
    }

    extractKeywords(content) {
        if (!content) return [];
        
        const keywords = [];
        const commonTerms = [
            'weapon', 'character', 'upgrade', 'tier', 'mythic', 'chaotic', 'boss', 'guild',
            'staff', 'rolla', 'otta', 'umbral', 'tempest', 'skill', 'event', 'gear',
            'equipment', 'build', 'tip', 'guide', 'help', 'question', 'pvp', 'pve',
            'card', 'progression', 'level', 'power', 'stats', 'effect', 'hero',
            'ability', 'abilities', 'active', 'area', 'target', 'multi', 'ice',
            'dark', 'light', 'element', 'strength', 'advantage', 'counter', 'combo',
            'order', 'mastery', 'ultimate', 'questions', 'arena', 'supreme', 'griffin',
            'dragoon', 'oracle', 'thor', 'demon', 'king', 'helix', 'dracoola', 'seraph',
            'loki', 'alex', 'nyanja', 'hela', 'rune', 'etched', 'revive', 'guardian',
            'flame', 'knock', 'touch', 'meteor', 'sprite', 'elemental', 'crit', 'resonance',
            '3-star', '6-star', 'legendary', 'epic', 'common', 'rare', 'mythic', 'chaotic'
        ];
        
        commonTerms.forEach(term => {
            if (content.toLowerCase().includes(term.toLowerCase())) {
                keywords.push(term);
            }
        });
        
        return keywords.slice(0, 25); // Limit to 25 keywords
    }
}

// Run the unified knowledge system
if (require.main === module) {
    const system = new UltimateUnifiedKnowledgeSystem();
    system.processAllData()
        .then(data => {
            console.log('✅ Ultimate Unified Knowledge System completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ultimate Unified Knowledge System failed:', error);
            process.exit(1);
        });
}

module.exports = UltimateUnifiedKnowledgeSystem;
