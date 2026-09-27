import urllib.request
import re
import json

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Search for safezone objects or coordinates
for name in ["Malaga", "Hanover", "Barcelona", "Chuta", "Baghi", "Khevuli", "safezone"]:
    idx = js.find(name)
    if idx != -1:
        print(f"=== FOUND {name} ===")
        print(js[max(0, idx - 150):min(len(js), idx + 350)])
