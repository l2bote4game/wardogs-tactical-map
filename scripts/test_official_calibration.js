const jr = { minX: 0, maxX: 163.84, minY: 0, maxY: 163.84 };
const Dge = {
    bakurani: { id: "bakurani", sizeM: 1200, originX: 80.1734656, originY: 70.90359916343873, unitsPerMetre: 0.01003817193537599 },
    ozeti: { id: "ozeti", sizeM: 1400, originX: 100.3476529503742, originY: 63.356928, unitsPerMetre: 0.010041985032368313 },
    zestafona: { id: "zestafona", sizeM: 1000, originX: 70.55529889117956, originY: 103.13181866666666, unitsPerMetre: 0.01000673538669764 }
};

function Bl(siteId, [u, v]) {
    const x = u * jr.maxX;
    const y = (1 - v) * jr.maxY;
    const cal = Dge[siteId];
    const siteX = (x - cal.originX) / cal.unitsPerMetre;
    const siteZ = (cal.originY - y) / cal.unitsPerMetre;
    return { x: siteX, z: siteZ };
}

// Bakurani Control Zone: pos: [0.4877, 0.5617], radiusM: 500
console.log("=== BAKURANI DEFAULT CONTROL ZONE ===");
console.log("Bl:", Bl("bakurani", [0.4877, 0.5617]));

// Bakurani Spawns:
console.log("=== BAKURANI SPAWNS ===");
console.log("Chuta (Manticore):", Bl("bakurani", [0.2455, 0.5292]));
console.log("Liknisi (Manticore):", Bl("bakurani", [0.3285, 0.6012]));
console.log("Khevuli (Valkyra):", Bl("bakurani", [0.7208, 0.5710]));
console.log("Baghi (Lonestar):", Bl("bakurani", [0.5293, 0.7992]));

// Ozeti Control Zone: pos: [0.6104, 0.6123]
console.log("=== OZETI DEFAULT CONTROL ZONE ===");
console.log("Bl:", Bl("ozeti", [0.6104, 0.6123]));
console.log("=== OZETI SPAWNS ===");
console.log("Barcelona (Valkyra):", Bl("ozeti", [0.8391, 0.5915]));
console.log("Malaga (Manticore):", Bl("ozeti", [0.4216, 0.4633]));
console.log("Hanover (Lonestar):", Bl("ozeti", [0.5667, 0.7546]));
