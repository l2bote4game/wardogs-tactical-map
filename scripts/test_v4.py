import http.server
import socketserver
import threading
import subprocess
import time
import os

PORT = 8092
DIRECTORY = "C:/Users/z/Desktop/wardogs-tactical-map"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

server = socketserver.TCPServer(("", PORT), Handler)
t = threading.Thread(target=server.serve_forever)
t.daemon = True
t.start()
print(f"Server started on http://localhost:{PORT}")

time.sleep(1)

out_png = "C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/test_v4_bakurani.png"
if os.path.exists(out_png):
    os.remove(out_png)

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_path,
    "--headless=new",
    "--window-size=1920,1080",
    "--virtual-time-budget=7000",
    f"--screenshot={out_png}",
    f"http://localhost:{PORT}/#map=bakurani"
]

print("Running Edge capture...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Edge finished:", res.returncode)

if os.path.exists(out_png):
    print(f"Captured: {out_png}, size: {os.path.getsize(out_png)} bytes")
else:
    print("FAILED to capture!")

server.shutdown()
