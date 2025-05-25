import { render, Component } from 'preact'
import { html } from 'htm/preact'
import { Icon } from './components/icon.js'

const defaultState = {
      saving: false,      
      name: '',
      subtypes:[],
      tags:[],
      preview: ''
}

class InsertMediaForm extends Component {
  constructor() {
    super()
    this.state = {
      campaign: {
        name: '',
        description: '',
      },
      ...defaultState,
    }
    fetch(`/campaign/data`)
      .then((response) => response.json())
      .then((campaign) => { this.setState({ campaign }) })
  }

  updateTypeOptions(e) {
    if(e.target.files.length > 0) {
      const filename = e.target.files[0].name
      const name = filename.split('.').shift()

      if(!this.state.name) {
        this.setState({ name: name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') 
        })
      }

      const extension = filename.split('.').pop()
      switch(extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
          this.setState({ 
            subtypes: [
              { value: 'images', text: 'Image' },
            ],
            tags: [
              { value: 'portrait', text: 'Portrait' },
              { value: 'location', text: 'Location' },
              { value: 'item', text: 'Item'},
              { value: 'map', text: 'Map' },
              { value: 'battlemap', text: 'Battle Map' }
            ],
            preview: URL.createObjectURL(e.target.files[0]),
          })          
          break
        case 'mp3':
        case 'ogg':
        case 'wav':
          this.setState({
            subtypes: [
              { value: 'bgms', text: 'Background Music' },
              { value: 'ambiences', text: 'Ambience' },
            ],
            tags: [
              { value: 'looping', text: 'Looping' },
              { value: 'play-once', text: 'Play Once' },
            ],
            preview: URL.createObjectURL(e.target.files[0])
          })
          break
        case 'md':
        case 'txt':
          this.setState({
            subtypes: [
              { value: 'docs', text: 'Documents' },
            ],
            tags: [
              { value: 'docs', text: 'Document' },
            ],
            preview: URL.createObjectURL(e.target.files[0])
          })
          break
      }
    }
  }

  submitMedia(e) {
    e.preventDefault()
    this.setState({ saving: true })
    const form = e.target
    const formData = new FormData(form)
    console.log('Submitting media form', formData)

    const tags = [
      formData.get('baseTag'),
      ...(formData.get('tags')
        ? formData.get('tags').split(',').map(tag => tag.trim())
        : []
      )
    ]
    formData.set('tags', tags)
    formData.delete('baseTag')
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}: ${value}`);
    // }
    fetch('./campaign/media', {
      method: 'POST',
      body: formData
    }).then(() => {
      this.setState(defaultState)
      form.reset()
    })
  }

  render() {
    return html`
    <div class="flat-page">
      <h1>Insert Campaign Media</h1>
      <form id="media-form" onSubmit=${e => this.submitMedia(e)}>
        <div>
          <label for="name">Name</label>
          <input 
            disabled=${this.state.saving}
            type="text"
            name="name"
            placeholder="Name" 
            value=${this.state.name}
            onInput=${e => this.setState({ name: e.target.value })}
          />
        </div>
        <div>
          <label for="file">File</label>
          <input disabled=${this.state.saving} type="file" name="file" onChange=${e => this.updateTypeOptions(e)}/>
        </div>

        <div>
          <label for="subtype">Subtype</label>
          <select disabled=${this.state.saving} name="subtype">
            ${this.state.subtypes.map(option => html`
              <option value=${option.value}>${option.text}</option>
            `)}
          </select>
        </div>

        <div>
          <label for="baseTag">Tag</label>
          <select disabled=${this.state.saving} name="baseTag">
            ${this.state.tags.map(option => html`
              <option value=${option.value}>${option.text}</option>
            `)}
          </select>
        </div>

        <div>
          <label for="tags">Additional Tags</label>
          <input disabled=${this.state.saving} type="text" name="tags" placeholder="Tags" />
        </div>
        <button disabled=${this.state.saving} type="submit" disabled=${this.state.saving}>Save</button>
      </form>

      <div class="media-preview">
        ${this.state.type==="images" && html`
          <img id="image-preview" src=${this.state.preview}/>
        `}
      </div>
    </div>
    `
  }
}

render(html`<${InsertMediaForm} />`, document.querySelector('.page-content'))
