import { render, Component } from 'preact'
import { html } from 'htm/preact'

import { ContentSection } from './content-section.js'
import { treasureByLevel } from '../common/dm-data.js'
import { Icon } from './icon.js'

export const rawLine = (line) => {
  const { level, gp, sp, cp, items, notes } = line
  return { level, gp, sp, cp, items, notes }
}

const labelWrap = (label, content) => html`
  <div>
    <label><span class="label-text">${label}: </span>${content} </label>
  </div>
`

const budgetLineDate = () => new Date().toISOString().split('T')[0]

export const totalBudgetByLevel = (level, playerCount) => {
  const treasureByCurrentLevel = treasureByLevel.find(row => row[0] === level)
  if (!treasureByCurrentLevel) {
    return null
  }

  const [_, __, permItemsList, consumeItemsList, extraTreasure, treasurePerCharacter] = treasureByCurrentLevel
  return {
    gp: extraTreasure + treasurePerCharacter * Math.max(0, playerCount - 4),
    sp: 0,
    cp: 0,
    permanents: permItemsList.map((item) => ({ level: item[0], count: item[1] })),
    consumables: consumeItemsList.map((item) => ({ level: item[0], count: item[1] })),
  }
}

const countItems = (items) => {
  return items.reduce((sum, item) => {
    const existing = sum.find((i) => i.level === item.level)
    if (existing) {
      existing.count++
    } else {
      sum.push({ level: item.level, count: 1 })
    }
    return sum
  }, [])
}

export const countBudget = (items, minLevel, maxLevel) => {
  const sum = items
    .filter((item) => item.level >= minLevel && item.level <= maxLevel)
    .reduce(
      (sum, item) => ({
        gp: sum.gp + item.gp,
        sp: sum.sp + item.sp,
        cp: sum.cp + item.cp,
        permanents: [
          ...sum.permanents,
          ...item.items.filter((i) => i.type === 'permanent'),
        ],
        consumables: [
          ...sum.consumables,
          ...item.items.filter((i) => i.type === 'consumable'),
        ],
      }),
      {
        gp: 0,
        sp: 0,
        cp: 0,
        permanents: [],
        consumables: [],
      }
    )

  sum.permanents = countItems(sum.permanents)
  sum.consumables = countItems(sum.consumables)

  return sum
}

export const calculateRemainder = (budget, spent) => {
  const remainder = {
    gp: Math.floor(
      parseInt(budget.gp)
      + parseInt(budget.sp)/ 10
      + parseInt(budget.cp)/ 100
      - parseInt(spent.gp)
      - parseInt(spent.sp)/ 10
      - parseInt(spent.cp) / 100
    ),
    permanents: [ ...budget.permanents ],
    consumables: [ ...budget.consumables ],
  }

  const subtractItemByType = (type) => {
    spent[type].forEach((itemSpent) => {
      const itemRemain = remainder[type].find((i) => i.level === itemSpent.level)
      if (itemRemain) {
        itemRemain.count -= itemSpent.count
      } else {
        remainder[type].push({ level: itemSpent.level, count: -itemSpent.count })
      }
    })
    remainder[type] = remainder[type].filter((i) => i.level > 0 && i.count > 0)
  }

  subtractItemByType('permanents')
  subtractItemByType('consumables')

  return remainder
}

const displayItemCount = (items) =>
  items
    .sort((a, b) => a.level - b.level)
    .map((item) => html`lv${item.level} (${item.count}) `)

export const BudgetDisplay = ({budget}) => html`
<div class="budget-display-container"><div class="budget-display">
  <div>
  <strong>gold: </strong>${budget.gp && html`${budget.gp}gp `}
  ${!!budget.sp && html`${budget.sp}sp `}
  ${!!budget.cp && html`${budget.cp}cp `}
  </div>
  <div>
  <strong>permanents: </strong>${displayItemCount(budget.permanents)}
  </div>
  <div>
  <strong>consumables: </strong>${displayItemCount(budget.consumables)}
  </div>
</div></div>`

export class BudgetTracker extends Component {
  constructor(props) {
    super(props)
    this.state = {
      view: 'list',
    }
  }

  setLevel(level) {
    this.props.onUpdateLevel(level)
  }

