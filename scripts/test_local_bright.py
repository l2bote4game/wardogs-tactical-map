import os
import subprocess
import time
import http.server
import socketserver
import threading

PORT = 8098
DIRECTORY = "C:/Users/z/Desktop/wardogs-tactical-map"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

server = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
t = threading.Thread(target=server.serve_forever)
t.daemon = True
t.start()

edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
out_img = "C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/test_bright_ru.png"

cmd = [
    edge_path,
    "--headless=new",
    "--window-size=1440,900",
    "--virtual-time-budget=6000",
    f"--screenshot={out_img}",
    f"http://127.0.0.1:{PORT}/#map=ozeti"
]
subprocess.run(cmd, check=True)
server.shutdown()
print("Captured local bright test successfully!")
