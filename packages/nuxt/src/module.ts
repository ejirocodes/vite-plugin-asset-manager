import {
  defineNuxtModule,
  addDevServerHandler,
  createResolver,
  useLogger
} from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { Plugin as VitePlugin } from 'vite'
import {
  AssetManager,
  createAssetManagerMiddleware,
  broadcastSSE,
  resolveOptions,
  type AssetManagerOptions,
  type ResolvedOptions,
  type AssetManagerMiddleware
} from '@vite-asset-manager/core'
import { eventHandler, fromNodeMiddleware } from 'h3'

export type {
  AssetManagerOptions,
  Asset,
  AssetGroup,
  AssetType,
  AssetStats,
  ResolvedOptions,
  Importer,
  ImportType,
  EditorType
} from '@vite-asset-manager/core'

export interface NuxtAssetManagerOptions extends AssetManagerOptions {
  /**
   * Add Asset Manager tab to Nuxt DevTools
   * @default true
   */
  devtools?: boolean
}

export default defineNuxtModule<NuxtAssetManagerOptions>({
  meta: {
    name: '@vite-asset-manager/nuxt',
    configKey: 'assetManager',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  },

  defaults: {
    base: '/__asset_manager__',
    // include/aliases are set dynamically in resolveOptionsForNuxt based on Nuxt version
    exclude: ['node_modules', '.git', '.nuxt', '.output', 'dist', '.cache', 'coverage'],
    floatingIcon: true,
    watch: true,
    launchEditor: 'code',
    debug: false,
    devtools: true,
  },

  async setup(moduleOptions, nuxt) {
    const logger = useLogger('asset-manager')
    const resolver = createResolver(import.meta.url)

    // Only run in development
    if (!nuxt.options.dev) {
      return
    }

    // Resolve options with Nuxt-specific defaults
    const resolvedOptions = resolveOptionsForNuxt(moduleOptions, nuxt)

    // Use rootDir so path security checks allow files from both srcDir (app/)
    // and public/ directories. In Nuxt 4, srcDir is <project>/app/ but public
    // files live at <project>/public/, which would fail srcDir-based checks.
    const root = nuxt.options.rootDir

    // Shared state
    let assetManager: AssetManager | null = null
    let middleware: AssetManagerMiddleware | null = null
    let initialized = false

    // Initialize asset manager
    async function initializeAssetManager() {
      if (initialized || assetManager) return
      initialized = true

      try {
        assetManager = new AssetManager({
          root,
          options: resolvedOptions
        })

        await assetManager.init()

        if (resolvedOptions.watch) {
          assetManager.setupWatchers(broadcastSSE)
        }

        // Create middleware once after initialization
        middleware = createAssetManagerMiddleware({
          base: resolvedOptions.base,
          scanner: assetManager.scanner,
          importerScanner: assetManager.importerScanner,
          duplicateScanner: assetManager.duplicateScanner,
          thumbnailService: assetManager.thumbnailService,
          root,
          launchEditor: resolvedOptions.launchEditor
        })

        logger.success(`Asset Manager ready at ${resolvedOptions.base}`)
      } catch (error) {
        logger.error('Failed to initialize Asset Manager:', error)
      }
    }

    // Create h3 event handler that wraps our middleware
    const h3Handler = eventHandler(async (event) => {
      // Ensure asset manager is initialized
      if (!middleware) {
        await initializeAssetManager()
      }

      if (!middleware) {
        return { error: 'Asset Manager not initialized' }
      }

      const nodeReq = event.node.req
      const originalUrl = nodeReq.url || ''

      // Nitro/h3 may strip the route prefix when dispatching to devHandlers.
      // Our middleware expects the full URL with the base prefix.
      // Prepend it if it's been stripped, preserving query parameters.
      if (!originalUrl.startsWith(resolvedOptions.base)) {
        nodeReq.url = resolvedOptions.base + originalUrl
      }

      try {
        return await fromNodeMiddleware(middleware)(event)
      } finally {
        nodeReq.url = originalUrl
      }
    })

    // Register dev-only handler via @nuxt/kit (works for both Nuxt 3 and 4)
    addDevServerHandler({
      route: resolvedOptions.base,
      handler: h3Handler
    })

    // Also add middleware to Vite for direct access
    const assetManagerPlugin: VitePlugin = {
      name: 'nuxt-asset-manager',
      enforce: 'pre',
      configureServer(server) {
        // Install middleware immediately
        server.middlewares.use(async (req, res, next) => {
          const url = req.url || ''

          // Only handle requests to our base path
          if (url === resolvedOptions.base || url.startsWith(`${resolvedOptions.base}/`)) {
            if (!middleware) {
              await initializeAssetManager()
            }

            if (middleware) {
              return middleware(req, res, next)
            }
          }

          next()
        })
      }
    }

    // Add the plugin to Vite config
    nuxt.hook('vite:extendConfig', (config) => {
      ;(config.plugins as VitePlugin[]).push(assetManagerPlugin)
    })

    // Inject floating icon directly into HTML via a Nitro server plugin.
    // This bypasses the Nuxt client plugin system, making it more reliable
    // since it doesn't depend on Vue/Nuxt client runtime hydration.
    if (moduleOptions.floatingIcon !== false) {
      nuxt.options.runtimeConfig.public.assetManager = {
        base: resolvedOptions.base
      }
      // @ts-expect-error - nitro:config hook types may not be fully exported
      nuxt.hook('nitro:config', (nitroConfig: { plugins?: string[] }) => {
        nitroConfig.plugins = nitroConfig.plugins || []
        nitroConfig.plugins.push(resolver.resolve('./runtime/floating-icon.server'))
      })
    }

    // Add Nuxt DevTools integration
    if (moduleOptions.devtools !== false) {
      // @ts-expect-error - devtools:customTabs hook may not be typed
      nuxt.hook('devtools:customTabs', (tabs: Array<{ name: string; title: string; icon: string; view: { type: string; src: string } }>) => {
        tabs.push({
          name: 'asset-manager',
          title: 'Asset Manager',
          icon: 'carbon:media-library',
          view: {
            type: 'iframe',
            src: `${resolvedOptions.base}?embedded=true`
          }
        })
      })
    }

    // Cleanup on close
    nuxt.hook('close', () => {
      assetManager?.destroy()
    })
  }
})

