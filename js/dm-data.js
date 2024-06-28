// DCs
export const rollBetween = (min, max) => parseInt(Math.random() * (max - min + 1) + min)

export const actionCostLabels = [
  "Non-Action",
  "Free",
  "Reaction",
  "Single",
  "Double",
  "Full Turn",
]

export const actionCostIcons = [
  undefined,
  "free",
  "reaction",
  "single",
  "double",
  "turn"
]

// untrained, trained, expert, master, legendary
export const simpleDC = [10, 15, 20, 30, 40];

// Format: level, DC
export const levelDC = [
  [0, 14],
  [1, 15],
  [2, 16],
  [3, 18],
  [4, 19],
  [5, 20],
  [6, 22],
  [7, 23],
  [8, 24],
  [9, 26],
  [10, 27],
  [11, 28],
  [12, 30],
  [13, 31],
  [14, 32],
  [15, 34],
  [16, 35],
  [17, 36],
  [18, 38],
  [19, 39],
  [20, 40],
  [21, 42],
  [22, 44],
  [23, 46],
  [24, 48],
  [25, 50],
];

// Format: level, DC
export const spellRankDC = [
  [1, 15],
  [2, 18],
  [3, 20],
  [4, 23],
  [5, 26],
  [6, 28],
  [7, 31],
  [8, 34],
  [9, 36],
  [10, 39],
];

export const difficultyAdjustmentsForDCLabels = [
  "Incredibly easy",
  "Very easy",
  "Easy",
  "Moderate",
  "Hard",
  "Very hard",
  "Incredibly hard",
];
export const difficultyAdjustmentsForDC = [-10, -5, -2, 0, 2, 5, 10];

export const rarityAdjustmentsForDCLabels = [
  "Common",
  "Uncommon",
  "Rare",
  "Unique",
];
export const rarityAdjustmentsForDC = [0, 2, 5, 10];

// Creature Creation

export const creatureSizeLabels = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
  "Colossal",
];
export const creatureAttributeModifierScalesLabels = [
  "Extreme",
  "High",
  "Moderate",
  "Low",
];
export const creatureAttributeModifierScales = [
  [-1, 5, 3, 2, 0],
  [0, 5, 3, 2, 0],
  [1, 5, 4, 3, 1],
  [2, 5, 4, 3, 1],
  [3, 5, 4, 3, 1],
  [4, 6, 5, 3, 2],
  [5, 6, 5, 4, 2],
  [6, 7, 5, 4, 2],
  [7, 7, 6, 4, 2],
  [8, 7, 6, 4, 3],
  [9, 7, 6, 4, 3],
  [10, 8, 7, 5, 3],
  [11, 8, 7, 5, 3],
  [12, 8, 7, 5, 4],
  [13, 9, 8, 5, 4],
  [14, 9, 8, 5, 4],
  [15, 9, 8, 6, 4],
  [16, 10, 9, 6, 5],
  [17, 10, 9, 6, 5],
  [18, 10, 9, 6, 5],
  [19, 11, 10, 6, 5],
  [20, 11, 10, 7, 6],
  [21, 11, 10, 7, 6],
  [22, 12, 10, 8, 6],
  [23, 12, 10, 8, 6],
  [24, 13, 12, 9, 7],
];

export const creaturePerceptionLabels = [
  "Extreme",
  "High",
  "Moderate",
  "Low",
  "Terrible",
];
export const creaturePerception = [
  [-1, 9, 8, 5, 2, 0],
  [0, 10, 9, 6, 3, 1],
  [1, 11, 10, 7, 4, 2],
  [2, 12, 11, 8, 5, 3],
  [3, 14, 12, 9, 6, 4],
  [4, 15, 14, 11, 8, 6],
  [5, 17, 15, 12, 9, 7],
  [6, 18, 17, 14, 11, 8],
  [7, 20, 18, 15, 12, 10],
  [8, 21, 19, 16, 13, 11],
  [9, 23, 21, 18, 15, 12],
  [10, 24, 22, 19, 16, 14],
  [11, 26, 24, 21, 18, 15],
  [12, 27, 25, 22, 19, 16],
  [13, 29, 26, 23, 20, 18],
  [14, 30, 28, 25, 22, 19],
  [15, 32, 29, 26, 23, 20],
  [16, 33, 30, 28, 25, 22],
  [17, 35, 32, 29, 26, 23],
  [18, 36, 33, 30, 27, 24],
  [19, 38, 35, 32, 29, 26],
  [20, 39, 36, 33, 30, 27],
  [21, 41, 38, 35, 32, 28],
  [22, 43, 39, 36, 33, 30],
  [23, 44, 40, 37, 34, 31],
  [24, 46, 42, 38, 36, 32],
];

