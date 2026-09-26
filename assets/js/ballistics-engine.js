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
import { WEAPON_CONFIGS } from './config.js';

export class BallisticsEngine {
    constructor(terrainEngine) {
        this.terrain = terrainEngine;
        this.currentWeaponId = 'l81';
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
       Ballistic Trajectory Solver with Elevation Differential
       ------------------------------------------------------------ */
    solveTrajectory() {
        const wpn = WEAPON_CONFIGS[this.currentWeaponId] || WEAPON_CONFIGS.l81;
        const v0 = wpn.muzzleVelocity; // m/s
        const g = 9.80665; // m/s^2

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

        // Check weapon minimum & maximum physical range limits
        if (d < wpn.minRange) {
            return { valid: false, reason: `Target too close (${Math.round(d)}m < min ${wpn.minRange}m)`, distance: Math.round(d), azimuthMil: azMil };
        }
        if (d > wpn.maxRange) {
            return { valid: false, reason: `Target out of range (${Math.round(d)}m > max ${wpn.maxRange}m)`, distance: Math.round(d), azimuthMil: azMil };
        }

        // Quadratic Ballistic Root Equation:
        // tan(theta) = [ v0^2 +- sqrt(v0^4 - g*(g*d^2 + 2*dh*v0^2)) ] / (g*d)
        const v2 = v0 * v0;
        const v4 = v2 * v2;
        const determinant = v4 - g * (g * d * d + 2 * dh * v2);

        if (determinant < 0) {
            return {
                valid: false,
                reason: `Unreachable target due to mountain height (+${Math.round(dh)}m elevation)`,
                distance: Math.round(d),
                azimuthMil: azMil
            };
        }

        const sqrtDet = Math.sqrt(determinant);

        // High arc (+) vs Low arc (-)
        let tanTheta;
        if (this.arcMode === 'high' || wpn.category === 'mortar') {
            tanTheta = (v2 + sqrtDet) / (g * d);
        } else {
            tanTheta = (v2 - sqrtDet) / (g * d);
        }

        const thetaRad = Math.atan(tanTheta);
        const thetaDeg = (thetaRad * 180) / Math.PI;
        const thetaMil = Math.round((thetaRad * 6400) / (2 * Math.PI));

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

            // Convert to Three.js coordinates
            const worldPt = this.terrain.gameToWorld(curX, curY);
            worldPt.y = curZ * this.terrain.scaleRatio;
            trajectoryPoints.push(worldPt);
        }

        return {
            valid: true,
            weapon: wpn,
            distance: Math.round(d),
            elevationDelta: Math.round(dh),
            azimuthDeg: Math.round(azDeg),
            azimuthMil: azMil,
            elevationAngleDeg: thetaDeg.toFixed(1),
            elevationAngleMil: thetaMil,
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
        this.battery.x = Math.max(0, Math.min(this.terrain.config.gridSize, x));
        this.battery.y = Math.max(0, Math.min(this.terrain.config.gridSize, y));
        return this.update();
    }

    setTarget(x, y) {
        this.target.x = Math.max(0, Math.min(this.terrain.config.gridSize, x));
        this.target.y = Math.max(0, Math.min(this.terrain.config.gridSize, y));
        return this.update();
    }

    setWeapon(weaponId) {
        if (WEAPON_CONFIGS[weaponId]) {
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
