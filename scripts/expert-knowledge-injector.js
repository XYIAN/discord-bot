#!/usr/bin/env node

// Expert Knowledge Injector for XYIAN Bot
// Interactive tool to add your expertise to the knowledge base

const readline = require('readline');
const KnowledgeEnhancementSystem = require('./knowledge-enhancement-system');

class ExpertKnowledgeInjector {
    constructor() {
        this.knowledgeSystem = new KnowledgeEnhancementSystem();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🧠 XYIAN Bot Expert Knowledge Injector');
        console.log('=====================================\n');
        
        console.log('This tool helps you add your Archero 2 expertise to the bot\'s knowledge base.');
        console.log('Your knowledge will be used to:\n');
        console.log('• Enhance AI responses with expert insights');
        console.log('• Validate and correct user questions');
        console.log('• Improve the learning system with your expertise');
        console.log('• Create advanced strategies and meta analysis\n');
        
        await this.showMainMenu();
    }

    async showMainMenu() {
        console.log('\n📚 Expert Knowledge Menu:');
        console.log('1. Add Expert Knowledge Entry');
        console.log('2. Add Advanced Strategy');
        console.log('3. Add Meta Analysis');
        console.log('4. Add Resource Link');
        console.log('5. Bulk Knowledge Import');
        console.log('6. View Knowledge Report');
        console.log('7. Create Training Data');
        console.log('8. Exit\n');

        const choice = await this.askQuestion('Choose an option (1-8): ');
        
        switch (choice) {
            case '1':
                await this.addExpertKnowledge();
                break;
            case '2':
                await this.addAdvancedStrategy();
                break;
            case '3':
                await this.addMetaAnalysis();
                break;
            case '4':
                await this.addResourceLink();
                break;
            case '5':
                await this.bulkKnowledgeImport();
                break;
            case '6':
                await this.viewKnowledgeReport();
                break;
            case '7':
                await this.createTrainingData();
                break;
            case '8':
                console.log('👋 Thank you for enhancing the knowledge base!');
                this.rl.close();
                return;
            default:
                console.log('❌ Invalid option. Please try again.');
                await this.showMainMenu();
        }
    }

