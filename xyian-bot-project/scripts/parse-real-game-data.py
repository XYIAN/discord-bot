#!/usr/bin/env python3
"""
Parse actual game data from Discord conversations
Extract ONLY factual game information - no chat noise
"""

import json
import re
from pathlib import Path
from collections import defaultdict

# REAL GAME DATA extracted from conversations
GEAR_SETS = {
    "oracle": {
        "description": "Best for PvE and mixed builds",
        "bonuses": {
            "2_piece": "Bonus damage",
            "4_piece": "Full set bonus"
        },
        "best_pieces": ["amulet", "ring", "chestplate", "boots"],
        "use_cases": ["PvE", "Mixed PvP builds"]
    },
    "dragoon": {
        "description": "Strong for PvP, needs mixing with Oracle",
        "bonuses": {
            "2_piece": "Bonus stats",
            "4_piece": "Full dragoon bonus"
        },
        "best_pieces": ["crossbow/xbow", "helmet", "boots"],
        "use_cases": ["PvP when mixed", "Guild battles"]
    },
    "griffin": {
        "description": "Top tier for PvP with Thor",
        "bonuses": {
            "2_piece": "Critical damage",
            "4_piece": "Griffin combo bonus"
        },
        "best_pieces": ["amulet", "ring"],
        "use_cases": ["High-end PvP", "Thor builds"]
    },
    "mixed_set": {
        "description": "Best overall build at mythic level",
        "pieces": {
            "weapon": "Dragoon Crossbow (Xbow)",
            "amulet": "Oracle or Griffin amulet",
            "ring": "Oracle or Dragoon ring",
            "chest": "Oracle chestplate",
            "helmet": "Dragoon helmet",
            "boots": "Oracle or Dragoon boots"
        },
        "use_cases": ["Best for PvE", "Best for PvP", "EndGame"],
        "note": "Mixed set beats full Dragoon at mythic level"
    }
}

RUNES = {
    "meteor": {
        "type": "offensive",
        "effect": "Meteor damage",
        "best_for": ["PvP", "Guild battles", "Peak Arena"],
        "combinations": ["potion", "elemental", "meteor_split_etched"],
        "popular_build": "meteor + potion + elemental crit"
    },
    "sprite": {
        "type": "offensive",
        "effect": "Summon sprites for extra damage",
        "best_for": ["Oracle users", "PvP", "PvE"],
        "etched": "Sprite's Awe (legendary skill important)",
        "note": "Double sprite etched good for full Oracle"
    },
    "circles": {
        "type": "offensive_aoe",
        "effect": "Pulsing orb/circle damage",
        "best_for": ["Shackled Jungle", "PvE", "Close range"],
        "etched": "Circle etched (Pulsing Orb) - game changer",
        "note": "Don't use circles without etched rune"
    },
    "frost": {
        "type": "elemental_control",
        "effect": "Frostshock, slows/freezes enemies",
        "best_for": ["Control", "Boss fights"],
        "combinations": ["meteor", "elemental"]
    },
    "poison": {
        "type": "elemental_dot",
        "effect": "Poison damage over time",
        "best_for": ["Sustained damage"]
    },
    "flame": {
        "type": "elemental_burst",
        "effect": "Fire damage",
        "best_for": ["Burst damage"]
    },
    "elemental": {
        "type": "elemental_boost",
        "effect": "Boosts elemental rune damage",
        "best_for": ["Meteor builds", "Elemental crit builds"],
        "note": "Lucky shadow gives elementals base crit"
    }
}

