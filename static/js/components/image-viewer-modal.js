import { html } from "htm/preact";
import { campaignResource } from "../common/util.js";
import { Modal } from "./modal.js";

export const ImageViewerModal = ({url, onClose}) => html`
  <${Modal} onClose=${onClose} minimal=${true}>
    <div class="image-viewer" onClick=${onClose}>
      <img class="image" src="${url}" />
    </div>
  </${Modal}>
`