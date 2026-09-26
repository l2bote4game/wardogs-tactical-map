const https = require('https');

function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

async function test() {
    console.log("Fetching terrain pack header...");
    const url = "https://wd-maps-assets.n4lab.dev/bakurani-terrain.760409d8093b57c0.pack";
    const buf = await fetchBuffer(url);
    console.log(`Downloaded ${buf.length} bytes`);

    const magic = buf.readUInt32LE(0);
    const version = buf.readUInt32LE(4);
    const jsonLen = buf.readUInt32LE(8);
    const dataOffset = buf.readUInt32LE(12);

    console.log({ magic: magic.toString(16), version, jsonLen, dataOffset });

    const manifestStr = buf.toString('utf8', 16, 16 + jsonLen);
    const manifest = JSON.parse(manifestStr);
    console.log("Manifest meshes:", manifest.meshes.length);
    console.log("Mesh 0:", manifest.meshes[0].name);
    console.log("Bounds:", manifest.meshes[0].bounds);
}

test().catch(console.error);
