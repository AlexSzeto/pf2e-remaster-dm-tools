import { CampaignManager } from './components/campaign-manager.js'
import { render } from 'preact'
import { html } from 'htm/preact'

render(html`
  <${CampaignManager} />
  <h1>In Game</h1>
  <div class="subsection vertical-list">
    <div>
      <a href="tools/creature-creator">Creature Creator</a>
    </div>
    <div>
      <a href="tools/dm-screen">DM Screen</a>
    </div>
    <div>
      <a href="tools/pc-screen">PC Screen</a>
    </div>
  </div>
`, document.body)