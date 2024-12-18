import { Component } from 'preact'
import { html } from 'htm/preact'

export class MarkdownDocument extends Component {

  constructor({label, path, text, onEdit}) {
    super()
    this.state = {
      label,
      path,
      text,
      readonly: false,
    }
  }

  updateEditor() {
    const componentElement = document.querySelector(`[data-path="${this.state.path}"]`)
    const editorElement = componentElement.querySelector('.editor')
    const previewElement = componentElement.querySelector('.preview')

    const editor = ace.edit(editorElement)
    editor.setTheme("ace/theme/twilight")
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

  render() {
    return html`
      <div data-path="${this.state.path}" class="markdown-document">
        <h3>${this.state.label}</h3>
        <div class="text-container">
          <div class="preview ${this.state.readonly ? '' : 'hidden'}"onClick=${() => this.setState({readonly: false})}></div>
          <pre class="editor ${this.state.readonly ? 'hidden' : ''}">${this.state.text}</pre>
        </div>
      </div>
    `
  }
}