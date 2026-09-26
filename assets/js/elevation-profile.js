/* ============================================================
   WARDOGS 3D TACTICAL MAP — ELEVATION PROFILE GRAPH
   Renders 2D Cross-Section Terrain Slice between Observer and Target
   Features:
   - High-Precision Vector Terrain Profile with Gradient Fill
   - Direct Sightline Clearance / Obstacle Interception Point
   - Ballistic Parabolic Arc Overlay for Mortar/Artillery
   - Metric Callouts: Distance, Δh, Sightline Slope, Azimuth MIL
   ============================================================ */

export class ElevationProfileGraph {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.lastData = null;
    }

    render(losResult, ballisticResult = null) {
        if (!losResult || !losResult.samples || losResult.samples.length < 2) return;
        this.lastData = { los: losResult, ballistic: ballisticResult };

        const ctx = this.ctx;
        const w = this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        const h = this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;

        ctx.clearRect(0, 0, w, h);

        const samples = losResult.samples;
        const maxDist = losResult.horizontalDistance || 100;

        // Find min and max elevation to scale graph
        let minZ = 99999;
        let maxZ = -99999;

        samples.forEach((s) => {
            if (s.terrainZ < minZ) minZ = s.terrainZ;
            if (s.terrainZ > maxZ) maxZ = s.terrainZ;
            if (s.rayZ < minZ) minZ = s.rayZ;
            if (s.rayZ > maxZ) maxZ = s.rayZ;
        });

        if (ballisticResult && ballisticResult.valid && ballisticResult.apexHeight) {
            if (ballisticResult.apexHeight > maxZ) maxZ = ballisticResult.apexHeight;
        }

        minZ = Math.max(0, Math.floor(minZ - 20));
        maxZ = Math.ceil(maxZ + 30);
        const zRange = Math.max(50, maxZ - minZ);

        // Margins
        const padL = 60 * window.devicePixelRatio;
        const padR = 40 * window.devicePixelRatio;
        const padT = 30 * window.devicePixelRatio;
        const padB = 40 * window.devicePixelRatio;

        const plotW = w - padL - padR;
        const plotH = h - padT - padB;

        const mapX = (d) => padL + (d / maxDist) * plotW;
        const mapY = (z) => padT + (1.0 - (z - minZ) / zRange) * plotH;

        // 1. Grid Lines & Axis
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#64748b';
        ctx.font = `${10 * window.devicePixelRatio}px monospace`;

        // Horizontal Elevation Ticks (Every 50m or 100m)
        const stepZ = zRange > 250 ? 50 : 25;
        for (let z = Math.ceil(minZ / stepZ) * stepZ; z <= maxZ; z += stepZ) {
            const gy = mapY(z);
            ctx.beginPath();
            ctx.moveTo(padL, gy);
            ctx.lineTo(w - padR, gy);
            ctx.stroke();

            ctx.textAlign = 'right';
            ctx.fillText(`${z}m`, padL - 8 * window.devicePixelRatio, gy + 3 * window.devicePixelRatio);
        }

        // Vertical Distance Ticks (Every 200m or 500m)
        const stepD = maxDist > 1200 ? 400 : 200;
        for (let d = 0; d <= maxDist; d += stepD) {
            const gx = mapX(d);
            ctx.beginPath();
            ctx.moveTo(gx, padT);
            ctx.lineTo(gx, h - padB);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillText(`${d}m`, gx, h - padB + 16 * window.devicePixelRatio);
        }

        // 2. Terrain Profile Slice (Filled Polygon)
        ctx.beginPath();
        ctx.moveTo(mapX(0), h - padB);

        for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            ctx.lineTo(mapX(s.dist), mapY(s.terrainZ));
        }

        ctx.lineTo(mapX(maxDist), h - padB);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padT, 0, h - padB);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.7)');
        grad.addColorStop(1, 'rgba(10, 15, 26, 0.95)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Terrain Ridge Outline
        ctx.beginPath();
        for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const gx = mapX(s.dist);
            const gy = mapY(s.terrainZ);
            if (i === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
        }
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.stroke();

        // 3. Direct Sightline Laser
        const obsEyeZ = losResult.observerElev;
        const tgtZ = losResult.targetElev;

        ctx.beginPath();
        ctx.moveTo(mapX(0), mapY(obsEyeZ));
        ctx.lineTo(mapX(maxDist), mapY(tgtZ));
        ctx.strokeStyle = losResult.visible ? '#00f2fe' : '#ef4444';
        ctx.lineWidth = 2.5 * window.devicePixelRatio;
        ctx.setLineDash(losResult.visible ? [] : [6 * window.devicePixelRatio, 4 * window.devicePixelRatio]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Ballistic Parabolic Arc (if available)
        if (ballisticResult && ballisticResult.valid && ballisticResult.points) {
            ctx.beginPath();
            const wpn = ballisticResult.weapon;
            const pts = ballisticResult.points;
            for (let i = 0; i < pts.length; i++) {
                const frac = i / (pts.length - 1);
                const d = frac * maxDist;
                // Height in meters = world Y / scaleRatio
                const elevMeters = pts[i].y / this.canvas.scaleRatioMeters || (pts[i].y * 10);
                const gx = mapX(d);
                const gy = mapY(elevMeters);
                if (i === 0) ctx.moveTo(gx, gy);
                else ctx.lineTo(gx, gy);
            }
            ctx.strokeStyle = ballisticResult.isObstructed ? '#f59e0b' : '#38bdf8';
            ctx.lineWidth = 2 * window.devicePixelRatio;
            ctx.stroke();
        }

        // 5. Obstacle Interception Point
        if (!losResult.visible && losResult.obstacleDist) {
            const ox = mapX(losResult.obstacleDist);
            const oy = mapY(losResult.collisionPoint.z);

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(ox, oy, 6 * window.devicePixelRatio, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${10 * window.devicePixelRatio}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(`OBSTACLE @ ${losResult.obstacleDist}m`, ox, oy - 12 * window.devicePixelRatio);
        }

        // 6. Observer & Target Pins
        // Observer Pin
        const obsX = mapX(0);
        const obsY = mapY(obsEyeZ);
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(obsX, obsY, 5 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('OBS (EYE)', obsX + 18 * window.devicePixelRatio, obsY - 4 * window.devicePixelRatio);

        // Target Pin
        const tgtX = mapX(maxDist);
        const tgtY = mapY(tgtZ);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(tgtX, tgtY, 5 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('TARGET', tgtX - 24 * window.devicePixelRatio, tgtY - 4 * window.devicePixelRatio);
    }
}
