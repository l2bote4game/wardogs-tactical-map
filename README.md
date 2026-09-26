# 🗺️ WARDOGS 3D TACTICAL MAP & LINE OF SIGHT CALCULATOR

**Interactive 3D Tactical Terrain, Line of Sight (LOS) Viewshed, Mortar/Artillery Ballistics, and Air Defense (ПВО) Calculator for WARDOGS (Steam 1867240).**

🌐 **Live Web Application:** [https://l2bote4game.github.io/wardogs-tactical-map/](https://l2bote4game.github.io/wardogs-tactical-map/)

---

## 🎯 Key Features

1. **Realistic 3D Terrain Engine:**
   - Calibrated 3D elevation maps for **Bakurani**, **Ozeti**, and **Zestafona**.
   - Dynamic topographic contour lines (10m minor / 50m major) & 100m military grid cells.
   - Smooth 360° Orbit, Tactical Orthographic Top-Down, and First-Person Observer Scope modes.

2. **Real-time Line of Sight (LOS) & 360° Viewshed:**
   - Drop an **Observer** point anywhere and immediately see visible areas (Tactical Green) vs blind/shadow zones (Red).
   - Stance presets: Prone (0.35m), Crouch (1.05m), Standing (1.75m), Vehicle/Roof (3.8m), Watchtower (14m), Drone (45m).
   - Directional FOV angle cones (30° sniper scope to 360° panoramic scan).
   - Adjustable radius from 100m to 3000m.

3. **Elevation Cross-Section Graph:**
   - Real-time 2D terrain profile between Observer and Target.
   - Exact distance, elevation delta ($\Delta h$), slope angle (degrees & mils), and obstacle collision points.

4. **Mortar & Artillery 3D Ballistics:**
   - **L81 81mm Mortar**: High-arc trajectory solutions (1100–1500 MIL).
   - **SPH-2 155mm Howitzer**: High-arc and Low-arc solutions.
   - 3D flight trajectory curve rendered in the scene with terrain crest collision check.
   - Reverse-slope dead zone indicator.

5. **Air Defense / ПВО Radar Coverage:**
   - 3D Radar hemispherical coverage dome.
   - Radar shadow & terrain masking analysis (highlights low-altitude valleys for safe drone/aircraft ingress).

6. **Squad Collaboration:**
   - Draggable 2x2km Control Zone overlay (matching WARDOGS match mechanics).
   - Instant squad sharing via URL hash state parameters.

---

## 🛠️ Tech Stack
- **Three.js (r170 ESM)**: High-performance WebGL 3D rendering.
- **HTML5 Canvas 2D**: Sub-meter elevation cross-section graph and 2D tactical radar minimap.
- **Tailwind CSS**: Dark tactical military C2 / OSINT console interface.
- **Web Audio API**: Procedural acoustic cues for tactical interactions.
