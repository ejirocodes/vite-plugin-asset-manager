import type { Plugin, ViteDevServer, ResolvedConfig, IndexHtmlTransformResult } from 'vite'
import colors from 'picocolors'
import {
  AssetManager,
  createAssetManagerMiddleware,
  broadcastSSE,
  resolveOptions,
  type AssetManagerOptions
} from '@vite-asset-manager/core'

export function createAssetManagerPlugin(options: AssetManagerOptions = {}): Plugin {
  let config: ResolvedConfig
  let assetManager: AssetManager

  const resolvedOptions = resolveOptions(options)

  return {
    name: 'vite-plugin-asset-manager',
    apply: 'serve',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    configureServer(server: ViteDevServer) {
      // Create asset manager instance using the core package
      assetManager = new AssetManager({
        root: config.root,
        options: resolvedOptions
      })

      // Initialize and setup watchers
      assetManager.init().then(() => {
        if (resolvedOptions.watch) {
          assetManager.setupWatchers(broadcastSSE)
        }
      })

      // Create middleware using the core package
      const middleware = createAssetManagerMiddleware({
        base: resolvedOptions.base,
        scanner: assetManager.scanner,
        importerScanner: assetManager.importerScanner,
        duplicateScanner: assetManager.duplicateScanner,
        thumbnailService: assetManager.thumbnailService,
        root: config.root,
        launchEditor: resolvedOptions.launchEditor
      })

      // Add middleware to Vite server
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        // Only handle requests to our base path
        if (url === resolvedOptions.base || url.startsWith(`${resolvedOptions.base}/`)) {
          return middleware(req, res, next)
        }

        next()
      })

      // Print URLs
      const _printUrls = server.printUrls
      server.printUrls = () => {
        _printUrls()

        const colorUrl = (url: string) =>
          colors.cyan(url.replace(/:(\d+)\//, (_, port) => `:${colors.bold(port)}/`))

        let host = `${server.config.server.https ? 'https' : 'http'}://localhost:${server.config.server.port || '80'}`
        const url = server.resolvedUrls?.local[0]
        if (url) {
          try {
            const u = new URL(url)
            host = `${u.protocol}//${u.host}`
          } catch {}
        }

        const base = server.config.base || '/'
        const fullUrl = `${host}${base}${resolvedOptions.base.replace(/^\//, '')}/`

        server.config.logger.info(
          `  ${colors.magenta('➜')}  ${colors.bold('Asset Manager')}: Open ${colorUrl(fullUrl)} as a separate window`
        )
        server.config.logger.info(
          `  ${colors.magenta('➜')}  ${colors.bold('Asset Manager')}: Press ${colors.yellow('Option(⌥)+Shift(⇧)+A')} in App to toggle the Asset Manager`
        )
      }
    },

    transformIndexHtml(): IndexHtmlTransformResult {
      if (!resolvedOptions.floatingIcon) {
        return []
      }

      const base = resolvedOptions.base
      const baseWithSlash = base.endsWith('/') ? base : base + '/'

      return [
        {
          tag: 'script',
          children: `window.__VAM_BASE_URL__ = "${base}";`,
          injectTo: 'body'
        },
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: `${baseWithSlash}floating-icon.js`
          },
          injectTo: 'body'
        }
      ]
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
      assetManager?.destroy()
    }
  }
}
