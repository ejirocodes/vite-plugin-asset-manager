import {
  applyPosition,
  setDragging,
  updateDragPosition,
  updatePanelState,
  type FloatingIconElements
} from './dom'
import {
  createDragState,
  snapToEdge,
  type DragState,
  type PanelState,
  type PositionState
} from './state'

export interface EventHandlerContext {
  elements: FloatingIconElements
  positionState: PositionState
  panelState: PanelState
}

export type CleanupFn = () => void

export function setupDragHandlers(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState } = context
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
        updatePanelState(elements, true, newPosition.edge)
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
  const { elements, positionState, panelState } = context
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
    updatePanelState(elements, panelState.isOpen(), positionState.get().edge)
  }

  const onOverlayClick = (e: MouseEvent) => {
    if (e.target === elements.overlay) {
      panelState.close()
      updatePanelState(elements, false, positionState.get().edge)
    }
  }

  elements.trigger.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  elements.trigger.addEventListener('click', onTriggerClick)
  elements.overlay.addEventListener('click', onOverlayClick)

  return () => {
    elements.trigger.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    elements.trigger.removeEventListener('click', onTriggerClick)
    elements.overlay.removeEventListener('click', onOverlayClick)
  }
}

export function setupKeyboardHandlers(context: EventHandlerContext): CleanupFn {
  const { elements, positionState, panelState } = context

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && panelState.isOpen()) {
      panelState.close()
      updatePanelState(elements, false, positionState.get().edge)
      return
    }

    // Option+Shift+A to toggle
    if (e.altKey && e.shiftKey && e.code === 'KeyA') {
      e.preventDefault()
      panelState.toggle()
      updatePanelState(elements, panelState.isOpen(), positionState.get().edge)
    }
  }

  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

export function setupAllHandlers(context: EventHandlerContext): CleanupFn {
  const cleanupFns = [
    setupDragHandlers(context),
    setupClickHandlers(context),
    setupKeyboardHandlers(context)
  ]

  return () => {
    cleanupFns.forEach(cleanup => cleanup())
  }
}
