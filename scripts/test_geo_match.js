const fs = require('fs');

function parsePack(filePath) {
    const buf = fs.readFileSync(filePath);
    const jsonLen = buf.readUInt32LE(8);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
    return manifest;
}

const structManifest = parsePack('assets/packs/ozeti-structures-lq.pack');
const worldManifest = parsePack('assets/packs/world-library-lq.pack');

let foundGeos = 0;
let missingGeos = 0;
for (const m of structManifest.meshes) {
    if (worldManifest.geometries[m.geometry]) {
        foundGeos++;
    } else {
        missingGeos++;
    }
}
console.log(`Structures: Found in world library: ${foundGeos}, Missing: ${missingGeos}`);

const vegManifest = parsePack('assets/packs/ozeti-vegetation-lq.pack');
let foundVeg = 0;
let missingVeg = 0;
for (const m of vegManifest.meshes) {
    if (worldManifest.geometries[m.geometry]) {
        foundVeg++;
    } else {
        missingVeg++;
    }
}
console.log(`Vegetation: Found in world library: ${foundVeg}, Missing: ${missingVeg}`);
