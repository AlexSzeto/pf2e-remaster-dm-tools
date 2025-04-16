import { CampaignManager } from './components/campaign-manager.js'
import { render } from 'preact'
import { html } from 'htm/preact'
import { PlayersManager } from './components/players-manager.js'


render(
  html`
    <div class="flat-page">
      <${CampaignManager} />
      <${PlayersManager} />
      <h1>Other Pages</h1>
      <div class="subsection vertical-list">
        <div>
          <a href="card-printer">Card Printer</a>
        </div>
      </div>
    </div>
  `,
  document.querySelector('.page-content')
)
