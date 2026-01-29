/**
 * DOM element creation and manipulation for the floating icon component
 */

import { ELEMENT_IDS, type Position } from './constants'
import { VITE_ICON } from './icons'

export interface FloatingIconElements {
  container: HTMLDivElement
  trigger: HTMLButtonElement
  overlay: HTMLDivElement
  panel: HTMLDivElement
  iframe: HTMLIFrameElement
}

/**
 * Create the container element (floating button wrapper)
 */
export function createContainer(): HTMLDivElement {
  const container = document.createElement('div')
  container.id = ELEMENT_IDS.CONTAINER
  return container
}

/**
 * Create the trigger button element
 */
export function createTrigger(): HTMLButtonElement {
  const trigger = document.createElement('button')
  trigger.id = ELEMENT_IDS.TRIGGER
  trigger.innerHTML = VITE_ICON
  trigger.title = 'Asset Manager (\u2325\u21E7A)'
  return trigger
}

/**
 * Create the overlay element (backdrop)
 */
export function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div')
  overlay.id = ELEMENT_IDS.OVERLAY
  return overlay
}

/**
 * Create the panel element (slide-in container)
 */
export function createPanel(): HTMLDivElement {
  const panel = document.createElement('div')
  panel.id = ELEMENT_IDS.PANEL
  return panel
}

/**
 * Create the iframe element for the dashboard
 */
export function createIframe(baseUrl: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.id = ELEMENT_IDS.IFRAME
  const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  iframe.src = window.location.origin + baseWithSlash + '?embedded=true'
  return iframe
}

/**
 * Create all floating icon DOM elements
 */
export function createElements(baseUrl: string): FloatingIconElements {
  const container = createContainer()
  const trigger = createTrigger()
  const overlay = createOverlay()
  const panel = createPanel()
  const iframe = createIframe(baseUrl)

  // Build DOM hierarchy
  panel.appendChild(iframe)
  overlay.appendChild(panel)
  container.appendChild(trigger)

  return { container, trigger, overlay, panel, iframe }
}

/**
 * Mount elements to the document body
 */
export function mountElements(elements: FloatingIconElements): void {
  document.body.append(elements.container, elements.overlay)
}

/**
 * Unmount elements from the document
 */
export function unmountElements(elements: FloatingIconElements): void {
  elements.container.remove()
  elements.overlay.remove()
}

/**
 * Apply position to container element
 * Supports all 4 edges: top, bottom, left, right
 */
export function applyPosition(container: HTMLDivElement, position: Position): void {
  const { edge, offset } = position
  container.dataset.edge = edge

  // Reset all positioning
  container.style.top = 'auto'
  container.style.bottom = 'auto'
  container.style.left = 'auto'
  container.style.right = 'auto'

  switch (edge) {
    case 'left':
      container.style.left = '0'
      container.style.top = `${offset}%`
      container.style.transform = 'translateY(-50%)'
      break
    case 'right':
      container.style.right = '0'
      container.style.top = `${offset}%`
      container.style.transform = 'translateY(-50%)'
      break
    case 'top':
      container.style.top = '0'
      container.style.left = `${offset}%`
      container.style.transform = 'translateX(-50%)'
      break
    case 'bottom':
      container.style.bottom = '0'
      container.style.left = `${offset}%`
      container.style.transform = 'translateX(-50%)'
      break
  }
}

/**
 * Update panel open state
 */
export function updatePanelState(
  elements: FloatingIconElements,
  isOpen: boolean,
  edge: 'top' | 'bottom' | 'left' | 'right'
): void {
  elements.overlay.dataset.open = String(isOpen)
  elements.panel.dataset.open = String(isOpen)
  elements.panel.dataset.edge = edge
  elements.trigger.dataset.active = String(isOpen)
}

/**
 * Set dragging state on container
 */
export function setDragging(container: HTMLDivElement, isDragging: boolean): void {
  container.dataset.dragging = String(isDragging)
  if (isDragging) {
    container.style.transition = 'none'
  } else {
    container.style.transition = ''
  }
}

/**
 * Update container position during drag
 * Shows real-time snapping feedback to nearest of all 4 edges
 */
export function updateDragPosition(container: HTMLDivElement, y: number, x: number): void {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Calculate distances to find nearest edge
  const distLeft = x
  const distRight = vw - x
  const distTop = y
  const distBottom = vh - y
  const minDist = Math.min(distLeft, distRight, distTop, distBottom)

  // Reset all positioning
  container.style.top = 'auto'
  container.style.bottom = 'auto'
  container.style.left = 'auto'
  container.style.right = 'auto'

  if (minDist === distLeft) {
    container.style.left = '0'
    container.style.top = y + 'px'
    container.style.transform = 'translateY(-50%)'
    container.dataset.edge = 'left'
  } else if (minDist === distRight) {
    container.style.right = '0'
    container.style.top = y + 'px'
    container.style.transform = 'translateY(-50%)'
    container.dataset.edge = 'right'
  } else if (minDist === distTop) {
    container.style.top = '0'
    container.style.left = x + 'px'
    container.style.transform = 'translateX(-50%)'
    container.dataset.edge = 'top'
  } else {
    container.style.bottom = '0'
    container.style.left = x + 'px'
    container.style.transform = 'translateX(-50%)'
    container.dataset.edge = 'bottom'
  }
}
