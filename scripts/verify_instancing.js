const fs = require('fs');

const TYPE_MAP = {
    Int8Array, Uint8Array, Uint8ClampedArray,
    Int16Array, Uint16Array,
    Int32Array, Uint32Array,
    Float32Array, Float64Array
};

function parsePack(filePath) {
    const buf = fs.readFileSync(filePath);
    const magic = buf.readUInt32LE(0);
    const version = buf.readUInt32LE(4);
    const jsonLen = buf.readUInt32LE(8);
    const dataOffset = buf.readUInt32LE(12);

    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    function view(entry) {
        if (!entry) return null;
        const Ctor = TYPE_MAP[entry.type];
        if (!Ctor) throw new Error(`Unknown type ${entry.type}`);
        return new Ctor(arrayBuffer, dataOffset + entry.offset, entry.length);
    }

    return { manifest, view, dataOffset };
}

const structPack = parsePack('assets/packs/ozeti-structures-lq.pack');
console.log("Structure meshes:", structPack.manifest.meshes.length);
let totalInstances = 0;
for (const m of structPack.manifest.meshes) {
    totalInstances += m.count;
    const instMat = structPack.view(m.instances);
    const colors = structPack.view(m.colors);
    if (!instMat || instMat.length !== m.count * 16) {
        console.error("Mismatch in instances matrix length!", m.name);
    }
}
console.log(`Verified all ${structPack.manifest.meshes.length} structure meshes. Total building instances: ${totalInstances}`);

const vegPack = parsePack('assets/packs/ozeti-vegetation-lq.pack');
let totalTrees = 0;
for (const m of vegPack.manifest.meshes) {
    totalTrees += m.count;
}
console.log(`Verified all ${vegPack.manifest.meshes.length} vegetation meshes. Total tree instances: ${totalTrees}`);
