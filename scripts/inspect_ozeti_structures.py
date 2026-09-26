import struct
import json

with open('assets/packs/ozeti-structures-lq.pack', 'rb') as f:
    header = f.read(16)
    magic, ver, json_len, data_offset = struct.unpack('<IIII', header)
    manifest_bytes = f.read(json_len)
    manifest = json.loads(manifest_bytes.decode('utf-8'))

print("Kind:", manifest.get('kind'))
print("Meshes:", len(manifest.get('meshes', [])))
print("Materials:", len(manifest.get('materials', [])))
print("Geometries:", len(manifest.get('geometries', {})))
print("Sample mesh 0:", manifest['meshes'][0])
if len(manifest['meshes']) > 1:
    print("Sample mesh 1:", manifest['meshes'][1])
