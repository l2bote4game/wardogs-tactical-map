with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('function Bl(t,[e,n])')
print(js[max(0, idx - 400):idx + 300])
