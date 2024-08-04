import { Component } from "preact";
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { setCookie } from "./common.js";

export class InitiativeListItem {
  constructor(name, initiative = 0, hp = 0, consumables = [], notes = '') {
    this.name = name;
    this.initiative = initiative;
    this.hp = hp;
    this.notes = notes;
    this.consumables = consumables;
    this.isPC = false;
  }
}

export class InitiativeTracker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      active: 0,
      inUse: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState(this.props.data, () => setCookie('initiativeTracker', JSON.stringify(this.state)))
    }
  }
  
  handleListItemChange(index, e) {
    if(e.target.type === 'checkbox') {
      const newList = [...this.state.list];
      newList[index][e.target.name] = e.target.checked;
      this.updateList(newList);
    } else {
      const { name, value } = e.target;    
      if(name === 'initiative') {
        const newList = this.state.list.map((item, i) => ({
          ...item,
          initiative: this.state.list[index].name === item.name ? value : item.initiative
        }))
        this.updateList(newList);
      } else {
        const newList = [...this.state.list];
        newList[index][name] = value;
        this.updateList(newList);
      }
    }
  }

  setActive(index) {
    this.setState({ active: index }, () => this.updateCookie());
  }

  sortList() {
    const newList = [...this.state.list];
    newList.sort((a, b) => b.initiative - a.initiative);
    this.updateList(newList);
  }

  addListItem() {
    const newList = [...this.state.list];
    newList.push(new InitiativeListItem('New'));
    this.updateList(newList);
  }

  removeConsumable(index, i) {
    const newList = [...this.state.list];
    const consumables = [...this.state.list[index].consumables];
    consumables.splice(i, 1);
    newList[index].consumables = consumables;
    this.updateList(newList);
  }

  removeListItem(index) {
    const newList = [...this.state.list];
    newList.splice(index, 1);
    this.updateList(newList);
  }

  moveListItemUp(index) {
    const newList = [...this.state.list];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    this.updateList(newList);
  }

  moveListItemDown(index) {
    const newList = [...this.state.list];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    this.updateList(newList);
  }

  updateCookie() {
    setCookie('initiativeTracker', JSON.stringify(this.state));
    this.props.updateData(this.state);
  }

  updateList(newList) {
    this.setState({ list: newList }, () => this.updateCookie());
  }

  startTracking() {
    this.setState({ inUse: true });
    this.sortList();
    this.setState({ 
      inUse: true,
      active: 0 
    }, () => this.updateCookie());
  }

  endTracking() {
    this.setState({ 
      inUse: false,
    }, () => this.updateCookie());
    setTimeout(() => {
      this.setState({
        active: 0,
        list: this.state.list.filter(item => item.isPC)          
      }, () => this.updateCookie());
    }, 3000);
  }

  render() {
    return html`
      <button onClick=${() => this.sortList()}>Sort</button>
      <button onClick=${() => this.addListItem()}>Add</button>
      <button onClick=${() => this.startTracking()}>Start</button>
      <button onClick=${() => this.setActive(( this.state.active + 1) %  this.state.list.length)}>Next</button>
      <button onClick=${() => this.endTracking()}>End</button>
      <div class="initiative-tracker-grid">
        ${ this.state.list.length > 0 ? html`
        <div class="header-item"></div>
        <div class="header-item"></div>
        <div class="header-item"></div>
        <div class="header-item"></div>
        <div class="header-item"></div>
        <div class="header-item">Name</div>
        <div class="header-item">PC</div>
        <div class="header-item">HP</div>
        <div class="header-item">Initiative</div>
        <div class="header-item">Notes</div>
        <div class="header-item">Consumables</div>
        ` : '' }
        ${ this.state.list.map((item, index) => html`
          <button
            class="square"
            onClick=${() => this.removeListItem(index)}
          ><div>\u2716</div></button>
          <button
            class="square"
            disabled=${index === 0}
            onClick=${() => this.moveListItemUp(index)}
          ><div>\u25B2</div></button>
          <button
            class="square"
            disabled=${index === this.state.list.length - 1}
            onClick=${() => this.moveListItemDown(index)}
          ><div>\u25BC</div></button>
          <button class="square"
            onClick=${() => this.setActive(index)}
          ><div>\u279C</div></button>
          <div class="active-item">
            ${this.state.active === index ? html`<div class="icon">\u279C</div>` : ''}
          </div>
          <input
            name="name"
            type="text"
            value=${item.name}
            onInput=${(e) => this.handleListItemChange(index, e)}
          ></input>
          <input
            name="isPC"
            type="checkbox"
            checked=${item.isPC}
            onChange=${(e) => this.handleListItemChange(index, e)}
          ></input>
          <input
            name="hp"
            type="number"
            value=${item.hp}
            onInput=${(e) => this.handleListItemChange(index, e)}
          ></input>
          <input
            name="initiative"
            type="number"
            value=${item.initiative}
            onInput=${(e) => this.handleListItemChange(index, e)}
          ></input>
          <input
            name="notes"
            type="text"
            value=${item.notes}
            onInput=${(e) => this.handleListItemChange(index, e)}
          ></input>
          <div class="consumables">
            ${item.consumables.map((consumable, i) => html`
              <button
                class="square small"
                onClick=${() => this.removeConsumable(index, i)}
              ><div>\u2716</div></button>
              <div>
                ${consumable}
              </div>
              <div class="consumable-spacer">
              </div>
            `)}
          </div>
        `) }
      </div>
  `
  }
}

export const InitiativeDisplay = ({data}) => {

  const displayList = () => data.list.reduce((dispList, item, index) => {
    if(index === 0 || item.isPC || data.list[index - 1].isPC) {
      return [...dispList, {
        name: item.isPC ? item.name : 'NPCs',
        active: index === data.active,
        nameClass: item.isPC ? 'name' : 'npc-name',
      }]
    } else if(index === data.active) {
      dispList[dispList.length - 1].active = true;
      return dispList;
    } else {
      return dispList;
    }
  }, []);

  return html`
    <div class="initiative-display-grid">
      ${displayList().map((item, index) => html`
        <div class="active-item">
          ${item.active ? html`<div class="icon">\u279C</div>` : html`<div></div>`}
        </div>
        <div class=${item.active ? item.nameClass + " active" : item.nameClass}>${item.name}</div>
      `)}
    </div>
  `
}