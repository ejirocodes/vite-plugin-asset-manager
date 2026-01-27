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
