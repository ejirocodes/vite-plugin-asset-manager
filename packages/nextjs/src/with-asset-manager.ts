import type { NextConfig } from 'next'

export interface WithAssetManagerOptions {
  /**
   * Base URL path for the asset manager API routes.
   * Must match the `base` option passed to `createHandler()`.
   * @default '/api/asset-manager'
   */
  base?: string
}

/**
 * Wraps a Next.js config to suppress dev server request logging
 * for asset manager API routes.
 *
 * @example
 * ```ts
 * // next.config.ts
 * import { withAssetManager } from 'nextjs-asset-manager'
 *
 * const nextConfig: NextConfig = {}
 * export default withAssetManager(nextConfig)
 * ```
 */
export function withAssetManager(
  nextConfig: NextConfig = {},
  options: WithAssetManagerOptions = {}
): NextConfig {
  const base = options.base ?? '/api/asset-manager'

  // Respect user's choice to disable logging entirely
  if (nextConfig.logging === false) {
    return nextConfig
  }

  const existingLogging =
    typeof nextConfig.logging === 'object' ? nextConfig.logging : {}

  // Respect user's choice to disable incoming request logging entirely
  if (existingLogging.incomingRequests === false) {
    return nextConfig
  }

  const existingIncoming =
    typeof existingLogging.incomingRequests === 'object'
      ? existingLogging.incomingRequests
      : {}

  const existingIgnore = Array.isArray(existingIncoming.ignore)
    ? existingIncoming.ignore
    : []

  // Build regex that matches the base path
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(escapedBase)

  return {
    ...nextConfig,
    logging: {
      ...existingLogging,
      incomingRequests: {
        ...existingIncoming,
        ignore: [...existingIgnore, pattern],
      },
    },
  }
}
