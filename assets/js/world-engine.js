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

        this.controlZoneGroup = new THREE.Group();
        this.controlZoneGroup.name = 'WardogsControlZone';
        this.scene.add(this.controlZoneGroup);

        // Visibility toggles (Clean defaults)
        this.showBuildings = true;
        this.showVegetation = true;
        this.showControlZone = true;

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
            if (this.onProgress) this.onProgress('Загрузка 3D леса и деревьев...', 0.75);
            await this.loadVegetation(mapId);

            // 4. Load Authentic Terrain-Conforming Control Zone
            if (this.onProgress) this.onProgress('Разметка зоны контроля...', 0.90);
            this.loadControlZone(mapId);

            if (this.onProgress) this.onProgress('Тактическая карта готова', 1.0);
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

        while (this.controlZoneGroup.children.length > 0) {
            const child = this.controlZoneGroup.children.pop();
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
            roughness: 0.90,
            metalness: 0.02,
            flatShading: false
        });

        // Store uniform reference for real-time viewshed updates & rock shading
        const halfSize = (this.terrain.config.sizeM || 1200) / 2;
        this.terrainUniforms = {
            uViewshedTexture: { value: this.terrain.dummyTexture },
            uHasViewshed: { value: 0.0 },
            uHalfSize: { value: halfSize }
        };

        material.onBeforeCompile = (shader) => {
            shader.uniforms.uViewshedTexture = this.terrainUniforms.uViewshedTexture;
            shader.uniforms.uHasViewshed = this.terrainUniforms.uHasViewshed;
            shader.uniforms.uHalfSize = this.terrainUniforms.uHalfSize;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                varying vec3 vWorldPos;`
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                varying vec3 vWorldPos;
                uniform sampler2D uViewshedTexture;
                uniform float uHasViewshed;
                uniform float uHalfSize;`
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `#include <map_fragment>
                // 1. Slope-aware natural rock cliff shading (no voxel stepping)
                float slope = dot(vNormal, vec3(0.0, 1.0, 0.0));
                if (slope < 0.72) {
                    float rockFactor = smoothstep(0.72, 0.42, slope);
                    vec3 rockColor = vec3(0.20, 0.23, 0.27);
                    diffuseColor.rgb = mix(diffuseColor.rgb, rockColor, rockFactor * 0.85);
                }

                // 2. Projected Tactical Viewshed (Green = LOS / Red = Blind Zone)
                if (uHasViewshed > 0.5) {
                    vec2 vUv = vec2(
                        (vWorldPos.x / (uHalfSize * 2.0)) + 0.5,
                        (vWorldPos.z / (uHalfSize * 2.0)) + 0.5
                    );
                    if (vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {
                        vec4 vsCol = texture2D(uViewshedTexture, vUv);
                        if (vsCol.a > 0.05) {
                            diffuseColor.rgb = mix(diffuseColor.rgb, vsCol.rgb, vsCol.a * 0.65);
                        }
                    }
                }`
            );
        };

        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = false;
        this.terrainMesh.name = 'AuthenticTerrainMesh';

        // Connect height queries to genuine terrain geometry
        this.patchTerrainHeightSampler(geometry);

        this.scene.add(this.terrainMesh);

        // Update terrainEngine's active terrainMesh so raycasting and clicks hit the authentic DEM mesh!
        this.terrain.terrainMesh = this.terrainMesh;
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

        // Standard PBR material for real architectural structures
        const material = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.82,
            metalness: 0.05,
            flatShading: false
        });

        let totalLoaded = 0;

        for (const m of pack.manifest.meshes) {
            if (m.count <= 0) continue;
            // FILTER: Only load real architectural buildings, ignore micro-props / debris cubes!
            if (m.layer !== 'buildings') continue;

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
            color: 0x3d7436,
            roughness: 0.85,
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
     * Load authentic Control Zone (Terrain-conforming tactical contour ring)
     */
    loadControlZone(mapId) {
        const cfg = this.terrain.config;
        if (!cfg || !cfg.controlZone) return;

        const cz = cfg.controlZone;
        const radius = cz.radiusM || 500;
        const cx = cz.siteX !== undefined ? cz.siteX : (cz.x - (cfg.sizeM || 1200) / 2);
        const czPos = cz.siteZ !== undefined ? cz.siteZ : (cz.y - (cfg.sizeM || 1200) / 2);

        // 1. Terrain-Conforming Contour Ring (Authentic WARDOGS GIS style)
        const segments = Math.max(96, Math.ceil((2 * Math.PI * radius) / 12));
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const px = cx + Math.cos(angle) * radius;
            const pz = czPos + Math.sin(angle) * radius;
            // Sample terrain height
            const py = this.terrain.getElevationAt ? this.terrain.getElevationAt(px, pz) : 0;
            points.push(new THREE.Vector3(px, py + 1.2, pz));
        }

        const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
        const ringMat = new THREE.LineBasicMaterial({
            color: 0xf2f4ee,
            transparent: true,
            opacity: 0.9,
            linewidth: 2
        });
        const ring = new THREE.LineLoop(ringGeo, ringMat);
        ring.name = 'control-zone-ring';
        this.controlZoneGroup.add(ring);

        // 2. Subtle Ground Fill Disk
        const discGeo = new THREE.CircleGeometry(radius, 64);
        discGeo.rotateX(-Math.PI / 2);
        const discMat = new THREE.MeshBasicMaterial({
            color: 0xf2f4ee,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(cx, 0.5, czPos);
        this.controlZoneGroup.add(disc);

        this.controlZoneGroup.visible = this.showControlZone;
    }

    /**
     * Toggle Control Zone
     */
    toggleBases(visible = null) {
        return this.toggleControlZone(visible);
    }

    toggleControlZone(visible = null) {
        this.showControlZone = visible !== null ? visible : !this.showControlZone;
        this.controlZoneGroup.visible = this.showControlZone;
        return this.showControlZone;
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
