import urllib.request
import json

url = "https://wd-maps-assets.n4lab.dev/misc.00543b8ec637a978.pack"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-65535'})
try:
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    json_len = int.from_bytes(data[8:12], 'little')
    print("JSON len in misc.pack:", json_len)
    if len(data) >= 16 + json_len:
        manifest = json.loads(data[16:16+json_len].decode('utf-8'))
        print("=== MISC.PACK MANIFEST ===")
        print(json.dumps(manifest, indent=2))
    else:
        # fetch the full json
        req2 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': f'bytes=0-{16+json_len}'})
        with urllib.request.urlopen(req2) as resp:
            data = resp.read()
        manifest = json.loads(data[16:16+json_len].decode('utf-8'))
        print("Manifest keys:", list(manifest.keys()))
        for k in manifest.keys():
            print(f"Key {k}:", type(manifest[k]))
except Exception as e:
    print("Error:", e)
