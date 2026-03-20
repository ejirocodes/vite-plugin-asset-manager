# Importer Detection

The plugin tracks which source files import each asset, helping you understand asset usage across your codebase.

## Detected Import Patterns

The importer scanner uses regex-based detection (not AST parsing) for performance. It detects:

| Pattern | Example |
|---------|---------|
| **ES import** | `import logo from './logo.png'` |
| **Dynamic import** | `import('./assets/icon.svg')` |
| **require()** | `require('./image.jpg')` |
| **CSS url()** | `background: url('./bg.png')` |
| **HTML src** | `<img src="./photo.jpg">` |
| **HTML href** | `<link href="./style.css">` |

## Path Alias Resolution

The scanner resolves path aliases to find imports that use shorthand paths:

```ts
// This import:
import logo from '@/assets/logo.png'

// Is resolved using the configured aliases:
assetManager({
  aliases: { '@/': 'src/' }
})
```

## Unused Assets

Assets with zero importers are marked as "unused" in the dashboard:

- **Badge** - A visual indicator on the asset card
- **Sidebar filter** - Filter to show only unused assets
- **Stats** - The sidebar shows the total count of unused assets

This helps identify assets that can be safely removed to reduce project size.

## Open in Editor

Click on any importer in the preview panel to open the importing file in your configured editor at the exact line and column where the import occurs.

```ts
assetManager({
  launchEditor: 'code' // Opens VS Code at the import location
})
```
