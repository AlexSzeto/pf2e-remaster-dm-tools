import { html } from 'htm/preact'

import { ContentSection } from '../components/content-section.js'
import { InitiativeTracker } from '../components/initiative-tracker.js'

export function Initiative(props) {
    const { combat, onUpdateInitiativeTracker, onShowModal } = props

    return html`
        <${ContentSection}
          label="Initiative Tracker"
          actions=${[
            {
              icon: 'plus',
              onClick: () => onShowModal('combatCards'),
            },
          ]}
        >
          <${InitiativeTracker}
            data=${combat}
            onUpdate=${(data) => onUpdateInitiativeTracker(data)}
          />
        </${ContentSection}>
    `
}
