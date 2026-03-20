# Duplicate Detection

Content-based duplicate detection helps you find redundant assets across your project using MD5 hashing.

## How It Works

The duplicate scanner:

1. Computes an MD5 hash of each asset's file contents
2. Uses streaming for large files to avoid memory issues
3. Groups files with identical content hashes
4. Caches results by file `mtime` and `size` for efficiency

Two files are considered duplicates if their content is byte-for-byte identical, even if they have different names or are in different directories.

## Dashboard Integration

- **Badge** — Asset cards show a duplicate count badge when duplicates exist
- **Preview Panel** — The duplicates section in the preview panel lists all files sharing the same content hash
- **Stats** — The sidebar shows the total number of duplicate groups and duplicate files

## Finding Duplicates

1. Open the asset manager dashboard
2. Look for asset cards with a duplicate badge (e.g., "2 duplicates")
3. Click an asset to open the preview panel
4. Scroll to the "Duplicates" section to see all matching files

::: tip
Duplicate detection runs on first scan and updates in real-time as files change. The initial scan may take a moment for large projects due to content hashing.
:::
