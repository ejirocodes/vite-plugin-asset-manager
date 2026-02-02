import { DIMENSIONS, ELEMENT_IDS, RESIZE, type Edge, type Position, type Size } from './constants'
import { ASSET_MANAGER_ICON } from './icons'
import type { ResizeDirection } from './state'

export interface FloatingIconElements {
  container: HTMLDivElement
  trigger: HTMLButtonElement
  overlay: HTMLDivElement
  panel: HTMLDivElement
  iframe: HTMLIFrameElement
}

export interface ResizeHandle {
  element: HTMLDivElement
  direction: ResizeDirection
}

function createContainer(): HTMLDivElement {
  const container = document.createElement('div')
  container.id = ELEMENT_IDS.CONTAINER
  return container
}

function createTrigger(): HTMLButtonElement {
  const trigger = document.createElement('button')
  trigger.id = ELEMENT_IDS.TRIGGER
  trigger.innerHTML = ASSET_MANAGER_ICON
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

function createResizeHandle(direction: ResizeDirection, position: string): ResizeHandle {
  const element = document.createElement('div')
  element.className = 'vam-resize-handle'
  element.dataset.direction = direction
  element.dataset.position = position
  return { element, direction }
}

export function createResizeHandles(panel: HTMLDivElement, edge: Edge): ResizeHandle[] {
  // Remove existing handles
  panel.querySelectorAll('.vam-resize-handle').forEach(el => el.remove())

  const handles: ResizeHandle[] = []

  // Create handles based on which edge the trigger is on
  // Width handle is on the opposite side of the trigger
  // Height handle is on bottom (or top if trigger is at bottom)
  if (edge === 'left') {
    // Width handle on right, height handle on bottom, corner at bottom-right
    handles.push(createResizeHandle('horizontal', 'right'))
    handles.push(createResizeHandle('vertical', 'bottom'))
    handles.push(createResizeHandle('both', 'bottom-right'))
  } else if (edge === 'right') {
    // Width handle on left, height handle on bottom, corner at bottom-left
    handles.push(createResizeHandle('horizontal', 'left'))
    handles.push(createResizeHandle('vertical', 'bottom'))
    handles.push(createResizeHandle('both', 'bottom-left'))
  } else if (edge === 'top') {
    // Width handle on right, height handle on bottom, corner at bottom-right
    handles.push(createResizeHandle('horizontal', 'right'))
    handles.push(createResizeHandle('vertical', 'bottom'))
    handles.push(createResizeHandle('both', 'bottom-right'))
  } else {
    // edge === 'bottom'
    // Width handle on right, height handle on top, corner at top-right
    handles.push(createResizeHandle('horizontal', 'right'))
    handles.push(createResizeHandle('vertical', 'top'))
    handles.push(createResizeHandle('both', 'top-right'))
  }

  // Append handles to panel
  handles.forEach(h => panel.appendChild(h.element))

  return handles
}

export function getResizeHandles(panel: HTMLDivElement): ResizeHandle[] {
  const handles: ResizeHandle[] = []
  panel.querySelectorAll('.vam-resize-handle').forEach(el => {
    const element = el as HTMLDivElement
    const direction = element.dataset.direction as ResizeDirection
    if (direction) {
      handles.push({ element, direction })
    }
  })
  return handles
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

export function getDefaultPanelSize(): Size {
  return {
    width: Math.min(
      window.innerWidth * (DIMENSIONS.PANEL_WIDTH_PERCENT / 100),
      DIMENSIONS.PANEL_MAX_WIDTH
    ),
    height: Math.min(
      window.innerHeight * (DIMENSIONS.PANEL_HEIGHT_PERCENT / 100),
      DIMENSIONS.PANEL_MAX_HEIGHT,
      window.innerHeight - 40
    )
  }
}

export function constrainSize(size: Size): Size {
  const maxWidth = Math.min(
    DIMENSIONS.PANEL_MAX_WIDTH,
    window.innerWidth - DIMENSIONS.VIEWPORT_MARGIN * 2
  )
  const maxHeight = Math.min(
    window.innerHeight - 40,
    window.innerHeight - DIMENSIONS.VIEWPORT_MARGIN * 2
  )

  return {
    width: Math.max(RESIZE.MIN_WIDTH, Math.min(size.width, maxWidth)),
    height: Math.max(RESIZE.MIN_HEIGHT, Math.min(size.height, maxHeight))
  }
}

export function updatePanelState(
  elements: FloatingIconElements,
  isOpen: boolean,
  edge: Edge,
  customSize?: Size | null
): void {
  document.body.style.overflow = isOpen ? 'hidden' : ''

  elements.overlay.dataset.open = String(isOpen)
  elements.panel.dataset.open = String(isOpen)
  elements.panel.dataset.edge = edge
  elements.trigger.dataset.active = String(isOpen)

  if (isOpen) {
    const containerRect = elements.container.getBoundingClientRect()
    const margin = DIMENSIONS.VIEWPORT_MARGIN
    const overlap = 8

    // Use custom size if provided, otherwise use responsive defaults
    const size = customSize ? constrainSize(customSize) : getDefaultPanelSize()
    const panelWidth = size.width
    const panelHeight = size.height

    // Apply size to panel
    elements.panel.style.width = `${panelWidth}px`
    elements.panel.style.height = `${panelHeight}px`

    let panelLeft: number
    let panelTop: number

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
      panelLeft = containerRect.left - overlap
      panelTop = containerRect.top - panelHeight + overlap
    }

    panelLeft = Math.max(margin, Math.min(panelLeft, window.innerWidth - panelWidth - margin))
    panelTop = Math.max(margin, Math.min(panelTop, window.innerHeight - panelHeight - margin))

    elements.panel.style.left = `${panelLeft}px`
    elements.panel.style.top = `${panelTop}px`
    elements.panel.style.right = 'auto'
    elements.panel.style.bottom = 'auto'
  }
}

export function updatePanelSize(panel: HTMLDivElement, size: Size): void {
  const constrained = constrainSize(size)
  panel.style.width = `${constrained.width}px`
  panel.style.height = `${constrained.height}px`
}

export function getCurrentPanelSize(panel: HTMLDivElement): Size {
  const rect = panel.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
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