  addLine() {
    const form = document.getElementById(this.props.id)
    const parseItemText = (text, type) => text
      .split(',')
      .map((item) => {
        const parts = item.trim().split(' ')
        return {
          level: parseInt(parts[0].slice(2), 10),
          type,
          name: parts.slice(1).join(' '),
        }
      })

    const parseToNumber = value => isNaN(parseInt(value)) ? 0 : parseInt(value)
    const line = {
      date: this.props.trackDate ? budgetLineDate() : undefined,
      gp: parseToNumber(form.querySelector('input[name="gp"]').value),
      sp: parseToNumber(form.querySelector('input[name="sp"]').value),
      cp: parseToNumber(form.querySelector('input[name="cp"]').value),
      items: (
        form.querySelector('input[name="permanents"]').value
        ? parseItemText(form.querySelector('input[name="permanents"]').value, 'permanent') : []
      ).concat(
        form.querySelector('input[name="consumables"]').value
        ? parseItemText(form.querySelector('input[name="consumables"]').value, 'consumable') : []
      ),
      notes: form.querySelector('input[name="notes"]').value,
      level: this.props.level,
    }
    this.props.onAddLine(line)
    this.setState({ view: 'list' })
  }

  render() {
    return html`
      <div class="budget-tracker">
        <${ContentSection} 
          label=${this.props.label}
          actions=${[
            { icon: 'plus', onClick: () => this.setState({ view: 'add' }) },
          ]}
        >
          <div class="level-display">
            <div class="title">Party Level</div>
            <div class="value">${this.props.level}</div>
            <button class="square" onClick=${() =>
              this.setLevel(this.props.level - 1)}><${Icon} icon="minus" /></button>
            <button class="square" onClick=${() =>
              this.setLevel(this.props.level + 1)}><${Icon} icon="plus" /></button>
          </div>
          <div class="tracker-content">
          ${
            this.state.view === 'list' && (
              this.props.trackDate
              ? this.props.items.reduce((dateList, line) => {
                if (line.level === this.props.level && !dateList.includes(line.date)) {
                  dateList.push(line.date)
                }
                return dateList
              }, [])
              : [null]
            ).map((date) => html`
              ${ this.props.trackDate && html`<div class="date">${date}</div>`}
              <div class="line-items-list">
                <ul>
                  ${this.props.items
                    .filter((item) => ! this.props.trackDate || item.date === date)
                    .filter((item) => item.level === this.props.level)
                    .map(
                      (line) => html`
                        <li class="${line.used ? 'used' : ''}">
                          ${this.props.onDeleteLine &&
                            html`<button class="square" onClick=${() => this.props.onDeleteLine(rawLine(line))}>
                              <${Icon} icon="trash" size="sm"/>
                            </button>`
                          }
                          ${this.props.onSendLine &&
                          html`<button class="square" disabled=${line.used} onClick=${() => {
                            this.props.onSendLine(rawLine(line), budgetLineDate())
                          }}>
                            <${Icon} icon="log-in" size="sm"/>
                          </button>`
                          }
                          <strong>
                            ${line.gp > 0 && html`${line.gp}gp`}
                            ${line.sp > 0 && html`${line.sp}sp`}
                            ${line.cp > 0 && html`${line.cp}cp`}
                          </strong>
                          ${line.items.map(
                            (item, index) =>
                              html`<strong>lv${item.level}</strong> ${item.name} `
                          )}

                          ${line.notes && html` <em>(${line.notes})</em>`}
                        </li>
                      `
                    )}
                </ul>
              </div>
            `)
          }
          ${
            this.state.view === 'add' &&
            html`
              <div class="add-line-form">
                <div id="${this.props.id}">
                  ${labelWrap('gp', html`<input name="gp" type="number" />`)}
                  ${labelWrap('sp', html`<input name="sp" type="number" />`)}
                  ${labelWrap('cp', html`<input name="cp" type="number" />`)}
                  ${labelWrap(
                    'permanents (lv<X> <name>,)',
                    html`<input name="permanents" />`
                  )}
                  ${labelWrap(
                    'consumables (lv<X> <name>,)',
                    html`<input name="consumables" />`
                  )}
                  ${labelWrap('notes', html`<input name="notes" />`)}
                  <button onClick=${() => this.setState({ view: 'list' })}>Cancel</button>
                  <button onClick=${() => this.addLine()}>Add</button>
                </div>
              </div>
            `            
          }
          </div>
        </${ContentSection}>
      </div>
    `
  }
}
