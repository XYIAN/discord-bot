#!/usr/bin/env python3
"""
Comprehensive Data Extractor for Archero 2 Bot
Extracts structured data from scraped Discord, Wiki, and Reddit content
"""

import json
import re
import pandas as pd
import os
from pathlib import Path
from collections import defaultdict
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ArcheroDataExtractor:
    def __init__(self, data_dir="../data/comprehensive-knowledge-base"):
        self.data_dir = Path(data_dir)
        self.raw_data_dir = Path("raw-scraped-data")
        
        # Data buckets for structured information
        self.rune_data = defaultdict(list)
        self.gear_data = defaultdict(list)
        self.character_data = defaultdict(list)
        self.upgrade_materials = defaultdict(list)
        self.stats_data = defaultdict(list)
        self.build_data = defaultdict(list)
        self.event_data = defaultdict(list)
        
        # Pattern definitions for extraction
        self.patterns = {
            'runes': [
                r'(\w+)\s+rune',
                r'rune[:\s]+(\w+)',
                r'(\w+)\s+etched',
                r'etched\s+(\w+)',
                r'(\w+)\s+circle',
                r'circle\s+(\w+)',
                r'(\w+)\s+meteor',
                r'meteor\s+(\w+)',
                r'(\w+)\s+sprite',
                r'sprite\s+(\w+)',
                r'(\w+)\s+elemental',
                r'elemental\s+(\w+)'
            ],
            'gear': [
                r'(\w+)\s+(?:crossbow|spear|staff|bow)',
                r'(\w+)\s+(?:amulet|necklace)',
                r'(\w+)\s+(?:ring|band)',
                r'(\w+)\s+(?:chest|armor|plate)',
                r'(\w+)\s+(?:boots|shoes)',
                r'(\w+)\s+(?:helmet|helm|hat)',
                r'(\w+)\s+(?:gloves|gauntlets)',
                r'(\w+)\s+(?:belt|waist)'
            ],
            'stats': [
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:crit|critical)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:damage|dmg)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:attack|atk)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:defense|def)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:health|hp)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:speed|spd)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:dodge)',
                r'(\d+(?:\.\d+)?)\s*%?\s*(?:block)'
            ],
            'costs': [
                r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gems?|gem)',
                r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gold|g)',
                r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:coins?|coin)',
                r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lures?|lure)',
                r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:kg|kilograms?)',
                r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:xp|experience)'
            ],
            'materials': [
                r'(\d+)\s*(\w+(?:\s+\w+)*)\s*(?:shards?|fragments?)',
                r'(\d+)\s*(\w+(?:\s+\w+)*)\s*(?:cores?|essence)',
                r'(\d+)\s*(\w+(?:\s+\w+)*)\s*(?:stones?|crystals?)',
                r'(\d+)\s*(\w+(?:\s+\w+)*)\s*(?:dust|powder)',
                r'(\d+)\s*(\w+(?:\s+\w+)*)\s*(?:keys?|tokens?)'
            ]
        }
        
        # Known gear sets
        self.gear_sets = ['oracle', 'dragoon', 'griffin', 'chromatic', 'mythic', 'legendary', 'epic', 'rare']
        
        # Known rune types
        self.rune_types = ['meteor', 'sprite', 'elemental', 'etched', 'circle', 'potion', 'sword', 'shield', 'freeze', 'fire', 'ice', 'lightning']
        
        # Known characters
        self.characters = ['thor', 'otta', 'helix', 'drac', 'rolla', 'loki', 'atreyus', 'nyanja', 'dracoola']

    def load_all_data(self):
        """Load all scraped data from various sources"""
        logger.info("Loading all scraped data...")
        
        all_data = []
        
        # Load from knowledge base
        if self.data_dir.exists():
            for file_path in self.data_dir.glob("*.json"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, dict) and 'data' in data:
                            all_data.extend(data['data'])
                        elif isinstance(data, list):
                            all_data.extend(data)
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
        
        # Load from raw scraped data
        if self.raw_data_dir.exists():
            for file_path in self.raw_data_dir.rglob("*.json"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            all_data.extend(data)
                        elif isinstance(data, dict):
                            all_data.append(data)
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
        
        logger.info(f"Loaded {len(all_data)} total entries")
        return all_data

    def extract_patterns(self, text, pattern_type):
        """Extract patterns from text using regex"""
        if pattern_type not in self.patterns:
            return []
        
        matches = []
        for pattern in self.patterns[pattern_type]:
            found = re.findall(pattern, text, re.IGNORECASE)
            matches.extend(found)
        
        return list(set(matches))  # Remove duplicates

    def extract_structured_data(self, data):
        """Extract structured data from all entries"""
        logger.info("Extracting structured data from all entries...")
        
        for entry in data:
            if not isinstance(entry, dict) or 'content' not in entry:
                continue
                
            content = entry['content']
            source = entry.get('source', 'unknown')
            category = entry.get('category', 'unknown')
            
            # Extract runes
            runes = self.extract_patterns(content, 'runes')
            for rune in runes:
                if rune.lower() in self.rune_types:
                    self.rune_data[rune.lower()].append({
                        'content': content[:200],
                        'source': source,
                        'category': category,
                        'context': self.get_context(content, rune)
                    })
            
            # Extract gear
            gear = self.extract_patterns(content, 'gear')
            for item in gear:
                if any(set_name in item.lower() for set_name in self.gear_sets):
                    self.gear_data[item.lower()].append({
                        'content': content[:200],
                        'source': source,
                        'category': category,
                        'context': self.get_context(content, item)
                    })
            
            # Extract stats
            stats = self.extract_patterns(content, 'stats')
            for stat in stats:
                self.stats_data[stat].append({
                    'content': content[:200],
                    'source': source,
                    'category': category,
                    'context': self.get_context(content, stat)
                })
            
            # Extract costs
            costs = self.extract_patterns(content, 'costs')
            for cost in costs:
                self.stats_data[f"cost_{cost}"].append({
                    'content': content[:200],
                    'source': source,
                    'category': category,
                    'context': self.get_context(content, cost)
                })
            
            # Extract materials
            materials = self.extract_patterns(content, 'materials')
            for material in materials:
                if isinstance(material, tuple) and len(material) == 2:
                    quantity, material_name = material
                    self.upgrade_materials[material_name.lower()].append({
                        'quantity': quantity,
                        'content': content[:200],
                        'source': source,
                        'category': category,
                        'context': self.get_context(content, material_name)
                    })
            
            # Extract characters
            for char in self.characters:
                if char in content.lower():
                    self.character_data[char].append({
                        'content': content[:200],
                        'source': source,
                        'category': category,
                        'context': self.get_context(content, char)
                    })

    def get_context(self, text, keyword, context_length=50):
        """Get context around a keyword"""
        keyword_lower = keyword.lower()
        text_lower = text.lower()
        
        start = text_lower.find(keyword_lower)
        if start == -1:
            return ""
        
        context_start = max(0, start - context_length)
        context_end = min(len(text), start + len(keyword) + context_length)
        
        return text[context_start:context_end]

    def build_gear_tables(self):
        """Build comprehensive gear tables"""
        logger.info("Building gear tables...")
        
        gear_table = []
        
        for gear_name, entries in self.gear_data.items():
            # Extract set information
            set_name = None
            for set_type in self.gear_sets:
                if set_type in gear_name:
                    set_name = set_type
                    break
            
            # Extract piece type
            piece_type = None
            if any(piece in gear_name for piece in ['crossbow', 'spear', 'staff', 'bow']):
                piece_type = 'weapon'
            elif any(piece in gear_name for piece in ['amulet', 'necklace']):
                piece_type = 'amulet'
            elif any(piece in gear_name for piece in ['ring', 'band']):
                piece_type = 'ring'
            elif any(piece in gear_name for piece in ['chest', 'armor', 'plate']):
                piece_type = 'chest'
            elif any(piece in gear_name for piece in ['boots', 'shoes']):
                piece_type = 'boots'
            elif any(piece in gear_name for piece in ['helmet', 'helm', 'hat']):
                piece_type = 'helmet'
            
            # Count mentions and get best context
            mention_count = len(entries)
            best_context = max(entries, key=lambda x: len(x['context']))['context'] if entries else ""
            
            gear_table.append({
                'name': gear_name,
                'set': set_name,
                'piece_type': piece_type,
                'mention_count': mention_count,
                'best_context': best_context,
                'sources': list(set(entry['source'] for entry in entries))
            })
        
        return pd.DataFrame(gear_table)

    def build_rune_tables(self):
        """Build comprehensive rune tables"""
        logger.info("Building rune tables...")
        
        rune_table = []
        
        for rune_name, entries in self.rune_data.items():
            # Count mentions and get best context
            mention_count = len(entries)
            best_context = max(entries, key=lambda x: len(x['context']))['context'] if entries else ""
            
            # Extract potential effects from context
            effects = []
            for entry in entries:
                context = entry['context']
                # Look for percentage values near the rune name
                percentages = re.findall(r'(\d+(?:\.\d+)?)\s*%', context)
                effects.extend(percentages)
            
            rune_table.append({
                'name': rune_name,
                'mention_count': mention_count,
                'best_context': best_context,
                'potential_effects': list(set(effects)),
                'sources': list(set(entry['source'] for entry in entries))
            })
        
        return pd.DataFrame(rune_table)

    def build_character_tables(self):
        """Build character information tables"""
        logger.info("Building character tables...")
        
        char_table = []
        
        for char_name, entries in self.character_data.items():
            mention_count = len(entries)
            best_context = max(entries, key=lambda x: len(x['context']))['context'] if entries else ""
            
            char_table.append({
                'name': char_name,
                'mention_count': mention_count,
                'best_context': best_context,
                'sources': list(set(entry['source'] for entry in entries))
            })
        
        return pd.DataFrame(char_table)

    def build_upgrade_materials_table(self):
        """Build upgrade materials table"""
        logger.info("Building upgrade materials table...")
        
        materials_table = []
        
        for material_name, entries in self.upgrade_materials.items():
            total_quantity = sum(int(entry['quantity']) for entry in entries if entry['quantity'].isdigit())
            mention_count = len(entries)
            best_context = max(entries, key=lambda x: len(x['context']))['context'] if entries else ""
            
            materials_table.append({
                'name': material_name,
                'total_quantity_mentioned': total_quantity,
                'mention_count': mention_count,
                'best_context': best_context,
                'sources': list(set(entry['source'] for entry in entries))
            })
        
        return pd.DataFrame(materials_table)

    def save_tables(self, output_dir="../data/structured-tables"):
        """Save all tables to CSV files"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        logger.info(f"Saving tables to {output_path}")
        
        # Build and save all tables
        gear_df = self.build_gear_tables()
        gear_df.to_csv(output_path / "gear_table.csv", index=False)
        logger.info(f"Saved gear table with {len(gear_df)} entries")
        
        rune_df = self.build_rune_tables()
        rune_df.to_csv(output_path / "rune_table.csv", index=False)
        logger.info(f"Saved rune table with {len(rune_df)} entries")
        
        char_df = self.build_character_tables()
        char_df.to_csv(output_path / "character_table.csv", index=False)
        logger.info(f"Saved character table with {len(char_df)} entries")
        
        materials_df = self.build_upgrade_materials_table()
        materials_df.to_csv(output_path / "upgrade_materials_table.csv", index=False)
        logger.info(f"Saved materials table with {len(materials_df)} entries")
        
        # Save raw extracted data as JSON for further processing
        extracted_data = {
            'runes': dict(self.rune_data),
            'gear': dict(self.gear_data),
            'characters': dict(self.character_data),
            'materials': dict(self.upgrade_materials),
            'stats': dict(self.stats_data)
        }
        
        with open(output_path / "extracted_data.json", 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=2, ensure_ascii=False)
        
        logger.info("All tables saved successfully!")

    def run_extraction(self):
        """Run the complete data extraction process"""
        logger.info("Starting comprehensive data extraction...")
        
        # Load all data
        all_data = self.load_all_data()
        
        # Extract structured data
        self.extract_structured_data(all_data)
        
        # Save tables
        self.save_tables()
        
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("EXTRACTION SUMMARY")
        logger.info("="*50)
        logger.info(f"Runes found: {len(self.rune_data)}")
        logger.info(f"Gear pieces found: {len(self.gear_data)}")
        logger.info(f"Characters found: {len(self.character_data)}")
        logger.info(f"Materials found: {len(self.upgrade_materials)}")
        logger.info(f"Stats found: {len(self.stats_data)}")
        logger.info("="*50)

if __name__ == "__main__":
    extractor = ArcheroDataExtractor()
    extractor.run_extraction()