export const creatureSkillsList = [
  "Acrobatics",
  "Arcana",
  "Athletics",
  "Crafting",
  "Deception",
  "Diplomacy",
  "Intimidation",
  "Lore",
  "Medicine",
  "Nature",
  "Occultism",
  "Performance",
  "Religion",
  "Society",
  "Stealth",
  "Survival",
  "Thievery",
  "Other",
]
// Format: level, extreme, high, moderate, low - max min
export const creatureSkillsLabels = ["Extreme", "High", "Moderate", "Low"];
export const creatureSkills = [
  [-1, 8, 8, 5, 5, 4, 4, 2, 1],
  [0, 9, 9, 6, 6, 5, 5, 3, 2],
  [1, 10, 10, 7, 7, 6, 6, 4, 3],
  [2, 11, 11, 8, 8, 7, 7, 5, 4],
  [3, 13, 13, 10, 10, 9, 9, 7, 5],
  [4, 15, 15, 12, 12, 10, 10, 8, 7],
  [5, 16, 16, 13, 13, 12, 12, 10, 8],
  [6, 18, 18, 15, 15, 13, 13, 11, 9],
  [7, 20, 20, 17, 17, 15, 15, 13, 11],
  [8, 21, 21, 18, 18, 16, 16, 14, 12],
  [9, 23, 23, 20, 20, 18, 18, 16, 13],
  [10, 25, 25, 22, 22, 19, 19, 17, 15],
  [11, 26, 26, 23, 23, 21, 21, 19, 16],
  [12, 28, 28, 25, 25, 22, 22, 20, 17],
  [13, 30, 30, 27, 27, 24, 24, 22, 19],
  [14, 31, 31, 28, 28, 25, 25, 23, 20],
  [15, 33, 33, 30, 30, 27, 27, 25, 21],
  [16, 35, 35, 32, 32, 28, 28, 26, 23],
  [17, 36, 36, 33, 33, 30, 30, 28, 24],
  [18, 38, 38, 35, 35, 31, 31, 29, 25],
  [19, 40, 40, 37, 37, 33, 33, 31, 27],
  [20, 41, 41, 38, 38, 34, 34, 32, 28],
  [21, 43, 43, 40, 40, 36, 36, 34, 29],
  [22, 45, 45, 42, 42, 37, 37, 35, 31],
  [23, 46, 46, 43, 43, 38, 38, 36, 32],
  [24, 48, 48, 45, 45, 40, 40, 38, 33],
];

export const creatureSafeItemLevels = [
  [-1, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 1],
  [5, 1],
  [6, 2],
  [7, 3],
  [8, 4],
  [9, 5],
  [10, 6],
  [11, 7],
  [12, 8],
  [13, 9],
  [14, 10],
  [15, 11],
  [16, 12],
  [17, 13],
  [18, 14],
  [19, 15],
  [20, 16],
  [21, 17],
  [22, 18],
  [23, 19],
  [24, 20],
];

export const creatureACLabels = ["Extreme", "High", "Moderate", "Low"];
export const creatureAC = [
  [-1, 18, 15, 14, 12],
  [0, 19, 16, 15, 13],
  [1, 19, 16, 15, 13],
  [2, 21, 18, 17, 15],
  [3, 22, 19, 18, 16],
  [4, 24, 21, 20, 18],
  [5, 25, 22, 21, 19],
  [6, 27, 24, 23, 21],
  [7, 28, 25, 24, 22],
  [8, 30, 27, 26, 24],
  [9, 31, 28, 27, 25],
  [10, 33, 30, 29, 27],
  [11, 34, 31, 30, 28],
  [12, 36, 33, 32, 30],
  [13, 37, 34, 33, 31],
  [14, 39, 36, 35, 33],
  [15, 40, 37, 36, 34],
  [16, 42, 39, 38, 36],
  [17, 43, 40, 39, 37],
  [18, 45, 42, 41, 39],
  [19, 46, 43, 42, 40],
  [20, 48, 45, 44, 42],
  [21, 49, 46, 45, 43],
  [22, 51, 48, 47, 45],
  [23, 52, 49, 48, 46],
  [24, 54, 51, 50, 48],
];

