import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Search for pack parser
matches = [m.start() for m in re.finditer(r'\.pack\b', js)]
print(f"Total .pack references: {len(matches)}")
for idx in matches[:5]:
    print("--- PACK USAGE ---")
    print(js[max(0, idx - 150):min(len(js), idx + 250)])
