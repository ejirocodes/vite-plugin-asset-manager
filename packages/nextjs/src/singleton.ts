/**
 * Singleton management for AssetManager instance.
 *
 * Uses globalThis to survive Next.js HMR module re-evaluation during development.
 * This is the standard pattern (used by Prisma, databases, etc.) to prevent
 * creating duplicate instances when Next.js hot-reloads API route modules.
 */
import {
  AssetManager,
  createAssetManagerMiddleware,
  broadcastSSE,
  type ResolvedOptions,
  type AssetManagerMiddleware,
} from '@vite-asset-manager/core'

const MANAGER_KEY = Symbol.for('__vam_asset_manager__')
const MIDDLEWARE_KEY = Symbol.for('__vam_middleware__')
const INIT_PROMISE_KEY = Symbol.for('__vam_init_promise__')

interface GlobalStore {
  [MANAGER_KEY]?: AssetManager
  [MIDDLEWARE_KEY]?: AssetManagerMiddleware
  [INIT_PROMISE_KEY]?: Promise<void>
}

const store = globalThis as unknown as GlobalStore

export function getOrCreateMiddleware(
  root: string,
  options: ResolvedOptions
): { middleware: () => Promise<AssetManagerMiddleware> } {
  return {
    middleware: async () => {
      if (store[MIDDLEWARE_KEY]) {
        return store[MIDDLEWARE_KEY]
      }

      if (!store[INIT_PROMISE_KEY]) {
        store[INIT_PROMISE_KEY] = (async () => {
          let manager = store[MANAGER_KEY]

          if (!manager) {
            manager = new AssetManager({ root, options })
            store[MANAGER_KEY] = manager
            await manager.init()

            if (options.watch) {
              manager.setupWatchers(broadcastSSE)
            }
          }

          store[MIDDLEWARE_KEY] = createAssetManagerMiddleware({
            base: options.base,
            scanner: manager.scanner,
            importerScanner: manager.importerScanner,
            duplicateScanner: manager.duplicateScanner,
            thumbnailService: manager.thumbnailService,
            root,
            launchEditor: options.launchEditor,
          })
        })()
      }

      await store[INIT_PROMISE_KEY]
      return store[MIDDLEWARE_KEY]!
    },
  }
}

export function destroyInstance(): void {
  store[MANAGER_KEY]?.destroy()
  store[MANAGER_KEY] = undefined
  store[MIDDLEWARE_KEY] = undefined
  store[INIT_PROMISE_KEY] = undefined
}
