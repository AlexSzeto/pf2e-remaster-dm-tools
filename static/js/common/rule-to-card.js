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

export const pathbuilderToCard = (pathbuilderJson) => {
  const build = pathbuilderJson.build
  const abilities = build.abilities
  const profs = build.proficiencies

  const abilityMods = {}
  for (const [key, val] of Object.entries(abilities)) {
    if (typeof val === 'number') {
      abilityMods[key] = Math.floor(val / 2 - 5)
    }
  }

  const abilityNames = {
    str: 'Str',
    dex: 'Dex',
    con: 'Con',
    int: 'Int',
    wis: 'Wis',
    cha: 'Cha',
  }

  const skillToAbility = {
    acrobatics: 'dex',
    arcana: 'int',
    athletics: 'str',
    crafting: 'int',
    deception: 'cha',
    diplomacy: 'cha',
    intimidation: 'cha',
    medicine: 'wis',
    nature: 'wis',
    occultism: 'int',
    performance: 'cha',
    religion: 'wis',
    society: 'int',
    stealth: 'dex',
    survival: 'wis',
    thievery: 'dex',
  }

  const stats = []

  // Perception
  stats.push({
    name: 'Perception',
    text: `+${profs.perception + abilityMods.wis * 2}; ${
      build.specials.includes('Darkvision') ? 'darkvision' : ''
    }`.trim(),
  })

  // Languages
  stats.push({
    name: 'Languages',
    newline: true,
    text:
      'Common, ' +
      (build.languages || []).filter((l) => l != 'None Selected').join(', '),
  })

  // Skills
  const skills = []
  for (const [skill, mod] of Object.entries(profs)) {
    if (skill in skillToAbility) {
      const ability = skillToAbility[skill]
      const total = mod + (abilityMods[ability] || 0) * 2
      if(mod > 0) {
        skills.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} +${total}`)
      }
    }
  }

  // Lore skills
  const lores = (build.lores || []).map(([name, prof]) => {
    const loreMod = prof + (abilityMods.int || 0)
    return `Lore: ${name} +${loreMod}`
  })

  stats.push({
    name: 'Skills',
    newline: true,
    text: [...skills, ...lores].join(', '),
  })

  // Ability modifiers
  for (const [abbr, mod] of Object.entries(abilityMods)) {
    stats.push({
      name: abilityNames[abbr],
      text: `+${mod}`,
      ...(abbr === 'str' && { newline: true }),
    })
  }

  // Items
  const weapons = build.weapons.map((w) => w.display)
  const armors = build.armor.map((a) => a.display)
  stats.push({
    name: 'Items',
    newline: true,
    text: [...armors, ...weapons].join(', '),
  })

  // AC
  stats.push({
    hr: true,
    name: 'AC',
    text: `${build.acTotal.acTotal}`,
  })

  // Saves
  const saveMap = {
    Fort: 'fortitude',
    Ref: 'reflex',
    Will: 'will',
  }
  const saveAbilityMap = {
    fortitude: 'con',
    reflex: 'dex',
    will: 'wis',
  }
  for (const [label, key] of Object.entries(saveMap)) {
    const ability = saveAbilityMap[key]
    const total = profs[key] + (abilityMods[ability] || 0) * 2
    stats.push({
      name: label,
      text: `+${total}`,
    })
  }

  // HP
  const hp =
    build.attributes.ancestryhp +
    build.attributes.bonushp +
    build.level *
      (build.attributes.classhp +
        abilityMods.con +
        build.attributes.bonushpPerLevel)
  stats.push({
    name: 'HP',
    newline: true,
    text: `${hp}`,
  })

  // Feats
  build.feats.forEach(([name]) => {
    stats.push({
      name,
      newline: true,
      text: '',
    })
  })

  // Speed
  const speed = build.attributes.speed + build.attributes.speedBonus
  stats.push({
    hr: true,
    name: 'Speed',
    text: `${speed}`,
  })

  // Melee
  build.weapons.forEach((w) => {
    stats.push({
      action: 'single',
      name: 'Melee',
      newline: true,
      text: `${w.display} +${w.attack} ${w.die}+${w.damageBonus} ${w.damageType}`,
    })
  })

  return {
    name: build.name,
    stats,
    traits: [build.sizeName, build.ancestry],
    type: `${build.class} ${build.level}`,
  }
}
