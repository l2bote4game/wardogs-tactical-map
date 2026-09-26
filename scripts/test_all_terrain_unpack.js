const fs = require('fs');

const TYPE_MAP = {
    Int8Array, Uint8Array, Uint8ClampedArray,
    Int16Array, Uint16Array,
    Int32Array, Uint32Array,
    Float32Array, Float64Array
};

function testTerrainUnpack(filePath) {
    const buf = fs.readFileSync(filePath);
    const jsonLen = buf.readUInt32LE(8);
    const dataOffset = buf.readUInt32LE(12);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    function view(entry) {
        if (!entry) return null;
        const Ctor = TYPE_MAP[entry.type];
        return new Ctor(arrayBuffer, dataOffset + entry.offset, entry.length);
    }

    const meshDef = manifest.meshes[0];
    const geoDef = manifest.geometries[meshDef.geometry];

    // 1. Position
    const posGrid = geoDef.attributes.position.grid;
    const x = view(posGrid.x);
    const y = view(posGrid.y);
    const z = view(posGrid.z);
    console.log(`Terrain pos grid: X=${x.length}, Y=${y.length}, Z=${z.length}`);

    const posArray = new Float32Array(y.length * 3);
    for (let row = 0, idx = 0; row < z.length; row++) {
        const pz = z[row];
        for (let col = 0; col < x.length; col++, idx++) {
            posArray[idx * 3] = x[col];
            posArray[idx * 3 + 1] = y[idx];
            posArray[idx * 3 + 2] = pz;
        }
    }
    console.log(`Generated posArray with ${posArray.length / 3} vertices.`);

    // 2. UVs
    const uvGrid = geoDef.attributes.uv.grid;
    const u = view(uvGrid.u);
    const v = view(uvGrid.v);
    const uvArray = new Float32Array(u.length * v.length * 2);
    for (let row = 0, idx = 0; row < v.length; row++) {
        const pv = v[row];
        for (let col = 0; col < u.length; col++, idx++) {
            uvArray[idx * 2] = u[col];
            uvArray[idx * 2 + 1] = pv;
        }
    }
    console.log(`Generated uvArray with ${uvArray.length / 2} UV pairs.`);

    // 3. Index buffer
    const idxGrid = geoDef.index.grid;
    const cols = idxGrid.columns;
    const rows = idxGrid.rows;
    const pattern = idxGrid.pattern;
    const totalIndices = (cols - 1) * (rows - 1) * 6;
    const IndexCtor = TYPE_MAP[idxGrid.type];
    const indexArray = new IndexCtor(totalIndices);

    let d = 0;
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const h = r * cols + c;
            for (let m = 0; m < 6; m++) {
                indexArray[d++] = h + pattern[m];
            }
        }
    }
    console.log(`Generated indexArray with ${indexArray.length} indices (${indexArray.length / 3} triangles).`);
}

testTerrainUnpack('assets/packs/ozeti-terrain.pack');
testTerrainUnpack('assets/packs/bakurani-terrain.pack');
testTerrainUnpack('assets/packs/zestafona-terrain.pack');
