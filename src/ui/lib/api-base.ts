/**
 * Returns the API base URL for the asset manager dashboard.
 *
 * Derives the base from the current page URL at runtime so the dashboard
 * works regardless of the configured base path (e.g. '/__asset_manager__'
 * for Vite, '/api/asset-manager' for Next.js).
 *
 * The dashboard is always served at {base}/ or {base}?embedded=true,
 * so we can extract the base from window.location.pathname.
 */

let cachedBase: string | null = null

export function getApiBase(): string {
  if (cachedBase !== null) return cachedBase

  // In test environments, fall back to the default
  if (typeof window === 'undefined') {
    cachedBase = '/__asset_manager__'
    return cachedBase
  }

  // The pathname is the base itself (e.g. /api/asset-manager or /__asset_manager__)
  // Strip trailing slash for consistency
  const pathname = window.location.pathname.replace(/\/$/, '')

  // The dashboard's own assets live under {base}/assets/, so if we're at
  // {base}/ the pathname IS the base. For direct HTML loads the pathname
  // is exactly the base (possibly with trailing slash already stripped).
  cachedBase = pathname || '/__asset_manager__'
  return cachedBase
}
