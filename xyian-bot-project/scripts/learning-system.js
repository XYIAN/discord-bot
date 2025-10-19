#!/usr/bin/env node

// Advanced Learning System for Archero 2 Bot
// This system learns from user feedback and automatically updates responses

const fs = require('fs');
const path = require('path');

class ArcheroLearningSystem {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'learning_data.json');
        this.qaFile = path.join(__dirname, 'data', 'archero_qa_learned.json');
        this.feedbackFile = path.join(__dirname, 'data', 'feedback_analysis.json');
        this.initializeFiles();
    }

    initializeFiles() {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Initialize learning data file
        if (!fs.existsSync(this.dataFile)) {
            fs.writeFileSync(this.dataFile, JSON.stringify({
                corrections: [],
                newQuestions: [],
                improvedAnswers: [],
                confidenceScores: {},
                lastUpdated: new Date().toISOString()
            }));
        }

        // Initialize learned Q&A file
        if (!fs.existsSync(this.qaFile)) {
            fs.writeFileSync(this.qaFile, JSON.stringify({}));
        }

        // Initialize feedback analysis file
        if (!fs.existsSync(this.feedbackFile)) {
            fs.writeFileSync(this.feedbackFile, JSON.stringify({
                lowRatedAnswers: [],
                frequentlyAsked: [],
                missingTopics: [],
                userSuggestions: []
            }));
        }
    }

    // Process user feedback and learn from it
    async processFeedback(interactionId, userId, rating, correction, originalQuestion, originalAnswer) {
        try {
            const learningData = this.readLearningData();
            const feedback = {
                interactionId,
                userId,
                rating,
                correction,
                originalQuestion,
                originalAnswer,
                timestamp: new Date().toISOString()
            };

            // Add to corrections if rating is low
            if (rating <= 2) {
                learningData.corrections.push(feedback);
                console.log(`📝 Learned correction: ${originalQuestion.substring(0, 50)}...`);
            }

            // Add to new questions if it's a new topic
            if (rating >= 4 && !this.questionExists(originalQuestion)) {
                learningData.newQuestions.push({
                    question: originalQuestion,
                    suggestedAnswer: correction || originalAnswer,
                    confidence: 0.8,
                    source: 'user_feedback',
                    timestamp: new Date().toISOString()
                });
                console.log(`🆕 New question learned: ${originalQuestion.substring(0, 50)}...`);
            }

            // Update confidence scores
            this.updateConfidenceScores(originalQuestion, rating);

            this.writeLearningData(learningData);
            return true;
        } catch (error) {
            console.error('❌ Error processing feedback:', error);
            return false;
        }
    }

    // Analyze patterns in user questions to identify missing topics
    analyzeQuestionPatterns(interactions) {
        const patterns = {
            weaponQuestions: [],
            characterQuestions: [],
            buildQuestions: [],
            f2pQuestions: [],
            pvpQuestions: [],
            eventQuestions: []
        };

        interactions.forEach(interaction => {
            const question = interaction.question.toLowerCase();
            
            if (question.includes('weapon') || question.includes('staff') || question.includes('claws') || question.includes('crossbow')) {
                patterns.weaponQuestions.push(interaction);
            }
            if (question.includes('character') || question.includes('thor') || question.includes('demon') || question.includes('rolla')) {
                patterns.characterQuestions.push(interaction);
            }
            if (question.includes('build') || question.includes('setup') || question.includes('combination')) {
                patterns.buildQuestions.push(interaction);
            }
            if (question.includes('f2p') || question.includes('free') || question.includes('budget')) {
                patterns.f2pQuestions.push(interaction);
            }
            if (question.includes('pvp') || question.includes('arena') || question.includes('supreme')) {
                patterns.pvpQuestions.push(interaction);
            }
            if (question.includes('event') || question.includes('umbral') || question.includes('tempest')) {
                patterns.eventQuestions.push(interaction);
            }
        });

        return patterns;
    }

    // Generate improved answers based on learned data
    generateImprovedAnswer(question) {
        const learningData = this.readLearningData();
        const learnedQA = this.readLearnedQA();
        
        // Check for direct corrections
        const correction = learningData.corrections.find(c => 
            this.similarity(c.originalQuestion, question) > 0.8
        );
        
        if (correction) {
            return {
                answer: correction.correction,
                confidence: 0.9,
                source: 'user_correction'
            };
        }

        // Check learned Q&A
        const learnedAnswer = learnedQA[question.toLowerCase()];
        if (learnedAnswer) {
            return {
                answer: learnedAnswer.answer,
                confidence: learnedAnswer.confidence,
                source: 'learned_data'
            };
        }

        // Check for similar questions
        const similarQuestion = Object.keys(learnedQA).find(q => 
            this.similarity(q, question) > 0.7
        );
        
        if (similarQuestion) {
            return {
                answer: learnedQA[similarQuestion].answer,
                confidence: learnedQA[similarQuestion].confidence * 0.8,
                source: 'similar_learned'
            };
        }

        return null;
    }

    // Update the main Q&A database with learned data
    updateMainQADatabase() {
        try {
            const learningData = this.readLearningData();
            const learnedQA = this.readLearnedQA();
            
            // Read the main bot's Q&A database
            const botFile = path.join(__dirname, 'ultimate-xyian-bot.js');
            let botContent = fs.readFileSync(botFile, 'utf8');
            
            // Add new learned questions to the archeroQA object
            let newQAEntries = '';
            Object.entries(learnedQA).forEach(([question, data]) => {
                if (data.confidence > 0.7) {
                    newQAEntries += `    "${question}": "${data.answer}",\n`;
                }
            });

            // Add corrections
            learningData.corrections.forEach(correction => {
                if (correction.correction) {
                    const questionKey = correction.originalQuestion.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
                    newQAEntries += `    "${questionKey}": "${correction.correction}",\n`;
                }
            });

            if (newQAEntries) {
                // Find the end of the archeroQA object and add new entries
                const qaEndPattern = /(\s+};\s*\/\/ Daily tips database)/;
                if (qaEndPattern.test(botContent)) {
                    botContent = botContent.replace(qaEndPattern, `\n${newQAEntries}$1`);
                    fs.writeFileSync(botFile, botContent);
                    console.log('✅ Updated main Q&A database with learned data');
                }
            }

            return true;
        } catch (error) {
            console.error('❌ Error updating main Q&A database:', error);
            return false;
        }
    }

    // Helper methods
    readLearningData() {
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        } catch (error) {
            return { corrections: [], newQuestions: [], improvedAnswers: [], confidenceScores: {} };
        }
    }

    readLearnedQA() {
        try {
            return JSON.parse(fs.readFileSync(this.qaFile, 'utf8'));
        } catch (error) {
            return {};
        }
    }

    writeLearningData(data) {
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    }

    writeLearnedQA(data) {
        fs.writeFileSync(this.qaFile, JSON.stringify(data, null, 2));
    }

    questionExists(question) {
        const learnedQA = this.readLearnedQA();
        return Object.keys(learnedQA).some(q => this.similarity(q, question) > 0.8);
    }

    updateConfidenceScores(question, rating) {
        const learningData = this.readLearningData();
        const key = question.toLowerCase();
        
        if (!learningData.confidenceScores[key]) {
            learningData.confidenceScores[key] = { total: 0, count: 0, average: 0 };
        }
        
        const score = learningData.confidenceScores[key];
        score.total += rating;
        score.count += 1;
        score.average = score.total / score.count;
        
        this.writeLearningData(learningData);
    }

    similarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Generate learning report
    generateLearningReport() {
        const learningData = this.readLearningData();
        const learnedQA = this.readLearnedQA();
        
        return {
            totalCorrections: learningData.corrections.length,
            totalNewQuestions: learningData.newQuestions.length,
            totalLearnedAnswers: Object.keys(learnedQA).length,
            averageConfidence: Object.values(learningData.confidenceScores)
                .reduce((sum, score) => sum + score.average, 0) / Object.keys(learningData.confidenceScores).length || 0,
            lastUpdated: learningData.lastUpdated,
            topCorrections: learningData.corrections
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5),
            recentNewQuestions: learningData.newQuestions
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5)
        };
    }
}

module.exports = ArcheroLearningSystem;
