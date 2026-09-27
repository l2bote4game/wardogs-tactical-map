with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('function P0e(')
if idx == -1:
    idx = js.find('ebe(')
if idx == -1:
    # search for controlZones definition
    idx = js.find('controlZones:')

print("=== P0e / Features definition ===")
print(js[max(0, idx - 400):min(len(js), idx + 800)])
