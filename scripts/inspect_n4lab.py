import urllib.request
import re
import json

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Look for fetch urls
fetches = re.findall(r'fetch\(([^)]+)\)', js)
print(f"Total fetch calls: {len(fetches)}")
for f in fetches[:15]:
    print("Fetch:", f)

# Look for .glb or .gltf or map loading
glb = re.findall(r'[a-zA-Z0-9_\-\./]+\.(?:glb|gltf|bin|json|ktx2|drc|terrain|png|webp)', js)
print("Unique asset extensions found:")
exts = set([x.split('.')[-1] for x in glb])
print("Extensions:", exts)
matching = [x for x in set(glb) if any(m in x for m in ['ozeti', 'bakurani', 'zestafona', 'map', 'scene', 'building', 'tree'])]
print("Matching assets:", matching[:30])
