# Virtual Scrolling

The dashboard uses [@tanstack/react-virtual](https://tanstack.com/virtual/latest) for row-based virtualization, ensuring smooth performance with any number of assets.

## How It Works

Instead of rendering every asset card in the DOM, virtual scrolling:

1. Calculates which rows are currently visible in the viewport
2. Renders only those rows plus a 2-row buffer above and below
3. Recalculates on scroll, resize, or filter changes

This means a project with 500 assets might only render 20-30 cards at a time, regardless of the total count.

## Responsive Columns

The grid automatically adapts the number of columns based on viewport width using the `useResponsiveColumns` hook:

| Viewport | Columns |
|----------|---------|
| < 640px | 2 |
| 640px – 1024px | 3–4 |
| 1024px – 1440px | 4–5 |
| > 1440px | 5–6 |

## Performance

- **Initial render** — Only visible rows are rendered
- **Scrolling** — Smooth 60fps scrolling with buffer rows preventing flicker
- **Filtering** — Instant client-side filtering without re-fetching
- **Memory** — Constant DOM node count regardless of total assets
