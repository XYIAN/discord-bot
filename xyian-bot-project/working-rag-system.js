#!/usr/bin/env node
/**
 * WORKING RAG System - Uses REAL structured game data
 * No more Discord chat noise - only actual game facts
 */

const fs = require('fs');
const path = require('path');

class WorkingRAGSystem {
    constructor() {
        this.dataPath = path.join(__dirname, 'data', 'real-structured-data', 'unified_game_data.json');
        this.gameData = this.loadGameData();
        
        console.log('✅ Working RAG System initialized with REAL game data');
        console.log(`📊 Categories: ${Object.keys(this.gameData).length}`);
    }

    loadGameData() {
        try {
            const content = fs.readFileSync(this.dataPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('❌ Error loading game data:', error.message);
            return {};
        }
    }

    search(query) {
        const queryLower = query.toLowerCase();
        const results = [];
        
        // Search gear sets
        if (queryLower.includes('gear') || queryLower.includes('set') || queryLower.includes('oracle') || 
            queryLower.includes('dragoon') || queryLower.includes('griffin') || queryLower.includes('mixed') ||
            queryLower.includes('armor') || queryLower.includes('equipment')) {
            
            Object.entries(this.gameData.gear_sets || {}).forEach(([name, data]) => {
                if (queryLower.includes(name.toLowerCase())) {
                    results.push({
                        type: 'gear_set',
                        name: name,
                        data: data,
                        score: 10
                    });
                }
            });
            
            // If no specific gear found but asking about gear generally
            if (results.length === 0 && (queryLower.includes('best gear') || queryLower.includes('gear set'))) {
                results.push({
                    type: 'gear_set',
                    name: 'mixed_set',
                    data: this.gameData.gear_sets.mixed_set,
                    score: 8
                });
            }
        }
        
        // Search runes
        if (queryLower.includes('rune') || queryLower.includes('meteor') || queryLower.includes('sprite') || 
            queryLower.includes('circle') || queryLower.includes('frost') || queryLower.includes('elemental') ||
            queryLower.includes('etched')) {
            
            Object.entries(this.gameData.runes || {}).forEach(([name, data]) => {
                if (queryLower.includes(name.toLowerCase())) {
                    results.push({
                        type: 'rune',
                        name: name,
                        data: data,
                        score: 10
                    });
                }
            });
        }
        
        // Search characters
        if (queryLower.includes('character') || queryLower.includes('hero') || queryLower.includes('thor') || 
            queryLower.includes('otta') || queryLower.includes('helix') || queryLower.includes('atreus') ||
            queryLower.includes('build') || queryLower.includes('dk') || queryLower.includes('loki') ||
            queryLower.includes('rolla')) {
            
            Object.entries(this.gameData.characters || {}).forEach(([name, data]) => {
                if (queryLower.includes(name.toLowerCase())) {
                    results.push({
                        type: 'character',
                        name: name,
                        data: data,
                        score: 10
                    });
                }
            });
        }
        
        // Search weapons
        if (queryLower.includes('weapon') || queryLower.includes('crossbow') || queryLower.includes('xbow') || 
            queryLower.includes('bow') || queryLower.includes('staff') || queryLower.includes('spear') ||
            queryLower.includes('claw') || queryLower.includes('scythe')) {
            
            Object.entries(this.gameData.weapons || {}).forEach(([name, data]) => {
                if (queryLower.includes(name.toLowerCase()) || queryLower.includes(data.aka || '')) {
                    results.push({
                        type: 'weapon',
                        name: name,
                        data: data,
                        score: 10
                    });
                }
            });
            
            // Special handling: if asking about "best pvp weapon", return all top PVP weapons
            if ((queryLower.includes('best') || queryLower.includes('top')) && queryLower.includes('pvp') && queryLower.includes('weapon')) {
                // Add all S-tier and A-tier PVP weapons
                ['claw', 'crossbow', 'bow'].forEach(weaponName => {
                    const weaponData = this.gameData.weapons[weaponName];
                    if (weaponData && !results.find(r => r.name === weaponName)) {
                        results.push({
                            type: 'weapon',
                            name: weaponName,
                            data: weaponData,
                            score: 10
                        });
                    }
                });
            }
        }
        
        // Search game modes
        if (queryLower.includes('pvp') || queryLower.includes('arena') || queryLower.includes('peak') || 
            queryLower.includes('guild') || queryLower.includes('gvg') || queryLower.includes('shackled') ||
            queryLower.includes('jungle') || queryLower.includes('expedition')) {
            
            Object.entries(this.gameData.game_modes || {}).forEach(([name, data]) => {
                if (queryLower.includes(name.replace('_', ' ')) || 
                    (data.aka && queryLower.includes(data.aka.toLowerCase()))) {
                    results.push({
                        type: 'game_mode',
                        name: name,
                        data: data,
                        score: 9
                    });
                }
            });
        }
        
        // Return sorted results
        return results.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    generateResponse(query, username = 'User') {
        const results = this.search(query);
        
        if (results.length === 0) {
            return `Hey ${username}! I don't have specific info about "${query}". Try asking about gear sets, runes, characters, weapons, or game modes! 🎮`;
        }
        
        let response = `Hey ${username}! Here's what I know about "${query}":\n\n`;
        
        results.forEach((result, index) => {
            response += `**${index + 1}. ${result.name.toUpperCase().replace('_', ' ')} (${result.type.replace('_', ' ')})**\n`;
            
            switch (result.type) {
                case 'gear_set':
                    response += this.formatGearSet(result.data);
                    break;
                case 'rune':
                    response += this.formatRune(result.data);
                    break;
                case 'character':
                    response += this.formatCharacter(result.data);
                    break;
                case 'weapon':
                    response += this.formatWeapon(result.data);
                    break;
                case 'game_mode':
                    response += this.formatGameMode(result.data);
                    break;
            }
            
            response += '\n';
        });
        
        response += `\n💡 **Need more help?** Ask about specific gear, runes, characters, or strategies!`;
        
        return response;
    }

    formatGearSet(data) {
        let text = `📊 **Description:** ${data.description}\n`;
        
        if (data.pieces) {
            text += `⚔️ **Pieces:**\n`;
            Object.entries(data.pieces).forEach(([slot, piece]) => {
                text += `  • ${slot}: ${piece}\n`;
            });
        }
        
        if (data.best_pieces) {
            text += `⚔️ **Best Pieces:** ${data.best_pieces.join(', ')}\n`;
        }
        
        if (data.use_cases) {
            text += `🎯 **Best For:** ${data.use_cases.join(', ')}\n`;
        }
        
        if (data.note) {
            text += `💡 **Pro Tip:** ${data.note}\n`;
        }
        
        return text;
    }

    formatRune(data) {
        let text = `🔮 **Type:** ${data.type}\n`;
        text += `⚡ **Effect:** ${data.effect}\n`;
        
        if (data.best_for) {
            text += `🎯 **Best For:** ${data.best_for.join(', ')}\n`;
        }
        
        if (data.etched) {
            text += `✨ **Etched:** ${data.etched}\n`;
        }
        
        if (data.combinations) {
            text += `🔗 **Combos:** ${data.combinations.join(', ')}\n`;
        }
        
        if (data.note) {
            text += `💡 **Pro Tip:** ${data.note}\n`;
        }
        
        return text;
    }

    formatCharacter(data) {
        let text = `👤 **Role:** ${data.role}\n`;
        
        if (data.stars_needed) {
            if (typeof data.stars_needed === 'object') {
                text += `⭐ **Stars:**\n`;
                Object.entries(data.stars_needed).forEach(([star, desc]) => {
                    text += `  • ${star}: ${desc}\n`;
                });
            } else {
                text += `⭐ **Stars:** ${data.stars_needed}\n`;
            }
        }
        
        if (data.best_for) {
            text += `🎯 **Best For:** ${data.best_for.join(', ')}\n`;
        }
        
        if (data.skins) {
            text += `🎨 **Skins Info:**\n`;
            Object.entries(data.skins).forEach(([key, value]) => {
                text += `  • ${key}: ${value}\n`;
            });
        }
        
        if (data.note) {
            text += `💡 **Pro Tip:** ${data.note}\n`;
        }
        
        return text;
    }

    formatWeapon(data) {
        let text = `⚔️ **Type:** ${data.type || 'weapon'}\n`;
        
        if (data.aka) {
            text += `📝 **Also Known As:** ${data.aka}\n`;
        }
        
        if (data.pvp_rating) {
            text += `🏆 **PVP Rating:** ${data.pvp_rating}\n`;
        }
        
        if (data.gear_set) {
            text += `🛡️ **Gear Set:** ${data.gear_set}\n`;
        }
        
        if (data.best_for) {
            text += `🎯 **Best For:** ${data.best_for.join(', ')}\n`;
        }
        
        if (data.combinations) {
            text += `🔗 **Combos:** ${data.combinations.join(', ')}\n`;
        }
        
        if (data.priority) {
            text += `⚠️ **Priority:** ${data.priority}\n`;
        }
        
        if (data.note) {
            text += `💡 **Pro Tip:** ${data.note}\n`;
        }
        
        return text;
    }

    formatGameMode(data) {
        let text = '';
        
        if (data.aka) {
            text += `📝 **Also Known As:** ${data.aka}\n`;
        }
        
        if (data.best_build) {
            text += `🏆 **Best Build:**\n`;
            Object.entries(data.best_build).forEach(([key, value]) => {
                text += `  • ${key}: ${value}\n`;
            });
        }
        
        if (data.best_builds) {
            text += `🏆 **Best Builds:**\n`;
            Object.entries(data.best_builds).forEach(([key, value]) => {
                text += `  • ${key}: ${value}\n`;
            });
        }
        
        if (data.note) {
            text += `💡 **Pro Tip:** ${data.note}\n`;
        }
        
        return text;
    }

    getStats() {
        return {
            gear_sets: Object.keys(this.gameData.gear_sets || {}).length,
            runes: Object.keys(this.gameData.runes || {}).length,
            characters: Object.keys(this.gameData.characters || {}).length,
            weapons: Object.keys(this.gameData.weapons || {}).length,
            game_modes: Object.keys(this.gameData.game_modes || {}).length,
            total: Object.keys(this.gameData.gear_sets || {}).length +
                   Object.keys(this.gameData.runes || {}).length +
                   Object.keys(this.gameData.characters || {}).length +
                   Object.keys(this.gameData.weapons || {}).length +
                   Object.keys(this.gameData.game_modes || {}).length
        };
    }
}

module.exports = WorkingRAGSystem;