export const creatureSavingThrowsLabels = [
  "Extreme",
  "High",
  "Moderate",
  "Low",
  "Terrible",
];
export const creatureSavingThrows = [
  [-1, 9, 8, 5, 2, 0],
  [0, 10, 9, 6, 3, 1],
  [1, 11, 10, 7, 4, 2],
  [2, 12, 11, 8, 5, 3],
  [3, 14, 12, 9, 6, 4],
  [4, 15, 14, 11, 8, 6],
  [5, 17, 15, 12, 9, 7],
  [6, 18, 17, 14, 11, 8],
  [7, 20, 18, 15, 12, 10],
  [8, 21, 19, 16, 13, 11],
  [9, 23, 21, 18, 15, 12],
  [10, 24, 22, 19, 16, 14],
  [11, 26, 24, 21, 18, 15],
  [12, 27, 25, 22, 19, 16],
  [13, 29, 26, 23, 20, 18],
  [14, 30, 28, 25, 22, 19],
  [15, 32, 29, 26, 23, 20],
  [16, 33, 30, 28, 25, 22],
  [17, 35, 32, 29, 26, 23],
  [18, 36, 33, 30, 27, 24],
  [19, 38, 35, 32, 29, 26],
  [20, 39, 36, 33, 30, 27],
  [21, 41, 38, 35, 32, 28],
  [22, 43, 39, 36, 33, 30],
  [23, 44, 40, 37, 34, 31],
  [24, 46, 42, 38, 36, 32],
];

// Format: level, high, moderate, low - max min
export const creatureHitPointsLabels = ["High", "Moderate", "Low"];
export const creatureHitPoints = [
  [-1, 9, 9, 8, 7, 6, 5],
  [0, 20, 17, 16, 14, 13, 11],
  [1, 26, 24, 21, 19, 16, 14],
  [2, 40, 36, 32, 28, 25, 21],
  [3, 59, 53, 48, 42, 37, 31],
  [4, 78, 72, 63, 57, 48, 42],
  [5, 97, 91, 78, 72, 59, 53],
  [6, 123, 115, 99, 91, 75, 67],
  [7, 148, 140, 119, 111, 90, 82],
  [8, 173, 165, 139, 131, 105, 97],
  [9, 198, 190, 159, 151, 120, 112],
  [10, 223, 215, 179, 171, 135, 127],
  [11, 248, 240, 199, 191, 150, 142],
  [12, 273, 265, 219, 211, 165, 157],
  [13, 298, 290, 239, 231, 180, 172],
  [14, 323, 315, 259, 251, 195, 187],
  [15, 348, 340, 279, 271, 210, 202],
  [16, 373, 365, 299, 291, 225, 217],
  [17, 398, 390, 319, 311, 240, 232],
  [18, 423, 415, 339, 331, 255, 247],
  [19, 448, 440, 359, 351, 270, 262],
  [20, 473, 465, 379, 371, 285, 277],
  [21, 505, 495, 405, 395, 305, 295],
  [22, 544, 532, 436, 424, 329, 317],
  [23, 581, 569, 466, 454, 351, 339],
  [24, 633, 617, 508, 492, 383, 367],
];

// Format: level, maximum, minimum
export const creatureResistancesAndWeaknesses = [
  [-1, 1, 1],
  [0, 3, 1],
  [1, 3, 2],
  [2, 5, 2],
  [3, 6, 3],
  [4, 7, 4],
  [5, 8, 4],
  [6, 9, 5],
  [7, 10, 5],
  [8, 11, 6],
  [9, 12, 6],
  [10, 13, 7],
  [11, 14, 7],
  [12, 15, 8],
  [13, 16, 8],
  [14, 17, 9],
  [15, 18, 9],
  [16, 19, 9],
  [17, 19, 10],
  [18, 20, 10],
  [19, 21, 11],
  [20, 22, 11],
  [21, 23, 12],
  [22, 24, 12],
  [23, 25, 13],
  [24, 26, 13],
];

// Format: level, extreme, high, moderate, low
export const creatureAttackBonusesLabels = [
  "Extreme",
  "High",
  "Moderate",
  "Low",
];
export const creatureAttackBonuses = [
  [-1, 10, 8, 6, 4],
  [0, 10, 8, 6, 4],
  [1, 11, 9, 7, 5],
  [2, 13, 11, 9, 7],
  [3, 14, 12, 10, 8],
  [4, 16, 14, 12, 9],
  [5, 17, 15, 13, 11],
  [6, 19, 17, 15, 12],
  [7, 20, 18, 16, 13],
  [8, 22, 20, 18, 15],
  [9, 23, 21, 19, 16],
  [10, 25, 23, 21, 17],
  [11, 27, 24, 22, 19],
  [12, 28, 26, 24, 20],
  [13, 29, 27, 25, 21],
  [14, 31, 29, 27, 23],
  [15, 32, 30, 28, 24],
  [16, 34, 32, 30, 25],
  [17, 35, 33, 31, 27],
  [18, 37, 35, 33, 28],
  [19, 38, 36, 34, 29],
  [20, 40, 38, 36, 31],
  [21, 41, 39, 37, 32],
  [22, 43, 41, 39, 33],
  [23, 44, 42, 40, 35],
  [24, 46, 44, 42, 36],
];

