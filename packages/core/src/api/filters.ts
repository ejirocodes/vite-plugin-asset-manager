import type { ParsedUrlQuery } from 'querystring'
import type { Asset, AssetGroup, AssetType } from '../types/index.js'

export interface ParsedFilters {
  type?: AssetType
  unused: boolean
  duplicates: boolean
  minSize?: number
  maxSize?: number
  minDate?: number
  maxDate?: number
  extensions?: string[]
}

export function parseFilters(query: ParsedUrlQuery): ParsedFilters {
  return {
    type: query.type as AssetType | undefined,
    unused: query.unused === 'true',
    duplicates: query.duplicates === 'true',
    minSize: query.minSize ? parseInt(query.minSize as string, 10) : undefined,
    maxSize: query.maxSize ? parseInt(query.maxSize as string, 10) : undefined,
    minDate: query.minDate ? parseInt(query.minDate as string, 10) : undefined,
    maxDate: query.maxDate ? parseInt(query.maxDate as string, 10) : undefined,
    extensions: query.extensions
      ? (query.extensions as string).split(',').map(e => e.trim().toLowerCase())
      : undefined
  }
}

export function applyAssetFilters(assets: Asset[], filters: ParsedFilters): Asset[] {
  let result = assets
  if (filters.minSize !== undefined) result = result.filter(a => a.size >= filters.minSize!)
  if (filters.maxSize !== undefined) result = result.filter(a => a.size <= filters.maxSize!)
  if (filters.minDate !== undefined) result = result.filter(a => a.mtime >= filters.minDate!)
  if (filters.maxDate !== undefined) result = result.filter(a => a.mtime <= filters.maxDate!)
  if (filters.extensions) {
    const exts = filters.extensions
    result = result.filter(a => exts.includes(a.extension.toLowerCase()))
  }
  return result
}

function filterGroupAssets(
  groups: AssetGroup[],
  predicate: (a: Asset) => boolean
): AssetGroup[] {
  return groups
    .map(group => {
      const filtered = group.assets.filter(predicate)
      return { ...group, assets: filtered, count: filtered.length }
    })
    .filter(g => g.count > 0)
}

export function applyGroupFilters(groups: AssetGroup[], filters: ParsedFilters): AssetGroup[] {
  let result = groups

  if (filters.type) {
    const t = filters.type
    result = filterGroupAssets(result, a => a.type === t)
  }
  if (filters.unused) {
    result = filterGroupAssets(result, a => a.importersCount === 0)
  }
  if (filters.duplicates) {
    result = filterGroupAssets(result, a => (a.duplicatesCount ?? 0) > 0)
  }
  if (filters.minSize !== undefined || filters.maxSize !== undefined) {
    const min = filters.minSize
    const max = filters.maxSize
    result = filterGroupAssets(result, a => {
      if (min !== undefined && a.size < min) return false
      if (max !== undefined && a.size > max) return false
      return true
    })
  }
  if (filters.minDate !== undefined || filters.maxDate !== undefined) {
    const min = filters.minDate
    const max = filters.maxDate
    result = filterGroupAssets(result, a => {
      if (min !== undefined && a.mtime < min) return false
      if (max !== undefined && a.mtime > max) return false
      return true
    })
  }
  if (filters.extensions) {
    const exts = filters.extensions
    result = filterGroupAssets(result, a => exts.includes(a.extension.toLowerCase()))
  }

  return result
}
