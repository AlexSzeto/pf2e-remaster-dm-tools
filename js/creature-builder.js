import { render, Component } from "preact";
import { html } from "htm/preact";
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
} from "./dm-data.js";

const dice = (data) => `${data.count}d${data.sides}${
  data.bonus > 0 
    ? `+${data.bonus}`
    : data.bonus < 0
    ? data.bonus
    : ""
}`;

class CreatureRoadMaps extends Component {
  constructor(props) {
    super(props);
    this.state = { roadmap: 0 };
  }

  changeRoadMap = (e) => {
    this.setState({ roadmap: e.target.value });
    this.reroll();
  };

  reroll = () => {
    const roadmap = creatureRoadMaps[this.state.roadmap];
    const creature = {
      ...createCreatureTemplate(),
      ...Object.keys(roadmap).reduce((stats, key) => {
        const value = roadmap[key];
        switch (key) {
          case "name":            
          case "strikes":
            return { ...stats, [key]: value };
          case "skills":
            return { ...stats, [key]: value.map(skill => ({
              name: skill.name instanceof Array
                ? skill.name[rollBetween(0, skill.name.length - 1)]
                : skill.name,
              value: skill.value[rollBetween(0, skill.value.length - 1)]
            })) };
          default:
            return { ...stats, [key]: value[rollBetween(0, value.length - 1)] };
        }
      }, {}),
    };

    this.props.onUpdate(creature);
  };

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
        <button onClick=${this.reroll}>Reroll</button>
      </div>
    `;
  }
}

class CreatureFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = props.data ?? createCreatureTemplate();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState(this.props.data);
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleListItemChange = (listName, index, e) => {
    const { value } = e.target;
    const list = [...this.state[listName]];
    list[index] = value;
    this.setState({ [listName]: list });
  };

  handleObjectListItemChange = (listName, index, e) => {
    const { name, value } = e.target;
    const list = [...this.state[listName]];
    list[index][name] = value;
    this.setState({ [listName]: list });
  };

  addListItem(listName, factory) {
    this.setState({ [listName]: [...this.state[listName], factory()] });
  }

  labelWrap = (label, content) => html`
    <div>
      <label> ${label}: ${content} </label>
    </div>
  `;
  listItemWrap = (content) => html` <div>${content}</div> `;
  inlineWrap = (prefix, content) => html` ${prefix} ${content} `;

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
    );

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
    );

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
    );

  selectListInput = (name, label, itemLabels) =>
    this.labelWrap(
      label,
      html`
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
        <button type="button" onClick=${() => this.addListItem(name, () => "")}>
          Add ${label}
        </button>        
      `
    );

  stringListInput = (name, label) =>
    this.labelWrap(
      label,
      html`
        ${this.state[name].map((item, index) =>
          this.listItemWrap(html`
            <input
              type="text"
              value=${item}
              onInput=${(e) => this.handleListItemChange(name, index, e)}
            />
          `)
        )}
        <button type="button" onClick=${() => this.addListItem(name, () => "")}>
          Add ${label}
        </button>
      `
    );

  objectListInput = (name, label, definition, objectFactory) =>
    this.labelWrap(
      label,
      html`
        ${this.state[name].map((item, index) =>
          this.listItemWrap(html`
            ${Object.keys(definition).map((key) => {
              const { prefix, type, options } = definition[key];
              switch (type) {
                case "text":
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
                      );
                case "number":
                  const { min, max } = definition[key];
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
                  );
                case "select":
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
                  );
              }
            })}
          `)
        )}
        <button
          type="button"
          onClick=${() => this.addListItem(name, objectFactory)}
        >
          Add ${label}
        </button>
      `
    );

  render() { return html``; }
}

class CreatureBuilder extends CreatureFormComponent {
  statWithRange = (name, label, hasExtreme, hasTerrible) =>
    this.selectNumberInput(name, label, [
      ...(hasExtreme ? ["Extreme"] : []),
      "High",
      "Moderate",
      "Low",
      ...(hasTerrible ? ["Terrible"] : []),
    ]);
  
  statValue = (value, table) =>
    table.find((row) => row[0] === parseInt(this.state.level))[1 + value];
  stat = (name, table) =>
    table.find((row) => row[0] === parseInt(this.state.level))[
      1 + parseInt(this.state[name])
    ];

  rollValue = (value, table) => {
    const row = table.find((row) => row[0] === parseInt(this.state.level));
    const max = row[1 + value * 2];
    const min = row[1 + value * 2 + 1];
    return rollBetween(min, max);
  };
  roll = (name, table) => this.rollValue(this.state[name], table);

  mapWeaknessResistance = (name) => ({
    name,
    value: this.rollValue(0, creatureResistancesAndWeaknesses),
  });

  rerollCreature = (e) => {
    e.preventDefault();
    const output = {
      ...this.state,

      str: this.stat("str", creatureAttributeModifierScales),
      dex: this.stat("dex", creatureAttributeModifierScales),
      con: this.stat("con", creatureAttributeModifierScales),
      int: this.stat("int", creatureAttributeModifierScales),
      wis: this.stat("wis", creatureAttributeModifierScales),
      cha: this.stat("cha", creatureAttributeModifierScales),

      per: this.stat("per", creaturePerception),

      skills: this.state.skills.map((skill) => ({
        name: skill.name,
        value: this.rollValue(skill.value, creatureSkills),
      })),
      ac: this.stat("ac", creatureAC),

      fort: this.stat("fort", creatureSavingThrows),
      ref: this.stat("ref", creatureSavingThrows),
      will: this.stat("will", creatureSavingThrows),

      hp: this.roll("hp", creatureHitPoints),

      weaknesses: this.state.weaknesses.map(this.mapWeaknessResistance),
      resistances: this.state.resistances.map(this.mapWeaknessResistance),

      strikes: this.state.strikes.map((strike) => ({
        ...strike,
        bonus: this.statValue(strike.bonus, creatureAttackBonuses),
        damage: {
          count: this.statValue(strike.damage, creatureStrikeCount),
          sides: this.statValue(strike.damage, creatureStrikeSides),
          bonus: this.statValue(strike.damage, creatureStrikeBonuses),
        },
      })),
    };
    console.log(output);
    this.props.onUpdate(output);
  };

  render() {
    return html`
      <form onSubmit=${this.handleSubmit}>
        <div>
          <h3>Basics:</h3>
          ${this.numberInput("level", "Level", -1, 24)}
          ${this.selectNumberInput("size", "Size", creatureSizeLabels)}
          ${this.stringListInput("traits", "Traits")}
        </div>
        <div>
          <h3>Attribute Modifiers:</h3>
          ${this.statWithRange("str", "Strength", true, false)}
          ${this.statWithRange("dex", "Dexterity", true, false)}
          ${this.statWithRange("con", "Constitution", true, false)}
          ${this.statWithRange("int", "Intelligence", true, false)}
          ${this.statWithRange("wis", "Wisdom", true, false)}
          ${this.statWithRange("cha", "Charisma", true, false)}
        </div>
        <div>
          <h3>Perception and Senses:</h3>
          ${this.statWithRange("per", "Perception", true, true)}
        </div>
        <div>
          <h3>Languages and Skills:</h3>
          ${this.objectListInput(
            "skills",
            "Skills",
            {
              name: { prefix: "", type: "text", options: creatureSkillsList },
              value: {
                prefix: ": ",
                type: "select",
                options: creatureSkillsLabels,
              },
            },
            createSkillTemplate
          )}
        </div>
        <div>
          <h3>Defenses and Saves:</h3>
          ${this.statWithRange("ac", "Armor Class", true, false)}
          ${this.statWithRange("fort", "Fortitude", true, true)}
          ${this.statWithRange("ref", "Reflex", true, true)}
          ${this.statWithRange("will", "Will", true, true)}
          ${this.statWithRange("hp", "Hit Points", false, false)}
        </div>
        <div>
          <h3>Immunities, Weaknesses, and Resistances:</h3>
          ${this.selectListInput("immunities", "Immunities", creatureDamageTypes)}
          ${this.selectListInput("resistances", "Resistances", creatureDamageTypes)}
          ${this.selectListInput("weaknesses", "Weaknesses", creatureDamageTypes)}
        </div>

