import urllib.request
import json

url = "https://wd-maps-assets.n4lab.dev/ozeti-surround.63a29640ec3b38e9.pack"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-65535'})
with urllib.request.urlopen(req) as resp:
    data = resp.read()

json_len = int.from_bytes(data[8:12], 'little')
manifest = json.loads(data[16:16+json_len].decode('utf-8'))
print("=== SURROUND MANIFEST KEYS ===")
for k, v in manifest.items():
    if k != 'features':
        print(f"{k}:", v)
