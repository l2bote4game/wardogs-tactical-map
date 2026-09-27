import urllib.request
import json

for m, url in [
    ("ozeti", "https://wd-maps-assets.n4lab.dev/ozeti-surround.63a29640ec3b38e9.pack"),
    ("bakurani", "https://wd-maps-assets.n4lab.dev/bakurani-surround.6ec2ba7ac7857885.pack"),
    ("zestafona", "https://wd-maps-assets.n4lab.dev/zestafona-surround.6833def8d23f09d7.pack")
]:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-65535'})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    json_len = int.from_bytes(data[8:12], 'little')
    print(f"=== {m.upper()} SURROUND JSON LEN: {json_len} ===")
    if len(data) >= 16 + json_len:
        manifest = json.loads(data[16:16+json_len].decode('utf-8'))
    else:
        req2 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': f'bytes=0-{16+json_len}'})
        with urllib.request.urlopen(req2) as resp:
            data = resp.read()
        manifest = json.loads(data[16:16+json_len].decode('utf-8'))
    
    print("Keys in manifest:", list(manifest.keys()))
    if 'features' in manifest:
        print("FEATURES KEYS:", list(manifest['features'].keys()))
        print("CONTROL ZONES:", json.dumps(manifest['features'].get('controlZones', []), indent=2))
        print("SPAWNS:", json.dumps(manifest['features'].get('spawns', []), indent=2))
        print("POIS:", json.dumps(manifest['features'].get('pois', [])[:3], indent=2))
