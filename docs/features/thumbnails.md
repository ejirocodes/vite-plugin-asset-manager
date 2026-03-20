# Thumbnails

The plugin uses [Sharp](https://sharp.pixelplumbing.com/) for fast, high-quality thumbnail generation with dual-tier caching.

## Supported Formats

Thumbnails are generated for these image formats:

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.avif`
- `.gif`
- `.tiff` / `.tif`

SVG files are displayed inline without thumbnail generation. Other file types show a type-specific icon.

## Caching Strategy

Thumbnails use a dual-tier cache for optimal performance:

1. **Memory cache** — In-process Map for instant access to recently viewed thumbnails
2. **Disk cache** — Files stored in `os.tmpdir()` for persistence across server restarts

The cache key combines the file path hash, modification time (`mtime`), and file size. When a file changes, the stale thumbnail is automatically invalidated and regenerated on next access.

## Configuration

```ts
assetManager({
  thumbnails: true,    // Enable/disable (default: true)
  thumbnailSize: 200,  // Max width/height in px (default: 200)
})
```

### Disabling Thumbnails

If Sharp isn't available or you don't need image previews:

```ts
assetManager({
  thumbnails: false
})
```

::: tip
Sharp is listed as an external dependency. If you encounter installation issues, ensure your platform is supported by Sharp's prebuilt binaries.
:::
