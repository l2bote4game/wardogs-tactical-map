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
    def log_message(self, format, *args):
        pass

httpd = socketserver.TCPServer(("", PORT), Handler)
t = threading.Thread(target=httpd.serve_forever)
t.daemon = True
t.start()

edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

for m in ['bakurani', 'ozeti', 'zestafona']:
    url = f"http://localhost:{PORT}/#map={m}"
    out_file = f"C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/clean_{m}.png"
    subprocess.run([
        edge_path,
        "--headless=new",
        "--window-size=1440,900",
        "--virtual-time-budget=6000",
        f"--screenshot={out_file}",
        url
    ], capture_output=True)
    print(f"Captured {m} -> {out_file}")

httpd.shutdown()
print("All maps captured successfully.")
