import { loadJSON, saveJSON, successResponse } from './util.mjs'
import { promises as fs } from 'fs'
import path from 'path'

const dataFilename = 'data.json'
const jsonTemplatesPath = 'src/express/templates/json'

const subtypeSingularToPlural = {
  image: 'images',
  bgm: 'bgms',
  ambience: 'ambiences',
  card: 'cards',
  map: 'maps',
}

const dataPathOf = (config, source) =>
  path.join(
    config.root,
    config[source].root,
    config[source].current,
    dataFilename
  )

export const matchReference = id => (entry) => {
  return (entry.name && entry.name === id) || (entry.path && entry.path === id)
}

export const addReference = async (config, source, subtype, entry) => {
  return new Promise((resolve, reject) => {
    const dataPath = dataPathOf(config, source)
    loadJSON(dataPath)
      .then((data) => {
        if (!data[subtype]) {
          data[subtype] = []
        }
        const references = data[subtype]
        const entryIndex = references.findIndex(entry.path ? matchReference(entry.path) : matchReference(entry.name))
        if (entryIndex !== -1) {
          references[entryIndex] = entry
        } else {
          references.push(entry)
        }
        saveJSON(dataPath, data)
          .then(() => resolve())
          .catch((err) => reject(err))
      })
      .catch((err) => reject(err))
  })
}

export const deleteReference = async (config, source, subtype, id) => {
  return new Promise((resolve, reject) => {
    const dataPath = dataPathOf(config, source)
    loadJSON(dataPath)
      .then((data) => {
        if (!data[subtype]) {
          data[subtype] = []
        }
        const references = data[subtype]
        const entryIndex = references.findIndex(matchReference(id))
        if (entryIndex !== -1) {
          references.splice(entryIndex, 1)
        }
        saveJSON(dataPath, data)
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

  app.post('/:source/data', (req, res) => {
    const source = req.params.source
    const data = req.body
    saveJSON(dataPathOf(config, source), data)
      .then(() => {
        res.status(200).send(successResponse(`Saved ${source} data`))
      })
      .catch((err) => {
        res.status(500).send({ error: 'Failed to save data' })
      })
  })

  app.get('/:source/folders', (req, res) => {
    const source = req.params.source
    const sourceRoot = path.join(config.root, config[source].root)
    fs.readdir(sourceRoot, { withFileTypes: true })
      .then((entries) => {
        let loads = entries
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
        loads = loads.map((folder) =>
          loadJSON(path.join(sourceRoot, folder, dataFilename))
        )
        return Promise.allSettled(loads)
      })
      .then((results) =>
        results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)
      )
      .then((folders) =>
        folders.map((data) => {
          const { id, name, description } = data
          return { id, name, description }
        })
      )
      .then((folders) => {
        res.send({
          folders,
          current: config[source].current,
        })
      })
      .catch((err) => {
        res.status(500).send({ error: 'Failed to read directory' })
      })
  })

  app.post('/:source/folders', (req, res) => {
    const source = req.params.source
    const name = req.body.name
    const description = req.body.description ?? ''
    const id = req.body.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const templatePath = path.join(
      config.root,
      jsonTemplatesPath,
      `${source}.json`
    )
    const folderPath = path.join(config.root, config[source].root, id)

    fs.mkdir(folderPath, { recursive: true })
      .then(() => loadJSON(templatePath))
      .then((data) => ({
        ...data,
        id,
        name,
        description,
      }))
      .then((data) => saveJSON(path.join(folderPath, dataFilename), data))
      .then(() => {
        res
          .status(200)
          .send(successResponse(`Created ${source} folder ${name}`))
      })
      .catch((err) => {
        res.status(500).send({ error: 'Failed to create folder' })
      })
  })

  app.post('/:source/data/:subtype', (req, res) => {
    const source = req.params.source
    const subtype = req.params.subtype
    const entry = req.body

    if (!entry.name && !entry.path) {
      return res.status(400).send({ error: 'Entry must have a name or path' })
    }

    if (!subtypeSingularToPlural[subtype]) {
      return res.status(400).send({ error: `Unknown subtype ${subtype}` })
    }

    addReference(config, source, subtypeSingularToPlural[subtype], entry)
      .then(() => {
        res.status(200).send(successResponse(`Added ${subtype} entry`))
      })
      .catch((err) => {
        res.status(500).send({ error: 'Failed to add entry' })
      })
  })
}
