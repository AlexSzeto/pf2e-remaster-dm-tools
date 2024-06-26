import { html } from "htm/preact";

export const Card = ({data}) => html`
    <div class="pf2e-stats">
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
            html`<div class=${`trait-item
              ${['common', 'uncommon', 'unique', 'rare'].includes(trait.toLowerCase()) ? trait.toLowerCase() : ''}
              ${['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal'].includes(trait.toLowerCase()) ? 'size' : ''}
            `}>
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
              ${ !!stat.hr && html`<hr/>` }
              <span class="stat-name">${ stat.name }</span>
              ${ !!stat.action && html`<span class=${`icon ${stat.action}`}> </span>`}
              <span class="stat-text" dangerouslySetInnerHTML=${{
                __html: stat.text
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\[(.*?)\]/g, '<span class="icon $1"></span>')
              }}></span>
            `) 
          }
        </div>`
      }
      ${ !!data.description
        && html`
          <hr/>
          <div class="description" dangerouslySetInnerHTML=${{
            __html: data.description
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\[(.*?)\]/g, '<span class="icon $1"></span>')
              .replace(/\n/g, '<br>')
          }}></div>`
      }
    </div>
`;

