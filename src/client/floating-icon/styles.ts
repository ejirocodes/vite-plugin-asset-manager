import { CSS_VARS, DIMENSIONS, ELEMENT_IDS, Z_INDEX } from './constants'

const STYLES = `
:root {
  --vam-bg: ${CSS_VARS.BG};
  --vam-border: ${CSS_VARS.BORDER};
  --vam-border-hover: ${CSS_VARS.BORDER_HOVER};
  --vam-hover: ${CSS_VARS.HOVER};
  --vam-transition: ${CSS_VARS.TRANSITION};
  --vam-transition-spring: ${CSS_VARS.TRANSITION_SPRING};
  --vam-shadow: ${CSS_VARS.SHADOW};
  --vam-shadow-hover: ${CSS_VARS.SHADOW_HOVER};
  --vam-glow-active: ${CSS_VARS.GLOW_ACTIVE};
  --vam-icon-width: ${DIMENSIONS.ICON_CONTAINER_WIDTH}px;
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
  box-shadow: var(--vam-shadow-hover);
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
  background: rgba(65, 209, 255, 0.12);
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
  background: rgba(0, 0, 0, 0.5);
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  width: min(${DIMENSIONS.PANEL_WIDTH_PERCENT}vw, ${DIMENSIONS.PANEL_MAX_WIDTH}px);
  height: min(${DIMENSIONS.PANEL_HEIGHT_PERCENT}vh, ${DIMENSIONS.PANEL_MAX_HEIGHT}px);
  background: ${CSS_VARS.PANEL_BG};
  border: 1px solid var(--vam-border);
  border-radius: 12px;
  z-index: ${Z_INDEX.PANEL};
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transition:
    transform 0.25s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.25s ease,
    visibility 0.25s ease;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

#${ELEMENT_IDS.PANEL}[data-open="true"] {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  visibility: visible;
}

#${ELEMENT_IDS.IFRAME} {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
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
