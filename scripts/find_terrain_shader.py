with open('archive/n4lab_current.js', 'r', encoding='utf-8', errors='ignore') as f:
    js = f.read()

# Search for vertexShader or fragmentShader or ShaderMaterial
shaders = []
for kw in ['vertexShader', 'fragmentShader', 'ShaderMaterial', 'terrainMaterial', 'surround-terrain']:
    idx = js.find(kw)
    print(f"Keyword '{kw}': index {idx}")
    if idx != -1:
        print(js[max(0, idx - 100):min(len(js), idx + 300)])
