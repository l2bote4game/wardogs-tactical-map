/* ============================================================
   WARDOGS 3D TACTICAL MAP — BALLISTICS & TRAJECTORY ENGINE
   Calculates L81 81mm Mortar & SPH-2 155mm Howitzer Firing Solutions
   Features:
   - Full Ballistic Parabola Solver with Elevation Difference (Δh)
   - High-Arc (Mortar/Plunging) vs Low-Arc (Direct/Howitzer) solutions
   - 3D Terrain Crest Collision Check (Ridge blocking shell)
   - Artillery Reverse-Slope Dead Zone Analysis
   - Luminous 3D Trajectory Tube with Animated Tracer Shell
   ============================================================ */

import * as THREE from 'three';
import { OFFICIAL_WEAPON_TABLES } from './config.js';

export class BallisticsEngine {
    constructor(terrainEngine) {
        this.terrain = terrainEngine;
        this.currentWeaponId = 'mortar'; // 'mortar' (L81) or 'sph2' (155mm)
        this.arcMode = 'high'; // 'high' (mortar/plunging) or 'low' (direct)

        // Active Battery Position & Target
        this.battery = { x: 620, y: 430, elevation: 95 }; // e.g. Train Depot Basin
        this.target = { x: 980, y: 1100, elevation: 140 };

        // 3D Visual Mesh
        this.trajectoryMesh = null;
        this.tracerMesh = null;
        this.batteryMarker = null;
        this.impactMarker = null;

        this.tracerProgress = 0;

        this.initVisuals();
    }

