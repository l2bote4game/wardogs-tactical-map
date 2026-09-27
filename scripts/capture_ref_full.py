import subprocess
import time

edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

url = "https://wardogs.n4lab.dev/?lang=ru&map=ozeti&mode=view"
out = "C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/ref_ozeti_full.png"
cmd = [
    edge_path,
    "--headless=new",
    "--window-size=1440,900",
    "--virtual-time-budget=25000",
    f"--screenshot={out}",
    url
]
print("Capturing full loaded reference for ozeti...")
subprocess.run(cmd, check=True)
print("Done!")
