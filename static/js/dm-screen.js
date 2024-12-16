import { render, Component } from 'preact'
import { html } from 'htm/preact'
import { Card } from './components/card.js'
import {
  InitiativeListItem,
  InitiativeTracker,
} from './components/initiative-tracker.js'
import { campaignResource, getCookie, setCookie } from './common/util.js'
import { createAudioSource } from './common/audio.js'

import { ImageSelectorModal } from './components/image-modal.js'
import { FileSelectorModal } from './components/file-modal.js'
import { CardSelectorModal } from './components/card-modal.js'

const audioTypes = ['bgm', 'ambience']
const audioTypeToDataSource = {
  bgm: 'bgms',
  ambience: 'ambiences',
}
const duckVolume = 0.2

class App extends Component {
  //
  // IMAGE
  //
  showImage(url) {
    this.setState({
      screen: {
        ...this.state.screen,
        image: {
          url,
        },
      },
    })
    setCookie('dm-image', url)
  }

  //
  // AUDIO
  //
  get globalVolume() {
    return this.state.screen.duckAudio ? duckVolume : 1
  }

  startAudioLoop(type, label, url) {
    const start = (fadeInDuration) =>{
      this.setState({
        screen: {
          ...this.state.screen,
          [type]: {
            label,
            controls: createAudioSource(campaignResource(this.state.campaign.filename, url), fadeInDuration, this.globalVolume),
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
    })
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
          this.state.screen[type].controls.duck(1, duckVolume)
        } else {
          this.state.screen[type].controls.unduck(4)
        }
      }
    })
  }

  // 
  // NOTES
  //
  

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

  constructor(props) {
    super(props)
    this.state = {
      campaign: {
        name: '',
        description: '',
        filename: '',
        images: [],
        bgms: [],
        ambiences: [],
        cards: [],
      },
      screen: {
        image: {
          url: '',
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
        cards: []
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
      }
    }

    // Get current campaign from cookie
    const currentCampaign = getCookie('currentCampaign')

    // If current campaign is set, load it
    if (currentCampaign) {
      fetch(`/campaign/${currentCampaign}`)
        .then((response) => response.json())
        .then((campaign) => {
          console.log('Loaded campaign:', campaign)

          // Update state with loaded data
          this.setState({
            campaign,
          })

          const savedImage = getCookie('dm-image')
          if (savedImage) {
            this.showImage(savedImage)
          }

          const initiativeTracker = getCookie('initiativeTracker')
          if (initiativeTracker) {
            this.setState({
              initiativeTracker: JSON.parse(initiativeTracker),
            })
          }
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

  // addCardToView(andInitiatve = false) {
  //   const card = this.state.cards[this.state.previewCard]
  //   if (this.state.show.cards.includes(card)) {
  //     if (andInitiatve) {
  //       this.addCardToInitiative(
  //         this.state.show.cards.findIndex((c) => c === card)
  //       )
  //     }
  //     return
  //   }
  //   this.setState(
  //     {
  //       show: {
  //         ...this.state.show,
  //         cards: [...this.state.show.cards, card],
  //       },
  //     },
  //     () => {
  //       if (andInitiatve) {
  //         this.addCardToInitiative(this.state.show.cards.length - 1)
  //       }
  //     }
  //   )
  // }

  // addCardToInitiative(index) {
  //   const card = this.state.show.cards[index]

  //   if (!card.stats.find((stat) => stat.name === 'HP')) {
  //     return
  //   }

  //   const filterConsumables = (consumables) => {
  //     const multiConsumables = /(.*)\s*\((\d+)\)/
  //     return consumables
  //       .map((consumable) => consumable.trim().toLowerCase())
  //       .filter((consumable) => consumable !== '')
  //       .reduce((acc, consumable) => {
  //         if (multiConsumables.test(consumable)) {
  //           const match = multiConsumables.exec(consumable)
  //           return [...acc, ...Array(Number(match[2])).fill(match[1])]
  //         } else {
  //           return [...acc, consumable]
  //         }
  //       }, [])
  //   }
  //   const getConsumables = (type) =>
  //     filterConsumables(
  //       card.stats.find((stat) => stat.name === type)?.text.split(',') ?? []
  //     )
  //   const getSpells = () => {
  //     const spellString =
  //       card.stats.find((stat) => stat.name === 'Spells')?.text ?? ''
  //     const spellStringsByLevel = /\*\*(?:[\w\d\s]+)\*\*([^;]*)(?:;|$)/g
  //     let spells = []
  //     let match
  //     while ((match = spellStringsByLevel.exec(spellString)) !== null) {
  //       spells = [...spells, ...match[1].split(',')]
  //     }
  //     return filterConsumables(spells)
  //   }
  //   const initiativeTracker = { ...this.state.initiativeTracker }
  //   initiativeTracker.list.push(
  //     new InitiativeListItem(
  //       card.name,
  //       0,
  //       Number(card.stats.find((stat) => stat.name === 'HP').text ?? '0'),
  //       [...getConsumables('Items'), ...getSpells()]
  //     )
  //   )
  //   this.setState({
  //     initiativeTracker,
  //   })
  // }

  // updateInitiateTracker(data) {
  //   this.setState({
  //     initiativeTracker: data,
  //   })
  // }

  // dismissCard(index) {
  //   this.setState({
  //     show: {
  //       ...this.state.show,
  //       cards: this.state.show.cards.filter((card, i) => i !== index),
  //     },
  //   })
  // }

  render() {
    return html`
      <div>
        <h2>${this.state.campaign.name}</h2>
        <h3>${this.state.campaign.description}</h3>
      </div>
      <div class="tabs">
        <div class="tab">
          <h2>Immersive Mode</h2>
          <div class="immersive-mode-grid">
              <div style="grid-area: image"
                onClick=${() => this.showModal('image')}
              >
                ${this.state.screen.image.url === '' && html`
                  <button>Select Image</button>`}
                <img
                  class="preview-image"
                  src="${campaignResource(
                    this.state.campaign.filename,
                    this.state.screen.image.url
                  )}"
                />
              </div>
              <div style="grid-area: audio-duck" class="audio-grid">
                <span class="disabled-text">
                  ${this.state.screen.duckAudio ? 'Ducking Audio' : 'Not Ducking Audio'}
                </span>
                <button onClick=${() => this.toggleAudioDuck()}>
                  <span class=${this.state.screen.duckAudio ? '' : 'hidden'}>
                    <i data-feather="volume-x"></i>
                  </span>
                  <span class=${!this.state.screen.duckAudio ? '' : 'hidden'}>
                    <i data-feather="volume-2"></i>
                  </span>
                </button>
              </div>
              ${audioTypes.map((type) => html`
              <div style="grid-area: ${type}" class="audio-grid">
                <span
                  class="disabled-text"
                  onClick=${() => this.showModal(type)}
                >
                  <label>
                    ${this.state.screen[type].controls !== null && html`
                      <span>${Math.floor(this.state.screen[type].volume * 100)}% </span>
                    `}
                    ${this.state.screen[type].label === '' 
                      ? '(No Audio Selected)' 
                      : this.state.screen[type].label
                    }
                  </label>
                </span>
                <button
                  onClick=${() => this.stopAudio(type)}
                >
                  <i data-feather="square"></i>
                </button>
              </div>
              `)}
          </div>
        </div>

        <div class="tab">
          <h2>Notes</h2>
          <button onClick=${() => this.showModal('card')}>Add Card</button>
          <div class="notes-grid">
            <div class="card-grid">
              ${this.state.notes.cards.map((card) => html`
              <div class="card-container">
                <${Card} data=${card} />
              </div>
              `)}
            </div>
            <div>notes</div>
          </div>
        </div>

      </div>



      ${this.state.modals.image && html`
      <${ImageSelectorModal}
        campaign=${this.state.campaign.filename}
        images=${this.state.campaign.images.map((imageData) => imageData.path)}
        onSelect=${(url) => this.showImage(url)}
        onClose=${() => this.hideModal('image')}
      />
      `}

      ${audioTypes.map((type) => html`
      ${this.state.modals[type] && html`
      <${FileSelectorModal}
        files=${this.state.campaign[audioTypeToDataSource[type]]}
        onSelect=${(label, path) => this.startAudioLoop(type, label, path)}
        onClose=${() => this.hideModal(type)}
      />
      `}
      `)}

      ${this.state.modals.card && html`
      <${CardSelectorModal}
        cards=${this.state.campaign.cards}
        selectedCards=${this.state.notes.cards}
        onUpdate=${(cards) => this.setState({ notes: { cards } })}
        onClose=${() => this.hideModal('card')}
      />
      `}

    `
  }
}

render(html`<${App} />`, document.body)
