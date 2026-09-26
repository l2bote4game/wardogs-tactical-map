/* ============================================================
   WARDOGS 3D TACTICAL MAP — VIEWSHED & LINE OF SIGHT (LOS)
   Features:
   - High-Resolution Point-to-Point LOS Raymarcher with Obstacle Detection
   - 360° Radial Viewshed Horizon Raymarcher (Visible vs Shadow Zones)
   - Dynamic CanvasTexture projection onto 3D Terrain
   - Stance Presets (Prone, Crouch, Standing, Vehicle, Tower, Drone)
   - Tactical 3D Laser Sightlines with Collision Markers
   ============================================================ */

import * as THREE from 'three';

export class ViewshedEngine {
    constructor(terrainEngine) {
        this.terrain = terrainEngine;

        // Active State
        this.observer = { x: 420, y: 1540, height: 1.75, stance: 'standing' };
        this.target = { x: 980, y: 1100, height: 1.0 };

        // Viewshed Parameters
        this.radius = 1200;      // meters (100 to 2500)
        this.fov = 360;          // degrees (30 to 360)
        this.azimuth = 135;      // degrees heading (0 to 360)
        this.showViewshed = true;
        this.showBlindZones = true;

        // Viewshed Canvas & Texture (512x512 matching 2000m x 2000m map)
        this.CANVAS_SIZE = 512;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvas.height = this.CANVAS_SIZE;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        // 3D Visual Objects in Scene
        this.losLineMesh = null;
        this.collisionMarker = null;
        this.observerMarker = null;
        this.targetMarker = null;
        this.rangeRingMesh = null;

        this.initVisuals();
        this.updateViewshed();
        this.updateLOS();
    }

