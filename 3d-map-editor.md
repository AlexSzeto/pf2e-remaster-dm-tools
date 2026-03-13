# 3D Map Editor — Implementation Plan

A staged implementation plan for a map editor that uses 3D models for tiles and props, placed on a flat 2D grid rendered in a 3D viewport. The plan is designed to be self-contained and exportable to a new project without prior codebase context.

---

## Architecture Overview

### Technology
- **Renderer**: Three.js (WebGL) for the 3D viewport.
- **UI Framework**: Preact + HTM for the sidebar/panel UI.
- **Server**: Express.js with file-upload middleware (e.g. `express-fileupload`).
- **3D Model Import Formats**: STL (`.stl`) and OBJ (`.obj`) — these are the user-facing input formats.
- **3D Model Storage Format**: GLB (`.glb`) — all imported models are decimated and converted to GLB on the server before storage. Three.js loads these via `GLTFLoader`.
- **Server-side Model Processing**: `@gltf-transform/core`, `@gltf-transform/functions`, and `meshoptimizer` (via `@gltf-transform/extensions`) for mesh decimation and GLB conversion.

### Layout

The app is a single page with a **flex-row** layout:

```
┌──────────────────────────────────────────┬──────────────────┐
│                                          │                  │
│          3D Viewport (canvas)            │    Sidebar UI    │
│                                          │                  │
│  - Grid plane                            │  - Map section   │
│  - Tiles (3D models on grid)             │  - Config        │
│  - Props (3D models on tiles)            │  - Tile library  │
│  - Areas (translucent labeled planes)    │  - Prop library  │
│  - Cursor highlight                      │  - Pack/Print    │
│                                          │                  │
└──────────────────────────────────────────┴──────────────────┘
```

### Camera
- **Orthographic top-down** camera. The look direction is straight down the Y axis at the grid (XZ plane).
- Pan and zoom manipulate the camera's position and frustum size, not the scene transform.

### Grid System
- The map is a flat 2D grid on the XZ plane.
- A **unit cell** is the base tile size (e.g. 1.0 world unit on each axis).
- A **half-unit** is the snapping resolution (0.5 world units).
- Grid dimensions are configurable as `width × height` in unit cells.

---

## Data Formats

### Tile Library Entry (server `data.json` → `tiles[]`)
```json
{
  "path": "cave-floor-2x3.glb",
  "preview": "cave-floor-2x3.webp",
  "label": "Cave Floor",
  "tags": ["cave", "floor"],
  "color": "#7a6a50",
  "width": 4,
  "height": 6,
  "count": 10
}
```
- `path` — filename of the GLB model (stored in the models directory).
- `preview` — filename of a pre-rendered top-down image (stored in the images directory).
- `color` — hex color string applied uniformly to every mesh in the model (e.g. `"#7a6a50"`). Used for preview generation and live viewport rendering. Can be edited directly in `data.json` to recolor the model without re-importing.
- `width`, `height` — in **half-units** (grid cells). A 2×3 unit tile is `4×6`.
- `count` — available physical stock of this tile.

### Prop Library Entry (server `data.json` → `props[]`)
```json
{
  "path": "barrel.glb",
  "preview": "barrel.webp",
  "label": "Barrel",
  "tags": ["furniture", "tavern"],
  "color": "#5c3d1e",
  "width": 1,
  "height": 1,
  "count": 20
}
```
- Same schema as tiles but stored in a separate `props[]` array.
- `preview` — pre-rendered **isometric** view of the model.
- `color` — same as tile entries: a hex color string applied uniformly to the model.

### Map Data (saved/loaded as `.json`)
```json
{
  "width": 40,
  "height": 40,
  "tiles": [
    { "path": "cave-floor-2x3.glb", "rotation": 0, "x": 0, "y": 0 }
  ],
  "props": [
    { "path": "barrel.glb", "rotation": 90, "x": 5, "y": 3 }
  ],
  "areas": [
    { "x": 0, "y": 0, "width": 10, "height": 8, "label": "Entrance Hall" }
  ]
}
```
- `width`, `height` — map size in **unit cells**.
- `x`, `y` — position in **half-unit** grid coordinates (matching the grid snap).
- `rotation` — `0`, `90`, `180`, or `270` degrees.

