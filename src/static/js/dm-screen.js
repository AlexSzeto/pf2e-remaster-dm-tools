import { render, Component } from 'preact'
import { html } from 'htm/preact'

import { ContentSection, LabeledItem } from './components/content-section.js'

import { getCookie, setCookie } from './common/util.js'
import { createAudioSource } from './common/audio.js'
import { loadRule } from './modals/rules-search-modal.js'

import { ImageSelectorModal } from './modals/image-selector-modal.js'
import { FileSelectorModal } from './modals/file-modal.js'
import { CardSelectorModal } from './modals/card-modal.js'
import { RulesSearchModal } from './modals/rules-search-modal.js'
import { ImageViewerModal } from './modals/image-viewer-modal.js'

import { Images } from './dm-modules/images.js'
import { Audio } from './dm-modules/audio.js'
import { Documents } from './dm-modules/documents.js'
import { Cards } from './dm-modules/cards.js'
import { Initiative } from './dm-modules/initiative-tracker.js'
import { Treasure } from './dm-modules/treasure.js'
import { InitiativeListItem } from './components/initiative-tracker.js'

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
              `/campaign/media/${url}`,
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
    fetch(`/players/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state.players),
    })
  }

  saveDMData() {
    fetch(`/dm/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state.dm),
    })
  }

  saveCampaignData() {
    fetch(`/campaign/data`, {
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

    fetch(`/campaign/media/${path}`)
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

    fetch(`/campaign/media`, {
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
      dm: {
        ...this.state.dm,
        pinned: {
          ...this.state.dm.pinned,
          [type]: [...this.state.dm.pinned[type], { label, id }],
        },
      }
    }, () => this.saveDMData())
  }

  unpinItem(type, id) {
    this.setState({
      dm: {
        ...this.state.dm,
        pinned: {
          ...this.state.dm.pinned,
          [type]: this.state.dm.pinned[type].filter(item => item.id !== id),
        },
      }
    }, () => this.saveDMData())
  }

  isPinned(type, id) {
    return this.state.dm.pinned[type].find(item => item.id === id)
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
        description: '',
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
        insertImage: false,
        insertName: false,
      },
      dm: {
        id: '',
        description: '',
        name: '',
        tiles: [],
        pinned: {
          images: [],
          bgm: [],
          ambience: [],
          rules: [],
          cards: [],
          docs: []
        }
      }
    }

    // Get current campaign from cookie
    Promise.all([
      fetch(`/campaign/data`),
      fetch(`/dm/data`),
      fetch(`/players/data`),
    ])
      .then(responses => Promise.all(responses.map(response => response.json())))
      .then(([campaign, dm, players]) => {

        console.log('Campaign loaded:', campaign)
        console.log('DM loaded:', dm)
        console.log('Players loaded:', players)

        // Update state with loaded data
        const savedImages = getCookie('screenImages')
        const initiatives = getCookie('initiativeTracker')

        this.setState({
          campaign,
          dm,
          players,
          screen: {
            ...this.state.screen,
            images: savedImages
              ? JSON.parse(savedImages)
              : this.state.screen.images,
          },
          combat: initiatives ? JSON.parse(initiatives) : this.state.combat,
        }, () => {
          console.log('state',this.state)
          this.addPlayersToInitiativeList(this.state.players.characters)
        })
      })
      .catch((error) => {
        console.error('Error loading data from campaigns.json:', error)
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
    const explorationTab = html`
      <h2 class="collapsible">Immersive Mode</h2>
      <div class="tab">
        <div class="tab-content immersive-mode-grid">
            <${Images} 
                images=${this.state.screen.images} 
                onShowImage=${(location, url) => this.showImage(location, url)}
                onToggleBackgroundCover=${() => this.toggleBackgroundCover()}
                onShowModal=${(modal) => this.showModal(modal)}
                onShowImageViewer=${(url) => this.showImageViewerModal(url)}
            />
            <${Audio} 
                screen=${this.state.screen} 
                onToggleAudioDuck=${() => this.toggleAudioDuck()}
                onStopAllAudio=${() => this.stopAllAudio()}
                onShowModal=${(modal) => this.showModal(modal)}
            />
        </div>
      </div>
    `

    const notesTab = html`
    <h2 class="collapsible">Notes</h2>
    <div class="tab">
      <div class="tab-content notes-grid">
        <${Documents} 
            docs=${this.state.notes.docs} 
            pinnedDocs=${this.state.dm.pinned.docs} 
            onLoadDocument=${(label, path) => this.loadDocument(label, path)}
            onSaveDocument=${(path, text) => this.saveDocument(path, text)}
            onCloseDocument=${(path) => this.closeDocument(path)}
            onCloseAllDocuments=${() => this.closeAllDocuments()}
            onUnpin=${(type, id) => this.unpinItem(type, id)}
            onShowModal=${(modal) => this.showModal(modal)}
            onShowImageViewer=${(url) => this.showImageViewerModal(url)}
            onContextAction=${(id, editor) => { 
                this.editor = editor 
                this.showModal(id)
            }}
        />
      </div>
    </div>    
    `

    const combatTab = html`
    <h2 class="collapsible">Combat</h2>
    <div class="tab">
      <div class="tab-content combat-grid">
        <${Cards} 
            cards=${this.state.notes.cards} 
            pinnedCards=${this.state.dm.pinned.cards} 
            pinnedRules=${this.state.dm.pinned.rules} 
            onAddCard=${(name) => this.addCard(name)}
            onAddRule=${(id) => this.addRule(id)}
            onUpdateCards=${(cards) => this.updateCards(cards)}
            onRemoveCard=${(card) => this.removeNotesCard(card)}
            onTogglePin=${(type, label, id) => this.togglePin(type, label, id)}
            onShowModal=${(modal) => this.showModal(modal)}
            onAddCharacterToInitiative=${(card) => this.addCharacterToInitiative(card)}
        />
        <${Initiative} 
            combat=${this.state.combat} 
            onUpdateInitiativeTracker=${(data) => this.updateInitiateTracker(data)}
            onShowModal=${(modal) => this.showModal(modal)}
        />
      </div>
    </div>
    `

    const upkeepTab = html`
    <h2 class="collapsible">Upkeep</h2>
    <div class="tab">
        <${Treasure} 
            players=${this.state.players} 
            campaign=${this.state.campaign} 
            onUpdatePlayersLevel=${(level) => this.updatePlayersLevel(level)}
            onUpdateLedger=${(ledger) => this.setState({ players: { ...this.state.players, ledger } }, () => this.savePlayersData())}
            onUpdateTreasures=${(treasures) => this.setState({ campaign: { ...this.state.campaign, treasures } }, () => this.saveCampaignData())}
            onSendTreasure=${(line, date) => {
                this.setState({
                  players: {
                    ...this.state.players,
                    ledger: [...this.state.players.ledger, { ...line, date }],
                  },
                }, () => {
                  this.savePlayersData()
                })
              }}
        />
    </div>
    `
    return html`
      <div class="tabs">${explorationTab} ${notesTab} ${combatTab} ${upkeepTab}</div>

      ${this.state.modals.insertImage &&
      html`
        <${ImageSelectorModal}
          images=${this.state.campaign.images
            .map(image => ({...image, pinned: this.isPinned('images', image.path)}))
          }
          onSelect=${(url) => {
            this.editor.session.insert(this.editor.getCursorPosition(), `![${url}](${url})`)
            this.hideModal('insertImage')
            this.editor.focus()
          }}
          onPin=${(image) => this.togglePin('images', image.label, image.path)}
          onClose=${() => this.hideModal('insertImage')}
        />
      `}
      ${['background', 'left', 'right'].map(
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

