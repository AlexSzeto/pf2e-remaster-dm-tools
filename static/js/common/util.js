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

export function campaignResource(campaignId, filename) {
  return filename ? `/campaign-resource/${campaignId}/${filename}` : ''
}
