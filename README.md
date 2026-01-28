# vite-plugin-asset-manager

A visual asset management dashboard for Vite projects. Discover, browse, and manage all your media assets through a real-time web UI.

![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![Vite](https://img.shields.io/badge/vite-%E2%89%A55.0.0-646CFF)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Asset Discovery** - Automatically scans and catalogs images, videos, audio, fonts, documents, and data files
- **Real-time Updates** - File changes reflected instantly via Server-Sent Events
- **Thumbnail Generation** - Sharp-powered thumbnails with dual-tier caching
- **Import Tracking** - See which files import each asset with click-to-open-in-editor
- **Duplicate Detection** - Content-based deduplication using MD5 hashing
- **Bulk Operations** - Multi-select for batch download (ZIP), copy paths, or delete
- **Keyboard Navigation** - Full keyboard support with vim-style bindings
- **Context Menu** - Right-click for quick actions (copy, reveal in Finder, delete, etc.)

## Installation

```bash
npm install vite-plugin-asset-manager -D
# or
pnpm add vite-plugin-asset-manager -D
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [assetManager()],
})
```

Start your dev server and visit `/__asset_manager__/` or press `⌥⇧A` (Option+Shift+A) to toggle the floating panel.

## Configuration

```ts
assetManager({
  base: '/__asset_manager__',     // Dashboard URL path
  include: ['src', 'public'],     // Directories to scan
  exclude: ['node_modules', '.git', 'dist'],
  thumbnailSize: 200,             // Thumbnail dimensions (px)
  floatingIcon: true,             // Show toggle button in host app
  watch: true,                    // Enable real-time updates
  launchEditor: 'code',           // Editor for "Open in Editor" (code, cursor, webstorm, vim, etc.)
})
```

## Vite Framework Support

- [ ] Vanilla
- [ ] Vue
- [ ] React
- [ ] Preact
- [ ] Lit
- [ ] Svelte
- [ ] Solid
- [ ] Qwik

## Asset Types

| Type | Extensions |
|------|------------|
| Image | png, jpg, jpeg, gif, svg, webp, avif, ico, bmp, tiff, heic |
| Video | mp4, webm, ogg, mov, avi |
| Audio | mp3, wav, flac, aac |
| Document | pdf, doc, docx, xls, xlsx, ppt, pptx |
| Font | woff, woff2, ttf, otf, eot |
| Data | json, csv, xml, yml, yaml, toml |
| Text | md, txt |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate grid | `←` `↑` `→` `↓` or `j`/`k` |
| Focus search | `/` |
| Close preview | `Escape` |
| Toggle selection | `Space` |
| Open preview | `Enter` |
| Select all | `⌘A` / `Ctrl+A` |
| Copy paths | `⌘C` / `Ctrl+C` |
| Open in editor | `⌘O` / `Ctrl+O` |
| Reveal in Finder | `⌘⇧R` / `Ctrl+Shift+R` |
| Delete | `Delete` / `Backspace` |

## API Endpoints

The plugin exposes these endpoints at `{base}/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assets` | GET | List all assets |
| `/assets/grouped` | GET | Assets grouped by directory |
| `/search?q=` | GET | Search by name/path |
| `/thumbnail?path=` | GET | Get image thumbnail |
| `/file?path=` | GET | Serve original file |
| `/stats` | GET | Asset statistics |
| `/importers?path=` | GET | Files importing the asset |
| `/duplicates?hash=` | GET | Assets with matching content hash |
| `/open-in-editor` | POST | Open file in editor |
| `/reveal-in-finder` | POST | Reveal in system file explorer |
| `/bulk-download` | POST | Download as ZIP |
| `/bulk-delete` | POST | Delete multiple assets |
| `/events` | GET | SSE stream for real-time updates |

## Development

```bash
pnpm install          # Install dependencies
pnpm run build        # Build UI + plugin
pnpm run dev          # Watch mode

# Testing
pnpm run test         # Run all tests
pnpm run test:watch   # Watch mode
pnpm run test:coverage

# Playground
cd playground && pnpm run dev
```

## License

[MIT](LICENSE)
