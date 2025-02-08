import { Component } from 'preact'
import { html } from 'htm/preact'
import { getCookie, setCookie } from '../common/util.js'

export class CampaignManager extends Component {
  constructor(props) {
    super(props)
    this.state = {
      campaigns: [],
      current: '',
    }
    this.loadCampaigns()
  }

  loadCampaigns() {
    fetch('./campaigns')
      .then((response) => response.json())
      .then((campaignData) => {
        const nextState = {
          ...campaignData,
        }
        this.setState(nextState)
        console.log(nextState)
      })
      .catch((error) => {
        console.error('Error loading campaign data:', error)
      })
  }

  createCampaign(event) {
    event.preventDefault()
    const form = event.target
    const formData = new FormData(form)
    const name = formData.get('name')
    if (!name || name.length === 0) {
      return
    }
    fetch('./campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
      .then(() => {
        this.loadCampaigns()
        form.reset()
      })
      .catch((error) => {
        console.error('Error creating campaign:', error)
      })
  }

  setCurrentCampaign(current) {
    this.setState({ current })
    fetch('./campaign/current', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ current }),
    }).catch((error) => {
      console.error('Error setting current campaign:', error)
    })
  }

  render() {
    return html`
      <h1>Campaigns</h1>
      <div class="subsection">
        <h2>Select</h2>
        <div class="subsection vertical-list">
          ${this.state.campaigns.map(
            (campaign) => html`
              <div>
                <a
                  href="#"
                  class=${campaign.id === this.state.current ? 'selected' : ''}
                  onClick=${() => this.setCurrentCampaign(campaign.id)}
                >
                  ${campaign.name}
                </a>
              </div>
            `
          )}
        </div>
      </div>
      <div class="subsection">
        <h2>Create</h2>
        <div class="subsection">
          <form onSubmit=${this.createCampaign.bind(this)}>
            <label>
              <input type="text" name="name" />
            </label>
            <button type="submit">Create</button>
          </form>
        </div>
      </div>
    `
  }
}
