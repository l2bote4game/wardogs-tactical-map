const fs = require('fs');

// Search for default tier in index-BZRXANjt.js
// Read index-BZRXANjt.js if we have it or search for quality
console.log("Checking manifest quality tiers...");
const d = JSON.parse(fs.readFileSync('assets/packs/manifest.json', 'utf8'));
console.log("Libraries in manifest:");
for (const k of Object.keys(d.libraries || {})) {
    console.log("  ", k, d.libraries[k].url, d.libraries[k].bytes);
}
