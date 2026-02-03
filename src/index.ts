import type { Plugin } from 'vite'
import { createAssetManagerPlugin } from './plugin'
import type { AssetManagerOptions } from '@vite-asset-manager/core'

export type {
  AssetManagerOptions,
  Asset,
  AssetGroup,
  AssetType,
  AssetStats,
  ResolvedOptions,
  Importer,
  ImportType,
  EditorType
} from '@vite-asset-manager/core'

export default function assetManager(options: AssetManagerOptions = {}): Plugin {
  return createAssetManagerPlugin(options)
}

export { assetManager }
