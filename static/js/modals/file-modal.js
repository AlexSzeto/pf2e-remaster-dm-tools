import { html } from 'htm/preact'
import { Modal } from './../components/modal.js'
import { PinButton } from '../components/pinned-items-list.js'

export const FileSelectorSection = ({
  files,
  onPin,
  onSelect,
  onClose,
}) => html`
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
      <${PinButton} outlined=${false} isPinned=${file.pinned} onClick=${() => onPin(file)} />
    </div>
  `
)}
`

export const FileSelectorModal = ({
  files,
  onPin,
  onSelect,
  onSelectNone,
  onClose,
}) => html`
  <${Modal} onClose=${onClose}>
    <div class="file-selector">
      ${files.some(file => file.pinned) && html`
        <h4>Pinned</h4>
        <div class="grid">
          <${FileSelectorSection} files=${files.filter((file) => file.pinned)} onPin=${onPin} onSelect=${onSelect} onClose=${onClose} />
        </div>
      `}
      <h4>Unpinned</h4>
      <div class="grid">
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
        <${FileSelectorSection} files=${files.filter((file) => !file.pinned)} onPin=${onPin} onSelect=${onSelect} onClose=${onClose} />
      </div>
    </div>
  </${Modal}>
`
