/* ============================================================
   WARDOGS 3D TACTICAL MAP — 2D SYNCHRONIZED MINIMAP
   Features:
   - Real-Time 2D Top-Down Tactical Radar
   - Military Grid Overlay (A-T / 1-20)
   - Synchronized Camera View Frustum Cone
   - Draggable / Clickable Observer & Target Placement
   - 2x2km Control Zone Square Overlay
   ============================================================ */

import * as THREE from 'three';

export class TacticalMinimap {
    constructor(canvasElement, terrainEngine, viewshedEngine) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.terrain = terrainEngine;
        this.viewshed = viewshedEngine;

        // 2x2km Control Zone (WARDOGS mechanic)
        this.controlZone = {
            active: true,
            x: 1000,
            y: 1000,
            size: 800 // 800m or 1000m active zone
        };

        // Satellite background image cache
        this.satImages = {};
        this.preloadSatImages();

        this.initInteractions();
    }

    preloadSatImages() {
        const maps = ['bakurani', 'ozeti', 'zestafona'];
        maps.forEach(m => {
            const img = new Image();
            img.src = `assets/textures/${m}_sat.jpg`;
            this.satImages[m] = img;
        });
    }

    initInteractions() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            const mapSize = this.terrain.config.gridSize; // 2000m
            const gameX = Math.round((px / rect.width) * mapSize);
            const gameY = Math.round((py / rect.height) * mapSize);

            // Dispatch custom event to app
            this.canvas.dispatchEvent(new CustomEvent('minimap-click', {
                detail: { gameX, gameY }
            }));
        });
    }

    render(camera, batteryPos = null) {
        const ctx = this.ctx;
        const w = this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        const h = this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;

        ctx.clearRect(0, 0, w, h);

        // 0. Draw Satellite Orthophoto Background
        const curMap = this.terrain.currentMapId || 'bakurani';
        const satImg = this.satImages[curMap];
        if (satImg && satImg.complete && satImg.naturalWidth > 0) {
            ctx.globalAlpha = 0.55;
            ctx.drawImage(satImg, 0, 0, w, h);
            ctx.globalAlpha = 1.0;
        }

        const mapSize = this.terrain.config.sizeM || this.terrain.config.gridSize || 1200;
        const toPxX = (gx) => (gx / mapSize) * w;
        const toPxY = (gy) => (gy / mapSize) * h;

        // 1. Tactical Grid Cells (100m grid lines)
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
        ctx.lineWidth = 1;
        const cells = Math.round(mapSize / 100);
        for (let i = 0; i <= cells; i++) {
            const x = (i / cells) * w;
            const y = (i / cells) * h;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // 2. Control Zone (Zone of Control / Точка захвата)
        const mapCfg = this.terrain.config;
        if (mapCfg && mapCfg.controlZone) {
            const czX = toPxX(mapCfg.controlZone.x);
            const czY = toPxY(mapCfg.controlZone.y);
            const czRPx = (mapCfg.controlZone.radiusM / mapSize) * w;

            ctx.fillStyle = 'rgba(242, 244, 238, 0.08)';
            ctx.beginPath();
            ctx.arc(czX, czY, czRPx, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#f2f4ee';
            ctx.setLineDash([3 * window.devicePixelRatio, 3 * window.devicePixelRatio]);
            ctx.lineWidth = 1.5 * window.devicePixelRatio;
            ctx.beginPath();
            ctx.arc(czX, czY, czRPx, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f2f4ee';
            ctx.font = `bold ${8 * window.devicePixelRatio}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('ЗОНА КОНТРОЛЯ', czX, Math.max(10 * window.devicePixelRatio, czY - czRPx - 4 * window.devicePixelRatio));
        }

        // 3. Viewshed Range Circle on Minimap
        if (this.viewshed.showViewshed) {
            const ox = toPxX(this.viewshed.observer.x);
            const oy = toPxY(this.viewshed.observer.y);
            const rPx = (this.viewshed.radius / mapSize) * w;

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.lineWidth = 1.5 * window.devicePixelRatio;
            ctx.beginPath();
            ctx.arc(ox, oy, rPx, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 4. Line of Sight Ray (Minimap)
        const obsX = toPxX(this.viewshed.observer.x);
        const obsY = toPxY(this.viewshed.observer.y);
        const tgtX = toPxX(this.viewshed.target.x);
        const tgtY = toPxY(this.viewshed.target.y);

        ctx.beginPath();
        ctx.moveTo(obsX, obsY);
        ctx.lineTo(tgtX, tgtY);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.stroke();

        // 5. Battery Pin (if exists)
        if (batteryPos) {
            const bx = toPxX(batteryPos.x);
            const by = toPxY(batteryPos.y);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(bx, by, 5 * window.devicePixelRatio, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText('ARTY', bx + 8 * window.devicePixelRatio, by - 4 * window.devicePixelRatio);
        }

        // 6. Observer & Target Pins
        // Observer Pin
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(obsX, obsY, 6 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Target Pin
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tgtX, tgtY, 6 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 7. Camera View Frustum Cone
        if (camera) {
            const camGame = this.terrain.worldToGame(camera.position.x, camera.position.z);
            const cx = toPxX(camGame.x);
            const cy = toPxY(camGame.y);

            // Camera heading
            const dir = camera.getWorldDirection(new THREE.Vector3());
            const angle = Math.atan2(dir.x, dir.z);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 32 * window.devicePixelRatio, angle - 0.45, angle + 0.45);
            ctx.closePath();
            ctx.fill();
        }
    }
}
