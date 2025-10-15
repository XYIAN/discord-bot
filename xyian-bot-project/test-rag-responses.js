#!/usr/bin/env node
/**
 * Test script to verify Working RAG System responses
 */

const WorkingRAGSystem = require('./working-rag-system');

console.log('🧪 Testing Working RAG System...\n');

// Initialize RAG system
let ragSystem;
try {
    ragSystem = new WorkingRAGSystem();
    console.log('✅ RAG System initialized successfully\n');
} catch (error) {
    console.error('❌ Failed to initialize RAG System:', error.message);
    process.exit(1);
}

// Test queries
const testQueries = [
    "What's the best gear set?",
    "Tell me about meteor runes",
    "How do I build Thor?",
    "What's the best PvP setup?",
    "Tell me about Otta",
    "What weapon should I use?",
    "Best runes for Shackled Jungle?",
    "Griffin vs Oracle gear?",
    "How many stars does Otta need?",
    "What's the current PvP meta?"
];

console.log('📝 Running test queries...\n');
console.log('='.repeat(80));

testQueries.forEach((query, index) => {
    console.log(`\n\n🔍 TEST ${index + 1}: "${query}"`);
    console.log('-'.repeat(80));
    
    const response = ragSystem.generateResponse(query, 'TestUser');
    
    if (response) {
        console.log(response);
    } else {
        console.log('❌ No response generated');
    }
    
    console.log('-'.repeat(80));
});

// Display stats
console.log('\n\n📊 RAG System Statistics:');
console.log('='.repeat(80));
const stats = ragSystem.getStats();
console.log(`Gear Sets: ${stats.gear_sets}`);
console.log(`Runes: ${stats.runes}`);
console.log(`Characters: ${stats.characters}`);
console.log(`Weapons: ${stats.weapons}`);
console.log(`Game Modes: ${stats.game_modes}`);
console.log(`Total Entries: ${stats.total}`);
console.log('='.repeat(80));

console.log('\n✅ All tests completed!');

