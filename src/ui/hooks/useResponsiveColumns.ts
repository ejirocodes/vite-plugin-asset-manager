import { useState, useEffect, RefObject } from 'react'

const MIN_CARD_WIDTH = 180
const GAP = 24

function getColumns(containerWidth: number): number {
  if (containerWidth <= 0) return 1
  const availableWidth = containerWidth - 48 // account for px-6 padding (24px each side)
  const cols = Math.floor((availableWidth + GAP) / (MIN_CARD_WIDTH + GAP))
  return Math.max(1, cols)
}

export function useResponsiveColumns(containerRef?: RefObject<HTMLElement | null>): number {
  const [columns, setColumns] = useState(() => {
    if (typeof window === 'undefined') return 3
    return getColumns(window.innerWidth)
  })

  useEffect(() => {
    const container = containerRef?.current

    const updateColumns = () => {
      if (container) {
        setColumns(getColumns(container.clientWidth))
      } else {
        setColumns(getColumns(window.innerWidth))
      }
    }

    updateColumns()

    if (container && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateColumns)
      resizeObserver.observe(container)
      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', updateColumns)
      return () => window.removeEventListener('resize', updateColumns)
    }
  }, [containerRef])

  return columns
}
