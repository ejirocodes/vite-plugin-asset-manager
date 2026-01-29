import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  '2xl': 1536,
  xl: 1280,
  lg: 1024,
  md: 768,
  sm: 640
} as const

function getColumns(width: number): number {
  if (width >= BREAKPOINTS['2xl']) return 6
  if (width >= BREAKPOINTS.xl) return 5
  if (width >= BREAKPOINTS.lg) return 4
  if (width >= BREAKPOINTS.md) return 3
  if (width >= BREAKPOINTS.sm) return 2
  return 1
}

export function useResponsiveColumns(): number {
  const [columns, setColumns] = useState(() =>
    getColumns(typeof window !== 'undefined' ? window.innerWidth : 1024)
  )

  useEffect(() => {
    const handleResize = () => setColumns(getColumns(window.innerWidth))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return columns
}
