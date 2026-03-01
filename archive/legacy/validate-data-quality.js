#!/usr/bin/env node
/**
 * Data Quality Validation Script
 * Checks unified_game_data.json for Discord chatter, usernames, timestamps, and other noise
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class DataQualityValidator {
    constructor() {
        this.dataPath = path.join(__dirname, 'data', 'real-structured-data', 'unified_game_data.json');
        this.issues = [];
        this.warnings = [];
        this.stats = {
            totalEntries: 0,
            categoriesChecked: 0,
            issuesFound: 0,
            warningsFound: 0
        };
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    loadData() {
        try {
            const content = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            this.log(`❌ Error loading data: ${error.message}`, 'red');
            process.exit(1);
        }
    }

    // Check for Discord usernames and handles
    checkForUsernames(text, location) {
        const usernamePatterns = [
            /\b(Senior|Junior|Elite|Legendary|Master)\s+(Archer|Warrior|Mage)\b/gi,
            /\b[A-Z][a-z]+\d{2,}/g, // Names with numbers like "User123"
            /@\w+/g, // @mentions
            /\bMOD\b/gi,
            /\bBooster\b/gi,
        ];

        usernamePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                this.issues.push({
                    location,
                    type: 'USERNAME',
                    message: `Possible Discord username detected: "${matches[0]}"`,
                    severity: 'high'
                });
            }
        });
    }

    // Check for timestamps
    checkForTimestamps(text, location) {
        const timestampPatterns = [
            /\d{1,2}:\d{2}\s*(AM|PM)/gi,
            /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
            /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d+,?\s+\d{4}/gi,
            /at\s+\d{1,2}:\d{2}/gi
        ];

        timestampPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                this.issues.push({
                    location,
                    type: 'TIMESTAMP',
                    message: `Timestamp detected: "${matches[0]}"`,
                    severity: 'high'
                });
            }
        });
    }

    // Check for chat noise
    checkForChatNoise(text, location) {
        const noisePatterns = [
            /\(edited\)/gi,
            /\breply\b.*\bto\b.*\bmessage\b/gi,
            /\blets do it in DMs\b/gi,
            /\bthanks.*helpful\b/gi
        ];

        noisePatterns.forEach(pattern => {
            if (pattern.test(text)) {
                this.issues.push({
                    location,
                    type: 'CHAT_NOISE',
                    message: `Chat noise detected in text`,
                    severity: 'medium'
                });
            }
        });
    }

    // Check for incomplete sentences (only flag obvious fragments)
    checkForIncompleteSentences(text, location) {
        // Only flag if it looks like a chat fragment (starts lowercase, has ellipsis at start, etc)
        if (text.length > 30 && text.length < 150) {
            // Flag if starts with lowercase and contains chat indicators
            if (text.match(/^[a-z]/) && text.match(/(said|asked|told|mentioned)/)) {
                this.warnings.push({
                    location,
                    type: 'INCOMPLETE',
                    message: `Possible chat fragment: "${text.substring(0, 50)}..."`,
                    severity: 'low'
                });
            }
            // Flag if ends with incomplete thought indicators
            if (text.match(/\s(or|and|but|if|when|with|for|to|in|at)$/i)) {
                this.warnings.push({
                    location,
                    type: 'INCOMPLETE',
                    message: `Sentence may be cut off: "${text.substring(0, 50)}..."`,
                    severity: 'low'
                });
            }
        }
    }

    // Check for proper structure
    checkStructure(data) {
        const requiredCategories = ['gear_sets', 'runes', 'characters', 'weapons', 'game_modes', 'tips'];
        
        requiredCategories.forEach(category => {
            if (!data[category]) {
                this.issues.push({
                    location: 'root',
                    type: 'STRUCTURE',
                    message: `Missing required category: ${category}`,
                    severity: 'high'
                });
            }
        });

        // Check weapons for PVP ratings
        if (data.weapons) {
            ['claw', 'crossbow', 'bow'].forEach(weapon => {
                if (data.weapons[weapon]) {
                    if (!data.weapons[weapon].pvp_rating) {
                        this.warnings.push({
                            location: `weapons.${weapon}`,
                            type: 'MISSING_FIELD',
                            message: `Missing pvp_rating for ${weapon}`,
                            severity: 'low'
                        });
                    }
                    if (!data.weapons[weapon].best_for || data.weapons[weapon].best_for.length === 0) {
                        this.warnings.push({
                            location: `weapons.${weapon}`,
                            type: 'MISSING_FIELD',
                            message: `Missing or empty best_for array for ${weapon}`,
                            severity: 'low'
                        });
                    }
                }
            });
        }
    }

    // Validate a text value
    validateText(text, location) {
        if (typeof text !== 'string') return;
        
        this.checkForUsernames(text, location);
        this.checkForTimestamps(text, location);
        this.checkForChatNoise(text, location);
        this.checkForIncompleteSentences(text, location);
    }

    // Recursively validate all text in data
    validateObject(obj, path = 'root') {
        this.stats.totalEntries++;

        if (typeof obj === 'string') {
            this.validateText(obj, path);
        } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.validateObject(item, `${path}[${index}]`);
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                this.validateObject(value, `${path}.${key}`);
            });
        }
    }

    // Generate report
    generateReport() {
        this.log('\n' + '='.repeat(80), 'cyan');
        this.log('📊 DATA QUALITY VALIDATION REPORT', 'bright');
        this.log('='.repeat(80), 'cyan');

        // Stats
        this.log('\n📈 Statistics:', 'blue');
        this.log(`  Total entries checked: ${this.stats.totalEntries}`);
        this.log(`  Categories: ${this.stats.categoriesChecked}`);
        this.log(`  Issues found: ${this.stats.issuesFound}`, this.stats.issuesFound > 0 ? 'red' : 'green');
        this.log(`  Warnings found: ${this.stats.warningsFound}`, this.stats.warningsFound > 0 ? 'yellow' : 'green');

        // Issues
        if (this.issues.length > 0) {
            this.log('\n❌ ISSUES (Must Fix):', 'red');
            const highIssues = this.issues.filter(i => i.severity === 'high');
            const mediumIssues = this.issues.filter(i => i.severity === 'medium');

            if (highIssues.length > 0) {
                this.log('\n  🔴 High Severity:', 'red');
                highIssues.forEach(issue => {
                    this.log(`    ${issue.location}: ${issue.message}`, 'red');
                });
            }

            if (mediumIssues.length > 0) {
                this.log('\n  🟠 Medium Severity:', 'yellow');
                mediumIssues.forEach(issue => {
                    this.log(`    ${issue.location}: ${issue.message}`, 'yellow');
                });
            }
        } else {
            this.log('\n✅ No critical issues found!', 'green');
        }

        // Warnings
        if (this.warnings.length > 0) {
            this.log('\n⚠️  WARNINGS (Should Review):', 'yellow');
            this.warnings.slice(0, 10).forEach(warning => {
                this.log(`  ${warning.location}: ${warning.message}`, 'yellow');
            });
            if (this.warnings.length > 10) {
                this.log(`  ... and ${this.warnings.length - 10} more warnings`, 'yellow');
            }
        } else {
            this.log('\n✅ No warnings!', 'green');
        }

        // Quality score
        const maxScore = 100;
        const issueDeduction = this.stats.issuesFound * 10;
        const warningDeduction = this.stats.warningsFound * 2;
        const qualityScore = Math.max(0, maxScore - issueDeduction - warningDeduction);

        this.log('\n' + '='.repeat(80), 'cyan');
        this.log(`🎯 QUALITY SCORE: ${qualityScore}/100`, qualityScore >= 90 ? 'green' : qualityScore >= 70 ? 'yellow' : 'red');
        this.log('='.repeat(80), 'cyan');

        if (qualityScore >= 90) {
            this.log('\n🎉 Excellent data quality! Ready for production.', 'green');
        } else if (qualityScore >= 70) {
            this.log('\n⚠️  Good data quality, but some improvements recommended.', 'yellow');
        } else {
            this.log('\n❌ Poor data quality. Please fix issues before deployment.', 'red');
        }

        this.log('\n');

        return qualityScore;
    }

    // Main validation function
    validate() {
        this.log('\n🔍 Loading data from unified_game_data.json...', 'cyan');
        const data = this.loadData();

        this.log('✅ Data loaded successfully', 'green');
        this.log(`📊 Found ${Object.keys(data).length} categories\n`, 'blue');

        // Check structure first
        this.log('🔍 Checking data structure...', 'cyan');
        this.checkStructure(data);
        this.stats.categoriesChecked = Object.keys(data).length;

        // Validate all content
        this.log('🔍 Validating content quality...', 'cyan');
        this.validateObject(data);

        // Update stats
        this.stats.issuesFound = this.issues.length;
        this.stats.warningsFound = this.warnings.length;

        // Generate and display report
        const score = this.generateReport();

        // Exit with error if quality is too low
        if (score < 70) {
            process.exit(1);
        }

        process.exit(0);
    }
}

// Run validation
if (require.main === module) {
    const validator = new DataQualityValidator();
    validator.validate();
}

module.exports = DataQualityValidator;