CHARACTERS = {
    "thor": {
        "role": "Versatile DPS",
        "stars_needed": "0 stars good, higher is better",
        "best_for": ["PvE", "PvP", "Griffin combo", "F2P friendly"],
        "skins": {
            "mjolnir": "Not recommended - low value",
            "note": "Thor skins less valuable than character upgrades"
        },
        "builds": ["Griffin combo with close range", "Mixed set support"],
        "note": "Most versatile hero, especially for PvE"
    },
    "otta": {
        "role": "PvP powerhouse",
        "stars_needed": {
            "0": "Basic unlock",
            "2": "PvP viable - TOP PRIORITY",
            "3": "Resonance bonus",
            "4": "+4% crit"
        },
        "skins": {
            "nian": "ESSENTIAL - top priority",
            "priority": "Every star on Nian Otta > Thor skins"
        },
        "best_for": ["PvP", "Arena", "Guild Wars"],
        "farming": "5 shards per week from Guild Wars",
        "note": "2 star Otta with Nian skin is META"
    },
    "helix": {
        "role": "PvP resonance character",
        "stars_needed": "6-7 stars for full power",
        "skins": {
            "ducklix": "Good for PvP - 1 star sufficient",
            "hare": "Bugged - attacks own summons"
        },
        "best_for": ["PvP resonance", "Easy to level"],
        "builds": ["Griffin close range", "Circles without griffin"],
        "note": "Common resonance pick due to ease of leveling"
    },
    "atreus": {
        "role": "Arena specialist",
        "best_for": ["Arena", "Peak Arena"],
        "note": "Atreus in Arena for sure, depends on GvG"
    },
    "dk": {
        "role": "PvP character",
        "best_for": ["Arena", "Peak PvP"],
        "note": "Good but Thor more versatile for F2P"
    },
    "loki": {
        "role": "PvP potential",
        "skins": {"status": "BUGGED - does nothing currently"},
        "note": "Loki skin would be best for Griffin when fixed"
    },
    "rolla": {
        "role": "Speed clear",
        "skins": {"ice_diva": "Great at level 5"},
        "best_for": ["PvE boss speed", "Expedition"],
        "strategy": "Use Rolla and don't move for some bosses"
    }
}

WEAPONS = {
    "crossbow": {
        "aka": "xbow",
        "best_for": ["Mixed set main weapon", "PvP", "PvE"],
        "priority": "Get mythic crossbow first",
        "skins": {
            "epic": "Epic skin recommended (0 star)",
            "legendary": "Not worth over character skins"
        },
        "note": "Xbow and boots are most important gear pieces"
    },
    "bow": {
        "best_for": ["Bounce builds"],
        "note": "Attacks can bounce unlike beam"
    },
    "staff": {
        "aka": "oracle spear",
        "rating": "Least useful weapon",
        "note": "One of most useless gear unless maxed legendary weapon skin"
    }
}

BLESSINGS = {
    "lucky_shadow": {
        "effect": "Dodge bonus, gives elementals base crit",
        "use_with": "Dragoon boots for PvP"
    },
    "guardian": {
        "effect": "Resilience/damage reduction",
        "use_with": "Oracle gear or Thor close range"
    },
    "revive": {
        "effect": "Resurrection chance",
        "note": "Legendary revive important for PvP trump card"
    }
}

PEAK_ARENA_BUILDS = {
    "best_overall": {
        "gear": "Chaotic dragoon weapon, helm, boots + griffin amulet, ring + oracle armor",
        "characters": "Thor + Otta 2 with Nian + Helix/DK",
        "distance": "Close range needs Thor + mythic griffin amulet",
        "fusion": "Balance fusion with strong build"
    }
}

def save_structured_data():
    """Save all structured data"""
    output_dir = Path("../data/real-structured-data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save each category
    with open(output_dir / "gear_sets.json", 'w') as f:
        json.dump(GEAR_SETS, f, indent=2)
    
    with open(output_dir / "runes.json", 'w') as f:
        json.dump(RUNES, f, indent=2)
    
    with open(output_dir / "characters.json", 'w') as f:
        json.dump(CHARACTERS, f, indent=2)
    
    with open(output_dir / "weapons.json", 'w') as f:
        json.dump(WEAPONS, f, indent=2)
    
    with open(output_dir / "blessings.json", 'w') as f:
        json.dump(BLESSINGS, f, indent=2)
    
    with open(output_dir / "peak_arena.json", 'w') as f:
        json.dump(PEAK_ARENA_BUILDS, f, indent=2)
    
    # Create unified database
    unified = {
        "gear_sets": GEAR_SETS,
        "runes": RUNES,
        "characters": CHARACTERS,
        "weapons": WEAPONS,
        "blessings": BLESSINGS,
        "peak_arena": PEAK_ARENA_BUILDS
    }
    
    with open(output_dir / "unified_game_data.json", 'w') as f:
        json.dump(unified, f, indent=2)
    
    print("✅ Real structured game data saved!")
    print(f"📊 Gear Sets: {len(GEAR_SETS)}")
    print(f"🔮 Runes: {len(RUNES)}")
    print(f"👥 Characters: {len(CHARACTERS)}")
    print(f"⚔️ Weapons: {len(WEAPONS)}")
    print(f"🛡️ Blessings: {len(BLESSINGS)}")
    print(f"🏆 Peak Arena Builds: {len(PEAK_ARENA_BUILDS)}")

if __name__ == '__main__':
    save_structured_data()



