const fs = require('fs');

const d = JSON.parse(fs.readFileSync('assets/packs/manifest.json', 'utf8'));
for (const m of ['bakurani', 'ozeti', 'zestafona']) {
    console.log(m, d.maps[m].surround);
}
