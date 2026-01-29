import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Sidebar } from './components/side-bar'
import { AssetGrid } from './components/asset-grid'
import { PreviewPanel } from './components/preview-panel'
import { SortControls } from './components/sort-controls'
import { BulkActionsBar } from './components/bulk-actions-bar'
import { AdvancedFilters } from './components/advanced-filters'
import { useAssets } from './hooks/useAssets'
import { useSearch } from './hooks/useSearch'
import { useStats } from './hooks/useStats'
import { useBulkOperations } from './hooks/useBulkOperations'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useAdvancedFilters } from './hooks/useAdvancedFilters'
import { useIgnoredAssets } from './providers/ignored-assets-provider'
import { sortAssets, type SortOption } from '@/ui/lib/sort-utils'
import {
  CaretRightIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  FolderOpenIcon
} from '@phosphor-icons/react'
import type { Asset, AssetType } from './types'

// Hoist static JSX outside component to prevent recreating on every render
// Vercel best practice: rendering-hoist-jsx
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

const EmptyStateSearchResults = (searchQuery: string) => (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
    <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
      <MagnifyingGlassIcon weight="duotone" className="w-10 h-10 text-muted-foreground/50" />
    </div>
    <p className="text-lg font-medium text-foreground mb-1">No results found</p>
    <p className="text-sm">No assets match "{searchQuery}"</p>
  </div>
)

