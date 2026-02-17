import type { ServerResponse } from 'http'
import type { ParsedUrlQuery } from 'querystring'
import type { AssetScanner } from '../../services/scanner.js'
import type { DuplicateScanner } from '../../services/duplicate-scanner.js'
import type { AssetStats, AssetType } from '../../types/index.js'
import { sendJson } from '../utils.js'
import { parseFilters, applyAssetFilters, applyGroupFilters } from '../filters.js'

export function handleGetAssets(
  res: ServerResponse,
  scanner: AssetScanner,
  query: ParsedUrlQuery
): void {
  const assets = scanner.getAssets()
  let filtered = assets

  const directory = query.directory as string | undefined
  if (directory) {
    filtered = filtered.filter(
      a => a.directory === directory || a.directory.startsWith(directory + '/')
    )
  }

  const type = query.type as AssetType | undefined
  if (type) {
    filtered = filtered.filter(a => a.type === type)
  }

  sendJson(res, { assets: filtered, total: filtered.length })
}

export function handleGetGroupedAssets(
  res: ServerResponse,
  scanner: AssetScanner,
  query: ParsedUrlQuery
): void {
  const groups = scanner.getGroupedAssets()
  const filters = parseFilters(query)
  const filtered = applyGroupFilters(groups, filters)
  const total = filtered.reduce((sum, g) => sum + g.count, 0)
  sendJson(res, { groups: filtered, total })
}

export function handleSearch(
  res: ServerResponse,
  scanner: AssetScanner,
  query: ParsedUrlQuery
): void {
  const q = (query.q as string) || ''
  const results = scanner.search(q)
  const filters = parseFilters(query)
  const filtered = applyAssetFilters(results, filters)
  sendJson(res, { assets: filtered, total: filtered.length, query: q })
}

export function handleGetStats(
  res: ServerResponse,
  scanner: AssetScanner,
  duplicateScanner: DuplicateScanner
): void {
  const assets = scanner.getAssets()
  const dupStats = duplicateScanner.getStats()

  const extensionCounts = new Map<string, number>()
  for (const asset of assets) {
    const ext = asset.extension.toLowerCase()
    extensionCounts.set(ext, (extensionCounts.get(ext) || 0) + 1)
  }

  const stats: AssetStats = {
    total: assets.length,
    byType: {
      image: assets.filter(a => a.type === 'image').length,
      video: assets.filter(a => a.type === 'video').length,
      audio: assets.filter(a => a.type === 'audio').length,
      document: assets.filter(a => a.type === 'document').length,
      font: assets.filter(a => a.type === 'font').length,
      data: assets.filter(a => a.type === 'data').length,
      text: assets.filter(a => a.type === 'text').length,
      other: assets.filter(a => a.type === 'other').length
    },
    totalSize: assets.reduce((sum, a) => sum + a.size, 0),
    directories: [...new Set(assets.map(a => a.directory))].length,
    unused: assets.filter(a => a.importersCount === 0).length,
    duplicateGroups: dupStats.duplicateGroups,
    duplicateFiles: dupStats.duplicateFiles,
    extensionBreakdown: Object.fromEntries(extensionCounts)
  }

  sendJson(res, stats)
}

export function handleGetDuplicates(
  res: ServerResponse,
  scanner: AssetScanner,
  duplicateScanner: DuplicateScanner,
  query: ParsedUrlQuery
): void {
  const hash = query.hash as string

  if (hash) {
    const paths = duplicateScanner.getDuplicatesByHash(hash)
    const assets = scanner.getAssets().filter(a => paths.includes(a.path))
    sendJson(res, { duplicates: assets, total: assets.length, hash })
  } else {
    const assets = scanner.getAssets().filter(a => (a.duplicatesCount ?? 0) > 0)
    sendJson(res, { duplicates: assets, total: assets.length })
  }
}
