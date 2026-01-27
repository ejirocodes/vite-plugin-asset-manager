import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from './components/sidebar'
import { AssetGrid } from './components/asset-grid'
import { useAssets } from './hooks/useAssets'
import { useSearch } from './hooks/useSearch'
import { CaretRightIcon, MagnifyingGlassIcon, PackageIcon, FolderOpenIcon } from '@phosphor-icons/react'
import type { Asset } from './types'

export default function App() {
  const { groups, total, loading } = useAssets()
  const { results, searching, search, clear } = useSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const stats = useMemo(() => {
    const allAssets = groups.flatMap(g => g.assets)
    return {
      images: allAssets.filter(a => a.type === 'image').length,
      videos: allAssets.filter(a => a.type === 'video').length,
      audio: allAssets.filter(a => a.type === 'audio').length,
      documents: allAssets.filter(a => a.type === 'document').length,
      fonts: allAssets.filter(a => a.type === 'font').length,
      data: allAssets.filter(a => a.type === 'data').length,
      text: allAssets.filter(a => a.type === 'text').length,
      other: allAssets.filter(a => a.type === 'other').length,
    }
  }, [groups])

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
    if (searchQuery && results.length > 0) {
      const grouped = new Map<string, Asset[]>()
      results.forEach(asset => {
        const dir = asset.directory
        if (!grouped.has(dir)) grouped.set(dir, [])
        grouped.get(dir)!.push(asset)
      })
      return Array.from(grouped.entries()).map(([directory, assets]) => ({
        directory,
        assets,
        count: assets.length
      }))
    }
    return groups
  }, [groups, results, searchQuery])

  const toggleDir = (dir: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dir)) {
        next.delete(dir)
      } else {
        next.add(dir)
      }
      return next
    })
  }

  return (
    <div className="flex h-screen bg-background noise-bg">
      <Sidebar
        total={total}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searching={searching}
        stats={stats}
      />
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Loading assets...</p>
          </div>
        ) : displayGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            {searchQuery ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                  <MagnifyingGlassIcon weight="duotone" className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">No results found</p>
                <p className="text-sm">No assets match "{searchQuery}"</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                  <PackageIcon weight="duotone" className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">No assets found</p>
                <p className="text-sm">Add images, videos, or documents to your project</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {displayGroups.map(group => (
              <div
                key={group.directory}
                className="rounded-xl border border-border bg-card/30 overflow-hidden"
              >
                <button
                  onClick={() => toggleDir(group.directory)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
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
                    <AssetGrid assets={group.assets} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
