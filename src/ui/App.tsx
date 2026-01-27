import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from './components/Sidebar'
import { AssetGrid } from './components/AssetGrid'
import { useAssets } from './hooks/useAssets'
import { useSearch } from './hooks/useSearch'
import type { Asset } from './types'

export default function App() {
  const { groups, total, loading } = useAssets()
  const { results, searching, search, clear } = useSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

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
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        total={total}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searching={searching}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400">Loading assets...</div>
          </div>
        ) : displayGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            {searchQuery ? (
              <>
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>No assets found for "{searchQuery}"</p>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No assets found</p>
                <p className="text-sm mt-2">Add images, videos, or documents to your project</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {displayGroups.map(group => (
              <div key={group.directory} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDir(group.directory)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedDirs.has(group.directory) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-slate-200">{group.directory}</span>
                  </div>
                  <span className="text-sm text-slate-400">{group.count} items</span>
                </button>
                {expandedDirs.has(group.directory) && (
                  <AssetGrid assets={group.assets} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
