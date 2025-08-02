import { html } from 'htm/preact'

import { ContentSection } from '../components/content-section.js'
import { Card } from '../components/card.js'
import { PinnedItemsList } from '../components/pinned-items-list.js'

export function Cards(props) {
    const { 
        cards, 
        pinnedCards, 
        pinnedRules, 
        onAddCard, 
        onAddRule, 
        onUpdateCards, 
        onRemoveCard, 
        onTogglePin, 
        onShowModal, 
        onAddCharacterToInitiative 
    } = props

    return html`
        <${ContentSection}
          label="Reference Cards"
          actions=${[
            {
              icon: 'search',
              onClick: () => onShowModal('search'),
            },
            {
              icon: 'plus',
              onClick: () => onShowModal('card'),
            },
            {
              icon: 'x',
              onClick: () => onUpdateCards([]),
            },
          ]}
        >
          <${PinnedItemsList}
            items=${pinnedCards}
            onUnpin=${id => onTogglePin('cards', '', id)}
            onClick=${card => onAddCard(card.id)}
          />
          <${PinnedItemsList}
            items=${pinnedRules}
            onUnpin=${id => onTogglePin('rules', '', id)}
            onClick=${rule => onAddRule(rule.id)}
          />
          <div class="card-grid">
            ${cards.map(
              (card) => html`
              <div class="reference-card-frame">
              <${ContentSection}
                label=""
                actions=${[
                  {
                    icon: 'bookmark',
                    onClick: () => card.ref 
                      ? onTogglePin('rules', card.name, `${card.ref.type}/${card.ref.rule}`)
                      : onTogglePin('cards', card.name, card.name),
                  },
                  {
                    icon: 'log-in',
                    onClick: () => onAddCharacterToInitiative(card),
                  },
                  {
                    icon: 'x',
                    onClick: () => onRemoveCard(card),
                  },
                ]}
              >
                  <${Card} data=${card} onSearch=${query => onAddRule(`spells/${query}`)}/>
              </${ContentSection}>
              </div>
              `
            )}
          </div>
        </${ContentSection}>      
    `
}
