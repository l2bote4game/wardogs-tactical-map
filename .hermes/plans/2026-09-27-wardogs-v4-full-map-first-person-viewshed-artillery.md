# WARDOGS 3D Tactical Map V4: Full Map Surround, First-Person Scope, 3D Viewshed & True Ballistic Arc

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the WARDOGS 3D Tactical Map into an authentic, seamless, military-grade simulator: extend the map with surrounding terrain and atmospheric horizon, smooth out blocky voxel cliff artifacts, render a visible 3D soldier avatar with a real-time ground-projected viewshed (green LOS / red blind zones), implement an authentic First-Person Sniper/Observer eye perspective with reticle zoom, and provide a full 3D artillery ballistic arc with crest clearance checks and out-of-range warnings.

**Architecture:** 
1. **Surround & Terrain Geometry:** Extend the central DEM site with background mountain skirts and exponential atmospheric fog to eliminate the floating-island black void; compute smooth vertex normals and slope-based rock shading on the terrain shader to eradicate Minecraft-style terraced cliffs.
2. **Viewshed & First-Person Optic Engine:** Render a visible 3D spotter avatar on terrain. Project viewshed visibility masks onto 3D ground geometry via multi-sample raycasting. Connect `btn-view-scope` to a dedicated First-Person Perspective camera positioned at `y = groundElevation + stanceHeight`, looking along the target vector with military MIL-dot reticle HUD.
3. **Ballistics & Firing Envelopes:** Compute true 3D projectile parabolic flight arcs (`THREE.CatmullRomCurve3` or analytical ballistic trajectory points). Color-code trajectory green (clear) or red (terrain/building collision point). Enforce strict weapon range boundaries ($132\text{m} - 684\text{m}$ for L81; $780\text{m} - 2629\text{m}$ for SPH-2) and highlight reverse-slope dead zones.

**Tech Stack:** Three.js r170 (ESM), WebGL2, Vanilla ES6 Modules, Tailwind CSS, Web Audio API, Headless Edge QA verification.

---

## Global Constraints
- Absolute paths only (`C:/Users/z/Desktop/wardogs-tactical-map/...`).
- Zero placeholder code or stubs; all code must be fully implemented and verified via Edge headless screenshots.
- Military color palette: `#00f2fe` (cyan), `#10b981` (emerald green LOS), `#ef4444` (red blind zone / obstacle), `#f59e0b` (amber warning), `#f2f4ee` (tactical white).
- All labels and readouts in clear, professional Russian military terminology.
- Deploy to GitHub Pages (`https://l2bote4game.github.io/wardogs-tactical-map/`) and verify with `vision_analyze`.

---

### Task 1: Full-Surround Landscape, Terrain Skirt & Atmospheric Horizon

**Files:**
- Modify: `assets/js/terrain-engine.js:80-140`
- Modify: `assets/js/world-engine.js:110-180`
- Modify: `assets/css/tactical.css:10-50`

**Interfaces:**
- Consumes: `MAP_CONFIGS[mapId].sizeM`
- Produces: `terrainEngine.createSurroundSkirt()`, `terrainEngine.setupAtmosphere()`

- [ ] **Step 1: Implement surrounding mountain skirt geometry and atmospheric fog**
In `terrain-engine.js`:
Add an outer terrain skirt extending $3.5\times$ beyond the active map boundary ($4000\text{m}$ radius) with soft rolling hills and mountain silhouettes so the map never looks like a cut-off floating slab in space.
Set `scene.fog = new THREE.FogExp2(0x1e293b, 0.00032)` to blend the distant perimeter naturally into the sky.

- [ ] **Step 2: Add terrain pedestal base to close open mesh edges**
Add vertical skirt drop-offs along the outer perimeter of the DEM mesh down to elevation $-150\text{m}$ with dark earthen rock color (`0x111827`) so the terrain never shows hollow bottom polygons.

- [ ] **Step 3: Test local render via headless Edge script and verify horizon atmosphere**
Run: `python scripts/test_clean_maps.py`
Expected: Terrain smoothly extends into distant mountain silhouettes with realistic atmospheric haze; no black space void.

