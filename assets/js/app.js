/* ============================================================
   WARDOGS 3D TACTICAL MAP — MAIN APPLICATION CONTROLLER
   Wires Three.js Terrain, Viewshed, Ballistics, Minimap & HUD
   ============================================================ */

import * as THREE from 'three';
import { MAP_CONFIGS, STANCE_PRESETS, OFFICIAL_WEAPON_TABLES, TACTICAL_GRID } from './config.js';
import { TerrainEngine } from './terrain-engine.js';
import { ViewshedEngine } from './viewshed-engine.js';
import { BallisticsEngine } from './ballistics-engine.js';
import { AirDefenseEngine } from './air-defense-engine.js';
import { ElevationProfileGraph } from './elevation-profile.js';
import { TacticalMinimap } from './minimap.js';
import { Tactical2DMap } from './tactical-2d-map.js';
import { tacticalAudio } from './audio.js';

class TacticalApp {
    constructor() {
        this.activeTool = 'obs'; // 'obs', 'tgt', 'arty', 'pvo', 'cz'
        this.terrain = null;
        this.viewshed = null;
        this.ballistics = null;
        this.airdefense = null;
        this.elevationProfile = null;
        this.minimap = null;
        this.tactical2D = null;

        this.init();
    }

    init() {
        // 1. Initialize 3D Terrain Engine
        const viewport = document.getElementById('map-viewport');
        this.terrain = new TerrainEngine(viewport);

        // 2. Initialize Subsystems
        this.viewshed = new ViewshedEngine(this.terrain);
        this.ballistics = new BallisticsEngine(this.terrain);
        this.airdefense = new AirDefenseEngine(this.terrain);

        // 3. Initialize Interactive 2D Map (Full screen pan & zoom)
        this.tactical2D = new Tactical2DMap(viewport, this.terrain, this.viewshed, this.ballistics, this.airdefense);

        // 4. Initialize Elevation Profile & Minimap
        const elevCanvas = document.getElementById('elevation-canvas');
        this.elevationProfile = new ElevationProfileGraph(elevCanvas);

        const miniCanvas = document.getElementById('minimap-canvas');
        this.minimap = new TacticalMinimap(miniCanvas, this.terrain, this.viewshed);

        // 4. Wire Controls & Events
        this.setupMapSelector();
        this.setupToolRail();
        this.setupViewshedControls();
        this.setupBallisticsControls();
        this.setupCameraControls();
        this.setupCanvasClicks();
        this.setupMinimapEvents();
        this.setupHashSync();

        // 5. Populate POI List
        this.renderPOIList();

        // 6. Initial Update
        this.updateAll();

        // 7. Start Animation Loop
        this.lastTime = performance.now();
        this.animate();
    }

