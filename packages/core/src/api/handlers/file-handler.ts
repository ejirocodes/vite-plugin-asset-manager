import type { ServerResponse } from 'http'
import type { ParsedUrlQuery } from 'querystring'
import path from 'path'
import fs from 'fs'
import type { ThumbnailService } from '../../services/thumbnail.js'
import { MIME_TYPES, validateFilePath } from '../utils.js'

export async function handleThumbnail(
  res: ServerResponse,
  thumbnailService: ThumbnailService,
  root: string,
  query: ParsedUrlQuery
): Promise<void> {
  const validated = validateFilePath(root, query.path as string)
  if ('error' in validated) {
    res.statusCode = validated.status
    res.end(validated.error)
    return
  }

  const { absolutePath, relativePath } = validated

  if (relativePath.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    fs.createReadStream(absolutePath).pipe(res)
    return
  }

  const thumbnail = await thumbnailService.getThumbnail(absolutePath)

  if (thumbnail) {
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.end(thumbnail)
  } else {
    const ext = path.extname(relativePath).toLowerCase()
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
    fs.createReadStream(absolutePath).pipe(res)
  }
}

export async function handleServeFile(
  res: ServerResponse,
  root: string,
  query: ParsedUrlQuery,
  rangeHeader?: string
): Promise<void> {
  const validated = validateFilePath(root, query.path as string)
  if ('error' in validated) {
    res.statusCode = validated.status
    res.end(validated.error)
    return
  }

  const { absolutePath, relativePath } = validated

  let stats: fs.Stats
  try {
    stats = await fs.promises.stat(absolutePath)
    await fs.promises.access(absolutePath, fs.constants.R_OK)
  } catch {
    res.statusCode = 404
    res.end('File not found')
    return
  }

  const ext = path.extname(relativePath).toLowerCase()
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
  const fileSize = stats.size

  res.setHeader('Content-Type', mimeType)
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'public, max-age=3600')

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    if (start >= fileSize || end >= fileSize) {
      res.statusCode = 416
      res.setHeader('Content-Range', `bytes */${fileSize}`)
      res.end()
      return
    }

    res.statusCode = 206
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
    res.setHeader('Content-Length', chunkSize.toString())

    const stream = fs.createReadStream(absolutePath, { start, end })
    stream.pipe(res)
  } else {
    res.setHeader('Content-Length', fileSize.toString())
    fs.createReadStream(absolutePath).pipe(res)
  }
}
