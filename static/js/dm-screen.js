import { render, Component } from 'preact'
import { html } from 'htm/preact'

import { ContentSection, LabeledItem } from './components/content-section.js'
import { FramedImage } from './components/framed-image.js'

import { Card } from './components/card.js'
import {
  InitiativeListItem,
  InitiativeTracker,
} from './components/initiative-tracker.js'
import { campaignResource, deepCompare, getCookie, setCookie } from './common/util.js'
import { createAudioSource } from './common/audio.js'
import { MarkdownDocument } from './components/md-doc.js'
import { rawLine, BudgetDisplay, BudgetTracker, calculateRemainder, countBudget, totalBudgetByLevel } from './components/budget-tracker.js'

import { ImageSelectorModal } from './modals/image-selector-modal.js'
import { FileSelectorModal } from './modals/file-modal.js'
import { CardSelectorModal } from './modals/card-modal.js'
import { loadRule, RulesSearchModal } from './modals/rules-search-modal.js'
import { ImageViewerModal } from './modals/image-viewer-modal.js'
import { PinnedItemsList } from './components/pinned-items-list.js'

const imageLocations = ['background', 'left', 'right']
const audioTypes = ['bgm', 'ambience']

const audioTypeMaps = {
  bgm: {
    dataSource: 'bgms',
    label: 'Background Music',
    // volume: 0.50,
    volume: 1.0,
  },
  ambience: {
    dataSource: 'ambiences',
    label: 'Ambience',
    // volume: 0.20,
    volume: 1.0,
  },
}

const duckVolume = 0.2

class App extends Component {
  //
  // IMAGE
  //
  showImage(location, url) {
    const images =
      location === 'background'
        ? {
            background: url,
            left: '',
            right: '',
            cover: true,
          }
        : {
            ...this.state.screen.images,
            [location]: url,
          }

    this.setState({
      screen: {
        ...this.state.screen,
        images,
      },
    })

    setCookie('screenImages', JSON.stringify(images))
  }

  toggleBackgroundCover() {
    this.setState(
      {
        screen: {
          ...this.state.screen,
          images: {
            ...this.state.screen.images,
            cover: !this.state.screen.images.cover,
          },
        },
      },
      () => setCookie('screenImages', JSON.stringify(this.state.screen.images))
    )
  }

  //
  // AUDIO
  //
  globalVolume(type) {
    return this.state.screen.duckAudio
      ? duckVolume * audioTypeMaps[type].volume
      : audioTypeMaps[type].volume
  }

  startAudioLoop(type, label, url) {
    if (url === '') {
      this.stopAudio(type)
      return
    }

    const start = (fadeInDuration) => {
      this.setState({
        screen: {
          ...this.state.screen,
          [type]: {
            label,
            controls: createAudioSource(
              campaignResource(url),
              fadeInDuration,
              this.globalVolume(type)
            ),
          },
        },
      })
    }

    if (this.state.screen[type].controls !== null) {
      this.state.screen[type].controls.end(4)
      setTimeout(start(8), 6000)
    } else {
      start(2)
    }
  }

  stopAllAudio() {
    audioTypes.forEach((type) => {
      if (this.state.screen[type].controls !== null) {
        this.state.screen[type].controls.end(4)
      }
    })
    this.setState({
      screen: {
        ...this.state.screen,
        ...audioTypes.reduce(
          (updates, type) => ({
            ...updates,
            [type]: {
              label: '',
              controls: null,
            },
          }),
          {}
        ),
      },
    })
  }

  stopAudio(type) {
    if (this.state.screen[type].controls !== null) {
      this.state.screen[type].controls.end(4)
    }
    this.setState(
      {
        screen: {
          ...this.state.screen,
          [type]: {
            label: '',
            controls: null,
          },
        },
      },
      () => feather.replace()
    )
  }

  toggleAudioDuck() {
    const duckAudio = !this.state.screen.duckAudio
    this.setState({
      screen: {
        ...this.state.screen,
        duckAudio,
      },
    })

    audioTypes.forEach((type) => {
      if (this.state.screen[type].controls !== null) {
        if (duckAudio) {
          this.state.screen[type].controls.duck(
            1,
            duckVolume * audioTypeMaps[type].volume
          )
        } else {
          this.state.screen[type].controls.unduck(4, audioTypeMaps[type].volume)
        }
      }
    })
  }

