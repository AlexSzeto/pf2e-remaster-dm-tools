import { render } from "preact";
import { useState } from "preact/hooks";
import { html } from "htm/preact";

const Card = ({data}) => html`
  <div class="card">
    <div class="card-border">
      <div class="title">
        <div class="name">${ data.name }</div>
        ${ !!data.type
          && html`<div class="type">${ data.type }</div>` 
        }
      </div>
      ${ !!data.illustration
        && html`<img class="illustration" src="${ data.illustration }" />` 
      }
      ${ !! data.traits
        && html`<div class="traits">
          ${ data.traits.map(trait => 
            html`<div class=${`trait-item ${
              ['common', 'uncommon', 'unique', 'rare'].includes(trait.toLowerCase()) ? trait.toLowerCase() : ''
            }`}>
              <span>${ trait }</span>
            </div>`) 
          }
        </div>`
      }
      ${ !!data.stats
        && html`<div class="stats">
          ${ data.stats.map(stat => 
            html`
              ${ !!stat.newline && html`<br/>` }
              <span class="stat-name">${ stat.name }</span>
              <span class="stat-text">${ stat.text }</span>
            `) 
          }
          <hr/>
        </div>`
      }
      ${ !!data.description
        && html`<div class="description" dangerouslySetInnerHTML=${{
          __html: data.description
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[(.*?)\]/g, '<span class="icon $1"></span>')
            .replace(/\n/g, '<br>')
        }}></div>`
      }
    </div>
  </div>
`;

const CardInput = ({data, setData}) => html`

      <div class="title">
        <input class="name" value=${data.name} onInput=${e => setData({...data, name: e.target.value})} />
        <input class="type" value=${data.type} onInput=${e => setData({...data, type: e.target.value})} />
      </div>
      <input class="illustration" value=${data.illustration} onInput=${e => setData({...data, illustration: e.target.value})} />
      
     <div class="traits">
          ${ !!data.traits && data.traits.map((trait, index) => 
            html`<input class=${`trait-item ${
              ['common', 'uncommon', 'unique', 'rare'].includes(trait.toLowerCase()) ? trait.toLowerCase() : ''
            }`} value=${trait} onInput=${e => {
              let newTraits = [...data.traits];
              newTraits[index] = e.target.value;
              setData({...data, traits: newTraits});
            }} />`) 
          }
        </div>
      <div class="stats">
          ${ !!data.stats && data.stats.map((stat, index) => 
            html`
              ${ !!stat.newline && html`<br/>` }
              <input class="stat-name" value=${stat.name} onInput=${e => {
                let newStats = [...data.stats];
                newStats[index].name = e.target.value;
                setData({...data, stats: newStats});
              }} />
              <input class="stat-text" value=${stat.text} onInput=${e => {
                let newStats = [...data.stats];
                newStats[index].text = e.target.value;
                setData({...data, stats: newStats});
              }} />
            `) 
          }
        </div>      
      <textarea class="description" value=${data.description} onInput=${e => setData({...data, description: e.target.value})}></textarea>
      <hr/>
      

`;

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
    <div class="card-builder">
      ${ cards.map((card, index) => html`<${CardInput} data=${card} setData=${data => setData(index, data)}/>`) }
    </div>
    <hr/>
    <div class="card-frame">
      ${ cards.map((card, index) => html`<${Card} data=${card} />`) }
    </div>

  `
}

render(html`<${App} />`, document.body);

