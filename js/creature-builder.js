import { render, Component } from 'preact';
import { html } from "htm/preact";
import { createCreatureTemplate, createDiceRoll, creatureSizeLabels } from './dm-data.js';

class CreatureBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = createCreatureTemplate();
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  addListItem = (listName) => {
    this.setState({ [listName]: [...this.state[listName], ''] });
  }
  handleListItemChange = (listName, index, e) => {
    const { value } = e.target;
    const list = [...this.state[listName]];
    list[index] = value;
    this.setState({ [listName]: list });
  }

  addLabeledValueListItem = (listName) => {
    this.setState({ [listName]: [...this.state[listName], { name: '', value: 0 }] });
  }
  handleObjectListItemChange = (listName, index, e) => {
    const { name, value } = e.target;
    const list = [...this.state[listName]];
    list[index][name] = value;
    this.setState({ [listName]: list });
  }

  addStrike = () => {
    this.setState({ strikes: [...this.state.strikes, { name: '', cost: 1, value: 2 }] });
  }
  addSkill = () => {
    this.setState({ skills: [...this.state.skills, { name: '', value: 2 }] });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    console.log('Creature data:', this.state);
    // const student = {
    //   firstName: this.state.firstName,
    //   lastName: this.state.lastName,
    //   idNumber: this.state.idNumber,
    //   classes: this.state.classes
    // };
    // this.setCookie('studentData', JSON.stringify(student), 7);
    // console.log('Student data saved to cookie:', student);
  };

  // setCookie = (name, value, days) => {
  //   const date = new Date();
  //   date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  //   const expires = "expires=" + date.toUTCString();
  //   document.cookie = name + "=" + value + ";" + expires + ";path=/";
  // };


  textInput = (name, label) => {
    return html`
      <div>
        <label>
          ${label}:
          <input type="text" name=${name} value=${this.state[name]} onInput=${this.handleChange} />
        </label>
      </div>
    `;
  }

  numberInput = (name, label, min, max) => {
    return html`
      <div>
        <label>
          ${label}:
          <input type="number" name=${name} min=${min} max=${max} value=${this.state[name]} onInput=${this.handleChange} />
        </label>
      </div>
    `;
  }

  selectListInput = (name, label, valueLavels) => {
    return html`
      <div>
        <label>
          ${label}:
          <select name=${name} value=${this.state[name]} onChange=${this.handleChange}>
            ${valueLavels.map((value, index) => html`<option value=${index}>${value}</option>`)}
          </select>
        </label>
      </div>      
    `;
  }

  statWithRange = (name, label, hasExtreme, hasTerrible) => {
    return this.selectListInput(name, label, [
      ...(hasExtreme ? ['Extreme'] : []),
      'High',
      'Moderate',
      'Low',
      ...(hasTerrible ? ['Terrible'] : [])
    ]);
  }

  stringListInput = (name, label) => {
    return html`
      <div>
        <label>${label}:</label>
        ${this.state[name].map((item, index) => html`
          <div key=${index}>
            <input
              type="text"
              value=${item}
              onInput=${(e) => this.handleListItemChange(name, index, e)}
            />
          </div>
        `)}
        <button type="button" onClick=${() => this.addListItem(name)}>Add ${label}</button>
      </div>
    `;
  }

  objectListInput = (name, label, definition, addListItem) => {
    return html`
      <div>
        <label>${label}:</label>
        ${this.state[name].map((item, index) => html`
          <div key=${index}>
            ${Object.keys(definition).map((key) => html`
              <input
                name=${key}
                type=${definition[key]}
                value=${item[key]}
                onInput=${(e) => this.handleObjectListItemChange(name, index, e)}
              />
            `)}
          </div>
        `)}
        <button type="button" onClick=${() => addListItem(name)}>Add ${label}</button>
      </div>
    `;
  }

  render() {
    return html`
      <form onSubmit=${this.handleSubmit}>
        <div>
          <h3>Basics:</h3>
            ${this.textInput('name', 'Name')}
            ${this.numberInput('level', 'Level', -1, 24)}
            ${this.selectListInput('size', 'Size', creatureSizeLabels)}
            ${this.stringListInput('traits', 'Traits')}
        </div>
        <div>
          <h3>Attribute Modifiers:</h3>
            ${this.statWithRange('str', 'Strength', true, false)}
            ${this.statWithRange('dex', 'Dexterity', true, false)}
            ${this.statWithRange('con', 'Constitution', true, false)}
            ${this.statWithRange('int', 'Intelligence', true, false)}
            ${this.statWithRange('wis', 'Wisdom', true, false)}
            ${this.statWithRange('cha', 'Charisma', true, false)}
        </div>
        <div>
          <h3>Perception and Senses:</h3>
            ${this.statWithRange('per', 'Perception', true, true)}
            ${this.stringListInput('senses', 'Senses')}
        </div>
        <div>
          <h3>Languages and Skills:</h3>
            ${this.stringListInput('languages', 'Languages')}
            
            ${this.objectListInput('skills', 'Skills', {
              
            }, this.addSkill)}
        </div>
        <div>
          <h3>Items:</h3>
            ${this.stringListInput('items', 'Items')}
        </div>
        <div>
          <h3>Defenses and Saves:</h3>
            ${this.statWithRange('ac', 'Armor Class', true, false)}
            ${this.statWithRange('fort', 'Fortitude', true, false)}
            ${this.statWithRange('ref', 'Reflex', true, false)}
            ${this.statWithRange('will', 'Will', true, false)}
            ${this.statWithRange('hp', 'Hit Points', true, false)}
        </div>
        <div>
          <h3>Immunities, Weaknesses, and Resistances:</h3>
            ${this.stringListInput('immunities', 'Immunities')}
            ${this.objectListInput('resistances', 'Resistances', { name: 'text', value: 'number' }, this.addLabeledValueListItem)}
            ${this.objectListInput('weaknesses', 'Weaknesses', { name: 'text', value: 'number' }, this.addLabeledValueListItem)}
        </div>


          
        <button type="submit">Submit</button>
      </form>
    `;
  }
}

render(html`<${CreatureBuilder} />`, document.body);
