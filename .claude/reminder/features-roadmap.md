# Features Roadmap

## Completed Features

All high and medium priority features are implemented. See `architecture.md` for implementation details.

- Test infrastructure (16 files: 6 server + 10 UI)
- Sidebar type filtering (9 categories)
- Asset sorting (8 sort options)
- Keyboard navigation (arrow keys, vim-style, shortcuts)
- Bulk operations (multi-select, ZIP download, bulk delete)
- Advanced filters (size/date/extension presets)
- Duplicate detection (MD5 content hashing, real-time updates)
- Context menu (7 actions, split into 3 focused hooks)
- Importers detection (regex-based, click-to-open-in-editor)
- Unused asset detection (badge, sidebar filter, stats)
- Ignored assets (localStorage-persisted hiding)
- Virtual scrolling (@tanstack/react-virtual)
- Performance optimizations (code splitting, lazy loading, Vercel best practices)
- Responsive design (mobile-first, 320px to 4K+, WCAG 2.1 AAA)
- Floating icon (draggable, resizable, edge snapping, keyboard shortcuts)
- Embedded mode detection
- Debug & aliases configuration
- TanStack Start playground
- Next.js integration (nextjs-asset-manager package)
- Nuxt module (@vite-asset-manager/nuxt)

---

## Remaining Roadmap

### Near-term
- Custom size/date ranges (currently presets only)
- Image dimension filtering
- Drag-and-drop upload
- Asset optimization suggestions (oversized images, format recommendations)

### Future Consideration
- Video/audio metadata display (duration, codec, bitrate)
- Audio waveform visualization
- PDF full preview (page navigation, zoom)
- Font preview enhancement (variable fonts, glyph browser)
- Asset usage analytics (charts, breakdowns)
- Export capabilities (JSON, CSV, Markdown)
- Thumbnail format options (WebP, AVIF, quality slider)
- Custom file type support (plugin-based)
- Performance monitoring panel
- Accessibility improvements (screen reader, high contrast)
- Internationalization (i18n, RTL)
- Asset comparison view (side-by-side)
- Favorites/bookmarks
- Recent assets view

---

## Implementation Notes

### Breaking Changes to Avoid
- Keep existing API endpoint signatures stable
- Maintain backward compatibility in options
- Don't change asset ID encoding scheme

### Testing New Features
- Use playgrounds for manual testing (11 frameworks)
- Document breaking changes clearly
