import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import type { AssetScanner } from '../services/scanner.js'
import type { ImporterScanner } from '../services/importer-scanner.js'
import type { DuplicateScanner } from '../services/duplicate-scanner.js'
import type { ThumbnailService } from '../services/thumbnail.js'
import type { EditorType } from '../types/index.js'
import { AssetManagerError } from '../errors.js'
import { handleGetAssets, handleGetGroupedAssets, handleSearch, handleGetStats, handleGetDuplicates } from './handlers/asset-handler.js'
import { handleThumbnail, handleServeFile } from './handlers/file-handler.js'
import { handleGetImporters, handleOpenInEditor, handleRevealInFinder } from './handlers/system-handler.js'
import { handleBulkDownload, handleBulkDelete } from './handlers/bulk-handler.js'
import { handleSSE } from './sse-manager.js'

export { broadcastSSE } from './sse-manager.js'

type NextFunction = () => void

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
          handleGetAssets(res, scanner, query)
          return
        case '/assets/grouped':
          handleGetGroupedAssets(res, scanner, query)
          return
        case '/search':
          handleSearch(res, scanner, query)
          return
        case '/thumbnail':
          await handleThumbnail(res, thumbnailService, root, query)
          return
        case '/file':
          await handleServeFile(res, root, query, req.headers.range)
          return
        case '/stats':
          handleGetStats(res, scanner, duplicateScanner)
          return
        case '/duplicates':
          handleGetDuplicates(res, scanner, duplicateScanner, query)
          return
        case '/importers':
          handleGetImporters(res, importerScanner, query)
          return
        case '/open-in-editor':
          await handleOpenInEditor(req, res, root, editor, query)
          return
        case '/reveal-in-finder':
          await handleRevealInFinder(req, res, root, query)
          return
        case '/bulk-download':
          await handleBulkDownload(req, res, root)
          return
        case '/bulk-delete':
          await handleBulkDelete(req, res, root)
          return
        case '/events':
          handleSSE(res)
          return
        default:
          next()
      }
    } catch (error) {
      if (error instanceof AssetManagerError) {
        res.statusCode = error.statusCode
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: error.message, code: error.code }))
      } else {
        console.error('[asset-manager] API error:', error)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    }
  }
}
