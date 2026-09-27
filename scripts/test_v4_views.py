import http.server
import socketserver
import threading
import subprocess
import time
import os

PORT = 8094
DIRECTORY = "C:/Users/z/Desktop/wardogs-tactical-map"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

server = socketserver.TCPServer(("", PORT), Handler)
t = threading.Thread(target=server.serve_forever)
t.daemon = True
t.start()
print(f"Server running on http://localhost:{PORT}")

time.sleep(1)

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Capture Orbit View
orbit_png = "C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/test_orbit_view.png"
if os.path.exists(orbit_png): os.remove(orbit_png)
cmd_orbit = [
    edge_path,
    "--headless=new",
    "--window-size=1920,1080",
    "--virtual-time-budget=7000",
    f"--screenshot={orbit_png}",
    f"http://localhost:{PORT}/#map=bakurani"
]
subprocess.run(cmd_orbit, capture_output=True)

# 2. Capture Scope View (using hash or click trigger)
scope_png = "C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/test_scope_view.png"
if os.path.exists(scope_png): os.remove(scope_png)
# Let's create a small script that triggers scope click in page
scope_html = f"http://localhost:{PORT}/#map=bakurani&view=scope"
cmd_scope = [
    edge_path,
    "--headless=new",
    "--window-size=1920,1080",
    "--virtual-time-budget=7000",
    f"--screenshot={scope_png}",
    scope_html
]
subprocess.run(cmd_scope, capture_output=True)

server.shutdown()
print("Captured orbit:", os.path.exists(orbit_png), "size:", os.path.getsize(orbit_png) if os.path.exists(orbit_png) else 0)
print("Captured scope:", os.path.exists(scope_png), "size:", os.path.getsize(scope_png) if os.path.exists(scope_png) else 0)