> **Note on color**: The placed tile/prop entries in the map file do **not** store color. Color is always read from the library entry (`data.json → tiles[]` / `props[]`) by matching `path`. This means changing the color in `data.json` automatically recolors all placed instances of that model.

---

## Server API

The server is an Express.js app. It serves the editor page, static assets, and provides REST endpoints for data and file management.

### Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/:source/data` | Returns the full `data.json` for a source (e.g. `dm`). Contains `tiles[]`, `props[]`, and `maps[]` arrays. |
| `POST` | `/:source/data` | Overwrites the full `data.json` for a source. |
| `POST` | `/:source/data/:subtype` | Add/update a single entry in a subtype array (e.g. `tile`, `prop`, `map`). |
| `GET` | `/:source/media/:file` | Serves a media file (model, image, map JSON). File type is inferred from extension. |
| `POST` | `/:source/media` | Uploads a media file. Accepts multipart form with `file`, `name`, `subtype`, and optional `tags`. |
| `DELETE` | `/:source/media/:file` | Deletes a media file and its reference entry. |

### Media Type Routing

Files are stored in subdirectories by type, inferred from extension:
- `models/` — `.glb` (converted from STL/OBJ during import)
- `images/` — `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- `maps/` — `.json`

The server's `mediaExtensions` map needs to be extended to include `models: ['glb']`.

> **Note**: Raw `.stl` and `.obj` files are **not** stored — they are uploaded to the import endpoint, processed (decimated + converted to GLB), and discarded. Only the resulting `.glb` is persisted.

### File Storage Structure (per source)
```
<source-root>/
  <current-folder>/
    data.json          ← tile/prop/map library metadata
    models/            ← GLB files (decimated, converted from STL/OBJ)
    images/            ← preview images (rendered from models)
    maps/              ← map JSON files
