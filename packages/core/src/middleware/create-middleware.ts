import type { IncomingMessage, ServerResponse } from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import sirv from 'sirv'
import { createApiRouter } from '../api/router.js'
import type { AssetScanner } from '../services/scanner.js'
import type { ImporterScanner } from '../services/importer-scanner.js'
import type { DuplicateScanner } from '../services/duplicate-scanner.js'
import type { ThumbnailService } from '../services/thumbnail.js'
import type { EditorType } from '../types/index.js'

export interface MiddlewareContext {
  base: string
  scanner: AssetScanner
  importerScanner: ImporterScanner
  duplicateScanner: DuplicateScanner
  thumbnailService: ThumbnailService
  root: string
  launchEditor: EditorType
}

export type NextFunction = () => void

export type AssetManagerMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction
) => void

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Find the client directory containing pre-built UI files.
 * Handles standalone installs (npm/tarball) and monorepo development.
 *
 * When bundled by tsup, __dirname = packages/core/dist/
 * When installed from npm, __dirname = node_modules/@vite-asset-manager/core/dist/
 */
function findClientDir(): string {
  return path.join(__dirname, 'client')
}

/**
 * Creates a framework-agnostic middleware for serving the Asset Manager.
 * This middleware handles:
 * - API requests at {base}/api/*
 * - Static UI files at {base}/*
 */
export function createAssetManagerMiddleware(
  context: MiddlewareContext
): AssetManagerMiddleware {
  const {
    base,
    scanner,
    importerScanner,
    duplicateScanner,
    thumbnailService,
    root,
    launchEditor
  } = context

  const apiRouter = createApiRouter(
    scanner,
    importerScanner,
    duplicateScanner,
    thumbnailService,
    root,
    base,
    launchEditor
  )

  const clientDir = findClientDir()
  const staticServe = sirv(clientDir, { single: true, dev: true })

  // Inject <base> tag into index.html so relative asset paths (./assets/...)
  // resolve correctly regardless of whether the document URL has a trailing
  // slash. Without this, /api/asset-manager (no slash) resolves ./assets/foo
  // to /api/assets/foo instead of /api/asset-manager/assets/foo.
  let indexHtml: string | null = null
  const htmlPath = path.join(clientDir, 'index.html')
  if (fs.existsSync(htmlPath)) {
    const raw = fs.readFileSync(htmlPath, 'utf-8')
    indexHtml = raw.replace('<head>', `<head>\n    <base href="${base}/">`)
  }

  return (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const url = req.url || ''
    // Strip query string for path matching (req.url includes ?query)
    const qIndex = url.indexOf('?')
    const pathname = qIndex >= 0 ? url.slice(0, qIndex) : url

    // Handle API requests
    if (pathname.startsWith(`${base}/api/`)) {
      return apiRouter(req, res, next)
    }

    // Handle static UI requests
    if (pathname === base || pathname.startsWith(`${base}/`)) {
      // Serve index.html with <base> tag for root requests
      const subPath = pathname.slice(base.length)
      if (indexHtml && (subPath === '' || subPath === '/')) {
        res.setHeader('Content-Type', 'text/html')
        res.end(indexHtml)
        return
      }

      // Rewrite URL for sirv to serve from root
      req.url = url.slice(base.length) || '/'
      return staticServe(req, res, () => {
        // Restore original URL and call next if sirv doesn't handle it
        req.url = url
        next()
      })
    }

    next()
  }
}
