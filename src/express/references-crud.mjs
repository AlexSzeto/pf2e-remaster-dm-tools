import { loadJSON } from './util.mjs'
import fsPromise from 'fs/promises'
import path from 'path'

const dataFileName = 'data.json'

const dataPathOf = (config, source) =>
  path.join(config.root, config[source].root, config[source].current, dataFileName)

export const addReference = async (config, source, type, entry) => {
  return new Promise((resolve, reject) => {
    const dataPath = dataPathOf(config, source)
    loadJSON(dataPath)
      .then((data) => {
        if (!data[type]) {
          data[type] = []
        }
        const references = data[type]
        const entryIndex = references.findIndex((e) => e.id === entry.id)
        if (entryIndex !== -1) {
          references[entryIndex] = entry
        } else {
          references.push(entry)
        }
        fsPromise
          .writeFile(dataPath, JSON.stringify(data, null, 2))
          .then(() => resolve())
          .catch((err) => reject(err))
      })
      .catch((err) => reject(err))
  })
}

export const deleteReference = async (config, source, type, id) => {
  return new Promise((resolve, reject) => {
    const dataPath = dataPathOf(config, source)
    loadJSON(dataPath)
      .then((data) => {
        if (!data[type]) {
          data[type] = []
        }
        const references = data[type]
        const entryIndex = references.findIndex((e) => e.id === id)
        if (entryIndex !== -1) {
          references.splice(entryIndex, 1)
        }
        fsPromise
          .writeFile(dataPath, JSON.stringify(data, null, 2))
          .then(() => resolve())
          .catch((err) => reject(err))
      })
      .catch((err) => reject(err))
  })
}

export const addReferenceEndpoints = (app, config) => {
  app.get('/:source/data', (req, res) => {
    const source = req.params.source
    const dataPath = dataPathOf(config, source)
    loadJSON(dataPath)
      .then((data) => {
        res.send(data)
      })
      .catch((err) => {
        res.status(500).send({ error: 'Failed to load data' })
      })
  })

  app.get('/:source/folders', (req, res) => {
    const source = req.params.source
    console.log('folder source:', source)
    const sourceRoot = path.join(config.root, config[source].root)
    fsPromise.readdir(sourceRoot, { withFileTypes: true })
      .then((entries) => {
        let loads = entries.filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        console.log('folders:', loads)
        loads = loads.map(folder => loadJSON(path.join(sourceRoot, folder, dataFileName)))
        return Promise.allSettled(loads)
      })
      .then(results => results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
      )
      .then(folders => folders.map(data => {
        const { id, name, description } = data
        console.log('folder:', id, name, description)
        return { id, name, description }
      }))
      .then(folders => {
        res.send({
          folders,
          current: config[source].current,
        })
      })

      .catch((err) => {
        res.status(500).send({ error: 'Failed to read directory' })
      })
  })

}