import { render } from 'preact'
import { html } from 'htm/preact'
import { getAbsoluteCursorPosition } from './util.js';

let activeMenu = null

const checkAndCloseMenu = event => {
  if(!activeMenu) return;
  if(!activeMenu.contains(event.target)) {
    closeMenu()
  }
}

const closeMenu = () => {
  if (activeMenu) {
    document.removeEventListener('click', checkAndCloseMenu)
    activeMenu.remove()
    activeMenu = null
  }
}

export const openFloatingMenu = (clickEvent, items) => {
  clickEvent.preventDefault()

  // Close any existing menu
  closeMenu()

  // Create menu wrapper
  const menuTemplate = html`
    <div id="floating-menu" class="action-list">
      ${items.map(({ label, action }) => html`
        <button
          onClick=${(e) => {
            e.preventDefault()
            action()
            closeMenu()
          }}
        >
          ${label}
        </button>
      `)}
    </div>
  `

  activeMenu = document.createElement('div')
  render(menuTemplate, activeMenu)
  document.body.appendChild(activeMenu)
  document.addEventListener('click', checkAndCloseMenu)

  const mousePosition = getAbsoluteCursorPosition(clickEvent)
  
  activeMenu.style.position = 'absolute'
  activeMenu.style.top = `${mousePosition.y}px`
  activeMenu.style.left = `${mousePosition.x}px`
}
