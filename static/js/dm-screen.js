import { render, Component } from 'preact'
import { html } from 'htm/preact'
import { Card } from './components/card.js'
import {
  InitiativeListItem,
  InitiativeTracker,
} from './components/initiative-tracker.js'
import { campaignResource, getCookie, setCookie } from './common/util.js'
import { ImageSelector } from './components/image-modal.js'
import { createAudioSource } from './common/audio.js'

class App extends Component {
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
        },
        ambience: {
          label: '',
          controls: null,
        },
        duckAudio: false,
      },
      notes: {
        active: []
      },
      // labels: {
      //   image: '',
      //   bgm: '',
      //   ambience: '',
      // },
      // show: {
      //   image: '',
      //   bgm: '',
      //   ambience: '',
      //   cards: [],
      // },
      // next: {
      //   image: '',
      //   bgm: '',
      //   ambience: '',
      // },

      // cards: [],
      // bgmControls: null,
      // ambienceControls: null,
      // duck: false,
      // previewCard: null,
      combat: {
        list: [],
        active: 0,
        inUse: false,
      },

      modals: {
        image: false,
      }
      // showImageModal: true,
    }

    // Get current campaign from cookie
    const currentCampaign = getCookie('currentCampaign')

    // If current campaign is set, load it
    if (currentCampaign) {
      fetch(`/campaign/${currentCampaign}`)
        .then((response) => response.json())
        .then((campaign) => {
          // Update state with loaded data
          this.setState({
            campaign,
            cards: campaign.cards,
          })

          const showImage = getCookie('dm-image')
          if (showImage) {
            this.setState({
              show: {
                ...this.state.show,
                image: showImage,
              },
            })
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
  }

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

  startAudioLoop(type, label, url) {
    const start = () =>{
      this.setState({
        screen: {
          ...this.state.screen,
          [type]: {
            label,
            controls: createAudioSource(url, 8),
          },
        },
      })
    }

    if (this.state.screen[type].controls !== null) {
      this.state.screen[type].controls.end(4)
      setTimeout(start(), 6000)
    } else {
      start()
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

    ['bgm', 'ambience'].forEach((type) => {
      if (this.state.screen[type].controls !== null) {
        if (duckAudio) {
          this.state.screen[type].controls.duck(1, 0.2)
        } else {
          this.state.screen[type].controls.unduck(4)
        }
      }
    })
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
      <div class="four-column">
        <div>
          <h2>Now Showing/Playing</h2>
          <div>
            <label>
              <span class="label-text">Image:</span>
              <span class="disabled-text"
                ><span
                  >${this.state.labels.image !== ''
                    ? this.state.labels.image
                    : 'None'}</span
                ></span
              >
            </label>
          </div>
          <div>
            <label>
              <span class="label-text">BGM:</span>
              <span class="disabled-text"
                ><span
                  >${this.state.labels.bgm !== ''
                    ? this.state.labels.bgm
                    : 'None'}</span
                ></span
              >
            </label>
          </div>
          <div>
            <label>
              <span class="label-text">Ambience:</span>
              <span class="disabled-text"
                ><span
                  >${this.state.labels.ambience !== ''
                    ? this.state.labels.ambience
                    : 'None'}</span
                ></span
              >
            </label>
          </div>

          <h2>Controls</h2>
          <div>
            <button onClick=${() => this.duckUnduckAudio()}>
              ${this.state.duck ? 'Unduck' : 'Duck'}
            </button>
          </div>
        </div>
        <div>
          <h2>Next</h2>
          <div>
            <label>
              <select
                name="image"
                value=${this.state.next.image}
                onChange=${(e) => this.handleNextChange(e)}
              >
                <option value="">None</option>
                ${this.state.campaign.images.map(
                  (image) => html`
                    <option value=${image.path}>${image.label}</option>
                  `
                )}
              </select>
              <button onClick=${() => this.clearImage()}>Clear</button>
              <button onClick=${() => this.swapImage()}>Load</button>
            </label>
          </div>
          <div>
            <label>
              <select
                name="bgm"
                value=${this.state.next.bgm}
                onChange=${(e) => this.handleNextChange(e)}
              >
                <option value="">None</option>
                ${this.state.campaign.bgms.map(
                  (bgm) => html`
                    <option value=${bgm.path}>${bgm.label}</option>
                  `
                )}
              </select>
              <button onClick=${() => this.clearLoop('bgm')}>Clear</button>
              <button onClick=${() => this.loadLoop('bgm')}>Load</button>
            </label>
          </div>
          <div>
            <label>
              <select
                name="ambience"
                value=${this.state.next.ambience}
                onChange=${(e) => this.handleNextChange(e)}
              >
                <option value="">None</option>
                ${this.state.campaign.ambiences.map(
                  (ambience) => html`
                    <option value=${ambience.path}>${ambience.label}</option>
                  `
                )}
              </select>
              <button onClick=${() => this.clearLoop('ambience')}>Clear</button>
              <button onClick=${() => this.loadLoop('ambience')}>Load</button>
            </label>
          </div>
        </div>
        <div>
          <h2>DM Screen Image</h2>
          <a href="#" onClick=${() => this.setState({ showImageModal: true })}>
            <img
              class="preview-image"
              src="${campaignResource(
                this.state.campaign.filename,
                this.state.show.image
              )}"
            />
          </a>
        </div>
        <div>
          <h2>Next Image Preview</h2>
          <img
            class="preview-image"
            src="${campaignResource(
              this.state.campaign.filename,
              this.state.next.image
            )}"
          />
        </div>
      </div>

      <h2>
        Initiative Tracker
        (${this.state.initiativeTracker.inUse ? 'Active' : 'Inactive'})
      </h2>
      <div>
        <${InitiativeTracker}
          data=${this.state.initiativeTracker}
          updateData=${(data) => this.updateInitiateTracker(data)}
        />
      </div>

      <h2>Cards</h2>
      <div>
        <label>
          <select
            name="card"
            value=${this.state.previewCard}
            onChange=${(e) => this.setState({ previewCard: e.target.value })}
          >
            ${this.state.cards.map(
              (card, index) => html`
                <option value=${index}>${card.name}</option>
              `
            )}
          </select>
          <button onClick=${() => this.addCardToView()}>View</button>
          <button onClick=${() => this.addCardToView(true)}>Add</button>
        </label>
      </div>
      <div class="dm-card-grid">
        ${this.state.show.cards.map(
          (card, index) => html`
            <div class="campaign-card-frame">
              <button
                class="campaign-card-insert square"
                onClick=${() => this.addCardToInitiative(index)}
              >
                <div>＋</div>
              </button>
              <button
                class="campaign-card-dismiss square"
                onClick=${() => this.dismissCard(index)}
              >
                <div>✖</div>
              </button>
              <${Card} data=${card} />
            </div>
          `
        )}
      </div>
      ${this.state.showImageModal && html`
      <${ImageSelector}
        campaign=${this.state.campaign.filename}
        images=${this.state.campaign.images.map((imageData) => imageData.path)}
        onSelect=${(image) =>
          this.setState({ show: { ...this.state.show, image } })}
        onClose=${() => this.setState({ showImageModal: false })}
      />
      `}      
    `
  }
}

render(html`<${App} />`, document.body)
