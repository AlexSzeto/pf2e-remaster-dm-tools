import { html } from "htm/preact";

export const FramedImage = ({url, type, cover, onClick}) => html`
  <div
    onClick=${onClick} 
    class="framed-image ${type} ${url === '' ? 'empty' : ''}"
    style="background-image: url(${cover && url})"
  >
    ${url === '' && html`
    <button class="square">
      <i data-feather="plus"></i>
    </button>`}
    ${!cover && html`
      <img src=${url} />
    `}

  </div>
`