/* ============================================================
   WARDOGS TACTICAL 2D MAP — HIGH-RESOLUTION INTERACTIVE MAP
   Features:
   - Full-Screen 1024x1024 Satellite Orthophoto of Bakurani, Ozeti, Zestafona
   - Smooth Mouse-Wheel Zoom (0.6x to 5.0x) centered on cursor
   - Smooth Mouse Drag Pan across the battlefield
   - Interactive Draggable Markers: OBS, TGT, ARTY, ПВО
   - Dynamic Artillery Range Rings (Min & Max range)
   - Military MGRS Grid Overlay (A-T / 1-20) with coordinate tags
   - Real-Time Viewshed & Sightline Vectors
   ============================================================ */

import { MAP_CONFIGS, OFFICIAL_WEAPON_TABLES, AIR_DEFENSE_SYSTEMS, TACTICAL_GRID } from './config.js';

export class Tactical2DMap {
    constructor(canvasContainer, terrainEngine, viewshedEngine, ballisticsEngine, airDefenseEngine) {
        this.container = canvasContainer;
        this.terrain = terrainEngine;
        this.viewshed = viewshedEngine;
        this.ballistics = ballisticsEngine;
        this.airdefense = airDefenseEngine;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'tactical-2d-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.inset = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '5';
        this.canvas.style.display = 'none'; // Hidden when in 3D Orbit mode
        this.canvas.style.cursor = 'crosshair';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        // Transform (Pan & Zoom)
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.draggedMarker = null; // 'obs', 'tgt', 'arty', 'pvo'

        // Images cache
        this.satImages = {};
        this.activeMapId = 'bakurani';
        this.preloadImages();

        this.initEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    preloadImages() {
        ['bakurani', 'ozeti', 'zestafona'].forEach((m) => {
            const img = new Image();
            img.src = `assets/textures/${m}_sat.jpg`;
            img.onload = () => {
                if (this.activeMapId === m) this.render();
            };
            this.satImages[m] = img;
        });
    }

    setMap(mapId) {
        this.activeMapId = mapId;
        this.resetView();
        this.render();
    }

    setVisible(flag) {
        this.canvas.style.display = flag ? 'block' : 'none';
        if (flag) {
            this.resize();
            this.render();
        }
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.render();
    }

    resetView() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const minDim = Math.min(w, h);
        this.zoom = (minDim * 0.88) / 2000; // fit 2000m map nicely
        this.panX = (w - 2000 * this.zoom) / 2;
        this.panY = (h - 2000 * this.zoom) / 2;
    }

    /* Coordinate conversions */
    gameToScreen(gx, gy) {
        return {
            x: this.panX + gx * this.zoom,
            y: this.panY + gy * this.zoom
        };
    }

    screenToGame(sx, sy) {
        return {
            x: (sx - this.panX) / this.zoom,
            y: (sy - this.panY) / this.zoom
        };
    }