  //
  // BUDGET
  //
  updatePlayersLevel(level) {
    this.setState({
      players: {
        ...this.state.players,
        partyLevel: level,
      },
    }, () => this.savePlayersData())
  }

  savePlayersData() {
    fetch(`/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        players: this.state.players,
        pinned: this.state.pinned
      }),
    })
  }

  saveCampaignData() {
    fetch(`/campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state.campaign),
    })
  }

  //
  // NOTES
  //
  loadDocument(label, path) {
    if(this.state.notes.docs.find(doc => doc.path === path)) {
      this.setState({
        notes: {
          ...this.state.notes,
          docs: this.state.notes.docs.map(doc => doc.path === path ? { ...doc, loaded: true } : doc)
        }
      })
      return
    }

    fetch(campaignResource(path))
      .then((response) => response.text())
      .then((text) => {
        this.setState({
          notes: {
            ...this.state.notes,
            docs: [...this.state.notes.docs, { label, path, text, loaded: true }],
          },
        })
      })
  }

  saveDocument(path, text) {
    const formData = new FormData()
    const blob = new Blob([text], { type: 'text/plain' })

    formData.append('file', blob, path)

    fetch(`/resource`, {
      method: 'POST',
      body: formData,
    }).then((response) => {
      if (response.ok) {
        console.log('Document saved:', path)
      }
    })
  }

  closeDocument(path) {
    this.setState({
      notes: {
        ...this.state.notes,
        docs: this.state.notes.docs.map((d) => d.path === path ? { ...d, loaded: false } : d),
      },
    })
  }

  closeAllDocuments() {
    this.setState({
      notes: {
        ...this.state.notes,
        docs: [],
      },
    })
  }

  //
  // CARDS
  //
  addCard(name) {
    const card = this.state.campaign.cards.find((c) => c.name === name)
    if(this.state.notes.cards.find(c => c.name === card.name)) {
      return
    }
    this.setState({
      notes: {
        ...this.state.notes,
        cards: [...this.state.notes.cards, card],
      },
    })
  }

  addRule(id) {
    const [type, rule] = id.split('/')
    loadRule(type, rule).then((data) => {
      this.setState({
        notes: {
          ...this.state.notes,
          cards: [...this.state.notes.cards, data],
        },
      })
    })
  }

  updateCards(cards) {
    this.setState({
      notes: {
        ...this.state.notes,
        cards,
      },
    })
  }

  removeNotesCard(card) {
    this.setState({
      notes: {
        ...this.state.notes,
        cards: this.state.notes.cards.filter((c) => c !== card),
      },
    })
  }

  //
  // MODALS
  //
  showModal(modal) {
    this.setState({
      modals: {
        ...this.state.modals,
        [modal]: true,
      },
    })
  }

  hideModal(modal) {
    this.setState({
      modals: {
        ...this.state.modals,
        [modal]: false,
      },
    })
  }

  showImageViewerModal(url) {
    this.setState({
      modals: {
        ...this.state.modals,
        viewer: url,
      },
    })
  }

  hideImageViewerModal() {
    this.setState({
      modals: {
        ...this.state.modals,
        viewer: '',
      },
    })
  }

  togglePin(type, label, id) {
    if(this.isPinned(type, id)) {
      this.unpinItem(type, id)
    } else {
      this.pinItem(type, label, id)
    }
  }
  
  pinItem(type, label, id) {
    if(this.isPinned(type, id)) {
      return
    }
    this.setState({
      pinned: {
        ...this.state.pinned,
        [type]: [...this.state.pinned[type], { label, id }],
      },
    }, () => this.savePlayersData())
  }

  unpinItem(type, id) {
    this.setState({
      pinned: {
        ...this.state.pinned,
        [type]: this.state.pinned[type].filter(item => item.id !== id),
      },
    }, () => this.savePlayersData())
  }

  isPinned(type, id) {
    return this.state.pinned[type].find(item => item.id === id)
  }

  constructor(props) {
    super(props)
    this.state = {
      campaign: {
        name: '',
        description: '',
        id: '',
        images: [],
        bgms: [],
        ambiences: [],
        cards: [],
        docs: [],
        treasures: [],
      },
      players: {
        name: '',
        id: '',
        partyLevel: 1,
        characters: [],
        ledger: [],
      },
      screen: {
        images: {
          background: '',
          left: '',
          right: '',
          cover: true,
        },
        bgm: {
          label: '',
          controls: null,
          volume: 1,
        },
        ambience: {
          label: '',
          controls: null,
          volume: 1,
        },
        duckAudio: false,
      },
      notes: {
        cards: [],
        docs: [],
      },
      combat: {
        list: [],
        active: 0,
        inUse: false,
      },
      modals: {
        image: false,
        bgm: false,
        ambience: false,
        card: false,
        search: false,
        docs: false,
        viewer: '',
      },
      pinned: {
        images: [],
        bgm: [],
        ambience: [],
        rules: [],
        cards: [],
        docs: []
      }
    }

    // Get current campaign from cookie
    fetch(`/campaign`)
      .then((response) => response.json())
      .then((campaign) => {
        // Update state with loaded data
        const savedImages = getCookie('screenImages')
        const initiatives = getCookie('initiativeTracker')

        this.setState({
          campaign,
          screen: {
            ...this.state.screen,
            images: savedImages
              ? JSON.parse(savedImages)
              : this.state.screen.images,
          },
          combat: initiatives ? JSON.parse(initiatives) : this.state.combat,
        })
      })
      .catch((error) => {
        console.error('Error loading data from campaigns.json:', error)
      })

    fetch(`/players`)
      .then((response) => response.json())
      .then((data) => {
        const { pinned, players } = data
        this.setState({
          players,
          pinned
        }, () => {
          this.addPlayersToInitiativeList(this.state.players.characters)
        })
      })
      .catch((error) => {
        console.error('Error loading data from players.json:', error)
      })

    setInterval(() => {
      this.setState({
        screen: {
          ...this.state.screen,
          ...audioTypes.reduce(
            (updates, type, i) => ({
              ...updates,
              [type]: {
                ...this.state.screen[type],
                volume:
                  this.state.screen[type].controls !== null
                    ? this.state.screen[type].controls.volume() /
                      audioTypeMaps[type].volume
                    : this.globalVolume(type) / audioTypeMaps[type].volume,
              },
            }),
            {}
          ),
        },
      })
    }, 200)
  }

  componentDidUpdate() {
    feather.replace()
  }

  addCharacterToInitiative(card) {
    if (!card.stats.find((stat) => stat.name === 'HP')) {
      return
    }

    const filterConsumables = (consumables) => {
      const multiConsumables = /(.*)\s*\((\d+)\)/
      return consumables
        .map((consumable) => consumable.trim().toLowerCase())
        .filter((consumable) => consumable !== '')
        .reduce((acc, consumable) => {
          if (multiConsumables.test(consumable)) {
            const match = multiConsumables.exec(consumable)
            return [...acc, ...Array(Number(match[2])).fill(match[1])]
          } else {
            return [...acc, consumable]
          }
        }, [])
    }
    const getConsumables = (type) =>
      filterConsumables(
        card.stats.find((stat) => stat.name === type)?.text.split(',') ?? []
      )
    const getSpells = () => {
      const spellString =
        card.stats.find((stat) => stat.name === 'Spells')?.text ?? ''
      const spellStringsByLevel = /\*\*(?:[\w\d\s]+)\*\*([^;]*)(?:;|$)/g
      let spells = []
      let match
      while ((match = spellStringsByLevel.exec(spellString)) !== null) {
        spells = [...spells, ...match[1].split(',')]
      }
      return filterConsumables(spells)
    }

    const combat = { ...this.state.combat }
    combat.list.push(
      new InitiativeListItem(
        card.name,
        0,
        Number(card.stats.find((stat) => stat.name === 'HP').text ?? '0'),
        [...getConsumables('Items'), ...getSpells()]
      )
    )
    this.setState({
      combat,
    })
  }

  addPlayersToInitiativeList(characters) {
    const insert = characters
      .filter(
        (player) =>
          !this.state.combat.list.find((item) => item.name === player.name)
      )
      .map(
        (player) =>
          new InitiativeListItem(
            player.name,
            0,
            player.hp,
            [],
            `PER ${player.perception}`,
            true
          )
      )
    const combat = {
      ...this.state.combat,
      list: [...this.state.combat.list, ...insert],
    }
    this.setState({
      combat,
    })
  }

  updateInitiateTracker(data) {
    this.setState({
      combat: data,
    })
  }

  render() {
    const explorationImage = html`
    <div style="grid-area: image">
      <${ContentSection}
        label="Image"
        actions=${[
          {
            icon: this.state.screen.images.cover ? 'minimize' : 'maximize',
            onClick: () => this.toggleBackgroundCover(),
          },
        ]}
      >
        <div class="images-layout">
          ${imageLocations.map(
            (location) => html`
              <div class="${location}-container">
                <${FramedImage}
                  type=${location}
                  url=${campaignResource(this.state.screen.images[location])}
                  cover=${location === 'background'
                    ? this.state.screen.images.cover
                    : false}
                  onClick=${() => this.showModal(location)}
                  onModal=${(url) => () => this.showImageViewerModal(url)}
                />
              </div>
            `
          )}
        </div>
      </${ContentSection}>
    </div>    
    `

    const explorationAudio = html`
    <div style="grid-area: audio">
      <${ContentSection}
        label="Audio"
        actions=${[
          {
            icon: this.state.screen.duckAudio ? 'volume-2' : 'volume-x',
            onClick: () => this.toggleAudioDuck(),
          },
          {
            icon: 'square',
            onClick: () => this.stopAllAudio(),
          },
        ]}
      >
        <div class="audio-grid">
          ${audioTypes.map(
            (type) => html`
            <${LabeledItem} label=${audioTypeMaps[type].label}>
              <div onClick=${() => this.showModal(type)}>
                <div class="disabled-text">
                  <div
                    class="volume-slider ${
                      this.state.screen[type].volume >= 0.99 ||
                      this.state.screen[type].volume === 0
                        ? 'inactive'
                        : ''
                    }"
                    style=${`width: ${this.state.screen[type].volume * 100}%`}
                  >
                  </div>
                  <div class="audio-label">
                    ${
                      this.state.screen[type].label === ''
                        ? 'None'
                        : this.state.screen[type].label +
                          ' ' +
                          (this.state.screen[type].volume * 100).toFixed(0) +
                          '%'
                    }
                  </div>
                </div>
              </div>
            </${LabeledItem}>
          `
          )}
        </div>
      </${ContentSection}>
    </div>
    `

    const explorationTab = html`
      <h2 class="collapsible">Immersive Mode</h2>
      <div class="tab">
        <div class="tab-content immersive-mode-grid">
          ${explorationImage} ${explorationAudio}
        </div>
      </div>
    `

    const notesTab = html`
    <h2 class="collapsible">Notes</h2>
    <div class="tab">
      <div class="tab-content notes-grid">
        <${ContentSection}
          label="Documents"
          actions=${[
            {
              icon: 'plus',
              onClick: () => this.showModal('docs'),
            },
            {
              icon: 'x',
              onClick: () => this.closeAllDocuments(),
            },
          ]}
        >
          <${PinnedItemsList} 
            items=${
              this.state.pinned.docs
                .filter(item => !this.state.notes.docs.some(doc => doc.loaded && doc.path === item.id))
            }
            onClick=${item => this.loadDocument(item.label, item.id)}
            onUnpin=${id => this.unpinItem('docs', id)}
          />
          <div class="doc-grid">
            ${this.state.notes.docs.map(
              (doc) => html`
                <div class="doc-container ${doc.loaded ? '' : 'hidden'}">
                  <${MarkdownDocument}
                    loaded=${doc.loaded}
                    label=${doc.label}
                    path=${doc.path}
                    text=${doc.text}
                    onPreviewImage=${(url) => this.showImageViewerModal(url)}
                    onEdit=${(path, text) => this.saveDocument(path, text)}
                    onClose=${(path) => this.closeDocument(path)}
                  />
                </div>
              `
            )}
          </div>
        </${ContentSection}>
      </div>
    </div>    
    `

    const combatTab = html`
    <h2 class="collapsible">Combat</h2>
    <div class="tab">
      <div class="tab-content combat-grid">
          <${ContentSection}
          label="Reference Cards"
          actions=${[
            {
              icon: 'search',
              onClick: () => this.showModal('search'),
            },
            {
              icon: 'plus',
              onClick: () => this.showModal('card'),
            },
            {
              icon: 'x',
              onClick: () => this.updateCards([]),
            },
          ]}
        >
          <${PinnedItemsList}
            items=${this.state.pinned.cards}
            onUnpin=${id => this.unpinItem('cards', id)}
            onClick=${card => this.addCard(card.id)}
          />
          <${PinnedItemsList}
            items=${this.state.pinned.rules}
            onUnpin=${id => this.unpinItem('rules', id)}
            onClick=${rule => this.addRule(rule.id)}
          />
          <div class="card-grid">
            ${this.state.notes.cards.map(
              (card) => html`
              <div class="reference-card-frame">
              <${ContentSection}
                label=""
                actions=${[
                  {
                    icon: 'bookmark',
                    onClick: () => card.ref 
                      ? this.togglePin('rules', card.name, `${card.ref.type}/${card.ref.rule}`)
                      : this.togglePin('cards', card.name, card.name),
                  },
                  {
                    icon: 'log-in',
                    onClick: () => this.addCharacterToInitiative(card),
                  },
                  {
                    icon: 'x',
                    onClick: () => this.removeNotesCard(card),
                  },
                ]}
              >
                  <${Card} data=${card} onSearch=${query => this.addRule(`spells/${query}`)}/>
              </${ContentSection}>
              </div>
              `
            )}
          </div>
        </${ContentSection}>      
        <${ContentSection}
          label="Initiative Tracker"
          actions=${[
            {
              icon: 'plus',
              onClick: () => this.showModal('combatCards'),
            },
          ]}
        >
          <${InitiativeTracker}
            data=${this.state.combat}
            onUpdate=${(data) => this.updateInitiateTracker(data)}
          />
        </${ContentSection}>
      </div>
    </div>
    `

    const upkeepTab = html`
    <h2 class="collapsible">Upkeep</h2>
    <div class="tab">
      <div class="tab-content budget-grid">
        <div>
          <${BudgetTracker}
            id="party-budget"
            label="Party Ledger"
            level=${this.state.players.partyLevel}
            items=${this.state.players.ledger}
            trackDate=${true}

            onUpdateLevel=${(level) => {this.updatePlayersLevel(level)}}
            onAddLine=${(line) => {
              this.setState({
                players: {
                  ...this.state.players,
                  ledger: [...this.state.players.ledger, line],
                },
              }, () => this.savePlayersData())
            }}
            onDeleteLine=${(line) => {
              this.setState({
                players: {
                  ...this.state.players,
                  ledger: this.state.players.ledger.filter((l) => !deepCompare(rawLine(l), line)),
                },
              }, () => this.savePlayersData())
            }}
          />
          <strong>ACCQUIRED</strong>
          <${BudgetDisplay}
            budget=${countBudget(this.state.players.ledger, this.state.players.partyLevel, this.state.players.partyLevel)}
          />
        </div>
        <div>
          <${BudgetTracker}
            id="treasure-budget"
            label="Treasure by Level"
            level=${this.state.players.partyLevel}
            items=${this.state.campaign.treasures.map(line => ({
              ...line,
              used: this.state.players.ledger.some(l => {
                const { date, ...stripped } = l
                return deepCompare(stripped, line)
              })
            }))}

            onUpdateLevel=${(level) => {this.updatePlayersLevel(level)}}
            onAddLine=${(line) => {
              this.setState({
                campaign: {
                  ...this.state.campaign,
                  treasures: [...this.state.campaign.treasures, line],
                },
              }, () => this.saveCampaignData())
            }}
            onSendLine=${(line, date) => {
              this.setState({
                players: {
                  ...this.state.players,
                  ledger: [...this.state.players.ledger, { ...line, date }],
                },
              }, () => {
                this.savePlayersData()
              })
            }}
            onDeleteLine=${(line) => {
              this.setState({
                campaign: {
                  ...this.state.campaign,
                  treasures: this.state.campaign.treasures.filter((l) => !deepCompare(rawLine(l), line)),
                },
              }, () => this.saveCampaignData())
            }}
          />
          <div>
            <strong>SPENT</strong>
            <${BudgetDisplay}
              budget=${countBudget(this.state.campaign.treasures, this.state.players.partyLevel, this.state.players.partyLevel)}
            />
          </div>
          <div>
            <strong>REMAINING</strong>
            <${BudgetDisplay}
              budget=${
                calculateRemainder(
                  totalBudgetByLevel(this.state.players.partyLevel, this.state.players.characters.length),
                  countBudget(this.state.campaign.treasures, this.state.players.partyLevel, this.state.players.partyLevel)
                )              
              }
            />
          </div>
        </div>
      </div>
    </div>
    `
    return html`
      <div class="tabs">${explorationTab} ${notesTab} ${combatTab} ${upkeepTab}</div>

      ${imageLocations.map(
        (location) => html`
          ${this.state.modals[location] &&
          html`
            <${ImageSelectorModal}
              tags=${location === 'background' ? ['location', 'map'] : ['portrait', 'npc', 'item']}
              images=${this.state.campaign.images
                  .map(image => ({...image, pinned: this.isPinned('images', image.path)}))
              }
              onSelect=${(url) => this.showImage(location, url)}
              onPin=${(image) => this.togglePin('images', image.label, image.path)}
              onClose=${() => this.hideModal(location)}
            />
          `}
        `
      )}
      ${audioTypes.map(
        (type) => html`
          ${this.state.modals[type] &&
          html`
            <${FileSelectorModal}
              files=${this.state.campaign[audioTypeMaps[type].dataSource]
                .map(audio => ({...audio, pinned: this.isPinned(type, audio.path)}))
              }
              onSelect=${(label, path) =>
                this.startAudioLoop(type, label, path)}
              onPin=${(audio) => this.togglePin(type, audio.label, audio.path)}
              onSelectNone=${() => this.stopAudio(type)}
              onClose=${() => this.hideModal(type)}
            />
          `}
        `
      )}
      ${this.state.modals.card &&
      html`
        <${CardSelectorModal}
          cards=${this.state.campaign.cards}
          selectedCards=${this.state.notes.cards}
          onUpdate=${(cards) => this.updateCards(cards)}
          onClose=${() => this.hideModal('card')}
        />
      `}
      ${this.state.modals.search &&
      html`
        <${RulesSearchModal}
          onResult=${(result) =>
            this.updateCards([...this.state.notes.cards, result])}
          onClose=${() => this.hideModal('search')}
        />
      `}
      ${this.state.modals.docs &&
      html`
        <${FileSelectorModal}
          files=${this.state.campaign.docs.map(file => ({
            ...file, 
            pinned: this.isPinned('docs', file.path)
          }))}
          onPin=${(file) => this.togglePin('docs', file.label, file.path)}
          onSelect=${(label, path) => this.loadDocument(label, path)}
          onClose=${() => this.hideModal('docs')}
        />
      `}
      ${this.state.modals.combatCards &&
      html`
        <${CardSelectorModal}
          cards=${this.state.campaign.cards}
          selectedCards=${[]}
          onUpdate=${(cards) => this.addCharacterToInitiative(cards[0])}
          onClose=${() => this.hideModal('combatCards')}
        />
      `}
      ${this.state.modals.viewer &&
      html`
        <${ImageViewerModal}
          url=${this.state.modals.viewer}
          onClose=${() => this.hideImageViewerModal()}
        />
      `}
    `
  }
}

render(html`<${App} />`, document.querySelector('.page-content'))
