import re

with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

matches = [m.start() for m in re.finditer(r'\bN0e\(', js)]
print(f"N0e( matches: {len(matches)}")
for idx in matches:
    print("--- CONTEXT ---")
    print(js[max(0, idx - 150):min(len(js), idx + 250)])
