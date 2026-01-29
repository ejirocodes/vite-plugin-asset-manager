/**
 * State management for the floating icon component
 * Uses a composable-style pattern similar to Vue DevTools
 */

import { DEFAULT_POSITION, DRAG, STORAGE_KEYS, type Edge, type Position } from './constants'

/**
 * Load position from localStorage
 */
function loadPosition(): Position {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POSITION)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (
        parsed &&
        (parsed.edge === 'left' || parsed.edge === 'right') &&
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

/**
 * Save position to localStorage
 */
function savePosition(position: Position): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(position))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Load open state from localStorage
 */
function loadOpenState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.OPEN) === 'true'
  } catch {
    return false
  }
}

/**
 * Save open state to localStorage
 */
function saveOpenState(isOpen: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPEN, String(isOpen))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Calculate which edge to snap to based on pointer position
 */
export function snapToEdge(x: number, y: number): Position {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const edge: Edge = x < vw / 2 ? 'left' : 'right'
  const offset = Math.max(DRAG.MIN_OFFSET, Math.min(DRAG.MAX_OFFSET, (y / vh) * 100))
  return { edge, offset }
}

export interface PositionState {
  get: () => Position
  set: (position: Position) => void
  save: () => void
}

/**
 * Create a position state manager (composable-style)
 */
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

/**
 * Create a panel state manager (composable-style)
 */
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

/**
 * Create a drag state manager (composable-style)
 */
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
