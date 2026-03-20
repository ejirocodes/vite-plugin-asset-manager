---
description: Complete reference for all Vite Asset Manager plugin options including paths, thumbnails, editor integration, and path aliases.
---

# Configuration

All options are optional. The plugin works out of the box with sensible defaults.

## Full Example

```ts
import { defineConfig } from 'vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    assetManager({
      base: '/__asset_manager__',
      include: ['src', 'public'],
      exclude: ['node_modules', '.git', 'dist'],
      thumbnails: true,
      thumbnailSize: 200,
      watch: true,
      floatingIcon: true,
      launchEditor: 'code',
      debug: false,
      aliases: { '@/': 'src/' },
    })
  ]
})
```

## Options Reference

### `base`

- **Type:** `string`
- **Default:** `'/__asset_manager__'`

Base URL path for the asset manager dashboard and API.

```ts
assetManager({
  base: '/__assets__' // Dashboard at http://localhost:5173/__assets__/
})
```

### `include`

- **Type:** `string[]`
- **Default:** `['src', 'public']`

Directories to scan for assets, relative to the project root.

```ts
assetManager({
  include: ['src', 'public', 'assets', 'static']
})
```

### `exclude`

- **Type:** `string[]`
- **Default:** `['node_modules', '.git', 'dist', '.cache', 'coverage']`

Directories to exclude from scanning.

```ts
assetManager({
  exclude: ['node_modules', '.git', 'dist', '.cache', 'coverage', 'tmp']
})
```

### `extensions`

- **Type:** `string[]`
- **Default:** See [supported extensions](#supported-extensions)

File extensions to include in scanning. The default covers images, videos, audio, documents, fonts, data, and text files.

```ts
assetManager({
  extensions: ['.png', '.jpg', '.svg', '.webp'] // Only scan for these
})
```

### `thumbnails`

- **Type:** `boolean`
- **Default:** `true`

Enable Sharp-powered thumbnail generation for image assets. Thumbnails are cached in a dual-tier system (memory + disk in OS temp directory).

```ts
assetManager({
  thumbnails: false // Disable thumbnail generation
})
```

::: info
Thumbnails are generated for: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.tiff`. SVG files are displayed inline without thumbnail generation.
:::

### `thumbnailSize`

- **Type:** `number`
- **Default:** `200`

Maximum width/height in pixels for generated thumbnails.

```ts
assetManager({
  thumbnailSize: 300
})
```

### `watch`

- **Type:** `boolean`
- **Default:** `true`

Enable file watching for real-time updates. When enabled, the dashboard updates automatically when assets are added, modified, or deleted.

```ts
assetManager({
  watch: false // Disable real-time updates
})
```

### `floatingIcon`

- **Type:** `boolean`
- **Default:** `true`

Inject a floating icon button into your app that opens the asset manager panel. The icon is draggable and remembers its position via localStorage.

```ts
assetManager({
  floatingIcon: false // Only access via direct URL
})
```

### `launchEditor`

- **Type:** `EditorType`
- **Default:** `'code'` (Visual Studio Code)

Editor to open when clicking "Open in Editor" on an asset or importer.

```ts
assetManager({
  launchEditor: 'cursor' // Open in Cursor
})
```

Supported editors:

| Value | Editor |
|-------|--------|
| `'code'` | Visual Studio Code |
| `'code-insiders'` | VS Code Insiders |
| `'cursor'` | Cursor |
| `'codium'` | VSCodium |
| `'webstorm'` | WebStorm |
| `'idea'` | IntelliJ IDEA |
| `'sublime'` | Sublime Text |
| `'vim'` | Vim |
| `'emacs'` | Emacs |
| `'atom'` | Atom |
| `'notepad++'` | Notepad++ |

You can also pass any custom editor command as a string.

### `debug`

- **Type:** `boolean`
- **Default:** `false`

Enable debug logging to diagnose path and scanning issues. When enabled, the plugin outputs root path, include patterns, and files found to the console.

```ts
assetManager({
  debug: true // Enable verbose logging
})
```

### `aliases`

- **Type:** `Record<string, string>`
- **Default:** `{ '@/': 'src/' }`

Path aliases used by the importer scanner to resolve imports. This should match the path aliases in your `tsconfig.json` or Vite config.

```ts
// For Nuxt 4 directory structure
assetManager({
  aliases: { '@/': 'app/', '~/': '' }
})

// For a custom structure
assetManager({
  aliases: { '@/': 'src/', '@assets/': 'src/assets/' }
})
```

## Supported Extensions {#supported-extensions}

The default `extensions` array includes:

| Category | Extensions |
|----------|-----------|
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.avif`, `.ico`, `.bmp`, `.tiff`, `.tif`, `.heic`, `.heif` |
| **Videos** | `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi` |
| **Audio** | `.mp3`, `.wav`, `.flac`, `.aac` |
| **Documents** | `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| **Text/Data** | `.json`, `.md`, `.txt`, `.csv`, `.yml`, `.yaml`, `.toml`, `.xml` |
| **Fonts** | `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot` |

## Keyboard Shortcuts

These work when the asset manager panel is open:

| Shortcut | Action |
|----------|--------|
| <kbd>Option</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> | Toggle asset manager panel |
| <kbd>Escape</kbd> | Close the panel |