```

---

## Shared Components

### TagList
A reusable UI component for tag-based filtering:
- `getTagsList(dataList)` — extracts a unique sorted list of tags from a data array.
- `getTaggedData(dataList, selectedTags)` — filters data by all selected tags (AND logic).
- `toggleTag(tag, selected)` — adds/removes a tag from the selection.
- `<TagList tags selected onSelect />` — renders clickable tag buttons with a selected state.

### FileSelectorModal
A modal dialog that lists available files and allows the user to select one:
- Props: `files`, `onSelect(label, path)`, `onClose`.

### openFloatingPrompt
Opens a small text input popup at the cursor position:
- `openFloatingPrompt(event, currentValue, onConfirm)` — used for editing area labels.

---

## Implementation Stages

Each stage produces a fully testable build of the editor.

---

## Stage 1: Tile Importer & Basic Viewport

**Goal**: Import 3D models (STL/OBJ) into the library — the server decimates and converts them to GLB for efficient runtime rendering. A rendered preview image is generated client-side and stored alongside the model. Display a basic 3D viewport with a grid. Imported objects are placed at the center of the grid for verification.

### Server

#### 1a. Install model processing dependencies
```bash
npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer
npm install stl-to-gltf obj-to-gltf   # or equivalent STL/OBJ → glTF converters
```
- `@gltf-transform/core` — read/write glTF documents programmatically.
- `@gltf-transform/functions` — provides `weld()`, `simplify()`, `dedup()`, and other mesh optimization transforms.
- `meshoptimizer` — the WASM-based simplifier backend used by `simplify()`.
- `stl-to-gltf` / `obj-to-gltf` (or embedded conversion logic) — converts the raw input format into an in-memory glTF document that glTF-Transform can operate on.

#### 1b. Extend media type routing
- Add `models: ['glb']` to the `mediaExtensions` map in the media CRUD module.
- Ensure that `.glb` files are stored in the `models/` subdirectory.
- Raw `.stl` / `.obj` files are **not** added to `mediaExtensions` — they are transient and never persisted.

#### 1c. Add `tile` and `prop` subtypes to reference CRUD
- Add `tile: 'tiles'` and `prop: 'props'` to `subtypeSingularToPlural` in the reference CRUD module.
- This allows `POST /:source/data/tile` and `POST /:source/data/prop` to add entries to the correct arrays.

#### 1d. Model import endpoint — `POST /:source/import`
A **dedicated import endpoint** that receives the raw model file, processes it, and stores the result. This is necessary because the conversion and decimation happen server-side before the file is stored.

**Request** (multipart form):
- `file` — the raw `.stl` or `.obj` file.
- `name` — display label for the asset.
- `type` — `"tile"` or `"prop"`.
- `color` — hex color string (e.g. `"#7a6a50"`) chosen by the user in the import modal.
- `width` — width in half-units (integer).
- `height` — height in half-units (integer).
- `tags` — comma-separated tag string.
- `count` — available stock (integer).

**Server-side processing pipeline**:
1. **Detect format** from the uploaded file's extension (`.stl` or `.obj`).
2. **Convert to glTF document**:
   - For STL: use `stl-to-gltf` (or manually parse the STL binary/ASCII and build a glTF `Document` with a single mesh).
   - For OBJ: use `obj-to-gltf` (handles vertices, normals, and UVs).
3. **Mesh decimation** via glTF-Transform:
   ```js
   import { NodeIO } from '@gltf-transform/core'
   import { weld, simplify, dedup } from '@gltf-transform/functions'
   import { MeshoptSimplifier } from 'meshoptimizer'

   await MeshoptSimplifier.ready
   const io = new NodeIO()
   const document = /* glTF Document from step 2 */

   await document.transform(
     dedup(),                          // remove duplicate accessors/textures
     weld({ tolerance: 0.001 }),       // weld nearby vertices
     simplify({
       simplifier: MeshoptSimplifier,
       ratio: 0.5,                     // target 50% triangle reduction
       error: 0.01,                    // max allowed geometric error
     }),
   )
   ```
   - `dedup()` — removes duplicate vertex data and textures.
   - `weld()` — merges vertices within a tolerance to improve simplification.
   - `simplify()` — reduces triangle count to the target `ratio` (0.5 = 50% of original). The `error` threshold prevents excessive quality loss.
   - These parameters should be tuned for the target hardware. A `ratio` of 0.5 with `error` of 0.01 is a reasonable starting point.
4. **Export to GLB**:
   ```js
   const glb = await io.writeBinary(document)  // returns a Uint8Array
   ```
5. **Store the GLB** file in `models/` with a filename derived from the label (lowercased, dashes, `.glb` extension).
6. **Add metadata entry** to `data.json` → `tiles[]` or `props[]`:
   ```json
   {
     "path": "cave-floor-2x3.glb",
     "preview": "cave-floor-2x3.webp",
     "label": "Cave Floor",
     "tags": ["cave", "floor"],
     "color": "#7a6a50",
     "width": 4,
     "height": 6,
     "count": 10
   }
   ```
   The `color` field is taken directly from the `color` form field submitted by the client. The `preview` field is populated in a **second request** from the client (see 1i below).
7. **Return** a success response containing the stored GLB filename (so the client can load it for verification and preview generation).

**Response**:
```json
{
  "success": true,
  "message": "Imported cave-floor-2x3.glb",
  "glbPath": "cave-floor-2x3.glb"
}
```

### Client

#### 1e. Three.js viewport setup
Create the map editor page with:
- A `<canvas>` element rendered by Three.js (WebGLRenderer).
- An **orthographic camera** looking down the Y-axis at the XZ plane.
- A scene containing:
  - A flat plane mesh for the grid (with a grid-line texture or line segments).
  - Ambient light + directional light for model illumination.

#### 1f. Grid rendering
- Draw grid lines on the XZ plane as `THREE.LineSegments`:
  - **Sub-grid lines** (lighter color) every half-unit.
  - **Unit lines** (darker/thicker) every full unit.
- The grid covers the map's `width × height` (default 40×40 units).
- The area outside the grid is a dark background (renderer clear color).

#### 1g. Viewport controls
- **Pan**: Middle-mouse-button drag translates the camera's X/Z position.
- **Zoom**: Scroll wheel adjusts the orthographic frustum size (min/max bounds to prevent over-zoom).
- Disable right-click context menu on the canvas.
- Track cursor position in world coordinates (use `THREE.Raycaster` to project screen coords onto the grid plane).

#### 1h. Grid snapping utility
- `snapToGrid(worldPos)` — snaps an (x, z) world position to the nearest half-unit grid point.

#### 1i. Import modal UI
A modal dialog (opened via a button in the sidebar) with:
- **File input**: accepts `.stl` and `.obj` files.
- **Type selector**: radio buttons for "Tile" or "Prop".
- **Label field**: text input for the asset name.
- **Color picker**: an `<input type="color">` for choosing the model's display color (default `#888888`). Changing this color live-updates the material applied to the model in the preview pane so the user can evaluate the result before importing.
- **Width / Height fields**: numeric inputs for size in unit cells (the modal converts to half-units internally for storage: stored value = input × 2).
- **Tags field**: comma-separated tag input.
- **Count field**: numeric input for available stock.
- **3D Preview pane**: a small Three.js renderer within the modal that displays the loaded model.
  - The raw STL/OBJ is loaded **client-side** into the preview pane using Three.js `STLLoader` / `OBJLoader` so the user can visually verify the model before importing.
  - The model is rendered using a `MeshStandardMaterial` with `color` set to the chosen color. Ambient + directional lighting is used so the color reads clearly.
  - For **Tiles**: rendered from a top-down orthographic view.
  - For **Props**: rendered from an isometric perspective view.
