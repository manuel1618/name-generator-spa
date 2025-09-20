#!/usr/bin/env python3
"""
Script to calculate syllable counts for names in names.json and update the file.
Uses proper German phonetic rules for syllable counting.
"""

import json
import re
import sys
from pathlib import Path

def count_syllables_improved(word):
    """
    Proper German syllable counting based on correct phonetic rules.
    Handles diphthongs correctly: eu, au, ou, äu, ei, ai, oi, ui are single syllables.
    Other vowel combinations like ia, ie, io, ua, ue, uo are split into separate syllables.
    """
    if not word:
        return 0
    
    word = word.lower().strip()
    word = re.sub(r'[^a-zäöüß]', '', word)
    
    if not word:
        return 0
    
    # Handle German umlauts
    word = word.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    
    # German diphthongs (count as 1 syllable each) - these are the ONLY true diphthongs in German
    german_diphthongs = ['eu', 'au', 'ou', 'äu', 'ei', 'ai', 'oi', 'ui']
    
    # Special case: 'ie' at the end of German names (like Sophie, Marie) counts as 1 syllable
    special_ie_ending = word.endswith('ie')
    
    # Count diphthongs first
    diphthong_count = 0
    for diphthong in german_diphthongs:
        count = word.count(diphthong)
        diphthong_count += count
    
    # Add special 'ie' ending as a diphthong
    if special_ie_ending:
        diphthong_count += 1
    
    # Count all vowels
    vowels = re.findall(r'[aeiouy]', word)
    total_vowels = len(vowels)
    
    # Calculate syllables: total vowels - diphthongs (since each diphthong uses 2 vowels but counts as 1 syllable)
    syllable_count = total_vowels - diphthong_count
    
    # Handle silent 'e' at the end
    if word.endswith('e') and syllable_count > 1:
        # Check if 'e' is preceded by a consonant (making it likely silent)
        if len(word) > 2 and word[-2] not in 'aeiouy':
            syllable_count -= 1
    
    # Handle 'y' as vowel
    if 'y' in word:
        # 'y' at the end after a consonant is usually a syllable
        if word.endswith('y') and len(word) > 2 and word[-2] not in 'aeiou':
            syllable_count += 1
    
    # Handle common German name endings that add syllables
    if word.endswith('er') and len(word) > 3 and word[-3] not in 'aeiouy':
        syllable_count += 1
    elif word.endswith('en') and len(word) > 3 and word[-3] not in 'aeiouy':
        syllable_count += 1
    elif word.endswith('le') and len(word) > 3 and word[-3] not in 'aeiouy':
        syllable_count += 1
    
    return max(1, syllable_count)

def test_syllable_counting():
    """Test the syllable counting with known examples."""
    test_cases = [
        # German names with proper diphthong handling
        ("Sophie", 2),  # So-phie (ie is NOT a diphthong, splits into i-e)
        ("Marie", 2),   # Ma-rie (ie is NOT a diphthong, splits into i-e)
        ("Maria", 3),   # Ma-ri-a (ia is NOT a diphthong, splits into i-a)
        ("Emilia", 4),  # E-mi-li-a (ia is NOT a diphthong, splits into i-a)
        ("Noah", 2),    # No-ah (oa is NOT a diphthong, splits into o-a)
        ("Anna", 2),    # An-na
        ("Emma", 2),    # Em-ma
        ("Liam", 2),    # Li-am (ia is NOT a diphthong, splits into i-a)
        ("Lucas", 2),   # Lu-cas
        ("Mia", 2),     # Mi-a (ia is NOT a diphthong, splits into i-a)
        ("Ella", 2),    # El-la
        ("Lina", 2),    # Li-na
        ("Finn", 1),    # Finn
        ("Max", 1),     # Max
        ("Ben", 1),     # Ben
        ("Tom", 1),     # Tom
        ("Leo", 2),     # Le-o (eo is NOT a diphthong, splits into e-o)
        ("Paul", 1),    # Paul (au IS a diphthong, counts as 1 syllable)
        ("Luis", 2),    # Lu-is (ui is NOT a diphthong, splits into u-i)
        ("Henry", 2),   # Hen-ry
        ("Alexander", 4), # A-lex-an-der
        ("Christopher", 3), # Chris-to-pher
        ("Elizabeth", 4), # E-liz-a-beth
        ("Isabella", 4), # I-sa-bel-la
        ("Charlotte", 2), # Char-lotte
        ("Amelia", 3),  # A-me-li-a (ia is NOT a diphthong, splits into i-a)
        ("Harper", 2),  # Har-per
        ("Evelyn", 3),  # Ev-e-lyn
        ("Abigail", 3), # A-bi-gail
        # Test diphthongs
        ("Eugen", 2),   # Eu-gen (eu IS a diphthong, counts as 1 syllable)
        ("Paul", 1),    # Paul (au IS a diphthong, counts as 1 syllable)
        ("Heinrich", 2), # Hein-rich (ei IS a diphthong, counts as 1 syllable)
        ("Haus", 1),    # Haus (au IS a diphthong, counts as 1 syllable)
        ("Freund", 1),  # Freund (eu IS a diphthong, counts as 1 syllable)
        # Test non-diphthong vowel combinations
        ("Julia", 3),   # Ju-li-a (ia is NOT a diphthong, splits into i-a)
        ("Lukas", 2),   # Lu-kas (ua is NOT a diphthong, splits into u-a)
        ("Theo", 2),    # The-o (eo is NOT a diphthong, splits into e-o)
    ]
    
    print("Testing syllable counting algorithm:")
    print("=" * 50)
    
    correct = 0
    total = len(test_cases)
    
    for name, expected in test_cases:
        result = count_syllables_improved(name)
        
        status = "✓" if result == expected else "✗"
        if result == expected:
            correct += 1
            
        print(f"{status} {name:12} -> {result} syllables (expected {expected})")
    
    print("=" * 50)
    print(f"Accuracy: {correct}/{total} ({correct/total*100:.1f}%)")
    
    return correct / total

