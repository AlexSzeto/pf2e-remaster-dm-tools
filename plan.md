# Refactoring Plan for dm-screen.js

This document outlines the plan to refactor the `dm-screen.js` file into smaller, more manageable modules.

## 1. Create new directory `src/static/js/dm-modules`

A new directory will be created to house the new modules.

## 2. Create new modules

For each submodule, a new file will be created in the `src/static/js/dm-modules` directory. Each module will export a component that can be used in the main `dm-screen.js` file.

### 2.1. Image Module (`src/static/js/dm-modules/images.js`)

- **Responsibilities:** Manage the state and rendering of the images in the exploration tab.
- **State to move:** `screen.images`
- **Functions to move:** `showImage`, `toggleBackgroundCover`
- **Component:** `Images`
- **Props:** `images`, `onShowImage`, `onToggleBackgroundCover`, `onShowModal`, `onShowImageViewer`
- **Rendering:** The content of the `explorationImage` template literal will be moved into this component.

### 2.2. Audio Module (`src/static/js/dm-modules/audio.js`)

- **Responsibilities:** Manage the state and rendering of the audio controls.
- **State to move:** `screen.bgm`, `screen.ambience`, `screen.duckAudio`
- **Functions to move:** `globalVolume`, `startAudioLoop`, `stopAllAudio`, `stopAudio`, `toggleAudioDuck`
- **Component:** `Audio`
- **Props:** `bgm`, `ambience`, `duckAudio`, `onStartAudioLoop`, `onStopAllAudio`, `onStopAudio`, `onToggleAudioDuck`, `onShowModal`
- **Rendering:** The content of the `explorationAudio` template literal will be moved into this component.

### 2.3. Documents Module (`src/static/js/dm-modules/documents.js`)

- **Responsibilities:** Manage the state and rendering of the markdown documents.
- **State to move:** `notes.docs`
- **Functions to move:** `loadDocument`, `saveDocument`, `closeDocument`, `closeAllDocuments`
- **Component:** `Documents`
- **Props:** `docs`, `pinnedDocs`, `onLoadDocument`, `onSaveDocument`, `onCloseDocument`, `onCloseAllDocuments`, `onUnpin`, `onShowModal`, `onShowImageViewer`
- **Rendering:** The `ContentSection` for "Documents" from the `notesTab` will be moved into this component.

### 2.4. Cards Module (`src/static/js/dm-modules/cards.js`)

- **Responsibilities:** Manage the state and rendering of the reference cards.
- **State to move:** `notes.cards`
- **Functions to move:** `addCard`, `addRule`, `updateCards`, `removeNotesCard`, `togglePin` (for cards and rules), `addCharacterToInitiative`
- **Component:** `Cards`
- **Props:** `cards`, `pinnedCards`, `pinnedRules`, `onAddCard`, `onAddRule`, `onUpdateCards`, `onRemoveCard`, `onTogglePin`, `onShowModal`, `onAddCharacterToInitiative`
- **Rendering:** The `ContentSection` for "Reference Cards" from the `combatTab` will be moved into this component.

### 2.5. Initiative Tracker Module (`src/static/js/dm-modules/initiative-tracker.js`)

- **Responsibilities:** Manage the state and rendering of the initiative tracker.
- **State to move:** `combat`
- **Functions to move:** `addPlayersToInitiativeList`, `updateInitiateTracker`
- **Component:** `Initiative`
- **Props:** `combat`, `players`, `onUpdateInitiativeTracker`, `onShowModal`
- **Rendering:** The `ContentSection` for "Initiative Tracker" from the `combatTab` will be moved into this component.

### 2.6. Treasure Module (`src/static/js/dm-modules/treasure.js`)

- **Responsibilities:** Manage the state and rendering of the party treasure and campaign treasure.
- **State to move:** `players.ledger`, `campaign.treasures`, `players.partyLevel`
- **Functions to move:** `updatePlayersLevel`, `savePlayersData`, `saveCampaignData` and the `on...` handlers for the `BudgetTracker` components.
- **Component:** `Treasure`
- **Props:** `players`, `campaign`, `onUpdatePlayersLevel`, `onUpdateLedger`, `onUpdateTreasures`
- **Rendering:** The content of the `upkeepTab` will be moved into this component.

## 3. Refactor `dm-screen.js`

The main `dm-screen.js` file will be refactored to:
- Import the new modules.
- Manage the top-level state for `campaign`, `players`, `screen`, `notes`, `combat`, `modals`, `dm`.
- Pass down the relevant state and callbacks to the new components as props.
- The main `render` function will still contain the tab structure (`explorationTab`, `notesTab`, etc.). The new components will be rendered within their respective tabs.
- The `App` component will still be responsible for fetching the initial data and managing modals.