// Format: level, then for each of extreme high moderate low:
//  roll count, dice face, bonus
export const creatureStrikeDamageLabels = [
  "Extreme",
  "High",
  "Moderate",
  "Low",
];
const creatureStrikeData = [
  [-1, 1, 6, 1, 1, 4, 1, 1, 4, 0, 1, 4, 0],
  [0, 1, 6, 3, 1, 6, 2, 1, 4, 2, 1, 4, 1],
  [1, 1, 8, 4, 1, 6, 3, 1, 6, 2, 1, 4, 2],
  [2, 1, 12, 4, 1, 10, 4, 1, 8, 4, 1, 6, 3],
  [3, 1, 12, 8, 1, 10, 6, 1, 8, 6, 1, 6, 5],
  [4, 2, 10, 7, 2, 8, 5, 2, 6, 5, 2, 4, 4],
  [5, 2, 12, 7, 2, 8, 7, 2, 6, 6, 2, 4, 6],
  [6, 2, 12, 10, 2, 8, 9, 2, 6, 8, 2, 4, 7],
  [7, 2, 12, 12, 2, 10, 9, 2, 8, 8, 2, 6, 6],
  [8, 2, 12, 15, 2, 10, 11, 2, 8, 9, 2, 6, 8],
  [9, 2, 12, 17, 2, 10, 13, 2, 8, 11, 2, 6, 9],
  [10, 2, 12, 20, 2, 12, 13, 2, 10, 11, 2, 6, 10],
  [11, 2, 12, 22, 2, 12, 15, 2, 10, 12, 2, 8, 10],
  [12, 3, 12, 19, 3, 10, 14, 3, 8, 12, 3, 6, 10],
  [13, 3, 12, 21, 3, 10, 16, 3, 8, 14, 3, 6, 11],
  [14, 3, 12, 24, 3, 10, 18, 3, 8, 15, 3, 6, 13],
  [15, 3, 12, 26, 3, 12, 17, 3, 10, 14, 3, 6, 14],
  [16, 3, 12, 29, 3, 12, 18, 3, 10, 15, 3, 6, 15],
  [17, 3, 12, 31, 3, 12, 19, 3, 10, 16, 3, 6, 16],
  [18, 3, 12, 34, 3, 12, 20, 3, 10, 17, 3, 6, 17],
  [19, 4, 12, 29, 4, 10, 20, 4, 8, 17, 4, 6, 14],
  [20, 4, 12, 32, 4, 10, 22, 4, 8, 19, 4, 6, 15],
  [21, 4, 12, 34, 4, 10, 24, 4, 8, 20, 4, 6, 17],
  [22, 4, 12, 37, 4, 10, 26, 4, 8, 22, 4, 6, 18],
  [23, 4, 12, 39, 4, 12, 24, 4, 10, 20, 4, 6, 19],
  [24, 4, 12, 42, 4, 12, 26, 4, 10, 22, 4, 6, 21],
];
export const creatureStrikeCount = creatureStrikeData.map(data => [
  data[0],
  data[1],
  data[4],
  data[7],
  data[10],
]);
export const creatureStrikeSides = creatureStrikeData.map(data => [
  data[0],
  data[2],
  data[5],
  data[8],
  data[11],
]);
export const creatureStrikeBonuses = creatureStrikeData.map(data => [
  data[0],
  data[3],
  data[6],
  data[9],
  data[12],
]);

export const creatureDamageTypesShort = ["B", "P", "S"];
export const creatureDamageTypes = [
  "Bludgeoning",
  "Piercing",
  "Slashing",
  "Acid",
  "Cold",
  "Electricity",
  "Fire",
  "Sonic",
  "Vitality",
  "Void",
  "Spirit",
  "Mental",
  "Poison",
  "Bleed",
  "Precision",
]

