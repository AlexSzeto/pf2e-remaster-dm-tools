import { render, Component } from 'preact'
import { html } from 'htm/preact'

import { InitiativeDisplay } from './components/initiative-tracker.js'
import { campaignResource, getCookie } from './common/util.js'
import { CrossfadeImage } from './components/crossfade-image.js'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      campaignId: '',
      images: {
        background: '',
        left: '',
        right: '',
        cover: false,
      },
      initiativeTracker: {
        list: [],
        active: 0,
        inUse: false,
      },
    }

    fetch('./campaign/current')
      .then((response) => response.json())
      .then((campaignData) => {
        this.setState({ campaignId: campaignData.id })
      })
      .catch((error) => {
        console.error('Error loading campaign data:', error)
      })

    setInterval(() => {
      this.setState({
        images: JSON.parse(getCookie('screenImages')),
        initiativeTracker: JSON.parse(getCookie('initiativeTracker')),
      })
    }, 200)
  }

  render() {
    return html`
      <div
        class="images-container ${this.state.initiativeTracker &&
        this.state.initiativeTracker.inUse
          ? 'faded'
          : ''}"
      >
        <div class="background-container">
          <${CrossfadeImage}
            cover=${this.state.images.cover}
            url=${campaignResource(this.state.images.background)}
          />
        </div>
        <div class="left-container">
          <${CrossfadeImage} url=${campaignResource(this.state.images.left)} />
        </div>
        <div class="right-container">
          <${CrossfadeImage} url=${campaignResource(this.state.images.right)} />
        </div>
      </div>
      <div
        class="initiative-display-container ${this.state.initiativeTracker &&
        this.state.initiativeTracker.inUse
          ? 'active'
          : ''}"
      >
        ${this.state.initiativeTracker &&
        this.state.initiativeTracker.inUse &&
        html`<${InitiativeDisplay} data=${this.state.initiativeTracker} />`}
      </div>
    `
  }
}

render(html`<${App} />`, document.body)
