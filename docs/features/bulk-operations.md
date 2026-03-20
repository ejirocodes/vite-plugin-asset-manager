---
description: Multi-select assets to copy paths, download as ZIP, or bulk delete with Shift/Ctrl+click.
---

# Bulk Operations

Select multiple assets to perform batch actions like copying paths, downloading as ZIP, or bulk deleting.

## Selecting Assets

| Action | Behavior |
|--------|----------|
| **Click** | Select a single asset (deselects others) |
| <kbd>Shift</kbd> + **Click** | Select a range of assets |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + **Click** | Toggle individual asset selection |

When assets are selected, a bulk actions bar appears at the bottom of the dashboard.

## Available Actions

### Copy Paths

Copy the relative file paths of all selected assets to your clipboard, separated by newlines. Useful for batch operations in scripts or terminal commands.

### Download as ZIP

Download all selected assets as a single ZIP archive. The ZIP preserves the directory structure of the original files. Powered by the [Archiver](https://github.com/archiverjs/node-archiver) library.

### Bulk Delete

Delete all selected assets from disk. A confirmation dialog prevents accidental deletion.

::: danger
Bulk delete permanently removes files from your filesystem. This action cannot be undone.
:::
