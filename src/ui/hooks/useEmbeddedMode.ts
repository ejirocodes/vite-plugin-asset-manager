/**
 * Detect if the dashboard is running in embedded mode (within floating icon panel).
 * Checks for ?embedded=true query parameter in the URL.
 * This is a static value that never changes during the app's lifetime.
 */
export const isEmbedded =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('embedded') === 'true'
