import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

matches = [m.start() for m in re.finditer(r'\bdT\s*=', js)]
for idx in matches:
    print("--- dT definition ---")
    print(js[max(0, idx - 100):min(len(js), idx + 200)])
