with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('.layer("terrain")')
if idx != -1:
    print(js[max(0, idx - 400):min(len(js), idx + 1200)])