        <div>
          <h3>Abilities:</h3>
          ${this.objectListInput(
            "strikes",
            "Strikes",
            {
              name: { prefix: "", type: "text" },
              cost: { prefix: "Actions: ", type: "number", min: 0, max: 3 },
              bonus: {
                prefix: "Attack Bonus: ",
                type: "select",
                options: creatureAttackBonusesLabels,
              },
              damage: {
                prefix: "Damage: ",
                type: "select",
                options: creatureStrikeDamageLabels,
              },
              type: {
                prefix: " ",
                type: "text",
                options: creatureDamageTypesShort,
              },
            },
            createStrikeTemplate
          )}
        </div>

        <button onClick=${this.rerollCreature}>Reroll</button>
      </form>
    `;
  }
}

class CreatureEditor extends CreatureFormComponent {

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onUpdate(this.state);
  };

  render() {
    return html`
      <form onSubmit=${this.handleSubmit}>
        <div>
          <h3>Basics:</h3>
          ${this.textInput("name", "Name")}
          ${this.numberInput("level", "Level", -1, 24)}
          ${this.textInput("size", "Size")}
          ${this.stringListInput("traits", "Traits")}
          ${this.numberInput("speed", "Speed", 0, 120)}
        </div>
        <div>
          <h3>Attribute Modifiers:</h3>
          ${this.numberInput("str", "Strength", -100, 100)}
          ${this.numberInput("dex", "Dexterity", -100, 100)}
          ${this.numberInput("con", "Constitution", -100, 100)}
          ${this.numberInput("int", "Intelligence", -100, 100)}
          ${this.numberInput("wis", "Wisdom", -100, 100)}
          ${this.numberInput("cha", "Charisma", -100, 100)}
        </div>
        <div>
          <h3>Perception and Senses:</h3>
          ${this.numberInput("per", "Perception", -100, 100)}
          ${this.stringListInput("senses", "Senses")}
        </div>
        <div>
          <h3>Languages and Skills:</h3>
          ${this.stringListInput("languages", "Languages")}
          ${this.objectListInput(
            "skills",
            "Skills",
            {
              name: { prefix: "", type: "text" },
              value: { prefix: ": ", type: "number", min: -100, max: 100 }
            },
            createSkillOutput
          )}
        </div>
        <div>
          <h3>Items:</h3>
          ${this.stringListInput("items", "Items")}
        </div>
        <div>
          <h3>Defenses and Saves:</h3>
          ${this.numberInput("ac", "Armor Class", -100, 100)}
          ${this.numberInput("fort", "Fortitude", -100, 100)}
          ${this.numberInput("ref", "Reflex", -100, 100)}
          ${this.numberInput("will", "Will", -100, 100)}
          ${this.numberInput("hp", "Hit Points", 0, 100000)}
        </div>
        <div>
          <h3>Immunities, Weaknesses, and Resistances:</h3>
          ${this.stringListInput("immunities", "Immunities")}
          ${this.objectListInput(
            "resistances",
            "Resistances",
            {
              name: { prefix: "", type: "text" },
              value: { prefix: " ", type: "number", min: -100, max: 100 }
            },
            createWeaknessResistOutput
          )}
          ${this.objectListInput(
            "weaknesses",
            "Weaknesses",
            {
              name: { prefix: "", type: "text" },
              value: { prefix: " ", type: "number", min: -100, max: 100 }
            },
            createWeaknessResistOutput
          )}
        </div>

