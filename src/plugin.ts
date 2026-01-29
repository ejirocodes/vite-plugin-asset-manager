import type { Plugin, ViteDevServer, ResolvedConfig, IndexHtmlTransformResult } from 'vite'
import colors from 'picocolors'
import { setupMiddleware } from './server/index.js'
import { AssetScanner } from './server/scanner.js'
import { ImporterScanner } from './server/importer-scanner.js'
import { DuplicateScanner } from './server/duplicate-scanner.js'
import { ThumbnailService } from './server/thumbnail.js'
import { broadcastSSE } from './server/api.js'
import { resolveOptions, type AssetManagerOptions } from './shared/types.js'

const FLOATING_ICON_SCRIPT = (base: string) => `
<script type="module">
(function() {
  const BASE_URL = '${base}';

  const VITE_ICON = \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 257" style="display:block">
    <defs>
      <linearGradient id="vam-icon-grad-1" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%">
        <stop offset="0%" stop-color="#41D1FF"/>
        <stop offset="100%" stop-color="#BD34FE"/>
      </linearGradient>
      <linearGradient id="vam-icon-grad-2" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%">
        <stop offset="0%" stop-color="#FFEA83"/>
        <stop offset="8.333%" stop-color="#FFDD35"/>
        <stop offset="100%" stop-color="#FFA800"/>
      </linearGradient>
    </defs>
    <path fill="url(#vam-icon-grad-1)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"/>
    <path fill="url(#vam-icon-grad-2)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"/>
  </svg>\`;

  const styles = document.createElement('style');
  styles.textContent = \`
    :root {
      --vam-bg: rgba(15, 15, 17, 0.95);
      --vam-border: rgba(255, 255, 255, 0.08);
      --vam-hover: rgba(255, 255, 255, 0.1);
      --vam-transition: 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      --vam-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    #vam-container {
      position: fixed;
      z-index: 99998;
      padding: 8px;
      background: var(--vam-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--vam-border);
      box-shadow: var(--vam-shadow);
      transition: var(--vam-transition);
      touch-action: none;
    }

    #vam-container[data-edge="left"] {
      border-radius: 0 14px 14px 0;
      border-left: none;
    }

    #vam-container[data-edge="right"] {
      border-radius: 14px 0 0 14px;
      border-right: none;
    }

    #vam-container[data-dragging="true"] {
      cursor: grabbing;
      opacity: 0.9;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
    }

    #vam-trigger {
      width: 100%;
      height: 36px;
      border-radius: 10px;
      background: transparent;
      border: none;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }

    #vam-trigger:hover {
      background: var(--vam-hover);
    }

    #vam-trigger[data-active="true"] {
      background: rgba(139, 92, 246, 0.2);
    }

    #vam-trigger[data-active="true"] svg {
      filter: drop-shadow(0 0 8px rgba(65, 209, 255, 0.5));
    }

    #vam-container[data-dragging="true"] #vam-trigger {
      cursor: grabbing;
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

    #vam-overlay[data-open="true"] {
      opacity: 1;
      visibility: visible;
    }

    #vam-panel {
      position: fixed;
      top: 0;
      bottom: 0;
      width: min(90vw, 1200px);
      background: #09090b;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      transition: transform var(--vam-transition);
    }

    #vam-panel[data-edge="left"] {
      left: 0;
      right: auto;
      border-right: 1px solid var(--vam-border);
      transform: translateX(-100%);
    }

    #vam-panel[data-edge="right"] {
      right: 0;
      left: auto;
      border-left: 1px solid var(--vam-border);
      transform: translateX(100%);
    }

    #vam-panel[data-open="true"] {
      transform: translateX(0);
    }

    #vam-iframe {
      flex: 1;
      border: none;
      width: 100%;
      height: 100%;
    }
  \`;
  document.head.appendChild(styles);

  let position = JSON.parse(localStorage.getItem('vite-asset-manager-position')) || { edge: 'left', offset: 50 };
  let isOpen = localStorage.getItem('vite-asset-manager-open') === 'true';
  let isDragging = false;
  let dragStartPos = { x: 0, y: 0 };
  let hasMoved = false;

  const container = document.createElement('div');
  container.id = 'vam-container';

  const trigger = document.createElement('button');
  trigger.id = 'vam-trigger';
  trigger.innerHTML = VITE_ICON;
  trigger.title = 'Asset Manager (⌥⇧A)';

  const overlay = document.createElement('div');
  overlay.id = 'vam-overlay';

  const panel = document.createElement('div');
  panel.id = 'vam-panel';

  const iframe = document.createElement('iframe');
  iframe.id = 'vam-iframe';
  const baseWithSlash = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
  iframe.src = window.location.origin + baseWithSlash + '?embedded=true';

  panel.appendChild(iframe);
  overlay.appendChild(panel);
  container.appendChild(trigger);
  document.body.append(container, overlay);

  function applyPosition() {
    const { edge, offset } = position;
    container.dataset.edge = edge;
    container.style.top = offset + '%';
    container.style.transform = 'translateY(-50%)';
    if (edge === 'left') {
      container.style.left = '0';
      container.style.right = 'auto';
    } else {
      container.style.right = '0';
      container.style.left = 'auto';
    }
  }

  function snapToEdge(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge = x < vw / 2 ? 'left' : 'right';
    const offset = Math.max(10, Math.min(90, (y / vh) * 100));
    return { edge, offset };
  }

  function savePosition() {
    localStorage.setItem('vite-asset-manager-position', JSON.stringify(position));
  }

  function open() {
    isOpen = true;
    overlay.dataset.open = 'true';
    panel.dataset.open = 'true';
    panel.dataset.edge = position.edge;
    trigger.dataset.active = 'true';
    localStorage.setItem('vite-asset-manager-open', 'true');
  }

  function close() {
    isOpen = false;
    overlay.dataset.open = 'false';
    panel.dataset.open = 'false';
    trigger.dataset.active = 'false';
    localStorage.setItem('vite-asset-manager-open', 'false');
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    hasMoved = false;
    dragStartPos = { x: e.clientX, y: e.clientY };
    container.dataset.dragging = 'true';
    container.style.transition = 'none';
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
    if (!hasMoved) return;

    container.style.left = 'auto';
    container.style.right = 'auto';
    container.style.top = e.clientY + 'px';
    container.style.transform = 'translateY(-50%)';

    if (e.clientX < window.innerWidth / 2) {
      container.style.left = '0';
      container.dataset.edge = 'left';
    } else {
      container.style.right = '0';
      container.dataset.edge = 'right';
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    container.dataset.dragging = 'false';
    container.style.transition = '';

    if (hasMoved) {
      position = snapToEdge(e.clientX, e.clientY);
      savePosition();
      applyPosition();
    }
  }

  trigger.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  trigger.addEventListener('click', () => {
    if (hasMoved) return;
    isOpen ? close() : open();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
    if (e.altKey && e.shiftKey && e.code === 'KeyA') {
      e.preventDefault();
      isOpen ? close() : open();
    }
  });

  applyPosition();
  if (isOpen) requestAnimationFrame(open);
})();
</script>
`

