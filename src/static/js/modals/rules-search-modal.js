import { Component, createRef } from 'preact'
import { html } from 'htm/preact'
import { spellToCard } from '../common/rule-to-card.js'
import { Modal } from './../components/modal.js'
import { debounce } from '../common/util.js'

export function loadRule(type, rule) {
  window.open(`https://2e.aonprd.com/Search.aspx?q=${rule}`, '_blank')
}

export class RulesSearchModal extends Component {
  constructor({ onResult, onClose }) {
    super()

    this.queryInput = createRef()

    this.state = {
      query: '',
      results: [],
    }
  }

  componentDidMount() {
    console.log(this.queryInput)
    this.queryInput.current.focus()
  }

  doSearch(query) {
    fetch(`/rule/search/${query}`)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ results: data })
      })
  }

  doQuery(result) {
    loadRule(result.folder, result.file)
      .then((data) => {
        this.props.onResult(data)
        this.props.onClose()
      })
  }

  render() {
    const asyncSearch = debounce((query) => {
      this.doSearch(query)
    }, 300)

    return html`
      <${Modal} onClose=${this.props.onClose}>
        <div class="search">
          <input
            ref=${this.queryInput}
            type="text"
            placeholder="Search..."
            onKeyPress=${(e) => {
              if (e.key === 'Escape') {
                this.props.onClose()
              }
            }}
            onInput=${(e) => {
              this.setState({ query: e.target.value }, () => asyncSearch(this.state.query))
            }}
          />
          <button onClick=${(e) => this.doSearch()}>
            Search
          </button>
        </div>
        <div class="results-list">
          ${this.state.results.map((result) => html`
            <div class="result">
              <a href='#' onClick=${(e) => {
                e.preventDefault()
                this.doQuery(result)
              }}>
                ${result.label}
              </a>
            </div>
          `)}
        </results-list>
      </${Modal}>
   `
  }
}
