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

  #selectedTags = []
  #drawTilePath = null
  #selectedTiles = []

  #canvasTransform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }
  
  #DRAG_NONE = 0
  #DRAG_CANVAS = 1
  #DRAG_TILES = 2
  #DRAG_DRAW = 3
  #DRAG_SELECT = 4

  #drag = {
    type: null,
    offsetX: 0,
    offsetY: 0,
    offsets: [],
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
          if(
            this.#selectedTiles
            && this.#selectedTiles.length > 0
            && this.#selectedTiles.some(tile => this.#tileOnCursor(tile, x, y))
          ) {
            this.#drag = {
              type: this.#DRAG_TILES,
            }
          } else {
            const tile = this.#getCursorTile(x, y)
            if (tile) {
              this.#drag = {
                type: this.#DRAG_TILES,
              }
              this.#selectedTiles = [tile]
            } else {
              this.#drag = {
                type: this.#DRAG_SELECT,
                offsetX: x,
                offsetY: y,
              }
              this.#selectedTiles = []
            }
          }

          if(this.#drag.type === this.#DRAG_TILES) {
            this.#drag.offsets = this.#selectedTiles.map((tile) => ({
              x: tile.x - x,
              y: tile.y - y,
            }))
          }
          break
        case 1: // middle button
          this.#drag = {
            type: this.#DRAG_CANVAS,
            offsetX: this.#mouse.relative.x,
            offsetY: this.#mouse.relative.y,
          }
          break
        case 2: // right button
          this.#drag = {
            type: this.#DRAG_DRAW,
            offsetX: x,
            offsetY: y,
          }
          this.#selectedTiles = []
          break          
      }
    })
    
    screenCanvas.addEventListener('mousemove', (event) => {
      this.#mouse.relative = this.#relativeCursorPositionOf(event)
      this.#mouse.absolute = this.#absoluteCursorPositionOf(event)
    
      let x, y
      switch (this.#drag.type) {
        case this.#DRAG_TILES:
          ({ x, y } = this.#mouse.absolute)
          this.#selectedTiles.forEach((tile, index) => {
            tile.x = this.#snapGrid(x + this.#drag.offsets[index].x)
            tile.y = this.#snapGrid(y + this.#drag.offsets[index].y)
          })
          break
        case this.#DRAG_CANVAS:
          ({ x, y } = this.#mouse.relative)
          this.#canvasTransform.offsetX += x - this.#drag.offsetX
          this.#canvasTransform.offsetY += y - this.#drag.offsetY
          this.#drag.offsetX = x
          this.#drag.offsetY = y
          break
      }

      this.#redrawCanvas()

    })
    
    const mouseExitEvent = () => {      
      let x1, y1, x2, y2
      switch (this.#drag.type) {
        case this.#DRAG_SELECT:
          ({ x1, y1, x2, y2 } = this.selectedRegion)
          this.#selectedTiles = this.mapData.tiles.filter((tile) => this.#tileInRegion(tile, x1, y1, x2, y2))
          this.#redrawCanvas()
          break
        case this.#DRAG_TILES:
          this.#redrawCanvas()
          break
        case this.#DRAG_DRAW:
          ({ x1, y1, x2, y2 } = this.selectedRegion)
          this.fillTiles(x1, y1, x2, y2)
      }
      this.#drag.type = this.#DRAG_NONE
    }

    screenCanvas.addEventListener('mouseup', mouseExitEvent)
    screenCanvas.addEventListener('mouseleave', mouseExitEvent)

    document.addEventListener('keydown', (event) => {
      let { x, y } = this.#mouse.absolute
      const tile = this.#getCursorTile(x, y)
      switch (event.key) {
        case 'a':
          if(this.drawTilePath) {
            this.addTile(
              this.#drawTilePath,
              this.#snapGrid(x),
              this.#snapGrid(y),
            )
          }
          break
        case 'd':
          if(tile) {
            this.mapData.tiles = this.mapData.tiles.filter((tile) => !this.#tileOnCursor(tile, x, y))
            this.#redrawCanvas()
          } else {
            this.deleteSelectedTiles()
          }
          break
        case 'r':
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

  get sortedFilteredTiles() {
    return getTaggedData(this.tilesLibrary, this.#selectedTags).sort((a, b) => {
      if(a.width * a.height === b.width * b.height) {
        return a.tags.length - b.tags.length
      } else {
        return b.width * b.height - a.width * a.height
      }
    })
  }

  get selectedTags() {
    return this.#selectedTags
  }

  setSelectedTags(tags) {
    this.#selectedTags = tags
    if(this.#drawTilePath) {
      const selectedTileTags = this.#tileDataOf(this.#drawTilePath).tags
      if(tags.some(tag => !selectedTileTags.includes(tag))) {
        this.#drawTilePath = null
        return
      }
    }
  }

  get drawTilePath() {
    return this.#drawTilePath
  }

  toggleDrawTile(path) {
    this.#drawTilePath = (this.#drawTilePath === path)
    ? null
    : path
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

      if(this.#selectedTiles.includes(tile)) {
        this.#buffer.save()
        this.#buffer.fillStyle = 'rgba(255, 0, 0, 0.2)'
        switch (tile.rotation) {
          case 90:
          case 270:
            this.#buffer.fillRect(tile.x, tile.y, img.height, img.width)
            break
          default:
            this.#buffer.fillRect(tile.x, tile.y, img.width, img.height)
            break
        }
        this.#buffer.restore()
      }
    })
  }

  get selectedRegion() {
    const { x, y } = this.#mouse.absolute
    switch (this.#drag.type) {
      case this.#DRAG_DRAW:
      case this.#DRAG_SELECT:
        const x1 = Math.min(x, this.#drag.offsetX)
        const y1 = Math.min(y, this.#drag.offsetY)
        const x2 = Math.max(x, this.#drag.offsetX)
        const y2 = Math.max(y, this.#drag.offsetY)

        return {
          x1: this.#snapGrid(x1),
          y1: this.#snapGrid(y1),
          x2: this.#snapGrid(x2, false),
          y2: this.#snapGrid(y2, false)
        }
    }

    return {
      x1: this.#snapGrid(x),
      y1: this.#snapGrid(y),
      x2: this.#snapGrid(x, false),
      y2: this.#snapGrid(y, false)
    }
  }

  #drawCursor() {
    this.#buffer.save()
    this.#buffer.fillStyle = 'rgba(255, 0, 0, 0.5)'

    const { x1, y1, x2, y2 } = this.selectedRegion
    this.#buffer.fillRect(x1, y1, x2 - x1, y2 - y1)
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

  fillTiles(x1, y1, x2, y2, initial = true) {
    if(x1 > x2) {
      const tmp = x1
      x1 = x2
      x2 = tmp
    }
    if(y1 > y2) {
      const tmp = y1
      y1 = y2
      y2 = tmp
    }

    const gapWidth = x2 - x1
    const gapHeight = y2 - y1

    const fillGapWith = (tile) => {
      const w = tile.width * MapEditor.GRID_WIDTH
      const h = tile.height * MapEditor.GRID_WIDTH

      if(w <= gapWidth && h <= gapHeight) {
        this.addTile(
          tile.path, x1, y1
        )
        this.fillTiles(x1 + w, y1, x2, y1 + h, false)
        this.fillTiles(x1, y1 + h, x2, y2, false)
        return true
      } else if (h <= gapWidth && w <= gapHeight) {
        this.addTile(
          tile.path, x1, y1, 90
        )
        this.fillTiles(x1 + h, y1, x2, y1 + w, false)
        this.fillTiles(x1, y1 + w, x2, y2, false)
        return true
      }
      return false
    }

    if(this.#drawTilePath) {
      const tile = this.#tileDataOf(this.#drawTilePath)
      if(!fillGapWith(tile) && initial) {
        this.addTile(this.#drawTilePath, x1, y1)
      }
      return
    }

    for(const tile of this.sortedFilteredTiles) {
      if(fillGapWith(tile)) {
        return
      }
    }
  }

  addTile(path, x, y, rotation = 0) {
    this.mapData.tiles.push({
      path,
      rotation,
      x,
      y,
    })
    this.#redrawCanvas()
  }

  deleteSelectedTiles() {
    console.log('del')
    this.mapData.tiles = this.mapData.tiles.filter((tile) => !this.#selectedTiles.includes(tile))
    this.#selectedTiles = []
    this.#redrawCanvas()
  }

  #tileInRegion(tile, x1, y1, x2, y2) {
    x1++
    x2--
    y1++
    y2--

    const img = this.#tileDataOf(tile.path).image
    let x3 = tile.x
    let y3 = tile.y
    let x4 = tile.x + img.width
    let y4 = tile.y + img.height

    switch(tile.rotation) {
      case 90:
      case 270:
        x4 = tile.x + img.height
        y4 = tile.y + img.width
        break
    }

    return (
      ((x1 >= x3 && x1 <= x4) || (x2 >= x3 && x2 <= x4) || (x3 >= x1 && x3 <= x2) || (x4 >= x1 && x4 <= x2))
      && ((y1 >= y3 && y1 <= y4) || (y2 >= y3 && y2 <= y4) || (y3 >= y1 && y3 <= y2) || (y4 >= y1 && y4 <= y2))
    )        
  }

  #tileOnCursor(tile, x, y) {
    return this.#tileInRegion(tile, x, y)
    const img = this.#tileDataOf(tile.path).image
    switch (tile.rotation) {
      case 0:
      case 180:
        return (
          x1 >= tile.x &&
          x1 < tile.x + img.width &&
          y1 >= tile.y &&
          y1 < tile.y + img.height
        )
      default:
        return (
          x1 >= tile.x &&
          x1 < tile.x + img.height &&
          y1 >= tile.y &&
          y1 < tile.y + img.width
        )
    }
  }

  #getCursorTile(x, y) {
    return this.mapData.tiles.find((tile) => this.#tileOnCursor(tile, x, y))
  }  
}

const App = ({ editor }) => {  
  const [tags, setTags] = useState(editor.tileTags)
  const [selectedTags, setSelectedTags] = useState(editor.selectedTags)
  const [selectedTile, setSelectedTile] = useState(null)
  const [filtered, setFiltered] = useState(editor.sortedFilteredTiles)

  return html`
  <${TagList}
    tags=${tags}
    selected=${selectedTags}
    onSelect=${tag => {
      const next = toggleTag(tag, selectedTags)
      setSelectedTags(next)
      editor.setSelectedTags(next)
      setSelectedTile(editor.selectedTilePath)
      setFiltered(editor.sortedFilteredTiles)
    }}
  />
  <div class="tile-list">
    ${filtered.map((tile) => html`
      <div class="tile ${selectedTile === tile.path ? 'selected' : ''}">
        <div class="label">${tile.label}</div>
        <div class="image-container">
          <img 
            src=${`tile/${tile.path}`} alt=${tile.label}
            onClick=${() => {
              editor.toggleDrawTile(tile.path)
              setSelectedTile(editor.drawTilePath)
            }}
          />
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
