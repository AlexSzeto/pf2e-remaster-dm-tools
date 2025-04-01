import { html } from "htm/preact";
import { FeatherIcon } from "./feather-icon.js";

export const Modal = ({onClose, minimal, children}) => html`
  <div class="screen-overlay">
    <div class="close-overlay" onClick=${() => onClose()}>
    </div>
    <div class="modal ${minimal ? 'minimal' : ''}">
      ${children}
      <button class="top-right square outlined inverted" onClick=${() => onClose()}>
        <${FeatherIcon} icon="x" />
      </button>
    </div>
  </div>
`