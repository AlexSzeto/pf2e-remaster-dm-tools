import { render } from "preact";
import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { Card } from "./card.js";

const App = () => {
  const [cards, setCards] = useState(new Array(9).fill({ traits: [], stats: [] }));

  const loadData = (event) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result);
      setCards(data.cards);
    }
    reader.readAsText(event.target.files[0]);
  }

  const setData = (index, data) => {
    let newCards = [...cards];
    newCards[index] = data;
    setCards(newCards);
  }

  return html`
    <input type="file" accept=".json" onChange=${loadData}></input>
    <div class="card-frame">
      ${ cards.map((card, index) => html`
        <div class="card">
          <div class="card-border">        
            <${Card} data=${card} />
          </div>
        </div>
      `) }
    </div>
  `
}

render(html`<${App} />`, document.body);

