import { html } from "htm/preact"
import { FeatherIcon } from "./feather-icon.js"

export const ContentSection = ({label, actions, children}) => html`
  <div class="content-section-with-actions">
    <div class="title">${label}</div>
    <div class="actions">
      ${actions && actions.map(action => html`
        <button class="square" onClick=${action.onClick}>
          <${FeatherIcon} icon=${action.icon} />
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