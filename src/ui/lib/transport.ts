import type { Asset, AssetGroup, AssetStats, Importer } from '../types'
import { getApiBase } from './api-base'
import * as sseSingleton from './sse-singleton'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface AssetManagerTransport {
  getGroupedAssets(params: URLSearchParams): Promise<{ groups: AssetGroup[]; total: number }>
  searchAssets(params: URLSearchParams): Promise<{ assets: Asset[]; total: number; query: string }>
  getStats(): Promise<AssetStats>
  getImporters(assetPath: string): Promise<{ importers: Importer[]; total: number }>
  getDuplicates(hash?: string): Promise<{ duplicates: Asset[]; total: number; hash?: string }>
  getThumbnailUrl(assetPath: string): string
  getFileUrl(assetPath: string): string
  openInEditor(file: string, line: number, column: number): Promise<void>
  revealInFinder(assetPath: string): Promise<void>
  bulkDelete(paths: string[]): Promise<{ deleted: number; failed: number; errors: string[] }>
  bulkDownload(paths: string[]): Promise<void>
  subscribe(event: string, handler: (data: unknown) => void): () => void
  getStatus(): ConnectionStatus
  onStatusChange(listener: () => void): () => void
  connect(): void
  disconnect(): void
}

// ── HTTP Transport (Vite / Next.js context) ───────────────────────────────────

class HttpTransport implements AssetManagerTransport {
  private base: string

  constructor(base: string) {
    this.base = base
  }

  async getGroupedAssets(params: URLSearchParams) {
    const qs = params.toString()
    const url = qs ? `${this.base}/api/assets/grouped?${qs}` : `${this.base}/api/assets/grouped`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch assets')
    return res.json() as Promise<{ groups: AssetGroup[]; total: number }>
  }

