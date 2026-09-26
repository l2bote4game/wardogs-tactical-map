const https = require('https');

function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

const TYPE_MAP = {
    Int8Array, Uint8Array, Uint8ClampedArray,
    Int16Array, Uint16Array,
    Int32Array, Uint32Array,
    Float32Array, Float64Array
};

async function testTerrain() {
    const url = "https://wd-maps-assets.n4lab.dev/bakurani-terrain.760409d8093b57c0.pack";
    const buf = await fetchBuffer(url);

    const jsonLen = buf.readUInt32LE(8);
    const dataOffset = buf.readUInt32LE(12);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    function getView(entry) {
        const Ctor = TYPE_MAP[entry.type];
        return new Ctor(arrayBuffer, dataOffset + entry.offset, entry.length);
    }

    const meshDef = manifest.meshes[0];
    const geoDef = manifest.geometries[meshDef.geometry];
    console.log("Geo attributes:", Object.keys(geoDef.attributes));

    const posDef = geoDef.attributes.position;
    if (posDef.grid) {
        const x = getView(posDef.grid.x);
        const y = getView(posDef.grid.y);
        const z = getView(posDef.grid.z);
        console.log(`Grid terrain: X=${x.length}, Y=${y.length}, Z=${z.length}`);
        console.log(`Grid total vertices = ${x.length * z.length}`);
        console.log(`Sample X[0]=${x[0]}, X[last]=${x[x.length-1]}`);
        console.log(`Sample Z[0]=${z[0]}, Z[last]=${z[z.length-1]}`);
        console.log(`Height min=${Math.min(...y.slice(0, 1000))}, max=${Math.max(...y.slice(0, 1000))}`);
    }

    const idxDef = geoDef.index;
    if (idxDef.grid) {
        console.log("Index grid:", idxDef.grid);
    }
}

testTerrain().catch(console.error);
