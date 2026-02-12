'use client'

import Script from 'next/script'

export interface AssetManagerScriptProps {
  /**
   * Base URL path for the asset manager dashboard.
   * Must match the `base` option passed to `createHandler()`.
   * @default '/api/asset-manager'
   */
  base?: string
}

/**
 * Injects the floating icon scripts into a Next.js application.
 * Add this component to your root layout to enable the draggable
 * asset manager panel overlay.
 *
 * Only renders in development mode — zero production footprint.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { AssetManagerScript } from 'nextjs-asset-manager'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html><body>
 *       {children}
 *       <AssetManagerScript />
 *     </body></html>
 *   )
 * }
 * ```
 */
export function AssetManagerScript({
  base = '/api/asset-manager',
}: AssetManagerScriptProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base

  return (
    <>
      <Script
        id="vam-base-url"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.__VAM_BASE_URL__ = "${normalizedBase}";`,
        }}
      />
      <Script
        id="vam-floating-icon"
        strategy="afterInteractive"
        src={`${normalizedBase}/floating-icon.js`}
      />
    </>
  )
}
