import { useEffect } from 'react'
import type { Asset } from '../types'

interface UseKeyboardNavigationOptions {
  flatAssetList: Asset[]

  focusedAssetId: string | null
  setFocusedAssetId: (id: string | null) => void
  isGridFocused: boolean
  setIsGridFocused: (focused: boolean) => void

  selectedAssets: Set<string>
  toggleSelection: (assetId: string, shiftKey: boolean) => void
  selectAll: () => void
  clearSelection: () => void

  previewAsset: Asset | null
  setPreviewAsset: (asset: Asset | null) => void

  searchQuery: string
  setSearchQuery: (query: string) => void
  searchInputRef: React.RefObject<HTMLInputElement>

  onCopyPaths: (assets: Asset[]) => void
  onDelete: (assets: Asset[]) => void
  onOpenInEditor: (asset: Asset) => void
  onRevealInFinder: (asset: Asset) => void
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    flatAssetList,
    focusedAssetId,
    setFocusedAssetId,
    isGridFocused,
    setIsGridFocused,
    selectedAssets,
    toggleSelection,
    selectAll,
    clearSelection,
    previewAsset,
    setPreviewAsset,
    searchInputRef,
    onCopyPaths,
    onDelete,
    onOpenInEditor,
    onRevealInFinder
  } = options

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      const modKey = isMac ? e.metaKey : e.ctrlKey

      const getTargetAssets = (): Asset[] => {
        if (selectedAssets.size > 0) {
          return flatAssetList.filter(a => selectedAssets.has(a.id))
        }
        if (focusedAssetId) {
          const asset = flatAssetList.find(a => a.id === focusedAssetId)
          return asset ? [asset] : []
        }
        return []
      }

      const getGridColumns = (): number => {
        const width = window.innerWidth
        if (width >= 1536) return 6 // 2xl
        if (width >= 1280) return 5 // xl
        if (width >= 1024) return 4 // lg
        if (width >= 768) return 3 // md
        if (width >= 640) return 2 // sm
        return 1 // xs
      }

      const handleGridNavigation = (key: string) => {
        if (flatAssetList.length === 0) return

        const currentIndex = focusedAssetId
          ? flatAssetList.findIndex(a => a.id === focusedAssetId)
          : -1

        let newIndex = currentIndex

        if (key === 'ArrowRight') {
          newIndex = Math.min(currentIndex + 1, flatAssetList.length - 1)
        } else if (key === 'ArrowLeft') {
          newIndex = Math.max(currentIndex - 1, 0)
        } else if (key === 'ArrowDown' || key === 'j') {
          const cols = getGridColumns()
          newIndex = Math.min(currentIndex + cols, flatAssetList.length - 1)
        } else if (key === 'ArrowUp' || key === 'k') {
          const cols = getGridColumns()
          newIndex = Math.max(currentIndex - cols, 0)
        }

        // If no item focused yet, start at first item
        if (currentIndex === -1) {
          newIndex = 0
        }

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < flatAssetList.length) {
          setFocusedAssetId(flatAssetList[newIndex].id)
          setIsGridFocused(true)
        }
      }

      const cycleFocus = (direction: 1 | -1) => {
        if (flatAssetList.length === 0) return

        const currentIndex = focusedAssetId
          ? flatAssetList.findIndex(a => a.id === focusedAssetId)
          : -1

        let newIndex: number
        if (currentIndex === -1) {
          newIndex = direction === 1 ? 0 : flatAssetList.length - 1
        } else {
          newIndex = (currentIndex + direction + flatAssetList.length) % flatAssetList.length
        }

        setFocusedAssetId(flatAssetList[newIndex].id)
        setIsGridFocused(true)
      }

      // ===== GLOBAL SHORTCUTS (work anywhere) =====

      // / - Focus search
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setIsGridFocused(false)
        return
      }

      // Escape - Close preview or blur search
      if (e.key === 'Escape') {
        if (previewAsset) {
          setPreviewAsset(null)
          setIsGridFocused(true) // Return focus to grid
        } else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur()
          setIsGridFocused(true)
        }
        return
      }

      // ===== GRID NAVIGATION (only when grid focused or no input active) =====

      if (isGridFocused || (!isInputField && !previewAsset)) {
        // Arrow keys or j/k - Navigate grid
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'j', 'k'].includes(e.key)) {
          e.preventDefault()
          handleGridNavigation(e.key)
          return
        }

        // Space - Toggle selection of focused item
        if (e.key === ' ') {
          e.preventDefault()
          if (focusedAssetId) {
            toggleSelection(focusedAssetId, false)
          }
          return
        }

        // Enter - Open preview of focused item
        if (e.key === 'Enter') {
          e.preventDefault()
          if (focusedAssetId) {
            const asset = flatAssetList.find(a => a.id === focusedAssetId)
            if (asset) setPreviewAsset(asset)
          }
          return
        }

        // Tab - Cycle focus forward through grid
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault()
          cycleFocus(1)
          return
        }

        // Shift+Tab - Cycle focus backward through grid
        if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault()
          cycleFocus(-1)
          return
        }

        // Cmd/Ctrl+A - Select all assets
        if (modKey && e.key === 'a') {
          e.preventDefault()
          selectAll()
          return
        }

        // Cmd/Ctrl+D - Deselect all
        if (modKey && e.key === 'd') {
          e.preventDefault()
          clearSelection()
          return
        }
      }

      // ===== ACTION SHORTCUTS (only with focused or selected assets) =====

      const targetAssets = getTargetAssets()
      if (targetAssets.length === 0) return

      // Delete or Backspace - Delete assets
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInputField) {
          e.preventDefault()
          onDelete(targetAssets)
        }
        return
      }

      // Cmd/Ctrl+C - Copy paths
      if (modKey && e.key === 'c' && !isInputField) {
        e.preventDefault()
        onCopyPaths(targetAssets)
        return
      }

      // Cmd/Ctrl+O - Open in editor
      if (modKey && e.key === 'o') {
        e.preventDefault()
        if (targetAssets.length === 1) {
          onOpenInEditor(targetAssets[0])
        }
        return
      }

      // Cmd/Ctrl+Shift+R - Reveal in Finder/Explorer
      if (modKey && e.shiftKey && e.key === 'r') {
        e.preventDefault()
        if (targetAssets.length === 1) {
          onRevealInFinder(targetAssets[0])
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    flatAssetList,
    focusedAssetId,
    setFocusedAssetId,
    isGridFocused,
    setIsGridFocused,
    selectedAssets,
    toggleSelection,
    selectAll,
    clearSelection,
    previewAsset,
    setPreviewAsset,
    searchInputRef,
    onCopyPaths,
    onDelete,
    onOpenInEditor,
    onRevealInFinder
  ])
}
