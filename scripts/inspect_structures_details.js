const fs = require('fs');

function inspectStructures(mapId) {
    const buf = fs.readFileSync(`assets/packs/${mapId}-structures-lq.pack`);
    const jsonLen = buf.readUInt32LE(8);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));

    console.log(`=== ${mapId.toUpperCase()} STRUCTURES LQ ===`);
    console.log("Total meshes:", manifest.meshes.length);
    const layers = {};
    for (const m of manifest.meshes) {
        layers[m.layer] = (layers[m.layer] || 0) + m.count;
    }
    console.log("Layers:", layers);
    console.log("First 10 mesh names:", manifest.meshes.slice(0, 10).map(m => `${m.name} (${m.layer}, count: ${m.count})`));
}

inspectStructures('bakurani');
inspectStructures('ozeti');
