import { html } from "htm/preact";
import { FeatherIcon } from "./feather-icon.js";

export const FramedImage = ({url, type, cover, onClick}) => html`
  <div
    onClick=${onClick} 
    class="framed-image ${type} ${url === '' ? 'insert-frame' : ''}"
    style="background-image: url(${cover && url})"
  >
    ${url === '' && html`
    <button class="square">
      <${FeatherIcon} icon="plus" />
    </button>`}
    ${!cover && html`
      <img src=${url} />
    `}

  </div>
`