- **Import button**: triggers the import sequence (see 1j below).

#### 1j. Import sequence (client-side orchestration)
When the user clicks Import:
1. **Upload the raw model** to `POST /:source/import` with all metadata fields (including `color`). The server decimates, converts to GLB, stores it, and returns the `glbPath`.
2. **Load the stored GLB** from the server into the modal's preview pane (replacing the raw STL/OBJ preview). Apply the chosen color as a `MeshStandardMaterial` override to confirm the decimated result also looks correct.
3. **Generate preview image**: render the GLB in the preview pane's Three.js renderer **with the chosen color applied**, then call `renderer.domElement.toBlob()` to capture it as a `.webp` image. This ensures the preview thumbnail in the sidebar reflects the model's actual display color.
4. **Upload the preview image** via `POST /:source/media` (stored in `images/`).
5. **Update the metadata entry** via `POST /:source/data/tile` (or `/prop`) to set the `preview` field to the uploaded image filename.
6. **Place the GLB** in the main viewport at the center of the grid for visual verification, using the chosen color.

#### 1k. Center-of-grid verification
After a model is successfully imported:
- Load the GLB from the server into the main viewport scene.
- Place it at the center of the grid, **replacing any previously placed import preview**.
- This allows visual verification that the decimated model loaded correctly and has the right scale.

#### 1l. Sidebar UI skeleton
Render the basic sidebar layout with placeholder sections (functional content added in later stages):
- **Map** section (file name input, Create/Load/Export buttons — disabled for now).
- **Config** section (width/height inputs — functional, they rebuild the grid on change).
- **Import** button (opens the import modal).
- **Tiles** section (empty placeholder: "No tiles loaded").
- **Props** section (empty placeholder: "No props loaded").

### Testable at this stage
- Open the editor page → see a 3D grid viewport.
- Pan with middle mouse button, zoom with scroll wheel.
- Open the import modal → load an STL or OBJ file → see the raw model in the preview pane.
- Set label, dimensions, tags, count → click Import.
- Server processes the file (decimation + GLB conversion) → decimated GLB replaces raw preview in modal.
- Preview image is generated and uploaded.
- Imported model appears at center of grid in the main viewport.
- Verify files on disk: `models/` has the decimated `.glb`, `images/` has the `.webp` preview, `data.json` has the entry.
- Change map width/height → grid resizes.

---

## Stage 2: Tile Editing

**Goal**: Restore core tile editing: select, multi-select, place, move, rotate, delete, and fill tiles on the grid. A hardcoded tile path is used as the draw tile (sidebar tile selection comes in Stage 3).

### Client

#### 2a. Tile library loading
- On startup, fetch `/:source/data` to get the tile library (`data.json → tiles[]`).
- For each tile entry, load its GLB model using `GLTFLoader` and cache the result (keyed by `path`).
- Tile models are loaded once and instanced for each placement.

#### 2b. Tile placement data
- The `mapData` object matches the JSON format: `{ width, height, tiles: [], props: [], areas: [] }`.
- Each placed tile is: `{ path, rotation, x, y }` where `x`, `y` are in half-unit grid coordinates.

