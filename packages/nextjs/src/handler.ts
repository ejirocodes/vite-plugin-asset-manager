/**
 * Next.js App Router handler factory.
 *
 * Returns { GET, POST } route handlers that bridge Web API requests
 * to the core middleware via the adapter.
 */
import {
  resolveOptions,
  type AssetManagerOptions,
} from '@vite-asset-manager/core'
import { callMiddleware } from './adapter.js'
import { getOrCreateMiddleware } from './singleton.js'

export interface NextAssetManagerOptions extends AssetManagerOptions {}

export function createHandler(userOptions: NextAssetManagerOptions = {}) {
  const resolvedOptions = resolveOptions({
    base: '/api/asset-manager',
    include: ['app', 'public', 'src'],
    aliases: { '@/': 'src/' },
    ...userOptions,
  })

  const root = process.cwd()
  const { middleware: getMiddleware } = getOrCreateMiddleware(
    root,
    resolvedOptions
  )

  async function handler(request: Request): Promise<Response> {
    // Dev-only guard
    if (process.env.NODE_ENV === 'production') {
      return new Response('Not Found', { status: 404 })
    }

    const mw = await getMiddleware()
    return callMiddleware(request, mw)
  }

  return {
    GET: handler,
    POST: handler,
  }
}
