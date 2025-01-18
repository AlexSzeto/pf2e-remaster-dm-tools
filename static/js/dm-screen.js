import { render, Component } from 'preact'
import { html } from 'htm/preact'

import { ContentSection, LabeledItem } from './components/content-section.js'
import { FramedImage } from './components/framed-image.js'
import { FeatherIcon } from './components/feather-icon.js'

import { Card } from './components/card.js'
import {
  InitiativeListItem,
  InitiativeTracker,
} from './components/initiative-tracker.js'
import { campaignResource, getCookie, setCookie } from './common/util.js'
import { createAudioSource } from './common/audio.js'
import { MarkdownDocument } from './components/md-doc.js'

import { ImageSelectorModal } from './components/image-modal.js'
import { FileSelectorModal } from './components/file-modal.js'
import { CardSelectorModal } from './components/card-modal.js'
import { RulesSearchModal } from './components/rules-search-modal.js'

const imageLocations = ['background', 'left', 'right']
const audioTypes = ['bgm', 'ambience']
const audioTypeToDataSource = {
  bgm: 'bgms',
  ambience: 'ambiences',
}
const audioTypeToLabel = {
  bgm: 'Background Music',
  ambience: 'Ambience',
}

const duckVolume = 0.2

class App extends Component {
  //
  // IMAGE
  //
  showImage(location, url) {
    const images = location === 'background' 
      ? {
        background: url,
        left: '',
        right: '',
        cover: true,
      } : {
        ...this.state.screen.images,
        [location]: url,
      }

    this.setState({
      screen: {
        ...this.state.screen,
        images
      },
    })

    setCookie('screenImages', JSON.stringify(images))
  }

  toggleBackgroundCover() {
    this.setState({
      screen: {
        ...this.state.screen,
        images: {
          ...this.state.screen.images,
          cover: !this.state.screen.images.cover,
        },
      },
    }, () => setCookie('screenImages', JSON.stringify(this.state.screen.images)))    
  }
  
  //
  // AUDIO
  //
  get globalVolume() {
    return this.state.screen.duckAudio ? duckVolume : 1
  }

