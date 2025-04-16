import { Component, render } from "preact"
import { html } from "htm/preact"
import { getTaggedData, getTagsList, TagList, toggleTag } from "./components/tag-list.js"
import { FileSelectorModal } from "./modals/file-modal.js"
import { openFloatingPrompt } from "./common/floating-menu.js"

class MapEditor {
  static GRID_WIDTH = 60
  static UNIT_WIDTH = 2 * MapEditor.GRID_WIDTH
  static COLORS = {
    background: '#000000',
    tile: '#f0f0f0',
    gridLine: '#aaaaaa',
    unitLine: '#000000',

    tileCursor: 'rgba(255, 0, 0, 0.2)',
    propCursor: 'rgba(0, 0, 255, 0.2)',
    prop: '#ffffff',
  }
  static PROP_ALPHA = 0.4
  static PROP_OFFSET = 12

  // {
  //   background: '#000000',
  //   tile: '#333333',
  //   gridLine: '#ffffff',
  //   unitLine: '#aaaaaa',    
  // }

  #mapPath = null
  mapData = {
    width: 40,
    height: 40,
    tiles: [],
    props: [],
  }

  tilesLibrary = []

  tileTags = []

  #selectedTags = []
  #drawTilePath = null

  #DRAW_TILE = 0
  #DRAW_PROP = 1
  #drawMode = this.#DRAW_TILE

  #selectedTiles = []
  #selectedProps = []

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
  #DRAG_PROPS = 5

