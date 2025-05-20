import express from 'express'
import fileUpload from 'express-fileupload'
import path from 'path'

import { fileURLToPath } from 'url'
import { loadJSON } from './src/express/util.mjs'
import { addMediaEndpoints } from './src/express/media-crud.mjs'
import { getHTML } from './src/express/html-template.mjs'
import { addReferenceEndpoints } from './src/express/references-crud.mjs'

/*
  Express setup
*/
const app = express()
app.use(fileUpload())

/*
  Settings
*/
const port = 5000
const configPath = 'config.json'

const dataFilePath = (source, path) =>
  path.join(__root, path.root, path.current, `${source}.json`)

// Get the directory name of the current module
let config = { root: path.dirname(fileURLToPath(import.meta.url)) }

// HTML page endpoints
app.get('/', (req, res) => {
  res.send(getHTML('index'))
})

app.get('/:page', (req, res) => {
  const content = getHTML(req.params.page)
  if (!content) {
    return res.status(404).send('Page not found')
  }
  res.send(content)
})

// Static file serving
app.get('/src/*path', (req, res) => {
  // console.log('get:', req.params.path)
  // Prevent directory traversal attacks
  const filePath = path.join(config.root, 'src/preact', req.params.path.join('/'))
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found')
    }
  })
})

// Load configs, insert endpoints, and start server
loadJSON(path.join(config.root, configPath))
  .then((data) => {
    config = {
      ...config,
      ...data,
    }

    console.log('settings loaded:', config)

    addMediaEndpoints(app, config)
    addReferenceEndpoints(app, config)

    app.listen(port, () => {
      console.log(`server is running at http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('settings load error:', error)
    process.exit(1)
  })
