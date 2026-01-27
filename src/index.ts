import type { Plugin } from 'vite'
import { createAssetManagerPlugin } from './plugin'
import type { AssetManagerOptions } from './shared/types'

export type { AssetManagerOptions } from './shared/types'
export type { Asset, AssetGroup, AssetType, AssetStats } from './shared/types'

export default function assetManager(options: AssetManagerOptions = {}): Plugin {
  return createAssetManagerPlugin(options)
}

export { assetManager }
