import subprocess
import json

res = subprocess.run(['curl', '-s', 'https://wd-maps-assets.n4lab.dev/manifest.json'], capture_output=True, text=True)
data = json.loads(res.stdout)

print("Version:", data.get("version"))
print("Maps:", list(data.get("maps", {}).keys()))

for m, cfg in data.get("maps", {}).items():
    print(f"\n==================== {m.upper()} ====================")
    print("  Bounds:", cfg.get("bounds"))
    print("  Source instances:", cfg.get("sourceInstances"))
    print("  Terrain:", cfg.get("terrain", {}).get("url"), f"({cfg.get('terrain', {}).get('bytes')} bytes)")
    if "structures" in cfg:
        for q, s in cfg["structures"].items():
            print(f"  Structure [{q}]: {s.get('url')} ({s.get('bytes')} bytes)")
    if "foliage" in cfg:
        for q, f in cfg["foliage"].items():
            print(f"  Foliage [{q}]: {f.get('url')} ({f.get('bytes')} bytes)")
    if "detailLayers" in cfg:
        print("  Detail layers:", list(cfg["detailLayers"].keys()))
