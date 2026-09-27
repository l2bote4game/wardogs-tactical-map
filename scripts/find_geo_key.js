const fs = require('fs');

const manifestText = fs.readFileSync('assets/packs/manifest.json', 'utf8');
const key = "b902ee7c0f5f2f965b39f17c7ddb8741ed177b7d2f96dfb437867811cbcc9323";
console.log("Found in manifest.json?", manifestText.includes(key));

// Also let's check all geometry keys in ozeti-structures
const structPack = fs.readFileSync('assets/packs/ozeti-structures-lq.pack');
const jsonLen = structPack.readUInt32LE(8);
const structManifest = JSON.parse(structPack.toString('utf8', 16, 16 + jsonLen));
console.log("Structure geometries (unique):", new Set(structManifest.meshes.map(m => m.geometry)));
console.log("Structure meshes names:", structManifest.meshes.map(m => m.name));
