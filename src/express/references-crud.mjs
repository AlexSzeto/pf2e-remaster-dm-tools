import { loadJSON } from './util.mjs'
import fsPromise from 'fs/promises'

const dataPathOf = (config, source) =>
  path.join(
    config.root,
    config[source].root,
    config[source].current,
    'data.json'
  )

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
