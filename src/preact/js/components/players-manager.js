import { Component } from 'preact'
import { html } from 'htm/preact'

export class PlayersManager extends Component {
  constructor(props) {
    super(props)
    this.state = {
      folders: [],
      current: '',
    }
    this.loadPlayerGroups()
  }

  loadPlayerGroups() {
    fetch('./players/folders')
      .then((response) => response.json())
      .then((data) => {
        const nextState = {
          ...data,
        }
        this.setState(nextState)
        console.log(nextState)
      })
      .catch((error) => {
        console.error('Error loading players data:', error)
      })
  }

  createPlayerGroup(event) {
    event.preventDefault()
    const form = event.target
    const formData = new FormData(form)
    const name = formData.get('name')
    if (!name || name.length === 0) {
      return
    }
    fetch('./players/manage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
      .then(() => {
        this.loadPlayerGroups()
        form.reset()
      })
      .catch((error) => {
        console.error('Error creating player group:', error)
      })
  }

  setCurrentGroup(current) {
    this.setState({ current })
    fetch('./players/current', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ current }),
    }).catch((error) => {
      console.error('Error setting current player group:', error)
    })
  }

  render() {
    return html`
      <h1>Players</h1>
      <div class="subsection">
        <h2>Select</h2>
        <div class="subsection vertical-list">
          ${this.state.folders.map(
            (group) => html`
              <div>
                <a
                  href="#"
                  class=${group.id === this.state.current ? 'selected' : ''}
                  onClick=${() => this.setCurrentGroup(group.id)}
                >
                  ${group.name}
                </a>
              </div>
            `
          )}
        </div>
      </div>
      <div class="subsection">
        <h2>Create</h2>
        <div class="subsection">
          <form onSubmit=${this.createPlayerGroup.bind(this)}>
            <label>
              <input type="text" name="name" />
            </label>
            <button type="submit">Create</button>
          </form>
        </div>
      </div>
    `
  }
}
