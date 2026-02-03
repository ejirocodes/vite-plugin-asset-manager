// Types
export * from './types/index.js'

// Services
export {
  AssetScanner,
  ImporterScanner,
  DuplicateScanner,
  ThumbnailService,
  launchEditor,
  revealInFileExplorer,
  type ScannerEvents,
  type ImporterScannerEvents,
  type DuplicateScannerEvents,
  type DuplicateInfo
} from './services/index.js'

// API
export { createApiRouter, broadcastSSE } from './api/router.js'

// Middleware
export {
  createAssetManagerMiddleware,
  type MiddlewareContext,
  type AssetManagerMiddleware,
  type NextFunction
} from './middleware/create-middleware.js'

// Asset Manager orchestrator
export {
  AssetManager,
  type AssetManagerConfig,
  type AssetManagerEventHandler
} from './asset-manager.js'
