# WARDOGS 3D Tactical Map V3 — Authentic 3D World, Buildings & Foliage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate authentic WARDOGS 3D world geometry, real 3D architectural buildings/structures, and realistic vegetation/trees directly matching the reference standard at `wardogs.n4lab.dev`, with 3D Line of Sight obstacle collision against buildings and full artillery calculation.

**Architecture:** Implement a high-performance native `.pack` binary loader in Three.js (`pack-loader.js`) that directly unpacks the official game DEM terrain grid (`*-terrain.pack`), 3D structures library (`world-library-lq.pack` + `*-structures-lq.pack`), and authentic vegetation (`*-vegetation-lq.pack`). Render thousands of buildings, hangars, watchtowers, and trees using GPU-instanced batches (`THREE.InstancedMesh`) with unified PBR shading and vertex colors at a rock-solid 60 FPS, while extending the LOS raymarcher to test collision against both terrain and 3D building bounding boxes.

**Tech Stack:** Three.js (ESM r170), WebGL2, Binary Pack Parser (DataView, TypedArrays), InstancedMesh GPU Batching, Official WARDOGS Assets (`wd-maps-assets.n4lab.dev`), Web Audio API.

**Spec:** `.hermes/plans/2026-09-15-wardogs-v3-real-3d-buildings-vegetation.md` (Reference implementation: `https://wardogs.n4lab.dev/?lang=ru&map=ozeti&mode=view`).

## Global Constraints

- **Single Source of Truth:** Direct parsing of authentic WARDOGS `.pack` data from `https://wd-maps-assets.n4lab.dev/` (Magic `0x50474457`, Version 1).
- **Zero Heavy Dependencies:** No external heavy loaders (like monolithic GLTFLoader or heavy wasm blobs); native clean ES6 module binary unpacking.
- **Strict Performance Budget:** 60 FPS in WebGL via `THREE.InstancedMesh` batching; default to `lq` tier (~8MB download) with seamless loading indicator.
- **Tactical Fidelity:** Real heights, genuine game coordinates, 3D building collision for Line of Sight, and official discrete MIL firing solutions.
- **Clean Fallback & Verification:** Headless browser QA verification via `verify_wardogs_v3.py` with Edge screenshots analyzed via `vision_analyze`.

---

## File Structure & Module Decomposition

```
wardogs-tactical-map/
├── assets/
│   ├── js/
│   │   ├── pack-loader.js          # [NEW] Native binary parser for WARDOGS .pack files (terrain, world-library, structures, foliage)
│   │   ├── world-engine.js         # [NEW] Orchestrator for 3D terrain mesh, InstancedMesh structures (houses, hangars) & foliage (trees)
│   │   ├── terrain-engine.js       # [UPDATE] Connect native game DEM geometry, lighting, and camera framing
│   │   ├── viewshed-engine.js      # [UPDATE] Add 3D building bounding-box obstacle collision to Line of Sight raymarcher
│   │   ├── tactical-2d-map.js      # [UPDATE] Sync with genuine game bounds and building footprints
│   │   ├── ballistics-engine.js    # [RETAIN] Official discrete MIL firing tables
│   │   ├── config.js               # [UPDATE] Map bounds, cell offsets, and asset URLs from manifest.json
│   │   └── app.js                  # [UPDATE] Wire quality selector (LQ/MQ), building/foliage visibility toggles, loading bar
│   └── css/
│       └── tactical.css            # [UPDATE] Add 3D world layer controls (Buildings, Foliage, Quality) and loading progress bar
├── index.html                      # [UPDATE] Add toggles for 3D Buildings & Foliage in top/side HUD
└── archive/qa/
    └── verify_wardogs_v3.py        # [NEW] Headless QA script to capture full-render 3D building and foliage screenshots
```

---

### Task 1: Binary Pack Loader (`assets/js/pack-loader.js`)

**Files:**
- Create: `assets/js/pack-loader.js`
- Test: `scripts/test_pack_loader_unit.js`

