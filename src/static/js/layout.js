import { render, Component } from 'preact'
import { html } from 'htm/preact'

class Layout extends Component {
  constructor() {
    super()
    this.state = {
      campaign: {},
    }

    fetch(`/campaign/data`)
      .then((response) => response.json())
      .then((campaign) => { this.setState({ campaign }) })
  }

  render() {
    const pages = [
      {
        id: 'index',
        name: 'Home',
      },
      {
        id: 'dm-screen',
        name: 'DM Screen',
      },
      {
        id: 'pc-screen',
        name: 'PC Screen',
      },
      {
        id: 'name-generator',
        name: 'Name Generator',
      },
      {
        id: 'insert-media',
        name: 'Insert Media',
      },
      {
        id: 'map-editor',
        name: 'Map Editor',
      },
      {
        id: 'creature-creator',
        name: 'Creature Creator',
      },
    ]
    return html`
    <h1
      class="name"
      onClick=${() => location.href = '/'}
    >${this.state.campaign.name}</h1>
    <h2 class="description">${this.state.campaign.description}</h2>
    <h1 class="logo">${document.title}</h1>
    <div class="links">
    ${pages.map((page) => html`
      <span><a href=${`/${page.id}`}>${page.name}</a></span>
    `)}
    </div>
    `
  }
}

render(html`<${Layout} />`, document.querySelector('.header'))
