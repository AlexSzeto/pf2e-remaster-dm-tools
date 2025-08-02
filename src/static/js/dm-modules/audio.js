import { html } from 'htm/preact'

import { ContentSection, LabeledItem } from '../components/content-section.js'

const audioTypes = ['bgm', 'ambience']

const audioTypeMaps = {
    bgm: {
      dataSource: 'bgms',
      label: 'Background Music',
      volume: 1.0,
    },
    ambience: {
      dataSource: 'ambiences',
      label: 'Ambience',
      volume: 1.0,
    },
  }

export function Audio(props) {
    const { screen, onToggleAudioDuck, onStopAllAudio, onShowModal } = props

    return html`
    <div style="grid-area: audio">
      <${ContentSection}
        label="Audio"
        actions=${[
          {
            icon: screen.duckAudio ? 'volume-full' : 'volume-low',
            onClick: () => onToggleAudioDuck(),
          },
          {
            icon: 'square',
            onClick: () => onStopAllAudio(),
          },
        ]}
      >
        <div class="audio-grid">
          ${audioTypes.map(
            (type) => html`
            <${LabeledItem} label=${audioTypeMaps[type].label}>
              <div onClick=${() => onShowModal(type)}>
                <div class="disabled-text">
                  <div
                    class="volume-slider ${
                      screen[type].volume >= 0.99 ||
                      screen[type].volume === 0
                        ? 'inactive'
                        : ''
                    }"
                    style=${`width: ${screen[type].volume * 100}%`}
                  >
                  </div>
                  <div class="audio-label">
                    ${
                      screen[type].label === ''
                        ? 'None'
                        : screen[type].label +
                          ' ' +
                          (screen[type].volume * 100).toFixed(0) +
                          '%'
                    }
                  </div>
                </div>
              </div>
            </${LabeledItem}>
          `
          )}
        </div>
      </${ContentSection}>
    </div>
    `
}
