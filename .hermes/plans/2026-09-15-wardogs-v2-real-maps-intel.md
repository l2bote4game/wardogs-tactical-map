# WARDOGS 3D Tactical Map V2: Real Satellite Maps, Calibrated Ballistics & Authentic Air Defense Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `wardogs-tactical-map` from a generic gray prototype into an authentic, production-grade 3D tactical intelligence tool for WARDOGS (Steam 1867240), powered by real 1024x1024 satellite orthophotos (Bakurani, Ozeti, Zestafona), exact in-game ballistic tables (L81 Mortar: 132m–684m, SPH-2 Howitzer: 780m–2629m), authentic WARDOGS Air Defense systems (9K333 Verba MANPADS & FOB ZU-23-2 AA Autocannon), and calibrated player engagement radii.

**Architecture:** Three.js r170 terrain renderer textured with 1024x1024 stitched satellite orthophotos with blended topographic contour isolines; sub-meter heightfield elevation queries; exact in-game discrete MIL table interpolation for L81 and SPH-2; 3D engagement spheres and lock-on cones for 9K333 Verba MANPADS and ZU-23-2 AA; 360° viewshed raymarcher with player stance offsets (0.35m prone to 45m drone); real-time 2D elevation cross-section graph and 2D radar minimap.

**Tech Stack:** Three.js (r170 ESM), 1024x1024 Satellite Orthophoto Textures, HTML5 Canvas 2D, Tailwind CSS, Lucide Icons, Web Audio API, GitHub Pages.

---

## Game Fidelity & Equipment Specifications

### 1. Air Defense (ПВО) in WARDOGS
In WARDOGS, air defense is NOT an abstract fantasy missile dome; it consists of:
- **9K333 Verba MANPADS (ПЗРК «Верба»)**:
  - Portable shoulder-fired IR homing missile launcher for Support class (unlocked at Support Level 16).
  - Effective Lock-on Range: **1,200 m** against helicopters (AH-6M Minigun, AH-6R Rocket Little Bird).
  - Minimum lock altitude: 15 m (cannot lock targets hugging tree canopy or behind mountain crests).
  - Requirement: Direct optical Line of Sight (LOS) to target.
- **FOB ZU-23-2 / Base Anti-Air Autocannon**:
  - Twin-barrel 23mm rapid-fire anti-aircraft gun mounted at Forward Operating Bases (FOBs) and vehicle depots.
  - Effective Range: **1,500 m**.
  - Rate of fire: 2,000 RPM, high-explosive incendiary (HE-I) ammunition.
  - Threat envelope: Hemispherical dome covering low/mid-altitude air corridors.
- **Vehicular Mobile AA**:
  - Havoc / Kodiak IFV 30mm autocannon (effective range: **1,000 m**).

### 2. Infantry & Player Engagement Radii
- **CQB / Point Blank**: 0 – 50 m (Shotguns, SMGs, Pistols).
- **Assault Rifle Combat Radius**: 50 – 300 m (AK74, A-91, M4).
- **DMR / Marksman Radius**: 200 – 600 m.
- **Sniper Rifle Killzone**: 300 – 1,200 m (AWM-338, CheyTac).
- **Foot Soldier Draw Distance**: 1,500 m.

### 3. Exact Artillery & Mortar Ballistics (from Official Game Tables)
- **L81 Mortar**:
  - Minimum Range: **132 m** (850 MIL)
  - Maximum Range: **684 m** (150 MIL)
  - Discrete game lookup table: 80m (950 MIL), 151m (830 MIL), 300m (690 MIL), 454m (520 MIL), 603m (310 MIL), 684m (150 MIL).
- **SPH-2 155mm Howitzer**:
  - Minimum Range: **780 m** (High Arc: 1390 MIL)
  - Maximum Range: **2,629 m** (Low Arc: 600 MIL / High Arc: 610 MIL)
  - Low Arc: 1,181 m (20 MIL) to 2,629 m (600 MIL).
  - High Arc: 2,629 m (610 MIL) down to 735 m (1400 MIL).

### 4. Real Satellite Map Orthophotos
- **Bakurani**: Stitched 1024x1024 orthophoto (`assets/textures/bakurani_sat.jpg`).
- **Ozeti**: Stitched 1024x1024 orthophoto (`assets/textures/ozeti_sat.jpg`).
- **Zestafona**: Stitched 1024x1024 orthophoto (`assets/textures/zestafona_sat.jpg`).

---

## Detailed Implementation Tasks

### Task 1: Update Weapon & Air Defense Configurations (`config.js`)
- Replace generic ballistic formulas with the official discrete WARDOGS lookup tables for L81 and SPH-2.
- Define authentic Air Defense systems: `verba` (9K333 Verba MANPADS, 1200m) and `zu23` (FOB ZU-23-2 Autocannon, 1500m).
- Add player engagement range rings (150m, 300m, 600m, 1200m).

### Task 2: Texture the 3D Terrain with 1024x1024 Satellite Orthophotos (`terrain-engine.js`)
- Load `bakurani_sat.jpg`, `ozeti_sat.jpg`, and `zestafona_sat.jpg` into Three.js `TextureLoader`.
- Update custom terrain shader to blend the satellite aerial photography with topographic contour lines and viewshed overlay.
- Provide toggle for: Satellite Photo Mode vs Topographic Map Mode vs Hybrid.

### Task 3: Authentic Air Defense & Player Radius Engine (`air-defense-engine.js`)
- Add selector for Air Defense unit:
  - 🪖 **9K333 Verba MANPADS**: 1200m lock-on bubble with optical terrain-obstruction check (if mountains block sightline to aircraft, missile cannot lock).
  - 💥 **FOB ZU-23-2 Twin Autocannon**: 1500m engagement dome with tracer bursts.
  - 🎯 **Infantry Combat Rings**: 150m CQB, 300m Rifle, 600m DMR, 1200m Sniper.

### Task 4: Ballistics Engine Precision Firing Tables (`ballistics-engine.js`)
- Implement piece-wise linear interpolation over official WARDOGS discrete firing table points.
- Accurately report official MIL values and flight times.
- Detect mountain ridge collisions.

### Task 5: UI & HUD Overhaul (`index.html`, `tactical.css`, `app.js`)
- Add Air Defense system selector (Verba MANPADS / ZU-23-2 Autocannon / Player Radii).
- Add Satellite / Topo / Hybrid map style selector.
- Display exact MIL table values.

### Task 6: Visual Verification with Headless Edge & Deployment
- Capture high-resolution screenshots.
- Verify satellite orthophoto rendering, air defense envelopes, and ballistics solutions.
- Commit and push to GitHub Pages.
