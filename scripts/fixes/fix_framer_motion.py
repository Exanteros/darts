#!/usr/bin/env python3
import os
import re

def fix_framer_motion_variants(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file uses framer-motion
    if 'framer-motion' not in content:
        return False
    
    # Check if file has fadeIn variant with ease problem
    if 'const fadeIn' not in content:
        return False
    
    print(f"Fixing: {filepath}")
    
    # Replace fadeIn variant - remove ease or make it 'as const'
    pattern = r'const fadeIn = \{[^}]*hidden:[^}]*\},[^}]*visible:[^}]*transition:[^}]*ease:[^}]*\}[^}]*\}[^}]*\};'
    
    replacement = '''const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4 } 
  }
} as const;'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    
    return False

def main():
    src_dir = '/home/cedric/dartsturnier/src/app'
    fixed_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                if fix_framer_motion_variants(filepath):
                    fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
