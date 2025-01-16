import { Component } from 'preact'
import { html } from 'htm/preact'
import { spellToCard } from '../common/rule-to-card.js'

export class RulesSearchModal extends Component {
  constructor({onResult, onClose}) {
    super()

    this.state = {
      query: '',
    }
  }

  doSearch() {
    fetch(`/rule/spells/${this.state.query}`)
    .then(response => response.json())
    .then(data => {      
      this.props.onResult(spellToCard(data))
      this.props.onClose()
    })
  }

  render() {
    return html`
      <div class="screen-overlay">
        <div class="close-overlay" onClick=${() => this.props.onClose()}>
        </div>
        <div class="modal">
          <div class="search">
            <input
              type="text"
              placeholder="Search..."
              onKeyPress=${(e) => {
                if(e.key === 'Enter') {
                  this.doSearch()
                }
              }}
              onInput=${(e) => {
                this.setState({query: e.target.value})
              }}
            />
            <button onClick=${(e) => this.doSearch()}>
              Search
            </button>
          </div>
        </div>
      </div>
    `
  }
}