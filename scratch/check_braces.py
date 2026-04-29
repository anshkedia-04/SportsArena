import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract content between <script type="text/babel"> and </script>
match = re.search(r'<script type="text/babel">(.*?)</script>', content, re.DOTALL)
if match:
    babel = match.group(1)
    open_braces = babel.count('{')
    close_braces = babel.count('}')
    open_parens = babel.count('(')
    close_parens = babel.count(')')
    print(f"Braces - Open: {open_braces}, Close: {close_braces}")
    print(f"Parens - Open: {open_parens}, Close: {close_parens}")
    
    if open_braces != close_braces:
        print("MISMATCH IN BRACES!")
    if open_parens != close_parens:
        print("MISMATCH IN PARENS!")
else:
    print("Babel script not found")
