#!/usr/bin/env node
/**
 * Training System - Allows owner to train bot with corrections and new data
 * Integrates with unified_game_data.json and validates all inputs
 */

const fs = require('fs');
const path = require('path');

class TrainingSystem {
    constructor() {
        this.trainingLogPath = path.join(__dirname, 'xyian-bot-project', 'data', 'user-training', 'training-log.json');
        this.unifiedDataPath = path.join(__dirname, 'xyian-bot-project', 'data', 'real-structured-data', 'unified_game_data.json');
        this.pendingReviewPath = path.join(__dirname, 'xyian-bot-project', 'data', 'user-training', 'pending-review.json');
        
        // Ensure directories exist
        const trainingDir = path.dirname(this.trainingLogPath);
        if (!fs.existsSync(trainingDir)) {
            fs.mkdirSync(trainingDir, { recursive: true });
        }
        
        this.trainingLog = this.loadTrainingLog();
        this.pendingReviews = this.loadPendingReviews();
    }

    loadTrainingLog() {
        try {
            if (fs.existsSync(this.trainingLogPath)) {
                return JSON.parse(fs.readFileSync(this.trainingLogPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading training log:', error.message);
        }
        return { entries: [], feedback: {} };
    }

    saveTrainingLog() {
        try {
            fs.writeFileSync(this.trainingLogPath, JSON.stringify(this.trainingLog, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving training log:', error.message);
            return false;
        }
    }

    loadPendingReviews() {
        try {
            if (fs.existsSync(this.pendingReviewPath)) {
                return JSON.parse(fs.readFileSync(this.pendingReviewPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading pending reviews:', error.message);
        }
        return [];
    }

    savePendingReviews() {
        try {
            fs.writeFileSync(this.pendingReviewPath, JSON.stringify(this.pendingReviews, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving pending reviews:', error.message);
            return false;
        }
    }

    loadUnifiedData() {
        try {
            return JSON.parse(fs.readFileSync(this.unifiedDataPath, 'utf8'));
        } catch (error) {
            console.error('Error loading unified data:', error.message);
            return null;
        }
    }

    saveUnifiedData(data) {
        try {
            fs.writeFileSync(this.unifiedDataPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving unified data:', error.message);
            return false;
        }
    }

    // Validate training input for quality
    validateInput(text) {
        const issues = [];
        
        // Check for Discord usernames
        if (text.match(/\b(Senior|Junior|Elite|Legendary)\s+(Archer|Warrior|Mage)\b/gi)) {
            issues.push('Contains Discord username patterns');
        }
        
        // Check for timestamps
        if (text.match(/\d{1,2}:\d{2}\s*(AM|PM)/gi) || text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g)) {
            issues.push('Contains timestamps');
        }
        
        // Check for chat noise
        if (text.match(/\(edited\)/gi) || text.match(/\breply\b/gi)) {
            issues.push('Contains chat noise');
        }
        
        // Check if too short
        if (text.length < 10) {
            issues.push('Text too short - need more detail');
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }

    // Add training entry (goes to pending review)
    addTraining(category, topic, information, userId, username) {
        const validation = this.validateInput(information);
        
        if (!validation.valid) {
            return {
                success: false,
                message: `⚠️ Quality check failed:\n${validation.issues.map(i => `- ${i}`).join('\n')}\n\nPlease provide clean game facts without Discord chatter.`
            };
        }

        const entry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userId,
            username,
            category,
            topic,
            information,
            status: 'pending_review'
        };

        this.pendingReviews.push(entry);
        this.savePendingReviews();

        // Also log it
        this.trainingLog.entries.push({
            ...entry,
            action: 'training_added'
        });
        this.saveTrainingLog();

        return {
            success: true,
            message: `✅ Training data added and queued for review!\n\n**Category:** ${category}\n**Topic:** ${topic}\n\nYour contribution will be reviewed and merged into the knowledge base soon.`,
            entryId: entry.id
        };
    }

    // Add feedback on bot response
    addFeedback(responseText, rating, comment, userId, username) {
        const feedbackId = Date.now().toString();
        
        this.trainingLog.feedback[feedbackId] = {
            timestamp: new Date().toISOString(),
            userId,
            username,
            responseText: responseText.substring(0, 200),
            rating, // thumbs_up or thumbs_down
            comment: comment || '',
            status: 'logged'
        };

        this.saveTrainingLog();

        return {
            success: true,
            message: rating === 'thumbs_up' 
                ? '👍 Thanks for the positive feedback!' 
                : '👎 Thanks for the feedback! We\'ll work on improving this response.'
        };
    }

    // Correct a bot response
    addCorrection(incorrectResponse, correction, userId, username) {
        const validation = this.validateInput(correction);
        
        if (!validation.valid) {
            return {
                success: false,
                message: `⚠️ Quality check failed:\n${validation.issues.map(i => `- ${i}`).join('\n')}`
            };
        }

        const entry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userId,
            username,
            type: 'correction',
            incorrectResponse: incorrectResponse.substring(0, 200),
            correction,
            status: 'pending_review'
        };

        this.pendingReviews.push(entry);
        this.savePendingReviews();

        this.trainingLog.entries.push({
            ...entry,
            action: 'correction_added'
        });
        this.saveTrainingLog();

        return {
            success: true,
            message: '✅ Correction submitted! Will be reviewed and integrated.',
            entryId: entry.id
        };
    }

    // Review and approve pending entry (merges into unified_game_data.json)
    approvePendingEntry(entryId) {
        const entryIndex = this.pendingReviews.findIndex(e => e.id === entryId);
        if (entryIndex === -1) {
            return { success: false, message: 'Entry not found' };
        }

        const entry = this.pendingReviews[entryIndex];
        const unifiedData = this.loadUnifiedData();
        
        if (!unifiedData) {
            return { success: false, message: 'Failed to load unified data' };
        }

        // Merge into unified data based on category
        if (entry.category && unifiedData[entry.category]) {
            if (!unifiedData[entry.category][entry.topic]) {
                unifiedData[entry.category][entry.topic] = {};
            }
            
            // Add the information as a note or new field
            if (typeof entry.information === 'string') {
                unifiedData[entry.category][entry.topic].trained_info = entry.information;
            }
        }

        // Save updated unified data
        if (this.saveUnifiedData(unifiedData)) {
            // Remove from pending
            this.pendingReviews.splice(entryIndex, 1);
            this.savePendingReviews();

            // Update training log
            this.trainingLog.entries.push({
                ...entry,
                action: 'approved_and_merged',
                approvedAt: new Date().toISOString()
            });
            this.saveTrainingLog();

            return {
                success: true,
                message: `✅ Entry approved and merged into unified_game_data.json`
            };
        }

        return { success: false, message: 'Failed to save changes' };
    }

    // Reject pending entry
    rejectPendingEntry(entryId, reason) {
        const entryIndex = this.pendingReviews.findIndex(e => e.id === entryId);
        if (entryIndex === -1) {
            return { success: false, message: 'Entry not found' };
        }

        const entry = this.pendingReviews[entryIndex];
        entry.status = 'rejected';
        entry.rejectionReason = reason;
        entry.rejectedAt = new Date().toISOString();

        // Move to training log
        this.trainingLog.entries.push({
            ...entry,
            action: 'rejected'
        });
        this.saveTrainingLog();

        // Remove from pending
        this.pendingReviews.splice(entryIndex, 1);
        this.savePendingReviews();

        return {
            success: true,
            message: `Entry rejected: ${reason}`
        };
    }

    // Get pending reviews
    getPendingReviews() {
        return this.pendingReviews;
    }

    // Get training stats
    getStats() {
        const totalEntries = this.trainingLog.entries.length;
        const approved = this.trainingLog.entries.filter(e => e.action === 'approved_and_merged').length;
        const rejected = this.trainingLog.entries.filter(e => e.action === 'rejected').length;
        const pending = this.pendingReviews.length;
        const totalFeedback = Object.keys(this.trainingLog.feedback).length;
        const positiveFeedback = Object.values(this.trainingLog.feedback).filter(f => f.rating === 'thumbs_up').length;

        return {
            totalEntries,
            approved,
            rejected,
            pending,
            totalFeedback,
            positiveFeedback,
            negativeFeedback: totalFeedback - positiveFeedback
        };
    }
}

module.exports = TrainingSystem;

// CLI mode
if (require.main === module) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const training = new TrainingSystem();

    console.log('\n🎓 Training System - Interactive Mode\n');
    console.log('Available commands:');
    console.log('  1. Add training data');
    console.log('  2. View pending reviews');
    console.log('  3. Approve pending entry');
    console.log('  4. Reject pending entry');
    console.log('  5. View stats');
    console.log('  6. Exit\n');

    function prompt(question) {
        return new Promise(resolve => rl.question(question, resolve));
    }

    async function mainMenu() {
        const choice = await prompt('Choose option (1-6): ');

        switch (choice) {
            case '1':
                await addTrainingData();
                break;
            case '2':
                viewPendingReviews();
                break;
            case '3':
                await approveEntry();
                break;
            case '4':
                await rejectEntry();
                break;
            case '5':
                viewStats();
                break;
            case '6':
                console.log('\n👋 Goodbye!\n');
                rl.close();
                process.exit(0);
                return;
            default:
                console.log('Invalid choice');
        }

        await mainMenu();
    }

    async function addTrainingData() {
        console.log('\n📝 Add Training Data\n');
        const category = await prompt('Category (weapons/characters/runes/gear_sets/game_modes): ');
        const topic = await prompt('Topic (e.g., claw, thor, meteor): ');
        const information = await prompt('Information: ');

        const result = training.addTraining(category, topic, information, 'cli-user', 'CLI User');
        console.log('\n' + result.message + '\n');
    }

    function viewPendingReviews() {
        console.log('\n📋 Pending Reviews\n');
        const pending = training.getPendingReviews();
        
        if (pending.length === 0) {
            console.log('No pending reviews.\n');
            return;
        }

        pending.forEach((entry, index) => {
            console.log(`${index + 1}. ID: ${entry.id}`);
            console.log(`   Category: ${entry.category}`);
            console.log(`   Topic: ${entry.topic}`);
            console.log(`   Info: ${entry.information.substring(0, 60)}...`);
            console.log(`   By: ${entry.username} at ${entry.timestamp}\n`);
        });
    }

    async function approveEntry() {
        console.log('\n✅ Approve Entry\n');
        const entryId = await prompt('Entry ID to approve: ');
        const result = training.approvePendingEntry(entryId);
        console.log('\n' + result.message + '\n');
    }

    async function rejectEntry() {
        console.log('\n❌ Reject Entry\n');
        const entryId = await prompt('Entry ID to reject: ');
        const reason = await prompt('Rejection reason: ');
        const result = training.rejectPendingEntry(entryId, reason);
        console.log('\n' + result.message + '\n');
    }

    function viewStats() {
        console.log('\n📊 Training Stats\n');
        const stats = training.getStats();
        console.log(`Total entries: ${stats.totalEntries}`);
        console.log(`Approved: ${stats.approved}`);
        console.log(`Rejected: ${stats.rejected}`);
        console.log(`Pending: ${stats.pending}`);
        console.log(`Total feedback: ${stats.totalFeedback}`);
        console.log(`Positive: ${stats.positiveFeedback}`);
        console.log(`Negative: ${stats.negativeFeedback}\n`);
    }

    mainMenu();
}

