export type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'font'
  | 'data'
  | 'text'
  | 'other'

export type EditorType =
  | 'appcode'
  | 'atom'
  | 'atom-beta'
  | 'brackets'
  | 'clion'
  | 'code'
  | 'code-insiders'
  | 'codium'
  | 'cursor'
  | 'emacs'
  | 'idea'
  | 'notepad++'
  | 'pycharm'
  | 'phpstorm'
  | 'rubymine'
  | 'sublime'
  | 'vim'
  | 'visualstudio'
  | 'webstorm'
  | 'rider'
  | (string & {})

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
  importersCount?: number
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
  unused: number
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
  /**
   * Target editor when opening files via "Open in Editor"
   * @default 'code' (Visual Studio Code)
   */
  launchEditor?: EditorType
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
  launchEditor: EditorType
}

export const DEFAULT_OPTIONS: ResolvedOptions = {
  base: '/__asset_manager__',
  include: ['src', 'public'],
  exclude: ['node_modules', '.git', 'dist', '.cache', 'coverage'],
  extensions: [
    /**
     * Images:
     */
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.avif',
    '.ico',
    '.bmp',
    '.tiff',
    '.tif',
    '.heic',
    '.heif',
    /**
     * Videos:
     */
    '.mp4',
    '.webm',
    '.ogg',
    '.mov',
    '.avi',
    /**
     * Audio:
     */
    '.mp3',
    '.wav',
    '.flac',
    '.aac',
    /**
     * Documents:
     */
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    /**
     * Text/Config:
     */
    '.json',
    '.md',
    '.txt',
    '.csv',
    '.yml',
    '.yaml',
    '.toml',
    '.xml',
    /**
     * Fonts:
     */
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.eot'
  ],
  thumbnails: true,
  thumbnailSize: 200,
  watch: true,
  floatingIcon: true,
  launchEditor: 'code'
}

export function resolveOptions(options: AssetManagerOptions): ResolvedOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options
  }
}
