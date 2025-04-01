import { render, Component } from 'preact'
import { html } from 'htm/preact'
import { FeatherIcon } from './components/feather-icon.js'

class InsertMediaForm extends Component {
  constructor() {
    super()
    this.state = {
      saving: false,      
      campaign: {
        name: '',
        description: '',
      },
      name: '',
      folder: '',
      options:[],
      preview: ''
    }
    fetch(`/campaign`)
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
            folder: 'images',
            options: [
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
            folder: 'audio',
            options: [
              { value: 'bgm', text: 'Background Music' },
              { value: 'ambience', text: 'Ambience' }
            ],
            preview: URL.createObjectURL(e.target.files[0])
          })
          break
        case 'md':
        case 'txt':
          this.setState({
            folder: 'docs',
            options: [
              { value: 'docs', text: 'Document' }
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
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}: ${value}`);
    // }
    fetch('./resource', {
      method: 'POST',
      body: formData
    }).then(() => {
      this.setState({
        saving: false,
        name: '',
        folder: '',
        options: [],
        preview: ''
      })
      form.reset()
    })
  }

  render() {
    return html`
    <div class="header">
      <h1 class="name">${this.state.campaign.name}</h1>
      <h2 class="description">${this.state.campaign.description}</h2>
      <h1 class="logo">PF2E Tools - Insert Campaign Media</h1>
    </div>
    <div class="page-content">
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
          <input type="hidden" name="folder" value=${this.state.folder} />          

          <div>
            <label for="folder">Type</label>
            <select disabled=${this.state.saving} name="type">
              ${this.state.options.map(option => html`
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
          ${this.state.folder==="images" && html`
            <img id="image-preview" src=${this.state.preview}/>
          `}
        </div>
      </div>
    </div>
    `
  }
}

render(
  html`<${InsertMediaForm} />`,
  document.body
)