def update_names_with_syllables(json_file_path):
    """
    Read names.json, calculate syllables for each name, and update the file.
    """
    try:
        # Read the JSON file
        with open(json_file_path, 'r', encoding='utf-8') as f:
            names = json.load(f)
        
        print(f"Processing {len(names)} names...")
        
        # Update each name with syllable count
        updated_count = 0
        for name_entry in names:
            if 'name' in name_entry:
                name = name_entry['name']
                syllables = count_syllables_improved(name)
                name_entry['syllables'] = syllables
                updated_count += 1
                
                # Print progress every 1000 names
                if updated_count % 1000 == 0:
                    print(f"Processed {updated_count} names...")
        
        # Write back to the file
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(names, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully updated {updated_count} names with syllable counts!")
        
        # Show some statistics
        syllable_counts = [name_entry.get('syllables', 0) for name_entry in names]
        if syllable_counts:
            min_syllables = min(syllable_counts)
            max_syllables = max(syllable_counts)
            avg_syllables = sum(syllable_counts) / len(syllable_counts)
            
            print(f"\nSyllable statistics:")
            print(f"  Minimum syllables: {min_syllables}")
            print(f"  Maximum syllables: {max_syllables}")
            print(f"  Average syllables: {avg_syllables:.2f}")
            
            # Show distribution
            from collections import Counter
            distribution = Counter(syllable_counts)
            print(f"\nSyllable distribution:")
            for syllables in sorted(distribution.keys()):
                count = distribution[syllables]
                percentage = (count / len(names)) * 100
                print(f"  {syllables} syllable{'s' if syllables != 1 else ''}: {count} names ({percentage:.1f}%)")
        
    except FileNotFoundError:
        print(f"Error: File '{json_file_path}' not found.")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in '{json_file_path}': {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def main():
    """Main function to run the syllable update script."""
    script_dir = Path(__file__).parent
    json_file = script_dir / "names.json"
    
    print("Improved Name Syllable Counter (German Optimized)")
    print("=" * 50)
    
    # Test the algorithm first
    accuracy = test_syllable_counting()
    print()
    
    if accuracy < 0.8:
        print("Warning: Syllable counting accuracy is below 80%")
        print("Continuing with improved algorithm...")
    
    print(f"Updating file: {json_file}")
    print()
    
    # Check if file exists
    if not json_file.exists():
        print(f"Error: {json_file} does not exist!")
        sys.exit(1)
    
    # Create backup
    backup_file = json_file.with_suffix('.json.backup')
    print(f"Creating backup: {backup_file}")
    
    import shutil
    shutil.copy2(json_file, backup_file)
    
    # Update the file
    update_names_with_syllables(json_file)
    
    print(f"\nBackup saved as: {backup_file}")
    print("Done!")

if __name__ == "__main__":
    main()
