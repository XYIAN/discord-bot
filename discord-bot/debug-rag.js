#!/usr/bin/env node

// Debug script to check RAG system data

const UltimateRAGSystem = require('./ultimate-rag-system');

const rag = new UltimateRAGSystem();

console.log('🔍 Debugging RAG System...');
console.log('========================');

// Check a few entries from different categories
const categories = ['dragoon_guides', 'boss_guides', 'upgrade_requirements'];
categories.forEach(category => {
    console.log(`\n📂 Category: ${category}`);
    const entries = Object.entries(rag.knowledgeBase).filter(([key, entry]) => entry.category === category);
    console.log(`Found ${entries.length} entries`);
    
    if (entries.length > 0) {
        console.log('First entry:');
        console.log(entries[0][1].content.substring(0, 200) + '...');
    }
});

// Test search specifically
console.log('\n🔍 Testing search for "dragoon":');
const results = rag.searchKnowledge('dragoon', null, 3);
console.log(`Found ${results.length} results`);
results.forEach((result, index) => {
    console.log(`\nResult ${index + 1}:`);
    console.log(`Category: ${result.category}`);
    console.log(`Score: ${result.score}`);
    console.log(`Content: ${result.content.substring(0, 150)}...`);
});