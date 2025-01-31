import { html } from "htm/preact";
import { PreviewCard } from './card.js'
import { Modal } from "./modal.js";

export const CardSelectorModal = ({cards, selectedCards, onUpdate, onClose}) => html`
  <${Modal} onClose=${onClose}>
    <div class="card-selector">
    ${cards.map(card => html`
      <div
        class="card-container ${selectedCards.includes(card) && 'selected'}"
        onClick=${() => selectedCards.includes(card)
          ? onUpdate(selectedCards.filter(selectedCard => selectedCard !== card))
          : onUpdate([...selectedCards, card])
        }
      >
        ${PreviewCard({data: card, darkMode: selectedCards.includes(card)})}
      </div>
    `)}
    </div>
  </${Modal}>
`
