import { AssetScanner } from './services/scanner.js'
import { ImporterScanner } from './services/importer-scanner.js'
import { DuplicateScanner } from './services/duplicate-scanner.js'
import { ThumbnailService } from './services/thumbnail.js'
import type { ResolvedOptions } from './types/index.js'

export interface AssetManagerConfig {
  root: string
  options: ResolvedOptions
}

export type AssetManagerEventHandler = (event: string, data: unknown) => void

/**
 * AssetManager orchestrates all core services for asset management.
 * It provides a single entry point for framework adapters to use.
 */
export class AssetManager {
  public readonly scanner: AssetScanner
  public readonly importerScanner: ImporterScanner
  public readonly duplicateScanner: DuplicateScanner
  public readonly thumbnailService: ThumbnailService
  public readonly root: string
  public readonly options: ResolvedOptions

  private initialized = false

  constructor(config: AssetManagerConfig) {
    const { root, options } = config
    this.root = root
    this.options = options

    this.scanner = new AssetScanner(root, options)
    this.importerScanner = new ImporterScanner(root, options)
    this.duplicateScanner = new DuplicateScanner(root, options)
    this.thumbnailService = new ThumbnailService(options.thumbnailSize)
  }

  /**
   * Initialize all services and perform initial scan.
   * This must be called before using other methods.
   */
  async init(): Promise<void> {
    if (this.initialized) return

    // Initialize scanners
    await this.scanner.init()
    await this.importerScanner.init()
    await this.duplicateScanner.init()

    // Enrich assets with importer counts
    this.scanner.enrichWithImporterCounts(this.importerScanner)

    // Scan for duplicates
    await this.duplicateScanner.scanAssets(this.scanner.getAssets())
    this.scanner.enrichWithDuplicateInfo(this.duplicateScanner)

    this.initialized = true
  }

  /**
   * Setup file watchers and connect event handlers.
   * @param onEvent - Callback function to receive events (for SSE broadcasting)
   */
  setupWatchers(onEvent: AssetManagerEventHandler): void {
    // Asset scanner change events
    this.scanner.on('change', async (event) => {
      // Re-scan duplicates when assets change
      await this.duplicateScanner.scanAssets(this.scanner.getAssets())
      this.scanner.enrichWithDuplicateInfo(this.duplicateScanner)
      onEvent('asset-manager:update', event)
    })

    // Importer scanner change events
    this.importerScanner.on('change', (event) => {
      this.scanner.enrichWithImporterCounts(this.importerScanner)
      onEvent('asset-manager:importers-update', event)
    })

    // Duplicate scanner change events
    this.duplicateScanner.on('change', (event) => {
      this.scanner.enrichWithDuplicateInfo(this.duplicateScanner)
      onEvent('asset-manager:duplicates-update', event)
    })
  }

  /**
   * Destroy all services and cleanup resources.
   */
  destroy(): void {
    this.scanner.destroy()
    this.importerScanner.destroy()
    this.duplicateScanner.destroy()
  }
}
