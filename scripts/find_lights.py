import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Search for DirectionalLight or AmbientLight
matches = [m.start() for m in re.finditer(r'DirectionalLight|AmbientLight|HemisphereLight', js)]
for idx in matches[:5]:
    print("--- LIGHT ---")
    print(js[max(0, idx - 80):min(len(js), idx + 180)])
