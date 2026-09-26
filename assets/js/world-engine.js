/* ============================================================
   WARDOGS 3D WORLD ENGINE (WorldEngine)
   Manages authentic 3D game terrain, instanced structures (houses,
   warehouses, hangars, bridges) and authentic 3D vegetation (trees).
   ============================================================ */

import * as THREE from 'three';
import { PackLoader } from './pack-loader.js';

export class WorldEngine {
    constructor(terrainEngine) {
        this.terrain = terrainEngine;
        this.scene = terrainEngine.scene;

        // Layer groups
        this.terrainMesh = null;
        this.structuresGroup = new THREE.Group();
        this.structuresGroup.name = 'WardogsStructures';
        this.scene.add(this.structuresGroup);

        this.vegetationGroup = new THREE.Group();
        this.vegetationGroup.name = 'WardogsVegetation';
        this.scene.add(this.vegetationGroup);

        // Visibility toggles
        this.showBuildings = true;
        this.showVegetation = true;

        // Cache of loaded pack data
        this.cachedPacks = {};
        this.buildingObstacleBoxes = [];

        // Progress callback
        this.onProgress = null;
    }

    /**
     * Load authentic game world data for a given map (bakurani, ozeti, zestafona)
     */
    async loadWorld(mapId) {
        console.log(`[WorldEngine] Loading authentic 3D game world for ${mapId.toUpperCase()}...`);
        this.clearLayers();

        try {
            // 1. Load Authentic Game DEM Terrain
            if (this.onProgress) this.onProgress('Loading 3D Game Terrain...', 0.15);
            await this.loadTerrain(mapId);

            // 2. Load Authentic 3D Buildings & Structures
            if (this.onProgress) this.onProgress('Loading 3D Buildings & Structures...', 0.55);
            await this.loadStructures(mapId);

            // 3. Load Authentic 3D Trees & Vegetation
            if (this.onProgress) this.onProgress('Loading 3D Trees & Vegetation...', 0.85);
            await this.loadVegetation(mapId);

            if (this.onProgress) this.onProgress('3D Game World Ready', 1.0);
            console.log(`[WorldEngine] World for ${mapId} loaded successfully.`);
        } catch (err) {
            console.error(`[WorldEngine] Error loading world for ${mapId}:`, err);
        }
    }

    /**
     * Clear existing world layers
     */
    clearLayers() {
        if (this.terrainMesh) {
            this.scene.remove(this.terrainMesh);
            if (this.terrainMesh.geometry) this.terrainMesh.geometry.dispose();
            this.terrainMesh = null;
        }

        while (this.structuresGroup.children.length > 0) {
            const child = this.structuresGroup.children.pop();
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }

        while (this.vegetationGroup.children.length > 0) {
            const child = this.vegetationGroup.children.pop();
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }

        this.buildingObstacleBoxes = [];
    }

    /**
     * Load authentic 3D terrain grid mesh
     */
    async loadTerrain(mapId) {
        const packUrl = `assets/packs/${mapId}-terrain.pack`;
        const pack = await PackLoader.loadPack(packUrl);
        const meshDef = pack.manifest.meshes[0];
        const geoDef = pack.manifest.geometries[meshDef.geometry];

        const geometry = PackLoader.buildTerrainGeometry(pack, geoDef);

        // Store authentic DEM grid on terrainEngine for sub-millimeter bilinear elevation queries
        const posDef = geoDef.attributes.position;
        if (posDef && posDef.grid) {
            const x = pack.view(posDef.grid.x);
            const y = pack.view(posDef.grid.y);
            const z = pack.view(posDef.grid.z);
            this.terrain.demGrid = {
                x, y, z,
                cols: x.length,
                rows: z.length,
                minX: x[0],
                maxX: x[x.length - 1],
                minZ: z[0],
                maxZ: z[z.length - 1]
            };
            console.log(`[WorldEngine] Stored authentic DEM grid: ${x.length}x${z.length} (${y.length} heights). Bounds: [${x[0]}, ${x[x.length - 1]}] x [${z[0]}, ${z[z.length - 1]}]`);
        }

        // Load satellite texture for true visual fidelity
        const satTexPath = `assets/textures/${mapId}_sat.jpg`;
        const satTexture = this.terrain.textureLoader.load(satTexPath);
        satTexture.wrapS = THREE.ClampToEdgeWrapping;
        satTexture.wrapT = THREE.ClampToEdgeWrapping;

        const material = new THREE.MeshStandardMaterial({
            map: satTexture,
            roughness: 0.82,
            metalness: 0.05,
            flatShading: false
        });

        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = false;
        this.terrainMesh.name = 'AuthenticTerrainMesh';

        // Connect height queries to genuine terrain geometry
        this.patchTerrainHeightSampler(geometry);

        this.scene.add(this.terrainMesh);

        // Hide old generic terrain plane
        if (this.terrain.terrainMesh) {
            this.terrain.terrainMesh.visible = false;
        }
    }