  #drag = {
    type: null,
    offsetX: 0,
    offsetY: 0,
    offsets: [],
  }

  #mouse = {
    relative: { x: 0, y: 0 },
    absolute: { x: 0, y: 0 },
    down: { x: 0, y: 0 },
  }

  #screen = null
  #buffer = null

  onUpdateSelectedTiles = () => {}
  onUpdateMapData = () => {}

  get #mapPixelWidth() {
    return this.mapData.width * MapEditor.UNIT_WIDTH
  }
  get #mapPixelHeight() {
    return this.mapData.height * MapEditor.UNIT_WIDTH
  }

  countUse(path) {
    return this.mapData.tiles.filter((tile) => tile.path === path).length
  }

  #snapGrid(pos, floor = true) {
    return floor
      ? Math.floor(pos / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH
      : Math.ceil(pos / MapEditor.GRID_WIDTH) * MapEditor.GRID_WIDTH
  }

  tileDataOf(path) {
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
      this.#mouse.down = { x, y }

      switch (event.button) {
        case 0: // left button
          switch (this.#drawMode) {
            case this.#DRAW_TILE:
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
                  this.onUpdateSelectedTiles(this.#selectedTiles)
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

            case this.#DRAW_PROP:
              const prop = this.#getCursorProp(x, y)
              if (prop) {
                this.#drag = {
                  type: this.#DRAG_PROPS,
                }
                this.#selectedProps = [prop]
              }

              if(this.#drag.type === this.#DRAG_PROPS) {
                this.#drag.offsets = this.#selectedProps.map((prop) => ({
                  x: prop.x - x,
                  y: prop.y - y,
                }))
              }
            break
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
        case this.#DRAG_PROPS:
        case this.#DRAG_TILES:
          ({ x, y } = this.#mouse.absolute)
          this.#selectedTiles.forEach((tile, index) => {
            tile.x = this.#snapGrid(x + this.#drag.offsets[index].x)
            tile.y = this.#snapGrid(y + this.#drag.offsets[index].y)
          })
          this.#selectedProps.forEach((prop, index) => {
            prop.x = this.#snapGrid(x + this.#drag.offsets[index + this.#selectedTiles.length].x)
            prop.y = this.#snapGrid(y + this.#drag.offsets[index + this.#selectedTiles.length].y)
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
    
    const mouseExitEvent = (e) => {      
      let x1, y1, x2, y2
      switch (this.#drag.type) {
        case this.#DRAG_SELECT:
          ({ x1, y1, x2, y2 } = this.selectedRegion)
          this.#selectedTiles = this.mapData.tiles.filter((tile) => this.#tileInRegion(tile, x1, y1, x2, y2))
          this.onUpdateSelectedTiles(this.#selectedTiles)
          this.#redrawCanvas()
          break
        case this.#DRAG_PROPS:
          if(
            this.#selectedProps.length == 1
            && this.#snapGrid(this.#mouse.absolute.x) === this.#snapGrid(this.#mouse.down.x)
            && this.#snapGrid(this.#mouse.absolute.y) === this.#snapGrid(this.#mouse.down.y)
          ) {
            this.#selectedProps[0].x = this.#snapGrid(this.#mouse.down.x + this.#drag.offsets[0].x)
            this.#selectedProps[0].y = this.#snapGrid(this.#mouse.down.y + this.#drag.offsets[0].y)
            this.#redrawCanvas()
            this.saveMap()      
            openFloatingPrompt(e, this.#selectedProps[0].label, (label) => {
              this.#selectedProps[0].label = label
              this.#redrawCanvas()
              this.saveMap()
            })
            break
          }
          this.#redrawCanvas()
          this.saveMap()
          break
        case this.#DRAG_TILES:
          this.#redrawCanvas()
          this.saveMap()
          break
        case this.#DRAG_DRAW:
          switch (this.#drawMode) {
            case this.#DRAW_TILE:                  
              ({ x1, y1, x2, y2 } = this.selectedRegion)
              this.fillTiles(x1, y1, x2, y2)
              break
            case this.#DRAW_PROP:
              ({ x1, y1, x2, y2 } = this.selectedRegion)
              this.#drag.type = this.#DRAG_NONE
              this.addProp(x1, y1, x2, y2)
              break
          }
          this.saveMap()
          break
      }
      this.#drag.type = this.#DRAG_NONE
    }

    screenCanvas.addEventListener('mouseup', mouseExitEvent)
    screenCanvas.addEventListener('mouseleave', mouseExitEvent)

    screenCanvas.addEventListener('keydown', (event) => {
      let { x, y } = this.#mouse.absolute
      const tile = this.#getCursorTile(x, y)
      switch (event.key) {
        case 'a':
          if(this.#drawMode === this.#DRAW_TILE) {
            this.#drawTilePath = null
            this.#selectedTiles = []
            this.#drawMode = this.#DRAW_PROP
            this.onUpdateSelectedTiles(this.#selectedTiles)
          } else {
            this.#drawMode = this.#DRAW_TILE            
          }
          this.#redrawCanvas()
          break
        case 'd':
          switch (this.#drawMode) {
            case this.#DRAW_PROP:
              const prop = this.#getCursorProp(x, y)
              if (prop) {
                this.#selectedProps = [prop]
                this.deleteSelectedProps()
                this.saveMap()
              }
              break
            case this.#DRAW_TILE:
              this.deleteSelectedTiles()
              this.onUpdateSelectedTiles(this.#selectedTiles)
              this.saveMap()
          }
          break
        case 'r':
          if (tile) {
            tile.rotation = (tile.rotation + 90) % 360
            this.#redrawCanvas()
            this.saveMap()
          }
          break
      }
    })
    
    screenCanvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault()
        let rescale = this.#canvasTransform.scale
        if (event.deltaY > 0) {
          rescale = Math.max(0.1, this.#canvasTransform.scale - 0.1)
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

  loadMap(path) {
    this.#mapPath = path
    return fetch(`./resource/${path}`)
      .then((response) => response.json())
      .then((mapData) => {
        this.mapData = mapData
        this.#redrawCanvas()
        return this.mapData
      })
  }

  saveMap(name = null) {
    let filename = this.#mapPath
    if(name) { 
      filename = `${name.toLowerCase().replace(/\s+/g, '-')}.json`
    }

    if(!filename) {
      return
    }

    const mapFileData = JSON.stringify(this.mapData)
    const mapDataBlob = new Blob([mapFileData], { type: 'application/json' })

    const formData = new FormData()
    formData.append('file', mapDataBlob, filename)
    if(name) {
      formData.append('name', name)
    }

    fetch('./resource', {
      method: 'POST',
      body: formData
    }).then(() => {
      if(name) {
        fetch(`/campaign`)
        .then((response) => response.json())
        .then((campaign) => { this.setState({ campaign }) })
      }
    })

    this.onUpdateMapData(this.mapData)
  }

  exportMap(name) {
    const exportScale = 0.5

    // create a canvas to render map image
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = this.#mapPixelWidth * exportScale
    exportCanvas.height = this.#mapPixelHeight * exportScale
    const exportContext = exportCanvas.getContext('2d')

    this.#clearCanvas(exportContext)
    exportContext.scale(exportScale, exportScale)
    this.#drawGrid(exportContext)
    this.#drawTiles(exportContext)
    this.#drawProps(exportContext)

    // create a blob to prepare for upload
    exportCanvas.toBlob((blob) => {
      const formData = new FormData()
      formData.append('file', blob, `${name.toLowerCase().replace(/\s+/g, '-')}.jpeg`)
      formData.append('name', name)
      formData.append('folder', 'images')
      formData.append('type', 'battlemap')

      fetch('./resource', {
        method: 'POST',
        body: formData
      }).then(() => {
        // show a system prompt to indicate success

      })
    }, 'image/jpeg')
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
  }

  get drawTilePath() {
    return this.#drawTilePath
  }

  setDrawTile(path) {
    this.#drawTilePath = path
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

  #clearCanvas(buffer) {
    buffer.clearRect(0, 0, buffer.canvas.width, buffer.canvas.height)
    buffer.fillStyle = MapEditor.COLORS.background
    buffer.fillRect(0, 0, buffer.canvas.width, buffer.canvas.height)
  }

  #drawGrid(buffer) {
    const mapWidth = this.#mapPixelWidth
    const mapHeight = this.#mapPixelHeight

    buffer.fillStyle = MapEditor.COLORS.tile
    buffer.fillRect(0, 0, mapWidth, mapHeight)

    for (let x = 0; x <= mapWidth; x += MapEditor.GRID_WIDTH) {
      buffer.strokeStyle = x % MapEditor.UNIT_WIDTH === 0
        ? MapEditor.COLORS.unitLine
        : MapEditor.COLORS.gridLine
      buffer.beginPath()
      buffer.moveTo(x, 0)
      buffer.lineTo(x, mapHeight)
      buffer.stroke()
    }

    for (let y = 0; y <= mapHeight; y += MapEditor.GRID_WIDTH) {
      buffer.strokeStyle = y % MapEditor.UNIT_WIDTH === 0
        ? MapEditor.COLORS.unitLine
        : MapEditor.COLORS.gridLine
      buffer.beginPath()
      buffer.moveTo(0, y)
      buffer.lineTo(mapWidth, y)
      buffer.stroke()
    }
  }

  #drawTiles(buffer) {
    this.mapData.tiles.forEach((tile) => {
      const img = this.tileDataOf(tile.path).image
      buffer.save()
      buffer.translate(tile.x, tile.y)
      buffer.rotate((tile.rotation * Math.PI) / 180)
      switch (tile.rotation) {
        case 90:
          buffer.translate(0, -img.height)
          break
        case 180:
          buffer.translate(-img.width, -img.height)
          break
        case 270:
          buffer.translate(-img.width, 0)
          break
      }
      buffer.drawImage(img, 0, 0, img.width, img.height)
      buffer.restore()

      if(this.#selectedTiles.includes(tile)) {
        buffer.save()
        buffer.fillStyle = MapEditor.COLORS.tileCursor
        switch (tile.rotation) {
          case 90:
          case 270:
            buffer.fillRect(tile.x, tile.y, img.height, img.width)
            break
          default:
            buffer.fillRect(tile.x, tile.y, img.width, img.height)
            break
        }
        buffer.restore()
      }
    })
  }

  #drawProps(buffer) {
    this.mapData.props.forEach((prop) => {
      buffer.save()
      buffer.globalAlpha = MapEditor.PROP_ALPHA
      buffer.fillStyle = MapEditor.COLORS.prop
      buffer.fillRect(
        prop.x + MapEditor.PROP_OFFSET,
        prop.y + MapEditor.PROP_OFFSET,
        prop.width - MapEditor.PROP_OFFSET * 2,
        prop.height - MapEditor.PROP_OFFSET * 2
      )
      buffer.globalAlpha = 1.0
      buffer.font = "bold 30px Arial"
      buffer.fillStyle = '#000000'
      buffer.strokeStyle = '#ffffff'
      buffer.lineWidth = 4
      buffer.textAlign = 'center'
      buffer.textBaseline = 'middle'
      buffer.strokeText(prop.label, prop.x + prop.width / 2, prop.y + prop.height / 2)
      buffer.fillText(prop.label, prop.x + prop.width / 2, prop.y + prop.height / 2)
      buffer.restore()
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
    switch(this.#drawMode) {
      case this.#DRAW_TILE:
        this.#buffer.fillStyle = MapEditor.COLORS.tileCursor
        break
      case this.#DRAW_PROP:
        this.#buffer.fillStyle = MapEditor.COLORS.propCursor
        break
    }

    const { x1, y1, x2, y2 } = this.selectedRegion
    this.#buffer.fillRect(x1, y1, x2 - x1, y2 - y1)
    this.#buffer.restore()
  }

  #redrawCanvas() {
    this.#clearCanvas(this.#buffer)
    this.#buffer.save()
    this.#buffer.scale(this.#canvasTransform.scale, this.#canvasTransform.scale)
    this.#buffer.translate(this.#canvasTransform.offsetX, this.#canvasTransform.offsetY)
    this.#drawGrid(this.#buffer)
    this.#drawTiles(this.#buffer)
    this.#drawProps(this.#buffer)
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
      const tile = this.tileDataOf(this.#drawTilePath)
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

  addProp(x1, y1, x2, y2) {
    const newProp = {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      label: ''
    }
    this.mapData.props.push(newProp)
  }

  deleteSelectedTiles() {
    this.mapData.tiles = this.mapData.tiles.filter((tile) => !this.#selectedTiles.includes(tile))
    this.#selectedTiles = []
    this.#redrawCanvas()
  }

  deleteSelectedProps() {
    this.mapData.props = this.mapData.props.filter((prop) => !this.#selectedProps.includes(prop))
    this.#selectedProps = []
    this.#redrawCanvas()
  }

  #objectInRegion(x1, y1, x2, y2, x3, y3, x4, y4) {
    return (
      ((x1 >= x3 && x1 <= x4) || (x2 >= x3 && x2 <= x4) || (x3 >= x1 && x3 <= x2) || (x4 >= x1 && x4 <= x2))
      && ((y1 >= y3 && y1 <= y4) || (y2 >= y3 && y2 <= y4) || (y3 >= y1 && y3 <= y2) || (y4 >= y1 && y4 <= y2))
    )        
  }

  #tileInRegion(tile, x1, y1, x2, y2) {
    x1+=12
    x2-=12
    y1+=12
    y2-=12

    const img = this.tileDataOf(tile.path).image
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
    return this.#objectInRegion(x1, y1, x2, y2, x3, y3, x4, y4)
  }

  #propInRegion(prop, x1, y1, x2, y2) {
    x1+=12
    x2-=12
    y1+=12
    y2-=12

    const x3 = prop.x
    const y3 = prop.y
    const x4 = prop.x + prop.width
    const y4 = prop.y + prop.height
    return this.#objectInRegion(x1, y1, x2, y2, x3, y3, x4, y4)
  }

  #tileOnCursor(tile, x, y) {
    return this.#tileInRegion(tile, x, y)
  }

  #getCursorTile(x, y) {
    return this.mapData.tiles.find((tile) => this.#tileOnCursor(tile, x, y))
  }  

  #tileOnProp(prop, x, y) {
    return this.#propInRegion(prop, x, y)
  }

  #getCursorProp(x, y) {
    return this.mapData.props.find((prop) => this.#tileOnProp(prop, x, y))
  }
}