#### 2c. Tile rendering on the grid
- For each tile in `mapData.tiles`, clone/instance the cached model and position it on the grid:
  - World position: `(x * halfUnit, 0, y * halfUnit)` where `halfUnit = 0.5` world units.
  - Rotation: apply Y-axis rotation in degrees (0/90/180/270).
  - **Color**: look up the library entry by `path` and apply its `color` value as a `MeshStandardMaterial` override to every mesh in the cloned model. This is done once per clone using `mesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(entry.color) })`.
- Tiles render in array order (later = higher z-order priority, though in 3D this mainly affects selection hit-testing priority).
- **Selection highlight**: selected tiles get a visual indicator — either a translucent colored plane overlaid at their bounding box, or a colored outline effect (outline pass or emissive tint).

#### 2d. Raycasting for cursor interaction
- On mouse move, raycast from the camera through the cursor onto the grid plane to get the world (x, z) position.
- Snap to half-unit for all placement/selection operations.
- Also raycast against tile meshes for "what is the cursor over?" hit-testing.
  - Use `raycaster.intersectObjects(tileGroup.children)` and map back to the tile data by associating each mesh with its tile entry.

#### 2e. Draw modes
- Implement a `drawMode` state with values: `DRAW_TILE`, `DRAW_PROP`, `DRAW_AREA`.
- The `A` key cycles through modes. For Stage 2, only `DRAW_TILE` is functional.
- The cursor highlight color/shape changes based on the active mode.

#### 2f. Cursor highlight
- A translucent plane mesh that follows the cursor, snapped to the grid.
- In `DRAW_TILE` mode: red translucent rectangle covering one grid cell (or the drag region).
- During drag-select or drag-fill, the highlight expands to cover the full rectangular region.

#### 2g. Tile selection (single click)
- **Left-click on a tile** (detected via raycasting against tile meshes): select it, deselect all others.
- **Left-click on empty space**: begin marquee selection (enters `DRAG_SELECT` state).
- If clicking a tile that is already in the current multi-selection, keep the selection as-is (for group drag).

#### 2h. Tile selection (marquee)
- When left-click starts on empty space, track the drag start position.
- On mouse move during drag, update the cursor highlight to cover the rectangle from start to current position.
- On mouse-up, select all tiles whose bounding boxes overlap the marquee rectangle.
- The overlap test checks axis-aligned bounding boxes on the XZ plane, accounting for tile rotation swapping width/height.

#### 2i. Tile moving
- When left-click-drag starts on a selected tile:
  - Record offset from cursor to each selected tile's position.
  - On mouse move, update each tile's position (snapped to grid), maintaining relative offsets.
  - On mouse-up, finalize positions and trigger save.
- Selecting/moving tiles brings them to the **top of the z-order** (move to end of `tiles[]` array and re-render).

#### 2j. Tile rotation
- Press **`R`** with cursor over a tile → cycle its `rotation` by +90° (mod 360).
- Update the 3D mesh rotation and redraw.

#### 2k. Tile deletion
- Press **`D`** in tile mode → remove all selected tiles from `mapData.tiles` and from the scene.

#### 2l. Tile filling (right-click-drag)
- Right-click-drag defines a rectangular fill region (from drag start to current position, snapped to grid).
- On mouse-up, run the **recursive fill algorithm**:
  1. If a **draw tile** is active: attempt to fit it (natural or rotated 90°) into the region. If it fits, place it and recursively fill remaining gaps. If it doesn't fit at all, place one at the origin of the region.
  2. If no draw tile is active: iterate the sorted/filtered tile library (largest area first), place the first fitting tile, recurse.
  3. Tiles auto-rotate 90° if needed to fit.
- For Stage 2, **hardcode a specific tile path** as the active draw tile (e.g. the first tile in the library), since sidebar selection isn't implemented yet.

#### 2m. Dimension display
- While dragging (fill or select), display a text label at the corner of the region showing `(w, h)` in unit cells.
- Use a Three.js text sprite or HTML overlay positioned at the world-space corner.
- Only show when the region is larger than one grid cell.

