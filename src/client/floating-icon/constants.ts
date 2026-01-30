export const STORAGE_KEYS = {
  POSITION: 'vite-asset-manager-position',
  OPEN: 'vite-asset-manager-open',
  SIZE: 'vite-asset-manager-size'
} as const

export const Z_INDEX = {
  OVERLAY: 99998,
  CONTAINER: 99999,
  PANEL: 100000
} as const

export const CSS_TRANSITIONS = {
  DEFAULT: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  SPRING: '0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
} as const

export const DARK_COLORS = {
  BG: 'rgba(10, 10, 12, 0.92)',
  BORDER: 'rgba(255, 255, 255, 0.06)',
  BORDER_HOVER: 'rgba(255, 255, 255, 0.12)',
  HOVER: 'rgba(255, 255, 255, 0.08)',
  SHADOW: '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
  SHADOW_HOVER: '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2)',
  SHADOW_DRAGGING: '0 12px 32px rgba(0, 0, 0, 0.5)',
  GLOW_ACTIVE: '0 0 20px rgba(65, 209, 255, 0.3), 0 0 40px rgba(189, 52, 254, 0.2)',
  TRIGGER_ACTIVE_BG: 'rgba(65, 209, 255, 0.12)',
  OVERLAY_BG: 'rgba(0, 0, 0, 0.5)',
  PANEL_BG: '#09090b',
  ICON_COLOR: '#ffffff'
} as const

export const LIGHT_COLORS = {
  BG: 'rgba(255, 255, 255, 0.95)',
  BORDER: 'rgba(0, 0, 0, 0.08)',
  BORDER_HOVER: 'rgba(0, 0, 0, 0.15)',
  HOVER: 'rgba(0, 0, 0, 0.05)',
  SHADOW: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
  SHADOW_HOVER: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
  SHADOW_DRAGGING: '0 12px 32px rgba(0, 0, 0, 0.15)',
  GLOW_ACTIVE: '0 0 20px rgba(65, 209, 255, 0.25), 0 0 40px rgba(189, 52, 254, 0.15)',
  TRIGGER_ACTIVE_BG: 'rgba(65, 209, 255, 0.15)',
  OVERLAY_BG: 'rgba(0, 0, 0, 0.3)',
  PANEL_BG: '#ffffff',
  ICON_COLOR: '#000000'
} as const

// Keep CSS_VARS for backward compatibility
export const CSS_VARS = {
  ...DARK_COLORS,
  TRANSITION: CSS_TRANSITIONS.DEFAULT,
  TRANSITION_SPRING: CSS_TRANSITIONS.SPRING
} as const

export const DIMENSIONS = {
  TRIGGER_SIZE: 28,
  ICON_SIZE: 16,
  PANEL_MAX_WIDTH: 1100,
  PANEL_MAX_HEIGHT: 600,
  PANEL_WIDTH_PERCENT: 85,
  PANEL_HEIGHT_PERCENT: 70,
  CONTAINER_PADDING: 5,
  BORDER_RADIUS: 10,
  TRIGGER_BORDER_RADIUS: 6,
  BACKDROP_BLUR: 8,
  OVERLAY_BLUR: 4,
  ICON_CONTAINER_WIDTH: 38,
  VIEWPORT_MARGIN: 20
} as const

export const DRAG = {
  MOVEMENT_THRESHOLD: 5,
  MIN_OFFSET: 10,
  MAX_OFFSET: 90
} as const

export const RESIZE = {
  MIN_WIDTH: 400,
  MIN_HEIGHT: 300,
  HANDLE_SIZE: 8,
  HANDLE_HIT_AREA: 16
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

export interface Size {
  width: number
  height: number
}

export const DEFAULT_POSITION: Position = {
  edge: 'left',
  offset: 50
}
