import { CSS_VARS, DIMENSIONS, ELEMENT_IDS, Z_INDEX } from './constants'

const STYLES = `
:root {
  --vam-bg: ${CSS_VARS.BG};
  --vam-border: ${CSS_VARS.BORDER};
  --vam-hover: ${CSS_VARS.HOVER};
  --vam-transition: ${CSS_VARS.TRANSITION};
  --vam-shadow: ${CSS_VARS.SHADOW};
  --vam-icon-width: ${DIMENSIONS.ICON_CONTAINER_WIDTH}px;
}

#${ELEMENT_IDS.CONTAINER} {
  position: fixed;
  z-index: ${Z_INDEX.CONTAINER};
  padding: ${DIMENSIONS.CONTAINER_PADDING}px;
  background: var(--vam-bg);
  backdrop-filter: blur(${DIMENSIONS.BACKDROP_BLUR}px);
  border: 1px solid var(--vam-border);
  box-shadow: var(--vam-shadow);
  transition: var(--vam-transition);
  touch-action: none;
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
  opacity: 0.9;
  box-shadow: ${CSS_VARS.SHADOW_DRAGGING};
}

#${ELEMENT_IDS.TRIGGER} {
  width: 100%;
  height: ${DIMENSIONS.TRIGGER_HEIGHT}px;
  border-radius: ${DIMENSIONS.TRIGGER_BORDER_RADIUS}px;
  background: transparent;
  border: none;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

#${ELEMENT_IDS.TRIGGER}:hover {
  background: var(--vam-hover);
}

#${ELEMENT_IDS.TRIGGER}[data-active="true"] {
  background: rgba(139, 92, 246, 0.2);
}

#${ELEMENT_IDS.TRIGGER}[data-active="true"] svg {
  filter: drop-shadow(0 0 8px rgba(65, 209, 255, 0.5));
}

#${ELEMENT_IDS.CONTAINER}[data-dragging="true"] #${ELEMENT_IDS.TRIGGER} {
  cursor: grabbing;
}

#${ELEMENT_IDS.OVERLAY} {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(${DIMENSIONS.OVERLAY_BLUR}px);
  z-index: ${Z_INDEX.OVERLAY};
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

#${ELEMENT_IDS.OVERLAY}[data-open="true"] {
  opacity: 1;
  visibility: visible;
}

#${ELEMENT_IDS.PANEL} {
  position: fixed;
  top: 0;
  bottom: 0;
  width: min(calc(${DIMENSIONS.PANEL_WIDTH_PERCENT}vw - var(--vam-icon-width)), ${DIMENSIONS.PANEL_MAX_WIDTH}px);
  background: ${CSS_VARS.PANEL_BG};
  z-index: ${Z_INDEX.PANEL};
  display: flex;
  flex-direction: column;
  transition: transform var(--vam-transition);
}

#${ELEMENT_IDS.PANEL}[data-edge="left"] {
  left: var(--vam-icon-width);
  right: auto;
  border-right: 1px solid var(--vam-border);
  transform: translateX(-100%);
}

#${ELEMENT_IDS.PANEL}[data-edge="right"] {
  right: var(--vam-icon-width);
  left: auto;
  border-left: 1px solid var(--vam-border);
  transform: translateX(100%);
}

#${ELEMENT_IDS.PANEL}[data-edge="left"][data-open="true"],
#${ELEMENT_IDS.PANEL}[data-edge="right"][data-open="true"] {
  transform: translateX(0);
}

#${ELEMENT_IDS.PANEL}[data-edge="top"] {
  top: 0;
  bottom: auto;
  left: 0;
  right: 0;
  width: 100%;
  height: min(90vh, 800px);
  border-bottom: 1px solid var(--vam-border);
  border-left: none;
  border-right: none;
  transform: translateY(-100%);
}

#${ELEMENT_IDS.PANEL}[data-edge="bottom"] {
  bottom: 0;
  top: auto;
  left: 0;
  right: 0;
  width: 100%;
  height: min(90vh, 800px);
  border-top: 1px solid var(--vam-border);
  border-left: none;
  border-right: none;
  transform: translateY(100%);
}

#${ELEMENT_IDS.PANEL}[data-edge="top"][data-open="true"],
#${ELEMENT_IDS.PANEL}[data-edge="bottom"][data-open="true"] {
  transform: translateY(0);
}

#${ELEMENT_IDS.IFRAME} {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
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
