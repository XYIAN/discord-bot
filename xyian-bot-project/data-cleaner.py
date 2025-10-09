#!/usr/bin/env python3
"""
Advanced Data Cleaner for Archero 2 Bot
Cleans scraped data and creates proper database for AI/RAG systems
Based on best practices for RAG and vector databases
"""

import json
import re
import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict, Counter
import logging
from typing import Dict, List, Any, Tuple
import hashlib

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ArcheroDataCleaner:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.raw_data_dir = self.data_dir / "comprehensive-knowledge-base"
        self.cleaned_data_dir = self.data_dir / "cleaned-database"
        self.cleaned_data_dir.mkdir(exist_ok=True)
        
        # Data quality metrics
        self.quality_metrics = {
            'total_entries': 0,
            'cleaned_entries': 0,
            'duplicates_removed': 0,
            'invalid_entries': 0,
            'confidence_scores': []
        }
        
        # Clean data storage
        self.clean_data = {
            'gear_sets': {},
            'runes': {},
            'characters': {},
            'materials': {},
            'builds': {},
            'stats': {},
            'events': {}
        }
        
        logger.info("🧹 Advanced Data Cleaner initialized")

    def load_all_raw_data(self) -> List[Dict]:
        """Load all raw scraped data from various sources"""
        all_data = []
        
        # Load from knowledge base JSON files
        for json_file in self.raw_data_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'data' in data:
                        for entry in data['data']:
                            entry['source_file'] = json_file.name
                            all_data.append(entry)
                    elif isinstance(data, list):
                        for entry in data:
                            entry['source_file'] = json_file.name
                            all_data.append(entry)
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")
        
        logger.info(f"Loaded {len(all_data)} raw entries from {len(list(self.raw_data_dir.glob('*.json')))} files")
        return all_data

    def clean_text_content(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text or not isinstance(text, str):
            return ""
        
        # Remove Discord-specific formatting
        text = re.sub(r'<@!?\d+>', '', text)  # Remove user mentions
        text = re.sub(r'<#\d+>', '', text)    # Remove channel mentions
        text = re.sub(r'<:\w+:\d+>', '', text)  # Remove custom emojis
        text = re.sub(r'https?://\S+', '', text)  # Remove URLs
        
        # Clean up whitespace and special characters
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = re.sub(r'[^\w\s\-.,!?%()]', '', text)  # Remove special chars except common ones
        text = text.strip()
        
        return text

    def extract_confidence_score(self, entry: Dict) -> float:
        """Calculate confidence score based on data quality indicators"""
        score = 0.0
        
        # Base score from content length and quality
        content = entry.get('content', '')
        if len(content) > 50:
            score += 0.3
        if len(content) > 200:
            score += 0.2
        
        # Source quality indicators
        source = entry.get('source', '')
        if 'wiki' in source.lower():
            score += 0.3
        elif 'discord' in source.lower():
            score += 0.1
        
        # Content quality indicators
        if any(keyword in content.lower() for keyword in ['damage', 'crit', 'attack', 'defense']):
            score += 0.2
        if any(keyword in content.lower() for keyword in ['build', 'strategy', 'guide']):
            score += 0.2
        if re.search(r'\d+%', content):  # Contains percentages
            score += 0.1
        
        # Confidence from original data
        if 'confidence' in entry:
            score += float(entry['confidence']) * 0.2
        
        return min(score, 1.0)

    def deduplicate_entries(self, entries: List[Dict]) -> List[Dict]:
        """Remove duplicate entries based on content similarity"""
        seen_hashes = set()
        unique_entries = []
        
        for entry in entries:
            content = self.clean_text_content(entry.get('content', ''))
            if not content:
                continue
                
            # Create hash of cleaned content
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_entries.append(entry)
            else:
                self.quality_metrics['duplicates_removed'] += 1
        
        logger.info(f"Removed {self.quality_metrics['duplicates_removed']} duplicate entries")
        return unique_entries

    def extract_gear_information(self, entries: List[Dict]) -> Dict:
        """Extract and clean gear set information"""
        gear_patterns = {
            'oracle': r'(?i)\b(oracle)\s+(?:set|gear|armor|weapon|amulet|ring|chest|boots|helmet)',
            'dragoon': r'(?i)\b(dragoon)\s+(?:set|gear|armor|weapon|amulet|ring|chest|boots|helmet)',
            'griffin': r'(?i)\b(griffin)\s+(?:set|gear|armor|weapon|amulet|ring|chest|boots|helmet)',
            'chromatic': r'(?i)\b(chromatic)\s+(?:set|gear|armor|weapon|amulet|ring|chest|boots|helmet)',
            'mythic': r'(?i)\b(mythic)\s+(?:set|gear|armor|weapon|amulet|ring|chest|boots|helmet)'
        }
        
        gear_data = defaultdict(lambda: {
            'pieces': defaultdict(list),
            'mentions': 0,
            'contexts': [],
            'confidence_scores': []
        })
        
        for entry in entries:
            content = self.clean_text_content(entry.get('content', ''))
            if not content:
                continue
            
            confidence = self.extract_confidence_score(entry)
            
            for set_name, pattern in gear_patterns.items():
                if re.search(pattern, content):
                    gear_data[set_name]['mentions'] += 1
                    gear_data[set_name]['contexts'].append(content[:200])
                    gear_data[set_name]['confidence_scores'].append(confidence)
                    
                    # Extract specific pieces
                    piece_patterns = {
                        'weapon': r'(?:crossbow|spear|staff|bow)',
                        'amulet': r'(?:amulet|necklace)',
                        'ring': r'(?:ring|band)',
                        'chest': r'(?:chest|armor|plate)',
                        'boots': r'(?:boots|shoes)',
                        'helmet': r'(?:helmet|helm|hat)'
                    }
                    
                    for piece_type, piece_pattern in piece_patterns.items():
                        if re.search(piece_pattern, content):
                            gear_data[set_name]['pieces'][piece_type].append({
                                'content': content[:100],
                                'confidence': confidence,
                                'source': entry.get('source_file', 'unknown')
                            })
        
        # Calculate average confidence and clean up
        for set_name, data in gear_data.items():
            if data['confidence_scores']:
                data['avg_confidence'] = np.mean(data['confidence_scores'])
            else:
                data['avg_confidence'] = 0.0
            
            # Keep only high-confidence pieces
            for piece_type, pieces in data['pieces'].items():
                data['pieces'][piece_type] = [
                    p for p in pieces if p['confidence'] > 0.3
                ]
        
        return dict(gear_data)

    def extract_rune_information(self, entries: List[Dict]) -> Dict:
        """Extract and clean rune information"""
        rune_patterns = {
            'meteor': r'(?i)\b(meteor)\s+(?:rune|etched)',
            'sprite': r'(?i)\b(sprite)\s+(?:rune|etched)',
            'elemental': r'(?i)\b(elemental)\s+(?:rune|etched)',
            'etched': r'(?i)\b(etched)\s+(?:rune)',
            'circle': r'(?i)\b(circle)\s+(?:rune|etched)',
            'potion': r'(?i)\b(potion)\s+(?:rune|etched)',
            'sword': r'(?i)\b(sword)\s+(?:rune|etched)',
            'shield': r'(?i)\b(shield)\s+(?:rune|etched)',
            'freeze': r'(?i)\b(freeze)\s+(?:rune|etched)',
            'ice': r'(?i)\b(ice)\s+(?:rune|etched)',
            'fire': r'(?i)\b(fire)\s+(?:rune|etched)',
            'lightning': r'(?i)\b(lightning)\s+(?:rune|etched)'
        }
        
        rune_data = defaultdict(lambda: {
            'mentions': 0,
            'effects': [],
            'contexts': [],
            'confidence_scores': [],
            'costs': []
        })
        
        for entry in entries:
            content = self.clean_text_content(entry.get('content', ''))
            if not content:
                continue
            
            confidence = self.extract_confidence_score(entry)
            
            for rune_name, pattern in rune_patterns.items():
                if re.search(pattern, content):
                    rune_data[rune_name]['mentions'] += 1
                    rune_data[rune_name]['contexts'].append(content[:200])
                    rune_data[rune_name]['confidence_scores'].append(confidence)
                    
                    # Extract effects (percentages)
                    effects = re.findall(r'(\d+(?:\.\d+)?)\s*%', content)
                    rune_data[rune_name]['effects'].extend(effects)
                    
                    # Extract costs
                    cost_patterns = [
                        r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gems?|gem)',
                        r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gold|g)',
                        r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lures?|lure)'
                    ]
                    
                    for cost_pattern in cost_patterns:
                        costs = re.findall(cost_pattern, content)
                        rune_data[rune_name]['costs'].extend(costs)
        
        # Clean up and calculate averages
        for rune_name, data in rune_data.items():
            if data['confidence_scores']:
                data['avg_confidence'] = np.mean(data['confidence_scores'])
            else:
                data['avg_confidence'] = 0.0
            
            # Remove duplicates from effects and costs
            data['effects'] = list(set(data['effects']))
            data['costs'] = list(set(data['costs']))
        
        return dict(rune_data)

    def extract_character_information(self, entries: List[Dict]) -> Dict:
        """Extract and clean character information"""
        character_names = ['thor', 'otta', 'helix', 'drac', 'rolla', 'loki', 'atreyus', 'nyanja', 'dracoola']
        
        character_data = defaultdict(lambda: {
            'mentions': 0,
            'contexts': [],
            'confidence_scores': [],
            'usage_types': [],
            'builds': []
        })
        
        for entry in entries:
            content = self.clean_text_content(entry.get('content', ''))
            if not content:
                continue
            
            confidence = self.extract_confidence_score(entry)
            
            for char_name in character_names:
                if re.search(rf'\b{char_name}\b', content, re.IGNORECASE):
                    character_data[char_name]['mentions'] += 1
                    character_data[char_name]['contexts'].append(content[:200])
                    character_data[char_name]['confidence_scores'].append(confidence)
                    
                    # Extract usage types
                    if re.search(r'\b(pvp|pve|arena|gvg)\b', content, re.IGNORECASE):
                        usage_matches = re.findall(r'\b(pvp|pve|arena|gvg)\b', content, re.IGNORECASE)
                        character_data[char_name]['usage_types'].extend(usage_matches)
                    
                    # Extract build information
                    if re.search(r'\b(build|strategy|guide)\b', content, re.IGNORECASE):
                        character_data[char_name]['builds'].append(content[:150])
        
        # Clean up and calculate averages
        for char_name, data in character_data.items():
            if data['confidence_scores']:
                data['avg_confidence'] = np.mean(data['confidence_scores'])
            else:
                data['avg_confidence'] = 0.0
            
            # Remove duplicates
            data['usage_types'] = list(set(data['usage_types']))
            data['builds'] = data['builds'][:5]  # Keep top 5 builds
        
        return dict(character_data)

    def extract_material_information(self, entries: List[Dict]) -> Dict:
        """Extract and clean upgrade material information"""
        material_patterns = {
            'shards': r'(\d+)\s*(?:shards?|fragments?)',
            'gems': r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gems?|gem)',
            'gold': r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:gold|g)',
            'lures': r'(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lures?|lure)',
            'keys': r'(\d+)\s*(?:keys?|tokens?)',
            'cores': r'(\d+)\s*(?:cores?|essence)',
            'stones': r'(\d+)\s*(?:stones?|crystals?)'
        }
        
        material_data = defaultdict(lambda: {
            'total_quantity': 0,
            'mentions': 0,
            'contexts': [],
            'confidence_scores': [],
            'sources': []
        })
        
        for entry in entries:
            content = self.clean_text_content(entry.get('content', ''))
            if not content:
                continue
            
            confidence = self.extract_confidence_score(entry)
            
            for material_type, pattern in material_patterns.items():
                matches = re.findall(pattern, content)
                if matches:
                    material_data[material_type]['mentions'] += 1
                    material_data[material_type]['contexts'].append(content[:200])
                    material_data[material_type]['confidence_scores'].append(confidence)
                    material_data[material_type]['sources'].append(entry.get('source_file', 'unknown'))
                    
                    # Sum up quantities
                    for match in matches:
                        try:
                            quantity = int(match.replace(',', ''))
                            material_data[material_type]['total_quantity'] += quantity
                        except ValueError:
                            continue
        
        # Calculate averages
        for material_type, data in material_data.items():
            if data['confidence_scores']:
                data['avg_confidence'] = np.mean(data['confidence_scores'])
            else:
                data['avg_confidence'] = 0.0
        
        return dict(material_data)

    def create_clean_database(self) -> Dict:
        """Create the final clean database"""
        logger.info("🧹 Starting comprehensive data cleaning...")
        
        # Load all raw data
        raw_entries = self.load_all_raw_data()
        self.quality_metrics['total_entries'] = len(raw_entries)
        
        # Clean and deduplicate
        cleaned_entries = self.deduplicate_entries(raw_entries)
        self.quality_metrics['cleaned_entries'] = len(cleaned_entries)
        
        # Extract structured information
        logger.info("⚔️ Extracting gear information...")
        self.clean_data['gear_sets'] = self.extract_gear_information(cleaned_entries)
        
        logger.info("🔮 Extracting rune information...")
        self.clean_data['runes'] = self.extract_rune_information(cleaned_entries)
        
        logger.info("👥 Extracting character information...")
        self.clean_data['characters'] = self.extract_character_information(cleaned_entries)
        
        logger.info("💎 Extracting material information...")
        self.clean_data['materials'] = self.extract_material_information(cleaned_entries)
        
        # Calculate final quality metrics
        all_confidence_scores = []
        for category in self.clean_data.values():
            if isinstance(category, dict):
                for item in category.values():
                    if isinstance(item, dict) and 'confidence_scores' in item:
                        all_confidence_scores.extend(item['confidence_scores'])
        
        self.quality_metrics['confidence_scores'] = all_confidence_scores
        
        logger.info("✅ Data cleaning complete!")
        return self.clean_data

    def save_clean_database(self):
        """Save the clean database to files"""
        # Save main database
        db_path = self.cleaned_data_dir / "clean-archero-database.json"
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(self.clean_data, f, indent=2, ensure_ascii=False)
        
        # Save quality metrics
        metrics_path = self.cleaned_data_dir / "data-quality-metrics.json"
        with open(metrics_path, 'w', encoding='utf-8') as f:
            json.dump(self.quality_metrics, f, indent=2, ensure_ascii=False)
        
        # Save individual category files for easier access
        for category, data in self.clean_data.items():
            category_path = self.cleaned_data_dir / f"{category}.json"
            with open(category_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Clean database saved to {self.cleaned_data_dir}")

    def generate_quality_report(self):
        """Generate a comprehensive quality report"""
        total_entries = self.quality_metrics['total_entries']
        cleaned_entries = self.quality_metrics['cleaned_entries']
        duplicates_removed = self.quality_metrics['duplicates_removed']
        
        avg_confidence = np.mean(self.quality_metrics['confidence_scores']) if self.quality_metrics['confidence_scores'] else 0
        
        report = {
            'summary': {
                'total_raw_entries': total_entries,
                'cleaned_entries': cleaned_entries,
                'duplicates_removed': duplicates_removed,
                'cleaning_efficiency': f"{(cleaned_entries/total_entries)*100:.1f}%" if total_entries > 0 else "0%",
                'average_confidence': f"{avg_confidence:.3f}"
            },
            'categories': {
                'gear_sets': len(self.clean_data['gear_sets']),
                'runes': len(self.clean_data['runes']),
                'characters': len(self.clean_data['characters']),
                'materials': len(self.clean_data['materials'])
            },
            'quality_metrics': self.quality_metrics
        }
        
        report_path = self.cleaned_data_dir / "quality-report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📊 Quality report saved to {report_path}")
        return report

    def run_cleaning_pipeline(self):
        """Run the complete data cleaning pipeline"""
        logger.info("🚀 Starting Archero Data Cleaning Pipeline")
        
        # Create clean database
        self.create_clean_database()
        
        # Save results
        self.save_clean_database()
        
        # Generate quality report
        report = self.generate_quality_report()
        
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("CLEANING PIPELINE COMPLETE")
        logger.info("="*50)
        logger.info(f"📊 Total raw entries: {report['summary']['total_raw_entries']}")
        logger.info(f"✅ Cleaned entries: {report['summary']['cleaned_entries']}")
        logger.info(f"🗑️ Duplicates removed: {report['summary']['duplicates_removed']}")
        logger.info(f"📈 Cleaning efficiency: {report['summary']['cleaning_efficiency']}")
        logger.info(f"🎯 Average confidence: {report['summary']['average_confidence']}")
        logger.info(f"⚔️ Gear sets: {report['categories']['gear_sets']}")
        logger.info(f"🔮 Runes: {report['categories']['runes']}")
        logger.info(f"👥 Characters: {report['categories']['characters']}")
        logger.info(f"💎 Materials: {report['categories']['materials']}")
        logger.info("="*50)
        
        return report

if __name__ == "__main__":
    cleaner = ArcheroDataCleaner()
    cleaner.run_cleaning_pipeline()
