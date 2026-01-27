export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'other'

export interface Asset {
  id: string
  name: string
  path: string
  absolutePath: string
  extension: string
  type: AssetType
  size: number
  mtime: number
  directory: string
}

export interface AssetGroup {
  directory: string
  assets: Asset[]
  count: number
}

export interface AssetStats {
  total: number
  byType: Record<AssetType, number>
  totalSize: number
  directories: number
}

export interface AssetManagerOptions {
  base?: string
  include?: string[]
  exclude?: string[]
  extensions?: string[]
  thumbnails?: boolean
  thumbnailSize?: number
  watch?: boolean
  floatingIcon?: boolean
}

export interface ResolvedOptions {
  base: string
  include: string[]
  exclude: string[]
  extensions: string[]
  thumbnails: boolean
  thumbnailSize: number
  watch: boolean
  floatingIcon: boolean
}

export const DEFAULT_OPTIONS: ResolvedOptions = {
  base: '/__asset_manager__',
  include: ['src', 'public'],
  exclude: ['node_modules', '.git', 'dist', '.cache', 'coverage'],
  extensions: [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico', '.bmp',
    '.mp4', '.webm', '.ogg', '.mov', '.avi',
    '.mp3', '.wav', '.flac', '.aac',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.json', '.md', '.txt', '.csv'
  ],
  thumbnails: true,
  thumbnailSize: 200,
  watch: true,
  floatingIcon: true
}

export function resolveOptions(options: AssetManagerOptions): ResolvedOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options
  }
}
