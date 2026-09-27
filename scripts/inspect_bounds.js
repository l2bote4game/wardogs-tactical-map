const fs = require('fs');

const buf = fs.readFileSync('assets/packs/bakurani-structures-lq.pack');
const jsonLen = buf.readUInt32LE(8);
const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

for (const m of manifest.meshes.slice(0, 15)) {
    console.log(m.name, "layer:", m.layer, "bounds:", m.bounds);
}
