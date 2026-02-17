import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import type { AssetScanner } from '../services/scanner.js'
import type { ImporterScanner } from '../services/importer-scanner.js'
import type { DuplicateScanner } from '../services/duplicate-scanner.js'
import type { ThumbnailService } from '../services/thumbnail.js'
import type { EditorType } from '../types/index.js'
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
