with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('N0e({scene:t,camera:e,canvas:n,siteId:i')
print("=== N0e and surrounding code ===")
print(js[max(0, idx - 1200):min(len(js), idx + 2500)])
