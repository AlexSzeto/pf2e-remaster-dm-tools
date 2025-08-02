import { html } from 'htm/preact'

import { ContentSection } from '../components/content-section.js'
import { FramedImage } from '../components/framed-image.js'
import { campaignMedia } from '../common/util.js'

const imageLocations = ['background', 'left', 'right']

export function Images(props) {
  const { images, onShowImage, onToggleBackgroundCover, onShowModal, onShowImageViewer } = props

  return html`
    <div style="grid-area: image">
      <${ContentSection}
        label="Image"
        actions=${[
          {
            icon: images.cover ? 'exit-fullscreen' : 'fullscreen',
            onClick: () => onToggleBackgroundCover(),
          },
        ]}
      >
        <div class="images-layout">
          ${imageLocations.map(
            (location) => html`
              <div class="${location}-container">
                <${FramedImage}
                  type=${location}
                  url=${campaignMedia(images[location])}
                  cover=${location === 'background'
                    ? images.cover
                    : false}
                  onClick=${() => onShowModal(location)}
                  onModal=${(url) => () => onShowImageViewer(url)}
                />
              </div>
            `
          )}
        </div>
      </${ContentSection}>
    </div>
    `
}
