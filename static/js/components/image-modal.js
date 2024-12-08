import { html } from "htm/preact";
import { campaignResource } from "../common/util.js";

const extractResourceName = (name) => name.split('.')[0].split('-').slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

export const ImageSelector = ({campaign, images, onSelect, onClose}) => html`
  <div class="screen-overlay" onClick=${() => onClose()}>
    <div class="modal">
      <div class="image-selector">
        ${images.map(image => html`
          <div class="image-container">
            <div class="description">
              <span>${extractResourceName(image)}</span>
            </div>
            <img 
              class="image"
              src="${campaignResource(campaign, image)}"
              onClick=${() => onSelect(image)}
            />
          </div>
        `)}
      </div>
    </div>
  </div>
`