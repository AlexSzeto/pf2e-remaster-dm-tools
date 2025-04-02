const GRID_SIZE = 60
const TILE_WIDTH = 2 * GRID_SIZE
const TRUE_WIDTH = 20 * GRID_SIZE * 4
const TRUE_HEIGHT = 20 * GRID_SIZE * 4

let tilesLibrary = []
let mapTiles = []

let canvasTransform = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}

let dragging = {
  canvas: false,
  tile: null,
  image: null,
  offsetX: 0,
  offsetY: 0,
}

let mouse = {
  scaled: { x: 0, y: 0 },
  true: { x: 0, y: 0 },
}

const screenCanvas = document.getElementById('canvas')
const screen = screenCanvas.getContext('2d')

const canvas = document.createElement('canvas')
canvas.width = screenCanvas.width
canvas.height = screenCanvas.height
let ctx = canvas.getContext('2d')

rescaleCanvas()

const tileSelector = document.getElementById('tileSelector')
const loadButton = document.getElementById('loadTile')

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

function setCookie(name, value) {
  const date = new Date()
  date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days expiration
  const expires = '; expires=' + date.toUTCString()

  document.cookie = `${name}=${value || ''}${expires}; samesite=lax`
}

async function loadTiles() {
  fetch('/tileset')
    .then(result => result.json())
    .then((data) => {
      tilesLibrary = data.tiles
      tilesLibrary.forEach(async (tile) => {
        await new Promise((resolve) => {
          const img = new Image()
          img.src = `tile/${tile.path}`
          tile.image = img
          img.onload = () => {
            resolve()
          }
        })

        const option = document.createElement('option')
        option.value = tile.path
        option.textContent = tile.name
        tileSelector.appendChild(option)    
      })
    })
}

function rescaleCanvas(scale = 0.5, offsetX = 0, offsetY = 0) {
  canvasTransform = {
    scale,
    offsetX,
    offsetY,
  }
  redrawCanvas()
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function drawGrid() {
  const globalWidth = TRUE_WIDTH
  const globalHeight = TRUE_HEIGHT

  ctx.clearRect(0, 0, globalWidth, globalHeight)
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, globalWidth, globalHeight)

  for (let x = 0; x <= globalWidth; x += GRID_SIZE) {
    if (x % TILE_WIDTH === 0) ctx.strokeStyle = 'black'
    else ctx.strokeStyle = '#aaaaaa'
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, globalHeight)
    ctx.stroke()
  }
  for (let y = 0; y <= globalHeight; y += GRID_SIZE) {
    if (y % TILE_WIDTH === 0) ctx.strokeStyle = 'black'
    else ctx.strokeStyle = '#aaaaaa'
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(globalWidth, y)
    ctx.stroke()
  }
}

function drawTiles() {
  mapTiles.forEach((tile) => {
    const img = tile.image
    ctx.save()
    ctx.translate(tile.x, tile.y)
    ctx.rotate((tile.rotation * Math.PI) / 180)
    switch (tile.rotation) {
      case 90:
        ctx.translate(0, -img.height)
        break
      case 180:
        ctx.translate(-img.width, -img.height)
        break
      case 270:
        ctx.translate(-img.width, 0)
        break
    }
    ctx.drawImage(img, 0, 0, img.width, img.height)
    ctx.restore()
  })
}

function redrawCanvas() {
  clearCanvas()
  ctx.save()
  ctx.scale(canvasTransform.scale, canvasTransform.scale)
  ctx.translate(canvasTransform.offsetX, canvasTransform.offsetY)
  drawGrid()
  drawTiles()
  ctx.restore()

  screen.drawImage(canvas, 0, 0)
}

function saveMap() {
  const saveText = JSON.stringify(mapTiles)
  setCookie('map', btoa(saveText))
}

function addTile(x, y) {
  const selectedTile = tileSelector.value
  const tileData = tilesLibrary.find((tile) => tile.path === selectedTile)
  if (tileData) {
    mapTiles.push({
      path: tileData.path,
      name: tileData.name,
      image: tileData.image,
      rotation: 0,
      x,
      y,
    })
    redrawCanvas()
    saveMap()
  }
}

tileSelector.addEventListener('change', () => {
  tileSelector.blur()
})

loadButton.addEventListener('click', () => {
  addTile(0, 0)
})

