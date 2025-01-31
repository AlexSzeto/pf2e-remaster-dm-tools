import { html } from "htm/preact";

export const Modal = ({onClose, minimal, children}) => html`
  <div class="screen-overlay">
    <div class="close-overlay" onClick=${() => onClose()}>
    </div>
    <div class="modal ${minimal ? 'minimal' : ''}">
      ${children}
    </div>
  </div>
`