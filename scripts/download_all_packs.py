import os
import subprocess
import json

base_url = "https://wd-maps-assets.n4lab.dev"
packs = [
    ("bakurani-terrain.pack", "/bakurani-terrain.760409d8093b57c0.pack"),
    ("bakurani-structures-lq.pack", "/bakurani-structures-lq.96462c5799f25f1c.pack"),
    ("bakurani-vegetation-lq.pack", "/bakurani-vegetation-lq.17e38492c575b5e9.pack"),

    ("ozeti-terrain.pack", "/ozeti-terrain.a1a266ca50404bf2.pack"),
    ("ozeti-structures-lq.pack", "/ozeti-structures-lq.8decbc1347c13acd.pack"),
    ("ozeti-vegetation-lq.pack", "/ozeti-vegetation-lq.a6e5850b5815b512.pack"),

    ("zestafona-terrain.pack", "/zestafona-terrain.139c175baf9b2ec1.pack"),
    ("zestafona-structures-lq.pack", "/zestafona-structures-lq.8678abe7e498b166.pack"),
    ("zestafona-vegetation-lq.pack", "/zestafona-vegetation-lq.b44467b1017a7049.pack"),
]

os.makedirs("assets/packs", exist_ok=True)

for local_name, remote_path in packs:
    local_path = os.path.join("assets/packs", local_name)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        print(f"Already exists: {local_name} ({os.path.getsize(local_path)} bytes)")
        continue
    url = base_url + remote_path
    print(f"Downloading {local_name} from {url} ...")
    cmd = ["curl", "-s", "-o", local_path, url]
    subprocess.run(cmd, check=True)
    size = os.path.getsize(local_path)
    print(f"  Done: {local_name} ({size} bytes)")

print("\nAll packs successfully cached locally in assets/packs!")
