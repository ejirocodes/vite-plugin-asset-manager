import type { Plugin, ViteDevServer, ResolvedConfig, IndexHtmlTransformResult } from 'vite'
import colors from 'picocolors'
import { setupMiddleware } from './server/index.js'
import { AssetScanner } from './server/scanner.js'
import { ImporterScanner } from './server/importer-scanner.js'
import { DuplicateScanner } from './server/duplicate-scanner.js'
import { ThumbnailService } from './server/thumbnail.js'
import { broadcastSSE } from './server/api.js'
import { resolveOptions, type AssetManagerOptions } from './shared/types.js'

export function createAssetManagerPlugin(options: AssetManagerOptions = {}): Plugin {
  let config: ResolvedConfig
  let scanner: AssetScanner
  let importerScanner: ImporterScanner
  let duplicateScanner: DuplicateScanner
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
      importerScanner = new ImporterScanner(config.root, resolvedOptions)
      duplicateScanner = new DuplicateScanner(config.root, resolvedOptions)
      thumbnailService = new ThumbnailService(resolvedOptions.thumbnailSize)

      setupMiddleware(server, {
        base: resolvedOptions.base,
        scanner,
        importerScanner,
        duplicateScanner,
        thumbnailService,
        root: config.root,
        launchEditor: resolvedOptions.launchEditor
      })

      scanner.init().then(async () => {
        await importerScanner.init()
        scanner.enrichWithImporterCounts(importerScanner)

        await duplicateScanner.init()
        await duplicateScanner.scanAssets(scanner.getAssets())
        scanner.enrichWithDuplicateInfo(duplicateScanner)

        if (resolvedOptions.watch) {
          duplicateScanner.initWatcher()
        }
      })

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

      if (resolvedOptions.watch) {
        scanner.on('change', async event => {
          await duplicateScanner.scanAssets(scanner.getAssets())
          scanner.enrichWithDuplicateInfo(duplicateScanner)
          broadcastSSE('asset-manager:update', event)
        })
        importerScanner.on('change', event => {
          scanner.enrichWithImporterCounts(importerScanner)
          broadcastSSE('asset-manager:importers-update', event)
        })
        duplicateScanner.on('change', event => {
          scanner.enrichWithDuplicateInfo(duplicateScanner)
          broadcastSSE('asset-manager:duplicates-update', event)
        })
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
      scanner?.destroy()
      importerScanner?.destroy()
      duplicateScanner?.destroy()
    }
  }
}