    initVisuals() {
        const scene = this.terrain.scene;

        // 1. Observer 3D Marker (Tactical Cyan Diamond)
        const obsGeo = new THREE.ConeGeometry(2.0, 5.0, 4);
        obsGeo.rotateX(Math.PI); // Point downward to terrain
        const obsMat = new THREE.MeshStandardMaterial({
            color: 0x00f2fe,
            emissive: 0x00f2fe,
            emissiveIntensity: 0.8,
            roughness: 0.2
        });
        this.observerMarker = new THREE.Mesh(obsGeo, obsMat);
        scene.add(this.observerMarker);

        // 2. Target 3D Marker (Tactical Amber / Red Reticle)
        const tgtGeo = new THREE.TorusGeometry(2.5, 0.4, 8, 24);
        const tgtMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.7,
            roughness: 0.2
        });
        this.targetMarker = new THREE.Mesh(tgtGeo, tgtMat);
        this.targetMarker.rotateX(Math.PI / 2);
        scene.add(this.targetMarker);

        // 3. Collision Marker (Red ring where sightline hits obstacle)
        const colGeo = new THREE.RingGeometry(1.0, 2.2, 16);
        colGeo.rotateX(-Math.PI / 2);
        const colMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
        });
        this.collisionMarker = new THREE.Mesh(colGeo, colMat);
        this.collisionMarker.visible = false;
        scene.add(this.collisionMarker);

        // Connect texture to terrain material
        this.terrain.setViewshedTexture(this.texture);
    }

    /* ------------------------------------------------------------
       Point-to-Point Line of Sight (LOS)
       ------------------------------------------------------------ */
    computeLineOfSight() {
        const obsX = this.observer.x;
        const obsY = this.observer.y;
        const obsElev = this.terrain.getElevation(obsX, obsY) + (this.observer.height || 1.75);

        const tgtX = this.target.x;
        const tgtY = this.target.y;
        const tgtElev = this.terrain.getElevation(tgtX, tgtY) + (this.target.height || 1.0);

        const dx = tgtX - obsX;
        const dy = tgtY - obsY;
        const dz = tgtElev - obsElev;
        const horizDist = Math.sqrt(dx * dx + dy * dy);
        const totalDist = Math.sqrt(horizDist * horizDist + dz * dz);

        // Pitch Angle & MILs
        const pitchRad = Math.atan2(dz, horizDist);
        const pitchDeg = (pitchRad * 180) / Math.PI;
        const pitchMil = Math.round(pitchRad * (6400 / (2 * Math.PI)));

        // Azimuth Bearing
        let azimuthRad = Math.atan2(dx, -dy);
        if (azimuthRad < 0) azimuthRad += 2 * Math.PI;
        const azimuthDeg = (azimuthRad * 180) / Math.PI;
        const azimuthMil = Math.round((azimuthDeg / 360) * 6400);

        // Raymarching Steps
        const STEPS = 140;
        let visible = true;
        let collisionPoint = null;
        let obstacleDist = null;
        let minClearance = 9999;
        const raySamples = [];

        for (let i = 0; i <= STEPS; i++) {
            const t = i / STEPS;
            const curX = obsX + dx * t;
            const curY = obsY + dy * t;
            const rayZ = obsElev + dz * t;
            const terrainZ = this.terrain.getElevation(curX, curY);

            const clearance = rayZ - terrainZ;
            if (i > 1 && i < STEPS) {
                if (clearance < minClearance) minClearance = clearance;
            }

            raySamples.push({
                dist: horizDist * t,
                rayZ,
                terrainZ,
                clearance
            });

            // Obstacle Hit
            if (clearance < 0 && visible && i > 1 && i < STEPS) {
                visible = false;
                collisionPoint = { x: curX, y: curY, z: terrainZ };
                obstacleDist = horizDist * t;
            }
        }

        let blockedBy = visible ? 'NONE' : 'TERRAIN';

        // Test 3D building obstacle collision
        if (visible && this.terrain.worldEngine) {
            const obsWorld = this.terrain.gameToWorld(obsX, obsY, obsElev);
            const tgtWorld = this.terrain.gameToWorld(tgtX, tgtY, tgtElev);
            const bHit = this.terrain.worldEngine.checkBuildingObstruction(obsWorld, tgtWorld);
            if (bHit.hit) {
                visible = false;
                blockedBy = 'BUILDING';
                obstacleDist = Math.round(bHit.distance / (this.terrain.scaleRatio || 0.1));
            }
        }

        return {
            visible,
            blockedBy,
            distance: Math.round(totalDist),
            horizontalDistance: Math.round(horizDist),
            elevationDelta: Math.round(dz),
            observerElev: Math.round(obsElev),
            targetElev: Math.round(tgtElev),
            pitchDeg: pitchDeg.toFixed(1),
            pitchMil,
            azimuthDeg: Math.round(azimuthDeg),
            azimuthMil,
            collisionPoint,
            obstacleDist: obstacleDist ? Math.round(obstacleDist) : null,
            minClearance: Math.round(minClearance),
            samples: raySamples
        };
    }

    updateLOS() {
        const result = this.computeLineOfSight();

        // Update 3D Markers
        const obsPos = this.terrain.gameToWorld(this.observer.x, this.observer.y);
        obsPos.y += (this.observer.height || 1.75) * this.terrain.scaleRatio + 3.0;
        this.observerMarker.position.copy(obsPos);

        const tgtPos = this.terrain.gameToWorld(this.target.x, this.target.y);
        tgtPos.y += (this.target.height || 1.0) * this.terrain.scaleRatio + 1.0;
        this.targetMarker.position.copy(tgtPos);

        // Update Laser Sightline
        if (this.losLineMesh) {
            this.terrain.scene.remove(this.losLineMesh);
            this.losLineMesh.geometry.dispose();
            this.losLineMesh.material.dispose();
        }

        const eyePos = this.terrain.gameToWorld(this.observer.x, this.observer.y);
        eyePos.y += (this.observer.height || 1.75) * this.terrain.scaleRatio;

        const aimPos = this.terrain.gameToWorld(this.target.x, this.target.y);
        aimPos.y += (this.target.height || 1.0) * this.terrain.scaleRatio;

        const pts = [eyePos, aimPos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({
            color: result.visible ? 0x10b981 : 0xef4444, // Green if clear, Red if blocked
            linewidth: 3
        });
        this.losLineMesh = new THREE.Line(lineGeo, lineMat);
        this.terrain.scene.add(this.losLineMesh);

        // Update Collision Marker
        if (result.collisionPoint) {
            const colPos = this.terrain.gameToWorld(result.collisionPoint.x, result.collisionPoint.y);
            colPos.y += 0.8;
            this.collisionMarker.position.copy(colPos);
            this.collisionMarker.visible = true;
        } else {
            this.collisionMarker.visible = false;
        }

        return result;
    }

    /* ------------------------------------------------------------
       360° Radial Viewshed Raymarching (Calculates Sight Coverage)
       ------------------------------------------------------------ */
    updateViewshed() {
        if (!this.showViewshed) {
            this.terrain.setViewshedTexture(null);
            return;
        }

        const sz = this.CANVAS_SIZE;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, sz, sz);

        const mapSize = this.terrain.config.gridSize; // 2000m
        const obsX = this.observer.x;
        const obsY = this.observer.y;
        const obsElev = this.terrain.getElevation(obsX, obsY) + (this.observer.height || 1.75);

        // Canvas Coordinates of Observer
        const cx = (obsX / mapSize) * sz;
        const cy = (obsY / mapSize) * sz;
        const maxRadiusPx = (this.radius / mapSize) * sz;

        // Angular Sweep
        const ANGLES = 360;
        const STEPS = 120;
        const fovRad = (this.fov * Math.PI) / 180;
        const centerAzimuthRad = (this.azimuth * Math.PI) / 180;

        // Image Buffer for fast direct pixel rendering
        const imgData = ctx.createImageData(sz, sz);
        const data = imgData.data;

        for (let a = 0; a < ANGLES; a++) {
            const angleRad = (a * 2 * Math.PI) / ANGLES;

            // FOV cone check if not full 360
            if (this.fov < 360) {
                let diff = Math.abs(angleRad - centerAzimuthRad);
                if (diff > Math.PI) diff = 2 * Math.PI - diff;
                if (diff > fovRad / 2) continue;
            }

            const cosA = Math.sin(angleRad); // X direction
            const sinA = -Math.cos(angleRad); // Y direction (North is -Y in canvas)

            let maxTan = -99999; // Maximum horizon elevation tangent

            for (let s = 1; s <= STEPS; s++) {
                const distRatio = s / STEPS;
                const distMeters = this.radius * distRatio;
                const sampleGameX = obsX + cosA * distMeters;
                const sampleGameY = obsY + sinA * distMeters;

                if (sampleGameX < 0 || sampleGameX >= mapSize || sampleGameY < 0 || sampleGameY >= mapSize) {
                    break;
                }

                const sampleElev = this.terrain.getElevation(sampleGameX, sampleGameY);
                const tanAngle = (sampleElev - obsElev) / distMeters;

                // Canvas Pixel Coordinates
                const px = Math.floor((sampleGameX / mapSize) * sz);
                const py = Math.floor((sampleGameY / mapSize) * sz);

                if (px >= 0 && px < sz && py >= 0 && py < sz) {
                    const idx = (py * sz + px) * 4;

                    // Falloff opacity with distance
                    const alpha = Math.floor(210 * (1.0 - Math.pow(distRatio, 2.8)));

                    if (tanAngle >= maxTan) {
                        maxTan = tanAngle;
                        // VISIBLE GROUND: Tactical Emerald Green (#10B981)
                        data[idx] = 16;     // R
                        data[idx + 1] = 185; // G
                        data[idx + 2] = 129; // B
                        data[idx + 3] = alpha;
                    } else if (this.showBlindZones) {
                        // OBSTRUCTED / BLIND ZONE: Tactical Translucent Shadow Red (#EF4444)
                        if (data[idx + 3] === 0) { // Don't overwrite if another ray saw it
                            data[idx] = 239;    // R
                            data[idx + 1] = 68;  // G
                            data[idx + 2] = 68;  // B
                            data[idx + 3] = Math.floor(alpha * 0.42);
                        }
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Draw Tactical Outer Range Circle on Canvas
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.fov >= 360) {
            ctx.arc(cx, cy, maxRadiusPx, 0, Math.PI * 2);
        } else {
            const startAng = centerAzimuthRad - fovRad / 2 - Math.PI / 2;
            const endAng = centerAzimuthRad + fovRad / 2 - Math.PI / 2;
            ctx.arc(cx, cy, maxRadiusPx, startAng, endAng);
            ctx.lineTo(cx, cy);
            ctx.closePath();
        }
        ctx.stroke();

        this.texture.needsUpdate = true;
        this.terrain.setViewshedTexture(this.texture);
    }

    setObserver(x, y, stanceKey = null) {
        this.observer.x = Math.max(0, Math.min(this.terrain.config.gridSize, x));
        this.observer.y = Math.max(0, Math.min(this.terrain.config.gridSize, y));
        if (stanceKey) {
            this.setObserverStance(stanceKey);
        } else {
            this.updateLOS();
            this.updateViewshed();
        }
    }

    setObserverStance(stanceKey) {
        const presets = {
            prone: 0.35,
            crouch: 1.05,
            standing: 1.75,
            vehicle: 3.20,
            tower: 14.0,
            drone: 45.0
        };
        this.observer.stance = stanceKey;
        this.observer.height = presets[stanceKey] || 1.75;
        this.updateLOS();
        this.updateViewshed();
    }

    setTarget(x, y) {
        this.target.x = Math.max(0, Math.min(this.terrain.config.gridSize, x));
        this.target.y = Math.max(0, Math.min(this.terrain.config.gridSize, y));
        this.updateLOS();
    }

    setViewshedRadius(meters) {
        this.radius = Math.max(100, Math.min(3000, meters));
        this.updateViewshed();
    }

    setViewshedFov(deg) {
        this.fov = Math.max(30, Math.min(360, deg));
        this.updateViewshed();
    }

    setViewshedAzimuth(deg) {
        this.azimuth = ((deg % 360) + 360) % 360;
        this.updateViewshed();
    }

    toggleViewshed(flag) {
        this.showViewshed = flag;
        this.updateViewshed();
    }

    toggleBlindZones(flag) {
        this.showBlindZones = flag;
        this.updateViewshed();
    }
}
