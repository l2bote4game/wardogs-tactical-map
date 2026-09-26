/* ============================================================
   WARDOGS 3D TACTICAL MAP — AUTHENTIC GAME CONFIGURATION
   Official Game Maps: Bakurani, Ozeti, Zestafona
   Official Firing Tables: L81 Mortar, SPH-2 Howitzer
   Authentic WARDOGS Air Defense (Verba MANPADS, ZU-23-2) & Player Radii
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
        texturePath: 'assets/textures/bakurani_sat.jpg',
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
        terrainProfile: { roughness: 1.35, ridgeStrength: 1.6, valleyFloor: 0.18, ridgeAngle: 0.78 }
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
        texturePath: 'assets/textures/ozeti_sat.jpg',
        defaultObserver: { x: 1550, y: 1480, stance: 'standing' }, // Monastery Hill
        defaultTarget: { x: 1000, y: 980 },                       // River Bridge
        pois: [
            { id: 'poi-monastery', name: 'Monastery Hill', x: 1550, y: 1480, type: 'recon', elevation: 320, desc: 'Domineering southeastern hill overlooking the river' },
            { id: 'poi-bridge', name: 'River Bridge Crossing', x: 1000, y: 980, type: 'bridge', elevation: 48, desc: 'Primary bridge between northern and southern zones' },
            { id: 'poi-silos', name: 'Grain Silos Complex', x: 520, y: 780, type: 'industrial', elevation: 76, desc: 'Western industrial cover with tall climbable roofs' },
            { id: 'poi-radar', name: 'Radar Plateau', x: 450, y: 1620, type: 'recon', elevation: 295, desc: 'Northwestern radar station with wide 270° viewshed' },
            { id: 'poi-village', name: 'Lower Ozeti Hamlet', x: 1240, y: 410, type: 'settlement', elevation: 62, desc: 'Dense cluster of stone residential compounds' }
        ],
        terrainProfile: { roughness: 0.95, ridgeStrength: 1.0, valleyFloor: 0.25, ridgeAngle: 1.57 }
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
        texturePath: 'assets/textures/zestafona_sat.jpg',
        defaultObserver: { x: 1480, y: 1750, stance: 'standing' }, // North Cliffs
        defaultTarget: { x: 850, y: 720 },                        // Rail Yard
        pois: [
            { id: 'poi-cliffs', name: 'Northern Escarpment', x: 1480, y: 1750, type: 'recon', elevation: 385, desc: 'Sheer vertical rock wall offering full-map vantage' },
            { id: 'poi-smelter', name: 'Smelter Stack 01', x: 1120, y: 1240, type: 'industrial', elevation: 210, desc: 'Central cooling towers and elevated pipe trestles' },
            { id: 'poi-railyard', name: 'Marshalling Yard', x: 850, y: 720, type: 'industrial', elevation: 58, desc: 'Sunken train depot with hundreds of freight cars' },
            { id: 'poi-substation', name: 'High-Voltage Yard', x: 1390, y: 460, type: 'industrial', elevation: 115, desc: 'Transformer grid and defensive perimeter berm' },
            { id: 'poi-westcliffs', name: 'West Ridge Bunkers', x: 380, y: 1150, type: 'fortification', elevation: 330, desc: 'Old military emplacements cut into limestone' }
        ],
        terrainProfile: { roughness: 1.15, ridgeStrength: 1.4, valleyFloor: 0.35, ridgeAngle: 0.0 }
    }
};

/* Observer Stance & Optical Eye Heights */
export const STANCE_PRESETS = {
    prone: { id: 'prone', label: 'Prone (0.35m)', height: 0.35, icon: '🪖' },
    crouch: { id: 'crouch', label: 'Crouched (1.05m)', height: 1.05, icon: '🛡️' },
    standing: { id: 'standing', label: 'Standing (1.75m)', height: 1.75, icon: '🧍' },
    vehicle: { id: 'vehicle', label: 'Vehicle Roof / Turret (3.2m)', height: 3.20, icon: '🚙' },
    tower: { id: 'tower', label: 'Watchtower / Crane (14.0m)', height: 14.0, icon: '🗼' },
    drone: { id: 'drone', label: 'Tactical Recon Drone (45.0m)', height: 45.0, icon: '🛸' }
};

/* Player Combat & Threat Radii */
export const PLAYER_RADII = {
    cqb: { id: 'cqb', label: 'CQB / Shotguns / SMG (50m)', radius: 50, color: '#ef4444' },
    assault: { id: 'assault', label: 'Assault Rifle Combat Zone (AK74/M4) (300m)', radius: 300, color: '#f59e0b' },
    dmr: { id: 'dmr', label: 'DMR / LMG Range (600m)', radius: 600, color: '#eab308' },
    sniper: { id: 'sniper', label: 'Sniper Killzone (AWM/CheyTac) (1200m)', radius: 1200, color: '#00f2fe' },
    drawDistance: { id: 'drawDistance', label: 'Infantry Visual Draw Distance (1500m)', radius: 1500, color: '#64748b' }
};

