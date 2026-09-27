with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('bakurani-default')
print("Found bakurani-default at:", idx)
while idx != -1:
    print("--- CONTEXT ---")
    print(js[max(0, idx - 200):min(len(js), idx + 400)])
    idx = js.find('bakurani-default', idx + 1)
