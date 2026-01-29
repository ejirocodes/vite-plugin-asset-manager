import { DIMENSIONS, ELEMENT_IDS, type Position } from './constants'
import { VITE_ICON } from './icons'

export interface FloatingIconElements {
  container: HTMLDivElement
  trigger: HTMLButtonElement
  overlay: HTMLDivElement
  panel: HTMLDivElement
  iframe: HTMLIFrameElement
}

function createContainer(): HTMLDivElement {
  const container = document.createElement('div')
  container.id = ELEMENT_IDS.CONTAINER
  return container
}

function createTrigger(): HTMLButtonElement {
  const trigger = document.createElement('button')
  trigger.id = ELEMENT_IDS.TRIGGER
  trigger.innerHTML = VITE_ICON
  trigger.title = 'Asset Manager (\u2325\u21E7A)'
  return trigger
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div')
  overlay.id = ELEMENT_IDS.OVERLAY
  return overlay
}

function createPanel(): HTMLDivElement {
  const panel = document.createElement('div')
  panel.id = ELEMENT_IDS.PANEL
  return panel
}

function createIframe(baseUrl: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  iframe.id = ELEMENT_IDS.IFRAME
  const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  iframe.src = window.location.origin + baseWithSlash + '?embedded=true'
  return iframe
}

export function createElements(baseUrl: string): FloatingIconElements {
  const container = createContainer()
  const trigger = createTrigger()
  const overlay = createOverlay()
  const panel = createPanel()
  const iframe = createIframe(baseUrl)

  panel.appendChild(iframe)
  overlay.appendChild(panel)
  container.appendChild(trigger)

  return { container, trigger, overlay, panel, iframe }
}

export function mountElements(elements: FloatingIconElements): void {
  document.body.append(elements.container, elements.overlay)
}

export function unmountElements(elements: FloatingIconElements): void {
  elements.container.remove()
  elements.overlay.remove()
}

export function applyPosition(container: HTMLDivElement, position: Position): void {
  const { edge, offset } = position
  container.dataset.edge = edge

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

export function updatePanelState(
  elements: FloatingIconElements,
  isOpen: boolean,
  edge: 'top' | 'bottom' | 'left' | 'right'
): void {
  elements.overlay.dataset.open = String(isOpen)
  elements.panel.dataset.open = String(isOpen)
  elements.panel.dataset.edge = edge
  elements.trigger.dataset.active = String(isOpen)

  if (isOpen) {
    const containerRect = elements.container.getBoundingClientRect()
    const margin = DIMENSIONS.VIEWPORT_MARGIN
    const overlap = 8

    // Calculate actual panel dimensions (matching CSS min() logic)
    const panelWidth = Math.min(
      window.innerWidth * (DIMENSIONS.PANEL_WIDTH_PERCENT / 100),
      DIMENSIONS.PANEL_MAX_WIDTH
    )
    const panelHeight = Math.min(
      window.innerHeight * (DIMENSIONS.PANEL_HEIGHT_PERCENT / 100),
      DIMENSIONS.PANEL_MAX_HEIGHT,
      window.innerHeight - 40
    )

    let panelLeft: number
    let panelTop: number

    // Calculate ideal position based on edge
    if (edge === 'left') {
      panelLeft = containerRect.right - overlap
      panelTop = containerRect.top - overlap
    } else if (edge === 'right') {
      panelLeft = containerRect.left - panelWidth + overlap
      panelTop = containerRect.top - overlap
    } else if (edge === 'top') {
      panelLeft = containerRect.left - overlap
      panelTop = containerRect.bottom - overlap
    } else {
      // bottom
      panelLeft = containerRect.left - overlap
      panelTop = containerRect.top - panelHeight + overlap
    }

    // Clamp to viewport bounds with margin
    panelLeft = Math.max(margin, Math.min(panelLeft, window.innerWidth - panelWidth - margin))
    panelTop = Math.max(margin, Math.min(panelTop, window.innerHeight - panelHeight - margin))

    // Apply position using left/top exclusively for predictable behavior
    elements.panel.style.left = `${panelLeft}px`
    elements.panel.style.top = `${panelTop}px`
    elements.panel.style.right = 'auto'
    elements.panel.style.bottom = 'auto'
  }
}

export function setDragging(container: HTMLDivElement, isDragging: boolean): void {
  container.dataset.dragging = String(isDragging)
  if (isDragging) {
    container.style.transition = 'none'
  } else {
    container.style.transition = ''
  }
}

export function updateDragPosition(container: HTMLDivElement, y: number, x: number): void {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const distLeft = x
  const distRight = vw - x
  const distTop = y
  const distBottom = vh - y
  const minDist = Math.min(distLeft, distRight, distTop, distBottom)

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
