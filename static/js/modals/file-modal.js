import { html } from 'htm/preact'
import { Modal } from './../components/modal.js'

export const FileSelectorModal = ({
  files,
  onSelect,
  onSelectNone,
  onClose,
}) => html`
  <${Modal} onClose=${onClose}>
    <div class="file-selector">
      <div class="description">
        <a
          href="#"
          onClick=${(e) => {
            e.preventDefault()
            onSelectNone()
            onClose()
          }}
        >
          None
        </a>
      </div>
      ${files.map(
        (file) => html`
          <div class="description">
            <a
              href="#"
              onClick=${(e) => {
                e.preventDefault()
                onSelect(file.label, file.path)
                onClose()
              }}
            >
              ${file.label}
            </a>
          </div>
        `
      )}
    </div>
  </${Modal}>
`
