import os
import subprocess
import time

DIRECTORY = "C:/Users/z/Desktop/wardogs-tactical-map"
edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

shots = [
    ("archive/qa/final_ozeti_3d.png", "https://l2bote4game.github.io/wardogs-tactical-map/#map=ozeti"),
    ("archive/qa/final_bakurani_3d.png", "https://l2bote4game.github.io/wardogs-tactical-map/#map=bakurani"),
    ("archive/qa/final_zestafona_3d.png", "https://l2bote4game.github.io/wardogs-tactical-map/#map=zestafona"),
    ("archive/qa/final_2d_map.png", "https://l2bote4game.github.io/wardogs-tactical-map/#map=ozeti&view=2d"),
]

for rel_path, url in shots:
    abs_path = os.path.join(DIRECTORY, rel_path)
    print(f"Capturing {rel_path} from {url} ...")
    cmd = [
        edge_path,
        "--headless=new",
        "--window-size=1600,1000",
        "--virtual-time-budget=6000",
        f"--screenshot={abs_path}",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_path):
        size = os.path.getsize(abs_path)
        print(f"  Success: {size} bytes")
    else:
        print(f"  Failed: {res.stderr}")