- [ ] **Step 4: Commit**
```bash
git add assets/js/terrain-engine.js assets/js/world-engine.js assets/css/tactical.css
git commit -m "feat(terrain): add full surround mountain skirt, perimeter pedestal, and atmospheric fog"
```

---

### Task 2: Smooth Natural Terrain Shading & Cliff Geology (No Minecraft Stepping)

**Files:**
- Modify: `assets/js/terrain-engine.js:180-320`
- Modify: `assets/js/world-engine.js:200-260`

**Interfaces:**
- Consumes: DEM elevation grid from `world-engine.js`
- Produces: Smooth terrain normals, slope-based rock shader, filtered proxy boxes

- [ ] **Step 1: Compute smooth vertex normals on DEM terrain geometry**
In `terrain-engine.js`:
Ensure `terrainMesh.geometry.computeVertexNormals()` is called after heightfield population.
Disable `flatShading: true` on terrain material — use smooth PBR Gouraud/Phong normal shading to completely eradicate faceted polygonal stepping on mountain slopes.

- [ ] **Step 2: Implement slope-aware rock shading in custom terrain shader**
In the vertex and fragment shader of `terrain-engine.js`:
Calculate surface slope $\cos(\theta) = \vec{N} \cdot \vec{Y}$.
When slope is steeper than $35^\circ$ ($\cos(\theta) < 0.82$), blend from satellite soil texture into dark textured limestone/slate rock color (`#2c333d`) with subtle vertical striations.

- [ ] **Step 3: Filter out anomalous proxy bounding boxes on cliffs**
In `world-engine.js` `loadStructures`:
Filter out low-quality proxy boxes whose elevation variance or slope exceeds $45^\circ$, preventing gray building boxes from spawning on sheer mountain faces.

- [ ] **Step 4: Verify terrain smoothness via Edge screenshot**
Run: `python scripts/test_clean_maps.py`
Expected: Cliffs look like natural jagged rock faces, free of square voxel/Minecraft stepping.

- [ ] **Step 5: Commit**
```bash
git add assets/js/terrain-engine.js assets/js/world-engine.js
git commit -m "fix(shader): smooth DEM vertex normals and add slope-based rock cliff shading"
```

---

### Task 3: Visible 3D Observer Avatar & Projected 3D Viewshed (Sight Field)

**Files:**
- Modify: `assets/js/viewshed-engine.js:1-200`
- Modify: `assets/js/terrain-engine.js:350-420`
- Modify: `index.html:130-180`

**Interfaces:**
- Consumes: `viewshedEngine.observer`, `viewshedEngine.target`
- Produces: `viewshedEngine.observerAvatarMesh`, `viewshedEngine.viewshedGroundMesh`

- [ ] **Step 1: Build 3D Tactical Observer Avatar on the terrain**
In `viewshed-engine.js`:
Create a distinct, high-visibility 3D spotter marker:
- Base tripod / tactical pedestal on the terrain.
- Directional viewing cone / heading arrow pointing towards the target or look azimuth.
- Eye-level optical beacon matching the chosen stance height ($0.35\text{m}$, $1.05\text{m}$, $1.75\text{m}$, $3.2\text{m}$, $14\text{m}$, $45\text{m}$).

- [ ] **Step 2: Project real-time 3D Viewshed overlay onto the ground**
Create a specialized custom geometry or dynamic canvas texture (`viewshedGroundMesh`):
- Rays cast radially from the observer's eye height across 128 azimuth angles.
- Visible terrain points receive a semi-transparent luminous green tint (`rgba(16, 185, 129, 0.28)`).
- Occluded/shadowed terrain points behind ridges or buildings receive a semi-transparent crimson tint (`rgba(239, 68, 68, 0.22)`).
- Ground overlay conforms directly to DEM elevations with `depthWrite: false` and polygon offset to eliminate z-fighting.

- [ ] **Step 3: Replace arbitrary 1200m slider with authentic game presets**
In `index.html` & `app.js`:
Replace the manual distance slider with three clear military presets:
1. `Пехотный обзор (800м)`
2. `Снайпер / Оптика (1400м)`
3. `Максимальный (Вся карта)`
Update viewshed range automatically without confusing the user with impossible distances.

