with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('features:an.features')
print(js[max(0, idx - 1500):max(0, idx - 500)])
