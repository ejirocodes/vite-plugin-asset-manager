import { DEFAULT_POSITION, DRAG, STORAGE_KEYS, type Edge, type Position, type Size } from './constants'

function loadPosition(): Position {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POSITION)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (
        parsed &&
        (parsed.edge === 'left' ||
          parsed.edge === 'right' ||
          parsed.edge === 'top' ||
          parsed.edge === 'bottom') &&
        typeof parsed.offset === 'number'
      ) {
        return parsed as Position
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return { ...DEFAULT_POSITION }
}

function savePosition(position: Position): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(position))
  } catch {
    // Ignore localStorage errors
  }
}

function loadOpenState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.OPEN) === 'true'
  } catch {
    return false
  }
}

function saveOpenState(isOpen: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPEN, String(isOpen))
  } catch {
    // Ignore localStorage errors
  }
}

function loadSize(): Size | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIZE)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        return parsed as Size
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null
}

function saveSize(size: Size | null): void {
  try {
    if (size === null) {
      localStorage.removeItem(STORAGE_KEYS.SIZE)
    } else {
      localStorage.setItem(STORAGE_KEYS.SIZE, JSON.stringify(size))
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function snapToEdge(x: number, y: number): Position {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const distances: Record<Edge, number> = {
    left: x,
    right: vw - x,
    top: y,
    bottom: vh - y
  }

  const entries = Object.entries(distances) as [Edge, number][]
  const [edge] = entries.reduce((a, b) => (b[1] < a[1] ? b : a))

  // For left/right: vertical offset, for top/bottom: horizontal offset
  const offset = edge === 'left' || edge === 'right' ? (y / vh) * 100 : (x / vw) * 100

  return { edge, offset: Math.max(DRAG.MIN_OFFSET, Math.min(DRAG.MAX_OFFSET, offset)) }
}

export interface PositionState {
  get: () => Position
  set: (position: Position) => void
  save: () => void
}

export function createPositionState(): PositionState {
  let position = loadPosition()

  return {
    get: () => position,
    set: (newPosition: Position) => {
      position = newPosition
    },
    save: () => {
      savePosition(position)
    }
  }
}

export interface PanelState {
  isOpen: () => boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export function createPanelState(): PanelState {
  let isOpen = loadOpenState()

  return {
    isOpen: () => isOpen,
    open: () => {
      isOpen = true
      saveOpenState(true)
    },
    close: () => {
      isOpen = false
      saveOpenState(false)
    },
    toggle: () => {
      isOpen = !isOpen
      saveOpenState(isOpen)
    }
  }
}

export interface DragState {
  isDragging: () => boolean
  hasMoved: () => boolean
  startPos: () => { x: number; y: number }
  start: (x: number, y: number) => void
  move: () => void
  end: () => void
  checkThreshold: (x: number, y: number) => boolean
}

export function createDragState(): DragState {
  let isDragging = false
  let hasMoved = false
  let startPos = { x: 0, y: 0 }

  return {
    isDragging: () => isDragging,
    hasMoved: () => hasMoved,
    startPos: () => startPos,
    start: (x: number, y: number) => {
      isDragging = true
      hasMoved = false
      startPos = { x, y }
    },
    move: () => {
      hasMoved = true
    },
    end: () => {
      isDragging = false
    },
    checkThreshold: (x: number, y: number) => {
      if (hasMoved) return true
      const dx = x - startPos.x
      const dy = y - startPos.y
      if (Math.abs(dx) > DRAG.MOVEMENT_THRESHOLD || Math.abs(dy) > DRAG.MOVEMENT_THRESHOLD) {
        hasMoved = true
        return true
      }
      return false
    }
  }
}

export interface SizeState {
  get: () => Size | null
  set: (size: Size | null) => void
  save: () => void
  resetToDefault: () => void
}

export function createSizeState(): SizeState {
  let size = loadSize()

  return {
    get: () => size,
    set: (newSize: Size | null) => {
      size = newSize
    },
    save: () => {
      saveSize(size)
    },
    resetToDefault: () => {
      size = null
      saveSize(null)
    }
  }
}

export type ResizeDirection = 'horizontal' | 'vertical' | 'both'

export interface ResizeState {
  isResizing: () => boolean
  direction: () => ResizeDirection | null
  startPos: () => { x: number; y: number }
  startSize: () => Size
  start: (x: number, y: number, dir: ResizeDirection, currentSize: Size) => void
  end: () => void
}

export function createResizeState(): ResizeState {
  let isResizing = false
  let direction: ResizeDirection | null = null
  let startPos = { x: 0, y: 0 }
  let startSize: Size = { width: 0, height: 0 }

  return {
    isResizing: () => isResizing,
    direction: () => direction,
    startPos: () => startPos,
    startSize: () => startSize,
    start: (x: number, y: number, dir: ResizeDirection, currentSize: Size) => {
      isResizing = true
      direction = dir
      startPos = { x, y }
      startSize = { ...currentSize }
    },
    end: () => {
      isResizing = false
      direction = null
    }
  }
}
