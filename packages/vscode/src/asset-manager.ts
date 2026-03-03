import * as vscode from 'vscode'
import { AssetScanner } from './services/scanner.js'
import { ImporterScanner } from './services/importer-scanner.js'
import { DuplicateScanner } from './services/duplicate-scanner.js'
import { ThumbnailService } from './services/thumbnail.js'
import type { ExtensionSettings } from './types.js'

type ChangeCallback = (event: string, data: unknown) => void

export class AssetManager {
  readonly scanner: AssetScanner
  readonly importerScanner: ImporterScanner
  readonly duplicateScanner: DuplicateScanner
  readonly thumbnails: ThumbnailService
  private initPromise: Promise<void> | null = null
  private changeCallback?: ChangeCallback

  constructor(
    private readonly root: string,
    settings: ExtensionSettings,
    globalStorageUri: vscode.Uri
  ) {
    this.scanner = new AssetScanner(root, settings)
    this.importerScanner = new ImporterScanner(root, settings)
    this.duplicateScanner = new DuplicateScanner(root, settings)
    this.thumbnails = new ThumbnailService(globalStorageUri, settings.thumbnailSize)
  }

  initIfNeeded(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.init()
    }
    return this.initPromise
  }

  private async init(): Promise<void> {
    await this.thumbnails.init()
    await Promise.all([
      this.scanner.init(),
      this.importerScanner.init()
    ])
    await this.duplicateScanner.init(this.scanner.getAssets())
    this.scanner.enrichWithImporterCounts(p => this.importerScanner.getImporters(p))
    this.scanner.enrichWithDuplicateInfo(p => this.duplicateScanner.getDuplicateInfo(p))
    this.setupWatchers()
  }

  onChange(cb: ChangeCallback): void {
    this.changeCallback = cb
  }

  private setupWatchers(): void {
    this.scanner.on('change', () => {
      this.scanner.enrichWithImporterCounts(p => this.importerScanner.getImporters(p))
      this.changeCallback?.('asset-manager:update', {})
    })

    this.importerScanner.on('change', (data: { affectedAssets: string[] }) => {
      this.scanner.enrichWithImporterCounts(p => this.importerScanner.getImporters(p))
      this.changeCallback?.('asset-manager:importers-update', data)
    })

    this.duplicateScanner.on('change', (data: { affectedHashes: string[] }) => {
      this.scanner.enrichWithDuplicateInfo(p => this.duplicateScanner.getDuplicateInfo(p))
      this.changeCallback?.('asset-manager:duplicates-update', data)
    })
  }

  destroy(): void {
    this.scanner.destroy()
    this.importerScanner.destroy()
    this.duplicateScanner.destroy()
  }
}