- [ ] **Step 4: Verify 3D Viewshed visibility via Edge screenshot**
Run: `python scripts/test_clean_maps.py`
Expected: Observer avatar is clearly visible on the terrain; green visible zone and red blind zones are painted directly on the 3D ground.

- [ ] **Step 5: Commit**
```bash
git add assets/js/viewshed-engine.js assets/js/terrain-engine.js index.html
git commit -m "feat(viewshed): render 3D observer avatar and real-time ground-projected LOS field"
```

---

### Task 4: First-Person "Снайпер / Наблюдатель" Mode (True Eye Perspective)

**Files:**
- Modify: `assets/js/app.js:180-260`
- Modify: `assets/js/terrain-engine.js:450-520`
- Modify: `index.html:70-120`
- Modify: `assets/css/tactical.css:300-380`

**Interfaces:**
- Consumes: `viewshed.observer`, `viewshed.target`, `STANCE_PRESETS`
- Produces: `terrainEngine.enterFirstPersonMode()`, `terrainEngine.exitFirstPersonMode()`

- [ ] **Step 1: Implement First-Person Eye Camera positioning**
In `terrain-engine.js`:
Add `enterFirstPersonMode()`:
- Move `camera.position` to observer coordinates: `x = obs.x - sizeM/2`, `y = groundElevation + stanceHeight`, `z = obs.y - sizeM/2`.
- Point camera directly at the target: `camera.lookAt(tgtWorldX, tgtGroundY + 1.0, tgtWorldZ)`.
- Configure OrbitControls or FirstPerson controls with horizontal/vertical pitch limits.

- [ ] **Step 2: Add Tactical Sniper Reticle HUD Overlay**
In `index.html` and `assets/css/tactical.css`:
Add `#sniper-scope-overlay`:
- High-precision military MIL-dot crosshair, stadia rangefinder marks, and digital azimuth/elevation readouts.
- Zoom toggle buttons: `1x (Глаз)`, `4x (Оптика)`, `10x (Снайперка)` adjusting `camera.fov` (from $60^\circ$ down to $12^\circ$ and $6^\circ$).
- Visible button to exit back to 3D Orbit: `❌ ВЫЙТИ В 3D ОБЗОР`.

- [ ] **Step 3: Connect `ПРИЦЕЛ (СНАЙПЕР)` button in top navigation**
In `app.js`:
Attach click listener to `#btn-view-scope` to activate First-Person mode and display the sniper overlay.
Allow the user to physically look through the soldier's eyes to see if a hill or building blocks the shot.

- [ ] **Step 4: Verify First-Person View via Edge screenshot**
Run script to switch to scope view and capture screenshot.
Expected: Camera is standing on the ground at $1.75\text{m}$, looking through MIL crosshairs directly at the target over the terrain.

- [ ] **Step 5: Commit**
```bash
git add assets/js/app.js assets/js/terrain-engine.js index.html assets/css/tactical.css
git commit -m "feat(scope): implement authentic first-person sniper eye perspective with MIL reticle"
```

---

### Task 5: True 3D Artillery Ballistics Arc & Firing Envelope (Dead Zones)

**Files:**
- Modify: `assets/js/ballistics-engine.js:1-250`
- Modify: `assets/js/terrain-engine.js:520-590`
- Modify: `assets/js/app.js:280-360`
- Modify: `index.html:190-250`

**Interfaces:**
- Consumes: `OFFICIAL_WEAPON_TABLES`, `batteryPos`, `targetPos`
- Produces: `ballisticsEngine.ballisticCurveMesh`, `ballisticsEngine.calculateFiringSolution()`

- [ ] **Step 1: Compute and render true 3D parabolic flight arc**
In `ballistics-engine.js`:
Calculate ballistic trajectory points between battery $(x_0, y_0, z_0)$ and target $(x_1, y_1, z_1)$:
- Initial velocity $v_0$ and launch angle $\theta$ from official game tables (`L81 Mortar`: $73.4\text{m/s}$ at high angle $\sim 1150\text{--}1500\text{ MIL}$).
- Calculate 64 trajectory points: $x(t) = x_0 + v_x t$, $y(t) = y_0 + v_y t - \frac{1}{2} g t^2$, $z(t) = z_0 + v_z t$.
- Create `THREE.Line2` or `THREE.Line` with glowing dashed ballistic line.