    initVisuals() {
        const scene = this.terrain.scene;

        // Battery 3D Marker (Olive/Amber Hexagon)
        const batGeo = new THREE.CylinderGeometry(2.5, 3.5, 1.8, 6);
        const batMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.3
        });
        this.batteryMarker = new THREE.Mesh(batGeo, batMat);
        scene.add(this.batteryMarker);

        // Tracer Bullet / Shell
        const tracerGeo = new THREE.SphereGeometry(1.2, 12, 12);
        const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.tracerMesh = new THREE.Mesh(tracerGeo, tracerMat);
        this.tracerMesh.visible = false;
        scene.add(this.tracerMesh);
    }

    /* ------------------------------------------------------------
       Official Game Firing Table Interpolation
       ------------------------------------------------------------ */
    lookupOfficialMil(dist) {
        if (this.currentWeaponId === 'mortar') {
            const table = OFFICIAL_WEAPON_TABLES.mortar.table;
            return this.interpolateTable(table, dist);
        } else if (this.currentWeaponId === 'sph2') {
            const table = (this.arcMode === 'low') 
                ? OFFICIAL_WEAPON_TABLES.sph2.lowArc 
                : OFFICIAL_WEAPON_TABLES.sph2.highArc;
            return this.interpolateTable(table, dist);
        }
        return null;
    }

    interpolateTable(table, dist) {
        if (!table || table.length === 0) return null;
        if (dist <= table[0][0]) return table[0][1];
        if (dist >= table[table.length - 1][0]) return table[table.length - 1][1];

        for (let i = 0; i < table.length - 1; i++) {
            const p0 = table[i];
            const p1 = table[i + 1];
            if (dist >= p0[0] && dist <= p1[0]) {
                const frac = (dist - p0[0]) / (p1[0] - p0[0]);
                const mil = p0[1] + frac * (p1[1] - p0[1]);
                return Math.round(mil);
            }
        }
        return null;
    }

    /* ------------------------------------------------------------
       Ballistic Trajectory Solver with Elevation Differential
       ------------------------------------------------------------ */
    solveTrajectory() {
        const wpnTable = OFFICIAL_WEAPON_TABLES[this.currentWeaponId] || OFFICIAL_WEAPON_TABLES.mortar;
        const fx = this.battery.x;
        const fy = this.battery.y;
        const fz = this.terrain.getElevation(fx, fy) + 1.5; // Battery muzzle height

        const tx = this.target.x;
        const ty = this.target.y;
        const tz = this.terrain.getElevation(tx, ty);

        const dx = tx - fx;
        const dy = ty - fy;
        const d = Math.sqrt(dx * dx + dy * dy); // Horizontal range in meters
        const dh = tz - fz;                    // Elevation delta in meters

        // Azimuth Bearing
        let azRad = Math.atan2(dx, -dy);
        if (azRad < 0) azRad += 2 * Math.PI;
        const azDeg = (azRad * 180) / Math.PI;
        const azMil = Math.round((azDeg / 360) * 6400);

        // Official Game MIL Value
        const officialMil = this.lookupOfficialMil(d);

        // Check weapon minimum & maximum physical range limits
        if (d < wpnTable.minRange) {
            return { 
                valid: false, 
                outOfRange: true,
                reason: `СЛИШКОМ БЛИЗКО: МИНИМУМ ${wpnTable.minRange}м (ТЕКУЩАЯ ${Math.round(d)}м)`, 
                distance: Math.round(d), 
                azimuthMil: azMil,
                officialMil: null
            };
        }
        if (d > wpnTable.maxRange) {
            return { 
                valid: false, 
                outOfRange: true,
                reason: `ВНЕ ЗОНЫ ДОСЯГАЕМОСТИ: ПЕРЕЛЁТ +${Math.round(d - wpnTable.maxRange)}м (МАКСИМУМ ${wpnTable.maxRange}м)`, 
                distance: Math.round(d), 
                azimuthMil: azMil,
                officialMil: null
            };
        }

        // Calibrated physics simulation for 3D trajectory visualization
        const v0 = (this.currentWeaponId === 'mortar') ? 145 : 295;
        const g = 9.80665;
        const v2 = v0 * v0;
        const v4 = v2 * v2;
        const determinant = v4 - g * (g * d * d + 2 * dh * v2);

        if (determinant < 0) {
            return {
                valid: false,
                reason: `Target height unreachable (+${Math.round(dh)}m elevation)`,
                distance: Math.round(d),
                azimuthMil: azMil,
                officialMil
            };
        }

        const sqrtDet = Math.sqrt(determinant);

        // High arc vs Low arc
        let tanTheta;
        if (this.arcMode === 'high' || this.currentWeaponId === 'mortar') {
            tanTheta = (v2 + sqrtDet) / (g * d);
        } else {
            tanTheta = (v2 - sqrtDet) / (g * d);
        }

        const thetaRad = Math.atan(tanTheta);
        const thetaDeg = (thetaRad * 180) / Math.PI;
        const physicsMil = Math.round((thetaRad * 6400) / (2 * Math.PI));

        // Time of Flight
        const vx = v0 * Math.cos(thetaRad);
        const vz = v0 * Math.sin(thetaRad);
        const tFlight = d / vx;

        // Trajectory Apex (Peak Height)
        const tApex = vz / g;
        const apexHeight = fz + vz * tApex - 0.5 * g * tApex * tApex;

        // Sample 3D Trajectory Points & Check Terrain Crest Collisions
        const SAMPLES = 100;
        const trajectoryPoints = [];
        let crestCollision = null;
        let isObstructed = false;

        for (let i = 0; i <= SAMPLES; i++) {
            const frac = i / SAMPLES;
            const t = frac * tFlight;
            const dist = frac * d;

            const curX = fx + (dx / d) * dist;
            const curY = fy + (dy / d) * dist;
            const curZ = fz + vz * t - 0.5 * g * t * t;

            const groundZ = this.terrain.getElevation(curX, curY);

            // Check collision with mountains along flight path (exclude launch and impact zone)
            if (i > 3 && i < SAMPLES - 2) {
                if (curZ <= groundZ && !isObstructed) {
                    isObstructed = true;
                    crestCollision = {
                        dist: Math.round(dist),
                        x: curX,
                        y: curY,
                        ridgeElevation: Math.round(groundZ),
                        shellAltitude: Math.round(curZ)
                    };
                }
            }

            // Convert to Three.js coordinates (1:1 Meters)
            const worldPt = this.terrain.gameToWorld(curX, curY);
            worldPt.y = curZ;
            trajectoryPoints.push(worldPt);
        }

        return {
            valid: true,
            weapon: wpnTable,
            distance: Math.round(d),
            elevationDelta: Math.round(dh),
            azimuthDeg: Math.round(azDeg),
            azimuthMil: azMil,
            elevationAngleDeg: thetaDeg.toFixed(1),
            elevationAngleMil: physicsMil,
            officialMil: officialMil || physicsMil,
            timeOfFlight: tFlight.toFixed(1),
            apexHeight: Math.round(apexHeight),
            isObstructed,
            crestCollision,
            points: trajectoryPoints
        };
    }

    update() {
        const solution = this.solveTrajectory();

        // Update Battery Marker
        const batWorld = this.terrain.gameToWorld(this.battery.x, this.battery.y);
        this.batteryMarker.position.copy(batWorld);

        // Update Artillery Range Rings on Ground
        if (this.rangeRingsMesh) {
            this.terrain.scene.remove(this.rangeRingsMesh);
            this.rangeRingsMesh = null;
        }

        const wpnTable = OFFICIAL_WEAPON_TABLES[this.currentWeaponId] || OFFICIAL_WEAPON_TABLES.mortar;
        const ringGroup = new THREE.Group();

        // Min range ring
        const minRingGeo = new THREE.RingGeometry(wpnTable.minRange - 1.5, wpnTable.minRange + 1.5, 64);
        minRingGeo.rotateX(-Math.PI / 2);
        const minRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const minRing = new THREE.Mesh(minRingGeo, minRingMat);
        minRing.position.y = 0.5;
        ringGroup.add(minRing);

        // Max range ring
        const maxRingGeo = new THREE.RingGeometry(wpnTable.maxRange - 2.5, wpnTable.maxRange + 2.5, 96);
        maxRingGeo.rotateX(-Math.PI / 2);
        const maxRingMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
        const maxRing = new THREE.Mesh(maxRingGeo, maxRingMat);
        maxRing.position.y = 0.5;
        ringGroup.add(maxRing);

        ringGroup.position.copy(batWorld);
        this.rangeRingsMesh = ringGroup;
        this.terrain.scene.add(this.rangeRingsMesh);

        // Update 3D Trajectory Tube
        if (this.trajectoryMesh) {
            this.terrain.scene.remove(this.trajectoryMesh);
            this.trajectoryMesh.geometry.dispose();
            this.trajectoryMesh.material.dispose();
            this.trajectoryMesh = null;
        }

        if (solution.valid && solution.points && solution.points.length > 2) {
            const curve = new THREE.CatmullRomCurve3(solution.points);
            const tubeGeo = new THREE.TubeGeometry(curve, 90, 0.4, 6, false);
            const tubeMat = new THREE.MeshStandardMaterial({
                color: solution.isObstructed ? 0xef4444 : 0x10b981,
                emissive: solution.isObstructed ? 0xb91c1c : 0x059669,
                emissiveIntensity: 0.8,
                roughness: 0.2
            });
            this.trajectoryMesh = new THREE.Mesh(tubeGeo, tubeMat);
            this.terrain.scene.add(this.trajectoryMesh);
            this.curve = curve;
            this.tracerMesh.visible = true;
        } else {
            this.tracerMesh.visible = false;
        }

        return solution;
    }

    animate(delta) {
        if (!this.curve || !this.tracerMesh.visible) return;
        this.tracerProgress = (this.tracerProgress + delta * 0.4) % 1.0;
        const pt = this.curve.getPointAt(this.tracerProgress);
        this.tracerMesh.position.copy(pt);
    }

    setBattery(x, y) {
        const sz = this.terrain.config.sizeM || this.terrain.config.gridSize || 1200;
        this.battery.x = Math.max(0, Math.min(sz, x));
        this.battery.y = Math.max(0, Math.min(sz, y));
        return this.update();
    }

    setTarget(x, y) {
        const sz = this.terrain.config.sizeM || this.terrain.config.gridSize || 1200;
        this.target.x = Math.max(0, Math.min(sz, x));
        this.target.y = Math.max(0, Math.min(sz, y));
        return this.update();
    }

    setWeapon(weaponId) {
        if (OFFICIAL_WEAPON_TABLES[weaponId]) {
            this.currentWeaponId = weaponId;
            return this.update();
        }
    }

    setArcMode(mode) {
        if (mode === 'high' || mode === 'low') {
            this.arcMode = mode;
            return this.update();
        }
    }
}
