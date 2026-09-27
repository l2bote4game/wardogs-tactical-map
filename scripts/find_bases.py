import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Search for safezone, factions, bases, control zones
matches = [m.start() for m in re.finditer(r'safezone|faction|lonestar|valkyra|manticore|controlzone', js, re.IGNORECASE)]
print(f"Total faction/safezone matches: {len(matches)}")
for idx in matches[:10]:
    print("--- CONTEXT ---")
    print(js[max(0, idx - 100):min(len(js), idx + 250)])