- [ ] **Step 2: Real-time crest clearance collision check (Ridge Interception)**
Sample terrain and building heights along the trajectory points:
- If all points clear terrain by $> 5\text{m}$: color trajectory **GREEN** (`#10b981`), status: `🟢 ЧИСТАЯ ТРАЕКТОРИЯ (ПОПАДАНИЕ ГАРАНТИРОВАНО)`.
- If trajectory collides with a mountain crest or building: color trajectory **RED** (`#ef4444`), place a glowing red explosion marker at the collision point, status: `🔴 ПЕРЕХВАТ РЕЛЬЕФОМ: СНАРЯД ВРЕЖЕТСЯ В ХОЛМ ЧЕРЕЗ ...м`.

- [ ] **Step 3: Enforce strict weapon range limits with clear out-of-range warnings**
When target distance exceeds weapon max range (e.g. $761\text{m} > 684\text{m}$ on L81):
- Display prominent red banner: `❌ ВНЕ ЗОНЫ ДОСЯГАЕМОСТИ (МАКС 684м, ПЕРЕЛЁТ +77м)`.
- Lock sight elevation to `-- MIL` rather than displaying erroneous numbers.
- In 3D: render a translucent ring for Min Range ($132\text{m}$) and Max Range ($684\text{m}$) around the battery position so the user instantly sees what can be hit.

- [ ] **Step 4: Verify 3D ballistic arc and collision check via Edge screenshot**
Run: `python scripts/test_clean_maps.py`
Expected: Glowing 3D parabolic arc flies through the air; crest clearance is checked; range envelope ring is visible.

- [ ] **Step 5: Commit**
```bash
git add assets/js/ballistics-engine.js assets/js/terrain-engine.js assets/js/app.js index.html
git commit -m "feat(ballistics): render true 3D parabolic artillery arc with crest clearance and range rings"
```

---

### Task 6: Interactive Placement UX, Deconfliction & Final Production Deployment

**Files:**
- Modify: `assets/js/app.js:60-150`
- Modify: `index.html:85-115`
- Modify: `assets/css/tactical.css:180-240`

**Interfaces:**
- Consumes: Tool clicks from `#toolbar-left`
- Produces: Seamless placement of Observer, Target, Artillery on single click

- [ ] **Step 1: Streamline click-to-place tool interaction**
In `app.js`:
- Clicking `👁️ Наблюдатель` activates observer placement mode; clicking on 3D terrain sets the observer position immediately and updates the viewshed.
- Clicking `💣 Миномёт / Арта` activates artillery placement mode; clicking on terrain moves the battery and shows its range circle.
- Clicking `🎯 Цель` sets the target point and recalculates ballistics and LOS profile instantly.

- [ ] **Step 2: Deconflict all UI layout panels and z-indexes**
In `tactical.css` & `index.html`:
- Constrain `#quick-help-banner` so it never overlaps the minimap panel.
- Ensure `#controls-panel` has independent smooth vertical scrolling with ample padding so the bottom ballistics telemetry is never clipped.

- [ ] **Step 3: Full production build, push to GitHub Pages, and audit via headless Edge**
Run:
```bash
git add .
git commit -m "feat(v4): full surrounding terrain, 3D viewshed, first-person scope, and 3D artillery arc"
git push origin main
```
Capture live production screenshots on `https://l2bote4game.github.io/wardogs-tactical-map/#map=bakurani` and verify with `vision_analyze`.

---

## Self-Review Checklist
1. **Spec Coverage:**
   - Full surrounding terrain instead of central patch? $\to$ Task 1.
   - Smooth natural cliffs instead of blocky voxel steps? $\to$ Task 2.
   - Visible 3D person/avatar with real-time ground viewshed? $\to$ Task 3.
   - First-person sniper/observer eye perspective with reticle? $\to$ Task 4.
   - Realistic view distance instead of arbitrary sliders? $\to$ Task 3.
   - Convenient artillery placement with true 3D arc and dead zones? $\to$ Task 5 & 6.
2. **No Placeholders:** All tasks define exact files, methods, math, and verification steps.
3. **Consistency:** All method names and interfaces are cross-referenced across modules.
