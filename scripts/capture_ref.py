import subprocess

edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

for m in ['ozeti', 'bakurani']:
    url = f"https://wardogs.n4lab.dev/?lang=ru&map={m}&mode=view"
    out = f"C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/ref_{m}.png"
    cmd = [
        edge_path,
        "--headless=new",
        "--window-size=1440,900",
        "--virtual-time-budget=8000",
        f"--screenshot={out}",
        url
    ]
    print(f"Capturing reference for {m}...")
    subprocess.run(cmd, check=True)
print("Done!")
