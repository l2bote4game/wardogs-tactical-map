import struct
import json
import numpy as np

def audit_map(map_name):
    terrain_file = f'assets/packs/{map_name}-terrain.pack'
    struct_file = f'assets/packs/{map_name}-structures-lq.pack'

    # 1. Read terrain
    with open(terrain_file, 'rb') as f:
        h = f.read(16)
        magic, ver, json_len, data_offset = struct.unpack('<IIII', h)
        manifest = json.loads(f.read(json_len).decode('utf-8'))
        f.seek(data_offset)
        raw_data = f.read()

    mesh_def = manifest['meshes'][0]
    geo_def = manifest['geometries'][mesh_def['geometry']]
    pos_grid = geo_def['attributes']['position']['grid']

    def get_view(entry):
        types = {'Float32Array': 'f', 'Uint32Array': 'I', 'Uint16Array': 'H'}
        fmt = '<' + types[entry['type']] * entry['length']
        off = entry['offset']
        size = struct.calcsize(fmt)
        return struct.unpack(fmt, raw_data[off:off+size])

    gx = np.array(get_view(pos_grid['x']), dtype=np.float32)
    gy = np.array(get_view(pos_grid['y']), dtype=np.float32)
    gz = np.array(get_view(pos_grid['z']), dtype=np.float32)
    cols = len(gx)
    rows = len(gz)
    gy = gy.reshape((rows, cols))

    print(f"=== AUDIT FOR {map_name.upper()} ===")
    print(f"Terrain grid size: {cols} x {rows}")
    print(f"X bounds: [{gx[0]:.2f}, {gx[-1]:.2f}], Z bounds: [{gz[0]:.2f}, {gz[-1]:.2f}]")
    print(f"Elevation (Y) range: [{gy.min():.2f}m, {gy.max():.2f}m]")

    def get_terrain_y(x, z):
        if x < gx[0] or x > gx[-1] or z < gz[0] or z > gz[-1]:
            return None
        # bilinear interpolation
        u = (x - gx[0]) / (gx[-1] - gx[0]) * (cols - 1)
        v = (z - gz[0]) / (gz[-1] - gz[0]) * (rows - 1)
        c0 = int(u)
        c1 = min(c0 + 1, cols - 1)
        r0 = int(v)
        r1 = min(r0 + 1, rows - 1)
        du = u - c0
        dv = v - r0
        h00 = gy[r0, c0]
        h10 = gy[r0, c1]
        h01 = gy[r1, c0]
        h11 = gy[r1, c1]
        return (h00 * (1 - du) + h10 * du) * (1 - dv) + (h01 * (1 - du) + h11 * du) * dv

    # 2. Read structures
    with open(struct_file, 'rb') as f:
        h = f.read(16)
        magic, ver, json_len, data_offset = struct.unpack('<IIII', h)
        s_manifest = json.loads(f.read(json_len).decode('utf-8'))
        f.seek(data_offset)
        s_raw_data = f.read()

    def get_s_view(entry):
        types = {'Float32Array': 'f'}
        fmt = '<' + types[entry['type']] * entry['length']
        off = entry['offset']
        size = struct.calcsize(fmt)
        return struct.unpack(fmt, s_raw_data[off:off+size])

    # Check 100 building instances
    deltas = []
    checked = 0
    for mesh in s_manifest['meshes']:
        if mesh['layer'] != 'buildings':
            continue
        inst_array = get_s_view(mesh['instances'])
        for i in range(min(mesh['count'], 20)):
            # 4x4 matrix in Three.js column-major order:
            # m[12] = translation X, m[13] = translation Y, m[14] = translation Z
            mat = inst_array[i*16 : (i+1)*16]
            bx = mat[12]
            by = mat[13]
            bz = mat[14]
            ty = get_terrain_y(bx, bz)
            if ty is not None:
                # Building Y is usually the foundation or center of the building proxy
                diff = by - ty
                deltas.append(diff)
                checked += 1
                if checked <= 5:
                    print(f"  Building '{mesh['name']}' #{i}: Pos=({bx:.1f}, {by:.1f}, {bz:.1f}) | Terrain Y={ty:.1f} | Delta={diff:+.2f}m")

    deltas = np.array(deltas)
    print(f"Tested {len(deltas)} building foundations:")
    print(f"  Mean delta (Building Y - Terrain Y): {deltas.mean():+.2f}m")
    print(f"  Median delta: {np.median(deltas):+.2f}m")
    print(f"  Min delta: {deltas.min():+.2f}m, Max delta: {deltas.max():+.2f}m")
    print(f"  Standard deviation: {deltas.std():.2f}m")

audit_map('ozeti')
audit_map('bakurani')
audit_map('zestafona')
