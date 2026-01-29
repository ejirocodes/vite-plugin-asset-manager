/**
 * Floating Icon Component Entry Point
 *
 * A framework-agnostic floating button that opens the Asset Manager panel.
 * Inspired by Vue DevTools architecture with composable-style state management.
 */

import { applyPosition, createElements, mountElements, unmountElements, updatePanelState } from './dom'
import { setupAllHandlers, type CleanupFn } from './events'
import { createPanelState, createPositionState } from './state'
import { injectStyles, removeStyles } from './styles'

export interface FloatingIconOptions {
  baseUrl: string
}

export interface FloatingIconInstance {
  destroy: () => void
}

/**
 * Initialize the floating icon component
 */
export function initFloatingIcon(options: FloatingIconOptions): FloatingIconInstance {
  const { baseUrl } = options

  // Inject styles
  injectStyles()

  // Create state managers
  const positionState = createPositionState()
  const panelState = createPanelState()

  // Create DOM elements
  const elements = createElements(baseUrl)

  // Apply initial position
  applyPosition(elements.container, positionState.get())

  // Mount to DOM
  mountElements(elements)

  // Setup event handlers
  const cleanup: CleanupFn = setupAllHandlers({
    elements,
    positionState,
    panelState
  })

  // Restore panel state if it was open
  if (panelState.isOpen()) {
    requestAnimationFrame(() => {
      updatePanelState(elements, true, positionState.get().edge)
    })
  }

  return {
    destroy: () => {
      cleanup()
      unmountElements(elements)
      removeStyles()
    }
  }
}

// Auto-initialize when loaded as a script
// The BASE_URL is set as a global variable by the plugin before this script loads
declare global {
  interface Window {
    __VAM_BASE_URL__?: string
  }
}

if (typeof window !== 'undefined' && window.__VAM_BASE_URL__) {
  initFloatingIcon({ baseUrl: window.__VAM_BASE_URL__ })
}

export { type Position } from './constants'
export { type PanelState, type PositionState } from './state'
