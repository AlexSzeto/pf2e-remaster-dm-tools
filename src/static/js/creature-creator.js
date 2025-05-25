import { render, Component } from 'preact'
import { html } from 'htm/preact'
import {
  createCreatureTemplate,
  rollBetween,
  createSkillTemplate,
  creatureSizeLabels,
  creatureAttributeModifierScales,
  creaturePerception,
  creatureAC,
  creatureSavingThrows,
  creatureHitPoints,
  creatureSkillsLabels,
  creatureSkillsList,
  createStrikeTemplate,
  creatureAttackBonuses,
  creatureAttackBonusesLabels,
  creatureStrikeDamageLabels,
  creatureStrikeCount,
  creatureStrikeBonuses,
  creatureStrikeSides,
  creatureRoadMaps,
  creatureDamageTypesShort,
  creatureSkills,
  creatureResistancesAndWeaknesses,
  creatureDamageTypes,
  createSkillOutput,
  createWeaknessResistOutput,
  actionCostLabels,
  createAbilityTemplate,
  actionCostIcons,
  creatureSpellDCs,
  creatureSpellDCsLabels,
  creatureSpellLevelLabels,
  createSpellTemplate,
} from './common/dm-data.js'
import { Card } from './components/card.js'
import { campaignMedia, getCookie } from './common/util.js'

const dice = (data) =>
  `${data.count}d${data.sides}${
    data.bonus > 0 ? `+${data.bonus}` : data.bonus < 0 ? data.bonus : ''
  }`

const bonusText = (data) => `${data > 0 ? '+' : ''}${data}`

class CreatureRoadMaps extends Component {
  constructor(props) {
    super(props)
    this.state = { roadmap: 0 }
  }

  changeRoadMap = (e) => {
    const roadmap = e.target.value
    this.setState({ roadmap })
    this.props.onUpdate(roadmap)
  }

  render() {
    return html`
      <div>
        <select
          name="roadmap"
          value=${this.state.roadmap}
          onChange=${this.changeRoadMap}
        >
          ${creatureRoadMaps.map(
            (roadmap, index) =>
              html`<option value=${index}>${roadmap.name}</option>`
          )}
        </select>
      </div>
    `
  }
}

class CreatureFormComponent extends Component {
  constructor(props) {
    super(props)
    this.state = props.data ?? createCreatureTemplate()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState(this.props.data)
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target
    this.setState({ [name]: value })
    this.updateCreature()
  }

  handleListItemChange = (listName, index, e) => {
    const { value } = e.target
    const list = [...this.state[listName]]
    list[index] = value
    this.setState({ [listName]: list })
    this.updateCreature()
  }

  handleObjectListItemChange = (listName, index, e) => {
    const { name, value } = e.target
    const list = [...this.state[listName]]
    list[index][name] = value
    this.setState({ [listName]: list })
    this.updateCreature()
  }

  updateCreature = () => {
    requestAnimationFrame(() => this.props.onUpdate(this.state))
  }

  addListItem(listName, factory) {
    this.setState({ [listName]: [...this.state[listName], factory()] })
  }

  labelWrap = (label, content) => html`
    <div>
      <label><span class="label-text">${label}: </span>${content} </label>
    </div>
  `
  listItemWrap = (content) => html` <div>${content}</div> `
  inlineWrap = (prefix, content) => html` ${prefix} ${content} `

  textInput = (name, label) =>
    this.labelWrap(
      label,
      html`
        <input
          type="text"
          name=${name}
          value=${this.state[name]}
          onInput=${this.handleChange}
        />
      `
    )

  numberInput = (name, label, min, max) =>
    this.labelWrap(
      label,
      html`
        <input
          type="number"
          name=${name}
          min=${min}
          max=${max}
          value=${this.state[name]}
          onInput=${this.handleChange}
        />
      `
    )

  selectNumberInput = (name, label, itemLabels) =>
    this.labelWrap(
      label,
      html`
        <select
          name=${name}
          value=${this.state[name]}
          onChange=${this.handleChange}
        >
          ${itemLabels.map(
            (value, index) => html`<option value=${index}>${value}</option>`
          )}
        </select>
      `
    )

