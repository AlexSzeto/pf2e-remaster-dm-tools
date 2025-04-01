import { Component, render } from 'preact'
import { html } from 'htm/preact'
import { ContentSection } from './content-section.js'
import { getCookie } from '../common/util.js'
import { FeatherIcon } from './feather-icon.js'

export class MarkdownDocument extends Component {
  editor = null

  constructor({ label, path, text, loaded, onEdit, onClose, onPreviewImage }) {
    super()
    this.state = { readonly: true }
  }

  enhanceMarkdownText(text) {
    const imageLinks =
      /(\!\[.+\]\()((?!https?:\/\/).+(?:\.jpg|\.jpeg|\.png|\.gif|\.webp)\))/g

    return text.replace(imageLinks, `$1/resource/$2`)
  }

  createImageLinks() {
    const previewElement = document.querySelector(
      `[data-path="${this.props.path}"] .preview`
    )
    const images = previewElement.querySelectorAll('img')

    images.forEach((image) => {
      const url = image.src
      const enhancedImage = document.createElement('div')
      image.parentElement.replaceChild(enhancedImage, image)
      render(
        html`
          <div class="album-image">
            <button
              class="outlined square top-left"
              onClick=${() => this.props.onPreviewImage(url)}
            >
              <${FeatherIcon} icon="zoom-in" />
            </button>
            <img src=${url} />
          </div>
        `,
        enhancedImage
      )
    })
  }

  updateText() {
    const componentElement = document.querySelector(
      `[data-path="${this.props.path}"]`
    )
    const previewElement = componentElement.querySelector('.preview')
    previewElement.innerHTML = marked.parse(
      this.enhanceMarkdownText(this.editor.getValue())
    )
    this.createImageLinks()
  }

  updateEditor() {
    const componentElement = document.querySelector(
      `[data-path="${this.props.path}"]`
    )
    const editorElement = componentElement.querySelector('.editor')
    const previewElement = componentElement.querySelector('.preview')

    this.editor = ace.edit(editorElement)
    const editor = this.editor
    editor.setAutoScrollEditorIntoView(true)
    editor.setTheme('ace/theme/solarized_light')
    editor.session.setMode('ace/mode/markdown')
    editor.setOption("showInvisibles", true)
    editor.commands.addCommand({
      name: 'exit',
      exec: () => this.setState({ readonly: true }),
      bindKey: { win: 'Esc', mac: 'Esc' },
    })
    const onEditorUpdate = () => {
      this.updateText()
    }
    editor.session.on('change', onEditorUpdate)
    this.updateText()
  }

  componentDidMount() {
    this.updateEditor()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.path !== this.props.path) {
        this.editor.setValue(this.props.text)
        this.updateEditor()
    } else {
      if(prevProps.loaded !== this.props.loaded && this.props.loaded) {
        this.setState({ readonly: true }, () => this.updateText())
      }
      if(prevProps.readonly !== this.props.readonly && !this.props.readonly) {
        this.updateEditor()
      }
    }
  }

  editOrSaveDocument() {
    if (this.state.readonly) {
      this.setState({ readonly: false }, () => this.updateEditor())
    } else {
      this.props.onEdit(this.props.path, this.editor.getValue())
      this.setState({ readonly: true })
    }
  }

  saveAndCloseDocument() {
    if (!this.state.readonly) {
      this.props.onEdit(this.props.path, this.editor.getValue())
    }
    requestAnimationFrame(() => this.props.onClose(this.props.path))
  }

  render() {
    return html`
      ${ this.props.loaded && html`
        <div data-path="${this.props.path}" class="markdown-document">
          <${ContentSection} label=${this.props.label} actions=${[
            {
              icon: this.state.readonly ? 'edit' : 'save',
              onClick: () => this.editOrSaveDocument(),
            },
            {
              icon: 'x',
              onClick: () => this.saveAndCloseDocument(),
            },
          ]}>
          <div class="text-container">
            <div class="preview ${this.state.readonly ? '' : 'hidden'}"></div>
            <pre class="editor ${this.state.readonly ? 'hidden' : ''}">${
              this.props.text
            }</pre>
          </div>
        </${ContentSection}>
      </div>
      `}
    `
  }
}
