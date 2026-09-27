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
        gridSize: 1200,
        sizeM: 1200,
        cellSize: 100,
        minElevation: -22,
        maxElevation: 77,
        texturePath: 'assets/textures/bakurani_sat.jpg',
        defaultObserver: { x: 350, y: 800, stance: 'standing' },
        defaultTarget: { x: 573, y: 510 },
        pois: [
            { id: 'poi-chuta', name: 'Станция Chuta', x: 200, y: 550, type: 'settlement', elevation: 25, desc: 'Западный железнодорожный тупик' },
            { id: 'poi-baghi', name: 'Узел Baghi', x: 600, y: 950, type: 'industrial', elevation: 42, desc: 'Центральный сортировочный узел' },
            { id: 'poi-khevuli', name: 'Карьер Khevuli', x: 1000, y: 620, type: 'recon', elevation: 65, desc: 'Восточные командные высоты' }
        ],
        terrainProfile: { roughness: 1.35, ridgeStrength: 1.6, valleyFloor: 0.18, ridgeAngle: 0.78 },
        controlZone: { name: 'ЗОНА КОНТРОЛЯ // BAKURANI', id: 'bakurani-default', x: 573, y: 510, siteX: -26.8, siteZ: -90.4, radiusM: 500, color: '#f2f4ee' }
    },
    ozeti: {
        id: 'ozeti',
        name: 'Ozeti',
        region: 'Transcaucasian Foothills',
        subtitle: 'Rolling Valley, Stepped Terraces & River Crossing',
        description: 'Expansive rolling plateaus, agricultural hamlets, broad riverbed chokepoints, and isolated monasteries.',
        gridSize: 1400,
        sizeM: 1400,
        cellSize: 100,
        minElevation: -48,
        maxElevation: 37,
        texturePath: 'assets/textures/ozeti_sat.jpg',
        defaultObserver: { x: 1050, y: 980, stance: 'standing' },
        defaultTarget: { x: 666, y: 684 },
        pois: [
            { id: 'poi-malaga', name: 'Посёлок Malaga', x: 380, y: 450, type: 'settlement', elevation: 18, desc: 'Северная жилая терраса' },
            { id: 'poi-bridge', name: 'Мост через реку', x: 666, y: 684, type: 'bridge', elevation: -15, desc: 'Центральный мостовой переход' },
            { id: 'poi-barcelona', name: 'Высота Barcelona', x: 1150, y: 650, type: 'recon', elevation: 28, desc: 'Восточный скальный гребень' },
            { id: 'poi-hanover', name: 'Промзона Hanover', x: 620, y: 950, type: 'industrial', elevation: 12, desc: 'Южный складской комплекс' }
        ],
        terrainProfile: { roughness: 0.95, ridgeStrength: 1.0, valleyFloor: 0.25, ridgeAngle: 1.57 },
        controlZone: { name: 'ЗОНА КОНТРОЛЯ // OZETI', id: 'ozeti-default', x: 666, y: 684, siteX: -33.8, siteZ: -16.3, radiusM: 550, color: '#f2f4ee' }
    },
    zestafona: {
        id: 'zestafona',
        name: 'Zestafona',
        region: 'Industrial Basin',
        subtitle: 'Heavy Metallurgical Basin & Escarpment Walls',
        description: 'Dense smokestacks, sprawling factory shop floors, railway classification yards, enclosed by sheer cliffs.',
        gridSize: 1000,
        sizeM: 1000,
        cellSize: 100,
        minElevation: -18,
        maxElevation: 15,
        texturePath: 'assets/textures/zestafona_sat.jpg',
        defaultObserver: { x: 780, y: 820, stance: 'standing' },
        defaultTarget: { x: 509, y: 509 },
        pois: [
            { id: 'poi-smelter', name: 'Металлургический цех', x: 509, y: 509, type: 'industrial', elevation: 5, desc: 'Центральный плавильный цех' },
            { id: 'poi-water', name: 'Водоочистная станция', x: 440, y: 780, type: 'industrial', elevation: -8, desc: 'Северный гидротехнический узел' },
            { id: 'poi-houses', name: 'Рабочий посёлок', x: 340, y: 420, type: 'settlement', elevation: -2, desc: 'Западный жилой сектор' }
        ],
        terrainProfile: { roughness: 1.15, ridgeStrength: 1.4, valleyFloor: 0.35, ridgeAngle: 0.0 },
        controlZone: { name: 'ЗОНА КОНТРОЛЯ // ZESTAFONA', id: 'zestafona-default', x: 509, y: 509, siteX: 9.2, siteZ: 9.3, radiusM: 500, color: '#f2f4ee' }
    }
};

/* Observer Stance & Optical Eye Heights */
export const STANCE_PRESETS = {
    prone: { id: 'prone', label: 'Лёжа (0.35м)', height: 0.35, icon: '🪖' },
    crouch: { id: 'crouch', label: 'Сидя (1.05м)', height: 1.05, icon: '🛡️' },
    standing: { id: 'standing', label: 'Стоя (1.75м)', height: 1.75, icon: '🧍' },
    vehicle: { id: 'vehicle', label: 'Техника / Люк (3.2м)', height: 3.20, icon: '🚙' },
    tower: { id: 'tower', label: 'Вышка / Кран (14м)', height: 14.0, icon: '🗼' },
    drone: { id: 'drone', label: 'Развед-дрон (45м)', height: 45.0, icon: '🛸' }
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
