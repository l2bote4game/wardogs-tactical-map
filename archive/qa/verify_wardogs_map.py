import os
import subprocess
import time
import http.server
import socketserver
import threading

PORT = 8097
DIRECTORY = "C:/Users/z/Desktop/wardogs-tactical-map"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

httpd = socketserver.TCPServer(("", PORT), Handler)
server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
server_thread.start()
print(f"Temporary server running on http://127.0.0.1:{PORT}")

edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
tests = [
    ("archive/qa/screenshot_wardogs_orbit.png", f"http://127.0.0.1:{PORT}/"),
    ("archive/qa/screenshot_wardogs_ozeti.png", f"http://127.0.0.1:{PORT}/#map=ozeti"),
]

for output_rel, url in tests:
    output_abs = os.path.join(DIRECTORY, output_rel)
    print(f"Capturing {output_rel} from {url} ...")
    cmd = [
        edge_path,
        "--headless=new",
        "--window-size=1440,900",
        "--virtual-time-budget=3500",
        f"--screenshot={output_abs}",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(output_abs):
        size = os.path.getsize(output_abs)
        print(f"  Captured successfully: {size} bytes")
    else:
        print(f"  Failed: {res.stderr}")

httpd.shutdown()
httpd.server_close()
print("Temporary server stopped. No background tasks left.")
