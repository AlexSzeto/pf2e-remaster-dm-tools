import { render, Component } from "preact";
import { html } from "htm/preact";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      decks: {},
      deckId: null,
      deck: {
        images: [],
        bgms: [],
        ambiences: [],
      },
      showLabel: {
        image: '',
        bgm: '',
        ambience: ''
      },
      show: {
        image: '',
        bgm: '',
        ambience: ''
      },
      next: {
        image: '',
        bgm: '',
        ambience: ''
      }
    };
  
    // Load data from decks.json
    fetch("../decks.json")
      .then((response) => response.json())
      .then((decks) => {
        // Update state with loaded data
        this.setState({
          decks,
          deckId: Object.keys(decks)[0],
          deck: decks[Object.keys(decks)[0]]
        });

        const showImage = this.getCookie('dm-image');
        if (studentData) {
          this.setState({
            show: {
              ...this.state.show,
              image: showImage,
            },
          });
        }
      })
      .catch((error) => {
        console.error("Error loading data from decks.json:", error);
      });
  }
  
  handleNextChange(e) {
    const { name, value } = e.target;
    this.setState({
      next: {
        ...this.state.next,
        [name]: value,
      }
    })
  }
  
  swapImage() {
    this.setState({
      showLabel: {
        ...this.state.showLabel,
        image: this.state.deck.images.find(data => data.path === this.state.next.image).label,
      },
      show: {
        ...this.state.show,
        image: this.state.next.image,
      },
      next: {
        ...this.state.next,
        image: '',
      }
    });
    
  }

  clearImage() {
    this.setState({
      showLabel: {
        ...this.state.showLabel,
        image: '',
      },
      show: {
        ...this.state.show,
        image: '',
      },
    });
  }

  render() {
    return html`
    <div>
      <h2>Deck Manager</h2>
      <label>
        <span class="label-text">Deck:</span>
        <select
          value=${this.state.deckId}
        >
          ${Object.keys(this.state.decks).map((deckId) => html`
            <option value=${deckId}>${deckId}</option>
          `)}
        </select>
      </label>
    </div>
    <div class="four-column">
      <div>
        <h2>Current</h2>
        <div>
          <label>
            <span class="label-text">Image:</span>
            <span class="current-text">${this.state.showLabel.image !== '' ? this.state.showLabel.image : "None"}</span>
          </label>
        </div>
        <div>
          <label>
            <span class="label-text">BGM:</span>
            <span class="current-text">${this.state.showLabel.bgm !== '' ? this.state.showLabel.bgm : "None"}</span>
          </label>
        </div>
        <div>
          <label>
            <span class="label-text">Ambience:</span>
            <span class="current-text">${this.state.showLabel.ambience !== '' ? this.state.showLabel.ambience : "None"}</span>
          </label>
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
              ${this.state.deck.images.map((image) => html`
                <option value=${image.path}>${image.label}</option>
              `)}
            </select>
          </label>
          <button onClick=${() => this.clearImage()}>Clear</button>
          <button onClick=${() => this.swapImage()}>Load</button>
        </div>
        <div>
          <label>
            <select
              value=${this.state.next.bgm}
            >
              <option value="">None</option>
              ${this.state.deck.bgms.map((bgm) => html`
                <option value=${bgm.path}>${bgm.label}</option>
              `)}
            </select>
          <button>Clear</button>
          <button>Load</button>
          </label>
        </div>
        <div>
          <label>
            <select
              value=${this.state.next.ambience}
            >
              <option value="">None</option>
              ${this.state.deck.ambiences.map((ambience) => html`
                <option value=${ambience.path}>${ambience.label}</option>
              `)}
            </select>
          <button>Clear</button>
          <button>Load</button>
          </label>
        </div>
      </div>
      <div>
        <h2>Showing</h2>
        <img class="preview-image" src=${this.state.show.image} />
      </div>
      <div>
        <h2>Next</h2>
        <img class="preview-image" src=${this.state.next.image} />
      </div>
    </div>
    `;
  }
}

render(html`<${App} />`, document.body);

