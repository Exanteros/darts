#!/usr/bin/env python3
import os
import re

def fix_duplicate_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    seen_authOptions_import = False
    new_lines = []
    modified = False
    
    for line in lines:
        # Check if this is an authOptions import line
        if re.match(r"import\s*{\s*authOptions\s*}\s*from\s*['\"]@/lib/auth['\"];?", line.strip()):
            if not seen_authOptions_import:
                new_lines.append(line)
                seen_authOptions_import = True
            else:
                # Skip duplicate
                modified = True
                continue
        else:
            new_lines.append(line)
    
    if modified:
        print(f"Fixed: {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def main():
    src_dir = '/home/cedric/dartsturnier/src/app/api'
    fixed_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                if fix_duplicate_imports(filepath):
                    fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
