export const STORAGE_KEYS = {
  POSITION: 'vite-asset-manager-position',
  OPEN: 'vite-asset-manager-open'
} as const

export const Z_INDEX = {
  OVERLAY: 99998,
  CONTAINER: 99999,
  PANEL: 100000
} as const

export const CSS_VARS = {
  BG: 'rgba(10, 10, 12, 0.92)',
  BORDER: 'rgba(255, 255, 255, 0.06)',
  BORDER_HOVER: 'rgba(255, 255, 255, 0.12)',
  HOVER: 'rgba(255, 255, 255, 0.08)',
  TRANSITION: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  TRANSITION_SPRING: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  SHADOW: '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
  SHADOW_HOVER: '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2)',
  SHADOW_DRAGGING: '0 12px 32px rgba(0, 0, 0, 0.5)',
  GLOW_ACTIVE: '0 0 20px rgba(65, 209, 255, 0.3), 0 0 40px rgba(189, 52, 254, 0.2)',
  PANEL_BG: '#09090b'
} as const

export const DIMENSIONS = {
  TRIGGER_SIZE: 28,
  ICON_SIZE: 16,
  PANEL_MAX_WIDTH: 1200,
  PANEL_WIDTH_PERCENT: 90,
  CONTAINER_PADDING: 5,
  BORDER_RADIUS: 10,
  TRIGGER_BORDER_RADIUS: 6,
  BACKDROP_BLUR: 8,
  OVERLAY_BLUR: 4,
  ICON_CONTAINER_WIDTH: 38
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
