const https = require('https');

function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

async function testWorldLibrary() {
    console.log("Fetching world library LQ header...");
    const url = "https://wd-maps-assets.n4lab.dev/world-library-lq.85ac06032eb1bd4f.pack";
    const buf = await fetchBuffer(url);
    console.log(`Downloaded world library: ${buf.length} bytes`);

    const jsonLen = buf.readUInt32LE(8);
    const manifest = JSON.parse(buf.toString('utf8', 16, 16 + jsonLen));
    console.log("Kind:", manifest.kind);
    console.log("Models count:", Object.keys(manifest.models || {}).length);
    console.log("Geometries count:", Object.keys(manifest.geometries || {}).length);
    console.log("Materials count:", (manifest.materials || []).length);
    console.log("Sample models:", Object.keys(manifest.models || {}).slice(0, 15));
}

testWorldLibrary().catch(console.error);
