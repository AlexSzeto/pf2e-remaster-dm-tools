import { html } from 'htm/preact'
import { PreviewCard } from './../components/card.js'
import { Modal } from './../components/modal.js'

export const CardSelectorModal = ({
  cards,
  selectedCards,
  onPin,
  onUpdate,
  onClose,
}) => html`
  <${Modal} onClose=${onClose}>
    <div class="card-selector">
      <div class="grid">
      ${cards.map(
        (card) => html`
          <div
            class="card-container ${selectedCards.includes(card) && 'selected'}"
            onClick=${() =>
              selectedCards.includes(card)
                ? onUpdate(
                    selectedCards.filter((selectedCard) => selectedCard !== card)
                  )
                : onUpdate([...selectedCards, card])}
          >
            ${PreviewCard({ data: card, darkMode: selectedCards.includes(card) })}
          </div>
        `
      )}
      </div>
    </div>
  </${Modal}>
`