    /* ------------------------------------------------------------
       UI Wireup & Handlers
       ------------------------------------------------------------ */
    setupMapSelector() {
        const container = document.getElementById('map-selector');
        container.querySelectorAll('.map-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const mapId = btn.dataset.map;
                if (mapId === this.terrain.currentMapId) return;

                container.querySelectorAll('.map-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                tacticalAudio.playClick();
                this.terrain.loadMap(mapId);
                this.tactical2D.setMap(mapId);

                // Set defaults for map
                const cfg = MAP_CONFIGS[mapId];
                this.viewshed.setObserver(cfg.defaultObserver.x, cfg.defaultObserver.y, cfg.defaultObserver.stance);
                this.viewshed.setTarget(cfg.defaultTarget.x, cfg.defaultTarget.y);
                this.ballistics.setBattery(cfg.defaultObserver.x, cfg.defaultObserver.y);
                this.ballistics.setTarget(cfg.defaultTarget.x, cfg.defaultTarget.y);
                this.airdefense.updatePosition(cfg.defaultObserver.x, cfg.defaultObserver.y);

                this.renderPOIList();
                this.updateAll();
                this.syncHash();
            });
        });
    }

    setupToolRail() {
        const tools = ['obs', 'tgt', 'arty', 'pvo', 'cz'];
        tools.forEach((t) => {
            const btn = document.getElementById(`tool-${t}`);
            if (!btn) return;
            btn.addEventListener('click', () => {
                if (t === 'cz') {
                    // Toggle Control Zone visibility
                    this.minimap.controlZone.active = !this.minimap.controlZone.active;
                    btn.classList.toggle('active', this.minimap.controlZone.active);
                    tacticalAudio.playClick();
                    return;
                }

                tools.forEach((other) => {
                    const b = document.getElementById(`tool-${other}`);
                    if (b && other !== 'cz') b.classList.remove('active');
                });
                btn.classList.add('active');
                this.activeTool = t;
                tacticalAudio.playClick();
            });
        });
    }

    setupViewshedControls() {
        // Stance Buttons
        const stanceBtns = document.querySelectorAll('.stance-btn');
        stanceBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                stanceBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                const stance = btn.dataset.stance;
                this.viewshed.setObserverStance(stance);
                tacticalAudio.playClick();
                this.updateAll();
            });
        });

        // Sliders
        const radiusSlider = document.getElementById('input-radius');
        const radiusVal = document.getElementById('val-radius');
        radiusSlider.addEventListener('input', (e) => {
            const r = parseInt(e.target.value, 10);
            radiusVal.textContent = `${r} m`;
            this.viewshed.setViewshedRadius(r);
        });

        const fovSlider = document.getElementById('input-fov');
        const fovVal = document.getElementById('val-fov');
        fovSlider.addEventListener('input', (e) => {
            const f = parseInt(e.target.value, 10);
            fovVal.textContent = f >= 360 ? '360° (Full)' : `${f}°`;
            this.viewshed.setViewshedFov(f);
        });

        const azSlider = document.getElementById('input-azimuth');
        const azVal = document.getElementById('val-azimuth');
        azSlider.addEventListener('input', (e) => {
            const a = parseInt(e.target.value, 10);
            azVal.textContent = `${a}°`;
            this.viewshed.setViewshedAzimuth(a);
        });

        // Toggles
        document.getElementById('chk-viewshed').addEventListener('change', (e) => {
            this.viewshed.toggleViewshed(e.target.checked);
        });

        document.getElementById('chk-blind').addEventListener('change', (e) => {
            this.viewshed.toggleBlindZones(e.target.checked);
        });

        // ПВО Toggle & System Selection
        const chkPvo = document.getElementById('chk-pvo');
        chkPvo.addEventListener('change', (e) => {
            this.airdefense.setVisible(e.target.checked);
            tacticalAudio.playClick();
        });

        const selectPvo = document.getElementById('select-pvo-system');
        if (selectPvo) {
            selectPvo.addEventListener('change', (e) => {
                const sysId = e.target.value;
                this.airdefense.setSystem(sysId);
                const descEl = document.getElementById('pvo-description');
                if (descEl) {
                    if (sysId === 'verba') {
                        descEl.textContent = '9K333 Verba: Infantry shoulder-fired IR homing missile (Support Lv.16). Locks onto AH-6M/AH-6R scout helicopters within 1200m. Requires direct Line of Sight.';
                    } else if (sysId === 'zu23') {
                        descEl.textContent = 'FOB ZU-23-2: Base stationary twin 23mm flak battery. 1500m protective bubble. High rate-of-fire shredder against low-altitude transport and scout helis.';
                    } else if (sysId === 'infantry') {
                        descEl.textContent = 'Player Threat Rings: Red = 50m CQB / SMG; Amber = 300m Assault Rifle; Yellow = 600m DMR; Cyan = 1200m Sniper Killzone; Gray = 1500m Draw Distance.';
                    }
                }
                tacticalAudio.playClick();
            });
        }
    }

    setupBallisticsControls() {
        const selectWpn = document.getElementById('select-weapon');
        selectWpn.addEventListener('change', (e) => {
            this.ballistics.setWeapon(e.target.value);
            tacticalAudio.playClick();
            this.updateAll();
        });

        const btnHigh = document.getElementById('btn-arc-high');
        const btnLow = document.getElementById('btn-arc-low');

        btnHigh.addEventListener('click', () => {
            btnHigh.classList.add('active');
            btnLow.classList.remove('active');
            this.ballistics.setArcMode('high');
            tacticalAudio.playClick();
            this.updateAll();
        });

        btnLow.addEventListener('click', () => {
            btnLow.classList.add('active');
            btnHigh.classList.remove('active');
            this.ballistics.setArcMode('low');
            tacticalAudio.playClick();
            this.updateAll();
        });
    }

    setupCameraControls() {
        const btnOrbit = document.getElementById('btn-view-orbit');
        const btnTopdown = document.getElementById('btn-view-topdown');
        const btnScope = document.getElementById('btn-view-scope');
        const scopeOverlay = document.getElementById('scope-overlay');

        const setCamBtn = (activeBtn) => {
            [btnOrbit, btnTopdown, btnScope].forEach((b) => b.classList.remove('active'));
            activeBtn.classList.add('active');
            tacticalAudio.playClick();
        };

        btnOrbit.addEventListener('click', () => {
            setCamBtn(btnOrbit);
            scopeOverlay.classList.remove('active');
            this.tactical2D.setVisible(false);
            this.terrain.setCameraView('orbit');
        });

        btnTopdown.addEventListener('click', () => {
            setCamBtn(btnTopdown);
            scopeOverlay.classList.remove('active');
            this.tactical2D.setVisible(true);
        });

        btnScope.addEventListener('click', () => {
            setCamBtn(btnScope);
            scopeOverlay.classList.add('active');
            this.tactical2D.setVisible(false);
            this.terrain.setCameraView('scope', this.viewshed.observer, this.viewshed.target);
            tacticalAudio.playLaserPing();
        });

        // Map Render Style Buttons (Hybrid / Satellite / Topo)
        const btnHybrid = document.getElementById('btn-style-hybrid');
        const btnSat = document.getElementById('btn-style-sat');
        const btnTopo = document.getElementById('btn-style-topo');

        const setStyleBtn = (active) => {
            [btnHybrid, btnSat, btnTopo].forEach(b => b && b.classList.remove('active'));
            if (active) active.classList.add('active');
            tacticalAudio.playClick();
        };

        if (btnHybrid) {
            btnHybrid.addEventListener('click', () => {
                setStyleBtn(btnHybrid);
                this.terrain.setRenderStyle('hybrid');
            });
        }
        if (btnSat) {
            btnSat.addEventListener('click', () => {
                setStyleBtn(btnSat);
                this.terrain.setRenderStyle('satellite');
            });
        }
        if (btnTopo) {
            btnTopo.addEventListener('click', () => {
                setStyleBtn(btnTopo);
                this.terrain.setRenderStyle('contour');
            });
        }

        const btnGrid = document.getElementById('btn-toggle-grid');
        btnGrid.addEventListener('click', () => {
            const flag = !this.terrain.showGrid;
            this.terrain.toggleGrid(flag);
            btnGrid.classList.toggle('active', flag);
            tacticalAudio.playClick();
        });

        // 3D Buildings & Vegetation Toggles
        const btnBuildings = document.getElementById('btn-toggle-buildings');
        if (btnBuildings && this.terrain.worldEngine) {
            btnBuildings.addEventListener('click', () => {
                const active = this.terrain.worldEngine.toggleBuildings();
                btnBuildings.classList.toggle('active', active);
                tacticalAudio.playClick();
                this.updateAll();
            });
        }

        const btnTrees = document.getElementById('btn-toggle-trees');
        if (btnTrees && this.terrain.worldEngine) {
            btnTrees.addEventListener('click', () => {
                const active = this.terrain.worldEngine.toggleVegetation();
                btnTrees.classList.toggle('active', active);
                tacticalAudio.playClick();
            });
        }

        // Connect World Loading Progress Banner
        const loadingBanner = document.getElementById('world-loading-banner');
        const loadingText = document.getElementById('world-loading-text');
        if (this.terrain.worldEngine) {
            this.terrain.worldEngine.onProgress = (status, pct) => {
                if (!loadingBanner || !loadingText) return;
                if (pct < 1.0) {
                    loadingBanner.style.display = 'flex';
                    loadingText.textContent = `${status.toUpperCase()} (${Math.round(pct * 100)}%)`;
                } else {
                    loadingBanner.style.display = 'none';
                }
            };
        }
    }

    /* ------------------------------------------------------------
       Map Picking & Clicks
       ------------------------------------------------------------ */
    setupCanvasClicks() {
        const dom = this.terrain.renderer.domElement;

        dom.addEventListener('pointermove', (e) => {
            const hit = this.terrain.pickTerrain(e.clientX, e.clientY);
            if (hit) {
                // Update Cursor Telemetry
                const curEl = document.getElementById('telemetry-cursor');
                if (curEl) {
                    curEl.textContent = `X: ${String(hit.gameX).padStart(4, '0')}  Y: ${String(hit.gameY).padStart(4, '0')}  Z: ${hit.elevation}m`;
                }

                // Grid Letter / Number
                const gridEl = document.getElementById('telemetry-grid');
                if (gridEl) {
                    const colIdx = Math.floor((hit.gameX / 2000) * 20);
                    const rowIdx = Math.floor((hit.gameY / 2000) * 20) + 1;
                    const letter = TACTICAL_GRID.letters[colIdx] || 'A';
                    gridEl.textContent = `${letter}-${rowIdx}`;
                }
            }
        });

        dom.addEventListener('click', (e) => {
            const hit = this.terrain.pickTerrain(e.clientX, e.clientY);
            if (!hit) return;

            if (this.activeTool === 'obs') {
                this.viewshed.setObserver(hit.gameX, hit.gameY);
                tacticalAudio.playLaserPing();
            } else if (this.activeTool === 'tgt') {
                this.viewshed.setTarget(hit.gameX, hit.gameY);
                this.ballistics.setTarget(hit.gameX, hit.gameY);
                tacticalAudio.playLaserPing();
            } else if (this.activeTool === 'arty') {
                this.ballistics.setBattery(hit.gameX, hit.gameY);
                tacticalAudio.playClick();
            } else if (this.activeTool === 'pvo') {
                this.airdefense.updatePosition(hit.gameX, hit.gameY);
                this.airdefense.setVisible(true);
                document.getElementById('chk-pvo').checked = true;
                tacticalAudio.playClick();
            }

            this.updateAll();
            this.syncHash();
        });
    }

    setupMinimapEvents() {
        const miniCanvas = document.getElementById('minimap-canvas');
        miniCanvas.addEventListener('minimap-click', (e) => {
            const { gameX, gameY } = e.detail;
            if (this.activeTool === 'obs') {
                this.viewshed.setObserver(gameX, gameY);
            } else if (this.activeTool === 'tgt') {
                this.viewshed.setTarget(gameX, gameY);
                this.ballistics.setTarget(gameX, gameY);
            } else if (this.activeTool === 'arty') {
                this.ballistics.setBattery(gameX, gameY);
            }
            this.updateAll();
        });
    }

    renderPOIList() {
        const list = document.getElementById('poi-list');
        list.innerHTML = '';
        const pois = this.terrain.config.pois || [];

        pois.forEach((poi) => {
            const item = document.createElement('button');
            item.className = 'w-full text-left bg-black/40 hover:bg-white/10 border border-[color:var(--line)] hover:border-[color:var(--cyan)] rounded p-2 text-xs font-mono transition-all flex items-center justify-between';
            item.innerHTML = `
                <div>
                    <span class="text-white font-bold block">${poi.name}</span>
                    <span class="text-gray-500 text-[10px]">${poi.desc}</span>
                </div>
                <div class="text-right">
                    <span class="text-[color:var(--cyan)] font-bold block">${poi.elevation}m</span>
                    <span class="text-gray-400 text-[9px]">${poi.type.toUpperCase()}</span>
                </div>
            `;
            item.addEventListener('click', () => {
                tacticalAudio.playClick();
                // Move observer or target to POI
                if (this.activeTool === 'obs') {
                    this.viewshed.setObserver(poi.x, poi.y);
                } else {
                    this.viewshed.setTarget(poi.x, poi.y);
                    this.ballistics.setTarget(poi.x, poi.y);
                }
                this.updateAll();
                this.syncHash();
            });
            list.appendChild(item);
        });
    }

    /* ------------------------------------------------------------
       Update Calculations & UI Display
       ------------------------------------------------------------ */
    updateAll() {
        // 1. Line of Sight & Viewshed
        const los = this.viewshed.updateLOS();

        // 2. Ballistics Solution
        const ballistic = this.ballistics.update();

        // 3. Elevation Profile Graph
        this.elevationProfile.render(los, ballistic);

        // 4. Update 2D Tactical Map
        if (this.tactical2D) this.tactical2D.render();

        // 5. Update HUD Text Displays
        this.updateHUD(los, ballistic);
    }

    updateHUD(los, ballistic) {
        // LOS Status Dot & Text
        const dot = document.getElementById('los-status-dot');
        const statusText = document.getElementById('los-status-text');

        if (los.visible) {
            dot.className = 'status-indicator clear';
            statusText.className = 'font-bold text-[color:var(--green)]';
            statusText.textContent = `LOS: CLEAR (100% VISIBLE)`;
        } else {
            dot.className = 'status-indicator blocked';
            statusText.className = 'font-bold text-[color:var(--red)]';
            statusText.textContent = `LOS: BLOCKED @ ${los.obstacleDist || '--'}m`;
        }

        document.getElementById('los-dist-text').textContent = `${los.distance} m`;
        document.getElementById('los-dh-text').textContent = `${los.elevationDelta > 0 ? '+' : ''}${los.elevationDelta} m`;
        document.getElementById('los-slope-text').textContent = `${los.pitchDeg}° (${los.pitchMil} MIL)`;
        document.getElementById('los-azimuth-text').textContent = `${los.azimuthDeg}° (${los.azimuthMil} MIL)`;

        // Ballistics Solution Card
        if (ballistic && ballistic.valid) {
            document.getElementById('sol-range').textContent = `${ballistic.distance} m (Δh: ${ballistic.elevationDelta > 0 ? '+' : ''}${ballistic.elevationDelta}m)`;
            document.getElementById('sol-azimuth').textContent = `${ballistic.azimuthDeg}° (${ballistic.azimuthMil} MIL)`;
            document.getElementById('sol-elevation').textContent = `${ballistic.officialMil || ballistic.elevationAngleMil} MIL (Calc: ${ballistic.elevationAngleDeg}°)`;
            document.getElementById('sol-tof').textContent = `${ballistic.timeOfFlight} s (Apex: ${ballistic.apexHeight}m)`;

            const crestEl = document.getElementById('sol-crest');
            if (ballistic.isObstructed) {
                crestEl.textContent = `COLLISION AT ${ballistic.crestCollision?.dist || 0}m`;
                crestEl.className = 'text-[color:var(--red)] font-bold';
            } else {
                crestEl.textContent = 'CLEAR (SAFE TO FIRE)';
                crestEl.className = 'text-[color:var(--green)] font-bold';
            }
        } else if (ballistic && !ballistic.valid) {
            document.getElementById('sol-range').textContent = `${ballistic.distance || '--'} m`;
            document.getElementById('sol-azimuth').textContent = `${ballistic.azimuthMil || '--'} MIL`;
            document.getElementById('sol-elevation').textContent = ballistic.officialMil ? `${ballistic.officialMil} MIL` : 'OUT OF ENVELOPE';
            document.getElementById('sol-tof').textContent = '--';
            const crestEl = document.getElementById('sol-crest');
            crestEl.textContent = ballistic.reason || 'UNREACHABLE';
            crestEl.className = 'text-[color:var(--red)] font-bold';
        }
    }

    /* ------------------------------------------------------------
       URL Hash Sync for Squad Sharing
       ------------------------------------------------------------ */
    syncHash() {
        const hash = `#map=${this.terrain.currentMapId}&obs=${this.viewshed.observer.x},${this.viewshed.observer.y}&tgt=${this.viewshed.target.x},${this.viewshed.target.y}&wpn=${this.ballistics.currentWeaponId}`;
        history.replaceState(null, '', hash);
    }

    setupHashSync() {
        const hash = window.location.hash.slice(1);
        if (!hash) return;
        const p = new URLSearchParams(hash);
        const map = p.get('map');
        const obs = p.get('obs');
        const tgt = p.get('tgt');

        if (map && MAP_CONFIGS[map]) {
            this.terrain.loadMap(map);
            this.tactical2D.setMap(map);
            const container = document.getElementById('map-selector');
            if (container) {
                container.querySelectorAll('.map-btn').forEach(b => b.classList.toggle('active', b.dataset.map === map));
            }
        }
        if (obs) {
            const [ox, oy] = obs.split(',').map(Number);
            if (!isNaN(ox) && !isNaN(oy)) this.viewshed.setObserver(ox, oy);
        }
        if (tgt) {
            const [tx, ty] = tgt.split(',').map(Number);
            if (!isNaN(tx) && !isNaN(ty)) {
                this.viewshed.setTarget(tx, ty);
                this.ballistics.setTarget(tx, ty);
            }
        }
        const view = p.get('view');
        if (view === '2d') {
            const btnTopdown = document.getElementById('btn-view-topdown');
            if (btnTopdown) btnTopdown.click();
        }
    }

    /* ------------------------------------------------------------
       Render & Animation Loop
       ------------------------------------------------------------ */
    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Animate sub-elements
        this.ballistics.animate(delta);
        this.airdefense.animate(delta);

        // Render 3D Scene
        this.terrain.render();

        // Render 2D Minimap
        this.minimap.render(this.terrain.camera, this.ballistics.battery);
    }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new TacticalApp();
});
