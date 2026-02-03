import {
  applyPosition,
  constrainSize,
  createResizeHandles,
  getCurrentPanelSize,
  setDragging,
  updateDragPosition,
  updatePanelSize,
  updatePanelState,
  type FloatingIconElements,
  type ResizeHandle
} from './dom'
import {
  createDragState,
  createResizeState,
  snapToEdge,
  type DragState,
  type PanelState,
  type PositionState,
  type SizeState
} from './state'
export interface EventHandlerContext {
  elements: FloatingIconElements
  positionState: PositionState
  panelState: PanelState
  sizeState: SizeState
}

export type CleanupFn = () => void

export function setupDragHandlers(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState, sizeState } = context
  const dragState: DragState = createDragState()

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    dragState.start(e.clientX, e.clientY)
    setDragging(elements.container, true)
    e.preventDefault()
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragState.isDragging()) return
    if (!dragState.checkThreshold(e.clientX, e.clientY)) return
    updateDragPosition(elements.container, e.clientY, e.clientX)
  }

  const onPointerUp = (e: PointerEvent) => {
    if (!dragState.isDragging()) return

    const wasDragged = dragState.hasMoved()
    dragState.end()
    setDragging(elements.container, false)

    if (wasDragged) {
      const newPosition = snapToEdge(e.clientX, e.clientY)
      positionState.set(newPosition)
      positionState.save()
      applyPosition(elements.container, newPosition)

      if (panelState.isOpen()) {
        updatePanelState(elements, true, newPosition.edge, sizeState.get())
      }
    }
  }

  elements.trigger.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)

  return () => {
    elements.trigger.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }
}

export function setupClickHandlers(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState, sizeState } = context
  const dragState: DragState = createDragState()

  const onPointerDown = (e: PointerEvent) => {
    dragState.start(e.clientX, e.clientY)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (dragState.isDragging()) {
      dragState.checkThreshold(e.clientX, e.clientY)
    }
  }

  const onPointerUp = () => {
    dragState.end()
  }

  const onTriggerClick = () => {
    if (dragState.hasMoved()) return
    panelState.toggle()
    updatePanelState(elements, panelState.isOpen(), positionState.get().edge, sizeState.get())
  }

  elements.trigger.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  elements.trigger.addEventListener('click', onTriggerClick)

  return () => {
    elements.trigger.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    elements.trigger.removeEventListener('click', onTriggerClick)
  }
}

export function setupKeyboardHandlers(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState, sizeState } = context

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && panelState.isOpen()) {
      panelState.close()
      updatePanelState(elements, false, positionState.get().edge, sizeState.get())
      return
    }

    // Option+Shift+A to toggle
    if (e.altKey && e.shiftKey && e.code === 'KeyA') {
      e.preventDefault()
      panelState.toggle()
      updatePanelState(elements, panelState.isOpen(), positionState.get().edge, sizeState.get())
    }
  }

  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

export function setupWindowResizeHandler(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState, sizeState } = context

  const onResize = () => {
    if (panelState.isOpen()) {
      updatePanelState(elements, true, positionState.get().edge, sizeState.get())
    }
  }

  window.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
  }
}

export function setupPanelResizeHandlers(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState, sizeState } = context
  const resizeState = createResizeState()
  let animationFrameId: number | null = null
  let currentHandles: ResizeHandle[] = []

  const onPointerDown = (e: PointerEvent, handle: ResizeHandle) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const currentSize = getCurrentPanelSize(elements.panel)
    resizeState.start(e.clientX, e.clientY, handle.direction, currentSize)
    elements.panel.dataset.resizing = 'true'
    elements.iframe.style.pointerEvents = 'none'
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!resizeState.isResizing()) return

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
    }

    animationFrameId = requestAnimationFrame(() => {
      const direction = resizeState.direction()
      const startPos = resizeState.startPos()
      const startSize = resizeState.startSize()
      const edge = positionState.get().edge

      let newWidth = startSize.width
      let newHeight = startSize.height

      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      if (direction === 'horizontal' || direction === 'both') {
        // For left edge trigger, width handle is on right (positive deltaX = bigger)
        // For right edge trigger, width handle is on left (negative deltaX = bigger)
        if (edge === 'right') {
          newWidth = startSize.width - deltaX
        } else {
          newWidth = startSize.width + deltaX
        }
      }

      if (direction === 'vertical' || direction === 'both') {
        // For bottom edge trigger, height handle is on top (negative deltaY = bigger)
        // For other edges, height handle is on bottom (positive deltaY = bigger)
        if (edge === 'bottom') {
          newHeight = startSize.height - deltaY
        } else {
          newHeight = startSize.height + deltaY
        }
      }

      const constrained = constrainSize({ width: newWidth, height: newHeight })
      updatePanelSize(elements.panel, constrained)
      sizeState.set(constrained)
    })
  }

  const onPointerUp = () => {
    if (!resizeState.isResizing()) return

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    resizeState.end()
    elements.panel.dataset.resizing = 'false'
    elements.iframe.style.pointerEvents = ''

    sizeState.save()
  }

  const onDoubleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    sizeState.resetToDefault()
    updatePanelState(elements, true, positionState.get().edge, null)
  }

  const setupHandleListeners = () => {
    currentHandles.forEach(handle => {
      handle.element.remove()
    })

    const edge = positionState.get().edge
    currentHandles = createResizeHandles(elements.panel, edge)

    currentHandles.forEach(handle => {
      const handlePointerDown = (e: PointerEvent) => onPointerDown(e, handle)
      handle.element.addEventListener('pointerdown', handlePointerDown)
      handle.element.addEventListener('dblclick', onDoubleClick)
    })
  }

  const checkAndSetupHandles = () => {
    if (panelState.isOpen() && currentHandles.length === 0) {
      setupHandleListeners()
    }
  }

  const observer = new window.MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-open') {
        const isOpen = elements.panel.dataset.open === 'true'
        if (isOpen) {
          setupHandleListeners()
        }
      }
    })
  })

  observer.observe(elements.panel, { attributes: true })

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)

  checkAndSetupHandles()

  return () => {
    observer.disconnect()
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId)
    }

    currentHandles.forEach(handle => {
      handle.element.remove()
    })
  }
}

export function setupAllHandlers(context: EventHandlerContext): CleanupFn {
  const cleanupFns = [
    setupDragHandlers(context),
    setupClickHandlers(context),
    setupKeyboardHandlers(context),
    setupWindowResizeHandler(context),
    setupPanelResizeHandlers(context)
  ]

  return () => {
    cleanupFns.forEach(cleanup => cleanup())
  }
}
