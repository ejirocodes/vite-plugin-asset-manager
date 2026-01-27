import type { Plugin, ViteDevServer, ResolvedConfig, IndexHtmlTransformResult } from 'vite'
import colors from 'picocolors'
import { setupMiddleware } from './server/index.js'
import { AssetScanner } from './server/scanner.js'
import { ImporterScanner } from './server/importer-scanner.js'
import { ThumbnailService } from './server/thumbnail.js'
import { broadcastSSE } from './server/api.js'
import { resolveOptions, type AssetManagerOptions } from './shared/types.js'

const FLOATING_ICON_SCRIPT = (base: string) => `
<script type="module">
(function() {
  const BASE_URL = '${base}';
  const STORAGE_KEY = 'vite-asset-manager-open';

  // Styles for the floating button and overlay
  const styles = document.createElement('style');
  styles.textContent = \`
    #vam-trigger {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px -4px rgba(139, 92, 246, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset;
      transition: all 0.2s ease;
      z-index: 99998;
    }
    #vam-trigger:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 8px 32px -4px rgba(139, 92, 246, 0.6), 0 0 0 1px rgba(255,255,255,0.15) inset;
    }
    #vam-trigger:active {
      transform: translateY(0) scale(0.98);
    }
    #vam-trigger svg {
      width: 24px;
      height: 24px;
      color: white;
    }
    #vam-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 99999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    #vam-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    #vam-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(90vw, 1200px);
      background: #09090b;
      border-left: 1px solid rgba(255,255,255,0.08);
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      z-index: 100000;
      display: flex;
      flex-direction: column;
    }
    #vam-overlay.open #vam-panel {
      transform: translateX(0);
    }
    #vam-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: #0f0f11;
    }
    #vam-panel-title {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 12px;
      font-weight: 600;
      color: #fafafa;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #vam-panel-title svg {
      width: 18px;
      height: 18px;
      color: #8b5cf6;
    }
    #vam-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #71717a;
      transition: all 0.15s ease;
    }
    #vam-close-btn:hover {
      background: rgba(255,255,255,0.1);
      color: #fafafa;
    }
    #vam-iframe {
      flex: 1;
      border: none;
      width: 100%;
      height: 100%;
    }
  \`;
  document.head.appendChild(styles);

  // Create trigger button
  const trigger = document.createElement('button');
  trigger.id = 'vam-trigger';
  trigger.title = 'Open Asset Manager (⌥⇧A)';
  trigger.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V88H40V56Zm0,144H40V104H216v96ZM64,128a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H72A8,8,0,0,1,64,128Zm0,32a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H72A8,8,0,0,1,64,160Z"/>
    </svg>
  \`;

  // Create overlay and panel
  const overlay = document.createElement('div');
  overlay.id = 'vam-overlay';
  overlay.innerHTML = \`
    <div id="vam-panel">
      <div id="vam-panel-header">
        <div id="vam-panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
            <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,1,0-96,0,48,48,0,0,0,96,0Zm-48,32a32,32,0,1,1,32-32A32,32,0,0,1,128,120Zm80,56a8,8,0,0,1-8,8H56a8,8,0,0,1-6.65-12.44l24-36a8,8,0,0,1,13.3,0l15.18,22.77,24.89-41.48a8,8,0,0,1,13.72.18l40,64A8,8,0,0,1,208,176Z"/>
          </svg>
          ASSET MANAGER
        </div>
        <button id="vam-close-btn" title="Close (Esc)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
          </svg>
        </button>
      </div>
      <iframe id="vam-iframe" src="\${BASE_URL}?embedded=true"></iframe>
    </div>
  \`;

  document.body.appendChild(trigger);
  document.body.appendChild(overlay);

  // State management
  let isOpen = sessionStorage.getItem(STORAGE_KEY) === 'true';

  function open() {
    isOpen = true;
    overlay.classList.add('open');
    sessionStorage.setItem(STORAGE_KEY, 'true');
  }

  function close() {
    isOpen = false;
    overlay.classList.remove('open');
    sessionStorage.setItem(STORAGE_KEY, 'false');
  }

  // Restore state
  if (isOpen) {
    requestAnimationFrame(() => open());
  }

  // Event listeners
  trigger.addEventListener('click', () => {
    if (isOpen) close();
    else open();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.getElementById('vam-close-btn').addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    // Close on Escape
    if (e.key === 'Escape' && isOpen) {
      close();
    }
    // Toggle on Option/Alt + Shift + A
    if (e.altKey && e.shiftKey && e.code === 'KeyA') {
      e.preventDefault();
      if (isOpen) close();
      else open();
    }
  });
})();
</script>
`

export function createAssetManagerPlugin(options: AssetManagerOptions = {}): Plugin {
  let config: ResolvedConfig
  let scanner: AssetScanner
  let importerScanner: ImporterScanner
  let thumbnailService: ThumbnailService

  const resolvedOptions = resolveOptions(options)

  return {
    name: 'vite-plugin-asset-manager',
    apply: 'serve',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    configureServer(server: ViteDevServer) {
      scanner = new AssetScanner(config.root, resolvedOptions)
      importerScanner = new ImporterScanner(config.root, resolvedOptions)
      thumbnailService = new ThumbnailService(resolvedOptions.thumbnailSize)

      setupMiddleware(server, {
        base: resolvedOptions.base,
        scanner,
        importerScanner,
        thumbnailService,
        root: config.root,
        launchEditor: resolvedOptions.launchEditor
      })

      scanner.init()
      importerScanner.init()

      const _printUrls = server.printUrls
      server.printUrls = () => {
        _printUrls()

        const colorUrl = (url: string) =>
          colors.cyan(url.replace(/:(\d+)\//, (_, port) => `:${colors.bold(port)}/`))

        let host = `${server.config.server.https ? 'https' : 'http'}://localhost:${server.config.server.port || '80'}`
        const url = server.resolvedUrls?.local[0]
        if (url) {
          try {
            const u = new URL(url)
            host = `${u.protocol}//${u.host}`
          } catch {}
        }

        const base = server.config.base || '/'
        const fullUrl = `${host}${base}${resolvedOptions.base.replace(/^\//, '')}/`

        server.config.logger.info(
          `  ${colors.magenta('➜')}  ${colors.bold('Asset Manager')}: Open ${colorUrl(fullUrl)} as a separate window`
        )
        server.config.logger.info(
          `  ${colors.magenta('➜')}  ${colors.bold('Asset Manager')}: Press ${colors.yellow('Option(⌥)+Shift(⇧)+A')} in App to toggle the Asset Manager`
        )
      }

      if (resolvedOptions.watch) {
        scanner.on('change', event => {
          broadcastSSE('asset-manager:update', event)
        })
        importerScanner.on('change', event => {
          broadcastSSE('asset-manager:importers-update', event)
        })
      }
    },

    transformIndexHtml(): IndexHtmlTransformResult {
      if (!resolvedOptions.floatingIcon) {
        return []
      }

      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: FLOATING_ICON_SCRIPT(resolvedOptions.base)
            .replace(/<\/?script[^>]*>/g, '')
            .trim(),
          injectTo: 'body'
        }
      ]
    },

    resolveId(id) {
      if (id === 'virtual:asset-manager-config') {
        return '\0virtual:asset-manager-config'
      }
    },

    load(id) {
      if (id === '\0virtual:asset-manager-config') {
        return `export default ${JSON.stringify({
          base: resolvedOptions.base,
          extensions: resolvedOptions.extensions
        })}`
      }
    },

    buildEnd() {
      scanner?.destroy()
      importerScanner?.destroy()
    }
  }
}