#### 2n. Undo / Redo
- **Ctrl+Z** → undo, **Ctrl+R** → redo.
- Buffer up to **50** JSON snapshots of `mapData`.
- Snapshot taken before each modifying action (mouse-down, delete, rotate).
- Duplicate consecutive snapshots skipped (JSON string comparison).
- New action after undo clears the redo buffer.
- On restore, rebuild the 3D scene from the restored `mapData` and trigger save.

#### 2o. Scene rebuild
- Implement a `rebuildTileScene()` function that clears all tile meshes from the scene and re-creates them from `mapData.tiles`.
- Called after load, undo/redo, and delete operations.
- For move and rotate, update individual mesh transforms in-place for efficiency (full rebuild as fallback).

### Testable at this stage
- Tiles from the library appear in the viewport when placed.
- Left-click selects a single tile, drag-select selects multiple.
- Drag to move selected tiles; positions snap to grid.
- `R` rotates a tile under cursor. `D` deletes selected tiles.
- Right-click-drag fills a region with the hardcoded tile.
- Ctrl+Z undoes, Ctrl+R redoes.
- Dimension label appears during drag.

---

## Stage 3: Tile Model Selection UI

**Goal**: Restore the sidebar UI for filtering and selecting tiles from the library. The hardcoded draw tile from Stage 2 is replaced by user selection.

### Client

#### 3a. Tile library sidebar
In the **Tiles** section of the sidebar, render:
- **TagList component**: shows all tile tags, clickable to toggle filter.
- **Selected Tile indicator**: text showing the active draw tile path, or "No Tile Selected".
- **Tile list**: scrollable grid of tile entries, filtered by selected tags.

#### 3b. Tile list entries
Each tile entry displays:
- **Dimensions**: `width × height` in unit cells (half-unit values ÷ 2).
- **Label**: the tile's name.
- **Usage counter**: `(used / available)`.
  - Normal: used < available.
  - **Warn** (orange): used == available.
  - **Full** (red): used > available.
- **Preview image**: the pre-rendered top-down image (from `preview` path in the library entry), loaded from the server via `/:source/media/:preview`. Clickable to toggle as active draw tile.

#### 3c. Tile sorting
- Tiles are sorted by **area** (width × height, largest first).
- Ties broken by **tag count** (fewer tags first).

#### 3d. Draw tile selection
- Clicking a tile preview **toggles** it as the active draw tile.
- Clicking the same tile again deselects it (draw tile → null).
- When tile selection on the canvas is cleared, the draw tile is also cleared.
- The active draw tile replaces the hardcoded tile from Stage 2 in the fill algorithm.

#### 3e. Tag filtering
- Toggling a tag updates the filter. The tile list shows only tiles matching **all** selected tags.
- If the current draw tile is no longer in the filtered list after a tag change, clear the draw tile.

#### 3f. Usage count updates
- Whenever `mapData` changes (tile placed, deleted, undo/redo), recalculate usage counts for each tile in the library.
- `countUse(path)` → count of tiles with matching path in `mapData.tiles`.

### Testable at this stage
- Sidebar shows tile library with previews, labels, dimensions, and usage counts.
- Tag buttons filter the list.
- Clicking a tile preview selects it as draw tile; right-click-drag fills with that tile.
- Usage counts update as tiles are placed/deleted.
- Warn/full color coding works when stock thresholds are hit.

---

## Stage 4: Prop Handling

**Goal**: Add a separate prop library and replicate tile editing capabilities for props (place, select, move, rotate, delete — but no region-fill).

### Client

#### 4a. Prop library loading
- Same pattern as tiles: fetch `/:source/data` → `props[]` array.
- Load each prop's GLB model with `GLTFLoader` and cache.

#### 4b. Prop sidebar UI
- Below the Tiles section, add a **Props** section with:
  - **TagList**: separate tag filter for props (or a shared one with a mode indicator).
  - **Selected Prop indicator**: text showing active draw prop path, or "No Prop Selected".
  - **Prop list**: same layout as tile list but using **isometric preview images**.
  - **Usage counter**: same warn/full logic as tiles, operating on `mapData.props`.

#### 4c. Draw prop selection
- Clicking a prop preview **toggles** it as the active draw prop.
- There is no draw tile / draw prop conflict — only one is active at a time, determined by the current `drawMode`.

