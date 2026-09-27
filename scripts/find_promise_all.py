with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

idx = js.find('const{data:an}=me')
print(js[max(0, idx - 2500):max(0, idx - 1200)])