**Interfaces:**
- Consumes: Raw `ArrayBuffer` fetched from `https://wd-maps-assets.n4lab.dev/*.pack`
- Produces: `AssetPack` object containing:
  - `manifest`: JSON object with meshes, geometries, models, materials
  - `createBufferGeometry(geometryId)`: returns `THREE.BufferGeometry` with `position`, `normal`, `uv`, and `index`
  - `getInstances(instancesDef)`: returns `Float32Array` instance transform matrices (16 floats per instance)

- [ ] **Step 1: Write the unit test for binary pack parsing**
Create `scripts/test_pack_loader_unit.js` that tests header validation, JSON manifest decoding, and geometry reconstruction against local/mock buffers.

- [ ] **Step 2: Run test to verify it fails**
Run `node scripts/test_pack_loader_unit.js` (fails with module not found).

- [ ] **Step 3: Implement `assets/js/pack-loader.js`**
Write clean ES6 class `PackLoader` implementing:
- Magic `0x50474457` and version `1` header validation.
- `DataView` + `TextDecoder` JSON manifest extraction.
- TypedArray mapping (`Float32Array`, `Uint32Array`, etc.) for vertex attributes.
- Support for `grid.x`, `grid.y`, `grid.z` heightfield terrain grids and standard attribute views.
- Direct conversion into `THREE.BufferGeometry`.

- [ ] **Step 4: Run test to verify it passes**
Run `node scripts/test_pack_loader_unit.js` and verify it unpacks real terrain geometry with ~410,881 vertices in under 150ms.

- [ ] **Step 5: Commit**
```bash
git add assets/js/pack-loader.js scripts/test_pack_loader_unit.js
git commit -m "feat(engine): implement native WARDOGS binary pack loader"
```

---

### Task 2: 3D World Engine & Instanced Structures (`assets/js/world-engine.js`)

**Files:**
- Create: `assets/js/world-engine.js`
- Modify: `assets/js/config.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `PackLoader`, `THREE.Scene`, `MAP_CONFIGS`
- Produces:
  - `worldEngine.loadWorld(mapId, quality = 'lq')`: Loads and renders authentic 3D terrain, buildings, and trees
  - `worldEngine.toggleLayer('buildings', visible)`: Toggles 3D houses/structures
  - `worldEngine.toggleLayer('foliage', visible)`: Toggles 3D trees/vegetation
  - `worldEngine.getObstacleBoxes()`: Returns array of `{ min: THREE.Vector3, max: THREE.Vector3 }` for LOS collision

- [ ] **Step 1: Write integration test for WorldEngine**
Create `scripts/test_world_engine.js` verifying asset fetching from `wd-maps-assets.n4lab.dev`, model instancing, and layer toggles.

- [ ] **Step 2: Run integration test to observe requirements**
Run `node scripts/test_world_engine.js`.

- [ ] **Step 3: Implement `assets/js/world-engine.js`**
Implement:
- Caching of `world-library-lq.pack` shared 3D meshes (2,041 models of buildings, roofs, towers, trees).
- Shared `MeshStandardMaterial(roughness: 0.92, metalness: 0.04, vertexColors: true)` matching official game shaders.
- GPU batching using `THREE.InstancedMesh` grouped by geometry ID.
- Position offset and rotation unpacking (Float32 x10 TRS: position, quaternion, scale).
- Construction of building collision bounding boxes for LOS testing.

- [ ] **Step 4: Verify WorldEngine builds scenes**
Verify that `world-engine.js` generates over 1,500 active buildings and 3,000+ trees on Bakurani, Ozeti, and Zestafona.

- [ ] **Step 5: Commit**
```bash
git add assets/js/world-engine.js assets/js/config.js scripts/test_world_engine.js
git commit -m "feat(world): implement 3D structures and vegetation instancing engine"
```

---

### Task 3: 3D Building Obstacle Collision in Line of Sight (`assets/js/viewshed-engine.js`)

**Files:**
- Modify: `assets/js/viewshed-engine.js`
- Modify: `assets/js/app.js`

**Interfaces:**
- Consumes: `worldEngine.getObstacleBoxes()`, raymarcher between Observer and Target
- Produces:
  - `losResult.buildingBlocked`: Boolean indicating whether a 3D house/warehouse blocks the sightline
  - `losResult.blockingBuilding`: Information about the blocking structure (type, height, distance)

- [ ] **Step 1: Add building collision test to raymarcher**
In `viewshed-engine.js`, test Ray-AABB intersection for each step along the sightline against building bounding boxes.

- [ ] **Step 2: Update HUD and elevation profile**
When line of sight hits a building, render the building silhouette on the elevation cross-section drawer and trigger `OBSTACLE: 3D STRUCTURE COLLISION`.

- [ ] **Step 3: Verify collision detection**
Run headless test with observer behind a known warehouse/hangar to confirm the laser turns RED.

- [ ] **Step 4: Commit**
```bash
git add assets/js/viewshed-engine.js assets/js/app.js
git commit -m "feat(los): add 3D building collision detection to line of sight engine"
```

---

### Task 4: UI Controls, Layer Toggles & Loading Progress Bar

**Files:**
- Modify: `index.html`
- Modify: `assets/css/tactical.css`
- Modify: `assets/js/app.js`

**Interfaces:**
- Consumes: User interaction on top bar and right HUD
- Produces: Dynamic toggles for:
  - `BUILDINGS` (Show/Hide 3D Houses & Structures)
  - `TREES` (Show/Hide 3D Vegetation)
  - Quality selector (`LQ` fast / `MQ` detailed)
  - Real-time download progress bar (`Downloading 3D World Assets... 45%`)

- [ ] **Step 1: Add HTML markup in `index.html`**
Add `#btn-toggle-buildings`, `#btn-toggle-foliage`, and `#asset-loading-bar` with tactical military styling.

