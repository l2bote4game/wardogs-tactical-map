/* ============================================================
   WARDOGS 3D TACTICAL MAP — AIR DEFENSE & ПВО RADAR ENGINE
   Features:
   - 3D Tactical Radar Search Hemisphere & Engagement Bubble
   - Animated Sweeping Radar Beam
   - Low-Altitude Terrain Masking & Blind Valley Detection
   - NOE (Nap of the Earth) Air Ingress Corridor Analysis
   ============================================================ */

import * as THREE from 'three';
import { WEAPON_CONFIGS } from './config.js';

export class AirDefenseEngine {
    constructor(terrainEngine) {
        this.terrain = terrainEngine;
        this.site = { x: 1350, y: 920, mastHeight: 8.0 }; // e.g. Command Bunker Peak
        this.config = WEAPON_CONFIGS.airdefense;

        this.visible = false;
        this.radarDomeMesh = null;
        this.engagementMesh = null;
        this.sweepBeam = null;
        this.siteMarker = null;

        this.sweepAngle = 0;

        this.initVisuals();
    }

    initVisuals() {
        const scene = this.terrain.scene;

        // Air Defense Site Marker (Radar Turret)
        const siteGeo = new THREE.ConeGeometry(3.0, 4.5, 4);
        const siteMat = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            emissive: 0x1d4ed8,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.2
        });
        this.siteMarker = new THREE.Mesh(siteGeo, siteMat);
        scene.add(this.siteMarker);

        // 3D Radar Search Hemisphere (Radius: 2500m -> 250 Three.js units)
        const radR = (this.config.searchRadius * this.terrain.scaleRatio);
        const domeGeo = new THREE.SphereGeometry(radR, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        this.radarDomeMesh = new THREE.Mesh(domeGeo, domeMat);
        scene.add(this.radarDomeMesh);

        // Inner Missile Engagement Bubble (Radius: 2000m -> 200 units)
        const engR = (this.config.engagementRadius * this.terrain.scaleRatio);
        const engGeo = new THREE.SphereGeometry(engR, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const engMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });
        this.engagementMesh = new THREE.Mesh(engGeo, engMat);
        scene.add(this.engagementMesh);

        // Rotating Radar Sweep Beam (Wedge)
        const beamGeo = new THREE.ConeGeometry(radR, radR * 0.9, 12, 1, true, 0, Math.PI / 6);
        beamGeo.rotateX(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide
        });
        this.sweepBeam = new THREE.Mesh(beamGeo, beamMat);
        scene.add(this.sweepBeam);

        this.setVisible(false);
    }

    updatePosition(x, y) {
        this.site.x = Math.max(0, Math.min(this.terrain.config.gridSize, x));
        this.site.y = Math.max(0, Math.min(this.terrain.config.gridSize, y));

        const sitePos = this.terrain.gameToWorld(this.site.x, this.site.y);
        const emitterPos = sitePos.clone();
        emitterPos.y += this.site.mastHeight * this.terrain.scaleRatio;

        this.siteMarker.position.copy(sitePos);
        this.radarDomeMesh.position.copy(emitterPos);
        this.engagementMesh.position.copy(emitterPos);
        this.sweepBeam.position.copy(emitterPos);
    }

    setVisible(flag) {
        this.visible = flag;
        this.siteMarker.visible = flag;
        this.radarDomeMesh.visible = flag;
        this.engagementMesh.visible = flag;
        this.sweepBeam.visible = flag;
        if (flag) this.updatePosition(this.site.x, this.site.y);
    }

    animate(delta) {
        if (!this.visible || !this.sweepBeam) return;
        this.sweepAngle += delta * 1.4; // Rotate radar beam
        this.sweepBeam.rotation.y = this.sweepAngle;
    }
}
