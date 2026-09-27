import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

matches = [m.start() for m in re.finditer(r'features\s*:\s*[a-zA-Z0-9_\.]+', js)]
print(f"Features matches: {len(matches)}")
for idx in matches[:5]:
    print("=== FEATURES USAGE ===")
    print(js[max(0, idx - 100):min(len(js), idx + 200)])
