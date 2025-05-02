import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadJSON } from './core/util.mjs'

const app = express()
const port = 5000

const settingsPath = 'settings.json'
const dataFilePath = data => path.join(__root, data.root, data.current, 'data.json')

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __root = path.dirname(__filename)

const cache = {
  settings: {},
  campaign: {},
  dm: {},
  pcs: {},
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

// Serve pages
app.get('/:path', (req, res) => {
  res.send(`${req.params.path} good bay`)
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