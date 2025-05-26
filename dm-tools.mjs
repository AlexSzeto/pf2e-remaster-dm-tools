import express from 'express'
import fileUpload from 'express-fileupload'
import path from 'path'

import { fileURLToPath } from 'url'
import { loadJSON, saveJSON, successResponse } from './src/express/util.mjs'
import { addMediaEndpoints } from './src/express/media-crud.mjs'
import { getHTML } from './src/express/html-template.mjs'
import { addReferenceEndpoints } from './src/express/references-crud.mjs'

/*
  Express setup
*/
const app = express()
app.use(fileUpload())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/*
  Settings
*/
const port = 5000
const configFilename = 'config.json'

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
  const filePath = path.join(config.root, 'src/static', req.params.path.join('/'))
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found')
    }
  })
})

// Load configs, insert endpoints, and start server
loadJSON(path.join(config.root, configFilename))
  .then((data) => {
    config = {
      ...config,
      ...data,
    }

    console.log('settings loaded:', config)

    addMediaEndpoints(app, config)
    addReferenceEndpoints(app, config)

    app.post('/:source/config', (req, res) => {
      const source = req.params.source
      const current = req.body.current
      if (!current) {
        return res.status(400).send({ error: 'No current folder specified' })
      }
      config[source].current = current
      saveJSON(path.join(config.root, configFilename), config)
        .then(() => {
          res.status(200).send(successResponse(`Set ${source} current folder`))
        })
        .catch((err) => {
          res.status(500).send({ error: 'Failed to set current folder' })
        })
    })    

    app.listen(port, () => {
      console.log(`server is running at http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('settings load error:', error)
    process.exit(1)
  })