  async searchAssets(params: URLSearchParams) {
    const res = await fetch(`${this.base}/api/search?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to search assets')
    return res.json() as Promise<{ assets: Asset[]; total: number; query: string }>
  }

  async getStats() {
    const res = await fetch(`${this.base}/api/stats`)
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json() as Promise<AssetStats>
  }

  async getImporters(assetPath: string) {
    const res = await fetch(`${this.base}/api/importers?path=${encodeURIComponent(assetPath)}`)
    if (!res.ok) throw new Error('Failed to fetch importers')
    return res.json() as Promise<{ importers: Importer[]; total: number }>
  }

  async getDuplicates(hash?: string) {
    const url = hash
      ? `${this.base}/api/duplicates?hash=${encodeURIComponent(hash)}`
      : `${this.base}/api/duplicates`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch duplicates')
    return res.json() as Promise<{ duplicates: Asset[]; total: number; hash?: string }>
  }

  getThumbnailUrl(assetPath: string): string {
    return `${this.base}/api/thumbnail?path=${encodeURIComponent(assetPath)}`
  }

  getFileUrl(assetPath: string): string {
    return `${this.base}/api/file?path=${encodeURIComponent(assetPath)}`
  }

  async openInEditor(file: string, line: number, column: number) {
    await fetch(
      `${this.base}/api/open-in-editor?file=${encodeURIComponent(file)}&line=${line}&column=${column}`,
      { method: 'POST' }
    )
  }

  async revealInFinder(assetPath: string) {
    await fetch(
      `${this.base}/api/reveal-in-finder?path=${encodeURIComponent(assetPath)}`,
      { method: 'POST' }
    )
  }

  async bulkDelete(paths: string[]) {
    const res = await fetch(`${this.base}/api/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths })
    })
    return res.json() as Promise<{ deleted: number; failed: number; errors: string[] }>
  }

  async bulkDownload(paths: string[]) {
    const res = await fetch(`${this.base}/api/bulk-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths })
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assets.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  subscribe(event: string, handler: (data: unknown) => void) {
    return sseSingleton.subscribe(event, handler)
  }

  getStatus(): ConnectionStatus {
    return sseSingleton.getConnectionStatus()
  }

  onStatusChange(listener: () => void): () => void {
    return sseSingleton.subscribeToStatus(listener)
  }

  connect(): void {
    sseSingleton.incrementConnectionCount()
    sseSingleton.connect()
  }

  disconnect(): void {
    sseSingleton.decrementConnectionCount()
    if (sseSingleton.getConnectionCount() === 0) {
      sseSingleton.disconnect()
    }
  }
}

// ── VSCode Transport (WebView context) ────────────────────────────────────────

type VscodeApi = { postMessage: (msg: unknown) => void }

let _vscodeApi: VscodeApi | null = null

function getVscodeApi(): VscodeApi {
  if (!_vscodeApi) {
    _vscodeApi = (window as unknown as { acquireVsCodeApi: () => VscodeApi }).acquireVsCodeApi()
  }
  return _vscodeApi
}

class VscodeTransport implements AssetManagerTransport {
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private eventHandlers = new Map<string, Set<(data: unknown) => void>>()
  private statusListeners = new Set<() => void>()
  private thumbnailUriCache = new Map<string, string>()

  constructor() {
    window.addEventListener('message', (e: MessageEvent) => {
      const msg = e.data as Record<string, unknown>
      if (msg.type === 'response' || msg.type === 'error') {
        const id = msg.id as string
        const pending = this.pending.get(id)
        if (!pending) return
        this.pending.delete(id)

        if (msg.type === 'error') {
          pending.reject(new Error(msg.message as string))
        } else {
          // Cache thumbnail URI map if present
          const uriMap = msg.thumbnailUriMap as Record<string, string> | undefined
          if (uriMap) {
            for (const [k, v] of Object.entries(uriMap)) {
              this.thumbnailUriCache.set(k, v)
            }
          }
          pending.resolve(msg.data)
        }
      } else if (msg.type === 'event') {
        const event = msg.event as string
        this.eventHandlers.get(event)?.forEach(h => h(msg.data))
      }
    })
  }

  private request(method: string, params: Record<string, string> = {}): Promise<unknown> {
    const id = crypto.randomUUID()
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      getVscodeApi().postMessage({ id, type: 'request', method, params })
    })
  }

  async getGroupedAssets(params: URLSearchParams) {
    return this.request('getGroupedAssets', Object.fromEntries(params)) as Promise<{ groups: AssetGroup[]; total: number }>
  }

  async searchAssets(params: URLSearchParams) {
    return this.request('searchAssets', Object.fromEntries(params)) as Promise<{ assets: Asset[]; total: number; query: string }>
  }

  async getStats() {
    return this.request('getStats') as Promise<AssetStats>
  }

  async getImporters(assetPath: string) {
    return this.request('getImporters', { path: assetPath }) as Promise<{ importers: Importer[]; total: number }>
  }

  async getDuplicates(hash?: string) {
    return this.request('getDuplicates', hash ? { hash } : {}) as Promise<{ duplicates: Asset[]; total: number; hash?: string }>
  }

  getThumbnailUrl(assetPath: string): string {
    return this.thumbnailUriCache.get(assetPath) ?? ''
  }

  getFileUrl(assetPath: string): string {
    return this.thumbnailUriCache.get(assetPath) ?? ''
  }

  async openInEditor(file: string, line: number, column: number) {
    await this.request('openInEditor', { file, line: String(line), column: String(column) })
  }

  async revealInFinder(assetPath: string) {
    await this.request('revealInFinder', { path: assetPath })
  }

  async bulkDelete(paths: string[]) {
    return this.request('bulkDelete', { paths: JSON.stringify(paths) }) as Promise<{ deleted: number; failed: number; errors: string[] }>
  }

  async bulkDownload(paths: string[]) {
    await this.request('bulkDownload', { paths: JSON.stringify(paths) })
  }

  subscribe(event: string, handler: (data: unknown) => void): () => void {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, new Set())
    this.eventHandlers.get(event)!.add(handler)
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  getStatus(): ConnectionStatus {
    return 'connected'
  }

  onStatusChange(listener: () => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  connect(): void {
    // No-op in VSCode context — connection is implicit via message passing
  }

  disconnect(): void {
    // No-op in VSCode context
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function isVSCodeContext(): boolean {
  return typeof (window as unknown as Record<string, unknown>).acquireVsCodeApi === 'function'
}

let _transport: AssetManagerTransport | null = null

export function getTransport(): AssetManagerTransport {
  if (!_transport) {
    _transport = isVSCodeContext() ? new VscodeTransport() : new HttpTransport(getApiBase())
  }
  return _transport
}

export function __resetTransport(): void {
  _transport = null
}
