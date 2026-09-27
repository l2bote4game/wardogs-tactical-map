const fs = require('fs');

const buf = fs.readFileSync('assets/packs/ozeti-terrain.pack');
const jsonLen = buf.readUInt32LE(8);
const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

console.log("=== OZETI TERRAIN MANIFEST ===");
console.log(JSON.stringify(manifest, null, 2));
