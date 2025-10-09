#!/usr/bin/env node

// Ultimate Comprehensive Knowledge Injector
// Processes ALL scraped data from theorycrafting posts, Discord channels, wiki data, and more

const fs = require('fs');
const path = require('path');

class UltimateComprehensiveKnowledgeInjector {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.outputFile = path.join(this.dataDir, 'archero_qa_learned.json');
        this.initializeOutputFile();
    }

    initializeOutputFile() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        if (!fs.existsSync(this.outputFile)) {
            fs.writeFileSync(this.outputFile, JSON.stringify({
                timestamp: new Date().toISOString(),
                sources: [],
                discordChannels: [],
                gameInfo: {},
                weapons: {},
                characters: {},
                mechanics: {},
                events: {},
                guild: {},
                artifacts: {},
                statistics: {},
                forumThreads: {},
                forumGameInfo: {},
                theorycraftingPosts: {},
                wikiPages: {},
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }
    }

    async injectAllKnowledge() {
        console.log('🚀 Starting Ultimate Comprehensive Knowledge Injection...');
        
        try {
            // Load existing data
            const existingData = JSON.parse(fs.readFileSync(this.outputFile, 'utf8'));
            
            // Process theorycrafting posts
            await this.processTheorycraftingPosts(existingData);
            
            // Process Discord channels
            await this.processDiscordChannels(existingData);
            
            // Process wiki data
            await this.processWikiData(existingData);
            
            // Process forum data
            await this.processForumData(existingData);
            
            // Update metadata
            existingData.lastUpdated = new Date().toISOString();
            existingData.sources = [
                'Theorycrafting Posts (28 posts)',
                'Discord Channels (12 channels)',
                'Official Wiki Pages',
                'Forum Threads',
                'Community Discussions'
            ];
            
            // Save comprehensive data
            fs.writeFileSync(this.outputFile, JSON.stringify(existingData, null, 2));
            
            console.log('✅ Ultimate comprehensive knowledge injection completed successfully');
            console.log(`📊 Total entries: ${Object.keys(existingData.gameInfo || {}).length + Object.keys(existingData.weapons || {}).length + Object.keys(existingData.characters || {}).length + Object.keys(existingData.mechanics || {}).length + Object.keys(existingData.events || {}).length + Object.keys(existingData.guild || {}).length + Object.keys(existingData.artifacts || {}).length + Object.keys(existingData.statistics || {}).length + Object.keys(existingData.theorycraftingPosts || {}).length}`);
            
            return existingData;
            
        } catch (error) {
            console.error('❌ Ultimate knowledge injection failed:', error);
            throw error;
        }
    }

    async processTheorycraftingPosts(data) {
        console.log('📚 Processing theorycrafting posts...');
        
        const theorycraftingFile = path.join(__dirname, 'theorycrafting-posts-data-1759700707280.json');
        if (fs.existsSync(theorycraftingFile)) {
            const theorycraftingData = JSON.parse(fs.readFileSync(theorycraftingFile, 'utf8'));
            
            if (!data.theorycraftingPosts) {
                data.theorycraftingPosts = {};
            }
            
            // Process each category
            Object.entries(theorycraftingData.categories).forEach(([category, categoryData]) => {
                categoryData.posts.forEach((post, index) => {
                    const key = `${category}_post_${index}`;
                    data.theorycraftingPosts[key] = {
                        url: post.url,
                        content: post.content,
                        scrapedAt: post.scrapedAt,
                        category: category,
                        keywords: this.extractKeywords(post.content),
                        source: 'Theorycrafting Posts'
                    };
                });
            });
            
            console.log(`✅ Processed ${theorycraftingData.totalPosts} theorycrafting posts`);
        }
    }

    async processDiscordChannels(data) {
        console.log('📱 Processing Discord channels...');
        
        const discordFiles = [
            'complete-discord-channels-data-1759696039606.json',
            'comprehensive-discord-wiki-data-1759694708816.json',
            'comprehensive-discord-wiki-data-1759699388244.json'
        ];
        
        discordFiles.forEach(filename => {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                const discordData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (discordData.discordChannels) {
                    discordData.discordChannels.forEach((channel, index) => {
                        if (channel.content && channel.content.length > 100) {
                            const key = `discord_channel_${index}`;
                            if (!data.gameInfo) data.gameInfo = {};
                            data.gameInfo[key] = {
                                content: channel.content,
                                url: channel.url,
                                channelId: channel.channelId,
                                contentLength: channel.contentLength,
                                pageTitle: channel.pageTitle,
                                keywords: this.extractKeywords(channel.content),
                                source: 'Discord Channel',
                                timestamp: new Date().toISOString()
                            };
                        }
                    });
                }
            }
        });
        
        console.log('✅ Processed Discord channels');
    }

    async processWikiData(data) {
        console.log('📖 Processing wiki data...');
        
        const wikiFiles = [
            'archero2-official-wiki-data-1759694294205.json',
            'comprehensive-artifact-data-1759694426991.json'
        ];
        
        wikiFiles.forEach(filename => {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                const wikiData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (wikiData.wikiPages) {
                    wikiData.wikiPages.forEach((page, index) => {
                        if (page.content && page.content.length > 100) {
                            const key = `wiki_page_${index}`;
                            if (!data.wikiPages) data.wikiPages = {};
                            data.wikiPages[key] = {
                                content: page.content,
                                url: page.url,
                                keywords: this.extractKeywords(page.content),
                                source: 'Official Wiki',
                                timestamp: new Date().toISOString()
                            };
                        }
                    });
                }
            }
        });
        
        console.log('✅ Processed wiki data');
    }

    async processForumData(data) {
        console.log('💬 Processing forum data...');
        
        const forumFiles = [
            'forum-threads-data-1759697201863.json',
            'human-like-forum-data-1759697815145.json'
        ];
        
        forumFiles.forEach(filename => {
            const filePath = path.join(__dirname, filename);
            if (fs.existsSync(filePath)) {
                const forumData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (forumData.threads) {
                    forumData.threads.forEach((thread, index) => {
                        if (thread.content && thread.content.length > 100) {
                            const key = `forum_thread_${index}`;
                            if (!data.forumThreads) data.forumThreads = {};
                            data.forumThreads[key] = {
                                content: thread.content,
                                url: thread.url,
                                keywords: this.extractKeywords(thread.content),
                                source: 'Forum Thread',
                                timestamp: new Date().toISOString()
                            };
                        }
                    });
                }
            }
        });
        
        console.log('✅ Processed forum data');
    }

    extractKeywords(content) {
        if (!content) return [];
        
        // Extract common Archero 2 keywords
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
            'flame', 'knock', 'touch', 'meteor', 'sprite', 'elemental', 'crit'
        ];
        
        commonTerms.forEach(term => {
            if (content.toLowerCase().includes(term.toLowerCase())) {
                keywords.push(term);
            }
        });
        
        return keywords.slice(0, 20); // Limit to 20 keywords
    }
}

// Run the injector
if (require.main === module) {
    const injector = new UltimateComprehensiveKnowledgeInjector();
    injector.injectAllKnowledge()
        .then(data => {
            console.log('✅ Ultimate comprehensive knowledge injection completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ultimate comprehensive knowledge injection failed:', error);
            process.exit(1);
        });
}

module.exports = UltimateComprehensiveKnowledgeInjector;
