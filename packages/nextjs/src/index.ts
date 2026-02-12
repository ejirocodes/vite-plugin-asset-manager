// Handler
export { createHandler, type NextAssetManagerOptions } from './handler.js'

// Client component
export {
  AssetManagerScript,
  type AssetManagerScriptProps,
} from './components/AssetManagerScript.js'

// Re-export commonly used types from core
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
