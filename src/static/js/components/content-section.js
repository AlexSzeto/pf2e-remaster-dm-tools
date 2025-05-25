import { html } from "htm/preact"
import { Icon } from "./icon.js"

export const ContentSection = ({label, actions, children}) => html`
  <div class="content-section-with-actions">
    <div class="title">${label}</div>
    <div class="actions">
      ${actions && actions.map(action => html`
        <button class="square" onClick=${action.onClick}>
          <${Icon} icon=${action.icon} />
        </button>
        `)}
    </div>
    <div class="content">
      ${children}
    </div>
  </div>
`;

export const LabeledItem = ({label, children}) => html`
  <div class="labeled-item">
    <label>${label}</label>
    <div class="content">${children}</div>
  </div>
`;