import { html } from 'htm/preact'
import { campaignResource } from '../common/util.js'
import { Modal } from './../components/modal.js'
import { PinButton } from '../components/pinned-items-list.js'
import { Icon } from './../components/Icon.js'

const ImageSelectorList = ({
  images,
  onPin,
  onSelect,
  onClose,
}) => html`
${images
  .map(image => html`
    <div class="selector-container">
      <div class="description">
        ${image.label}
      </div>
      <div class="image-container">
        <div class="image"
          style=${{
            backgroundImage: `url(${campaignResource(image.path)})`,
          }}
          onClick=${() => {
            onSelect(image.path)
            onClose()
          }}
        >
        </div>
        <${PinButton} outlined=$[true] isPinned=${image.pinned} onClick=${() => {
          onPin(image)
        }} />
      </div>
    </div>
  `)
}
`

export const ImageSelectorModal = ({
  tags,
  images,
  onPin,
  onSelect,
  onClose,
}) => html`
  <${Modal} onClose=${onClose}>
    <div class="image-selector">
      ${images.some(image => image.pinned) && html`
        <h4>Pinned</h4>
        <div class="grid">
          <${ImageSelectorList}
            images=${images
            .filter(image => image.pinned)
            .filter(image => !tags || tags.some(tag => image.path.indexOf(tag) !== -1))
            }
            onPin=${onPin}
            onSelect=${onSelect}
            onClose=${onClose}
          />
        </div>
      `}
      <h4>Unpinned</h4>
      <div class="grid">
        <div class="selector-container" onClick=${() => {
          onSelect('')
          onClose()
        }}>
          <div class="description">
            <span>None</span>
            <div class="blank"></div>
          </div>
        </div>
        <${ImageSelectorList}
          images=${images
          .filter(image => !image.pinned)
          .filter(image => !tags || tags.some(tag => image.path.indexOf(tag) !== -1))
          }
          onPin=${onPin}
          onSelect=${onSelect}
          onClose=${onClose}
        />
      </div>
    </div>
  </${Modal}>
`
