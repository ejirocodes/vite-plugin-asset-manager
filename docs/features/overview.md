---
description: Overview of all Vite Asset Manager features including scanning, thumbnails, duplicate detection, bulk operations, and keyboard navigation.
---

# Features Overview

Vite Asset Manager provides a comprehensive set of features for managing media assets in your Vite projects.

## Asset Discovery

The plugin automatically scans your configured directories and catalogues all media assets by type - images, videos, audio, fonts, documents, data files, and text files. Assets are displayed in a searchable, filterable grid with thumbnail previews.

[Learn more about Asset Scanning →](/features/asset-scanning)

## Thumbnail Generation

Sharp-powered thumbnail generation with dual-tier caching (memory + disk) provides instant previews for image assets. Supports jpg, jpeg, png, webp, avif, gif, and tiff formats.

[Learn more about Thumbnails →](/features/thumbnails)

## Duplicate Detection

Content-based MD5 hashing identifies files with identical content across your project, even if they have different names. Helps reduce bundle size by finding redundant assets.

[Learn more about Duplicate Detection →](/features/duplicate-detection)

## Bulk Operations

Multi-select assets with <kbd>Shift</kbd>+click or <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+click to perform bulk actions: copy paths, download as ZIP, or bulk delete.

[Learn more about Bulk Operations →](/features/bulk-operations)

## Keyboard Navigation

Full keyboard support with arrow keys, vim-style <kbd>j</kbd>/<kbd>k</kbd> navigation, and shortcuts for all actions. Navigate, preview, and manage assets without touching the mouse.

[Learn more about Keyboard Navigation →](/features/keyboard-navigation)

## Advanced Filters

Filter assets by size (small, medium, large), modification date (today, last 7 days, last 30 days), and file extension. Combine with search for precise asset discovery.

[Learn more about Advanced Filters →](/features/advanced-filters)

## Virtual Scrolling

Powered by `@tanstack/react-virtual`, the dashboard handles hundreds of assets smoothly by only rendering visible rows plus a buffer. No performance degradation regardless of asset count.

[Learn more about Virtual Scrolling →](/features/virtual-scrolling)

## Importer Detection

See which source files import each asset. The plugin scans for ES imports, dynamic imports, `require()`, CSS `url()`, and HTML `src`/`href` attributes. Click to open the importing file in your editor.

[Learn more about Importer Detection →](/features/importers)

## Real-Time Updates

File changes are reflected instantly in the dashboard via Server-Sent Events (SSE). Add, modify, or delete assets and see the changes without refreshing.

## Unused Asset Detection

Assets with no importers are marked as unused. Filter by unused status in the sidebar to find assets that can be safely removed.

## Context Menu

Right-click any asset card for quick actions: preview, copy path, copy import code, reveal in Finder/Explorer, open in editor, or delete.
