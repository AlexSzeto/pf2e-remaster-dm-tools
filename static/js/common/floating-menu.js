import { render } from 'preact'
import { html } from 'htm/preact'
import { getAbsoluteCursorPosition } from './util.js';

let activeMenu = null

const checkAndCloseMenu = event => {
  if(!activeMenu || document.getElementById('floating-menu') === null) return
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

const openFloatingMenu = (clickEvent, template) => {
  clickEvent.preventDefault()
  clickEvent.stopPropagation()

  // Close any existing menu
  closeMenu()

  // Create menu wrapper
  activeMenu = document.createElement('div')
  render(template, activeMenu)
  document.body.appendChild(activeMenu)
  requestAnimationFrame(() => {
    document.addEventListener('click', checkAndCloseMenu)
  })

  const mousePosition = getAbsoluteCursorPosition(clickEvent)
  activeMenu.style.position = 'absolute'
  activeMenu.style.top = `${mousePosition.y}px`
  activeMenu.style.left = `${mousePosition.x}px`
}

export const openFloatingPrompt = (clickEvent, value, onChange) => {
  const menuTemplate = html`
    <div id="floating-menu" class="prompt">
      <input id="floating-input-text" type="text"
        value=${value}
        onBlur=${(e) => {
          closeMenu()
        }}
        onKeyDown=${(e) => {
          if (e.key === 'Enter') {
            onChange(e.target.value)
            e.target.blur()
          }
        }}
      />
    </div>
  `
  openFloatingMenu(clickEvent, menuTemplate)
  const input = document.getElementById('floating-input-text')
  input.focus()
}

export const openFloatingSelect = (clickEvent, items) => {
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
  openFloatingMenu(clickEvent, menuTemplate)
}
