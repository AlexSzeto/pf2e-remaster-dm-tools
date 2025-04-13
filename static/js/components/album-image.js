import { html } from "htm/preact";
import { Icon } from "./icon.js";

export const AlbumImage = ({url, onClick, onModal}) => html`
  <div class="album-image">
    <button class="outlined square" onClick=${onModal(url)}>
      <${Icon} icon="zoom-in" />
    </button>
    <img onClick=${onClick} src=${url} />
  </div>
`