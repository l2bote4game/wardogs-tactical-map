import subprocess
import urllib.request
import json
import time
import base64
import os

edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--remote-debugging-port=9222",
    "--window-size=1440,900",
    "https://wardogs.n4lab.dev/?lang=ru&map=ozeti&mode=view"
])

print("Edge launched, waiting for debugger...")
time.sleep(3)

try:
    with urllib.request.urlopen("http://127.0.0.1:9222/json") as r:
        pages = json.load(r)
    print("Pages:", len(pages))
    ws_url = None
    for p in pages:
        if "wardogs" in p.get("url", ""):
            ws_url = p.get("webSocketDebuggerUrl")
            break
    if not ws_url and pages:
        ws_url = pages[0].get("webSocketDebuggerUrl")
    print("WS URL:", ws_url)

    # Wait 20 seconds for assets to load completely
    for i in range(20):
        time.sleep(1)
        print(f"Waiting real time... {i+1}/20s")

    # Now capture screenshot via simple python websocket or CDP HTTP
    # Or even simpler: we can use another Edge invocation or websocket
except Exception as e:
    print("Error:", e)
finally:
    proc.terminate()
