import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if match:
    babel = match.group(1)
    # Find all top-level function and const/let/var names
    # This is a very rough regex but it might find duplicates
    patterns = [
        r'function\s+(\w+)',
        r'const\s+(\w+)\s*=',
        r'let\s+(\w+)\s*=',
        r'var\s+(\w+)\s*='
    ]
    
    names = []
    for pattern in patterns:
        names.extend(re.findall(pattern, babel))
        
    counts = {}
    for name in names:
        counts[name] = counts.get(name, 0) + 1
        
    dupes = {k: v for k, v in counts.items() if v > 1}
    if dupes:
        print("POSSIBLE DUPLICATES:")
        for name, count in dupes.items():
            print(f"{name}: {count}")
    else:
        print("No obvious duplicates found")
else:
    print("Babel script not found")
