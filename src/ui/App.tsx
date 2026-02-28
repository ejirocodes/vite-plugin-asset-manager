import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { Sidebar } from './components/side-bar'
import { AssetGrid } from './components/asset-grid'
import { SortControls } from './components/sort-controls'
import { BulkActionsBar } from './components/bulk-actions-bar'
import { AdvancedFilters } from './components/advanced-filters'
import { Button } from './components/ui/button'
import { Sheet, SheetContent } from './components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './components/ui/alert-dialog'

const PreviewPanel = lazy(() =>
  import('./components/preview-panel').then(m => ({ default: m.PreviewPanel }))
)
import { useAssets } from './hooks/useAssets'
import { useSearch } from './hooks/useSearch'
import { useStats } from './hooks/useStats'
import { useBulkOperations } from './hooks/useBulkOperations'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useAdvancedFilters } from './hooks/useAdvancedFilters'
import { useIgnoredAssets } from './providers/ignored-assets-provider'
import { sortAssets, type SortOption } from '@/ui/lib/sort-utils'
import {
  ArrowSquareOutIcon,
  CaretRightIcon,
  FolderOpenIcon,
  ListIcon,
  LightningIcon
} from '@phosphor-icons/react'
import { isEmbedded } from './hooks/useEmbeddedMode'
import { openAssetInEditor, revealAssetInFinder } from '@/ui/lib/asset-api'
import { toast } from 'sonner'
import type { Asset, AssetType } from './types'

const LOADING_MESSAGES = [
  'Scanning directories\u2026',
  'Indexing files\u2026',
  'Generating thumbnails\u2026',
  'Detecting imports\u2026'
]

function LoadingSpinner() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      <p className="text-muted-foreground text-sm transition-opacity duration-300">
        {LOADING_MESSAGES[msgIndex]}
      </p>
    </div>
  )
}

function EmptyStateSearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <p className="text-sm font-medium text-foreground mb-1">
        No assets match &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        Check your spelling or try a broader term.
      </p>
      <button
        onClick={onClear}
        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
      >
        Clear search
      </button>
    </div>
  )
}

const EmptyStateNoAssetsFiltered = (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <p className="text-sm font-medium text-foreground mb-2">No assets discovered</p>
    <div className="text-xs text-muted-foreground space-y-1 text-center max-w-xs">
      <p>Assets are scanned from the directories in your plugin config.</p>
      <p className="font-mono text-[11px] bg-muted/50 rounded px-2 py-1 inline-block mt-2">
        include: [&apos;src&apos;, &apos;public&apos;]
      </p>
    </div>
  </div>
)