class App extends Component {
  constructor({ editor }) {
    super()
    this.editor = editor
    this.state = {
      tags: editor.tileTags,
      filtered: editor.sortedFilteredTiles,
      usage: [],

      selectedTags: editor.selectedTags,
      selectedTile: null,

      campaign: null,
      filename: '',

      showFileList: false,
    }

    fetch(`/campaign`)
      .then((response) => response.json())
      .then((campaign) => { this.setState({ campaign }) })

    editor.onUpdateSelectedTiles = (selectedTiles) => {
      if(selectedTiles.length === 1) {
        const tags = this.editor.tileDataOf(selectedTiles[0].path).tags
        this.editor.setSelectedTags(tags)
        this.editor.setDrawTile(selectedTiles[0].path)
        this.setState({ 
          selectedTags: tags,
          selectedTile: selectedTiles[0].path,
          filtered: this.editor.sortedFilteredTiles,
        })
      } else if(selectedTiles.length === 0) {
        this.editor.setDrawTile(null)
        this.setState({ 
          selectedTile: null,
        })
      }
    }

    editor.onUpdateMapData = (mapData) => {
      this.updateUsage()
    }
  }

  updateUsage() {
    this.setState({
      usage: this.editor.tilesLibrary.map((tile) => ({ 
        path: tile.path,
        count: this.editor.countUse(tile.path) 
      })),
    })
  }

