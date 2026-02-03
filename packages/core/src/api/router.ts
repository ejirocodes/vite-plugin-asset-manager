import type { IncomingMessage, ServerResponse } from 'http'
import type { ParsedUrlQuery } from 'querystring'
import { parse as parseUrl } from 'url'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import type { AssetScanner } from '../services/scanner.js'
import type { ImporterScanner } from '../services/importer-scanner.js'
import type { DuplicateScanner } from '../services/duplicate-scanner.js'
import type { ThumbnailService } from '../services/thumbnail.js'
import { launchEditor } from '../services/editor-launcher.js'
import { revealInFileExplorer } from '../services/file-revealer.js'
import type { AssetStats, AssetType, EditorType } from '../types/index.js'

type NextFunction = () => void
type QueryParams = ParsedUrlQuery

const sseClients = new Set<ServerResponse>()

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
  '.avi': 'video/x-msvideo',
  /**
   * Audio:
   */
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
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
  importerScanner: ImporterScanner,
  duplicateScanner: DuplicateScanner,
  thumbnailService: ThumbnailService,
  root: string,
  basePath: string,
  editor: EditorType
) {
  return async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const { pathname, query } = parseUrl(req.url || '', true)
    const apiPath = pathname?.replace(`${basePath}/api`, '') || ''

    try {
      switch (apiPath) {
        case '/assets':
          return handleGetAssets(res, scanner, query)
        case '/assets/grouped':
          return handleGetGroupedAssets(res, scanner, query)
        case '/search':
          return handleSearch(res, scanner, query)
        case '/thumbnail':
          return handleThumbnail(res, thumbnailService, root, query)
        case '/file':
          return handleServeFile(res, root, query, req.headers.range)
        case '/stats':
          return handleGetStats(res, scanner, duplicateScanner)
        case '/duplicates':
          return handleGetDuplicates(res, scanner, duplicateScanner, query)
        case '/importers':
          return handleGetImporters(res, importerScanner, query)
        case '/open-in-editor':
          return handleOpenInEditor(req, res, root, editor, query)
        case '/reveal-in-finder':
          return handleRevealInFinder(req, res, root, query)
        case '/bulk-download':
          return handleBulkDownload(req, res, root)
        case '/bulk-delete':
          return handleBulkDelete(req, res, root)
        case '/events':
          return handleSSE(res)
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

async function handleGetAssets(res: ServerResponse, scanner: AssetScanner, query: QueryParams) {
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

async function handleGetGroupedAssets(
  res: ServerResponse,
  scanner: AssetScanner,
  query: QueryParams
) {
  let groups = scanner.getGroupedAssets()

  const type = query.type as AssetType | undefined
  if (type) {
    groups = groups
      .map(group => ({
        ...group,
        assets: group.assets.filter(a => a.type === type),
        count: group.assets.filter(a => a.type === type).length
      }))
      .filter(group => group.count > 0)
  }

  const unused = query.unused === 'true'
  if (unused) {
    groups = groups
      .map(group => ({
        ...group,
        assets: group.assets.filter(a => a.importersCount === 0),
        count: group.assets.filter(a => a.importersCount === 0).length
      }))
      .filter(group => group.count > 0)
  }

  const duplicates = query.duplicates === 'true'
  if (duplicates) {
    groups = groups
      .map(group => ({
        ...group,
        assets: group.assets.filter(a => (a.duplicatesCount ?? 0) > 0),
        count: group.assets.filter(a => (a.duplicatesCount ?? 0) > 0).length
      }))
      .filter(group => group.count > 0)
  }

  const minSize = query.minSize ? parseInt(query.minSize as string, 10) : undefined
  const maxSize = query.maxSize ? parseInt(query.maxSize as string, 10) : undefined
  if (minSize !== undefined || maxSize !== undefined) {
    groups = groups
      .map(group => ({
        ...group,
        assets: group.assets.filter(a => {
          if (minSize !== undefined && a.size < minSize) return false
          if (maxSize !== undefined && a.size > maxSize) return false
          return true
        })
      }))
      .map(g => ({ ...g, count: g.assets.length }))
      .filter(g => g.count > 0)
  }

  const minDate = query.minDate ? parseInt(query.minDate as string, 10) : undefined
  const maxDate = query.maxDate ? parseInt(query.maxDate as string, 10) : undefined
  if (minDate !== undefined || maxDate !== undefined) {
    groups = groups
      .map(group => ({
        ...group,
        assets: group.assets.filter(a => {
          if (minDate !== undefined && a.mtime < minDate) return false
          if (maxDate !== undefined && a.mtime > maxDate) return false
          return true
        })
      }))
      .map(g => ({ ...g, count: g.assets.length }))
      .filter(g => g.count > 0)
  }

  const extensions = query.extensions as string | undefined
  if (extensions) {
    const extList = extensions.split(',').map(e => e.trim().toLowerCase())
    groups = groups
      .map(group => ({
        ...group,
        assets: group.assets.filter(a => extList.includes(a.extension.toLowerCase()))
      }))
      .map(g => ({ ...g, count: g.assets.length }))
      .filter(g => g.count > 0)
  }

  const total = groups.reduce((sum, g) => sum + g.count, 0)
  sendJson(res, { groups, total })
}

async function handleSearch(res: ServerResponse, scanner: AssetScanner, query: QueryParams) {
  const q = (query.q as string) || ''
  let results = scanner.search(q)

  const minSize = query.minSize ? parseInt(query.minSize as string, 10) : undefined
  const maxSize = query.maxSize ? parseInt(query.maxSize as string, 10) : undefined
  const minDate = query.minDate ? parseInt(query.minDate as string, 10) : undefined
  const maxDate = query.maxDate ? parseInt(query.maxDate as string, 10) : undefined
  const extensions = query.extensions as string | undefined

  if (minSize !== undefined) results = results.filter(a => a.size >= minSize)
  if (maxSize !== undefined) results = results.filter(a => a.size <= maxSize)
  if (minDate !== undefined) results = results.filter(a => a.mtime >= minDate)
  if (maxDate !== undefined) results = results.filter(a => a.mtime <= maxDate)
  if (extensions) {
    const extList = extensions.split(',').map(e => e.trim().toLowerCase())
    results = results.filter(a => extList.includes(a.extension.toLowerCase()))
  }

  sendJson(res, { assets: results, total: results.length, query: q })
}

async function handleThumbnail(
  res: ServerResponse,
  thumbnailService: ThumbnailService,
  root: string,
  query: QueryParams
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
  query: QueryParams,
  rangeHeader?: string
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

async function handleGetStats(
  res: ServerResponse,
  scanner: AssetScanner,
  duplicateScanner: DuplicateScanner
) {
  const assets = scanner.getAssets()
  const dupStats = duplicateScanner.getStats()

  const extensionCounts = new Map<string, number>()
  for (const asset of assets) {
    const ext = asset.extension.toLowerCase()
    extensionCounts.set(ext, (extensionCounts.get(ext) || 0) + 1)
  }

  const stats: AssetStats = {
    total: assets.length,
    byType: {
      image: assets.filter(a => a.type === 'image').length,
      video: assets.filter(a => a.type === 'video').length,
      audio: assets.filter(a => a.type === 'audio').length,
      document: assets.filter(a => a.type === 'document').length,
      font: assets.filter(a => a.type === 'font').length,
      data: assets.filter(a => a.type === 'data').length,
      text: assets.filter(a => a.type === 'text').length,
      other: assets.filter(a => a.type === 'other').length
    },
    totalSize: assets.reduce((sum, a) => sum + a.size, 0),
    directories: [...new Set(assets.map(a => a.directory))].length,
    unused: assets.filter(a => a.importersCount === 0).length,
    duplicateGroups: dupStats.duplicateGroups,
    duplicateFiles: dupStats.duplicateFiles,
    extensionBreakdown: Object.fromEntries(extensionCounts)
  }

  sendJson(res, stats)
}

async function handleGetDuplicates(
  res: ServerResponse,
  scanner: AssetScanner,
  duplicateScanner: DuplicateScanner,
  query: QueryParams
) {
  const hash = query.hash as string

  if (hash) {
    const paths = duplicateScanner.getDuplicatesByHash(hash)
    const assets = scanner.getAssets().filter(a => paths.includes(a.path))
    sendJson(res, { duplicates: assets, total: assets.length, hash })
  } else {
    const assets = scanner.getAssets().filter(a => (a.duplicatesCount ?? 0) > 0)
    sendJson(res, { duplicates: assets, total: assets.length })
  }
}

function sendJson(res: ServerResponse, data: unknown) {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function handleSSE(res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  sseClients.add(res)

  res.on('close', () => {
    sseClients.delete(res)
  })
}

export function broadcastSSE(event: string, data: unknown) {
  const message = JSON.stringify({ event, data })
  for (const client of sseClients) {
    client.write(`data: ${message}\n\n`)
  }
}

async function handleGetImporters(
  res: ServerResponse,
  importerScanner: ImporterScanner,
  query: QueryParams
) {
  const assetPath = query.path as string
  if (!assetPath) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing path parameter' })
    return
  }

  const importers = importerScanner.getImporters(assetPath)
  sendJson(res, { importers, total: importers.length })
}

async function handleOpenInEditor(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
  editor: EditorType,
  query: QueryParams
) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  const filePath = query.file as string
  const line = parseInt(query.line as string) || 1
  const column = parseInt(query.column as string) || 1

  if (!filePath) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing file parameter' })
    return
  }

  const absolutePath = path.resolve(root, filePath)

  if (!absolutePath.startsWith(root)) {
    res.statusCode = 403
    sendJson(res, { error: 'Forbidden' })
    return
  }

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK)
  } catch {
    res.statusCode = 404
    sendJson(res, { error: 'File not found' })
    return
  }

  try {
    await launchEditor(absolutePath, line, column, editor)
    sendJson(res, { success: true })
  } catch (error) {
    res.statusCode = 500
    sendJson(res, { error: error instanceof Error ? error.message : 'Failed to open editor' })
  }
}

async function handleRevealInFinder(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
  query: QueryParams
) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  const filePath = query.path as string

  if (!filePath) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing path parameter' })
    return
  }

  const absolutePath = path.resolve(root, filePath)

  if (!absolutePath.startsWith(root)) {
    res.statusCode = 403
    sendJson(res, { error: 'Invalid path' })
    return
  }

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK)
  } catch {
    res.statusCode = 404
    sendJson(res, { error: 'File not found' })
    return
  }

  try {
    await revealInFileExplorer(absolutePath)
    sendJson(res, { success: true })
  } catch (error) {
    res.statusCode = 500
    sendJson(res, {
      error: error instanceof Error ? error.message : 'Failed to reveal file'
    })
  }
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

