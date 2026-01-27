import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useImporters } from './useImporters'

vi.mock('./useSSE', () => ({
  useSSE: () => ({
    subscribe: vi.fn().mockReturnValue(() => {})
  })
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}))

import { toast } from 'sonner'

describe('useImporters', () => {
  const mockImporters = [
    {
      filePath: 'src/App.tsx',
      absolutePath: '/project/src/App.tsx',
      line: 5,
      column: 1,
      importType: 'es-import',
      snippet: "import logo from './assets/logo.png'"
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        importers: mockImporters,
        total: 1
      })
    })
  })

  it('should fetch importers on mount', async () => {
    const { result } = renderHook(() => useImporters('src/assets/logo.png'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledWith(
      '/__asset_manager__/api/importers?path=src%2Fassets%2Flogo.png'
    )
    expect(result.current.importers).toHaveLength(1)
  })

  it('should handle empty asset path', async () => {
    const { result } = renderHook(() => useImporters(''))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.importers).toEqual([])
  })

  it('should handle fetch errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useImporters('src/logo.png'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch importers')
  })

  it('should handle network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useImporters('src/logo.png'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should refetch when asset path changes', async () => {
    const { result, rerender } = renderHook(({ assetPath }) => useImporters(assetPath), {
      initialProps: { assetPath: 'src/logo.png' }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    rerender({ assetPath: 'src/icon.svg' })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    expect(fetch).toHaveBeenLastCalledWith('/__asset_manager__/api/importers?path=src%2Ficon.svg')
  })

  describe('openInEditor', () => {
    it('should open file in editor', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ importers: mockImporters, total: 1 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })

      const { result } = renderHook(() => useImporters('src/logo.png'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.openInEditor(mockImporters[0])
      })

      expect(fetch).toHaveBeenLastCalledWith(
        '/__asset_manager__/api/open-in-editor?file=src%2FApp.tsx&line=5&column=1',
        { method: 'POST' }
      )
    })

    it('should show toast on editor error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ importers: mockImporters, total: 1 })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Editor not found' })
        })

      const { result } = renderHook(() => useImporters('src/logo.png'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.openInEditor(mockImporters[0])
      })

      expect(toast.error).toHaveBeenCalledWith('Editor not found')
    })

    it('should show toast on network error', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ importers: mockImporters, total: 1 })
        })
        .mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useImporters('src/logo.png'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.openInEditor(mockImporters[0])
      })

      expect(toast.error).toHaveBeenCalledWith('Network error')
    })
  })

  it('should return correct initial state', () => {
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useImporters('src/logo.png'))

    expect(result.current.importers).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.openInEditor).toBeInstanceOf(Function)
  })
})
