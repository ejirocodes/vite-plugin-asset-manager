import { ELEMENT_IDS, type Position } from './constants'
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
    const overlap = 8

    if (edge === 'left') {
      elements.panel.style.left = `${containerRect.right - overlap}px`
      elements.panel.style.top = `${containerRect.top - overlap}px`
      elements.panel.style.right = 'auto'
      elements.panel.style.bottom = 'auto'
    } else if (edge === 'right') {
      elements.panel.style.right = `${window.innerWidth - containerRect.left - overlap}px`
      elements.panel.style.top = `${containerRect.top - overlap}px`
      elements.panel.style.left = 'auto'
      elements.panel.style.bottom = 'auto'
    } else if (edge === 'top') {
      elements.panel.style.top = `${containerRect.bottom - overlap}px`
      elements.panel.style.left = `${containerRect.left - overlap}px`
      elements.panel.style.right = 'auto'
      elements.panel.style.bottom = 'auto'
    } else {
      elements.panel.style.bottom = `${window.innerHeight - containerRect.top - overlap}px`
      elements.panel.style.left = `${containerRect.left - overlap}px`
      elements.panel.style.right = 'auto'
      elements.panel.style.top = 'auto'
    }
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