  createMapFile(filename) {
    this.editor.saveMap(filename)
  }

  usageOf(path) {
    const tile = this.state.usage.find((tile) => tile.path === path)
    return tile ? tile.count : 0
  }

  render() {
    return html`
      <h3>Map</h3>
      <div class="map-info">
        <label for="filename">File Name:</label>
        <input type="text" id="filename" name="filename" value=${this.state.filename} onChange=${(event) => {
          this.setState({ filename: event.target.value })
        }} />
        <button
          onClick=${() => this.createMapFile(this.state.filename)}
          disabled=${
            this.state.campaign
            && this.state.campaign.maps
            && this.state.campaign.maps
            .some(map => map.label === this.state.filename)}
        >Create</button>
        <button onClick=${() => this.setState({ showFileList: true })}>Load</button>
        <button onClick=${() => this.editor.exportMap(this.state.filename)}>Export</button>
      </div>
      <h3>Tiles</h3>
      <${TagList}
        tags=${this.state.tags}
        selected=${this.state.selectedTags}
        onSelect=${tag => {
          const next = toggleTag(tag, this.state.selectedTags)
          this.editor.setSelectedTags(next)
          this.setState({
            selectedTags: next,
            filtered: this.editor.sortedFilteredTiles,
          })
        }}
      />
      <div class="tile-list">
        ${this.state.filtered.map((tile) => html`
          <div class="tile ${this.state.selectedTile === tile.path ? 'selected' : ''}">
            <div class="label">
              ${tile.width}×${tile.height} ${tile.label}
              <span class="${this.usageOf(tile.path) > tile.inventory ? 'full' : ''}">
                <strong> (${this.usageOf(tile.path)}/${tile.inventory})</strong>
              </span>
            </div>
            <div class="image-container">
              <img 
                src=${`tile/${tile.path}`} alt=${tile.label}
                onClick=${() => {
                  this.editor.toggleDrawTile(tile.path)
                  this.setState({ selectedTile: this.editor.drawTilePath })
                }}
              />
            </div>
          </div>
        `)}
      </div>
      <h3>Print List</h3>
      <ul class="print-list">
        ${this.editor.tilesLibrary
          .map((tile) => ({ path: tile.path, name: tile.name, count: this.usageOf(tile.path) - tile.inventory }))
          .filter(tile => tile.count > 0)
          .map(tile => html`
            <li>${tile.name} (${tile.count})</li>
          `)
        }
      </ul>
      ${this.state.showFileList && html`<${FileSelectorModal}
        files=${this.state.campaign.maps}
        onPin=${() => {}}
        onSelectNone=${() => {}}
        onClose=${() => this.setState({ showFileList: false })}
        onSelect=${(label, path) => {
          this.editor.loadMap(path)
            .then(() => {
              this.setState({ 
                filename: label,
                showFileList: false 
              }, () => this.updateUsage())
            })
        }}
      />`}
    `
  }
}

render(html`
<div class="editor-container flat-page">
  <div class="canvas-container">
    <canvas id="canvas" width="1200" height="600" tabindex="0"></canvas>
  </div>
  <div id="ui"></div>
</div>
`, document.querySelector('.page-content'))

const editor = new MapEditor(document.getElementById('canvas'))
editor.loadTiles('/tileset').then(() => {
  render(html`<${App} editor=${editor} />`, document.getElementById('ui'))
})
