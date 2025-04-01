export function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export function setCookie(name, value) {
  const date = new Date()
  date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days expiration
  const expires = '; expires=' + date.toUTCString()

  document.cookie = `${name}=${value || ''}${expires}; samesite=lax`
}

export function deepCompare(a, b) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (Object.keys(a).length !== Object.keys(b).length) return false

  for (const key in a) {
    if (!b.hasOwnProperty(key)) return false
    if (!deepCompare(a[key], b[key])) return false
  }

  return true
}

export function getAbsoluteCursorPosition(event) {
  if(event.touches && event.touches.length > 0) {
    event = event.touches[0]
  }

  // Get the mouse position relative to the viewport.
  const clientX = event.clientX
  const clientY = event.clientY

  // Get the scroll offsets.
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop

  console.log(scrollX, scrollY)
  // Calculate the cursor position relative to the top-left of the document.
  const pageX = clientX + scrollX
  const pageY = clientY + scrollY

  return {
    x: pageX,
    y: pageY
  }
}

export function getSelectedText() {
  let text = ""
  if (window.getSelection) {
    text = window.getSelection().toString()
  } else if (document.selection && document.selection.type !== "Control") {
    text = document.selection.createRange().text
  }
  return text
}

export function debounce(func, delay) {
  let inDebounce
  return function () {
    const context = this
    const args = arguments
    clearTimeout(inDebounce)
    inDebounce = setTimeout(() => func.apply(context, args), delay)
  }
}

export function campaignResource(filename) {
  return filename ? `/resource/${filename}` : ''
}
