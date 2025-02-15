import { CampaignManager } from './components/campaign-manager.js'
import { render } from 'preact'
import { html } from 'htm/preact'
import { PlayersManager } from './components/players-manager.js'


render(
  html`
    <${CampaignManager} />
    <${PlayersManager} />
    <h1>In Game</h1>
    <div class="subsection vertical-list">
      <div>
        <a href="creature-creator">Creature Creator</a>
      </div>
      <div>
        <a href="name-generator">Name Generator</a>
      </div>
      <div>
        <a href="dm-screen">DM Screen</a>
      </div>
      <div>
        <a href="pc-screen">PC Screen</a>
      </div>
    </div>
  `,
  document.body
)