#### 4d. Prop rendering on the grid
- For each prop in `mapData.props`, clone/instance the cached model:
  - Position: `(x * halfUnit, tileTopY, y * halfUnit)` — props sit on top of the tile surface. Use the bounding box of the tile at that grid position or a default height if no tile is present.
  - Rotation: Y-axis rotation (0/90/180/270).
  - **Color**: same pattern as tiles — look up the prop's library entry by `path` and apply `entry.color` as a `MeshStandardMaterial` override to all meshes in the clone.
- Props render above tiles in the scene.
- Selection highlight similar to tiles (outline or translucent overlay).

#### 4e. Prop interactions in DRAW_PROP mode
Replicate tile interactions with these differences:
- **Left-click on a prop**: select it.
- **Left-click on empty space with draw prop active**: **place a single new prop** at the cursor position (snapped to grid). No marquee selection for props.
- **Left-click-drag on a selected prop**: move it (snap to grid).
- **`R`** on a prop: rotate 90° clockwise.
- **`D`** on a prop: delete the prop under the cursor.
- **No right-click-drag fill** for props. Right-click-drag in Prop Mode is a no-op (or could pan the viewport instead).

#### 4f. Undo/Redo integration
- Undo/redo snapshots already capture the full `mapData` (including `props[]`), so prop operations are automatically covered.
- Scene rebuild on undo/redo must also rebuild prop meshes.

#### 4g. Scene rebuild extension
- Add `rebuildPropScene()` alongside `rebuildTileScene()`.
- Called after load, undo/redo, prop delete, and prop place.

### Testable at this stage
- Prop library visible in sidebar with isometric previews, tags, usage counts.
- Switching to Prop Mode with `A` changes cursor color to green.
- Clicking a prop preview selects it; clicking empty space places a new prop.
- Props appear on the grid, sitting on top of tiles.
- Select, move (snap to grid), rotate (`R`), delete (`D`) all work.
- Undo/redo covers prop operations.

---

## Stage 5: Area Handling

**Goal**: Implement areas — translucent labeled planes drawn over the grid, with create, select, move, edit-label, and delete operations.

### Client

#### 5a. Area rendering
- For each area in `mapData.areas`, render a semi-transparent colored plane:
  - Position on the grid: `(x * halfUnit, areaY, y * halfUnit)` at a slight Y offset above the grid surface.
  - Size: `(width * halfUnit) × (height * halfUnit)`.
  - Material: `MeshBasicMaterial` with a color, `transparent: true`, `opacity: 0.4`.
- Labels rendered as text (Three.js sprite or CSS2DObject):
  - Bold, centered on the area.
  - Multi-line labels (split on `\\`) stacked vertically.

#### 5b. Area mode interactions (DRAW_AREA)
- **Left-click on an area**: select it.
- **Left-click (no drag) on a selected area**: open the floating text prompt to edit the label.
- **Left-click-drag on a selected area**: move it (snap to grid).
- **Right-click-drag**: define a rectangular region → create a new area on mouse-up with an empty label.
- **`D`** on an area: delete the area under the cursor.
- Cursor highlight is translucent blue.

#### 5c. Floating prompt for label editing
- Use the `openFloatingPrompt` pattern: a small text input appears at the click position.
- On confirm, update the area's `label` and re-render the text. Save the map.

#### 5d. Undo/Redo integration
- Areas are part of `mapData`, so undo/redo snapshots already cover them.
- Scene rebuild must also rebuild area meshes and labels.

#### 5e. Scene rebuild extension
- Add `rebuildAreaScene()`.

### Testable at this stage
- Switch to Area Mode with `A` (Tile → Prop → Area cycle).
- Right-click-drag creates a new area (translucent plane visible on grid).
- Click an area → click again without drag → edit label prompt appears.
- Move areas by dragging, delete with `D`.
- Labels display centered on the area, supporting multi-line.
- Undo/redo covers area operations.
- All three modes cycle correctly with `A`.

---

## Stage 6: Miscellaneous Features

**Goal**: Implement save/load/export, map resizing, crop, pack list, print list, and polish.

### Client

#### 6a. Save
- Auto-save after every modifying interaction: tile/prop/area place, move, rotate, delete, label edit, undo/redo.
- Serialize `mapData` to JSON and `POST` to `/:source/media` with the filename derived from the map name.
- Display "Last saved on [timestamp]" in the sidebar.