  selectListInput = (name, label, itemLabels) =>
    this.labelWrap(
      label,
      html`
        <button
          type="button"
          onClick=${() => this.addListItem(name, () => itemLabels[0])}
        >
          Add ${label}
        </button>
        <div class="item-list">
          ${this.state[name].map((item, index) =>
            this.listItemWrap(html`
              <select
                name=${name}
                value=${item}
                onChange=${(e) => this.handleListItemChange(name, index, e)}
              >
                ${itemLabels.map(
                  (value) => html`<option value=${value}>${value}</option>`
                )}
              </select>
            `)
          )}
        </div>
      `
    )

  stringListInput = (name, label) =>
    this.labelWrap(
      label,
      html`
        <button type="button" onClick=${() => this.addListItem(name, () => '')}>
          Add ${label}
        </button>
        <div class="item-list">
          ${this.state[name].map((item, index) =>
            this.listItemWrap(html`
              <input
                type="text"
                value=${item}
                onInput=${(e) => this.handleListItemChange(name, index, e)}
              />
            `)
          )}
        </div>
      `
    )

  objectListInput = (name, label, definition, objectFactory) =>
    this.labelWrap(
      label,
      html`
        <button
          type="button"
          onClick=${() => this.addListItem(name, objectFactory)}
        >
          Add ${label}
        </button>
        <div class="item-list">
          ${this.state[name].map((item, index) =>
            this.listItemWrap(html`
              ${Object.keys(definition).map((key) => {
                const { prefix, type, options } = definition[key]
                switch (type) {
                  case 'text':
                    return !!options
                      ? this.inlineWrap(
                          prefix,
                          html`
                            <select
                              name=${key}
                              value=${item[key]}
                              onChange=${(e) =>
                                this.handleObjectListItemChange(name, index, e)}
                            >
                              ${options.map(
                                (value, index) =>
                                  html`<option value=${value}>${value}</option>`
                              )}
                            </select>
                          `
                        )
                      : this.inlineWrap(
                          prefix,
                          html`
                            <input
                              type="text"
                              name=${key}
                              value=${item[key]}
                              onInput=${(e) =>
                                this.handleObjectListItemChange(name, index, e)}
                            />
                          `
                        )
                  case 'longtext':
                    return this.inlineWrap(
                      prefix,
                      html`
                        <textarea
                          name=${key}
                          value=${item[key]}
                          onInput=${(e) =>
                            this.handleObjectListItemChange(name, index, e)}
                        />
                      `
                    )
                  case 'number':
                    const { min, max } = definition[key]
                    return this.inlineWrap(
                      prefix,
                      html`
                        <input
                          type="number"
                          name=${key}
                          value=${item[key]}
                          min=${min}
                          max=${max}
                          onInput=${(e) =>
                            this.handleObjectListItemChange(name, index, e)}
                        />
                      `
                    )
                  case 'select':
                    return this.inlineWrap(
                      prefix,
                      html`
                        <select
                          name=${key}
                          value=${item[key]}
                          onChange=${(e) =>
                            this.handleObjectListItemChange(name, index, e)}
                        >
                          ${options.map(
                            (value, index) =>
                              html`<option value=${index}>${value}</option>`
                          )}
                        </select>
                      `
                    )
                }
              })}
            `)
          )}
        </div>
      `
    )

  render() {
    return html``
  }
}

class CreatureBuilder extends CreatureFormComponent {
  statWithRange = (name, label, hasExtreme, hasTerrible) =>
    this.selectNumberInput(name, label, [
      ...(hasExtreme ? ['Extreme'] : []),
      'High',
      'Moderate',
      'Low',
      ...(hasTerrible ? ['Terrible'] : []),
    ])

