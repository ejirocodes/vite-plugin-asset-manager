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

export function initFloatingIcon(options: FloatingIconOptions): FloatingIconInstance {
  const { baseUrl } = options

  injectStyles()

  const positionState = createPositionState()
  const panelState = createPanelState()
  const elements = createElements(baseUrl)

  applyPosition(elements.container, positionState.get())
  mountElements(elements)

  const cleanup: CleanupFn = setupAllHandlers({
    elements,
    positionState,
    panelState
  })

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
