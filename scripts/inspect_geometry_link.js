const fs = require('fs');

function parsePack(filePath) {
    const buf = fs.readFileSync(filePath);
    const jsonLen = buf.readUInt32LE(8);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
    return manifest;
}

const structManifest = parsePack('assets/packs/ozeti-structures-lq.pack');
console.log("=== FIRST 5 MESHES IN OZETI STRUCTURES ===");
console.log(JSON.stringify(structManifest.meshes.slice(0, 5), null, 2));

const worldManifest = parsePack('assets/packs/world-library-lq.pack');
console.log("=== WORLD LIBRARY GEOMETRIES KEYS ===");
console.log(Object.keys(worldManifest.geometries).slice(0, 10));
console.log("=== WORLD LIBRARY SAMPLE GEOMETRY ===");
const firstGeoKey = Object.keys(worldManifest.geometries)[0];
console.log(firstGeoKey, JSON.stringify(worldManifest.geometries[firstGeoKey], null, 2));
