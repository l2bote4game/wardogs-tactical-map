const fs = require('fs');

const d = JSON.parse(fs.readFileSync('assets/packs/manifest.json', 'utf8'));
console.log("=== SHARED PACKS ===");
console.log(JSON.stringify(d.shared, null, 2));
