import { html } from 'htm/preact'
import { PreviewCard } from './../components/card.js'
import { Modal } from './../components/modal.js'

const CardSelectorList = ({
  cards,
  selectedCards,
  onPin,
  onUpdate,
}) => html`
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
`

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
        <${CardSelectorList}
          cards=${cards}
          selectedCards=${selectedCards}
          onPin=${onPin}
          onUpdate=${onUpdate}
        />
      </div>
    </div>
  </${Modal}>
`
