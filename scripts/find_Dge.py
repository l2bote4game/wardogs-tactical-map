with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('Dge=')
print(js[max(0, idx - 100):idx + 600])