#### 6b. Create
- **File name** text input + **Create** button in the Map section.
- Create button disabled if a map with the same label already exists (checked against `/:source/data` → `maps[]`).
- On click: save current `mapData` as a new JSON file and add a reference.

#### 6c. Load
- **Load** button opens `FileSelectorModal` with existing map files from the campaign.
- On select: fetch the JSON, populate `mapData`, rebuild the entire 3D scene, update sidebar state.

#### 6d. Export
- **Export** button renders the map to an off-screen canvas (Three.js renderer):
  - Render grid + tiles + props + areas, **no cursor/selection overlays**.
  - Use a dedicated orthographic camera sized to the map bounds.
  - Capture as JPEG blob at a suitable resolution.
- Upload the JPEG via `POST /:source/media` with the `battlemap` tag.

#### 6e. Crop
- **Crop** button shrinks `width` and `height` to tightly fit all placed tiles (plus 1 unit cell padding).
- Recalculates by finding the maximum x + tileWidth and y + tileHeight across all tiles.
- Rebuilds the grid and updates the width/height input fields.

#### 6f. Map width/height inputs
- Numeric inputs that immediately rebuild the grid when changed.
- The grid line geometry is regenerated to match the new dimensions.

#### 6g. Pack List
- Below the library sections, show all tiles and props currently used on the map (usage > 0).
- Each entry: preview thumbnail, name, usage count.

#### 6h. Print List
- Below the Pack List, show tiles/props where usage **exceeds** available stock.
- Each entry: name, excess count (`used - available`).

#### 6i. Keyboard shortcut finalization
Ensure all shortcuts work:

| Key | Context | Action |
|---|---|---|
| `A` | Any | Cycle: Tile → Prop → Area mode |
| `D` | Tile Mode | Delete selected tiles |
| `D` | Prop Mode | Delete prop under cursor |
| `D` | Area Mode | Delete area under cursor |
| `R` | Tile Mode | Rotate tile under cursor 90° CW |
| `R` | Prop Mode | Rotate prop under cursor 90° CW |
| `Ctrl+Z` | Any | Undo |
| `Ctrl+R` | Any | Redo |

#### 6j. Mouse interaction finalization

| Input | Context | Action |
|---|---|---|
| Left click | Tile Mode, on tile | Select tile |
| Left click | Tile Mode, on empty | Begin marquee select |
| Left drag | Tile Mode, on selected tile | Move selected tiles |
| Left drag | Tile Mode, on empty | Marquee select |
| Left click | Prop Mode, on prop | Select prop |
| Left click | Prop Mode, on empty (draw prop active) | Place new prop |
| Left drag | Prop Mode, on prop | Move prop |
| Left click | Area Mode, on area | Select area |
| Left click (no drag) | Area Mode, on area | Edit area label |
| Left drag | Area Mode, on area | Move area |
| Right drag | Tile Mode | Fill region with tiles |
| Right drag | Area Mode | Create new area |
| Middle drag | Any | Pan viewport |
| Scroll wheel | Any | Zoom in/out |

### Testable at this stage
- Create a new map → save → reload page → load → map restores correctly.
- Auto-save triggers after every edit.
- Export produces a JPEG image of the map.
- Crop resizes the map to fit tiles.
- Pack/Print lists show correct counts.
- Full keyboard and mouse interactions work across all modes.

---

## Event Callbacks (Editor → UI)

| Callback | Trigger | Purpose |
|---|---|---|
| `onUpdateSelectedTiles(tiles)` | Tile selection changes | Clears draw tile when empty |
| `onUpdateSelectedProps(props)` | Prop selection changes | Clears draw prop when empty |
| `onUpdateMapData(mapData)` | Any map data change | Refreshes usage counts |
| `onCreateMapFile()` | New map created | Refreshes file list |
| `onSave()` | Map saved | Updates "last saved" timestamp |

---

## Initialization Flow

1. Render the page layout: Three.js canvas + sidebar `<div>` placeholder.
2. Initialize the Three.js scene, camera, renderer, and grid.
3. Fetch tile and prop library data from `/:source/data`.
4. Pre-load all GLB models asynchronously.
5. Once loaded, render the sidebar UI (Preact `App` component) with library data.
6. Fetch campaign data for the file selector.
