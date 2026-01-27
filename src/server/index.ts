import type { ViteDevServer } from 'vite'
import sirv from 'sirv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createApiRouter } from './api.js'
import type { AssetScanner } from './scanner.js'
import type { ThumbnailService } from './thumbnail.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function findClientDir(): string {
  // When running from built dist: __dirname is dist/server, client is at dist/client
  const fromDist = path.join(__dirname, '../client')
  if (fs.existsSync(fromDist)) {
    return fromDist
  }

  // When running from source (e.g., playground): __dirname is src/server, client is at dist/client
  const fromSource = path.resolve(__dirname, '../../dist/client')
  if (fs.existsSync(fromSource)) {
    return fromSource
  }

  // Fallback - will show error if client not built
  return fromDist
}

export interface MiddlewareContext {
  base: string
  scanner: AssetScanner
  thumbnailService: ThumbnailService
  root: string
}

export function setupMiddleware(server: ViteDevServer, context: MiddlewareContext): void {
  const { base, scanner, thumbnailService, root } = context

  const apiRouter = createApiRouter(scanner, thumbnailService, root, base)

  const clientDir = findClientDir()

  server.middlewares.use((req, res, next) => {
    const url = req.url || ''

    if (url.startsWith(`${base}/api/`)) {
      return apiRouter(req, res, next)
    }

    if (url === base || url.startsWith(`${base}/`)) {
      const serve = sirv(clientDir, {
        single: true,
        dev: true
      })

      req.url = url.slice(base.length) || '/'
      return serve(req, res, next)
    }

    next()
  })
}