export default function App() {
  const [selectedType, setSelectedType] = useState<AssetType | null>(null)
  const [showUnusedOnly, setShowUnusedOnly] = useState(false)
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const filterParams = useMemo(() => {
    return filterParamsString ? new URLSearchParams(filterParamsString) : undefined
  }, [filterParamsString])

  const { groups, loading } = useAssets(selectedType, undefined, filterParams)
  const { stats } = useStats()
  const { results, searching, searched, search, clear } = useSearch(filterParams)
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
  const [pendingDeleteAssets, setPendingDeleteAssets] = useState<Asset[] | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const hasInitializedDirs = useRef(false)
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
    if (groups.length > 0 && !hasInitializedDirs.current) {
      hasInitializedDirs.current = true
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

    if (searchQuery && (results.length > 0 || (searched && !searching))) {
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
        .map(group => {
          const unusedAssets = group.assets.filter(
            a => a.importersCount === 0 && !isIgnored(a.path)
          )
          return {
            ...group,
            assets: unusedAssets,
            count: unusedAssets.length
          }
        })
        .filter(group => group.count > 0)
    }

    if (showDuplicatesOnly) {
      filtered = filtered
        .map(group => {
          const duplicateAssets = group.assets.filter(a => a.duplicatesCount > 0)
          return {
            ...group,
            assets: duplicateAssets,
            count: duplicateAssets.length
          }
        })
        .filter(group => group.count > 0)
    }

    return filtered.map(group => ({
      ...group,
      assets: sortAssets(group.assets, sortOption)
    }))
  }, [groups, results, searchQuery, searched, searching, sortOption, showUnusedOnly, showDuplicatesOnly, isIgnored])

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

  const handleToggleSelect = useCallback(
    (assetId: string, shiftKey: boolean) => {
      setSelectedAssets(prev => {
        const next = new Set(prev)

        if (shiftKey && lastSelectedId) {
          const lastIndex = flatAssetList.findIndex(a => a.id === lastSelectedId)
          const currentIndex = flatAssetList.findIndex(a => a.id === assetId)

          if (lastIndex !== -1 && currentIndex !== -1) {
            const [start, end] =
              lastIndex < currentIndex ? [lastIndex, currentIndex] : [currentIndex, lastIndex]

            for (let i = start; i <= end; i++) {
              next.add(flatAssetList[i].id)
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
    [lastSelectedId, flatAssetList]
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

  const handleBulkDelete = useCallback(async () => {
    const success = await bulkDelete(selectedAssetsArray)
    if (success) {
      setSelectedAssets(new Set())
      setLastSelectedId(null)
    }
  }, [bulkDelete, selectedAssetsArray])

  const handleConfirmKeyboardDelete = useCallback(async () => {
    if (!pendingDeleteAssets) return
    const success = await bulkDelete(pendingDeleteAssets)
    if (success) {
      setSelectedAssets(new Set())
      setLastSelectedId(null)
      setFocusedAssetId(null)
    }
    setPendingDeleteAssets(null)
  }, [bulkDelete, pendingDeleteAssets])

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
      await openAssetInEditor(asset.path)
      toast.success('Opening in editor...')
    } catch {
      toast.error('Failed to open in editor')
    }
  }, [])

  const handleRevealInFinder = useCallback(async (asset: Asset) => {
    try {
      await revealAssetInFinder(asset.path)
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      toast.success(`File revealed in ${isMac ? 'Finder' : 'Explorer'}`)
    } catch {
      toast.error('Failed to reveal file in system explorer')
    }
  }, [])

  const handleKeyboardDelete = useCallback((assets: Asset[]) => {
    setPendingDeleteAssets(assets)
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
    searchInputRef,
    onCopyPaths: handleCopyPaths,
    onDelete: handleKeyboardDelete,
    onOpenInEditor: handleOpenInEditor,
    onRevealInFinder: handleRevealInFinder
  })

  useEffect(() => {
    if (focusedAssetId && isGridFocused) {
      const timer = setTimeout(() => {
        const asset = flatAssetList.find(a => a.id === focusedAssetId)
        if (asset) {
          setSrAnnouncement(`Focused on ${asset.name}`)
        }
      }, 300)
      return () => clearTimeout(timer)
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

  const adjustedStats = useMemo(() => {
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
        <div className="hidden md:block">
          <Sidebar
            total={adjustedStats.total}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searching={searching}
            searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
            onSearchFocus={() => setIsGridFocused(false)}
            selectedType={selectedType}
            onTypeSelect={setSelectedType}
            showUnusedOnly={showUnusedOnly}
            onUnusedFilterToggle={handleUnusedFilterToggle}
            showDuplicatesOnly={showDuplicatesOnly}
            onDuplicatesFilterToggle={handleDuplicatesFilterToggle}
            stats={adjustedStats}
          />
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-70 sm:w-[320px]">
            <Sidebar
              total={adjustedStats.total}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searching={searching}
              searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
              onSearchFocus={() => setIsGridFocused(false)}
              selectedType={selectedType}
              onTypeSelect={type => {
                setSelectedType(type)
                setSidebarOpen(false)
              }}
              showUnusedOnly={showUnusedOnly}
              onUnusedFilterToggle={() => {
                handleUnusedFilterToggle()
                setSidebarOpen(false)
              }}
              showDuplicatesOnly={showDuplicatesOnly}
              onDuplicatesFilterToggle={() => {
                handleDuplicatesFilterToggle()
                setSidebarOpen(false)
              }}
              stats={adjustedStats}
            />
          </SheetContent>
        </Sheet>

        <main ref={mainRef} className="flex-1 overflow-auto flex flex-col">
          <header
            className={`sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 ${
              isEmbedded ? '' : 'md:hidden'
            }`}
          >
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                {!isEmbedded && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="md:hidden"
                    aria-label="Toggle sidebar"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <ListIcon weight="bold" className="h-5 w-5" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                    <LightningIcon weight="fill" className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="font-mono text-xs font-semibold tracking-wide text-foreground">
                      ASSET MANAGER
                    </h1>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {adjustedStats.total}
                </span>
                {isEmbedded && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => window.open(window.location.pathname, '_blank')}
                    aria-label="Open full dashboard in new tab"
                    title="Open full dashboard in new tab"
                  >
                    <ArrowSquareOutIcon weight="bold" className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </header>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <BulkActionsBar
                selectedCount={selectedAssets.size}
                totalCount={totalVisibleAssets}
                selectedAssets={selectedAssetsArray}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onDelete={handleBulkDelete}
                isDeleting={isDeleting}
                visible={selectedAssets.size > 0}
              />
              <div className="p-3 sm:p-4 md:p-6 pt-2 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
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
                {displayGroups.length === 0
                  ? searchQuery
                    ? <EmptyStateSearchResults query={searchQuery} onClear={() => setSearchQuery('')} />
                    : EmptyStateNoAssetsFiltered
                  : displayGroups.map(group => (
                      <div
                        key={group.directory}
                        className="rounded-lg border border-border overflow-hidden"
                      >
                        <button
                          onClick={() => toggleDir(group.directory)}
                          className="w-full flex items-center justify-between cursor-pointer px-4 py-3 bg-muted/40 hover:bg-muted/60 active:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <CaretRightIcon
                              weight="bold"
                              className={`w-3.5 h-3.5 text-muted-foreground/70 transition-transform duration-200 ${
                                expandedDirs.has(group.directory) ? 'rotate-90' : ''
                              }`}
                            />
                            <FolderOpenIcon weight="duotone" className="w-4.5 h-4.5 text-muted-foreground" />
                            <span className="font-mono text-sm font-semibold text-foreground tracking-tight">
                              {group.directory}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground/70 font-mono tabular-nums">
                            {group.count}
                          </span>
                        </button>
                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                            expandedDirs.has(group.directory) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="border-t border-border">
                              <AssetGrid
                                assets={group.assets}
                                scrollContainerRef={mainRef}
                                onPreview={handlePreview}
                                selectedAssets={selectedAssets}
                                focusedAssetId={focusedAssetId}
                                onToggleSelect={handleToggleSelect}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
              {displayGroups.length > 0 && selectedAssets.size === 0 && (
                <div className="hidden md:flex items-center justify-center gap-4 py-3 text-[11px] text-muted-foreground/50 font-mono select-none">
                  <span><kbd className="font-sans">↑↓</kbd> Navigate</span>
                  <span><kbd className="font-sans">Space</kbd> Select</span>
                  <span><kbd className="font-sans">Enter</kbd> Preview</span>
                  <span><kbd className="font-sans">/</kbd> Search</span>
                  <span><kbd className="font-sans">?</kbd> All shortcuts</span>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {selectedAsset && (
        <Suspense
          fallback={
            <aside className="fixed top-0 right-0 z-50 h-screen w-96 border-l border-border bg-card/80 backdrop-blur-sm flex flex-col animate-slide-in-right">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-6 w-6 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-56 bg-muted/30 animate-pulse" />
              <div className="p-4 space-y-3">
                {[120, 80, 100, 60, 90].map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 rounded bg-muted animate-pulse" style={{ width: 60 }} />
                    <div className="h-3 rounded bg-muted animate-pulse" style={{ width: w }} />
                  </div>
                ))}
              </div>
            </aside>
          }
        >
          <PreviewPanel
            asset={selectedAsset}
            onClose={handleClosePreview}
            onSelectAsset={handlePreview}
            flatAssetList={flatAssetList}
            onAssetChange={setSelectedAsset}
          />
        </Suspense>
      )}
      <AlertDialog
        open={pendingDeleteAssets !== null}
        onOpenChange={open => {
          if (!open) setPendingDeleteAssets(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {pendingDeleteAssets?.length ?? 0} asset
              {(pendingDeleteAssets?.length ?? 0) !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The following files will be permanently deleted from
              your computer:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="max-h-32 overflow-y-auto text-xs font-mono bg-muted/50 rounded p-2 space-y-0.5">
            {pendingDeleteAssets?.slice(0, 10).map(a => (
              <li key={a.id} className="truncate text-muted-foreground">
                {a.path}
              </li>
            ))}
            {(pendingDeleteAssets?.length ?? 0) > 10 && (
              <li className="text-muted-foreground/60">
                ...and {(pendingDeleteAssets?.length ?? 0) - 10} more
              </li>
            )}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmKeyboardDelete}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
