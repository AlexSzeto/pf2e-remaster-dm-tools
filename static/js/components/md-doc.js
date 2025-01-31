import { Component, render } from 'preact'
import { html } from 'htm/preact'
import { ContentSection } from './content-section.js'
import { getCookie } from '../common/util.js'
import { FeatherIcon } from './feather-icon.js'

export class MarkdownDocument extends Component {

  constructor({label, path, text, onEdit, onClose, onPreviewImage}) {
    super()

    const currentCampaign = getCookie('currentCampaign')
    this.state = {
      label,
      path,
      text,
      readonly: true,
      currentCampaign,
    }
  }

  enhanceMarkdownText(text) {
    const imageLinks = /(\!\[.+\]\()((?!https?:\/\/).+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)\))/g

    return text.replace(imageLinks, `$1/campaign-resource/${this.state.currentCampaign}/$2`)
  }

  createImageLinks() {
    const previewElement = document.querySelector(`[data-path="${this.state.path}"] .preview`)
    const images = previewElement.querySelectorAll('img')

    images.forEach(image => {
      const url = image.src
      const enhancedImage = document.createElement('div')
      image.parentElement.replaceChild(enhancedImage, image)
      render(html`
        <div class="album-image">
          <button class="square top-left" onClick=${() => this.props.onPreviewImage(url)}>
            <${FeatherIcon} icon="zoom-in" />
          </button>
          <img src=${url} />
        </div>
      `, enhancedImage)
    })
  }

  updateEditor() {
    const componentElement = document.querySelector(`[data-path="${this.state.path}"]`)
    const editorElement = componentElement.querySelector('.editor')
    const previewElement = componentElement.querySelector('.preview')

    const editor = ace.edit(editorElement)
    editor.setTheme("ace/theme/solarized_light")
    editor.session.setMode("ace/mode/markdown")
    editor.commands.addCommand({
      name: 'exit',
      exec: () => this.setState({readonly: true}),
      bindKey: {win: 'Esc', mac: 'Esc'},
    })
    const updateText = () => {
      previewElement.innerHTML = marked.parse(this.enhanceMarkdownText(editor.getValue()))
      this.createImageLinks()
      this.setState({text: editor.getValue()})
    }
    editor.session.on('change', updateText);
    previewElement.innerHTML = marked.parse(this.enhanceMarkdownText(editor.getValue()))
    this.createImageLinks()
  }

  componentDidMount() {
    this.updateEditor()
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.readonly !== this.state.readonly && !this.state.readonly) {
      this.updateEditor()
    }
  }

  editOrSaveDocument() {
    if(this.state.readonly) {
      this.setState({readonly: false})
    } else {
      this.props.onEdit(this.state.path, this.state.text)
      this.setState({readonly: true})
    }
  }

  saveAndCloseDocument() {
    if(!this.state.readonly) {
      this.props.onEdit(this.state.path, this.state.text)
    }
    requestAnimationFrame(() => this.props.onClose(this.state.path))
  }

  render() {
    return html`
      <div data-path="${this.state.path}" class="markdown-document">
        <${ContentSection} label=${this.state.label} actions=${[
          {
            icon: this.state.readonly ? 'edit' : 'save',
            onClick: () => this.editOrSaveDocument()
          },
          {
            icon: 'x',
            onClick: () => this.saveAndCloseDocument()
          }
        ]}>
          <div class="text-container">
            <div class="preview ${this.state.readonly ? '' : 'hidden'}"></div>
            <pre class="editor ${this.state.readonly ? 'hidden' : ''}">${this.state.text}</pre>
          </div>
        </${ContentSection}>
      </div>
    `
  }
}