        <div>
          <h3>Abilities:</h3>
          ${this.objectListInput(
            "strikes",
            "Strikes",
            {
              name: { prefix: "", type: "text" },
              cost: { prefix: "Actions: ", type: "number", min: 0, max: 3 },
              bonus: { prefix: "Attack Bonus: ", type: "number", min: -1000, max: 1000 },
              damage: {prefix: "Damage: ", type: "text" },
              type: { prefix: " ", type: "text" },
            },
            createStrikeTemplate
          )}
        </div>
        <button type="submit">Submit</button>
      </form>
    `;
  }
}

class CreaturePreview extends Component {
  constructor(props) {
    super(props);
  }

  labelWrap = (label, content) => html`
    <div>
      <span>${label}:</span>
      <span>${content}</span>
    </div>
  `;

  textStat = (name, label) =>
    this.labelWrap(label, html` ${this.props.data[name]} `);
  adjustStat = (name, label) =>
    this.labelWrap(
      label,
      html`
        ${this.props.data[name] >= 0
          ? `+${this.props.data[name]}`
          : this.props.data[name]}
      `
    );
  lookupStat = (name, label, table) =>
    this.labelWrap(label, html` ${table[this.props.data[name]]} `);
  listStat = (name, label, render) =>
    this.labelWrap(
      label,
      html`
        <ul>
          ${this.props.data[name].map((item) => html`<li>${render(item)}</li>`)}
        </ul>
      `
    );

  render() {
    return !!this.props.data ? html`
      <div>
        <h3>Preview:</h3>
        ${this.textStat("name", "Name")}
        ${this.textStat("level", "Level")}
        ${this.lookupStat("size", "Size", creatureSizeLabels)}
        ${this.listStat("traits", "Traits", (item) => item)}
        ${this.adjustStat("str", "Strength")}
        ${this.adjustStat("dex", "Dexterity")}
        ${this.adjustStat("con", "Constitution")}
        ${this.adjustStat("int", "Intelligence")}
        ${this.adjustStat("wis", "Wisdom")}
        ${this.adjustStat("cha", "Charisma")}
        ${this.adjustStat("per", "Perception")}
        ${this.listStat("senses", "Senses", (item) => item)}
        ${this.listStat("languages", "Languages", (item) => item)}
        ${this.listStat(
          "skills",
          "Skills",
          (item) => `${item.name}: ${item.value}`
        )}
        ${this.listStat("items", "Items", (item) => item)}
        ${this.adjustStat("ac", "AC")} ${this.adjustStat("fort", "Fortitude")}
        ${this.adjustStat("ref", "Reflex")} ${this.adjustStat("will", "Will")}
        ${this.textStat("hp", "HP")}
        ${this.listStat("immunities", "Immunities", (item) => item)}
        ${this.listStat(
          "resistances",
          "Resistances",
          (item) => `${item.name} ${item.value}`
        )}
        ${this.listStat(
          "weaknesses",
          "Weaknesses",
          (item) => `${item.name} ${item.value}`
        )}
        ${this.textStat("speed", "Speed")}
        ${this.listStat("strikes", "Strikes", (item) => `[${item.cost}] ${item.name} +${item.bonus} ${dice(item.damage)} ${item.type}`)}
      </div>
    ` : html`<div>No data</div>`;
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      data: [ null, null, null, null ],
    };
  }

  setData(step, data) {
    const next = [...this.state.data];
    next[step] = data;
    this.setState({ data: next });
  }

  render() {
    return html`
      ${
        this.state.step === 0
        && html`<${CreatureRoadMaps} onUpdate=${(data) => this.setData(1, data)} />`
      }
      ${
        this.state.step === 1
        && html`<${CreatureBuilder} data=${this.state.data[1]} onUpdate=${(data) => this.setData(2, data)} />`
      }
      ${
        this.state.step === 2
        && html`<${CreatureEditor} data=${this.state.data[2]} onUpdate=${(data) => this.setData(3, data)} />`
      }
      ${
        this.state.step === 3
        && html`<${CreaturePreview} data=${this.state.data[3]} />`
      }
      ${ 
        this.state.step > 0
        && html`<button onClick=${() => this.setState({ step: this.state.step - 1 })}>Back</button>`
      }

      ${
        this.state.step < 3
        && html`<button onClick=${() => this.setState({ step: this.state.step + 1 })}>Forward</button>`
      }
    `;
  }
}

render(html`<${App} />`, document.body);