    initEvents() {
        const c = this.canvas;

        // Mouse Wheel Zoom
        c.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = c.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * window.devicePixelRatio;
            const mouseY = (e.clientY - rect.top) * window.devicePixelRatio;

            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.max(0.2, Math.min(6.0, this.zoom * zoomFactor));

            // Zoom centered on cursor
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            this.render();
        }, { passive: false });

        // Mouse Down (Drag or Click)
        c.addEventListener('pointerdown', (e) => {
            const rect = c.getBoundingClientRect();
            const sx = (e.clientX - rect.left) * window.devicePixelRatio;
            const sy = (e.clientY - rect.top) * window.devicePixelRatio;
            const gamePt = this.screenToGame(sx, sy);

            // Check if clicking near any existing marker to drag it
            const hitDist = 20 * window.devicePixelRatio;
            const obsPt = this.gameToScreen(this.viewshed.observer.x, this.viewshed.observer.y);
            const tgtPt = this.gameToScreen(this.viewshed.target.x, this.viewshed.target.y);
            const artyPt = this.gameToScreen(this.ballistics.battery.x, this.ballistics.battery.y);

            if (Math.hypot(sx - obsPt.x, sy - obsPt.y) < hitDist) {
                this.draggedMarker = 'obs';
            } else if (Math.hypot(sx - tgtPt.x, sy - tgtPt.y) < hitDist) {
                this.draggedMarker = 'tgt';
            } else if (Math.hypot(sx - artyPt.x, sy - artyPt.y) < hitDist) {
                this.draggedMarker = 'arty';
            } else {
                // Otherwise start map pan or place active tool
                if (e.button === 0 && !e.shiftKey && !e.altKey && window.app) {
                    const tool = window.app.activeTool;
                    if (tool === 'obs') {
                        this.viewshed.setObserver(gamePt.x, gamePt.y);
                        this.draggedMarker = 'obs';
                    } else if (tool === 'tgt') {
                        this.viewshed.setTarget(gamePt.x, gamePt.y);
                        this.ballistics.setTarget(gamePt.x, gamePt.y);
                        this.draggedMarker = 'tgt';
                    } else if (tool === 'arty') {
                        this.ballistics.setBattery(gamePt.x, gamePt.y);
                        this.draggedMarker = 'arty';
                    } else if (tool === 'pvo') {
                        this.airdefense.updatePosition(gamePt.x, gamePt.y);
                        this.airdefense.setVisible(true);
                    }
                    if (window.app.updateAll) window.app.updateAll();
                } else {
                    this.isDragging = true;
                    this.dragStartX = sx - this.panX;
                    this.dragStartY = sy - this.panY;
                }
            }

            this.render();
        });

        // Mouse Move
        c.addEventListener('pointermove', (e) => {
            const rect = c.getBoundingClientRect();
            const sx = (e.clientX - rect.left) * window.devicePixelRatio;
            const sy = (e.clientY - rect.top) * window.devicePixelRatio;
            const gamePt = this.screenToGame(sx, sy);

            // Update Telemetry on Top Bar
            const curEl = document.getElementById('telemetry-cursor');
            if (curEl) {
                const elev = Math.round(this.terrain.getElevation(gamePt.x, gamePt.y));
                curEl.textContent = `X: ${String(Math.round(gamePt.x)).padStart(4, '0')}  Y: ${String(Math.round(gamePt.y)).padStart(4, '0')}  Z: ${elev}m`;
            }
            const gridEl = document.getElementById('telemetry-grid');
            if (gridEl) {
                const colIdx = Math.max(0, Math.min(19, Math.floor((gamePt.x / 2000) * 20)));
                const rowIdx = Math.max(1, Math.min(20, Math.floor((gamePt.y / 2000) * 20) + 1));
                const letter = TACTICAL_GRID.letters[colIdx] || 'A';
                gridEl.textContent = `${letter}-${rowIdx}`;
            }

            // Dragging marker
            if (this.draggedMarker) {
                const gx = Math.max(0, Math.min(2000, gamePt.x));
                const gy = Math.max(0, Math.min(2000, gamePt.y));
                if (this.draggedMarker === 'obs') {
                    this.viewshed.setObserver(gx, gy);
                } else if (this.draggedMarker === 'tgt') {
                    this.viewshed.setTarget(gx, gy);
                    this.ballistics.setTarget(gx, gy);
                } else if (this.draggedMarker === 'arty') {
                    this.ballistics.setBattery(gx, gy);
                }
                if (window.app && window.app.updateAll) window.app.updateAll();
                this.render();
            } else if (this.isDragging) {
                this.panX = sx - this.dragStartX;
                this.panY = sy - this.dragStartY;
                this.render();
            }
        });

        // Mouse Up
        window.addEventListener('pointerup', () => {
            this.isDragging = false;
            this.draggedMarker = null;
        });
    }

    render() {
        if (!this.canvas || this.canvas.style.display === 'none') return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const dpr = window.devicePixelRatio;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#080a0f';
        ctx.fillRect(0, 0, w, h);

        const img = this.satImages[this.activeMapId];
        const origin = this.gameToScreen(0, 0);
        const mapW = 2000 * this.zoom;
        const mapH = 2000 * this.zoom;

        // 1. Draw Satellite Orthophoto
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, origin.x, origin.y, mapW, mapH);
        } else {
            ctx.fillStyle = '#141c24';
            ctx.fillRect(origin.x, origin.y, mapW, mapH);
        }

        // Map Border
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(origin.x, origin.y, mapW, mapH);

        // 2. Tactical MGRS Grid (20x20 cells of 100m)
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.18)';
        ctx.lineWidth = 1 * dpr;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.65)';
        ctx.font = `bold ${10 * dpr}px 'JetBrains Mono', monospace`;

        for (let i = 0; i <= 20; i++) {
            const gx = i * 100;
            const pt0 = this.gameToScreen(gx, 0);
            const pt1 = this.gameToScreen(gx, 2000);

            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(pt0.x, pt0.y);
            ctx.lineTo(pt1.x, pt1.y);
            ctx.stroke();

            // Letters on top
            if (i < 20) {
                const colCenter = this.gameToScreen(gx + 50, 20);
                const letter = TACTICAL_GRID.letters[i] || '';
                ctx.fillText(letter, colCenter.x - 4 * dpr, colCenter.y);
            }
        }

        for (let j = 0; j <= 20; j++) {
            const gy = j * 100;
            const pt0 = this.gameToScreen(0, gy);
            const pt1 = this.gameToScreen(2000, gy);

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(pt0.x, pt0.y);
            ctx.lineTo(pt1.x, pt1.y);
            ctx.stroke();

            // Numbers on left
            if (j < 20) {
                const rowCenter = this.gameToScreen(10, gy + 50);
                ctx.fillText(String(j + 1), rowCenter.x, rowCenter.y + 4 * dpr);
            }
        }

        // 3. Faction Bases and Control Zone
        const mapCfg = MAP_CONFIGS[this.activeMapId];
        if (mapCfg) {
            // Blue Base
            if (mapCfg.blueBase) {
                const bPt = this.gameToScreen(mapCfg.blueBase.x, mapCfg.blueBase.y);
                const bRadPx = (mapCfg.blueBase.radiusM || 180) * this.zoom;
                ctx.fillStyle = 'rgba(47, 128, 200, 0.15)';
                ctx.beginPath();
                ctx.arc(bPt.x, bPt.y, bRadPx, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#2f80c8';
                ctx.lineWidth = 2 * dpr;
                ctx.stroke();

                ctx.fillStyle = '#60a5fa';
                ctx.beginPath();
                ctx.arc(bPt.x, bPt.y, 6 * dpr, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = `bold ${12 * dpr}px "JetBrains Mono", sans-serif`;
                ctx.fillText(mapCfg.blueBase.name, bPt.x + 10 * dpr, bPt.y + 4 * dpr);
            }

            // Red Base
            if (mapCfg.redBase) {
                const rPt = this.gameToScreen(mapCfg.redBase.x, mapCfg.redBase.y);
                const rRadPx = (mapCfg.redBase.radiusM || 180) * this.zoom;
                ctx.fillStyle = 'rgba(216, 68, 60, 0.15)';
                ctx.beginPath();
                ctx.arc(rPt.x, rPt.y, rRadPx, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#d8443c';
                ctx.lineWidth = 2 * dpr;
                ctx.stroke();

                ctx.fillStyle = '#f87171';
                ctx.beginPath();
                ctx.arc(rPt.x, rPt.y, 6 * dpr, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = `bold ${12 * dpr}px "JetBrains Mono", sans-serif`;
                ctx.fillText(mapCfg.redBase.name, rPt.x + 10 * dpr, rPt.y + 4 * dpr);
            }

            // Control Zone
            if (mapCfg.controlZone) {
                const czPt = this.gameToScreen(mapCfg.controlZone.x, mapCfg.controlZone.y);
                const czRadPx = (mapCfg.controlZone.radiusM || 220) * this.zoom;
                ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
                ctx.beginPath();
                ctx.arc(czPt.x, czPt.y, czRadPx, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2.5 * dpr;
                ctx.stroke();

                ctx.fillStyle = '#fde047';
                ctx.beginPath();
                ctx.arc(czPt.x, czPt.y, 7 * dpr, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = `bold ${12 * dpr}px "JetBrains Mono", sans-serif`;
                ctx.fillText(mapCfg.controlZone.name, czPt.x + 12 * dpr, czPt.y + 4 * dpr);
            }
        }

        // 4. Air Defense (ПВО) Envelope
        if (this.airdefense && this.airdefense.visible) {
            const pvoPt = this.gameToScreen(this.airdefense.site.x, this.airdefense.site.y);
            const pvoRadiusPx = (this.airdefense.config?.engagementRadius || 1200) * this.zoom;

            ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
            ctx.beginPath();
            ctx.arc(pvoPt.x, pvoPt.y, pvoRadiusPx, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#10b981';
            ctx.setLineDash([6 * dpr, 4 * dpr]);
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.arc(pvoPt.x, pvoPt.y, pvoRadiusPx, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Marker
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(pvoPt.x, pvoPt.y, 6 * dpr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(this.airdefense.config?.name || 'ПВО', pvoPt.x + 10 * dpr, pvoPt.y - 6 * dpr);
        }

        // 5. Artillery Battery & Range Rings
        const artyPt = this.gameToScreen(this.ballistics.battery.x, this.ballistics.battery.y);
        const wpnTable = OFFICIAL_WEAPON_TABLES[this.ballistics.currentWeaponId] || OFFICIAL_WEAPON_TABLES.mortar;
        const minRPx = wpnTable.minRange * this.zoom;
        const maxRPx = wpnTable.maxRange * this.zoom;

        // Min Range Ring (Red Zone)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.arc(artyPt.x, artyPt.y, minRPx, 0, Math.PI * 2);
        ctx.stroke();

        // Max Range Ring (Green Envelope)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(artyPt.x, artyPt.y, maxRPx, 0, Math.PI * 2);
        ctx.stroke();

        // Battery Marker
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(artyPt.x, artyPt.y, 7 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`ARTY: ${wpnTable.name}`, artyPt.x + 10 * dpr, artyPt.y + 4 * dpr);

        // 6. Direct Line of Sight Vector (OBS -> TGT)
        const obsPt = this.gameToScreen(this.viewshed.observer.x, this.viewshed.observer.y);
        const tgtPt = this.gameToScreen(this.viewshed.target.x, this.viewshed.target.y);

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(obsPt.x, obsPt.y);
        ctx.lineTo(tgtPt.x, tgtPt.y);
        ctx.stroke();

        // 7. Observer Viewshed Circle & Cone
        if (this.viewshed.showViewshed) {
            const vRadiusPx = this.viewshed.radius * this.zoom;
            ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
            ctx.beginPath();
            ctx.arc(obsPt.x, obsPt.y, vRadiusPx, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.arc(obsPt.x, obsPt.y, vRadiusPx, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Observer Marker (Cyan)
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(obsPt.x, obsPt.y, 8 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`OBS (${this.viewshed.observer.stance || '1.75m'})`, obsPt.x + 12 * dpr, obsPt.y + 4 * dpr);

        // Target Marker (Red)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tgtPt.x, tgtPt.y, 8 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TARGET', tgtPt.x + 12 * dpr, tgtPt.y + 4 * dpr);

        // 8. Key Tactical POI Markers
        const cfg = MAP_CONFIGS[this.activeMapId];
        if (cfg && cfg.pois) {
            cfg.pois.forEach((poi) => {
                const pt = this.gameToScreen(poi.x, poi.y);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 3 * dpr, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = `${9 * dpr}px 'Space Grotesk', sans-serif`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText(poi.name, pt.x + 6 * dpr, pt.y - 3 * dpr);
            });
        }
    }
}