  render() {
    return html`
      <form onSubmit=${this.handleSubmit}>
        <div>
          <h3>Basics:</h3>
          ${this.numberInput('level', 'Level', -1, 24)}
          ${this.selectNumberInput('size', 'Size', creatureSizeLabels)}
        </div>
        <div>
          <h3>Perception and Senses:</h3>
          ${this.statWithRange('per', 'Perception', true, true)}
        </div>
        <div>
          <h3>Attribute Modifiers:</h3>
          <div class="two-column">
            ${this.statWithRange('str', 'Strength', true, false)}
            ${this.statWithRange('dex', 'Dexterity', true, false)}
            ${this.statWithRange('con', 'Constitution', true, false)}
            ${this.statWithRange('int', 'Intelligence', true, false)}
            ${this.statWithRange('wis', 'Wisdom', true, false)}
            ${this.statWithRange('cha', 'Charisma', true, false)}
          </div>
        </div>
        <div>
          <h3>Skills:</h3>
          ${this.objectListInput(
            'skills',
            'Skills',
            {
              name: { prefix: '', type: 'text', options: creatureSkillsList },
              value: {
                prefix: ': ',
                type: 'select',
                options: creatureSkillsLabels,
              },
            },
            createSkillTemplate
          )}
        </div>
        <div>
          <h3>Defenses and Saves:</h3>
          <div class="column">
            ${this.statWithRange('ac', 'Armor Class', true, false)}
            ${this.statWithRange('hp', 'Hit Points', false, false)}
          </div>
          <div class="column">
            ${this.statWithRange('fort', 'Fortitude', true, true)}
            ${this.statWithRange('ref', 'Reflex', true, true)}
            ${this.statWithRange('will', 'Will', true, true)}
          </div>
        </div>
        <div>
          <h3>Immunities, Weaknesses, and Resistances:</h3>
          ${this.selectListInput(
            'immunities',
            'Immunities',
            creatureDamageTypes
          )}
          ${this.selectListInput(
            'resistances',
            'Resistances',
            creatureDamageTypes
          )}
          ${this.selectListInput(
            'weaknesses',
            'Weaknesses',
            creatureDamageTypes
          )}
        </div>
        <div>
          <h3>Abilities:</h3>
          ${this.objectListInput(
            'strikes',
            'Strikes',
            {
              name: { prefix: '', type: 'text' },
              actions: {
                prefix: 'Actions: ',
                type: 'select',
                options: actionCostLabels,
              },
              description: { prefix: ' ', type: 'text' },
              bonus: {
                prefix: 'Attack Bonus: ',
                type: 'select',
                options: creatureAttackBonusesLabels,
              },
              damage: {
                prefix: 'Damage: ',
                type: 'select',
                options: creatureStrikeDamageLabels,
              },
              type: {
                prefix: ' ',
                type: 'text',
                options: creatureDamageTypesShort,
              },
            },
            createStrikeTemplate
          )}
          ${this.selectNumberInput(
            'spellDC',
            'Spell DC',
            creatureSpellDCsLabels
          )}
        </div>
      </form>
    `
  }
}

class CreatureEditor extends CreatureFormComponent {
  handleSubmit = (e) => {
    e.preventDefault()
    this.props.onUpdate(this.state)
  }

