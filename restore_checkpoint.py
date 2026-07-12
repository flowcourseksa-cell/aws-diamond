"""
Restore all project files to the exact state at line 12135 (the 'تم بس بص' checkpoint).
Strategy:
1. Walk all current files into a VFS dict (initial state = what's on disk right now)
2. Replay every write_to_file / replace_file_content / multi_replace_file_content up to line 12134
3. Write the resulting VFS back to disk
4. Then apply platform name change: فلو → الأوس الماسية (ONLY in display strings, not logic)
"""

import json
import os
import sys

TRANSCRIPT = r'C:\Users\CENTER_ELRahama\.gemini\antigravity\brain\af618007-4f9d-4eec-a500-0d243d445d6a\.system_generated\logs\transcript_full.jsonl'
WORKSPACE = r'f:\TKHSAS'
STOP_AT_LINE = 12135  # exclusive

EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.sql', '.mjs', '.md'}
SKIP_DIRS = {'node_modules', '.git', '.next', '__pycache__'}

print("=== Phase 1: Reading current files into VFS ===")
vfs = {}
for root, dirs, files in os.walk(WORKSPACE):
    # Prune skip dirs
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    rel_root = os.path.relpath(root, WORKSPACE)
    for fname in files:
        ext = os.path.splitext(fname)[1].lower()
        if ext in EXTENSIONS:
            full = os.path.join(root, fname)
            norm = full.replace('\\', '/').lower()
            try:
                with open(full, 'r', encoding='utf-8', errors='replace') as f:
                    vfs[norm] = f.read()
            except Exception as e:
                print(f"  SKIP {full}: {e}")

print(f"  Loaded {len(vfs)} files into VFS")

def norm_path(p):
    """Normalize a path for VFS lookup."""
    if not p:
        return None
    return p.replace('\\', '/').lower()

def do_replace(content, target, replacement, allow_multiple=False):
    if allow_multiple:
        return content.replace(target, replacement)
    else:
        return content.replace(target, replacement, 1)

print("=== Phase 2: Replaying transcript up to line", STOP_AT_LINE, "===")
writes = 0
replaces = 0
errors = 0

for idx, raw_line in enumerate(open(TRANSCRIPT, 'r', encoding='utf-8', errors='replace')):
    if idx >= STOP_AT_LINE:
        break
    
    try:
        data = json.loads(raw_line)
    except:
        continue
    
    if data.get('source') != 'MODEL':
        continue
    
    tool_calls = data.get('tool_calls', [])
    if not tool_calls:
        continue
    
    for call in tool_calls:
        name = call.get('name', '')
        args = call.get('args', {})
        
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except:
                continue
        
        if not isinstance(args, dict):
            continue
        
        target_file = args.get('TargetFile') or args.get('targetFile')
        if not target_file:
            continue
        
        key = norm_path(target_file)
        
        if name == 'write_to_file':
            content = args.get('CodeContent', '')
            if content is not None:
                vfs[key] = content
                writes += 1
        
        elif name == 'replace_file_content':
            if key not in vfs:
                # File might not exist yet, create it
                vfs[key] = ''
            old = args.get('TargetContent', '')
            new = args.get('ReplacementContent', '')
            allow = args.get('AllowMultiple', False)
            if old in vfs[key]:
                vfs[key] = do_replace(vfs[key], old, new, allow)
                replaces += 1
            else:
                errors += 1
                # Don't print errors to keep output clean
        
        elif name == 'multi_replace_file_content':
            if key not in vfs:
                vfs[key] = ''
            chunks = args.get('ReplacementChunks', [])
            for chunk in chunks:
                old = chunk.get('TargetContent', '')
                new = chunk.get('ReplacementContent', '')
                allow = chunk.get('AllowMultiple', False)
                if old in vfs[key]:
                    vfs[key] = do_replace(vfs[key], old, new, allow)
                    replaces += 1

print(f"  writes={writes}, replaces={replaces}, errors={errors}")

print("=== Phase 3: Applying platform name change in display strings ===")
renamed = 0
for key in vfs:
    original = vfs[key]
    # Only rename display strings - careful replacements
    content = vfs[key]
    
    # Only rename in TSX/TS display text, not in code logic identifiers
    if key.endswith('.tsx') or key.endswith('.ts'):
        # Replace Arabic display name strings
        content = content.replace('منصة فلو', 'الأوس الماسية')
        content = content.replace('دورة فلو', 'دورة الأوس الماسية')
        content = content.replace('كتب فلو', 'كتب الأوس الماسية')
        content = content.replace('اختبار فلو', 'اختبار الأوس الماسية')
        content = content.replace('"فلو"', '"الأوس الماسية"')
        # Replace in title/description meta tags
        content = content.replace('منصة تعليمية فلو', 'الأوس الماسية')
    
    if key.endswith('.json'):
        content = content.replace('"name": "nokhba-next"', '"name": "al-aws-almasiya"')
    
    if content != original:
        renamed += 1
    vfs[key] = content

print(f"  Renamed display strings in {renamed} files")

print("=== Phase 4: Writing VFS back to disk ===")
written = 0
failed = 0
for key, content in vfs.items():
    # Reconstruct actual path
    # key is lowercase normalized - find actual case path
    # Use the key to reconstruct path
    # key looks like f:/tkhsas/components/...
    # Replace with proper case
    actual = key.replace('f:/tkhsas', WORKSPACE).replace('/', os.sep)
    
    try:
        os.makedirs(os.path.dirname(actual), exist_ok=True)
        with open(actual, 'w', encoding='utf-8', newline='\r\n') as f:
            f.write(content)
        written += 1
    except Exception as e:
        failed += 1

print(f"  Written: {written}, Failed: {failed}")
print("=== DONE ===")
