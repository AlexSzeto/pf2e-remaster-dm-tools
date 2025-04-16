import { render } from 'preact'
import { useState } from 'preact/hooks'
import { html } from 'htm/preact'
import { Card } from './components/card.js'

const App = () => {
  const [cardPages, setPages] = useState([])
  const pageSize = 9

  const loadData = (event) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result)
      const pages = []
      for (let i = 0; i < data.cards.length; i += pageSize) {
        pages.push(data.cards.slice(i, i + pageSize))
      }
      setPages(pages)
    }
    reader.readAsText(event.target.files[0])
  }

  return html`
    <input type="file" accept=".json" onChange=${loadData}></input>
    ${cardPages.map(
      (page, pageIndex) => html`
        <div class="print-page-frame ${pageIndex > 0 && 'page-break'}">
          ${page.map(
            (card, cardIndex) => html`
              <div class="card">
                <div class="card-border">
                  <${Card} data=${card} />
                </div>
              </div>
            `
          )}
        </div>
      `
    )}
  `
}

render(html`<${App} />`, document.querySelector('.page-content'))
