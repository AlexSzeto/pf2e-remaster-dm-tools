import { html } from "htm/preact";
import { Icon } from "./icon.js";

export const FramedImage = ({url, type, cover, onClick, onModal}) => html`
  <div    
    class="framed-image ${type} ${url === '' ? 'insert-frame' : 'display-frame'}"    
  >
    ${url === '' ? html`
      <button class="square centered" onClick=${onClick}>
        <${Icon} icon="plus" />
      </button>
    ` : html`
      ${cover ? html`
        <div class="cover" onClick=${onClick} style="background-image: url(${cover ? url : ''})"></div>
      ` : html`
        <img src=${url} onClick=${onClick}/>
      `}
      <button class="outlined square top-left" onClick=${onModal(url)}>
        <${Icon} icon="zoom-in" />
      </button>
    `}
  </div>
`