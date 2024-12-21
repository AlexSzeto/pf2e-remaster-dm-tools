import { html } from "htm/preact";

export const FileSelectorModal = ({files, onSelect, onSelectNone, onClose}) => html`
  <div class="screen-overlay">
    <div class="close-overlay" onClick=${() => onClose()}>
    </div>
    <div class="modal">
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
        ${files.map(file => html`
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
        `)}
      </div>
    </div>
  </div>
`