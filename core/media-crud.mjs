import path from 'path'
import fs from 'fs'

import { errorResponse, loadJSON, successResponse } from './util.mjs'

const mediaExtensions = {
  images: ['jpg', 'jpeg', 'png', 'gif'],
  videos: ['mp4', 'avi'],
  audio: ['mp3', 'wav'],
  docs: ['md', 'txt'],
  maps: ['json'],
}

/**
 * 
 * @param {string} filename filename of a media file, with extension
 * @returns {string} subfolder name of the media file
 */
const mediaTypeOf = filename => {
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
 * @param {object} settings object containing the media source data
 */
export const addMediaEndpoints = (app, settings) => {
  app.get('/:source/media/:file', (req, res) => {
    const filename = req.params.file
    const source = req.params.source
    const folder = mediaFolderOf(settings, source, filename)
    if (!folder) {
      return res.status(400).send(errorResponse(`unknown media type ${filename}`))
    }
    res.sendFile(path.join(folder, filename), (err) => {
      if (err) {
        res.status(err.status).send(errorResponse(`error sending file ${filename}`))
      } else {
        console.log('get:', filename)
      }
    })
  })
  
  app.post('/:source/media', (req, res) => {
    const file = req.files.file
    const filename = file.name
    const source = req.params.source  

    if (!file) {
      return res.status(400).send(errorResponse('no file uploaded'))
    }
    const folder = mediaFolderOf(settings, source, filename)
    if(!folder) {
      return res.status(400).send(errorResponse(`unknown media type ${filename}`))
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }
  
    const writePath = path.join(folder, filename)
    fs.writeFile(writePath, file.data, (err) => {
      if (err) {
        return res.status(err.status).send(errorResponse(`error writing file ${filename}`))
      }
      console.log('post:', filename)
      res.status(201).send(successResponse(`file ${filename} uploaded`))
    })
  })
  
  app.delete('/:source/media/:file', (req, res) => {
    const filename = req.params.file
    const source = req.params.source

    const folder = mediaFolderOf(settings, source, filename)
    if (!folder) {
      return res.status(400).send(errorResponse(`unknown media type ${filename}`))
    }
    fs.unlink(path.join(folder, filename), (err) => {
      if (err) {
        return res.status(500).send(errorResponse(`error deleting file ${filename}`))
      }
      console.log('deleted:', filename)
      res.status(200).send(successResponse(`file ${filename} deleted`))
    })
  })
}