/**
 * Resolves options with Nuxt-specific adjustments.
 * Handles Nuxt 3 vs 4 directory structure differences.
 */
function resolveOptionsForNuxt(
  moduleOptions: NuxtAssetManagerOptions,
  nuxt: Nuxt
): ResolvedOptions {
  const options = resolveOptions(moduleOptions)

  // Detect Nuxt 4 (app/ directory structure)
  const isNuxt4 =
    nuxt.options.future?.compatibilityVersion === 4 ||
    nuxt.options.srcDir?.endsWith('/app') ||
    nuxt.options.srcDir?.endsWith('\\app')

  // Paths are relative to rootDir (not srcDir) so path security checks
  // work for both app/ and public/ directories
  if (isNuxt4 && !moduleOptions.include) {
    // Nuxt 4: assets in app/assets/, public at root
    return {
      ...options,
      include: ['app/assets', 'public'],
      aliases: {
        '@/': 'app/assets/',
        '~/': 'app/',
        ...moduleOptions.aliases
      }
    }
  }

  // Nuxt 3: assets and public at root
  if (!moduleOptions.include) {
    return {
      ...options,
      include: ['assets', 'public'],
      aliases: {
        '@/': 'assets/',
        '~/': '',
        ...moduleOptions.aliases
      }
    }
  }

  return options
}

// Type declarations for module options
declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    assetManager?: {
      base: string
    }
  }

  interface NuxtConfig {
    assetManager?: NuxtAssetManagerOptions
  }

  interface NuxtOptions {
    assetManager?: NuxtAssetManagerOptions
  }
}
