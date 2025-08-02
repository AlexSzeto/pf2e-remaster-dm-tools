import { html } from 'htm/preact'
import { deepCompare } from '../common/util.js'
import { rawLine, BudgetDisplay, BudgetTracker, calculateRemainder, countBudget, totalBudgetByLevel } from '../components/budget-tracker.js'

export function Treasure(props) {
    const { 
        players, 
        campaign, 
        onUpdatePlayersLevel, 
        onUpdateLedger, 
        onUpdateTreasures,
        onSendTreasure
    } = props

    return html`
        <div class="tab-content budget-grid">
        <div>
          <${BudgetTracker}
            id="party-budget"
            label="Party Ledger"
            level=${players.partyLevel}
            items=${players.ledger}
            trackDate=${true}

            onUpdateLevel=${(level) => onUpdatePlayersLevel(level)}
            onAddLine=${(line) => onUpdateLedger([...players.ledger, line])}
            onDeleteLine=${(line) => onUpdateLedger(players.ledger.filter((l) => !deepCompare(rawLine(l), line)))}
          />
          <strong>ACCQUIRED</strong>
          <${BudgetDisplay}
            budget=${countBudget(players.ledger, players.partyLevel, players.partyLevel)}
          />
        </div>
        <div>
          <${BudgetTracker}
            id="treasure-budget"
            label="Treasure by Level"
            level=${players.partyLevel}
            items=${campaign.treasures.map(line => ({
              ...line,
              used: players.ledger.some(l => {
                const { date, ...stripped } = l
                return deepCompare(stripped, line)
              })
            }))}

            onUpdateLevel=${(level) => onUpdatePlayersLevel(level)}
            onAddLine=${(line) => onUpdateTreasures([...campaign.treasures, line])}
            onSendLine=${onSendTreasure}
            onDeleteLine=${(line) => onUpdateTreasures(campaign.treasures.filter((l) => !deepCompare(rawLine(l), line)))}
          />
          <div>
            <strong>SPENT</strong>
            <${BudgetDisplay}
              budget=${countBudget(campaign.treasures, players.partyLevel, players.partyLevel)}
            />
          </div>
          <div>
            <strong>REMAINING</strong>
            <${BudgetDisplay}
              budget=${
                calculateRemainder(
                  totalBudgetByLevel(players.partyLevel, players.characters.length),
                  countBudget(campaign.treasures, players.partyLevel, players.partyLevel)
                )              
              }
            />
          </div>
        </div>
      </div>
    `
}
