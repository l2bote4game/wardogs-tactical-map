const fs = require('fs');

const d = JSON.parse(fs.readFileSync('assets/packs/manifest.json', 'utf8'));
console.log("Root keys of manifest.json:", Object.keys(d));
for (const k of Object.keys(d)) {
    if (k !== 'maps') console.log(`d[${k}]:`, typeof d[k], Object.keys(d[k] || {}));
}