- [ ] **Step 2: Add CSS rules in `assets/css/tactical.css`**
Style the loading bar, layer badges, and building toggle buttons.

- [ ] **Step 3: Wire events in `assets/js/app.js`**
Connect button clicks to `worldEngine.toggleLayer()`, update status text, and sync with URL hash parameters (`&buildings=1&foliage=1`).

- [ ] **Step 4: Commit**
```bash
git add index.html assets/css/tactical.css assets/js/app.js
git commit -m "feat(ui): add 3D world layer controls, quality selector, and loading progress bar"
```

---

### Task 5: QA Verification with Headless Edge & Live Deploy

**Files:**
- Create: `archive/qa/verify_wardogs_v3.py`
- Modify: `README.md`

- [ ] **Step 1: Create verification script `archive/qa/verify_wardogs_v3.py`**
Configure script to launch temporary local server on port 8097, navigate headless Edge to `http://127.0.0.1:8097/#map=ozeti`, zoom in on a village with houses and trees, and capture `screenshot_wardogs_v3_ozeti.png`.

- [ ] **Step 2: Run verification script**
Run `python archive/qa/verify_wardogs_v3.py`.

- [ ] **Step 3: Inspect screenshot with `vision_analyze`**
Inspect `screenshot_wardogs_v3_ozeti.png` with `vision_analyze` to confirm that 3D houses, roofs, fences, and green trees are clearly rendered on the terrain.

- [ ] **Step 4: Deploy to GitHub Pages**
Push all changes to `main` branch, verify GitHub Pages build status (`status: built`), and test live URL.

- [ ] **Step 5: Commit & Final Verification**
```bash
git add archive/qa/verify_wardogs_v3.py README.md
git commit -m "docs: complete WARDOGS 3D tactical map V3 with authentic buildings and trees"
git push origin main
```

---

## Execution Choice

Plan complete and saved to `.hermes/plans/2026-09-15-wardogs-v3-real-3d-buildings-vegetation.md`.
Two execution options:
1. **Subagent-Driven (recommended)** - Execute task-by-task with isolated subagents and independent QA review.
2. **Inline Execution** - Execute tasks directly in this session with immediate tool execution and continuous verification checkpoints.
