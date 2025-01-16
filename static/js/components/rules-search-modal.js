import { Component, createRef } from 'preact'
import { html } from 'htm/preact'
import { spellToCard } from '../common/rule-to-card.js'

export class RulesSearchModal extends Component {
  constructor({onResult, onClose}) {
    super()

    this.queryInput = createRef()

    this.state = {
      query: '',
    }
  }

  componentDidMount() {
    console.log(this.queryInput)
    this.queryInput.current.focus()
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
        <div class="modal minimal">
          <div class="search">
            <input
              ref=${this.queryInput}
              type="text"
              placeholder="Search..."
              onKeyPress=${(e) => {
                if(e.key === 'Enter') {
                  this.doSearch()
                } else if (e.key === 'Escape') {
                  this.props.onClose()
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