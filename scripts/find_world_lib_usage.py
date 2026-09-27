import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

idx = js.find('world-library')
print("Index:", idx)
if idx != -1:
    print(js[max(0, idx - 200):min(len(js), idx + 500)])
