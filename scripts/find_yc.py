with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('function yc(')
if idx != -1:
    print(js[idx:idx + 400])
else:
    idx = js.find('jr=')
    print("jr=", js[max(0, idx - 100):idx + 300])
