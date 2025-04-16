import { render, Component } from 'preact'
import { html } from 'htm/preact'
import { Icon } from './components/icon.js'

const getNameGenerationPrompt = criteria => 
`Generate a list of 10 random names fulfilling the criteria "${criteria}" and output it as a JSON array.
See the following example for the expected output format and data content:
[{
"name": "the generated name. If necessary, more than one word can be used",
"meaning": "a short phrase, less than a sentence, of the name's meaning",
"description": "a brief description associated with the name"
}]
Generate the output only, without additional comments or explanations.`

class NameGenerator extends Component {
  constructor() {
    super()
    this.state = {
      campaign: {
        name: '',
        description: '',
      },
      disabled: false,
      criteria: '',
      generatedNames: [],
    }

    fetch(`/campaign`)
      .then((response) => response.json())
      .then((campaign) => { this.setState({ campaign }) })
  }

  generateNames( retry = 0 ) {
    this.setState({ disabled: true, generateNames: [] }, () => {
      fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          stream: false,
          prompt: getNameGenerationPrompt(this.state.criteria),
          temperature: 4,
        }),
      }).then((response) => {
        if (response.ok) {
          response.text().then((data) => {
            try {
              const parsed = JSON.parse(data)
              const llmResponse = parsed.response
                .replace(/<think>[\w\W]*<\/think>/m, '')
                .replace(/```json/, '')
                .replace(/```/, '')
  
              let generatedNames = null

              try {
                generatedNames = JSON.parse(llmResponse)
              } catch (e) {}
  
              if(!generatedNames) {
                try {
                  generatedNames = JSON.parse(llmResponse + ']')
                } catch (e) {}
              }
  
              if(!generatedNames) {
                generatedNames = JSON.parse(llmResponse + '}]')
              }
              this.setState({ 
                generatedNames,
                disabled: false
              })
            } catch (e) {
              if (retry < 2) {
                this.generateNames(retry + 1)
              } else {
                this.setState({ disabled: false })
              }
            }
          })
        }
      })      
    })
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('copied')
    }, (err) => {
      console.error('failed to copy', err)
    })
  }

  render() {
    return html`
    <div class="flat-page">
      <h1>Name Generator</h1>
      <input 
        name="criteria" 
        type="text" 
        placeholder="fantasy human male" 
        value="${this.state.criteria}"
        onInput=${(e) => this.setState({ criteria: e.target.value })}
      />
      <button id="generate" 
        disabled=${this.state.disabled}
        onClick=${() => this.generateNames()}
      >Generate</button>
      ${this.state.generatedNames.length > 0 && html`
        <div class="generated-results-container subsection vertical-list">
          ${this.state.generatedNames.map((name) => html`
            <div class="generated-result">
              <div class="name">
                <button class="square" onClick=${() => this.copyToClipboard(name.name)}><${Icon} icon="copy" /></button>
                <span class="text">${name.name}</span>
              </div>
              <div class="meaning">${name.meaning}</div>
              <div class="description">${name.description}</div>
            </div>
          `)}
        </div>
      `}
    </div>
`
  }
}

render(
  html`<${NameGenerator} />`,
  document.querySelector('.page-content')
)