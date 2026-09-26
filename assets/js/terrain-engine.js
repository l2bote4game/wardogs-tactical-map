/* ============================================================
   WARDOGS 3D TACTICAL MAP — TERRAIN ENGINE
   Procedural & Calibrated High-Resolution Topographic Maps
   Features:
   - Multi-Octave Fractal Heightfield for Bakurani, Ozeti, Zestafona
   - Sub-meter Bilinear Interpolation for real-time elevation queries
   - Custom GLSL Topographic Contour Isolines (10m minor / 50m major)
   - 100m Military Grid Cells & Coordinate Transforms
   - Dual Camera System: 3D Orbit / Top-Down 2D / First-Person Scope
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MAP_CONFIGS } from './config.js';
import { WorldEngine } from './world-engine.js';

export class TerrainEngine {
    constructor(canvasContainer) {
        this.container = canvasContainer;
        this.currentMapId = 'bakurani';
        this.config = MAP_CONFIGS[this.currentMapId];

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.terrainMesh = null;
        this.gridMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouseNDC = new THREE.Vector2();

        // Terrain Heightfield Data (256x256 elevation matrix)
        this.GRID_RES = 256;
        this.heightMatrix = new Float32Array(this.GRID_RES * this.GRID_RES);
        this.scaleRatio = 0.1; // 1 unit in Three.js = 10 meters in game

        // Visual Toggles & Satellite Textures
        this.textureLoader = new THREE.TextureLoader();
        this.loadedTextures = {};
        this.dummyTexture = new THREE.DataTexture(new Uint8Array([20, 30, 25, 255]), 1, 1, THREE.RGBAFormat);
        this.dummyTexture.needsUpdate = true;
        this.renderStyle = 'satellite'; // Default to pure crystal-clear satellite orthophoto!
        this.showContours = false;      // Contours off by default so satellite map is 100% visible
        this.showGrid = true;
        this.viewMode = 'orbit'; // 'orbit', 'topdown', 'scope'

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c10);
        this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.0018);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3000);
        this.camera.position.set(0, 180, 220);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.maxPolarAngle = Math.PI / 2.05; // prevent going below terrain
        this.controls.minDistance = 10;
        this.controls.maxDistance = 600;
        this.controls.target.set(0, 20, 0);

        // Lighting Rig
        this.setupLighting();

        // Authentic 3D World Engine (Dem terrain, buildings, trees)
        this.worldEngine = new WorldEngine(this);

        // Build Terrain
        this.loadMap(this.currentMapId);

        // Events
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xdde5f0, 0.7);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xfff8ee, 2.2);
        sun.position.set(120, 240, 100);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 10;
        sun.shadow.camera.far = 600;
        const d = 160;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        sun.shadow.bias = -0.0004;
        this.scene.add(sun);

        // Subtle fill light for steep valley relief
        const fill = new THREE.DirectionalLight(0x2d4860, 0.9);
        fill.position.set(-120, 80, -100);
        this.scene.add(fill);
    }

    /* ------------------------------------------------------------
       Fractal Heightfield Generation for Maps
       ------------------------------------------------------------ */
    loadMap(mapId) {
        if (!MAP_CONFIGS[mapId]) return;
        this.currentMapId = mapId;
        this.config = MAP_CONFIGS[mapId];

        this.generateHeightfield();
        this.rebuildTerrainMesh();
        this.rebuildMilitaryGrid();
        this.loadSatelliteTexture(this.config.texturePath);

        // Load authentic 3D World (DEM terrain, buildings, trees)
        if (this.worldEngine) {
            this.worldEngine.loadWorld(mapId);
        }

        // Reset camera focus
        if (this.controls) {
            this.controls.target.set(0, 15, 0);
            this.camera.position.set(0, 160, 200);
            this.controls.update();
        }
    }

    loadSatelliteTexture(path) {
        if (!path) return;
        if (this.loadedTextures[path]) {
            this.applySatTexture(this.loadedTextures[path]);
            return;
        }

        this.textureLoader.load(
            path,
            (tex) => {
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.generateMipmaps = true;
                this.loadedTextures[path] = tex;
                this.applySatTexture(tex);
            },
            undefined,
            (err) => {
                console.warn('Failed to load satellite texture:', path, err);
            }
        );
    }

    applySatTexture(tex) {
        if (this.material && this.material.uniforms.uSatTexture) {
            this.material.uniforms.uSatTexture.value = tex;
            this.material.uniforms.uHasSatTexture.value = 1.0;
            this.material.needsUpdate = true;
        }
    }

    // Perlin-style noise synthesis for realistic mountains, ravines, and plateaus
    generateHeightfield() {
        const res = this.GRID_RES;
        const cfg = this.config;
        const minZ = cfg.minElevation;
        const maxZ = cfg.maxElevation;
        const range = maxZ - minZ;

        // Custom seeds per map
        const seedMap = {
            bakurani: { oct1: 2.2, oct2: 5.5, oct3: 12.0, valleyFreq: 1.8, ridgeAngle: 0.78 },
            ozeti: { oct1: 1.4, oct2: 3.8, oct3: 8.0, valleyFreq: 1.2, ridgeAngle: 1.57 },
            zestafona: { oct1: 1.8, oct2: 4.5, oct3: 10.0, valleyFreq: 2.2, ridgeAngle: 0.0 }
        };
        const s = seedMap[cfg.id] || seedMap.bakurani;

        for (let j = 0; j < res; j++) {
            const ny = j / (res - 1); // 0 to 1
            for (let i = 0; i < res; i++) {
                const nx = i / (res - 1); // 0 to 1
                const idx = j * res + i;

                // Rotated coordinates for geological ridge faults
                const rx = nx * Math.cos(s.ridgeAngle) - ny * Math.sin(s.ridgeAngle);
                const ry = nx * Math.sin(s.ridgeAngle) + ny * Math.cos(s.ridgeAngle);

                // Multi-octave fractal synthesis
                let val = 0;
                val += Math.sin(rx * s.oct1 * Math.PI) * Math.cos(ry * s.oct1 * Math.PI) * 0.52;
                val += Math.sin(nx * s.oct2 * Math.PI + 0.5) * Math.cos(ny * s.oct2 * Math.PI + 1.2) * 0.28;
                val += Math.sin(nx * s.oct3 * Math.PI * 1.5) * Math.cos(ny * s.oct3 * Math.PI * 1.5) * 0.14;

                // Riverbed canyon / valley cutting
                const valleyDist = Math.abs(rx - 0.5);
                const canyonFactor = Math.pow(Math.min(1.0, valleyDist * s.valleyFreq), 1.6);
                val = val * (0.35 + 0.65 * canyonFactor);

                // Normalized to [0, 1]
                val = (val + 0.94) / 1.88;
                val = Math.max(0, Math.min(1, val));

                // Natural mountain sharpening (power curve for steep ridges)
                val = Math.pow(val, cfg.terrainProfile.roughness || 1.2);

                // Convert to real meters ASL
                const elevationMeters = minZ + val * range;
                this.heightMatrix[idx] = elevationMeters;
            }
        }
    }

    /* ------------------------------------------------------------
       Sub-Meter Bilinear Interpolation for Exact In-Game Elevation
       ------------------------------------------------------------ */
    getElevation(gameX, gameY) {
        const size = this.config.gridSize; // 2000m
        const res = this.GRID_RES;

        // Clamp to map boundary
        const gx = Math.max(0, Math.min(size - 0.01, gameX));
        const gy = Math.max(0, Math.min(size - 0.01, gameY));

        const fx = (gx / size) * (res - 1);
        const fy = (gy / size) * (res - 1);

        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const x1 = Math.min(res - 1, x0 + 1);
        const y1 = Math.min(res - 1, y0 + 1);

        const dx = fx - x0;
        const dy = fy - y0;

        const h00 = this.heightMatrix[y0 * res + x0];
        const h10 = this.heightMatrix[y0 * res + x1];
        const h01 = this.heightMatrix[y1 * res + x0];
        const h11 = this.heightMatrix[y1 * res + x1];

        // Bilinear interpolation
        const h0 = h00 * (1 - dx) + h10 * dx;
        const h1 = h01 * (1 - dx) + h11 * dx;
        return h0 * (1 - dy) + h1 * dy;
    }

    /* Coordinate Transforms: Game meters [0, 2000] <-> Three.js World coordinates */
    gameToWorld(gameX, gameY) {
        const half = this.config.gridSize / 2;
        const wx = (gameX - half) * this.scaleRatio;
        const wz = (gameY - half) * this.scaleRatio;
        const elev = this.getElevation(gameX, gameY);
        const wy = elev * this.scaleRatio;
        return new THREE.Vector3(wx, wy, wz);
    }

    worldToGame(worldX, worldZ) {
        const half = this.config.gridSize / 2;
        const gx = (worldX / this.scaleRatio) + half;
        const gy = (worldZ / this.scaleRatio) + half;
        const elev = this.getElevation(gx, gy);
        return { x: gx, y: gy, elevation: elev };
    }

    /* ------------------------------------------------------------
       Custom Topographic Contour Shader Mesh
       ------------------------------------------------------------ */
    rebuildTerrainMesh() {
        if (this.terrainMesh) {
            this.scene.remove(this.terrainMesh);
            this.terrainMesh.geometry.dispose();
            this.terrainMesh.material.dispose();
        }

        const res = this.GRID_RES;
        const sizeMeters = this.config.gridSize;
        const worldSize = sizeMeters * this.scaleRatio; // 200 units

        const geometry = new THREE.PlaneGeometry(worldSize, worldSize, res - 1, res - 1);
        geometry.rotateX(-Math.PI / 2); // Lay horizontal on XZ plane

        const posAttr = geometry.attributes.position;
        const elevations = new Float32Array(posAttr.count);

        for (let j = 0; j < res; j++) {
            for (let i = 0; i < res; i++) {
                const idx = j * res + i;
                const elevMeters = this.heightMatrix[idx];
                elevations[idx] = elevMeters;

                // Set Three.js Y coordinate
                posAttr.setY(idx, elevMeters * this.scaleRatio);
            }
        }
        geometry.setAttribute('elevation', new THREE.BufferAttribute(elevations, 1));
        geometry.computeVertexNormals();

        // Custom Topographic & Satellite Shader Material
        const cachedTex = this.loadedTextures[this.config.texturePath] || null;
        const styleVal = this.renderStyle === 'satellite' ? 0.0 : (this.renderStyle === 'contour' ? 1.0 : 2.0);

        const uniforms = {
            uMinElev: { value: this.config.minElevation },
            uMaxElev: { value: this.config.maxElevation },
            uScaleRatio: { value: this.scaleRatio },
            uShowContours: { value: this.showContours ? 1.0 : 0.0 },
            uRenderStyle: { value: styleVal }, // 0.0 = Satellite, 1.0 = Contours, 2.0 = Hybrid
            uContourMinor: { value: 20.0 }, // 20m minor contour
            uContourMajor: { value: 100.0 }, // 100m major contour
            uSatTexture: { value: cachedTex || this.dummyTexture },
            uHasSatTexture: { value: cachedTex ? 1.0 : 0.0 },
            uViewshedTexture: { value: this.dummyTexture },
            uHasViewshed: { value: 0.0 },
            uSunDir: { value: new THREE.Vector3(0.4, 0.85, 0.35).normalize() }
        };

        const terrainMaterial = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `
                attribute float elevation;
                varying float vElevation;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vWorldPos;

                void main() {
                    vElevation = elevation;
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }
            `,
            fragmentShader: `
                uniform float uMinElev;
                uniform float uMaxElev;
                uniform float uShowContours;
                uniform float uRenderStyle;
                uniform float uContourMinor;
                uniform float uContourMajor;
                uniform sampler2D uSatTexture;
                uniform float uHasSatTexture;
                uniform sampler2D uViewshedTexture;
                uniform float uHasViewshed;
                uniform vec3 uSunDir;

                varying float vElevation;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vWorldPos;

                // Tactical Military Color Ramp (Topographic mode)
                vec3 getElevationColor(float t) {
                    vec3 cDeep = vec3(0.06, 0.10, 0.09);   // Dark ravine
                    vec3 cLow = vec3(0.12, 0.18, 0.14);    // Low valley
                    vec3 cMid = vec3(0.20, 0.26, 0.22);    // Midland slope
                    vec3 cHigh = vec3(0.35, 0.40, 0.36);   // High rock
                    vec3 cPeak = vec3(0.65, 0.70, 0.68);   // Rocky crest

                    if (t < 0.25) return mix(cDeep, cLow, t / 0.25);
                    if (t < 0.50) return mix(cLow, cMid, (t - 0.25) / 0.25);
                    if (t < 0.78) return mix(cMid, cHigh, (t - 0.50) / 0.28);
                    return mix(cHigh, cPeak, (t - 0.78) / 0.22);
                }

                void main() {
                    float t = clamp((vElevation - uMinElev) / (uMaxElev - uMinElev), 0.0, 1.0);
                    vec3 topoCol = getElevationColor(t);

                    // Satellite orthophoto sampling
                    vec3 satCol = topoCol;
                    if (uHasSatTexture > 0.5) {
                        // UV mapping flip correction if needed (Three.js PlaneGeometry uv.y is 0 at bottom)
                        vec4 texSample = texture2D(uSatTexture, vec2(vUv.x, 1.0 - vUv.y));
                        satCol = texSample.rgb;
                    }

                    // Hillshade lighting
                    float diffuse = max(0.25, dot(vNormal, uSunDir));
                    
                    vec3 baseCol = topoCol;
                    if (uRenderStyle < 0.5) {
                        // Pure Satellite
                        baseCol = satCol * (diffuse * 0.75 + 0.35);
                    } else if (uRenderStyle > 1.5) {
                        // Hybrid: Satellite enhanced with terrain relief
                        baseCol = mix(satCol, satCol * diffuse, 0.45);
                    } else {
                        // Pure Topo
                        baseCol = topoCol * diffuse;
                    }

                    // Topographic Contour Isolines
                    if (uShowContours > 0.5 && uRenderStyle > 0.5) {
                        float elev = vElevation;
                        float fMinor = abs(fract(elev / uContourMinor - 0.5) - 0.5) / fwidth(elev / uContourMinor);
                        float lineMinor = clamp(1.0 - fMinor * 0.75, 0.0, 1.0);

                        float fMajor = abs(fract(elev / uContourMajor - 0.5) - 0.5) / fwidth(elev / uContourMajor);
                        float lineMajor = clamp(1.0 - fMajor * 0.45, 0.0, 1.0);

                        // Subtle topographic contours that do not blind the aerial photography
                        baseCol = mix(baseCol, vec3(0.04, 0.06, 0.08), lineMinor * 0.25);
                        baseCol = mix(baseCol, vec3(0.0, 0.6, 0.45), lineMajor * 0.45);
                    }

                    // Dynamic Viewshed Overlay (Subtle 28% green tint for visible, red for blind zones)
                    if (uHasViewshed > 0.5) {
                        vec4 vCol = texture2D(uViewshedTexture, vUv);
                        if (vCol.a > 0.02) {
                            baseCol = mix(baseCol, vCol.rgb, vCol.a * 0.28);
                        }
                    }

                    // Tactical 100m subtle cell border lines
                    vec2 cellUv = fract(vUv * 20.0);
                    float border = step(0.98, cellUv.x) + step(0.98, cellUv.y);
                    baseCol += vec3(0.0, 0.5, 0.4) * border * 0.08;

                    gl_FragColor = vec4(baseCol, 1.0);
                }
            `,
            wireframe: false
        });

        this.terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = true;
        this.scene.add(this.terrainMesh);
        this.material = terrainMaterial;
    }

    /* ------------------------------------------------------------
       Military Coordinate Grid (A1 - T20)
       ------------------------------------------------------------ */
    rebuildMilitaryGrid() {
        if (this.gridMesh) {
            this.scene.remove(this.gridMesh);
            this.gridMesh.geometry.dispose();
            this.gridMesh.material.dispose();
        }

        const size = this.config.gridSize * this.scaleRatio;
        const gridHelper = new THREE.GridHelper(size, 20, 0x00f2fe, 0x1f2937);
        gridHelper.position.y = (this.config.minElevation - 5) * this.scaleRatio;
        this.gridMesh = gridHelper;
        this.gridMesh.visible = this.showGrid;
        this.scene.add(this.gridMesh);
    }

    setViewshedTexture(texture) {
        if (!this.material) return;
        this.material.uniforms.uViewshedTexture.value = texture || this.dummyTexture;
        this.material.uniforms.uHasViewshed.value = texture ? 1.0 : 0.0;
        this.material.needsUpdate = true;
    }

    setRenderStyle(style) {
        this.renderStyle = style; // 'satellite', 'contour', 'hybrid'
        if (this.material && this.material.uniforms.uRenderStyle) {
            const styleVal = style === 'satellite' ? 0.0 : (style === 'contour' ? 1.0 : 2.0);
            this.material.uniforms.uRenderStyle.value = styleVal;
            this.material.needsUpdate = true;
        }
    }

    toggleContours(flag) {
        this.showContours = flag;
        if (this.material) {
            this.material.uniforms.uShowContours.value = flag ? 1.0 : 0.0;
        }
    }

    toggleGrid(flag) {
        this.showGrid = flag;
        if (this.gridMesh) {
            this.gridMesh.visible = flag;
        }
    }

    /* ------------------------------------------------------------
       Camera Modes
       ------------------------------------------------------------ */
    setCameraView(mode, observerPos = null, targetPos = null) {
        this.viewMode = mode;
        if (mode === 'topdown') {
            this.controls.enableRotate = false;
            this.camera.position.set(0, 320, 0.1);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        } else if (mode === 'orbit') {
            this.controls.enableRotate = true;
            this.camera.position.set(0, 160, 200);
            this.controls.target.set(0, 20, 0);
            this.controls.update();
        } else if (mode === 'scope' && observerPos && targetPos) {
            // First-person sniper scope view directly from observer's eye
            this.controls.enableRotate = true;
            const eyePos = this.gameToWorld(observerPos.x, observerPos.y);
            eyePos.y += (observerPos.height || 1.75) * this.scaleRatio;

            const aimPos = this.gameToWorld(targetPos.x, targetPos.y);
            this.camera.position.copy(eyePos);
            this.controls.target.copy(aimPos);
            this.controls.update();
        }
    }

    /* ------------------------------------------------------------
       Raycast Picking on 3D Terrain
       ------------------------------------------------------------ */
    pickTerrain(clientX, clientY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouseNDC, this.camera);
        if (!this.terrainMesh) return null;

        const intersects = this.raycaster.intersectObject(this.terrainMesh);
        if (intersects.length > 0) {
            const pt = intersects[0].point;
            const gameCoord = this.worldToGame(pt.x, pt.z);
            return {
                worldPos: pt,
                gameX: Math.round(gameCoord.x),
                gameY: Math.round(gameCoord.y),
                elevation: Math.round(gameCoord.elevation)
            };
        }
        return null;
    }

    onWindowResize() {
        if (!this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    render() {
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
