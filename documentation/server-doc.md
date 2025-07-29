"""# Express Server API Documentation

This document outlines the available API endpoints for the Express server, and tracks the porting of features from the old Python server.

## Ported Features

These are features that have been successfully ported from the Python server to the Node.js Express server.

### HTML Page Rendering

*   **Endpoint:** `/`
*   **Method:** `GET`
*   **Description:** Renders the main index page.

*   **Endpoint:** `/:page`
*   **Method:** `GET`
*   **Description:** Renders a specific HTML page based on the `page` parameter.

### Static File Serving

*   **Endpoint:** `/src/*path`
*   **Method:** `GET`
*   **Description:** Serves static files (CSS, JS, images, fonts) from the `src/static` directory.

### Configuration Management

*   **Endpoint:** `/:source/config`
*   **Method:** `POST`
*   **Description:** Sets the `current` folder for a given `source` in the `config.json` file.
*   **Request Body:** `{ "current": "folder-name" }`

### Folder Management

*   **Endpoint:** `/:source/folders`
*   **Methods:** `GET`, `POST`
*   **Description:** 
    *   `GET`: Lists existing folders for a given `source`.
    *   `POST`: Creates a new folder for a given `source`.
*   **`source` parameter:** `campaign`, `players`, `dm`

### Media and Data CRUD Operations

The server uses modularized CRUD handlers for media and reference data.

*   **Media Endpoints (`/:source/media`):** Handled by `addMediaEndpoints`. These endpoints are responsible for creating, reading, updating, and deleting media files and their associated metadata.
    *   **`source` parameter:** `campaign`, `players`, `dm`
    *   **Media Types:** `images`, `videos`, `audio`, `docs`, `maps`
    *   **Media Subtypes:** 
        *   `images`: `location`, `character`, `item`, `map`
        *   `videos`: `event`
        *   `audio`: `music`, `ambience`, `event`
        *   `docs`: `campaign`, `note`
        *   `maps`: `grid`

*   **Reference Data Endpoints (`/:source/data`):** Handled by `addReferenceEndpoints`. These endpoints are responsible for CRUD operations on JSON data files.
    *   **`source` parameter:** `campaign`, `players`, `dm`
    *   **Reference Types:** `image`, `bgm`, `ambience`, `card`, `map`

## Features to be Ported

These are features from the old Python server that still need to be implemented in the Node.js Express server.

### Rule/Reference Data Lookup

*   **Missing Endpoints:**
    *   `/rule/search/:query` (GET): To search for rules in external data packs.
    *   `/rule/:folder/:query` (GET): To retrieve a specific rule from a data pack.
*   **Notes:** This feature is for looking up rules from the Pathfinder 2e system reference database.
""
