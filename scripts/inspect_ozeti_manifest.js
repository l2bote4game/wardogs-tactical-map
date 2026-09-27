const fs = require('fs');

const d = JSON.parse(fs.readFileSync('assets/packs/manifest.json', 'utf8'));
console.log("=== MANIFEST MAPS KEYS ===");
console.log(JSON.stringify(d.maps.ozeti, null, 2));
