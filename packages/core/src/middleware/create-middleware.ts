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
  // Standalone install: client/ alongside index.js in dist/
  const colocated = path.join(__dirname, 'client')
  if (fs.existsSync(colocated)) return colocated

  // Monorepo development: root dist/client/ (from build:ui)
  const fromRoot = path.resolve(__dirname, '../../../../dist/client')
  if (fs.existsSync(fromRoot)) return fromRoot

  // Monorepo fallback
  const fromPackageRoot = path.resolve(__dirname, '../../../dist/client')
  if (fs.existsSync(fromPackageRoot)) return fromPackageRoot

  // Default fallback
  return colocated
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

  return (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const url = req.url || ''

    // Handle API requests
    if (url.startsWith(`${base}/api/`)) {
      return apiRouter(req, res, next)
    }

    // Handle static UI requests
    if (url === base || url.startsWith(`${base}/`)) {
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
