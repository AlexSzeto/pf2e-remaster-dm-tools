import { html } from "htm/preact";

export const LabeledItem = ({label, children}) => html`
  <div class="labeled-item-container">
    <label>${label}</label>
    <div class="content">
      ${children}
    </div>
  </div>
`;