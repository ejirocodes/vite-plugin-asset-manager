export const selectors = {
  floatingIcon: {
    container: '#vam-container',
    trigger: '#vam-trigger',
    overlay: '#vam-overlay',
    panel: '#vam-panel',
    iframe: '#vam-iframe',
    triggerActive: '#vam-trigger[data-active="true"]',
    panelOpen: '#vam-panel[data-open="true"]',
    panelClosed: '#vam-panel[data-open="false"]',
  },

  dashboard: {
    grid: '[role="grid"]',
    gridCell: '[role="gridcell"]',
    searchInput: 'input[placeholder="Search assets..."]',
    previewPanel: 'aside[role="region"]',
    closePreview: 'button[aria-label="Close preview panel"]',
    sidebarToggle: 'button[aria-label="Toggle sidebar"]',
    groupHeader: 'button:has(span.font-mono)',
  },
} as const

export const DASHBOARD_PATH = '/__asset_manager__/'
export const HOST_APP_PATH = '/'
export const API_BASE = '/__asset_manager__/api'
