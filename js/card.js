import { html } from "htm/preact";

const addMarkdownAndIconTo = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\[(.*?)\]/g, '<span class="icon $1"></span>')
    .replace(/\n/g, '<br>')

export const Card = ({data}) => html`
    <div class="pf2e-stats">
      ${ !!data.fullFrameImage
        && html`<div class="full-frame-image" style="background-image: url('${ data.fullFrameImage }')" />`
      }
      ${ !!data.name || !!data.type 
        && html`
        <div class="title">
          <div class="name">${ data.name }</div>
          ${ !!data.type
            && html`<div class="type">${ data.type }</div>` 
          }
        </div>
        `
      }
      ${ !!data.illustration
        ? html`<img class="illustration" src="${ data.illustration }" />` 
        : (!!data.name || !!data.type)
        ? html`<hr/>`
        : ''
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
                __html: addMarkdownAndIconTo(stat.text)

              }}></span>
            `) 
          }
        </div>`
      }
      ${ !!data.description
        && html`
          <hr/>
          <div class="description" dangerouslySetInnerHTML=${{
            __html: addMarkdownAndIconTo(data.description)
          }}></div>`
      }
    </div>
`;

