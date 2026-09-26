/* ============================================================
   WARDOGS 3D TACTICAL MAP — CONFIGURATION
   Official Game Maps: Bakurani, Ozeti, Zestafona
   Tactical Weapon Profiles, Ballistics & Military Grid Constants
   ============================================================ */

export const MAP_CONFIGS = {
    bakurani: {
        id: 'bakurani',
        name: 'Bakurani',
        region: 'Caucasus Highlands',
        subtitle: 'Industrial Mountain Pass & Fortified Saddle',
        description: 'Jagged mountain peaks, deep canyon riverbed, fortified bunker hub, and high-altitude rail bridges.',
        gridSize: 2000, // 2km x 2km
        cellSize: 100,  // 100m tactical cells
        minElevation: 60,
        maxElevation: 485,
        defaultObserver: { x: 420, y: 1540, stance: 'standing' }, // Radio Tower Ridge
        defaultTarget: { x: 980, y: 1100 },                      // Quarry Chokepoint
        pois: [
            { id: 'poi-radio', name: 'Radio Tower Peak', x: 420, y: 1540, type: 'recon', elevation: 465, desc: 'Highest observation post in western sector' },
            { id: 'poi-quarry', name: 'Quarry Chokepoint', x: 980, y: 1100, type: 'objective', elevation: 140, desc: 'Central tactical bottleneck and mineral depot' },
            { id: 'poi-bunker', name: 'Command Bunker Complex', x: 1350, y: 920, type: 'fortification', elevation: 280, desc: 'Reinforced underground shelter & artillery bastion' },
            { id: 'poi-station', name: 'Train Depot Basin', x: 620, y: 430, type: 'industrial', elevation: 95, desc: 'Logistical rail terminal and warehouse basin' },
            { id: 'poi-alpha', name: 'Outpost Ridge Alpha', x: 1650, y: 1620, type: 'recon', elevation: 395, desc: 'Eastern flank vantage point overlooking valley' },
            { id: 'poi-bridge', name: 'Canyon Viaduct', x: 1050, y: 680, type: 'bridge', elevation: 165, desc: 'High-speed armored vehicle crossing' }
        ],
        terrainProfile: {
            roughness: 1.35,
            ridgeStrength: 1.6,
            valleyFloor: 0.18,
            primaryAxis: [0.707, 0.707] // Diagonal mountain ridge
        }
    },
    ozeti: {
        id: 'ozeti',
        name: 'Ozeti',
        region: 'Transcaucasian Foothills',
        subtitle: 'Rolling Valley, Stepped Terraces & River Crossing',
        description: 'Expansive rolling plateaus, agricultural hamlets, broad riverbed chokepoints, and isolated monasteries.',
        gridSize: 2000,
        cellSize: 100,
        minElevation: 40,
        maxElevation: 330,
        defaultObserver: { x: 1550, y: 1480, stance: 'standing' }, // Monastery Hill
        defaultTarget: { x: 1000, y: 980 },                       // River Bridge
        pois: [
            { id: 'poi-monastery', name: 'Monastery Hill', x: 1550, y: 1480, type: 'recon', elevation: 320, desc: 'Domineering southeastern hill overlooking the river' },
            { id: 'poi-bridge', name: 'River Bridge Crossing', x: 1000, y: 980, type: 'bridge', elevation: 48, desc: 'Primary bridge between northern and southern zones' },
            { id: 'poi-silos', name: 'Grain Silos Complex', x: 520, y: 780, type: 'industrial', elevation: 76, desc: 'Western industrial cover with tall climbable roofs' },
            { id: 'poi-radar', name: 'Radar Plateau', x: 450, y: 1620, type: 'recon', elevation: 295, desc: 'Northwestern radar station with wide 270° viewshed' },
            { id: 'poi-village', name: 'Lower Ozeti Hamlet', x: 1240, y: 410, type: 'settlement', elevation: 62, desc: 'Dense cluster of stone residential compounds' }
        ],
        terrainProfile: {
            roughness: 0.95,
            ridgeStrength: 1.0,
            valleyFloor: 0.25,
            primaryAxis: [0.0, 1.0] // North-South river valley
        }
    },
    zestafona: {
        id: 'zestafona',
        name: 'Zestafona',
        region: 'Industrial Basin',
        subtitle: 'Heavy Metallurgical Basin & Escarpment Walls',
        description: 'Dense smokestacks, sprawling factory shop floors, railway classification yards, enclosed by sheer cliffs.',
        gridSize: 2000,
        cellSize: 100,
        minElevation: 50,
        maxElevation: 395,
        defaultObserver: { x: 1480, y: 1750, stance: 'standing' }, // North Cliffs
        defaultTarget: { x: 850, y: 720 },                        // Rail Yard
        pois: [
            { id: 'poi-cliffs', name: 'Northern Escarpment', x: 1480, y: 1750, type: 'recon', elevation: 385, desc: 'Sheer vertical rock wall offering full-map vantage' },
            { id: 'poi-smelter', name: 'Smelter Stack 01', x: 1120, y: 1240, type: 'industrial', elevation: 210, desc: 'Central cooling towers and elevated pipe trestles' },
            { id: 'poi-railyard', name: 'Marshalling Yard', x: 850, y: 720, type: 'industrial', elevation: 58, desc: 'Sunken train depot with hundreds of freight cars' },
            { id: 'poi-substation', name: 'High-Voltage Yard', x: 1390, y: 460, type: 'industrial', elevation: 115, desc: 'Transformer grid and defensive perimeter berm' },
            { id: 'poi-westcliffs', name: 'West Ridge Bunkers', x: 380, y: 1150, type: 'fortification', elevation: 330, desc: 'Old military emplacements cut into limestone' }
        ],
        terrainProfile: {
            roughness: 1.15,
            ridgeStrength: 1.4,
            valleyFloor: 0.35,
            primaryAxis: [1.0, 0.0] // East-West industrial valley
        }
    }
};

