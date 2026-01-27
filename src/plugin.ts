import type { Plugin, ViteDevServer, ResolvedConfig } from 'vite'
import { setupMiddleware } from './server/index.js'
import { AssetScanner } from './server/scanner.js'
import { ThumbnailService } from './server/thumbnail.js'
import { resolveOptions, type AssetManagerOptions } from './shared/types.js'

export function createAssetManagerPlugin(options: AssetManagerOptions = {}): Plugin {
  let config: ResolvedConfig
  let scanner: AssetScanner
  let thumbnailService: ThumbnailService

  const resolvedOptions = resolveOptions(options)

  return {
    name: 'vite-plugin-asset-manager',
    apply: 'serve',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    configureServer(server: ViteDevServer) {
      scanner = new AssetScanner(config.root, resolvedOptions)
      thumbnailService = new ThumbnailService(resolvedOptions.thumbnailSize)

      setupMiddleware(server, {
        base: resolvedOptions.base,
        scanner,
        thumbnailService,
        root: config.root
      })

      scanner.init().then(() => {
        const assets = scanner.getAssets()
        server.config.logger.info(
          `\n  Asset Manager ready at ${resolvedOptions.base}`
        )
        server.config.logger.info(`  Found ${assets.length} assets\n`)
      })

      return () => {
        if (resolvedOptions.watch) {
          scanner.on('change', event => {
            server.ws.send('asset-manager:update', event)
          })
        }
      }
    },

    resolveId(id) {
      if (id === 'virtual:asset-manager-config') {
        return '\0virtual:asset-manager-config'
      }
    },

    load(id) {
      if (id === '\0virtual:asset-manager-config') {
        return `export default ${JSON.stringify({
          base: resolvedOptions.base,
          extensions: resolvedOptions.extensions
        })}`
      }
    },

    buildEnd() {
      scanner?.destroy()
    }
  }
}