async function handleBulkDownload(req: IncomingMessage, res: ServerResponse, root: string) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  let body: { paths?: string[] }
  try {
    body = (await parseJsonBody(req)) as { paths?: string[] }
  } catch {
    res.statusCode = 400
    sendJson(res, { error: 'Invalid JSON body' })
    return
  }

  const paths = body.paths
  if (!Array.isArray(paths) || paths.length === 0) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing or invalid paths array' })
    return
  }

  const validatedPaths: { relativePath: string; absolutePath: string }[] = []

  for (const relativePath of paths) {
    const absolutePath = path.resolve(root, relativePath)

    if (!absolutePath.startsWith(root)) {
      res.statusCode = 403
      sendJson(res, { error: `Forbidden path: ${relativePath}` })
      return
    }

    try {
      await fs.promises.access(absolutePath, fs.constants.R_OK)
      validatedPaths.push({ relativePath, absolutePath })
    } catch {
      console.warn(`[asset-manager] Bulk download skipping missing file: ${relativePath}`)
    }
  }

  if (validatedPaths.length === 0) {
    res.statusCode = 404
    sendJson(res, { error: 'No valid files found' })
    return
  }

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="assets-${Date.now()}.zip"`)

  const archive = archiver('zip', { zlib: { level: 6 } })

  archive.on('error', err => {
    console.error('[asset-manager] ZIP creation error:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('ZIP creation failed')
    }
  })

  archive.pipe(res)

  for (const { relativePath, absolutePath } of validatedPaths) {
    archive.file(absolutePath, { name: relativePath })
  }

  await archive.finalize()
}

async function handleBulkDelete(req: IncomingMessage, res: ServerResponse, root: string) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    sendJson(res, { error: 'Method not allowed' })
    return
  }

  let body: { paths?: string[] }
  try {
    body = (await parseJsonBody(req)) as { paths?: string[] }
  } catch {
    res.statusCode = 400
    sendJson(res, { error: 'Invalid JSON body' })
    return
  }

  const paths = body.paths
  if (!Array.isArray(paths) || paths.length === 0) {
    res.statusCode = 400
    sendJson(res, { error: 'Missing or invalid paths array' })
    return
  }

  const results = {
    deleted: 0,
    failed: [] as string[],
    errors: [] as string[]
  }

  for (const relativePath of paths) {
    const absolutePath = path.resolve(root, relativePath)

    if (!absolutePath.startsWith(root)) {
      results.failed.push(relativePath)
      results.errors.push(`Forbidden path: ${relativePath}`)
      continue
    }

    try {
      await fs.promises.unlink(absolutePath)
      results.deleted++
    } catch (error) {
      results.failed.push(relativePath)
      results.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  sendJson(res, {
    deleted: results.deleted,
    failed: results.failed.length,
    errors: results.errors
  })
}
