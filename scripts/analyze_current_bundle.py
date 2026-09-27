import re

with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

print(f"Loaded JS, length: {len(js)} characters")

# Find controlZones, safezone, spawns
matches = [m.start() for m in re.finditer(r'controlZones|control-zone', js)]
print(f"Control zone matches: {len(matches)}")
for idx in matches[:5]:
    print("--- CONTEXT ---")
    print(js[max(0, idx - 150):min(len(js), idx + 250)])
