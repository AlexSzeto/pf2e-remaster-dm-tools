const formatDescription = (description) => {
  return description.replace(/@\w+\[(.*)\]/g, '<strong>$1</strong>')
}

export const spellToCard = (spellRulesJson) => {
  /**
   * Transforms the first JSON block into the second JSON block.
   *
   * @param {Object} inputJson - The input JSON as an object.
   * @returns {Object} The transformed JSON.
   */

  // Helper function to safely extract nested data
  function getNestedValue(path, defaultValue = '') {
    return path.reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : defaultValue),
      spellRulesJson
    )
  }

  // Extracting relevant data
  const name = getNestedValue(['name'])
  const level = getNestedValue(['system', 'level', 'value'])
  const traits = getNestedValue(['system', 'traits', 'value'], [])
  const description = getNestedValue(['system', 'description', 'value'])
  const traditions = getNestedValue(
    ['system', 'traits', 'traditions'],
    []
  ).join(', ')
  const rangeValue = getNestedValue(['system', 'range', 'value'])
  const areaType = getNestedValue(['system', 'area', 'type'])
  const areaValue = getNestedValue(['system', 'area', 'value'])
  const defenseStat = getNestedValue(['system', 'defense', 'save', 'statistic'])
  const defenseBasic = getNestedValue(
    ['system', 'defense', 'save', 'basic'],
    false
  )
    ? 'basic'
    : ''

  // Constructing the output JSON
  const transformedJson = {
    name: name,
    type: `spell ${level}`,
    traits: traits,
    stats: [
      {
        name: 'Traditions',
        text: traditions,
      },
      {
        name: 'Range',
        text: `${rangeValue}`,
        newline: true,
      },
      {
        name: 'Area',
        text: `${areaValue} ft ${areaType}`,
      },
      {
        name: 'Defense',
        text: `${defenseBasic} ${defenseStat}`,
        newline: true,
      },
      {
        name: 'Description',
        text: formatDescription(description),
        hr: true,
      },
    ],
  }

  return transformedJson
}

