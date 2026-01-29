import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'

interface IgnoredAssetsContextType {
  ignoredPaths: Set<string>
  isIgnored: (assetPath: string) => boolean
  addIgnored: (assetPath: string) => void
  removeIgnored: (assetPath: string) => void
  toggleIgnored: (assetPath: string) => void
  clearAll: () => void
}

const IgnoredAssetsContext = createContext<IgnoredAssetsContextType | undefined>(undefined)

const STORAGE_KEY = 'vite-asset-manager-ignored-assets'

export function IgnoredAssetsProvider({ children }: { children: ReactNode }) {
  const [ignoredPaths, setIgnoredPaths] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  const ignoredPathsRef = useRef(ignoredPaths)
  useEffect(() => {
    ignoredPathsRef.current = ignoredPaths
  }, [ignoredPaths])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ignoredPaths]))
  }, [ignoredPaths])

  const isIgnored = useCallback((assetPath: string) => {
    return ignoredPathsRef.current.has(assetPath)
  }, [])

  const addIgnored = useCallback((assetPath: string) => {
    setIgnoredPaths(prev => new Set(prev).add(assetPath))
  }, [])

  const removeIgnored = useCallback((assetPath: string) => {
    setIgnoredPaths(prev => {
      const next = new Set(prev)
      next.delete(assetPath)
      return next
    })
  }, [])

  const toggleIgnored = useCallback((assetPath: string) => {
    setIgnoredPaths(prev => {
      const next = new Set(prev)
      if (next.has(assetPath)) {
        next.delete(assetPath)
      } else {
        next.add(assetPath)
      }
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setIgnoredPaths(new Set())
  }, [])

  return (
    <IgnoredAssetsContext.Provider
      value={{ ignoredPaths, isIgnored, addIgnored, removeIgnored, toggleIgnored, clearAll }}
    >
      {children}
    </IgnoredAssetsContext.Provider>
  )
}

export function useIgnoredAssets() {
  const context = useContext(IgnoredAssetsContext)
  if (!context) {
    throw new Error('useIgnoredAssets must be used within IgnoredAssetsProvider')
  }
  return context
}