const EmptyStateNoAssetsFiltered = (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
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
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)

  const {
    sizeFilter,
    setSizeFilter,
    dateFilter,
    setDateFilter,
    extensionFilter,
    setExtensionFilter,
    activeFilterCount,
    clearAll: clearAdvancedFilters,
    filterParamsString
  } = useAdvancedFilters()

  // Convert filter params string to URLSearchParams only when needed
  // Vercel best practice: rerender-dependencies (use primitive string instead of object)
  const filterParams = useMemo(() => {
    return filterParamsString ? new URLSearchParams(filterParamsString) : undefined
  }, [filterParamsString])

  const { groups, loading } = useAssets(selectedType, undefined, filterParams)
  const { stats } = useStats()
  const { results, searching, search, clear } = useSearch(filterParams)
  const { isIgnored } = useIgnoredAssets()
  const { isDeleting, bulkDelete } = useBulkOperations()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set())
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'name',
    direction: 'asc'
  })

  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(() => new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null)
  const [isGridFocused, setIsGridFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [srAnnouncement, setSrAnnouncement] = useState('')

  const handlePreview = useCallback((asset: Asset) => {
    setSelectedAsset(asset)
  }, [])

  const handleClosePreview = useCallback(() => {
    setSelectedAsset(null)
  }, [])

  const handleUnusedFilterToggle = useCallback(() => {
    setShowUnusedOnly(prev => !prev)
  }, [])

  const handleDuplicatesFilterToggle = useCallback(() => {
    setShowDuplicatesOnly(prev => !prev)
  }, [])

  useEffect(() => {
    setSelectedAssets(new Set())
    setLastSelectedId(null)
  }, [selectedType, showUnusedOnly, showDuplicatesOnly, searchQuery, filterParams])

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

  // Memoize expensive filtering and sorting operations
  // Vercel best practice: rerender-memo - extract expensive work into memoized components
  const displayGroups = useMemo(() => {
    let baseGroups = groups

    // Use search results if available
    if (searchQuery && results.length > 0) {
      const grouped = new Map<string, Asset[]>()
      // Vercel best practice: js-combine-iterations - single pass through results
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

    // Apply unused filter - Vercel best practice: js-early-exit
    if (showUnusedOnly) {
      filtered = filtered
        .map(group => {
          // Vercel best practice: js-combine-iterations - single filter pass
          const unusedAssets = group.assets.filter(a => a.importersCount === 0 && !isIgnored(a.path))
          return {
            ...group,
            assets: unusedAssets,
            count: unusedAssets.length
          }
        })
        .filter(group => group.count > 0)
    }

    // Apply duplicates filter
    if (showDuplicatesOnly) {
      filtered = filtered
        .map(group => {
          // Vercel best practice: js-combine-iterations - single filter pass
          const duplicateAssets = group.assets.filter(a => (a.duplicatesCount ?? 0) > 0)
          return {
            ...group,
            assets: duplicateAssets,
            count: duplicateAssets.length
          }
        })
        .filter(group => group.count > 0)
    }

    // Apply sorting last to avoid sorting filtered-out assets
    return filtered.map(group => ({
      ...group,
      assets: sortAssets(group.assets, sortOption)
    }))
  }, [groups, results, searchQuery, sortOption, showUnusedOnly, showDuplicatesOnly, isIgnored])

  // Flat list of all displayed assets for keyboard navigation
  const flatAssetList = useMemo(() => {
    return displayGroups.flatMap(group => group.assets)
  }, [displayGroups])

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

  // Stable callback using functional setState
  // Vercel best practice: rerender-functional-setstate
  const handleToggleSelect = useCallback(
    (assetId: string, shiftKey: boolean) => {
      // Use functional setState to avoid dependency on selectedAssets
      setSelectedAssets(prev => {
        const next = new Set(prev)

        if (shiftKey && lastSelectedId) {
          const allAssets = displayGroups.flatMap(g => g.assets)
          const lastIndex = allAssets.findIndex(a => a.id === lastSelectedId)
          const currentIndex = allAssets.findIndex(a => a.id === assetId)

          if (lastIndex !== -1 && currentIndex !== -1) {
            const [start, end] =
              lastIndex < currentIndex ? [lastIndex, currentIndex] : [currentIndex, lastIndex]

            // Vercel best practice: js-early-exit - avoid unnecessary work
            for (let i = start; i <= end; i++) {
              next.add(allAssets[i].id)
            }
          }
        } else {
          if (next.has(assetId)) {
            next.delete(assetId)
          } else {
            next.add(assetId)
          }
        }

        return next
      })
      setLastSelectedId(assetId)
    },
    [lastSelectedId, displayGroups]
  )

  const handleSelectAll = useCallback(() => {
    const allIds = displayGroups.flatMap(g => g.assets.map(a => a.id))
    setSelectedAssets(new Set(allIds))
  }, [displayGroups])

  const handleDeselectAll = useCallback(() => {
    setSelectedAssets(new Set())
    setLastSelectedId(null)
  }, [])

  const selectedAssetsArray = useMemo(() => {
    const allAssets = displayGroups.flatMap(g => g.assets)
    return allAssets.filter(a => selectedAssets.has(a.id))
  }, [displayGroups, selectedAssets])

  // Stable callback - bulkDelete is stable from hook
  // Vercel best practice: rerender-dependencies
  const handleBulkDelete = useCallback(async () => {
    const success = await bulkDelete(selectedAssetsArray)
    if (success) {
      // Vercel best practice: rerender-functional-setstate
      setSelectedAssets(new Set())
      setLastSelectedId(null)
    }
  }, [bulkDelete, selectedAssetsArray])

  const handleCopyPaths = useCallback(async (assets: Asset[]) => {
    try {
      const paths = assets.map(a => a.path).join('\n')
      await navigator.clipboard.writeText(paths)
    } catch (err) {
      console.error('Failed to copy paths:', err)
    }
  }, [])

  const handleOpenInEditor = useCallback(async (asset: Asset) => {
    try {
      const response = await fetch(
        `/__asset_manager__/api/importers?path=${encodeURIComponent(asset.path)}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.importers && data.importers.length > 0) {
          const firstImporter = data.importers[0]
          await fetch(
            `/__asset_manager__/api/open-in-editor?file=${encodeURIComponent(firstImporter.file)}&line=${firstImporter.line}&column=${firstImporter.column}`,
            { method: 'POST' }
          )
        }
      }
    } catch (err) {
      console.error('Failed to open in editor:', err)
    }
  }, [])

  const handleRevealInFinder = useCallback(async (asset: Asset) => {
    try {
      await fetch(
        `/__asset_manager__/api/reveal-in-finder?path=${encodeURIComponent(asset.path)}`,
        { method: 'POST' }
      )
    } catch (err) {
      console.error('Failed to reveal in finder:', err)
    }
  }, [])

  useKeyboardNavigation({
    flatAssetList,
    focusedAssetId,
    setFocusedAssetId,
    isGridFocused,
    setIsGridFocused,
    selectedAssets,
    toggleSelection: handleToggleSelect,
    selectAll: handleSelectAll,
    clearSelection: handleDeselectAll,
    previewAsset: selectedAsset,
    setPreviewAsset: setSelectedAsset,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    onCopyPaths: handleCopyPaths,
    onDelete: (assets: Asset[]) => {
      bulkDelete(assets)
    },
    onOpenInEditor: handleOpenInEditor,
    onRevealInFinder: handleRevealInFinder
  })

  useEffect(() => {
    if (focusedAssetId && isGridFocused) {
      const asset = flatAssetList.find(a => a.id === focusedAssetId)
      if (asset) {
        setSrAnnouncement(`Focused on ${asset.name}`)
      }
    }
  }, [focusedAssetId, isGridFocused, flatAssetList])

  useEffect(() => {
    if (selectedAssets.size > 0) {
      setSrAnnouncement(
        `${selectedAssets.size} asset${selectedAssets.size === 1 ? '' : 's'} selected`
      )
    }
  }, [selectedAssets.size])

  const totalVisibleAssets = useMemo(
    () => displayGroups.reduce((sum, g) => sum + g.count, 0),
    [displayGroups]
  )

  // Memoize stats adjustment computation
  // Vercel best practice: rerender-memo
  const adjustedStats = useMemo(() => {
    // Vercel best practice: js-combine-iterations - combine flatMap and filter in one pass
    let ignoredUnusedCount = 0
    for (const group of groups) {
      for (const asset of group.assets) {
        if (asset.importersCount === 0 && isIgnored(asset.path)) {
          ignoredUnusedCount++
        }
      }
    }

    return {
      ...stats,
      unused: Math.max(0, (stats.unused || 0) - ignoredUnusedCount),
      duplicateFiles: stats.duplicateFiles || 0,
      extensionBreakdown: stats.extensionBreakdown || {}
    }
  }, [stats, groups, isIgnored])

  return (
    <>
      {/* Screen reader live region for keyboard navigation announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>
      <div className="flex h-screen bg-background noise-bg">
        <Sidebar
          total={adjustedStats.total}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searching={searching}
          searchInputRef={searchInputRef}
          onSearchFocus={() => setIsGridFocused(false)}
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
          showUnusedOnly={showUnusedOnly}
          onUnusedFilterToggle={handleUnusedFilterToggle}
          showDuplicatesOnly={showDuplicatesOnly}
          onDuplicatesFilterToggle={handleDuplicatesFilterToggle}
          stats={adjustedStats}
        />
        <main className="flex-1 overflow-auto">
          {loading ? (
            LoadingSpinner
          ) : (
            <>
              {selectedAssets.size > 0 && (
                <BulkActionsBar
                  selectedCount={selectedAssets.size}
                  totalCount={totalVisibleAssets}
                  selectedAssets={selectedAssetsArray}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onDelete={handleBulkDelete}
                  isDeleting={isDeleting}
                />
              )}
              <div className="p-6 pt-2 space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <AdvancedFilters
                    sizeFilter={sizeFilter}
                    dateFilter={dateFilter}
                    extensionFilter={extensionFilter}
                    onSizeChange={setSizeFilter}
                    onDateChange={setDateFilter}
                    onExtensionChange={setExtensionFilter}
                    onClearAll={clearAdvancedFilters}
                    activeCount={activeFilterCount}
                    availableExtensions={Object.keys(adjustedStats.extensionBreakdown || {})}
                  />
                  <SortControls value={sortOption} onChange={setSortOption} />
                </div>
                {displayGroups.length === 0 ? (
                  searchQuery ? EmptyStateSearchResults(searchQuery) : EmptyStateNoAssetsFiltered
                ) : (
                  displayGroups.map(group => (
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
                          <AssetGrid
                            assets={group.assets}
                            onPreview={handlePreview}
                            selectedAssets={selectedAssets}
                            focusedAssetId={focusedAssetId}
                            onToggleSelect={handleToggleSelect}
                            onGridFocus={() => setIsGridFocused(true)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
      {selectedAsset && (
        <PreviewPanel
          asset={selectedAsset}
          onClose={handleClosePreview}
          onSelectAsset={handlePreview}
          flatAssetList={flatAssetList}
          onAssetChange={setSelectedAsset}
        />
      )}
    </>
  )
}
