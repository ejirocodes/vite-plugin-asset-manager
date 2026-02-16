export { createHandler, type NextAssetManagerOptions } from './handler.js'

export {
  withAssetManager,
  type WithAssetManagerOptions,
} from './with-asset-manager.js'

export {
  AssetManagerScript,
  type AssetManagerScriptProps,
} from './components/AssetManagerScript.js'

// Re-exporting commonly used types from core module
export type {
  AssetManagerOptions,
  Asset,
  AssetGroup,
  AssetType,
  AssetStats,
  ResolvedOptions,
  Importer,
  ImportType,
  EditorType,
} from '@vite-asset-manager/core'
