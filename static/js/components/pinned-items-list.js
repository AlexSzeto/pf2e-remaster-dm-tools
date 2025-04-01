import { html } from "htm/preact"
import { FeatherIcon } from "./feather-icon.js"

export const PinButton = ({outlined, isPinned, onClick}) => html`
  <button class="${outlined ? 'outlined' : ''} square" onClick=${() => {
    onClick()
  }}>
    <${FeatherIcon} icon="bookmark" />
  </button>
`

const PinnedItem = ({item, onClick, onUnpin}) => html`
  <div class="pinned-item">
    <div class="text" onClick=${() => onClick(item)}>${item.label}</div>
    <button class="square" onClick=${() => onUnpin(item.id)}><${FeatherIcon} icon="bookmark" /></button>
  </div>
`
export const PinnedItemsList = ({items, onClick, onUnpin}) => html`
  <div class="pinned-items-list">
    ${items.map(item => PinnedItem({item, onClick, onUnpin}))}
  </div>
`