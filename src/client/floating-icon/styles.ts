import { CSS_TRANSITIONS, DARK_COLORS, LIGHT_COLORS, DIMENSIONS, ELEMENT_IDS, RESIZE, Z_INDEX } from './constants'

const STYLES = `
:root {
  --vam-bg: ${LIGHT_COLORS.BG};
  --vam-border: ${LIGHT_COLORS.BORDER};
  --vam-border-hover: ${LIGHT_COLORS.BORDER_HOVER};
  --vam-hover: ${LIGHT_COLORS.HOVER};
  --vam-shadow: ${LIGHT_COLORS.SHADOW};
  --vam-shadow-hover: ${LIGHT_COLORS.SHADOW_HOVER};
  --vam-shadow-dragging: ${LIGHT_COLORS.SHADOW_DRAGGING};
  --vam-glow-active: ${LIGHT_COLORS.GLOW_ACTIVE};
  --vam-trigger-active-bg: ${LIGHT_COLORS.TRIGGER_ACTIVE_BG};
  --vam-overlay-bg: ${LIGHT_COLORS.OVERLAY_BG};
  --vam-panel-bg: ${LIGHT_COLORS.PANEL_BG};
  --vam-transition: ${CSS_TRANSITIONS.DEFAULT};
  --vam-transition-spring: ${CSS_TRANSITIONS.SPRING};
  --vam-icon-width: ${DIMENSIONS.ICON_CONTAINER_WIDTH}px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --vam-bg: ${DARK_COLORS.BG};
    --vam-border: ${DARK_COLORS.BORDER};
    --vam-border-hover: ${DARK_COLORS.BORDER_HOVER};
    --vam-hover: ${DARK_COLORS.HOVER};
    --vam-shadow: ${DARK_COLORS.SHADOW};
    --vam-shadow-hover: ${DARK_COLORS.SHADOW_HOVER};
    --vam-shadow-dragging: ${DARK_COLORS.SHADOW_DRAGGING};
    --vam-glow-active: ${DARK_COLORS.GLOW_ACTIVE};
    --vam-trigger-active-bg: ${DARK_COLORS.TRIGGER_ACTIVE_BG};
    --vam-overlay-bg: ${DARK_COLORS.OVERLAY_BG};
    --vam-panel-bg: ${DARK_COLORS.PANEL_BG};
  }
}

#${ELEMENT_IDS.CONTAINER} {
  position: fixed;
  z-index: ${Z_INDEX.CONTAINER};
  padding: ${DIMENSIONS.CONTAINER_PADDING}px;
  background: var(--vam-bg);
  backdrop-filter: blur(${DIMENSIONS.BACKDROP_BLUR}px);
  -webkit-backdrop-filter: blur(${DIMENSIONS.BACKDROP_BLUR}px);
  border: 1px solid var(--vam-border);
  box-shadow: var(--vam-shadow);
  transition:
    box-shadow var(--vam-transition),
    border-color var(--vam-transition),
    transform var(--vam-transition-spring);
  touch-action: none;
  will-change: transform;
}

#${ELEMENT_IDS.CONTAINER}:hover {
  border-color: var(--vam-border-hover);
  box-shadow: var(--vam-shadow-hover);
}

#${ELEMENT_IDS.CONTAINER}[data-edge="left"] {
  border-radius: 0 ${DIMENSIONS.BORDER_RADIUS}px ${DIMENSIONS.BORDER_RADIUS}px 0;
  border-left: none;
}

#${ELEMENT_IDS.CONTAINER}[data-edge="right"] {
  border-radius: ${DIMENSIONS.BORDER_RADIUS}px 0 0 ${DIMENSIONS.BORDER_RADIUS}px;
  border-right: none;
}

#${ELEMENT_IDS.CONTAINER}[data-edge="top"] {
  border-radius: 0 0 ${DIMENSIONS.BORDER_RADIUS}px ${DIMENSIONS.BORDER_RADIUS}px;
  border-top: none;
}

#${ELEMENT_IDS.CONTAINER}[data-edge="bottom"] {
  border-radius: ${DIMENSIONS.BORDER_RADIUS}px ${DIMENSIONS.BORDER_RADIUS}px 0 0;
  border-bottom: none;
}

#${ELEMENT_IDS.CONTAINER}[data-dragging="true"] {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: var(--vam-shadow-dragging);
}

#${ELEMENT_IDS.TRIGGER} {
  width: ${DIMENSIONS.TRIGGER_SIZE}px;
  height: ${DIMENSIONS.TRIGGER_SIZE}px;
  padding: 0;
  border-radius: ${DIMENSIONS.TRIGGER_BORDER_RADIUS}px;
  background: transparent;
  border: none;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--vam-transition),
    transform var(--vam-transition-spring);
  will-change: transform;
}

#${ELEMENT_IDS.TRIGGER}:hover {
  background: var(--vam-hover);
  transform: scale(1.08);
}

#${ELEMENT_IDS.TRIGGER}:active {
  transform: scale(0.95);
}

#${ELEMENT_IDS.TRIGGER}[data-active="true"] {
  background: var(--vam-trigger-active-bg);
}

#${ELEMENT_IDS.TRIGGER}[data-active="true"] svg {
  filter: drop-shadow(0 0 6px rgba(65, 209, 255, 0.6));
}

#${ELEMENT_IDS.CONTAINER}[data-dragging="true"] #${ELEMENT_IDS.TRIGGER} {
  cursor: grabbing;
  transform: none;
}

#${ELEMENT_IDS.TRIGGER} svg {
  transition: filter var(--vam-transition), transform var(--vam-transition);
}

#${ELEMENT_IDS.OVERLAY} {
  position: fixed;
  inset: 0;
  background: var(--vam-overlay-bg);
  backdrop-filter: blur(${DIMENSIONS.OVERLAY_BLUR}px);
  -webkit-backdrop-filter: blur(${DIMENSIONS.OVERLAY_BLUR}px);
  z-index: ${Z_INDEX.OVERLAY};
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

#${ELEMENT_IDS.OVERLAY}[data-open="true"] {
  opacity: 1;
  visibility: visible;
}

#${ELEMENT_IDS.PANEL} {
  position: fixed;
  width: min(${DIMENSIONS.PANEL_WIDTH_PERCENT}vw, ${DIMENSIONS.PANEL_MAX_WIDTH}px);
  height: min(${DIMENSIONS.PANEL_HEIGHT_PERCENT}vh, ${DIMENSIONS.PANEL_MAX_HEIGHT}px);
  max-height: calc(100vh - 40px);
  background: var(--vam-panel-bg);
  border: 1px solid var(--vam-border);
  border-radius: 12px;
  z-index: ${Z_INDEX.PANEL};
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
  transition:
    transform 0.2s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease,
    visibility 0.2s ease;
  overflow: hidden;
}

#${ELEMENT_IDS.PANEL}[data-open="true"] {
  transform: scale(1);
  opacity: 1;
  visibility: visible;
}

#${ELEMENT_IDS.IFRAME} {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
}

/* Resize handles */
.vam-resize-handle {
  position: absolute;
  background: transparent;
  z-index: ${Z_INDEX.PANEL + 1};
  touch-action: none;
}

.vam-resize-handle:hover {
  background: rgba(65, 209, 255, 0.3);
}

.vam-resize-handle:active {
  background: rgba(65, 209, 255, 0.5);
}

/* Horizontal resize handle (width) */
.vam-resize-handle[data-direction="horizontal"] {
  cursor: ew-resize;
  width: ${RESIZE.HANDLE_SIZE}px;
  top: ${RESIZE.HANDLE_SIZE}px;
  bottom: ${RESIZE.HANDLE_SIZE}px;
}

.vam-resize-handle[data-direction="horizontal"][data-position="left"] {
  left: 0;
  border-radius: 4px 0 0 4px;
}

.vam-resize-handle[data-direction="horizontal"][data-position="right"] {
  right: 0;
  border-radius: 0 4px 4px 0;
}

/* Vertical resize handle (height) */
.vam-resize-handle[data-direction="vertical"] {
  cursor: ns-resize;
  height: ${RESIZE.HANDLE_SIZE}px;
  left: ${RESIZE.HANDLE_SIZE}px;
  right: ${RESIZE.HANDLE_SIZE}px;
}

.vam-resize-handle[data-direction="vertical"][data-position="top"] {
  top: 0;
  border-radius: 4px 4px 0 0;
}

.vam-resize-handle[data-direction="vertical"][data-position="bottom"] {
  bottom: 0;
  border-radius: 0 0 4px 4px;
}

/* Corner resize handle (diagonal) */
.vam-resize-handle[data-direction="both"] {
  width: ${RESIZE.HANDLE_HIT_AREA}px;
  height: ${RESIZE.HANDLE_HIT_AREA}px;
}

.vam-resize-handle[data-direction="both"][data-position="bottom-right"] {
  cursor: nwse-resize;
  right: 0;
  bottom: 0;
  border-radius: 0 0 8px 0;
}

.vam-resize-handle[data-direction="both"][data-position="bottom-left"] {
  cursor: nesw-resize;
  left: 0;
  bottom: 0;
  border-radius: 0 0 0 8px;
}

.vam-resize-handle[data-direction="both"][data-position="top-right"] {
  cursor: nesw-resize;
  right: 0;
  top: 0;
  border-radius: 0 8px 0 0;
}

.vam-resize-handle[data-direction="both"][data-position="top-left"] {
  cursor: nwse-resize;
  left: 0;
  top: 0;
  border-radius: 8px 0 0 0;
}

/* Panel resizing state */
#${ELEMENT_IDS.PANEL}[data-resizing="true"] {
  transition: none;
}

#${ELEMENT_IDS.PANEL}[data-resizing="true"] #${ELEMENT_IDS.IFRAME} {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  #${ELEMENT_IDS.CONTAINER},
  #${ELEMENT_IDS.TRIGGER},
  #${ELEMENT_IDS.OVERLAY},
  #${ELEMENT_IDS.PANEL},
  #${ELEMENT_IDS.TRIGGER} svg {
    transition: none;
  }
}
`

let injectedStyleElement: HTMLStyleElement | null = null

export function injectStyles(): void {
  if (injectedStyleElement) return
  injectedStyleElement = document.createElement('style')
  injectedStyleElement.textContent = STYLES
  document.head.appendChild(injectedStyleElement)
}

export function removeStyles(): void {
  if (injectedStyleElement) {
    injectedStyleElement.remove()
    injectedStyleElement = null
  }
}
