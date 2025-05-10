import express from 'express'
import path from 'path'
import fs from 'fs'

import { fileURLToPath } from 'url'
import { loadJSON } from './core/util.mjs'

const app = express()
const fileUpload = require('express-fileupload')
app.use(fileUpload())

const port = 5000

/*
  Settings
*/
const settingsPath = 'settings.json'
const dataFilePath = data => path.join(__root, data.root, data.current, 'data.json')

/*
  Media file extensions
  Used to filter media files in the campaign folder
*/
const mediaExtensions = {
  images: ['jpg', 'jpeg', 'png', 'gif'],
  videos: ['mp4', 'avi'],
  audio: ['mp3', 'wav'],
  docs: ['md', 'txt'],
  maps: ['json'],
}
const mediaTypeOf = filename => {
  const extension = path.extname(filename).slice(1).toLowerCase()
  return Object.keys(mediaExtensions).find((type) => {
    return mediaExtensions[type].includes(extension)
  })
}

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __root = path.dirname(__filename)

const cache = {
  settings: {},
  campaign: {},
  dm: {},
  pcs: {},
}
const mediaFolderOf = (source, filename) => {
  const type = mediaTypeOf(filename)
  if (!type) {
    return null
  }
  return path.join(
    __root,
    cache.settings[source].root,
    cache.settings[source].current,
    type
  )
}

// Serve the index.html file
app.get('/', (req, res) => {
  res.send('hello world')
  res.sendFile(path.join(__root, 'index.html'))
})

// Respond with 'hello world' on a specific route
app.get('/hello', (req, res) => {
  res.send('hello world')
})

// CRUD for media files
app.get('/:source/media/:file', (req, res) => {
  const filePath = mediaFolderOf(req.params.source, req.params.file)
  res.sendFile(path.join(filePath, req.params.file), (err) => {
    if (err) {
      console.error('Error sending file:', err)
      res.status(err.status).end()
    } else {
      console.log('Sent:', filePath)
    }
  })
})

app.post('/:source/media', (req, res) => {
  const file = req.files.file
  if (!file) {
    return res.status(400).send('No file uploaded')
  }
  const type = mediaTypeOf(file.name)
  if (!type) {
    return res.status(400).send('Unsupported media type')
  }

  const folderPath = mediaFolderOf(req.params.source, file.name)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }

  const filePath = path.join(folderPath, file.name)
  fs.writeFile(filePath, file.data, (err) => {
    if (err) {
      console.error('Error writing file:', err)
      return res.status(500).send('Error uploading file')
    }
    console.log('Uploaded:', filePath)
    res.status(201).send('File uploaded successfully')
  })
})

app.delete('/:source/media/:file', (req, res) => {
  const folderPath = mediaFolderOf(req.params.source, req.params.file)
  if (!folderPath) {
    return res.status(404).send('File not found')
  }
  fs.unlink(path.join(folderPath, req.params.file), (err) => {
    if (err) {
      console.error('Error deleting file:', err)
      return res.status(500).send('Error deleting file')
    }
    console.log('Deleted:', folderPath)
    res.status(200).send('File deleted successfully')
  })
})

// Start the server
loadJSON(path.join(__root, settingsPath))
  .then((settings) => {
    cache.settings = settings
    Promise.allSettled(
      Object.keys(settings)
      .map(
        (key) => loadJSON(dataFilePath(settings[key]))
          .then((data) => {
            cache[key] = data
          })
          .catch((error) => {
            console.error(`Error loading ${key}:`, error)
            cache[key] = {}
          })
      )
    ).then(() => {
      console.log('All settings loaded successfully.')

      app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`)
      })            
    })
  })
  .catch((error) => {
    console.error('Error loading settings:', error)
  })