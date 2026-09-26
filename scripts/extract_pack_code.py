import urllib.request
import re

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

idx = js.find('function gb(n)')
print("=== function gb(n) ===")
print(js[idx:idx + 1500])

idx_m = js.find('function mT(n,e)')
print("\n=== function mT(n,e) ===")
print(js[idx_m:idx_m + 1500])
