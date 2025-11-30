#!/usr/bin/env python3
import os
import re

def fix_session_userId(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Only fix if file uses getServerSession
    if 'getServerSession' not in content:
        return False
    
    # Check if file uses session.userId or session?.userId
    if 'session.userId' not in content and 'session?.userId' not in content:
        return False
    
    print(f"Fixing: {filepath}")
    
    modified = False
    
    # Replace session.userId with session.user.id (including optional chaining)
    new_content = re.sub(r'\bsession\??\.userId\b', 'session?.user?.id', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    
    return False

def main():
    src_dir = '/home/cedric/dartsturnier/src/app/api'
    fixed_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                if fix_session_userId(filepath):
                    fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
