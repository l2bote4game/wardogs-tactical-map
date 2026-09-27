const fs = require('fs');

// We have index-BZRXANjt.js in our memory or we can read it if saved
// Let's check if index-BZRXANjt.js was saved locally
const matches = [];
function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const p = dir + '/' + f;
        if (fs.statSync(p).isDirectory()) {
            if (!f.startsWith('.') && f !== 'node_modules') walk(p);
        } else if (f.includes('index-BZR') || f.includes('n4lab')) {
            matches.push(p);
        }
    }
}
walk('.');
console.log("Matched files:", matches);
