---
description: How Vite Asset Manager discovers and catalogues assets using fast-glob and chokidar with real-time file watching.
---

# Asset Scanning

The plugin uses [fast-glob](https://github.com/mrmlnc/fast-glob) for initial directory scanning and [chokidar](https://github.com/paulmillr/chokidar) for real-time file watching.

## How It Works

On dev server startup, the scanner:

1. Reads your `include` directories relative to the project root
2. Filters files by configured `extensions`
3. Excludes directories matching `exclude` patterns
4. Catalogues each file with metadata (size, mtime, type, path)
5. Starts watching for changes if `watch: true`

## Asset Types

Files are categorized by extension:

| Type | Extensions |
|------|-----------|
| **Image** | png, jpg, jpeg, gif, svg, webp, avif, ico, bmp, tiff, heic, heif |
| **Video** | mp4, webm, ogg, mov, avi |
| **Audio** | mp3, wav, flac, aac |
| **Font** | woff, woff2, ttf, otf, eot |
| **Document** | pdf, doc, docx, xls, xlsx, ppt, pptx |
| **Data** | json, xml, csv, yml, yaml, toml |
| **Text** | md, txt, html, css |

## Real-Time Updates

When `watch: true` (the default), file changes trigger SSE events that update the dashboard in real-time:

- **File added** - new asset card appears
- **File modified** - metadata and thumbnail refresh
- **File deleted** - asset card removed

The watcher uses a 100ms debounce to batch rapid changes.

## Directory Configuration

```ts
assetManager({
  include: ['src', 'public', 'assets'],
  exclude: ['node_modules', '.git', 'dist'],
})
```

Paths in `include` are relative to the project root. The scanner walks directories recursively.

## Asset Grouping

In the dashboard, assets can be viewed grouped by directory. Each group shows the directory path and the count of assets within it.
