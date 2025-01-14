import { render, Component } from "preact";
import { html } from "htm/preact";

import { InitiativeDisplay } from "./components/initiative-tracker.js"
import { campaignResource, getCookie } from "./common/util.js";
import { CrossfadeImage } from "./components/crossfade-image.js";


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      campaignId: '',
      images: {
        background: '',
        left: '',
        right: '',
        cover: false
      },
      initiativeTracker: {
        list: [],
        active: 0,
        inUse: false,
      }
    };

    // Get current campaign from cookie
    const currentCampaign = getCookie('currentCampaign')

    // If current campaign is set, load it
    if (currentCampaign) {
      this.setState({ campaignId: currentCampaign });
    }

    setInterval(() => {
      this.setState({
        images: JSON.parse(getCookie('screenImages')),
        initiativeTracker: JSON.parse(getCookie('initiativeTracker'))
      });
    }, 200);    
  };
  
  render() {
    return html`
      <div class="images-container ${this.state.initiativeTracker.inUse ? 'faded' : ''}">
        <div class="background-container">
          <${CrossfadeImage} cover=${this.state.images.cover} url=${campaignResource(this.state.campaignId, this.state.images.background)} />
        </div>
        <div class="left-container">
          <${CrossfadeImage} url=${campaignResource(this.state.campaignId, this.state.images.left)} />
        </div>
        <div class="right-container">
          <${CrossfadeImage} url=${campaignResource(this.state.campaignId, this.state.images.right)} />
        </div>
      </div>
      <div 
        class="initiative-display-container ${this.state.initiativeTracker.inUse ? 'active' : ''}"
      >
        <${InitiativeDisplay} data=${this.state.initiativeTracker} />
      </div>
    `;
  }
}

render(html`<${App} />`, document.body);