export const pathbuilderToCard = (inputData) => {
    const build = inputData.build;

    // Helper function to calculate ability bonus
    const calculateAbilityBonus = (abilityScore) => {
        return Math.floor(abilityScore / 2) - 5;
    };

    // Lookup table for proficiencies and their associated abilities
    // This is my best guess, you can adjust it as needed.
    const proficiencyAbilityMap = {
        'perception': 'wis',
        'fortitude': 'con',
        'reflex': 'dex',
        'will': 'wis',
        'acrobatics': 'dex',
        'arcana': 'int',
        'athletics': 'str',
        'crafting': 'int',
        'deception': 'cha',
        'diplomacy': 'cha',
        'intimidation': 'cha',
        'medicine': 'wis',
        'nature': 'wis',
        'occultism': 'int',
        'performance': 'cha',
        'religion': 'wis',
        'society': 'int',
        'stealth': 'dex',
        'survival': 'wis',
        'thievery': 'dex'
    };

    // --- Extracting and calculating data ---

    const name = build.name;
    const level = build.level;
    const className = build.class;

    // Abilities and their bonuses
    const abilities = build.abilities;
    const abilityBonuses = {};
    for (const abilityKey in abilities) {
        if (typeof abilities[abilityKey] === 'number') {
            abilityBonuses[abilityKey] = calculateAbilityBonus(abilities[abilityKey]);
        }
    }

    // Languages
    let languagesText = build.languages.includes("None selected") ? "" : build.languages.join(", ");
    // If 'Darkvision' is in specials, add it to perception text
    const perceptionBonus = build.proficiencies.perception + abilityBonuses.wis;
    const perceptionText = `${perceptionBonus >= 0 ? '+' : ''}${perceptionBonus}` +
                           (build.specials.includes("Darkvision") ? "; darkvision" : "");

    // Skills (proficiencies + ability bonus)
    const skills = [];
    for (const profKey in build.proficiencies) {
        if (proficiencyAbilityMap[profKey] && build.proficiencies[profKey] > 0) { // Only include if there's a proficiency value
            const abilityForProf = proficiencyAbilityMap[profKey];
            const skillTotal = build.proficiencies[profKey] + abilityBonuses[abilityForProf];
            skills.push(`${profKey.charAt(0).toUpperCase() + profKey.slice(1)} ${skillTotal >= 0 ? '+' : ''}${skillTotal}`);
        }
    }
    // Add lores
    build.lores.forEach(lore => {
        const loreName = lore[0];
        const loreValue = lore[1] + abilityBonuses.int; // Lores typically use Intelligence
        skills.push(`Lore: ${loreName} ${loreValue >= 0 ? '+' : ''}${loreValue}`);
    });
    skills.sort(); // Sort skills alphabetically

    // Items (Armor and Weapons)
    const items = [];
    build.armor.forEach(armor => items.push(armor.name));
    build.weapons.forEach(weapon => items.push(weapon.name));

    // Feats
    const feats = build.feats.map(feat => feat[0]);

    // AC, Fortitude, Reflex, Will, HP, Speed
    const acTotal = build.acTotal.acTotal;
    const fortitudeSave = build.proficiencies.fortitude + abilityBonuses.con;
    const reflexSave = build.proficiencies.reflex + abilityBonuses.dex;
    const willSave = build.proficiencies.will + abilityBonuses.wis;
    const totalHP = build.attributes.ancestryhp + (build.attributes.classhp * level) + (build.attributes.bonushpPerLevel * level) + build.attributes.bonushp + (abilityBonuses.con * level); // Simplified HP calculation
    const speed = build.attributes.speed + build.attributes.speedBonus;

    // Melee weapons
    const meleeWeapons = build.weapons.filter(weapon => weapon.attack !== null && weapon.attack !== undefined)
                                       .map(weapon => {
                                           let damageType = weapon.damageType;
                                           if (damageType === 'S') damageType = 'Slashing';
                                           if (damageType === 'P') damageType = 'Piercing';
                                           if (damageType === 'B') damageType = 'Bludgeoning';

                                           return `${weapon.name} ${weapon.attack >= 0 ? '+' : ''}${weapon.attack} ${weapon.die}+${weapon.damageBonus} ${damageType}`;
                                        });

    // --- Constructing the output JSON ---

    const output = {
        name: name,
        stats: [],
        traits: [build.sizeName, build.ancestry],
        type: `${className} ${level}`
    };

    // Add stats
    output.stats.push({ name: "Perception", text: perceptionText });
    if (languagesText) {
        output.stats.push({ name: "Languages", newline: true, text: languagesText });
    }
    if (skills.length > 0) {
        output.stats.push({ name: "Skills", newline: true, text: skills.join(", ") });
    }

    // Ability scores
    output.stats.push({ name: "Str", newline: true, text: `${abilityBonuses.str >= 0 ? '+' : ''}${abilityBonuses.str}` });
    output.stats.push({ name: "Dex", text: `${abilityBonuses.dex >= 0 ? '+' : ''}${abilityBonuses.dex}` });
    output.stats.push({ name: "Con", text: `${abilityBonuses.con >= 0 ? '+' : ''}${abilityBonuses.con}` });
    output.stats.push({ name: "Int", text: `${abilityBonuses.int >= 0 ? '+' : ''}${abilityBonuses.int}` });
    output.stats.push({ name: "Wis", text: `${abilityBonuses.wis >= 0 ? '+' : ''}${abilityBonuses.wis}` });
    output.stats.push({ name: "Cha", text: `${abilityBonuses.cha >= 0 ? '+' : ''}${abilityBonuses.cha}` });

    // Items
    if (items.length > 0) {
        output.stats.push({ name: "Items", newline: true, text: items.join(", ") });
    }

    // AC and Saves
    output.stats.push({ hr: true, name: "AC", text: `${acTotal}` });
    output.stats.push({ name: "Fort", text: `${fortitudeSave >= 0 ? '+' : ''}${fortitudeSave}` });
    output.stats.push({ name: "Ref", text: `${reflexSave >= 0 ? '+' : ''}${reflexSave}` });
    output.stats.push({ name: "Will", text: `${willSave >= 0 ? '+' : ''}${willSave}` });

    // HP
    output.stats.push({ name: "HP", newline: true, text: `${totalHP}` });

    // Feats
    feats.forEach(feat => {
        output.stats.push({ name: feat, newline: true, text: "" });
    });

    // Speed
    output.stats.push({ hr: true, name: "Speed", text: `${speed}` });

    // Melee attacks
    meleeWeapons.forEach(weaponText => {
        output.stats.push({ action: "single", name: "Melee", newline: true, text: weaponText });
    });

    return output;
}