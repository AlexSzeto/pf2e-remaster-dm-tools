import { html } from 'htm/preact'
import { campaignResource } from '../common/util.js'
import { Modal } from './../components/modal.js'

const extractResourceName = (name) =>
  name
    .split('.')[0]
    .split('-')
    .slice(1)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const ImageSelectorModal = ({
  campaign,
  images,
  onSelect,
  onClose,
}) => html`
  <${Modal} onClose=${onClose}>
    <div class="image-selector">
      <div class="image-container" onClick=${() => {
        onSelect('')
        onClose()
      }}>
        <div class="description">
          <span>None</span>
          <div class="blank"></div>
        </div>
      </div>
      ${images.map(
        (image) => html`
          <div class="image-container">
            <div class="description">
              <span>${extractResourceName(image)}</span>
            </div>
            <img
              class="image"
              src="${campaignResource(campaign, image)}"
              onClick=${() => {
                onSelect(image)
                onClose()
              }}
            />
          </div>
        `
      )}
    </div>
  </${Modal}>
`