  render() {
    return html`
      <form onSubmit=${this.handleSubmit}>
        <div>
          <h3>Basics:</h3>
          <div class="column">
            ${this.textInput('name', 'Name')} ${this.textInput('type', 'Type')}
            ${this.numberInput('level', 'Level', -1, 24)}
          </div>
        </div>
        <div>
          <h3>Traits:</h3>
          ${this.selectNumberInput('size', 'Size', creatureSizeLabels)}
          ${this.stringListInput('traits', 'Traits')}
        </div>
        <div>
          <h3>Perception and Senses:</h3>
          ${this.numberInput('per', 'Perception', -100, 100)}
          ${this.stringListInput('senses', 'Senses')}
        </div>
        <div>
          <h3>Languages and Skills:</h3>
          ${this.stringListInput('languages', 'Languages')}
          ${this.objectListInput(
            'skills',
            'Skills',
            {
              name: { prefix: '', type: 'text' },
              value: { prefix: ': ', type: 'number', min: -100, max: 100 },
            },
            createSkillOutput
          )}
        </div>
        <div>
          <h3>Attribute Modifiers:</h3>
          <div class="two-column">
            ${this.numberInput('str', 'Strength', -100, 100)}
            ${this.numberInput('dex', 'Dexterity', -100, 100)}
            ${this.numberInput('con', 'Constitution', -100, 100)}
            ${this.numberInput('int', 'Intelligence', -100, 100)}
            ${this.numberInput('wis', 'Wisdom', -100, 100)}
            ${this.numberInput('cha', 'Charisma', -100, 100)}
          </div>
        </div>
        <div>
          <h3>Items:</h3>
          ${this.stringListInput('items', 'Items')}
        </div>
        <div>
          <h3>Defenses and Saves:</h3>
          <div class="column">
            ${this.numberInput('ac', 'Armor Class', -100, 100)}
            ${this.numberInput('fort', 'Fortitude', -100, 100)}
            ${this.numberInput('ref', 'Reflex', -100, 100)}
            ${this.numberInput('will', 'Will', -100, 100)}
            ${this.numberInput('hp', 'Hit Points', 0, 100000)}
          </div>
        </div>
        <div>
          <h3>Immunities, Weaknesses, and Resistances:</h3>
          ${this.stringListInput('immunities', 'Immunities')}
          ${this.objectListInput(
            'resistances',
            'Resistances',
            {
              name: { prefix: '', type: 'text' },
              value: { prefix: ' ', type: 'number', min: -100, max: 100 },
            },
            createWeaknessResistOutput
          )}
          ${this.objectListInput(
            'weaknesses',
            'Weaknesses',
            {
              name: { prefix: '', type: 'text' },
              value: { prefix: ' ', type: 'number', min: -100, max: 100 },
            },
            createWeaknessResistOutput
          )}
        </div>

        <div>
          <h3>Abilities:</h3>
          ${this.numberInput('speed', 'Speed', 0, 1000)}
          ${this.objectListInput(
            'strikes',
            'Strikes',
            {
              name: { prefix: '', type: 'text' },
              actions: {
                prefix: 'Actions: ',
                type: 'select',
                options: actionCostLabels,
              },
              description: { prefix: ' ', type: 'text' },
              bonus: {
                prefix: 'Attack Bonus: ',
                type: 'number',
                min: -1000,
                max: 1000,
              },
              damage: { prefix: 'Damage: ', type: 'text' },
              type: { prefix: ' ', type: 'text' },
            },
            createStrikeTemplate
          )}
          ${this.objectListInput(
            'abilities',
            'Abilities',
            {
              name: { prefix: '', type: 'text' },
              type: {
                prefix: ' ',
                type: 'select',
                options: ['Innate', 'Combat'],
              },
              description: { prefix: ' ', type: 'longtext' },
            },
            createAbilityTemplate
          )}
          ${this.numberInput('spellDC', 'Spell DC', 0, 100)}
          ${this.objectListInput(
            'spells',
            'Spells',
            {
              level: {
                prefix: 'Level: ',
                type: 'select',
                options: creatureSpellLevelLabels,
              },
              text: { prefix: ' ', type: 'text' },
            },
            createSpellTemplate
          )}
        </div>
      </form>
    `
  }
}

