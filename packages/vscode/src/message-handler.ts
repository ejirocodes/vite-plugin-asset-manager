import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs/promises'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import * as os from 'os'
import type { AssetManager } from './asset-manager.js'
import type { AssetGroup, AssetStats, AssetType } from './types.js'

type Params = Record<string, string>

interface RequestMsg {
  id: string
  type: 'request'
  method: string
  params: Params
}

interface ResponseMsg {
  id: string
  type: 'response'
  data: unknown
  thumbnailUriMap?: Record<string, string>
}

interface ErrorMsg {
  id: string
  type: 'error'
  message: string
}

export class MessageHandler {
  constructor(
    private readonly manager: AssetManager,
    private readonly webview: vscode.Webview,
    private readonly root: string
  ) {}

  async handle(req: RequestMsg): Promise<ResponseMsg | ErrorMsg> {
    try {
      const result = await this.dispatch(req.method, req.params)
      return { id: req.id, type: 'response', ...result }
    } catch (err) {
      return { id: req.id, type: 'error', message: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  private async dispatch(method: string, params: Params): Promise<{ data: unknown; thumbnailUriMap?: Record<string, string> }> {
    switch (method) {
      case 'getGroupedAssets': {
        const groups = this.applyGroupFilters(this.manager.scanner.getGroupedAssets(), params)
        const total = groups.reduce((n, g) => n + g.count, 0)
        const thumbnailUriMap = await this.buildThumbnailUriMap(groups)
        return { data: { groups, total }, thumbnailUriMap }
      }

      case 'searchAssets': {
        const q = params.q ?? ''
        const results = this.applyAssetFilters(this.manager.scanner.search(q), params)
        const thumbnailUriMap = await this.buildThumbnailUriMapFlat(results)
        return { data: { assets: results, total: results.length, query: q }, thumbnailUriMap }
      }

      case 'getStats': {
        const assets = this.manager.scanner.getAssets()
        const dupStats = this.manager.duplicateScanner.getStats()
        const byType = {} as Record<AssetType, number>
        const extBreakdown: Record<string, number> = {}
        let totalSize = 0
        let unused = 0
        const dirs = new Set<string>()

        for (const a of assets) {
          byType[a.type] = (byType[a.type] ?? 0) + 1
          extBreakdown[a.extension] = (extBreakdown[a.extension] ?? 0) + 1
          totalSize += a.size
          if (a.importersCount === 0) unused++
          dirs.add(a.directory)
        }

        const stats: AssetStats = {
          total: assets.length,
          byType,
          totalSize,
          directories: dirs.size,
          unused,
          duplicateGroups: dupStats.duplicateGroups,
          duplicateFiles: dupStats.duplicateFiles,
          extensionBreakdown: extBreakdown
        }
        return { data: stats }
      }

      case 'getImporters': {
        const importers = this.manager.importerScanner.getImporters(params.path ?? '')
        return { data: { importers, total: importers.length } }
      }

      case 'getDuplicates': {
        const assets = this.manager.scanner.getAssets().filter(a => a.duplicatesCount > 0)
        return { data: { duplicates: assets, total: assets.length } }
      }

      case 'openInEditor': {
        const filePath = params.file ?? ''
        this.validatePath(filePath)
        const uri = vscode.Uri.file(path.join(this.root, filePath))
        const doc = await vscode.workspace.openTextDocument(uri)
        const editor = await vscode.window.showTextDocument(doc)
        const line = Math.max(0, parseInt(params.line ?? '1') - 1)
        const col = Math.max(0, parseInt(params.column ?? '1') - 1)
        const pos = new vscode.Position(line, col)
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter)
        editor.selection = new vscode.Selection(pos, pos)
        return { data: { success: true } }
      }

      case 'revealInFinder': {
        this.validatePath(params.path ?? '')
        const uri = vscode.Uri.file(path.join(this.root, params.path ?? ''))
        await vscode.commands.executeCommand('revealFileInOS', uri)
        return { data: { success: true } }
      }

      case 'bulkDelete': {
        const paths: string[] = JSON.parse(params.paths ?? '[]')
        let deleted = 0
        let failed = 0
        const errors: string[] = []
        for (const p of paths) {
          try {
            const abs = path.join(this.root, p)
            if (!abs.startsWith(this.root)) throw new Error('Path traversal rejected')
            await fs.unlink(abs)
            deleted++
          } catch (e) {
            failed++
            errors.push(e instanceof Error ? e.message : String(e))
          }
        }
        return { data: { deleted, failed, errors } }
      }

      case 'bulkDownload': {
        const paths: string[] = JSON.parse(params.paths ?? '[]')
        const tmpFile = path.join(os.tmpdir(), `asset-lens-${Date.now()}.zip`)

        await new Promise<void>((resolve, reject) => {
          const output = createWriteStream(tmpFile)
          const archive = archiver('zip', { zlib: { level: 6 } })
          output.on('close', resolve)
          archive.on('error', reject)
          archive.pipe(output)
          for (const p of paths) {
            const abs = path.join(this.root, p)
            if (abs.startsWith(this.root)) archive.file(abs, { name: p })
          }
          archive.finalize()
        })

        const defaultUri = vscode.Uri.file(path.join(this.root, 'assets.zip'))
        const saveUri = await vscode.window.showSaveDialog({
          defaultUri,
          filters: { 'ZIP Archive': ['zip'] }
        })

        if (saveUri) {
          await fs.copyFile(tmpFile, saveUri.fsPath)
        }
        await fs.unlink(tmpFile).catch(() => {})
        return { data: { success: true } }
      }

      default:
        throw new Error(`Unknown method: ${method}`)
    }
  }

  private validatePath(relativePath: string): void {
    if (!relativePath) throw new Error('Missing path parameter')
    const abs = path.join(this.root, relativePath)
    if (!abs.startsWith(this.root)) throw new Error('Forbidden')
  }

  private async buildThumbnailUriMap(groups: AssetGroup[]): Promise<Record<string, string>> {
    const map: Record<string, string> = {}
    for (const group of groups) {
      for (const asset of group.assets) {
        const thumbPath = await this.manager.thumbnails.getThumbnailPath(
          asset.absolutePath, asset.mtime, asset.size
        )
        if (thumbPath) {
          map[asset.path] = this.webview.asWebviewUri(vscode.Uri.file(thumbPath)).toString()
        }
      }
    }
    return map
  }

  private async buildThumbnailUriMapFlat(assets: ReturnType<AssetManager['scanner']['getAssets']>): Promise<Record<string, string>> {
    const map: Record<string, string> = {}
    for (const asset of assets) {
      const thumbPath = await this.manager.thumbnails.getThumbnailPath(
        asset.absolutePath, asset.mtime, asset.size
      )
      if (thumbPath) {
        map[asset.path] = this.webview.asWebviewUri(vscode.Uri.file(thumbPath)).toString()
      }
    }
    return map
  }

  private applyGroupFilters(groups: AssetGroup[], params: Params): AssetGroup[] {
    return groups
      .map(g => ({ ...g, assets: this.applyAssetFilters(g.assets, params) }))
      .filter(g => g.assets.length > 0)
      .map(g => ({ ...g, count: g.assets.length }))
  }

  private applyAssetFilters(assets: AssetGroup['assets'], params: Params): AssetGroup['assets'] {
    let result = assets
    if (params.type) result = result.filter(a => a.type === params.type)
    if (params.unused === 'true') result = result.filter(a => a.importersCount === 0)
    if (params.duplicates === 'true') result = result.filter(a => a.duplicatesCount > 0)
    if (params.minSize) result = result.filter(a => a.size >= parseInt(params.minSize))
    if (params.maxSize) result = result.filter(a => a.size <= parseInt(params.maxSize))
    if (params.minDate) result = result.filter(a => a.mtime >= parseInt(params.minDate))
    if (params.maxDate) result = result.filter(a => a.mtime <= parseInt(params.maxDate))
    if (params.extensions) {
      const exts = params.extensions.split(',')
      result = result.filter(a => exts.includes(a.extension.toLowerCase()))
    }
    return result
  }
}
