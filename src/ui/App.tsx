import { useState, useMemo, useEffect, useCallback } from 'react'
import { Sidebar } from './components/side-bar'
import { AssetGrid } from './components/asset-grid'
import { PreviewPanel } from './components/preview-panel'
import { SortControls } from './components/sort-controls'
import { useAssets } from './hooks/useAssets'
import { useSearch } from './hooks/useSearch'
import { useStats } from './hooks/useStats'
import { useIgnoredAssets } from './providers/ignored-assets-provider'
import { sortAssets, type SortOption } from '@/ui/lib/sort-utils'
import {
  CaretRightIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  FolderOpenIcon
} from '@phosphor-icons/react'
import type { Asset, AssetType } from './types'

const LoadingSpinner = (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    <p className="text-muted-foreground text-sm">Loading assets...</p>
  </div>
)

const EmptyStateNoAssets = (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
      <PackageIcon weight="duotone" className="w-10 h-10 text-muted-foreground/50" />
    </div>
    <p className="text-lg font-medium text-foreground mb-1">No assets found</p>
    <p className="text-sm">Add images, videos, or documents to your project</p>
  </div>
)

export default function App() {
  const [selectedType, setSelectedType] = useState<AssetType | null>(null)
  const [showUnusedOnly, setShowUnusedOnly] = useState(false)
  const { groups, loading } = useAssets(selectedType)
  const { stats } = useStats()
  const { results, searching, search, clear } = useSearch()
  const { isIgnored } = useIgnoredAssets()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set())
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'name',
    direction: 'asc'
  })

  const handlePreview = useCallback((asset: Asset) => {
    setSelectedAsset(asset)
  }, [])

  const handleClosePreview = useCallback(() => {
    setSelectedAsset(null)
  }, [])

  const handleUnusedFilterToggle = useCallback(() => {
    setShowUnusedOnly(prev => !prev)
  }, [])

  useEffect(() => {
    if (groups.length > 0 && expandedDirs.size === 0) {
      setExpandedDirs(new Set(groups.map(g => g.directory)))
    }
  }, [groups])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        search(searchQuery)
      } else {
        clear()
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery, search, clear])

  const displayGroups = useMemo(() => {
    let baseGroups = groups

    if (searchQuery && results.length > 0) {
      const grouped = new Map<string, Asset[]>()
      results.forEach(asset => {
        const dir = asset.directory
        if (!grouped.has(dir)) grouped.set(dir, [])
        grouped.get(dir)!.push(asset)
      })
      baseGroups = Array.from(grouped.entries()).map(([directory, assets]) => ({
        directory,
        assets,
        count: assets.length
      }))
    }

    let filtered = baseGroups
    if (showUnusedOnly) {
      filtered = filtered
        .map(group => ({
          ...group,
          assets: group.assets.filter(a => a.importersCount === 0 && !isIgnored(a.path)),
          count: group.assets.filter(a => a.importersCount === 0 && !isIgnored(a.path)).length
        }))
        .filter(group => group.count > 0)
    }

    return filtered.map(group => ({
      ...group,
      assets: sortAssets(group.assets, sortOption)
    }))
  }, [groups, results, searchQuery, sortOption, showUnusedOnly, isIgnored])

  const toggleDir = useCallback((dir: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dir)) {
        next.delete(dir)
      } else {
        next.add(dir)
      }
      return next
    })
  }, [])

  const adjustedStats = useMemo(() => {
    const ignoredUnusedCount = groups
      .flatMap(g => g.assets)
      .filter(a => a.importersCount === 0 && isIgnored(a.path)).length

    return {
      ...stats,
      unused: Math.max(0, (stats.unused || 0) - ignoredUnusedCount)
    }
  }, [stats, groups, isIgnored])

  return (
    <>
      <div className="flex h-screen bg-background noise-bg">
        <Sidebar
          total={adjustedStats.total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searching={searching}
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
          showUnusedOnly={showUnusedOnly}
          onUnusedFilterToggle={handleUnusedFilterToggle}
          stats={adjustedStats}
        />
        <main className="flex-1 overflow-auto">
          {loading ? (
            LoadingSpinner
          ) : displayGroups.length === 0 ? (
            searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                  <MagnifyingGlassIcon
                    weight="duotone"
                    className="w-10 h-10 text-muted-foreground/50"
                  />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">No results found</p>
                <p className="text-sm">No assets match "{searchQuery}"</p>
              </div>
            ) : (
              EmptyStateNoAssets
            )
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-end">
                <SortControls value={sortOption} onChange={setSortOption} />
              </div>
              {displayGroups.map(group => (
                <div
                  key={group.directory}
                  className="rounded-xl border border-border bg-card/30 overflow-hidden"
                >
                  <button
                    onClick={() => toggleDir(group.directory)}
                    className="w-full flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CaretRightIcon
                        weight="bold"
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          expandedDirs.has(group.directory) ? 'rotate-90' : ''
                        }`}
                      />
                      <FolderOpenIcon weight="duotone" className="w-5 h-5 text-amber-400" />
                      <span className="font-mono text-sm font-medium text-foreground">
                        {group.directory}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                      {group.count} {group.count === 1 ? 'item' : 'items'}
                    </span>
                  </button>
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${expandedDirs.has(group.directory) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="border-t border-border">
                      <AssetGrid assets={group.assets} onPreview={handlePreview} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {selectedAsset && <PreviewPanel asset={selectedAsset} onClose={handleClosePreview} />}
    </>
  )
}
