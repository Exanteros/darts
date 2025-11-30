#!/usr/bin/env python3
import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file imports getSession from @/lib/session
    if "from '@/lib/session'" not in content and 'from "@/lib/session"' not in content:
        return False
    
    # Check if file uses session.user (which is NextAuth pattern)
    if 'session.user' not in content and 'session?.user' not in content:
        return False
    
    print(f"Fixing: {filepath}")
    
    # Replace import
    content = re.sub(
        r"import\s*{\s*getSession\s*}\s*from\s*['\"]@/lib/session['\"];?",
        "import { getServerSession } from 'next-auth';\nimport { authOptions } from '@/lib/auth';",
        content
    )
    
    # Replace getSession() calls
    content = re.sub(
        r'await\s+getSession\(\)',
        'await getServerSession(authOptions)',
        content
    )
    
    # Fix session.role to session.user.role
    content = re.sub(
        r'session\.role\s*(!==|===)\s*["\']ADMIN["\']',
        r"session.user.role \1 'ADMIN'",
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    src_dir = '/home/cedric/dartsturnier/src/app/api'
    fixed_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