export function createAssetManagerPlugin(options: AssetManagerOptions = {}): Plugin {
  let config: ResolvedConfig
  let scanner: AssetScanner
  let importerScanner: ImporterScanner
  let duplicateScanner: DuplicateScanner
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
      duplicateScanner = new DuplicateScanner(config.root, resolvedOptions)
      thumbnailService = new ThumbnailService(resolvedOptions.thumbnailSize)

      setupMiddleware(server, {
        base: resolvedOptions.base,
        scanner,
        importerScanner,
        duplicateScanner,
        thumbnailService,
        root: config.root,
        launchEditor: resolvedOptions.launchEditor
      })

      scanner.init().then(async () => {
        await importerScanner.init()
        scanner.enrichWithImporterCounts(importerScanner)

        await duplicateScanner.init()
        await duplicateScanner.scanAssets(scanner.getAssets())
        scanner.enrichWithDuplicateInfo(duplicateScanner)

        if (resolvedOptions.watch) {
          duplicateScanner.initWatcher()
        }
      })

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
        scanner.on('change', async event => {
          await duplicateScanner.scanAssets(scanner.getAssets())
          scanner.enrichWithDuplicateInfo(duplicateScanner)
          broadcastSSE('asset-manager:update', event)
        })
        importerScanner.on('change', event => {
          scanner.enrichWithImporterCounts(importerScanner)
          broadcastSSE('asset-manager:importers-update', event)
        })
        duplicateScanner.on('change', event => {
          scanner.enrichWithDuplicateInfo(duplicateScanner)
          broadcastSSE('asset-manager:duplicates-update', event)
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
      duplicateScanner?.destroy()
    }
  }
}
