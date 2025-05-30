import path from 'path'
import fs from 'fs'
import fsPromise from 'fs/promises'

import { errorResponse, successResponse } from './util.mjs'
import { addReference, deleteReference } from './references-crud.mjs'

const mediaExtensions = {
  images: ['jpg', 'jpeg', 'png', 'gif'],
  videos: ['mp4', 'avi'],
  audio: ['mp3', 'wav'],
  docs: ['md', 'txt'],
  maps: ['json'],
}

const mediaSubtypes = {
  images: ['location', 'character', 'item', 'map'],
  videos: ['event'],
  audio: ['music', 'ambience', 'event'],
  docs: ['campaign', 'note'],
  maps: ['grid'],
}

/**
 *
 * @param {string} filename filename of a media file, with extension
 * @returns {string} subfolder name of the media file
 */
const mediaTypeOf = (filename) => {
  const extension = path.extname(filename).slice(1).toLowerCase()
  return Object.keys(mediaExtensions).find((type) => {
    return mediaExtensions[type].includes(extension)
  })
}

/**
 *
 * @param {object} settings settings object containing the media source data
 * @param {string} source one of the media sources: dm, pcs, campaign
 * @param {string} filename filename of a media file, with extension
 * @returns {string} path to the media folder of the file
 */
const mediaFolderOf = (settings, source, filename) => {
  const type = mediaTypeOf(filename)
  if (!type) {
    console.error(`unknown media type for file ${filename}`)
    return null
  }
  if (!settings[source]) {
    console.error(`unknown media source ${source}`)
    return null
  }
  return path.join(
    settings.root,
    settings[source].root,
    settings[source].current,
    type
  )
}

/**
 *
 * @param {express} app express app instance
 * @param {object} config object containing the media source data
 */
export const addMediaEndpoints = (app, config) => {
  app.get('/:source/media/:file', (req, res) => {
    const filename = req.params.file
    const source = req.params.source
    const folder = mediaFolderOf(config, source, filename)
    if (!folder) {
      return res
        .status(400)
        .send(errorResponse(`unknown media type ${filename}`))
    }
    res.sendFile(path.join(folder, filename), (err) => {
      if (err) {
        res.status(err.status).send(errorResponse(`error sending ${filename}`))
      } else {
        console.log('get:', filename)
      }
    })
  })

  app.post('/:source/media', (req, res) => {
    const file = req.files.file
    const filename = file.name
    const source = req.params.source    
    const type = mediaTypeOf(filename)
    let body
    try {
      body = JSON.parse(JSON.stringify(req.body))
    } catch (err) {
      body = {}
    }

    const id = path.basename(filename)
    const name =
      body.name ??
      id
        .split('-')
        .map((word) => word.toUpperCase())
        .join(' ')
    const subtype = body.subtype ?? id.split('-')[0]
    const tags = body.tags?.split(',') ?? []

    if (!file) {
      return res.status(400).send(errorResponse('no file uploaded'))
    }
    const folder = mediaFolderOf(config, source, filename)
    if (!folder) {
      return res
        .status(400)
        .send(errorResponse(`unknown media type ${filename}`))
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }

    const writePath = path.join(folder, filename)
    fsPromise
      .writeFile(writePath, file.data)
      .then(() =>
        addReference(config, source, type, {
          path: id,
          label: name,
          tags,
        })
      )
      .then(() => {
        res.status(201).send(successResponse(`uploaded ${filename}`))
      })
      .catch((err) => {
        res.status(500).send(errorResponse(`error writing ${filename}`))
      })
  })

  app.delete('/:source/media/:file', (req, res) => {
    const filename = req.params.file
    const source = req.params.source
    const type = mediaTypeOf(filename)

    const id = req.body.id ?? path.basename(filename)

    const folder = mediaFolderOf(config, source, filename)
    if (!folder) {
      return res
        .status(400)
        .send(errorResponse(`unknown media type ${filename}`))
    }
    fsPromise
      .unlink(path.join(folder, filename))
      .then(() =>
        deleteReference(config, source, type, id)
      )
      .then(() => {
        res.status(200).send(successResponse(`deleted ${filename}`))
      })
      .catch((err) => {
        res.status(500).send(errorResponse(`error deleting ${filename}`))
      })
  })
}
