const fs = require('fs');

const buf = fs.readFileSync('assets/packs/ozeti-terrain.pack');
const jsonLen = buf.readUInt32LE(8);
const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

const geoDef = manifest.geometries[manifest.meshes[0].geometry];
const normDef = geoDef.attributes.normal;
console.log("normDef:", normDef);

const binOffset = 16 + jsonLen;
const viewOffset = binOffset + normDef.view.offset;
console.log("binOffset:", binOffset, "viewOffset:", viewOffset, "file size:", buf.length);

const floats = new Float32Array(buf.buffer, buf.byteOffset + viewOffset, normDef.view.length);
console.log("First 12 normals:", Array.from(floats.slice(0, 12)));
console.log("Normals length:", floats.length);
