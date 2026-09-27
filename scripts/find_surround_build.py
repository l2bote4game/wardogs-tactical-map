with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('function jge(')
if idx == -1:
    idx = js.find('Wge({')

print("=== Surround geometry extraction ===")
print(js[max(0, idx - 200):min(len(js), idx + 800)])
