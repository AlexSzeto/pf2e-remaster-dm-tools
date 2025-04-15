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
import { EditableSelect } from './inputs/editable-select.js'
import { EditableText } from './inputs/editable-text.js'
import { ExpandingTextList } from './inputs/expanding-list.js'

class CreatureCreator extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: createCreatureTemplate(),
      roadMap: '',
    }
  }

  data(id) {
    return this.state.data[id]
  }

  setData(id, value) {
    this.setState({
      data: {
        ...this.state.data,
        [id]: value,
      },
    })
  }

  render() {
    return html`
      <div class="creature-creator">
        <h2>
          Creating Creature:
          <${EditableSelect} 
            value=${this.state.roadMap}
            options=${creatureRoadMaps.map(template => template.name)} 
            onChange=${(roadMap) => { this.setState({ roadMap }) }}
          />
        </h2>
        <div class="basics-section">
          <${EditableText}
            value=${this.data('name')}
            onChange=${(name) => this.setData('name', name)}
          />
          <${EditableText}
          value=${this.data('type')}
            onChange=${(type) => this.setData('type', type)}
          />
          <${EditableSelect}
            value=${this.data('level').toString()}
            options=${[...Array(22).keys()].map(level => (level - 1).toString())}
            onChange=${(level) => this.setData('level', Number(level))}
          />
        </div>
        <div class="traits-section">
          <${EditableSelect}
            value=${creatureSizeLabels[this.data('size')]}
            options=${creatureSizeLabels}
            onChange=${(size) => this.setData('size', creatureSizeLabels.indexOf(size))}
          />
          <${ExpandingTextList}
            values=${this.data('traits')}
            onChange=${(traits) => this.setData('traits', traits)}
          />
        </div>
      </div>
    `
  }
}

render(html`<${CreatureCreator} />`, document.querySelector('.page-content'))