/* Authentic WARDOGS Air Defense (ПВО) Equipment */
export const AIR_DEFENSE_SYSTEMS = {
    verba: {
        id: 'verba',
        name: '9K333 Verba MANPADS (ПЗРК «Верба»)',
        type: 'manpads',
        category: 'Infantry Anti-Air Launcher (Support Lv.16)',
        engagementRadius: 1200, // 1.2km lock range vs AH-6M Little Birds
        minLockAltitude: 15,
        maxCeiling: 1800,
        color: '#10b981',
        description: 'Shoulder-fired infrared homing missile. Locks onto AH-6M/AH-6R helicopters within 1200m. Requires direct Line of Sight.'
    },
    zu23: {
        id: 'zu23',
        name: 'FOB ZU-23-2 Anti-Air Autocannon (ЗУ-23-2 Зенитка)',
        type: 'autocannon',
        category: 'Base Stationary Twin 23mm Flak Battery',
        engagementRadius: 1500, // 1.5km protective bubble
        minLockAltitude: 5,
        maxCeiling: 2000,
        color: '#3b82f6',
        description: 'Twin-barrel 23mm rapid-fire autocannon placed at forward operating bases. Destroys low-altitude transport and scout helis.'
    },
    kodiak: {
        id: 'kodiak',
        name: 'Kodiak IFV 30mm Autocannon',
        type: 'mobile_aa',
        category: 'Armored Vehicle AA Turret',
        engagementRadius: 1000,
        minLockAltitude: 0,
        maxCeiling: 1200,
        color: '#f59e0b',
        description: 'Armored combat vehicle with high-elevation 30mm cannon capable of suppressing low-hovering helicopters.'
    }
};

/* Official WARDOGS Artillery Firing Tables */
export const OFFICIAL_WEAPON_TABLES = {
    mortar: {
        id: 'mortar',
        name: 'L81 Mortar (Миномёт)',
        minRange: 132,
        maxRange: 684,
        table: [
            [80, 950], [87, 940], [93, 930], [99, 920], [105, 910], [110, 900],
            [115, 890], [118, 880], [122, 870], [127, 860], [132, 850], [140, 840],
            [151, 830], [163, 820], [175, 810], [187, 800], [198, 790], [208, 780],
            [219, 770], [229, 760], [239, 750], [250, 740], [260, 730], [270, 720],
            [280, 710], [290, 700], [300, 690], [310, 680], [319, 670], [329, 660],
            [339, 650], [348, 640], [358, 630], [367, 620], [376, 610], [385, 600],
            [394, 590], [403, 580], [412, 570], [420, 560], [429, 550], [437, 540],
            [446, 530], [454, 520], [462, 510], [470, 500], [478, 490], [486, 480],
            [494, 470], [501, 460], [509, 450], [516, 440], [524, 430], [531, 420],
            [538, 410], [545, 400], [552, 390], [559, 380], [565, 370], [572, 360],
            [578, 350], [585, 340], [591, 330], [597, 320], [603, 310], [609, 300],
            [615, 290], [620, 280], [626, 270], [631, 260], [636, 250], [641, 240],
            [646, 230], [651, 220], [656, 210], [661, 200], [666, 190], [670, 180],
            [675, 170], [680, 160], [684, 150]
        ]
    },
    sph2: {
        id: 'sph2',
        name: 'SPH-2 155mm Howitzer (САУ)',
        minRange: 780,
        maxRange: 2629,
        lowArc: [
            [1181, 20], [1232, 30], [1283, 40], [1334, 50], [1384, 60], [1433, 70],
            [1482, 80], [1529, 90], [1576, 100], [1622, 110], [1666, 120], [1709, 130],
            [1751, 140], [1792, 150], [1832, 160], [1870, 170], [1907, 180], [1944, 190],
            [1979, 200], [2014, 210], [2046, 220], [2079, 230], [2110, 240], [2139, 250],
            [2168, 260], [2196, 270], [2223, 280], [2249, 290], [2273, 300], [2296, 310],
            [2319, 320], [2341, 330], [2362, 340], [2383, 350], [2403, 360], [2422, 370],
            [2439, 380], [2456, 390], [2471, 400], [2485, 410], [2499, 420], [2513, 430],
            [2526, 440], [2538, 450], [2550, 460], [2561, 470], [2570, 480], [2579, 490],
            [2586, 500], [2593, 510], [2599, 520], [2605, 530], [2610, 540], [2615, 550],
            [2620, 560], [2623, 570], [2626, 580], [2628, 590], [2629, 600]
        ],
        highArc: [
            [2629, 610], [2629, 620], [2628, 630], [2626, 640], [2624, 650], [2621, 660],
            [2617, 670], [2613, 680], [2609, 690], [2604, 700], [2599, 710], [2592, 720],
            [2584, 730], [2576, 740], [2567, 750], [2557, 760], [2546, 770], [2536, 780],
            [2524, 790], [2513, 800], [2501, 810], [2488, 820], [2474, 830], [2460, 840],
            [2444, 850], [2429, 860], [2412, 870], [2395, 880], [2378, 890], [2360, 900],
            [2342, 910], [2323, 920], [2303, 930], [2282, 940], [2261, 950], [2239, 960],
            [2217, 970], [2194, 980], [2171, 990], [2147, 1000], [2123, 1010], [2098, 1020],
            [2072, 1030], [2046, 1040], [2019, 1050], [1991, 1060], [1963, 1070], [1934, 1080],
            [1905, 1090], [1875, 1100], [1844, 1110], [1813, 1120], [1782, 1130], [1750, 1140],
            [1717, 1150], [1684, 1160], [1650, 1170], [1616, 1180], [1582, 1190], [1547, 1200],
            [1512, 1210], [1475, 1220], [1438, 1230], [1401, 1240], [1363, 1250], [1324, 1260],
            [1285, 1270], [1245, 1280], [1205, 1290], [1165, 1300], [1124, 1310], [1083, 1320],
            [1041, 1330], [999, 1340], [956, 1350], [913, 1360], [869, 1370], [825, 1380],
            [780, 1390], [735, 1400]
        ]
    }
};

export const TACTICAL_GRID = {
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W'],
    subdivisions: 10
};

export const WEAPON_CONFIGS = OFFICIAL_WEAPON_TABLES;