function getScaledMousePosition(event) {
  return {
    x: event.offsetX / canvasTransform.scale,
    y: event.offsetY / canvasTransform.scale,
  }
}

function getTrueMousePosition(event) {
  return {
    x: event.offsetX / canvasTransform.scale - canvasTransform.offsetX,
    y: event.offsetY / canvasTransform.scale - canvasTransform.offsetY,
  }
}

function tileInPosition(tile, x, y) {
  const img = tile.image
  switch (tile.rotation) {
    case 0:
    case 180:
      return (
        x >= tile.x &&
        x < tile.x + img.width &&
        y >= tile.y &&
        y < tile.y + img.height
      )
    default:
      return (
        x >= tile.x &&
        x < tile.x + img.height &&
        y >= tile.y &&
        y < tile.y + img.width
      )
  }
}

function getTileInPosition(x, y) {
  return mapTiles.find((tile) => tileInPosition(tile, x, y))
}

screenCanvas.addEventListener('mousedown', (event) => {
  const { x, y } = getTrueMousePosition(event)
  const tile = getTileInPosition(x, y)
  if (tile) {
    tileSelector.value = tile.path
    dragging = {
      tile,
      offsetX: Math.floor((x - tile.x) / GRID_SIZE) * GRID_SIZE,
      offsetY: Math.floor((y - tile.y) / GRID_SIZE) * GRID_SIZE,
    }
  } else {
    dragging = {
      canvas: true,
      offsetX: mouse.scaled.x,
      offsetY: mouse.scaled.y,
    }
  }
})

screenCanvas.addEventListener('mousemove', (event) => {
  mouse.scaled = getScaledMousePosition(event)
  mouse.true = getTrueMousePosition(event)

  if (dragging.tile) {
    const { x, y } = getTrueMousePosition(event)
    dragging.tile.x =
      Math.floor((x - dragging.offsetX) / GRID_SIZE) * GRID_SIZE
    dragging.tile.y =
      Math.floor((y - dragging.offsetY) / GRID_SIZE) * GRID_SIZE

    redrawCanvas()
  } else if (dragging.canvas) {
    const { x, y } = getScaledMousePosition(event)
    canvasTransform.offsetX += x - dragging.offsetX
    canvasTransform.offsetY += y - dragging.offsetY
    dragging.offsetX = x
    dragging.offsetY = y
    redrawCanvas()
  }
})

screenCanvas.addEventListener('mouseup', () => {
  if (dragging.tile) {
    dragging.tile = null
    redrawCanvas()
    saveMap()
  }
  dragging.canvas = false
})

document.addEventListener('keydown', (event) => {
  let { x, y } = mouse.true
  switch (event.key) {
    case 'a':
      addTile(
        Math.floor(x / GRID_SIZE) * GRID_SIZE,
        Math.floor(y / GRID_SIZE) * GRID_SIZE
      )
      break
    case 'd':
      mapTiles = mapTiles.filter((tile) => !tileInPosition(tile, x, y))
      redrawCanvas()
      saveMap()
      break
    case 'r':
      const tile = getTileInPosition(x, y)
      if (tile) {
        tile.rotation = (tile.rotation + 90) % 360
        redrawCanvas()
        saveMap()
      }
      break
    case ' ':
      dragging.canvas = true
      dragging.offsetX = mouse.scaled.x
      dragging.offsetY = mouse.scaled.y
      break
  }
})

document.addEventListener('keyup', () => {
  switch (event.key) {
    case ' ':
      dragging.canvas = false
      break
  }
})

document.addEventListener(
  'wheel',
  (event) => {
    let rescale = canvasTransform.scale
    if (event.deltaY > 0) {
      rescale = Math.max(0.2, canvasTransform.scale - 0.1)
    } else {
      rescale = Math.min(1.0, canvasTransform.scale + 0.1)
    }

    const { x, y } = mouse.true
    const ox = event.offsetX
    const oy = event.offsetY

    const offsetX = -x + ox / rescale
    const offsetY = -y + oy / rescale

    rescaleCanvas(rescale, offsetX, offsetY)
    redrawCanvas()
  },
  { passive: false }
)

loadTiles().then(() => {
  const loadMap = getCookie('map')
  if (loadMap) {
    mapTiles = JSON.parse(atob(loadMap))
  }

  mapTiles = mapTiles.map((tile) => ({
    ...tile,
    image: tilesLibrary.find((t) => t.path === tile.path).image,
  }))

  redrawCanvas()
})
