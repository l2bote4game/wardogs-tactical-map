/* ============================================================
   WARDOGS 3D TACTICAL MAP — AIR DEFENSE & ПВО RADAR ENGINE
   Authentic Systems:
   - 9K333 Verba MANPADS (1200m IR lock-on dome)
   - FOB ZU-23-2 Anti-Air Autocannon (1500m Flak bubble)
   - Player Combat Rings (50m CQB / 300m Rifle / 600m DMR / 1200m Sniper)
   ============================================================ */

import * as THREE from 'three';
import { AIR_DEFENSE_SYSTEMS, PLAYER_RADII } from './config.js';

export class AirDefenseEngine {
    constructor(terrainEngine) {
        this.terrain = terrainEngine;
        this.site = { x: 1350, y: 920, mastHeight: 2.0 };
        this.currentSystemId = 'verba'; // 'verba', 'zu23', 'infantry'
        this.config = AIR_DEFENSE_SYSTEMS.verba;

        this.visible = false;
        this.siteMarker = null;
        this.domeMesh = null;
        this.innerDomeMesh = null;
        this.sweepBeam = null;
        this.rangeRingsGroup = new THREE.Group();

        this.sweepAngle = 0;

        this.initVisuals();
    }

    initVisuals() {
        const scene = this.terrain.scene;

        // Air Defense Site Marker (Tripod / Launch tube)
        const siteGeo = new THREE.CylinderGeometry(1.2, 2.5, 3.5, 6);
        const siteMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 0.9,
            metalness: 0.8,
            roughness: 0.3
        });
        this.siteMarker = new THREE.Mesh(siteGeo, siteMat);
        scene.add(this.siteMarker);

        // 3D Threat / Radar Search Dome
        const domeGeo = new THREE.SphereGeometry(120, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        this.domeMesh = new THREE.Mesh(domeGeo, domeMat);
        scene.add(this.domeMesh);

        // Inner Killzone Bubble
        const innerGeo = new THREE.SphereGeometry(80, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x059669,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });
        this.innerDomeMesh = new THREE.Mesh(innerGeo, innerMat);
        scene.add(this.innerDomeMesh);

        // Rotating Search Wedge
        const beamGeo = new THREE.ConeGeometry(120, 110, 12, 1, true, 0, Math.PI / 6);
        beamGeo.rotateX(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide
        });
        this.sweepBeam = new THREE.Mesh(beamGeo, beamMat);
        scene.add(this.sweepBeam);

        // Player Threat Range Rings
        scene.add(this.rangeRingsGroup);
        this.buildPlayerRangeRings();

        this.setSystem('verba');
        this.setVisible(false);
    }

    setSystem(systemId) {
        this.currentSystemId = systemId;

        if (systemId === 'infantry') {
            this.domeMesh.visible = false;
            this.innerDomeMesh.visible = false;
            this.sweepBeam.visible = false;
            this.rangeRingsGroup.visible = this.visible;
            return;
        }

        const sys = AIR_DEFENSE_SYSTEMS[systemId] || AIR_DEFENSE_SYSTEMS.verba;
        this.config = sys;

        const radR = sys.engagementRadius * this.terrain.scaleRatio;
        const colorHex = parseInt(sys.color.replace('#', '0x'), 16);

        // Update Dome Scale & Color
        this.domeMesh.scale.set(radR / 120, radR / 120, radR / 120);
        this.domeMesh.material.color.setHex(colorHex);
        this.innerDomeMesh.scale.set((radR * 0.6) / 80, (radR * 0.6) / 80, (radR * 0.6) / 80);
        this.innerDomeMesh.material.color.setHex(colorHex);

        this.sweepBeam.scale.set(radR / 120, radR / 120, radR / 120);
        this.sweepBeam.material.color.setHex(colorHex);

        this.siteMarker.material.color.setHex(colorHex);
        this.siteMarker.material.emissive.setHex(colorHex);

        this.domeMesh.visible = this.visible;
        this.innerDomeMesh.visible = this.visible;
        this.sweepBeam.visible = this.visible;
        this.rangeRingsGroup.visible = false;

        this.updatePosition(this.site.x, this.site.y);
    }

    buildPlayerRangeRings() {
        while (this.rangeRingsGroup.children.length > 0) {
            this.rangeRingsGroup.remove(this.rangeRingsGroup.children[0]);
        }

        Object.values(PLAYER_RADII).forEach(item => {
            const r = item.radius * this.terrain.scaleRatio;
            const ringGeo = new THREE.RingGeometry(r - 0.3, r + 0.3, 64);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
                color: parseInt(item.color.replace('#', '0x'), 16),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.65
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            this.rangeRingsGroup.add(ring);
        });
    }

    updatePosition(x, y) {
        this.site.x = Math.max(0, Math.min(this.terrain.config.gridSize, x));
        this.site.y = Math.max(0, Math.min(this.terrain.config.gridSize, y));

        const sitePos = this.terrain.gameToWorld(this.site.x, this.site.y);
        const emitterPos = sitePos.clone();
        emitterPos.y += this.site.mastHeight * this.terrain.scaleRatio;

        this.siteMarker.position.copy(sitePos);
        this.domeMesh.position.copy(emitterPos);
        this.innerDomeMesh.position.copy(emitterPos);
        this.sweepBeam.position.copy(emitterPos);
        this.rangeRingsGroup.position.copy(sitePos);
        this.rangeRingsGroup.position.y += 0.5; // elevate slightly above terrain
    }

    setVisible(flag) {
        this.visible = flag;
        this.siteMarker.visible = flag;

        if (this.currentSystemId === 'infantry') {
            this.domeMesh.visible = false;
            this.innerDomeMesh.visible = false;
            this.sweepBeam.visible = false;
            this.rangeRingsGroup.visible = flag;
        } else {
            this.domeMesh.visible = flag;
            this.innerDomeMesh.visible = flag;
            this.sweepBeam.visible = flag;
            this.rangeRingsGroup.visible = false;
        }

        if (flag) this.updatePosition(this.site.x, this.site.y);
    }

    animate(delta) {
        if (!this.visible) return;
        if (this.sweepBeam && this.sweepBeam.visible) {
            this.sweepAngle += delta * 1.5;
            this.sweepBeam.rotation.y = this.sweepAngle;
        }
    }
}