export const STANCE_PRESETS = {
    prone: { id: 'prone', label: 'Prone (0.35m)', height: 0.35, icon: '🪖' },
    crouch: { id: 'crouch', label: 'Crouched (1.05m)', height: 1.05, icon: '🛡️' },
    standing: { id: 'standing', label: 'Standing (1.75m)', height: 1.75, icon: '🧍' },
    vehicle: { id: 'vehicle', label: 'Vehicle Roof / Turret (3.2m)', height: 3.20, icon: '🚙' },
    tower: { id: 'tower', label: 'Watchtower / Crane (14.0m)', height: 14.0, icon: '🗼' },
    drone: { id: 'drone', label: 'Tactical Recon Drone (45.0m)', height: 45.0, icon: '🛸' }
};

export const WEAPON_CONFIGS = {
    l81: {
        id: 'l81',
        name: 'L81 81mm Mortar',
        category: 'mortar',
        caliber: '81mm HE / Smoke',
        minRange: 350,
        maxRange: 1800,
        muzzleVelocity: 185, // m/s
        minMil: 800,
        maxMil: 1550,
        defaultMil: 1200,
        arcModes: ['high'],
        blastRadius: 28,
        description: 'Man-portable 81mm high-angle indirect fire mortar. Ideal for plunging rounds behind steep cliffs.'
    },
    sph2: {
        id: 'sph2',
        name: 'SPH-2 155mm Howitzer',
        category: 'artillery',
        caliber: '155mm Heavy Artillery',
        minRange: 750,
        maxRange: 3800,
        muzzleVelocity: 340, // m/s
        minMil: 270,
        maxMil: 1330,
        defaultMil: 820,
        arcModes: ['low', 'high'],
        blastRadius: 45,
        description: 'Self-propelled 155mm howitzer with dual firing solutions (low-arc direct trajectory and high-arc plunging).'
    },
    sniper: {
        id: 'sniper',
        name: 'AWM-338 Precision Rifle',
        category: 'recon',
        caliber: '.338 Lapua Magnum',
        minRange: 50,
        maxRange: 1800,
        muzzleVelocity: 915, // m/s
        zeroingSteps: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500],
        description: 'Extreme-range bolt action precision rifle. Requires exact zeroing and target lead calculation.'
    },
    airdefense: {
        id: 'airdefense',
        name: 'Tor-M2 / Skyguard ПВО',
        category: 'airdefense',
        caliber: 'Radar SAM & 35mm Twin Cannon',
        searchRadius: 2500,
        engagementRadius: 2000,
        minAltitudeFloor: 25,
        maxCeiling: 2200,
        description: 'All-weather tactical air defense complex. Scans 360° airspace for transport helicopters, jets, and drones.'
    }
};

export const TACTICAL_GRID = {
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W'],
    subdivisions: 10
};
