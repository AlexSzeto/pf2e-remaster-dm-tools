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
      labels: {
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
      },
      bgmControls: null,
      ambienceControls: null,
      duck: false,
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
        if (showImage) {
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
  
  getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  setCookie = (name, value) => {
    const date = new Date();
    date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days expiration
    const expires = "; expires=" + date.toUTCString();
    
    document.cookie = `${name}=${value || ""}${expires}; samesite=lax`;
  };
  
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
      labels: {
        ...this.state.labels,
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
    this.setCookie('dm-image', this.state.next.image);
  }

  clearImage() {
    this.setState({
      labels: {
        ...this.state.labels,
        image: '',
      },
      show: {
        ...this.state.show,
        image: '',
      },
    });
    this.setCookie('dm-image', this.state.next.image);
  }

  createAudioSource(path, fadeInDuration) {
    let audioContext = new AudioContext();
    let bufferSource = audioContext.createBufferSource();
    let gainNode = audioContext.createGain();
    bufferSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let request = new XMLHttpRequest();
    request.open('GET', path, true);
    request.responseType = 'arraybuffer';
    
    request.onload = function() {
        let audioData = request.response;
        audioContext.decodeAudioData(audioData, function(buffer) {
            bufferSource.buffer = buffer;
            bufferSource.loop = true;
            bufferSource.start(0);

            const currentTime = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(1, currentTime + fadeInDuration);            
        });
    };
    
    request.send();

    const end = (duration) =>{
      const currentTime = audioContext.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

      // Schedule stop and cleanup after fade out completes
      setTimeout(function() {
        bufferSource.stop();
        bufferSource.disconnect();
        gainNode.disconnect();
        bufferSource = null;
        gainNode = null;
        audioContext.close(); // Close the audio context if no longer needed
      }, (currentTime + duration) * 1000); // Convert seconds to milliseconds      
    }

    const duck = (duration, duckVolume) => {
      const currentTime = audioContext.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
      gainNode.gain.linearRampToValueAtTime(duckVolume, currentTime + duration);
    }

    const unduck = (duration) => {
      const currentTime = audioContext.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
      gainNode.gain.linearRampToValueAtTime(1, currentTime + duration);
    }

    return {
      end,
      duck,
      unduck
    };
  }

  loadLoop(type) {
    if(this.state[`${type}Controls`]) {
      this.state[`${type}Controls`].end(4);
    }

    const timeOut = this.state[`${type}Controls`] ? 6000 : 0

    setTimeout(() => {
      this.setState({
        labels: {
          ...this.state.labels,
          [type]: this.state.deck[`${type}s`].find(data => data.path === this.state.next[type]).label,
        },
        show: {
          ...this.state.show,
          [type]: this.state.next[type],
        },
        next: {
          ...this.state.next,
          [type]: '',
        },
        [`${type}Controls`]: this.createAudioSource(this.state.next[type], 8)
      });
    }, timeOut)
  }

  clearLoop(type) {
    if(this.state[`${type}Controls`]) {
      this.state[`${type}Controls`].end(4);
    }
    this.setState({
      labels: {
        ...this.state.labels,
        [type]: '',
      },
      show: {
        ...this.state.show,
        [type]: '',
      },
      [`${type}Controls`]: null
    });
  }  

  duckUnduckAudio() {
    if(this.state.duck) {
      if(this.state.bgmControls)
        this.state.bgmControls.unduck(4);
      if(this.state.ambienceControls)
        this.state.ambienceControls.unduck(4);
    } else {
      if(this.state.bgmControls)
        this.state.bgmControls.duck(1, 0.2);
      if(this.state.ambienceControls)
        this.state.ambienceControls.duck(1, 0.2);
    }
    this.setState({
      duck: !this.state.duck
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
            <span class="current-text">${this.state.labels.image !== '' ? this.state.labels.image : "None"}</span>
          </label>
        </div>
        <div>
          <label>
            <span class="label-text">BGM:</span>
            <span class="current-text">${this.state.labels.bgm !== '' ? this.state.labels.bgm : "None"}</span>
          </label>
        </div>
        <div>
          <label>
            <span class="label-text">Ambience:</span>
            <span class="current-text">${this.state.labels.ambience !== '' ? this.state.labels.ambience : "None"}</span>
          </label>
        </div>
        <div>
          <button onClick=${() => this.duckUnduckAudio()}>${this.state.duck ? "Unduck" : "Duck"}</button>
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
              name="bgm"
              value=${this.state.next.bgm}
              onChange=${(e) => this.handleNextChange(e)}
            >
              <option value="">None</option>
              ${this.state.deck.bgms.map((bgm) => html`
                <option value=${bgm.path}>${bgm.label}</option>
              `)}
            </select>
          <button onClick=${() => this.clearLoop("bgm")}>Clear</button>
          <button onClick=${() => this.loadLoop("bgm")}>Load</button>
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
              ${this.state.deck.ambiences.map((ambience) => html`
                <option value=${ambience.path}>${ambience.label}</option>
              `)}
            </select>
          <button onClick=${() => this.clearLoop("ambience")}>Clear</button>
          <button onClick=${() => this.loadLoop("ambience")}>Load</button>
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

