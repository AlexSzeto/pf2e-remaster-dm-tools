import { CampaignManager } from './components/campaign-manager.js'
import { render } from 'preact'
import { html } from 'htm/preact'

const test = () => {
  fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2',
      stream: false,
      prompt: `Generate a list of 10 random fantasy names fulfilling the criteria "${
        document.querySelector('[name="nameCriteria"]').value
      }" and output it as a JSON array.
See the following example for the expected output format and data content:
[{
"name": "the generated name. If necessary, more than one word can be used",
"meaning": "a short phrase, less than a sentence, of the name's meaning",
"description": "a brief description associated with the name"
}]
Generate the output only, without additional comments or explanations.`,
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
          console.log(llmResponse)
          console.log(JSON.parse(llmResponse))
        } catch (e) {
          console.error(e)
        }
      })
    }
  })
}

render(
  html`
    <${CampaignManager} />
    <h1>In Game</h1>
    <div class="subsection vertical-list">
      <div>
        <a href="creature-creator">Creature Creator</a>
      </div>
      <div>
        <a href="dm-screen">DM Screen</a>
      </div>
      <div>
        <a href="pc-screen">PC Screen</a>
      </div>
      <input
        name="nameCriteria"
        type="text"
        placeholder="human male"
        value="human male"
      />
      <button onClick=${() => test()}>Test</button>
    </div>
  `,
  document.body
)
