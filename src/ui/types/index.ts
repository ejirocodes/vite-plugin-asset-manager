export type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'font'
  | 'data'
  | 'text'
  | 'other'

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

export interface UseAssetsResult {
  groups: AssetGroup[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseSearchResult {
  results: Asset[]
  searching: boolean
  search: (query: string) => Promise<void>
  clear: () => void
}

export type ImportType =
  | 'es-import'
  | 'dynamic-import'
  | 'require'
  | 'css-url'
  | 'html-src'
  | 'html-href'

export interface Importer {
  filePath: string
  absolutePath: string
  line: number
  column: number
  importType: ImportType
  snippet: string
}

export interface UseImportersResult {
  importers: Importer[]
  loading: boolean
  error: string | null
  openInEditor: (importer: Importer) => Promise<void>
}
