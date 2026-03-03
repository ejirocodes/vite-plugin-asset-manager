export type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'font'
  | 'data'
  | 'text'
  | 'other'

export type ImportType =
  | 'es-import'
  | 'dynamic-import'
  | 'require'
  | 'css-url'
  | 'html-src'
  | 'html-href'

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
  importersCount: number
  contentHash: string
  duplicatesCount: number
}

export interface AssetGroup {
  directory: string
  assets: Asset[]
  count: number
}

export interface Importer {
  filePath: string
  absolutePath: string
  line: number
  column: number
  importType: ImportType
  snippet: string
}

export interface AssetStats {
  total: number
  byType: Record<AssetType, number>
  totalSize: number
  directories: number
  unused: number
  duplicateGroups: number
  duplicateFiles: number
  extensionBreakdown: Record<string, number>
}

export interface ExtensionSettings {
  include: string[]
  exclude: string[]
  thumbnailSize: number
  aliases: Record<string, string>
}
