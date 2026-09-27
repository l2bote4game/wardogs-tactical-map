import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

matches = [m.start() for m in re.finditer(r'\bebe\(', js)]
for idx in matches:
    print("=== CALL TO ebe ===")
    print(js[max(0, idx - 150):min(len(js), idx + 250)])
