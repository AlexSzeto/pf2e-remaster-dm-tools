import express from 'express'
import fileUpload from 'express-fileupload'
import path from 'path'

import { fileURLToPath } from 'url'
import { loadJSON } from './src/express/util.mjs'
import { addMediaEndpoints } from './src/express/media-crud.mjs'

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

const dataFilePath = (source, path) => path.join(__root, path.root, path.current, `${source}.json`)

// Get the directory name of the current module
let config = { root: path.dirname(fileURLToPath(import.meta.url)) }

/*
// Serve the index.html file
app.get('/', (req, res) => {
  res.send('hello world')
  res.sendFile(path.join(__root, 'index.html'))
})

// Respond with 'hello world' on a specific route
app.get('/hello', (req, res) => {
  res.send('hello world')
})
*/


// Start the server
loadJSON(path.join(config.root, configPath))
  .then((data) => {
    config = 
    {
      ...config,
      ...data
    }

    console.log('settings loaded:', config)

    addMediaEndpoints(app, config)

    app.listen(port, () => {
      console.log(`server is running at http://localhost:${port}`)
    })            
  })
  .catch((error) => {
    console.error('settings load error:', error)
    process.exit(1)
  })