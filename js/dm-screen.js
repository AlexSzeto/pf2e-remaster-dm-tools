import { render, Component } from "preact";
import { html } from "htm/preact";
import { Card } from "./card.js";
import { InitiativeDisplay, InitiativeListItem, InitiativeTracker } from "./initiative-tracker.js"
import { getCookie, setCookie } from "./common.js";


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      initiativeTracker: {
        list: [],
        active: 0,
        inUse: false,
      }
    };

    setInterval(() => {
      this.setState({
        initiativeTracker: JSON.parse(getCookie('initiativeTracker'))
      });
    }, 200);    
  };
  
  render() {
    return html`
      <${InitiativeDisplay} data=${this.state.initiativeTracker} />
    `;
  }
}

render(html`<${App} />`, document.getElementById('initiative-display-container'));

