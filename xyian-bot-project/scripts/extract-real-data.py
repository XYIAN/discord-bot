#!/usr/bin/env python3
"""
Extract REAL structured game data from raw Discord messages
Remove all chat noise and create clean tables
"""

import json
import re
from pathlib import Path
from collections import defaultdict

class RealDataExtractor:
    def __init__(self):
        self.gear_sets = {
            'oracle': {'bonuses': {}, 'pieces': [], 'description': ''},
            'dragoon': {'bonuses': {}, 'pieces': [], 'description': ''},
            'guardian': {'bonuses': {}, 'pieces': [], 'description': ''},
            'shadow': {'bonuses': {}, 'pieces': [], 'description': ''},
            'lucky': {'bonuses': {}, 'pieces': [], 'description': ''}
        }
        
        self.runes = {
            'meteor': {'effect': '', 'type': '', 'stats': {}},
            'frost': {'effect': '', 'type': '', 'stats': {}},
            'flame': {'effect': '', 'type': '', 'stats': {}},
            'lightning': {'effect': '', 'type': '', 'stats': {}},
            'poison': {'effect': '', 'type': '', 'stats': {}},
            'holy': {'effect': '', 'type': '', 'stats': {}},
            'dark': {'effect': '', 'type': '', 'stats': {}},
            'wind': {'effect': '', 'type': '', 'stats': {}}
        }
        
        self.characters = {
            'thor': {'role': '', 'abilities': [], 'best_for': []},
            'otta': {'role': '', 'abilities': [], 'best_for': []},
            'helix': {'role': '', 'abilities': [], 'best_for': []},
            'shade': {'role': '', 'abilities': [], 'best_for': []},
            'ayana': {'role': '', 'abilities': [], 'best_for': []},
            'loki': {'role': '', 'abilities': [], 'best_for': []},
            'sylvan': {'role': '', 'abilities': [], 'best_for': []},
            'meowgik': {'role': '', 'abilities': [], 'best_for': []}
        }
        
        self.weapons = {
            'bow': {'damage': '', 'type': 'ranged', 'best_for': []},
            'crossbow': {'damage': '', 'type': 'ranged', 'best_for': []},
            'staff': {'damage': '', 'type': 'magic', 'best_for': []},
            'scythe': {'damage': '', 'type': 'melee', 'best_for': []},
            'blade': {'damage': '', 'type': 'melee', 'best_for': []}
        }
        
    def load_raw_data(self, data_dir):
        """Load all raw JSON files"""
        raw_texts = []
        data_path = Path(data_dir)
        
        for json_file in data_path.glob('**/*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        for key, value in data.items():
                            if isinstance(value, list):
                                raw_texts.extend(value)
                            elif isinstance(value, dict):
                                for subkey, subvalue in value.items():
                                    if isinstance(subvalue, list):
                                        raw_texts.extend(subvalue)
            except Exception as e:
                print(f"Error loading {json_file}: {e}")
                
        return raw_texts
    
    def extract_gear_data(self, texts):
        """Extract actual gear set bonuses and pieces"""
        for text in texts:
            if not isinstance(text, str):
                continue
                
            text_lower = text.lower()
            
            # Extract gear set bonuses
            if '2-piece' in text_lower or '4-piece' in text_lower:
                for gear_name in self.gear_sets.keys():
                    if gear_name in text_lower:
                        # Extract bonus info
                        bonus_match = re.search(r'(\d+)%?\s*(attack|hp|crit|damage)', text_lower)
                        if bonus_match:
                            value = bonus_match.group(1)
                            stat = bonus_match.group(2)
                            if '2-piece' in text_lower:
                                self.gear_sets[gear_name]['bonuses']['2_piece'] = f"+{value}% {stat}"
                            elif '4-piece' in text_lower:
                                self.gear_sets[gear_name]['bonuses']['4_piece'] = f"+{value}% {stat}"
            
            # Extract gear recommendations
            for gear_name in self.gear_sets.keys():
                if gear_name in text_lower:
                    if 'pvp' in text_lower or 'arena' in text_lower:
                        if 'PvP' not in self.gear_sets[gear_name]['description']:
                            self.gear_sets[gear_name]['description'] += 'Good for PvP. '
                    if 'pve' in text_lower or 'boss' in text_lower:
                        if 'PvE' not in self.gear_sets[gear_name]['description']:
                            self.gear_sets[gear_name]['description'] += 'Good for PvE. '
    
    def extract_rune_data(self, texts):
        """Extract rune effects and mechanics"""
        for text in texts:
            if not isinstance(text, str):
                continue
                
            text_lower = text.lower()
            
            for rune_name in self.runes.keys():
                if rune_name in text_lower:
                    # Extract damage percentages
                    dmg_match = re.search(r'(\d+)%?\s*damage', text_lower)
                    if dmg_match:
                        self.runes[rune_name]['stats']['damage'] = f"{dmg_match.group(1)}%"
                    
                    # Extract effects
                    if 'slow' in text_lower:
                        self.runes[rune_name]['effect'] = 'Slows enemies'
                    if 'burn' in text_lower or 'dot' in text_lower:
                        self.runes[rune_name]['effect'] = 'Damage over time'
                    if 'aoe' in text_lower or 'area' in text_lower:
                        self.runes[rune_name]['effect'] = 'Area damage'
                    if 'stun' in text_lower or 'freeze' in text_lower:
                        self.runes[rune_name]['effect'] = 'Crowd control'
    
    def extract_character_data(self, texts):
        """Extract character abilities and uses"""
        for text in texts:
            if not isinstance(text, str):
                continue
                
            text_lower = text.lower()
            
            for char_name in self.characters.keys():
                if char_name in text_lower:
                    # Extract role
                    if 'tank' in text_lower:
                        self.characters[char_name]['role'] = 'Tank'
                    elif 'dps' in text_lower or 'damage' in text_lower:
                        self.characters[char_name]['role'] = 'DPS'
                    elif 'support' in text_lower:
                        self.characters[char_name]['role'] = 'Support'
                    
                    # Extract best for
                    if 'pvp' in text_lower or 'arena' in text_lower:
                        if 'PvP' not in self.characters[char_name]['best_for']:
                            self.characters[char_name]['best_for'].append('PvP')
                    if 'pve' in text_lower or 'boss' in text_lower:
                        if 'PvE' not in self.characters[char_name]['best_for']:
                            self.characters[char_name]['best_for'].append('PvE')
                    if 'guild' in text_lower:
                        if 'Guild Battles' not in self.characters[char_name]['best_for']:
                            self.characters[char_name]['best_for'].append('Guild Battles')
    
    def save_structured_data(self, output_dir):
        """Save clean structured data"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save gear sets
        with open(output_path / 'gear_sets_clean.json', 'w') as f:
            json.dump(self.gear_sets, f, indent=2)
        
        # Save runes
        with open(output_path / 'runes_clean.json', 'w') as f:
            json.dump(self.runes, f, indent=2)
        
        # Save characters
        with open(output_path / 'characters_clean.json', 'w') as f:
            json.dump(self.characters, f, indent=2)
        
        # Save weapons
        with open(output_path / 'weapons_clean.json', 'w') as f:
            json.dump(self.weapons, f, indent=2)
        
        print(f"\n✅ Saved structured data to {output_path}")
        print(f"📊 Gear Sets: {len(self.gear_sets)}")
        print(f"🔮 Runes: {len(self.runes)}")
        print(f"👥 Characters: {len(self.characters)}")
        print(f"⚔️ Weapons: {len(self.weapons)}")

if __name__ == '__main__':
    extractor = RealDataExtractor()
    
    print("🔍 Loading raw data...")
    raw_data = extractor.load_raw_data('../data/comprehensive-knowledge-base')
    print(f"✅ Loaded {len(raw_data)} raw entries")
    
    print("\n🧹 Extracting structured data...")
    extractor.extract_gear_data(raw_data)
    extractor.extract_rune_data(raw_data)
    extractor.extract_character_data(raw_data)
    
    print("\n💾 Saving clean structured data...")
    extractor.save_structured_data('../data/structured-clean')
    
    print("\n✅ DONE! Real structured data extracted.")