class CreaturePreview extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const editorElement = document.getElementById('card-preview')

    const editor = ace.edit(editorElement)
    editor.setTheme('ace/theme/solarized_light')
    editor.session.setMode('ace/mode/json')

    const updateText = () => {
      try {
        const data = JSON.parse(editor.getValue())
        this.props.onUpdate(data)
      } catch (e) {}
    }
    editor.session.on('change', updateText)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState(this.props.data)
    }
  }

  copyToClipboard = () => {
    const copyText = document.getElementById('card-preview')
    navigator.clipboard.writeText(JSON.stringify(this.props.data))
  }

  saveCard = () => {
    try {
      const data = this.props.data
      fetch(`/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((response) => {
        if (response.ok) {
          console.log('Card saved')
        }
      })
    } catch (e) {
      console.error(e)
      return
    }
  }

  render() {
    return !!this.props.data
      ? html`
          <div>
            <h3>Preview:</h3>
            <div class="column">
              <div class="reference-card-frame">
                <${Card} data=${this.props.data} />
              </div>
              <div>
                <pre id="card-preview">
${JSON.stringify(this.props.data, null, 2)}</pre
                >
                <button onClick=${this.copyToClipboard}>
                  Copy to Clipboard
                </button>
                <button onClick=${this.saveCard}>Save Card</button>
              </div>
            </div>
          </div>
        `
      : html`<div>No data</div>`
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      step: 0,
      data: [null, null, null, null],
    }
  }

  setData(step, data) {
    const next = [...this.state.data]
    next[step] = data
    this.setState({ data: next })
  }

  createCreatureFromRoadmap = () => {
    const roadmap = creatureRoadMaps[this.state.data[0]]
    const creature = roadmap
      ? {
          ...createCreatureTemplate(),
          ...Object.keys(roadmap).reduce((stats, key) => {
            const value = roadmap[key]
            switch (key) {
              case 'name':
              case 'type':
              case 'strikes':
              case 'abilities':
              case 'spells':
                return { ...stats, [key]: value }
              case 'skills':
                return {
                  ...stats,
                  [key]: value.map((skill) => ({
                    name:
                      skill.name instanceof Array
                        ? skill.name[rollBetween(0, skill.name.length - 1)]
                        : skill.name,
                    value: skill.value[rollBetween(0, skill.value.length - 1)],
                  })),
                }
              default:
                return {
                  ...stats,
                  [key]: value[rollBetween(0, value.length - 1)],
                }
            }
          }, {}),
        }
      : createCreatureTemplate()
    this.setData(1, creature)
  }

  fillCreatureDetails = () => {
    const template = this.state.data[1]

    const statValue = (value, table) =>
      table.find((row) => row[0] === parseInt(template.level))[
        1 + parseInt(value)
      ]
    const stat = (name, table) =>
      table.find((row) => row[0] === parseInt(template.level))[
        1 + parseInt(template[name])
      ]
    const rollValue = (value, table) => {
      const row = table.find((row) => row[0] === parseInt(template.level))
      const max = row[1 + value * 2]
      const min = row[1 + value * 2 + 1]
      return rollBetween(min, max)
    }
    const roll = (name, table) => rollValue(template[name], table)
    const mapWeaknessResistance = (name) => ({
      name,
      value: rollValue(0, creatureResistancesAndWeaknesses),
    })

    const output = {
      ...template,

      type: 'Creature',

      str: stat('str', creatureAttributeModifierScales),
      dex: stat('dex', creatureAttributeModifierScales),
      con: stat('con', creatureAttributeModifierScales),
      int: stat('int', creatureAttributeModifierScales),
      wis: stat('wis', creatureAttributeModifierScales),
      cha: stat('cha', creatureAttributeModifierScales),

      per: stat('per', creaturePerception),

      skills: template.skills.map((skill) => ({
        name: skill.name,
        value: rollValue(skill.value, creatureSkills),
      })),
      ac: stat('ac', creatureAC),

      fort: stat('fort', creatureSavingThrows),
      ref: stat('ref', creatureSavingThrows),
      will: stat('will', creatureSavingThrows),

      hp: roll('hp', creatureHitPoints),

      weaknesses: template.weaknesses.map(mapWeaknessResistance),
      resistances: template.resistances.map(mapWeaknessResistance),

      strikes: template.strikes.map((strike) => ({
        ...strike,
        bonus: statValue(strike.bonus, creatureAttackBonuses),
        damage: `${statValue(strike.damage, creatureStrikeCount)}d${statValue(
          strike.damage,
          creatureStrikeSides
        )}${bonusText(statValue(strike.damage, creatureStrikeBonuses)).replace(
          '0',
          ''
        )}`,
      })),

      spellDC: stat('spellDC', creatureSpellDCs),
    }

    this.setData(2, output)
  }

  createCardFromCreatureData = () => {
    const creature = this.state.data[2]
    const card = {
      name: creature.name,
      type: `${creature.type} ${creature.level}`,
      traits: [creatureSizeLabels[creature.size], ...creature.traits],
      stats: [
        {
          name: 'Perception',
          text: `${bonusText(creature.per)}${
            creature.senses.length > 0 ? `; ${creature.senses.join(', ')}` : ''
          }`,
        },
        {
          name: 'Languages',
          text: creature.languages.join(', '),
          newline: true,
        },
        {
          name: 'Skills',
          text: creature.skills
            .map((skill) => `${skill.name} ${bonusText(skill.value)}`)
            .join(', '),
          newline: true,
        },
        {
          name: 'Str',
          text: `${bonusText(creature.str)}`,
          newline: true,
        },
        {
          name: 'Dex',
          text: `${bonusText(creature.dex)}`,
        },
        {
          name: 'Con',
          text: `${bonusText(creature.con)}`,
        },
        {
          name: 'Int',
          text: `${bonusText(creature.int)}`,
        },
        {
          name: 'Wis',
          text: `${bonusText(creature.wis)}`,
        },
        {
          name: 'Cha',
          text: `${bonusText(creature.cha)}`,
        },
        {
          name: 'Items',
          text: creature.items.join(', '),
          newline: true,
        },
        ...creature.abilities
          .filter((ability) => ability.type === 0)
          .map((ability) => ({
            name: ability.name,
            text: ability.description,
            newline: true,
          })),
        {
          name: 'AC',
          text: `${creature.ac}`,
          hr: true,
        },
        {
          name: 'Fort',
          text: `${bonusText(creature.fort)}`,
        },
        {
          name: 'Ref',
          text: `${bonusText(creature.ref)}`,
        },
        {
          name: 'Will',
          text: `${bonusText(creature.will)}`,
        },
        {
          name: 'HP',
          text: `${creature.hp}`,
          newline: true,
        },
        {
          name: 'Immunities',
          text: creature.immunities.join(', '),
        },
        {
          name: 'Resistances',
          text: creature.resistances
            .map((resistance) => `${resistance.name} ${resistance.value}`)
            .join(', '),
        },
        {
          name: 'Weaknesses',
          text: creature.weaknesses
            .map((weakness) => `${weakness.name} ${weakness.value}`)
            .join(', '),
        },
        {
          name: 'Speed',
          text: `${creature.speed}`,
          hr: true,
        },
        ...creature.strikes.map((strike) => ({
          name: strike.name,
          action: actionCostIcons[strike.actions],
          text: `${strike.description} ${bonusText(strike.bonus)} ${
            strike.damage
          } ${strike.type}`,
          newline: true,
        })),
        {
          name: 'Spells',
          text:
            creature.spells.length > 0
              ? `DC ${creature.spellDC}; ${creature.spells
                  .sort((a, b) => b.level - a.level)
                  .map(
                    (spell) =>
                      `**${creatureSpellLevelLabels[spell.level]}** ${
                        spell.text
                      }`
                  )
                  .join('; ')}`
              : '',
          newline: true,
        },
        ...creature.abilities
          .filter((ability) => ability.type === 1)
          .map((ability) => ({
            name: ability.name,
            text: ability.description,
            newline: true,
          })),
      ].filter((stat) => !!stat.text),
    }
    this.setData(3, card)
    document.cookie = `card=${JSON.stringify(card)}`
  }

  nextStep() {
    const step = this.state.step + 1
    this.setState({ step })
    switch (step) {
      case 1:
        this.createCreatureFromRoadmap()
        break
      case 2:
        this.fillCreatureDetails()
        break
      case 3:
        this.createCardFromCreatureData()
        break
    }
  }

  prevStep() {
    this.setState({ step: this.state.step - 1 })
  }

  render() {
    const nav = html`
      <div class="column">
        ${this.state.step > 0
          ? html`<button onClick=${() => this.prevStep()}>Back</button>`
          : html`<button disabled>Back</button>`}
        ${this.state.step < 3
          ? html`<button onClick=${() => this.nextStep()}>Next</button>`
          : html`<button disabled>Next</button>`}
      </div>
    `

    return html`
      <div class="creature-builder">
        <h1>Creature Builder</h1>
        ${this.state.step === 0 &&
        html`<h2>Select a Creature Roadmap</h2>
          <${CreatureRoadMaps} onUpdate=${(data) => this.setData(0, data)} />`}
        ${this.state.step === 1 &&
        html`<h2>Choose Stats Range</h2>
          <${CreatureBuilder}
            data=${this.state.data[1]}
            onUpdate=${(data) => this.setData(1, data)}
          />`}
        ${this.state.step === 2 &&
        html`<h2>Finalize Creature Design</h2>
          <${CreatureEditor}
            data=${this.state.data[2]}
            onUpdate=${(data) => this.setData(2, data)}
          />`}
        ${this.state.step === 3 &&
        html`<h2>Preview and Export</h2>
          <${CreaturePreview}
            data=${this.state.data[3]}
            onUpdate=${(data) => this.setData(3, data)}
          />`}
        ${nav}
      </div>
    `
  }
}

render(html`<${App} />`, document.querySelector('.page-content'))
