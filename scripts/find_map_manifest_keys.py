import json

with open('assets/packs/manifest.json') as f:
    d = json.load(f)

for m in ['bakurani', 'ozeti', 'zestafona']:
    cfg = d['maps'][m]
    print(f"\n=================== {m.upper()} ===================")
    for k in cfg.keys():
        if k not in ['terrain', 'structures', 'vegetation', 'world', 'surround', 'roads']:
            print(f"  {k}:", cfg[k])