    async addExpertKnowledge() {
        console.log('\n📝 Add Expert Knowledge Entry');
        console.log('============================\n');
        
        const topic = await this.askQuestion('Topic/Question: ');
        const knowledge = await this.askQuestion('Your expert knowledge/answer: ');
        const category = await this.askQuestion('Category (characters/weapons/pvp/f2p/events/progression): ');
        const confidence = await this.askQuestion('Confidence level (0.1-1.0, default 0.95): ') || '0.95';
        const sources = await this.askQuestion('Sources (comma-separated, optional): ');

        const sourcesArray = sources ? sources.split(',').map(s => s.trim()) : [];
        
        const success = this.knowledgeSystem.addExpertKnowledge(
            topic, 
            knowledge, 
            category, 
            parseFloat(confidence), 
            sourcesArray
        );

        if (success) {
            console.log('✅ Expert knowledge added successfully!');
        } else {
            console.log('❌ Failed to add expert knowledge.');
        }

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    async addAdvancedStrategy() {
        console.log('\n⚔️ Add Advanced Strategy');
        console.log('========================\n');
        
        const strategyName = await this.askQuestion('Strategy Name: ');
        const description = await this.askQuestion('Strategy Description: ');
        const category = await this.askQuestion('Category (pvp/pve/arena/supreme/f2p): ');
        const requirements = await this.askQuestion('Requirements (comma-separated): ');
        const tips = await this.askQuestion('Pro Tips (comma-separated): ');

        const requirementsArray = requirements ? requirements.split(',').map(r => r.trim()) : [];
        const tipsArray = tips ? tips.split(',').map(t => t.trim()) : [];
        
        const success = this.knowledgeSystem.addAdvancedStrategy(
            strategyName,
            description,
            category,
            requirementsArray,
            tipsArray
        );

        if (success) {
            console.log('✅ Advanced strategy added successfully!');
        } else {
            console.log('❌ Failed to add advanced strategy.');
        }

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    async addMetaAnalysis() {
        console.log('\n📊 Add Meta Analysis');
        console.log('====================\n');
        
        const topic = await this.askQuestion('Meta Topic: ');
        const analysis = await this.askQuestion('Your meta analysis: ');
        const currentMeta = await this.askQuestion('Is this current meta? (y/n, default y): ') || 'y';
        const confidence = await this.askQuestion('Confidence level (0.1-1.0, default 0.9): ') || '0.9';
        
        const success = this.knowledgeSystem.addMetaAnalysis(
            topic,
            analysis,
            currentMeta.toLowerCase() === 'y',
            parseFloat(confidence)
        );

        if (success) {
            console.log('✅ Meta analysis added successfully!');
        } else {
            console.log('❌ Failed to add meta analysis.');
        }

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    async addResourceLink() {
        console.log('\n🔗 Add Resource Link');
        console.log('===================\n');
        
        const name = await this.askQuestion('Resource Name: ');
        const url = await this.askQuestion('URL: ');
        const category = await this.askQuestion('Category (guides/strategies/updates/community): ');
        const description = await this.askQuestion('Description (optional): ');
        
        const success = this.knowledgeSystem.addResourceLink(
            name,
            url,
            category,
            description
        );

        if (success) {
            console.log('✅ Resource link added successfully!');
        } else {
            console.log('❌ Failed to add resource link.');
        }

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    async bulkKnowledgeImport() {
        console.log('\n📦 Bulk Knowledge Import');
        console.log('========================\n');
        
        console.log('This will create a comprehensive knowledge base with your expertise.');
        console.log('The system will add:');
        console.log('• Supreme Arena meta analysis');
        console.log('• Character resonance optimization');
        console.log('• Upgrade priority systems');
        console.log('• F2P optimization strategies');
        console.log('• Event timing strategies');
        console.log('• Advanced validation rules\n');
        
        const confirm = await this.askQuestion('Proceed with bulk import? (y/n): ');
        
        if (confirm.toLowerCase() === 'y') {
            console.log('🚀 Starting bulk knowledge import...');
            this.knowledgeSystem.createKnowledgeFromExpertise();
            this.knowledgeSystem.enhanceLearningSystem();
            console.log('✅ Bulk knowledge import completed!');
        } else {
            console.log('❌ Bulk import cancelled.');
        }

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    async viewKnowledgeReport() {
        console.log('\n📊 Knowledge Report');
        console.log('==================\n');
        
        const report = this.knowledgeSystem.generateKnowledgeReport();
        
        console.log(`📚 Total Expert Entries: ${report.totalExpertEntries}`);
        console.log(`⚔️ Advanced Strategies: ${report.totalAdvancedStrategies}`);
        console.log(`📊 Meta Analysis: ${report.totalMetaAnalysis}`);
        console.log(`🔗 Resource Links: ${report.totalResourceLinks}`);
        console.log(`✅ Validation Rules: ${report.totalValidationRules}`);
        console.log(`📅 Last Updated: ${report.lastUpdated}`);
        console.log(`🏷️ Categories: ${report.categories.join(', ')}`);
        console.log(`📈 Average Confidence: ${(report.confidenceScores.reduce((a, b) => a + b, 0) / report.confidenceScores.length).toFixed(2)}`);

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    async createTrainingData() {
        console.log('\n🎓 Create Training Data');
        console.log('=====================\n');
        
        console.log('Creating training data from your expertise...');
        this.knowledgeSystem.createTrainingData();
        console.log('✅ Training data created successfully!');

        await this.askQuestion('\nPress Enter to continue...');
        await this.showMainMenu();
    }

    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve);
        });
    }
}

// Start the injector if run directly
if (require.main === module) {
    const injector = new ExpertKnowledgeInjector();
    injector.start().catch(console.error);
}

module.exports = ExpertKnowledgeInjector;
