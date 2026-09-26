const fs = require('fs');

const TYPE_MAP = {
    Int8Array, Uint8Array, Uint8ClampedArray,
    Int16Array, Uint16Array,
    Int32Array, Uint32Array,
    Float32Array, Float64Array
};

function testPack(path) {
    const buf = fs.readFileSync(path);
    const jsonLen = buf.readUInt32LE(8);
    const dataOffset = buf.readUInt32LE(12);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    function getView(entry) {
        const Ctor = TYPE_MAP[entry.type];
        return new Ctor(arrayBuffer, dataOffset + entry.offset, entry.length);
    }

    console.log(`=== ${path} ===`);
    console.log("Meshes:", manifest.meshes.length);
    const mesh = manifest.meshes[0];
    const geo = manifest.geometries[mesh.geometry];
    console.log("Mesh bounds:", mesh.bounds);

    if (geo.attributes.position.grid) {
        const x = getView(geo.attributes.position.grid.x);
        const y = getView(geo.attributes.position.grid.y);
        const z = getView(geo.attributes.position.grid.z);
        console.log(`Terrain Grid: X=${x.length}, Y=${y.length}, Z=${z.length}`);
        console.log(`X range: [${x[0]}, ${x[x.length-1]}], Z range: [${z[0]}, ${z[z.length-1]}]`);
    }
}

testPack('assets/packs/ozeti-terrain.pack');
