const fs = require('fs');

const buf = fs.readFileSync('assets/packs/ozeti-terrain.pack');
const dataView = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const magic = dataView.getUint32(0, true);
const version = dataView.getUint32(4, true);
const jsonLen = dataView.getUint32(8, true);
const dataOffset = dataView.getUint32(12, true);

console.log({ magic: magic.toString(16), version, jsonLen, dataOffset, "dataOffset % 4": dataOffset % 4 });
