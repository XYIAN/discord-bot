require('dotenv').config();

console.log('🔍 Token Validation Script');
console.log('==========================');
console.log('Token length:', process.env.DISCORD_TOKEN?.length || 'Not found');
console.log('Token starts with:', process.env.DISCORD_TOKEN?.substring(0, 10) || 'Not found');
console.log('Token ends with:', process.env.DISCORD_TOKEN?.substring(-10) || 'Not found');
console.log('Token format check:', /^[A-Za-z0-9._-]+$/.test(process.env.DISCORD_TOKEN || '') ? '✅ Valid format' : '❌ Invalid format');

// Check if token has the right structure
const token = process.env.DISCORD_TOKEN;
if (token) {
    const parts = token.split('.');
    console.log('Token parts:', parts.length);
    console.log('Part 1 length:', parts[0]?.length || 0);
    console.log('Part 2 length:', parts[1]?.length || 0);
    console.log('Part 3 length:', parts[2]?.length || 0);
    
    if (parts.length === 3) {
        console.log('✅ Token has correct structure (3 parts)');
    } else {
        console.log('❌ Token has incorrect structure (should have 3 parts)');
    }
} else {
    console.log('❌ No token found in environment');
}
