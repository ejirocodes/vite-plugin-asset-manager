import { useState, useCallback, useMemo } from 'react'
import type { SizeFilter, DateFilter, ExtensionFilter } from '@/shared/types'

const SIZE_BOUNDS: Record<string, { min?: number; max?: number }> = {
  small: { max: 100 * 1024 },
  medium: { min: 100 * 1024, max: 1024 * 1024 },
  large: { min: 1024 * 1024, max: 10 * 1024 * 1024 },
  xlarge: { min: 10 * 1024 * 1024 }
}

function getDateBounds(preset: string): { start?: number; end?: number } {
  const now = Date.now()
  const day = 86400000
  const presets: Record<string, { start?: number }> = {
    today: { start: now - day },
    last7days: { start: now - 7 * day },
    last30days: { start: now - 30 * day },
    last90days: { start: now - 90 * day },
    thisYear: { start: new Date(new Date().getFullYear(), 0, 1).getTime() }
  }
  return presets[preset] || {}
}

export function useAdvancedFilters() {
  const [sizeFilter, setSizeFilter] = useState<SizeFilter | undefined>()
  const [dateFilter, setDateFilter] = useState<DateFilter | undefined>()
  const [extensionFilter, setExtensionFilter] = useState<ExtensionFilter | undefined>()

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (sizeFilter && sizeFilter.preset !== 'any') count++
    if (dateFilter && dateFilter.preset !== 'any') count++
    if (extensionFilter?.extensions.length) count++
    return count
  }, [sizeFilter, dateFilter, extensionFilter])

  const clearAll = useCallback(() => {
    setSizeFilter(undefined)
    setDateFilter(undefined)
    setExtensionFilter(undefined)
  }, [])

  const filterParamsString = useMemo(() => {
    const params = new URLSearchParams()
    if (sizeFilter && sizeFilter.preset !== 'any') {
      const bounds = SIZE_BOUNDS[sizeFilter.preset] || {}
      if (bounds.min) params.append('minSize', String(bounds.min))
      if (bounds.max) params.append('maxSize', String(bounds.max))
    }
    if (dateFilter && dateFilter.preset !== 'any') {
      const bounds = getDateBounds(dateFilter.preset)
      if (bounds.start) params.append('minDate', String(bounds.start))
      if (bounds.end) params.append('maxDate', String(bounds.end))
    }
    if (extensionFilter?.extensions.length) {
      params.append('extensions', extensionFilter.extensions.join(','))
    }
    return params.toString()
  }, [sizeFilter, dateFilter, extensionFilter])

  return {
    sizeFilter,
    setSizeFilter,
    dateFilter,
    setDateFilter,
    extensionFilter,
    setExtensionFilter,
    activeFilterCount,
    clearAll,
    filterParamsString
  }
}