// Format: extreme DC, extreme modifier, high DC, high modifier, moderate DC, moderate modifier
export const creatureSpellDCsLabels = ["Extreme", "High", "Moderate"];
export const creatureSpellDCs = [
  [-1, 19, 11, 16, 8, 13, 5],
  [0, 19, 11, 16, 8, 13, 5],
  [1, 20, 12, 17, 9, 14, 6],
  [2, 22, 14, 18, 10, 15, 7],
  [3, 23, 15, 20, 12, 17, 9],
  [4, 25, 17, 21, 13, 18, 10],
  [5, 26, 18, 23, 14, 19, 11],
  [6, 27, 19, 24, 16, 21, 13],
  [7, 29, 21, 25, 17, 22, 14],
  [8, 30, 22, 26, 18, 23, 15],
  [9, 32, 24, 28, 20, 25, 17],
  [10, 33, 25, 29, 21, 26, 18],
  [11, 34, 26, 30, 22, 27, 19],
  [12, 36, 28, 32, 24, 29, 21],
  [13, 37, 29, 33, 25, 30, 22],
  [14, 39, 31, 34, 26, 31, 23],
  [15, 40, 32, 36, 28, 33, 25],
  [16, 41, 33, 37, 29, 34, 26],
  [17, 43, 35, 38, 30, 35, 27],
  [18, 44, 36, 40, 32, 37, 29],
  [19, 46, 38, 41, 33, 38, 30],
  [20, 47, 39, 42, 34, 39, 31],
  [21, 48, 40, 44, 36, 41, 33],
  [22, 50, 42, 45, 37, 42, 34],
  [23, 51, 43, 46, 38, 43, 35],
  [24, 52, 44, 48, 40, 45, 37],
];

export const createDiceRoll = () => ({
  count: 1,
  sides: 4,
  bonus: 0,
});

// For almost all stats: extreme-0, high-1, moderate-2, low-3
// Stats with terrible-4: per, 
// For health: high-0, moderate-1, low-2
export const creatureRoadMaps = [
  {
    name: "None",
  },
  {
    name: "Base - Brute",
    per: [3],
    str: [0, 1],
    con: [1, 2],
    dex: [3],
    int: [3],
    wis: [3],
    ac: [2, 3],
    fort: [1],
    ref: [2, 3],
    will: [2, 3],
    hp: [0],
    strikes: [
      { name: "Melee", actions: 1, bonus: 0, damage: 1, type: "B" },
    ]
  },
  {
    name: "Class - Cleric (Warpriest)",
    per: [2],
    skills: [
      { name: "Religion", value: [2] },
      { name: "Other", value: [1, 2] },
    ],
    str: [1],
    wis: [2],    
    ac: [3],
    ref: [3],
    will: [1],
  },
  {
    name: "Class - Fighter (Strength)",
    skills: [
      { name: ["Athletics", "Acrobatics"], value: [1] },
    ],
    str: [1],
    ac: [1],
    will: [3],
    strikes: [
      { name: "Melee", actions: 1, bonus: 1, damage: 1, type: "S" },
    ]
  },
  {
    name: "Class - Fighter (Dexterity)",
    skills: [
      { name: ["Athletics", "Acrobatics"], value: [1] },
    ],
    dex: [1],
    ac: [1],
    will: [3],
    strikes: [
      { name: "Ranged", actions: 1, bonus: 1, damage: 1, type: "P" },
    ]
  }
]
// Creature Template

export const createCreatureTemplate = () => ({
  name: "",
  level: -1,

  // tiny, small, medium, large, huge, gargantuan, colossal
  size: 2,
  // strings
  traits: [],

  // extreme, high, moderate, low
  str: 2,
  dex: 2,
  con: 2,
  int: 2,
  wis: 2,
  cha: 2,

  // extreme, high, moderate, low, terrible
  per: 2,
  // strings
  senses: [],
  // strings
  languages: [],

  // name, values (extreme, high, moderate, low)
  skills: [],

  // strings
  items: [],

  // extreme, high, moderate, low
  ac: 2,

  // extreme, high, moderate, low, terrible
  fort: 2,
  ref: 2,
  will: 2,

  // high, moderate, low
  hp: 1,

  // strings
  immunities: [],

  // roll values between max and min
  weaknesses: [],
  resistances: [],

  speed: 25,

  abilities: [],

  // action actions, name, bonus, damage, damage type
  strikes: [
    {
      name: "Strike",
      actions: 1,
      description: "",
      bonus: 2,
      damage: 2,
      type: "B",
    },
  ],

  spells: [],
});

export const createSkillTemplate = () => ({
  name: "Acrobatics",
  value: 2,
});

export const createWeaknessResistTemplate = () => ({
  name: "Bludgeoning",
  value: 0,
});

export const createAbilityTemplate = () => ({
  name: "Spells",
  type: 1,
  description: ""
});

export const createStrikeTemplate = () => ({
  name: "Melee",
  actions: 3,
  bonus: 2,
  damage: 2,
  type: "B",
  description: "",
});

export const createSkillOutput = () => ({
  name: "", value: 0
})

export const createWeaknessResistOutput = () => ({
  name: "", value: 0
})