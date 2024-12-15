import { html } from "htm/preact";

const extractResourceName = (name) => name.split('.')[0].split('-').slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

export const FileSelectorModal = ({files, onSelect, onClose}) => html`
  <div class="screen-overlay" onClick=${() => onClose()}>
    <div class="modal">
      <div class="file-selector">
        ${files.map(file => html`
          <div class="description">
            <a
              href="#"
              onClick=${(e) => {
                e.preventDefault()
                onSelect(file.label, file.path)
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