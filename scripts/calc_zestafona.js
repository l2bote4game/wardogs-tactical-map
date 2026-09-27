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

console.log("=== ZESTAFONA CONTROL ZONES ===");
console.log("zestafona-default:", Bl("zestafona", [0.4312, 0.3711]));
console.log("zestafona-houses:", Bl("zestafona", [0.4207, 0.3651]));
console.log("zestafona-watertreatment:", Bl("zestafona", [0.4272, 0.3877]));
