import struct
import json
import math

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

    gx = list(get_view(pos_grid['x']))
    gy = list(get_view(pos_grid['y']))
    gz = list(get_view(pos_grid['z']))
    cols = len(gx)
    rows = len(gz)

    print(f"\n================ AUDIT FOR {map_name.upper()} ================")
    print(f"Terrain grid resolution: {cols} x {rows} ({len(gy)} height samples)")
    print(f"X bounds: [{gx[0]:.2f}m, {gx[-1]:.2f}m], Z bounds: [{gz[0]:.2f}m, {gz[-1]:.2f}m]")
    print(f"Elevation (Y) range: [{min(gy):.2f}m, {max(gy):.2f}m] (span = {max(gy)-min(gy):.2f}m)")

    def get_terrain_y(x, z):
        if x < gx[0] or x > gx[-1] or z < gz[0] or z > gz[-1]:
            return None
        u = (x - gx[0]) / (gx[-1] - gx[0]) * (cols - 1)
        v = (z - gz[0]) / (gz[-1] - gz[0]) * (rows - 1)
        c0 = int(u)
        c1 = min(c0 + 1, cols - 1)
        r0 = int(v)
        r1 = min(r0 + 1, rows - 1)
        du = u - c0
        dv = v - r0
        h00 = gy[r0 * cols + c0]
        h10 = gy[r0 * cols + c1]
        h01 = gy[r1 * cols + c0]
        h11 = gy[r1 * cols + c1]
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

    deltas = []
    checked = 0
    total_buildings = 0
    for mesh in s_manifest['meshes']:
        if mesh['layer'] != 'buildings':
            continue
        total_buildings += mesh['count']
        inst_array = get_s_view(mesh['instances'])
        for i in range(min(mesh['count'], 30)):
            mat = inst_array[i*16 : (i+1)*16]
            bx = mat[12]
            by = mat[13]
            bz = mat[14]
            scale_y = math.sqrt(mat[1]**2 + mat[5]**2 + mat[9]**2)
            ty = get_terrain_y(bx, bz)
            if ty is not None:
                bottom_y = by - scale_y / 2
                diff = bottom_y - ty
                deltas.append(diff)
                checked += 1
                if checked <= 4:
                    print(f"  Building '{mesh['name']}' #{i}: Center=({bx:.1f}, {by:.1f}, {bz:.1f}), Height={scale_y:.1f}m | Bottom={bottom_y:.1f}m | Terrain Y={ty:.1f}m | Foundation offset={diff:+.2f}m")

    print(f"Total building instances in map: {total_buildings}")
    print(f"Audited {len(deltas)} building foundation alignments:")
    mean_d = sum(deltas) / len(deltas)
    sorted_d = sorted(deltas)
    median_d = sorted_d[len(sorted_d) // 2]
    print(f"  Mean foundation offset (Building bottom - Terrain): {mean_d:+.2f}m")
    print(f"  Median foundation offset: {median_d:+.2f}m")
    print(f"  Offset range: [{min(deltas):+.2f}m, {max(deltas):+.2f}m]")
    on_ground = sum(1 for d in deltas if abs(d) <= 1.5)
    print(f"  Foundations sitting directly on terrain (±1.5m tolerance): {on_ground}/{len(deltas)} ({on_ground/len(deltas)*100:.1f}%)")

audit_map('ozeti')
audit_map('bakurani')
audit_map('zestafona')
