export const STORAGE_KEYS = {
  POSITION: 'vite-asset-manager-position',
  OPEN: 'vite-asset-manager-open'
} as const

export const Z_INDEX = {
  CONTAINER: 99998,
  OVERLAY: 99999,
  PANEL: 100000
} as const

export const CSS_VARS = {
  BG: 'rgba(15, 15, 17, 0.95)',
  BORDER: 'rgba(255, 255, 255, 0.08)',
  HOVER: 'rgba(255, 255, 255, 0.1)',
  TRANSITION: '0.3s cubic-bezier(0.32, 0.72, 0, 1)',
  SHADOW: '0 8px 32px rgba(0, 0, 0, 0.4)',
  SHADOW_DRAGGING: '0 12px 48px rgba(0, 0, 0, 0.5)',
  PANEL_BG: '#09090b'
} as const

export const DIMENSIONS = {
  TRIGGER_HEIGHT: 36,
  PANEL_MAX_WIDTH: 1200,
  PANEL_WIDTH_PERCENT: 90,
  CONTAINER_PADDING: 8,
  BORDER_RADIUS: 14,
  TRIGGER_BORDER_RADIUS: 10,
  BACKDROP_BLUR: 12,
  OVERLAY_BLUR: 4
} as const

export const DRAG = {
  MOVEMENT_THRESHOLD: 5,
  MIN_OFFSET: 10,
  MAX_OFFSET: 90
} as const

export const ELEMENT_IDS = {
  CONTAINER: 'vam-container',
  TRIGGER: 'vam-trigger',
  OVERLAY: 'vam-overlay',
  PANEL: 'vam-panel',
  IFRAME: 'vam-iframe'
} as const

export type Edge = 'top' | 'bottom' | 'left' | 'right'

export interface Position {
  edge: Edge
  offset: number
}

export const DEFAULT_POSITION: Position = {
  edge: 'left',
  offset: 50
}
