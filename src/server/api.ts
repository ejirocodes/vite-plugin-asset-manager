import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import path from 'path'
import fs from 'fs'
import type { AssetScanner } from './scanner.js'
import type { ThumbnailService } from './thumbnail.js'
import type { AssetStats, AssetType } from '../shared/types.js'

type NextFunction = () => void

const MIME_TYPES: Record<string, string> = {
  /**
   * Images:
   */ 
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  /**
   * Videos:
   */ 
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  /**
   * Audio:
   */ 
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  /**
   * Documents:
   */ 
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  /**
   * Config files:
   */ 
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.toml': 'application/toml',
  '.xml': 'application/xml',
  /**
   * Fonts:
   */ 
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
}

export function createApiRouter(
  scanner: AssetScanner,
  thumbnailService: ThumbnailService,
  root: string,
  basePath: string
) {
  return async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const { pathname, query } = parseUrl(req.url || '', true)
    const apiPath = pathname?.replace(`${basePath}/api`, '') || ''

    try {
      switch (apiPath) {
        case '/assets':
          return handleGetAssets(res, scanner, query)
        case '/assets/grouped':
          return handleGetGroupedAssets(res, scanner)
        case '/search':
          return handleSearch(res, scanner, query)
        case '/thumbnail':
          return handleThumbnail(res, thumbnailService, root, query)
        case '/file':
          return handleServeFile(res, root, query)
        case '/stats':
          return handleGetStats(res, scanner)
        default:
          next()
      }
    } catch (error) {
      console.error('[asset-manager] API error:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
  }
}

async function handleGetAssets(
  res: ServerResponse,
  scanner: AssetScanner,
  query: Record<string, any>
) {
  const assets = scanner.getAssets()

  let filtered = assets

  const directory = query.directory as string | undefined
  if (directory) {
    filtered = filtered.filter(
      a => a.directory === directory || a.directory.startsWith(directory + '/')
    )
  }

  const type = query.type as AssetType | undefined
  if (type) {
    filtered = filtered.filter(a => a.type === type)
  }

  sendJson(res, { assets: filtered, total: filtered.length })
}

async function handleGetGroupedAssets(res: ServerResponse, scanner: AssetScanner) {
  const groups = scanner.getGroupedAssets()
  const total = groups.reduce((sum, g) => sum + g.count, 0)
  sendJson(res, { groups, total })
}

async function handleSearch(
  res: ServerResponse,
  scanner: AssetScanner,
  query: Record<string, any>
) {
  const q = (query.q as string) || ''
  const results = scanner.search(q)
  sendJson(res, { assets: results, total: results.length, query: q })
}

async function handleThumbnail(
  res: ServerResponse,
  thumbnailService: ThumbnailService,
  root: string,
  query: Record<string, any>
) {
  const relativePath = query.path as string
  if (!relativePath) {
    res.statusCode = 400
    res.end('Missing path parameter')
    return
  }

  const absolutePath = path.resolve(root, relativePath)

  if (!absolutePath.startsWith(root)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

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

async function handleServeFile(
  res: ServerResponse,
  root: string,
  query: Record<string, any>
) {
  const relativePath = query.path as string
  if (!relativePath) {
    res.statusCode = 400
    res.end('Missing path parameter')
    return
  }

  const absolutePath = path.resolve(root, relativePath)

  if (!absolutePath.startsWith(root)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK)
  } catch {
    res.statusCode = 404
    res.end('File not found')
    return
  }

  const ext = path.extname(relativePath).toLowerCase()
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  fs.createReadStream(absolutePath).pipe(res)
}

async function handleGetStats(res: ServerResponse, scanner: AssetScanner) {
  const assets = scanner.getAssets()

  const stats: AssetStats = {
    total: assets.length,
    byType: {
      image: assets.filter(a => a.type === 'image').length,
      video: assets.filter(a => a.type === 'video').length,
      audio: assets.filter(a => a.type === 'audio').length,
      document: assets.filter(a => a.type === 'document').length,
      other: assets.filter(a => a.type === 'other').length
    },
    totalSize: assets.reduce((sum, a) => sum + a.size, 0),
    directories: [...new Set(assets.map(a => a.directory))].length
  }

  sendJson(res, stats)
}

function sendJson(res: ServerResponse, data: unknown) {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}