    /**
     * Patch terrain elevation sampler with genuine DEM data
     */
    patchTerrainHeightSampler(geometry) {
        const posAttr = geometry.getAttribute('position');
        const box = geometry.boundingBox;
        const minX = box.min.x;
        const maxX = box.max.x;
        const minZ = box.min.z;
        const maxZ = box.max.z;

        // Create raycaster for sub-meter exact terrain elevation sampling
        const raycaster = new THREE.Raycaster();
        const downVec = new THREE.Vector3(0, -1, 0);

        this.terrain.getElevationAt = (worldX, worldZ) => {
            // Raycast down from above terrain
            const rayOrigin = new THREE.Vector3(worldX, 500, worldZ);
            raycaster.set(rayOrigin, downVec);
            const hits = raycaster.intersectObject(this.terrainMesh, false);
            if (hits.length > 0) {
                return hits[0].point.y;
            }
            return 0;
        };
    }

    /**
     * Load authentic 3D buildings and structures
     */
    async loadStructures(mapId) {
        const packUrl = `assets/packs/${mapId}-structures-lq.pack`;
        const pack = await PackLoader.loadPack(packUrl);

        // Unit box geometry for building proxies
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        boxGeo.computeVertexNormals();

        // Standard PBR material with vertex color support
        const material = new THREE.MeshStandardMaterial({
            roughness: 0.85,
            metalness: 0.15,
            flatShading: true
        });

        let totalLoaded = 0;

        for (const m of pack.manifest.meshes) {
            if (m.count <= 0) continue;

            const instMatArray = pack.view(m.instances);
            const colorArray = pack.view(m.colors);
            if (!instMatArray) continue;

            const instMesh = new THREE.InstancedMesh(boxGeo, material, m.count);
            instMesh.instanceMatrix = new THREE.InstancedBufferAttribute(instMatArray, 16);

            if (colorArray && colorArray.length >= m.count * 3) {
                instMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
            }

            instMesh.instanceMatrix.needsUpdate = true;
            if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;
            instMesh.castShadow = true;
            instMesh.receiveShadow = true;

            // Extract building bounding boxes for LOS collision
            if (m.layer === 'buildings' && m.bounds) {
                this.buildingObstacleBoxes.push({
                    min: new THREE.Vector3(m.bounds[0][0], m.bounds[0][1], m.bounds[0][2]),
                    max: new THREE.Vector3(m.bounds[1][0], m.bounds[1][1], m.bounds[1][2]),
                    name: m.name
                });
            }

            this.structuresGroup.add(instMesh);
            totalLoaded += m.count;
        }

        this.structuresGroup.visible = this.showBuildings;
        console.log(`[WorldEngine] Loaded ${totalLoaded} 3D structure instances across ${pack.manifest.meshes.length} batches.`);
    }

    /**
     * Load authentic 3D trees and vegetation
     */
    async loadVegetation(mapId) {
        const packUrl = `assets/packs/${mapId}-vegetation-lq.pack`;
        const pack = await PackLoader.loadPack(packUrl);

        // Cylinder or tapered cone geometry for tree foliage
        const treeGeo = new THREE.ConeGeometry(0.7, 2.0, 5);
        treeGeo.translate(0, 1.0, 0); // Base at zero

        const material = new THREE.MeshStandardMaterial({
            roughness: 0.95,
            metalness: 0.0,
            flatShading: true
        });

        let totalTrees = 0;

        for (const m of pack.manifest.meshes) {
            if (m.count <= 0) continue;

            const instMatArray = pack.view(m.instances);
            const colorArray = pack.view(m.colors);
            if (!instMatArray) continue;

            const instMesh = new THREE.InstancedMesh(treeGeo, material, m.count);
            instMesh.instanceMatrix = new THREE.InstancedBufferAttribute(instMatArray, 16);

            if (colorArray && colorArray.length >= m.count * 3) {
                instMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
            }

            instMesh.instanceMatrix.needsUpdate = true;
            if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;
            instMesh.castShadow = false;
            instMesh.receiveShadow = true;

            this.vegetationGroup.add(instMesh);
            totalTrees += m.count;
        }

        this.vegetationGroup.visible = this.showVegetation;
        console.log(`[WorldEngine] Loaded ${totalTrees} 3D tree instances across ${pack.manifest.meshes.length} batches.`);
    }

    /**
     * Toggle 3D buildings visibility
     */
    toggleBuildings(visible = null) {
        this.showBuildings = visible !== null ? visible : !this.showBuildings;
        this.structuresGroup.visible = this.showBuildings;
        return this.showBuildings;
    }

    /**
     * Toggle 3D vegetation visibility
     */
    toggleVegetation(visible = null) {
        this.showVegetation = visible !== null ? visible : !this.showVegetation;
        this.vegetationGroup.visible = this.showVegetation;
        return this.showVegetation;
    }

    /**
     * Check if a 3D line segment (from Observer eye to Target) hits any 3D building
     */
    checkBuildingObstruction(startVec, endVec) {
        if (!this.showBuildings || this.buildingObstacleBoxes.length === 0) {
            return { hit: false };
        }

        const dir = new THREE.Vector3().subVectors(endVec, startVec);
        const maxDist = dir.length();
        dir.normalize();

        const ray = new THREE.Ray(startVec, dir);

        for (const b of this.buildingObstacleBoxes) {
            const box = new THREE.Box3(b.min, b.max);
            const hitPoint = ray.intersectBox(box, new THREE.Vector3());
            if (hitPoint) {
                const dist = startVec.distanceTo(hitPoint);
                if (dist > 2.0 && dist < maxDist - 2.0) {
                    return {
                        hit: true,
                        point: hitPoint,
                        distance: dist,
                        name: b.name
                    };
                }
            }
        }

        return { hit: false };
    }
}
