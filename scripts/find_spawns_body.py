import urllib.request

url = 'https://wardogs.n4lab.dev/assets/index-BZRXANjt.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

idx = js.find('return{spawns:i,safezones:s,towers:o,controlZones:l}')
print("=== FUNCTION BODY ===")
print(js[max(0, idx - 1200):idx + 100])
