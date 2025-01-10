import { Component } from 'preact'
import { html } from 'htm/preact'
import { ContentSection } from './content-section.js'

export class MarkdownDocument extends Component {

  constructor({label, path, text, onEdit, onClose}) {
    super()
    this.state = {
      label,
      path,
      text,
      readonly: true,
    }
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
      previewElement.innerHTML = marked.parse(editor.getValue());
      this.setState({text: editor.getValue()})
    }
    editor.session.on('change', updateText);
    previewElement.innerHTML = marked.parse(editor.getValue());
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
    this.props.onClose(this.state.path)
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