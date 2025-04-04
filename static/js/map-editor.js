import { render } from "preact"
import { useState } from "preact/hooks"
import { html } from "htm/preact"
import { getTaggedData, getTagsList, TagList, toggleTag } from "./components/tag-list.js"

class MapEditor {
  static GRID_WIDTH = 60
  static UNIT_WIDTH = 2 * MapEditor.GRID_WIDTH
  static COLORS = {
    background: '#000000',
    tile: '#f0f0f0',
    gridLine: '#aaaaaa',
    unitLine: '#000000',    
  }

  // {
  //   background: '#000000',
  //   tile: '#333333',
  //   gridLine: '#ffffff',
  //   unitLine: '#aaaaaa',    
  // }

  mapData = {
    width: 40,
    height: 40,
    tiles: [],
  }

  tilesLibrary = []
  tileTags = []
  selectedTags = []

  #canvasTransform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }
  
  #DRAG_NONE = 0
  #DRAG_CANVAS = 1
  #DRAG_TILE = 2
  #DRAG_DRAW = 3

  #drag = {
    type: null,
    target: null,
    offsetX: 0,
    offsetY: 0,
  }

  #mouse = {
    relative: { x: 0, y: 0 },
    absolute: { x: 0, y: 0 },
  }

  #screen = null
  #buffer = null

  get #mapPixelWidth() {
    return this.mapData.width * MapEditor.UNIT_WIDTH
  }
  get #mapPixelHeight() {
    return this.mapData.height * MapEditor.UNIT_WIDTH
  }

  #snapGrid(pos, floor = true) {
    return floor
      ? Math.floor(pos / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH
      : Math.ceil(pos / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH
  }

  #tileDataOf(path) {
    return this.tilesLibrary.find((tile) => tile.path === path)
  }

  #relativeCursorPositionOf(event) {
    return {
      x: event.offsetX / this.#canvasTransform.scale,
      y: event.offsetY / this.#canvasTransform.scale,
    }
  }

  #absoluteCursorPositionOf(event) {
    return {
      x: event.offsetX / this.#canvasTransform.scale - this.#canvasTransform.offsetX,
      y: event.offsetY / this.#canvasTransform.scale - this.#canvasTransform.offsetY,
    }
  }

  constructor(screenCanvas) {
    this.#screen = screenCanvas.getContext('2d')

    const bufferCanvas = document.createElement('canvas')
    bufferCanvas.width = screenCanvas.width
    bufferCanvas.height = screenCanvas.height
    this.#buffer = bufferCanvas.getContext('2d')

    this.rescaleCanvas()

    screenCanvas.addEventListener('contextmenu', (event) => {
      event.preventDefault()
    })

    screenCanvas.addEventListener('mousedown', (event) => {
      const { x, y } = this.#absoluteCursorPositionOf(event)

      switch (event.button) {
        case 0: // left button
          const tile = this.#getCursorTile(x, y)
          if (tile) {
            this.#drag = {
              type: this.#DRAG_TILE,
              target: tile,
              offsetX: this.#snapGrid(x - tile.x),
              offsetY: this.#snapGrid(y - tile.y),
            }
          } else {
            this.#drag = {
              type: this.#DRAG_CANVAS,
              offsetX: this.#mouse.relative.x,
              offsetY: this.#mouse.relative.y,
            }
          }
          break
        case 2: // right button
          this.#drag = {
            type: this.#DRAG_DRAW,
            offsetX: this.#snapGrid(this.#mouse.relative.x),
            offsetY: this.#snapGrid(this.#mouse.relative.y),
          }
          break          
      }
    })
    
    screenCanvas.addEventListener('mousemove', (event) => {
      this.#mouse.relative = this.#relativeCursorPositionOf(event)
      this.#mouse.absolute = this.#absoluteCursorPositionOf(event)
    
      let x, y
      switch (this.#drag.type) {
        case this.#DRAG_TILE:
          ({ x, y } = this.#absoluteCursorPositionOf(event))
          this.#drag.target.x =
            Math.floor((x - this.#drag.offsetX) / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH
          this.#drag.target.y =
            Math.floor((y - this.#drag.offsetY) / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH            
          break
        case this.#DRAG_CANVAS:
          ({ x, y } = this.#relativeCursorPositionOf(event))
          this.#canvasTransform.offsetX += x - this.#drag.offsetX
          this.#canvasTransform.offsetY += y - this.#drag.offsetY
          this.#drag.offsetX = x
          this.#drag.offsetY = y
          break
      }

      this.#redrawCanvas()

    })
    
    const mouseExitEvent = () => {      
      switch (this.#drag.type) {
        case this.#DRAG_TILE:
          this.#redrawCanvas()
          break
      }
      this.#drag.type = this.#DRAG_NONE
    }

    screenCanvas.addEventListener('mouseup', mouseExitEvent)
    screenCanvas.addEventListener('mouseleave', mouseExitEvent)

    document.addEventListener('keydown', (event) => {
      let { x, y } = this.#mouse.absolute
      switch (event.key) {
        case 'a':
          this.addTile(
            Math.floor(x / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH,
            Math.floor(y / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH,
            this.tilesLibrary[0].path
          )
          break
        case 'd':
          this.mapData.tiles = this.mapData.tiles.filter((tile) => !this.#tileOnCursor(tile, x, y))
          this.#redrawCanvas()
          break
        case 'r':
          const tile = this.#getCursorTile(x, y)
          if (tile) {
            tile.rotation = (tile.rotation + 90) % 360
            this.#redrawCanvas()
          }
          break
      }
    })
    
    screenCanvas.addEventListener(
      'wheel',
      (event) => {
        let rescale = this.#canvasTransform.scale
        if (event.deltaY > 0) {
          rescale = Math.max(0.2, this.#canvasTransform.scale - 0.1)
        } else {
          rescale = Math.min(1.0, this.#canvasTransform.scale + 0.1)
        }
    
        const { x, y } = this.#mouse.absolute
        const ox = event.offsetX
        const oy = event.offsetY
    
        const offsetX = -x + ox / rescale
        const offsetY = -y + oy / rescale
    
        this.rescaleCanvas(rescale, offsetX, offsetY)
        this.#redrawCanvas()
      },
      { passive: false }
    )    
  }

  loadTiles(url) {
    return fetch('/tileset')
      .then(result => result.json())
      .then((data) => {
        this.tileTags = getTagsList(data.tiles)
        this.tilesLibrary = data.tiles
        return Promise.allSettled(this.tilesLibrary.map((tile) => {
          return new Promise((resolve) => {
            const img = new Image()
            img.src = `tile/${tile.path}`
            tile.image = img
            img.onload = () => {
              resolve()
            }
          })
        }))
      })
  }

  rescaleCanvas(scale = 0.5, offsetX = 0, offsetY = 0) {
    this.#canvasTransform = {
      scale,
      offsetX,
      offsetY,
    }
    this.#redrawCanvas()
  }

  #clearCanvas() {
    this.#buffer.clearRect(0, 0, this.#buffer.canvas.width, this.#buffer.canvas.height)
    this.#buffer.fillStyle = MapEditor.COLORS.background
    this.#buffer.fillRect(0, 0, this.#buffer.canvas.width, this.#buffer.canvas.height)
  }

  #drawGrid() {
    const mapWidth = this.#mapPixelWidth
    const mapHeight = this.#mapPixelHeight

    this.#buffer.fillStyle = MapEditor.COLORS.tile
    this.#buffer.fillRect(0, 0, mapWidth, mapHeight)

    for (let x = 0; x <= mapWidth; x += MapEditor.GRID_WIDTH) {
      this.#buffer.strokeStyle = x % MapEditor.UNIT_WIDTH === 0
        ? MapEditor.COLORS.unitLine
        : MapEditor.COLORS.gridLine
      this.#buffer.beginPath()
      this.#buffer.moveTo(x, 0)
      this.#buffer.lineTo(x, mapHeight)
      this.#buffer.stroke()
    }

    for (let y = 0; y <= mapHeight; y += MapEditor.GRID_WIDTH) {
      this.#buffer.strokeStyle = y % MapEditor.UNIT_WIDTH === 0
        ? MapEditor.COLORS.unitLine
        : MapEditor.COLORS.gridLine
      this.#buffer.beginPath()
      this.#buffer.moveTo(0, y)
      this.#buffer.lineTo(mapWidth, y)
      this.#buffer.stroke()
    }
  }

  #drawTiles() {
    this.mapData.tiles.forEach((tile) => {
      const img = this.#tileDataOf(tile.path).image
      this.#buffer.save()
      this.#buffer.translate(tile.x, tile.y)
      this.#buffer.rotate((tile.rotation * Math.PI) / 180)
      switch (tile.rotation) {
        case 90:
          this.#buffer.translate(0, -img.height)
          break
        case 180:
          this.#buffer.translate(-img.width, -img.height)
          break
        case 270:
          this.#buffer.translate(-img.width, 0)
          break
      }
      this.#buffer.drawImage(img, 0, 0, img.width, img.height)
      this.#buffer.restore()
    })
  }

  #drawCursor() {
    const { x, y } = this.#mouse.absolute
    this.#buffer.save()
    this.#buffer.fillStyle = 'rgba(255, 0, 0, 0.5)'

    if(this.#drag.type === this.#DRAG_DRAW) {
      const w = this.#snapGrid(x) - this.#drag.offsetX + MapEditor.GRID_WIDTH
      const h = this.#snapGrid(y) - this.#drag.offsetY + MapEditor.GRID_WIDTH
      this.#buffer.fillRect(this.#drag.offsetX, this.#drag.offsetY, w, h)
    } else {
      this.#buffer.fillRect(this.#snapGrid(x), this.#snapGrid(y), 60, 60)
    }
    this.#buffer.restore()
  }

  #redrawCanvas() {
    this.#clearCanvas()
    this.#buffer.save()
    this.#buffer.scale(this.#canvasTransform.scale, this.#canvasTransform.scale)
    this.#buffer.translate(this.#canvasTransform.offsetX, this.#canvasTransform.offsetY)
    this.#drawGrid()
    this.#drawTiles()
    this.#drawCursor()
    this.#buffer.restore()

    this.#screen.drawImage(this.#buffer.canvas, 0, 0)
  }

  addTile(x, y, path) {
    this.mapData.tiles.push({
      path,
      rotation: 0,
      x,
      y,
    })
    this.#redrawCanvas()
  }

  #tileOnCursor(tile, x, y) {
    const img = this.#tileDataOf(tile.path).image
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

  #getCursorTile(x, y) {
    return this.mapData.tiles.find((tile) => this.#tileOnCursor(tile, x, y))
  }  
}

const App = ({ editor }) => {  
  const [tags, setTags] = useState(editor.tileTags)
  const [selected, setSelected] = useState(editor.selectedTags)

  return html`
  <${TagList}
    tags=${tags}
    selected=${selected}
    onSelect=${tag => {
      const next = toggleTag(tag, selected)
      setSelected(next)
      editor.selectedTags = next
    }}
  />
  <div class="tile-list">
    ${getTaggedData(editor.tilesLibrary, selected).map((tile) => html`
      <div class="tile">
        <div class="label">${tile.label}</div>
        <div class="image-container">
          <img src=${`tile/${tile.path}`} alt=${tile.label} />
        </div>
      </div>
    `)}
  </div>
  `
}

const editor = new MapEditor(document.getElementById('canvas'))
editor.loadTiles('/tileset').then(() => {
  render(html`<${App} editor=${editor} />`, document.getElementById('ui'))
})