  startAudioLoop(type, label, url) {
    if(url === '') {
      this.stopAudio(type)
      return
    }

    const start = (fadeInDuration) =>{
      this.setState({
        screen: {
          ...this.state.screen,
          [type]: {
            label,
            controls: createAudioSource(campaignResource(this.state.campaign.id, url), fadeInDuration, this.globalVolume),
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
        ...audioTypes.reduce((updates, type) => ({
          ...updates,
          [type]: {
            label: '',
            controls: null,
          },
        }), {})
      },
    })
  }

  stopAudio(type) {
    if (this.state.screen[type].controls !== null) {
      this.state.screen[type].controls.end(4)
    }
    this.setState({
      screen: {
        ...this.state.screen,
        [type]: {
          label: '',
          controls: null,
        },
      },
    }, () => feather.replace())
  }

  toggleAudioDuck() {
    const duckAudio = !this.state.screen.duckAudio
    this.setState({
      screen: {
        ...this.state.screen,
        duckAudio
      },
    })

    audioTypes.forEach((type) => {
      if (this.state.screen[type].controls !== null) {
        if (duckAudio) {
          this.state.screen[type].controls.duck(1, 0.2)
        } else {
          this.state.screen[type].controls.unduck(4)
        }
      }
    })
  }
  
  // 
  // NOTES
  //
  loadDocument(label, path) {
    fetch(campaignResource(this.state.campaign.id, path))
      .then((response) => response.text())
      .then((text) => {
        this.setState({
          notes: {
            ...this.state.notes,
            docs: [...this.state.notes.docs, { label, path, text }],
          },
        })
      })
  }

  saveDocument(path, text) {
    const formData = new FormData()
    const blob = new Blob([text], { type: 'text/plain' })

    formData.append('file', blob, path)

    fetch(`/campaign-resource/${this.state.campaign.id}/docs`, {
      method: 'POST',
      body: formData,
    })
    .then((response) => {
      if (response.ok) {
        console.log('Document saved:', path)
      }
    })
  }

  closeDocument(path) {
    this.setState({
      notes: {
        ...this.state.notes,
        docs: this.state.notes.docs.filter((d) => d.path !== path),
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
    console.log('showing modal:', modal)
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
        docs: []
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
      }
    }

    // Get current campaign from cookie
    const currentCampaign = getCookie('currentCampaign')

    // If current campaign is set, load it
    if (currentCampaign) {
      fetch(`/campaign/${currentCampaign}`)
        .then((response) => response.json())
        .then((campaign) => {

          // Update state with loaded data
          const savedImages = getCookie('screenImages')
          const initiatives = getCookie('initiativeTracker')

          this.setState({
            campaign,
            screen: {
              ...this.state.screen,
              images: savedImages ? JSON.parse(savedImages) : this.state.screen.images,
            },
            combat: initiatives ? JSON.parse(initiatives) : this.state.combat,
          })
        })
        .catch((error) => {
          console.error('Error loading data from campaigns.json:', error)
        })
    }

    setInterval(() => {
      this.setState({
        screen: {
          ...this.state.screen,
          ...audioTypes.reduce((updates, type, i) => ({
            ...updates,
            [type]: {
              ...this.state.screen[type],
              volume: (this.state.screen[type].controls !== null)
                ? this.state.screen[type].controls.volume()
                : this.globalVolume,
            },
          }), {}),
        },
      })
    }, 200);
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
            onClick: () => this.toggleBackgroundCover()
          }
        ]}
      >
        <div class="images-layout">
          ${imageLocations.map((location) => html`
            <div class="${location}-container">
            <${FramedImage}
              type=${location}
              url=${campaignResource(
                this.state.campaign.id,
                this.state.screen.images[location]
              )}
              cover=${location === 'background' ? this.state.screen.images.cover : false}
              onClick=${() => this.showModal(location)}
            />
            </div>
          `)}
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
            onClick: () => this.toggleAudioDuck()
          },
          {
            icon: 'square',
            onClick: () => this.stopAllAudio()
          }
        ]}
      >
        <div class="audio-grid">
          ${audioTypes.map((type) => html`
            <${LabeledItem} label=${audioTypeToLabel[type]}>
              <div onClick=${() => this.showModal(type)}>
                <div class="disabled-text">
                  <div
                    class="volume-slider ${
                      this.state.screen[type].volume === 1.0
                      || this.state.screen[type].volume === 0
                      ? 'inactive' : ''}"
                    style=${`width: ${this.state.screen[type].volume * 100}%`}
                  >
                  </div>
                  <div class="audio-label">
                    ${this.state.screen[type].label === ''
                      ? 'None' 
                      : this.state.screen[type].label
                    }
                  </div>
                </div>
              </div>
            </${LabeledItem}>
          `)}
        </div>
      </${ContentSection}>
    </div>
    `

    const explorationTab = html`
    <h2 class="collapsible">Immersive Mode</h2>
    <div class="tab">
      <div class="tab-content immersive-mode-grid">
        ${explorationImage}
        ${explorationAudio}
      </div>
    </div>
    `

    const notesTab = html`
    <h2 class="collapsible">Notes</h2>
    <div class="tab">
      <div class="tab-content notes-grid">
        <${ContentSection}
          label="Reference Cards"
          actions=${[
            {
              icon: 'search',
              onClick: () => this.showModal('search')
            },
            {
              icon: 'plus',
              onClick: () => this.showModal('card')
            },
            {
              icon: 'x',
              onClick: () => this.updateCards([])
            }
          ]}
        >
          <div class="card-grid">
            ${this.state.notes.cards.map((card) => html`
              <div class="reference-card-frame">
              <${ContentSection}
                label=""
                actions=${[
                  {
                    icon: 'x',
                    onClick: () => this.removeNotesCard(card)
                  }
                ]}
              >
                  <${Card} data=${card} />
              </${ContentSection}>
              </div>
              `)}
          </div>
        </${ContentSection}>

        <${ContentSection}
          label="Documents"
          actions=${[
            {
              icon: 'plus',
              onClick: () => this.showModal('docs')
            },
            {
              icon: 'x',
              onClick: () => this.closeAllDocuments()
            },
          ]}
        >
          <div class="doc-grid">
            ${this.state.notes.docs.map((doc) => html`
            <div class="doc-container">
              <${MarkdownDocument} 
                label=${doc.label}
                path=${doc.path}
                text=${doc.text}
                onEdit=${(path, text) => this.saveDocument(path, text)}
                onClose=${(path) => this.closeDocument(path)}
              />
            </div>
            `)}
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
          label="Initiative Tracker"
          actions=${[
            {
              icon: 'plus',
              onClick: () => this.showModal('combatCards')
            }
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

    return html`
      <div class="header">
        <h1 class="name">${this.state.campaign.name}</h1>
        <h2 class="description">${this.state.campaign.description}</h2>
        <h1 class="logo">PF2E Tools - DM Screen</h1>
      </div>
      <div class="page-content">
        <div class="tabs">
          ${explorationTab}
          ${notesTab}
          ${combatTab}
        </div>
      </div>


      ${imageLocations.map((location) => html`
        ${this.state.modals[location] && html`
          <${ImageSelectorModal}
            campaign=${this.state.campaign.id}
            images=${this.state.campaign.images.map((imageData) => imageData.path)}
            onSelect=${(url) => this.showImage(location, url)}
            onClose=${() => this.hideModal(location)}
          />
        `}
      `)}

      ${audioTypes.map((type) => html`
        ${this.state.modals[type] && html`
          <${FileSelectorModal}
            files=${this.state.campaign[audioTypeToDataSource[type]]}
            onSelect=${(label, path) => this.startAudioLoop(type, label, path)}
            onSelectNone=${() => this.stopAudio(type)}
            onClose=${() => this.hideModal(type)}
          />
        `}
      `)}

      ${this.state.modals.card && html`
      <${CardSelectorModal}
        cards=${this.state.campaign.cards}
        selectedCards=${this.state.notes.cards}
        onUpdate=${(cards) => this.updateCards(cards)}
        onClose=${() => this.hideModal('card')}
      />
      `}

      ${this.state.modals.search && html`
      <${RulesSearchModal}
        onResult=${(result) => this.updateCards([...this.state.notes.cards, result])}
        onClose=${() => this.hideModal('search')}
      />
      `}

      ${this.state.modals.docs && html`
      <${FileSelectorModal}
        files=${this.state.campaign.docs}
        onSelect=${(label, path) => this.loadDocument(label, path)}
        onClose=${() => this.hideModal('docs')}
      />
      `}

      ${this.state.modals.combatCards && html`
        <${CardSelectorModal}
          cards=${this.state.campaign.cards}
          selectedCards=${[]}
          onUpdate=${(cards) => this.addCharacterToInitiative(cards[0])}
          onClose=${() => this.hideModal('combatCards')}
        />
      `}
  
  
    `
  }
}

render(html`<${App} />`, document.body)
