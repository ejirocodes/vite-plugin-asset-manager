import { useState } from 'react'

/**
 * Hook to detect if the dashboard is running in embedded mode (within floating icon panel).
 * Checks for ?embedded=true query parameter in the URL.
 */
export function useEmbeddedMode(): boolean {
  const [isEmbedded] = useState(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('embedded') === 'true'
  })
  return isEmbedded
}
