# UI Audit Report: Vite Plugin Asset Manager

**Date**: 2026-02-28
**Scope**: `src/ui/` — React dashboard, components, hooks, styles

---

## Anti-Patterns Verdict

**PASS** — This does **not** look AI-generated. The UI makes deliberate, context-appropriate choices:

- No gradient text, no glassmorphism abuse, no hero metrics section. The violet/purple primary is a single intentional accent, not the classic "purple gradient on white" AI slop.
- **Figtree font** is a distinctive choice, not Inter/Roboto/Arial.
- No card grid as decoration — the card grid here is a functional asset browser, not decorative "feature cards."
- **Noise texture overlay** is subtle (3% opacity) and adds character without being gimmicky.
- **Functional minimalism** — the design serves the tool's purpose as a dev dashboard without pretending to be a marketing page.

One minor tell: the `from-violet-500 to-purple-600` gradient on the logo icon is a common pattern, but it's a small element and contextually appropriate for a branded accent.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 5 |
| Medium | 8 |
| Low | 6 |
| **Total** | **20** |

**Top 5 Most Critical Issues:**

1. **Tab key trapped in grid** — `useKeyboardNavigation` intercepts Tab/Shift+Tab, preventing users from tabbing to other page elements (Critical, A11y)
2. **Hard-coded colors throughout components** — ~40+ instances of Tailwind color classes (`zinc-*`, `violet-*`, `amber-*`) bypassing CSS variables (High, Theming)
3. **Checkerboard pattern hard-codes light/dark colors** — `#e4e4e7` / `#fafafa` in light, `#27272a` / `#18181b` in dark, won't adapt to custom themes (High, Theming)
4. **PreviewPanel lacks focus trap** — Panel is a modal-like overlay but doesn't trap focus, allowing keyboard users to tab behind it (High, A11y)
5. **Group expand/collapse uses `max-h-500`** — Fixed max-height causes animation jump for groups with more or fewer items (High, Performance)

**Overall Quality Score: 8/10** — This is a well-built, production-ready dashboard with strong foundations in accessibility, performance, and responsive design. Issues are mostly polish-level refinements.

---

## Detailed Findings by Severity

### Critical Issues

#### 1. Tab Key Trapped in Asset Grid

- **Location**: `src/ui/hooks/useKeyboardNavigation.ts:170-182`
- **Category**: Accessibility
- **Description**: When `isGridFocused` is true, Tab and Shift+Tab are captured with `e.preventDefault()` and used to cycle focus within the grid. This creates a **keyboard trap** — users cannot Tab out of the grid to reach other interactive elements (sidebar, filters, sort controls, preview panel).
- **Impact**: Violates WCAG 2.1 SC 2.1.2 "No Keyboard Trap" (Level A). Keyboard-only users get stuck in the grid.
- **WCAG**: 2.1.2 No Keyboard Trap (Level A)
- **Recommendation**: Remove Tab/Shift+Tab interception. Use arrow keys for grid navigation (already implemented) and let Tab follow natural DOM order. Or provide a documented Escape key to exit the grid trap (partially exists but isn't communicated to users).
- **Suggested command**: `/harden`

---

### High-Severity Issues

#### 2. Hard-Coded Colors Bypass Design Tokens

- **Location**: Multiple files
  - `asset-card.tsx:101-107` — `bg-white/80`, `dark:bg-zinc-900/50`, `border-zinc-200`, `ring-violet-500/70`, `ring-blue-500`
  - `asset-card.tsx:127` — `bg-zinc-100 dark:bg-zinc-950/50`
  - `asset-card.tsx:148,151,170,181-204` — Multiple `zinc-*`, `amber-*`, `blue-*`, `emerald-*` classes
  - `side-bar.tsx:22-32` — Entire `colorClasses` map uses hard-coded Tailwind colors
  - `file-icon.tsx:29-76` — All 35+ icon color mappings use hard-coded colors
  - `side-bar.tsx:61-78` — SSE status dots use `bg-amber-500`, `bg-emerald-500`, `bg-zinc-500`
- **Category**: Theming
- **Description**: Approximately 40+ instances of hard-coded Tailwind color utilities that don't reference CSS custom properties. While the design system defines `--primary`, `--muted`, `--border`, etc., many components use raw colors like `zinc-200`, `violet-500`, `amber-400`.
- **Impact**: Theming inconsistency. If the design system palette changes, these colors won't update. Dark mode works via manual `dark:` variants, which is fragile and duplicates logic.
- **Recommendation**: Replace semantic uses with CSS variable-backed utilities. For categorical colors (file type colors, status indicators), consider defining them as CSS custom properties (e.g., `--color-type-image`, `--color-status-connected`).
- **Suggested command**: `/normalize`

#### 3. Checkerboard Pattern Uses Hard-Coded Hex Colors

- **Location**: `src/ui/styles/globals.css:177-194`
- **Category**: Theming
- **Description**: The `.checkerboard` class uses inline hex values (`#e4e4e7`, `#fafafa` for light; `#27272a`, `#18181b` for dark) in CSS `linear-gradient()` patterns. These don't reference any CSS variables.
- **Impact**: If the theme palette changes, the checkerboard background won't match, creating a visual mismatch in image preview areas.
- **Recommendation**: Replace with CSS variable references or generate the checkerboard pattern dynamically from token values.
- **Suggested command**: `/normalize`

#### 4. PreviewPanel Lacks Focus Trap

- **Location**: `src/ui/components/preview-panel/index.tsx:120-180`
- **Category**: Accessibility
- **Description**: The preview panel renders as a `fixed` overlay (`z-50`) that covers a significant portion of the screen. It sets initial focus on the close button (good), but doesn't trap focus within itself. Users can Tab behind the panel to interact with invisible elements.
- **Impact**: Confusing for keyboard and screen reader users. Focus may land on elements obscured by the panel.
- **WCAG**: 2.4.3 Focus Order (Level A)
- **Recommendation**: Add a focus trap using a library like `focus-trap-react` or implement one manually. Ensure the panel behaves like a modal for keyboard users.
- **Suggested command**: `/harden`

#### 5. Group Expand/Collapse Uses Fixed `max-h-500`

- **Location**: `src/ui/App.tsx:548`
- **Category**: Performance / UX
- **Description**: `max-h-500` (Tailwind = `500 * 0.25rem = 125rem = 2000px`) is used for the expand/collapse animation. Groups with content taller than 2000px will be clipped. Groups with much less content will have a noticeable "delay" in the CSS transition because the browser animates from `max-h-0` to `max-h-500` even if the actual height is only 300px.
- **Impact**: Animation feels sluggish for small groups and clips content for very large groups.
- **Recommendation**: Use `grid-template-rows: 0fr → 1fr` technique or JavaScript-measured height for smooth, content-aware animations.
- **Suggested command**: `/optimize`

#### 6. StatBadge Lacks Focus-Visible Ring Offset

- **Location**: `src/ui/components/side-bar.tsx:363`
- **Category**: Accessibility
- **Description**: `StatBadge` uses `focus-visible:brightness-125` instead of a visible focus ring. The brightness change is subtle and may not meet contrast requirements on some displays. The `NavItem` component (same file) has no explicit focus styles at all.
- **Impact**: Keyboard users may struggle to identify which sidebar item is focused.
- **WCAG**: 2.4.7 Focus Visible (Level AA)
- **Recommendation**: Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to both `StatBadge` and `NavItem`.
- **Suggested command**: `/harden`

---

### Medium-Severity Issues

#### 7. `pulse-glow` Animation Uses Hard-Coded rgba

- **Location**: `src/ui/styles/globals.css:221-227`
- **Category**: Theming
- **Description**: The `pulse-glow` keyframes use `rgba(139, 92, 246, 0.15)` (violet-500) directly in the animation. This won't adapt to theme changes.
- **Recommendation**: Use `hsl(var(--primary) / 0.15)` or the oklch equivalent.

#### 8. `hover-lift` Box Shadow Hard-Coded

- **Location**: `src/ui/styles/globals.css:258`
- **Category**: Theming
- **Description**: `box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.4)` is always black regardless of theme. In light mode this is fine, but in dark mode a subtler shadow or glow might be more appropriate.
- **Recommendation**: Define shadow values as CSS variables that adapt to dark mode.

#### 9. Context Menu Keyboard Shortcuts Show macOS Only

- **Location**: `src/ui/components/asset-context-menu.tsx:144,151,182`
- **Category**: UX
- **Description**: Shortcut hints display `⌘O`, `⌘⇧R`, and `⌫` which are macOS symbols. On Windows/Linux, these should show `Ctrl+O`, `Ctrl+Shift+R`, and `Del`.
- **Impact**: Non-macOS users see unfamiliar shortcut symbols.
- **Recommendation**: Use the `isMac` detection already present on line 51 to conditionally render platform-appropriate shortcut labels.
- **Suggested command**: `/harden`

#### 10. SearchBar Input Missing `aria-label`

- **Location**: `src/ui/components/search-bar.tsx:28-42`
- **Category**: Accessibility
- **Description**: The search input relies on `placeholder` text ("Search assets...") for identification. Placeholders disappear when typing and are not a substitute for labels.
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Recommendation**: Add `aria-label="Search assets"` to the input element.

#### 11. `role="status"` Live Region May Be Too Verbose

- **Location**: `src/ui/App.tsx:388`
- **Category**: Accessibility
- **Description**: The live region announces both focus changes ("Focused on filename") and selection counts. During rapid arrow-key navigation, this could produce excessive screen reader output.
- **Recommendation**: Debounce focus announcements (e.g., 300ms delay) so rapid navigation doesn't flood the screen reader.

#### 12. Legacy CSS Variables Are Unused

- **Location**: `src/ui/styles/globals.css:29-34, 117-122`
- **Category**: Theming
- **Description**: Variables like `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--text-primary`, `--text-secondary`, `--text-muted` are defined in both light and dark modes but appear unused. The components use the shadcn-style variables (`--background`, `--foreground`, etc.) instead.
- **Impact**: Dead code in CSS. Could confuse contributors.
- **Recommendation**: Audit usage and remove if truly unused.
- **Suggested command**: `/simplify`

#### 13. Copy Import Code Shows "Copied" on All Sub-Items

- **Location**: `src/ui/components/asset-context-menu.tsx:117-134`
- **Category**: UX
- **Description**: When any "Copy Import Code" sub-menu item is clicked, the `copyCodeState === 'copied'` check shows the checkmark on ALL three sub-items (HTML, React, Vue) simultaneously, because they share the same state.
- **Impact**: Unclear which format was actually copied.
- **Recommendation**: Track which specific format was copied, or show the checkmark only on the clicked item.

#### 14. BulkActionsBar Select All/Deselect Button Missing `aria-label`

- **Location**: `src/ui/components/bulk-actions-bar.tsx:107-118`
- **Category**: Accessibility
- **Description**: The checkbox toggle button uses `title` but no `aria-label`. Screen readers may not announce the button purpose clearly.
- **Recommendation**: Add `aria-label={allSelected ? 'Deselect all assets' : 'Select all assets'}`.

---

### Low-Severity Issues

#### 15. Font Loading Not Managed

- **Location**: `src/ui/styles/globals.css:76, 312`
- **Category**: Performance
- **Description**: Figtree and JetBrains Mono fonts are referenced but their loading strategy isn't visible in the CSS. If loaded from Google Fonts, there's no `font-display: swap` or preconnect optimization.
- **Recommendation**: Ensure `font-display: swap` is set and `<link rel="preconnect">` is in the HTML head.

#### 16. `formatBytesCache` Has No Size Limit

- **Location**: `src/ui/components/asset-card.tsx:20-35`
- **Category**: Performance
- **Description**: The `formatBytesCache` Map grows unboundedly. With thousands of unique file sizes, this could retain significant memory.
- **Impact**: Minimal in practice (file sizes are small strings), but technically a memory leak.
- **Recommendation**: Use an LRU cache or accept the trade-off (file sizes tend to cluster around common values).

#### 17. Sidebar `LightningIcon` Missing Explicit Color

- **Location**: `src/ui/components/side-bar.tsx:104`
- **Category**: Theming
- **Description**: `<LightningIcon weight="fill" />` inside the violet gradient box has no explicit `className` for color. It inherits via SVG fill, but in the header (`App.tsx:460`), the same icon has explicit `text-white`. Inconsistent.
- **Recommendation**: Add explicit `className="w-5 h-5 text-white"` for consistency.

#### 18. `hover-lift` Class Defined But Unused

- **Location**: `src/ui/styles/globals.css:252-259`
- **Category**: Performance
- **Description**: The `.hover-lift` utility class is defined in globals.css but doesn't appear to be used in any component.
- **Recommendation**: Verify usage; remove if dead code.
- **Suggested command**: `/simplify`

#### 19. AssetGrid Padding Creates Width Inconsistency

- **Location**: `src/ui/components/asset-grid.tsx:55`
- **Category**: Responsive Design
- **Description**: `className="px-6 pt-4"` uses fixed padding, while the parent container in `App.tsx:501` uses responsive padding `p-3 sm:p-4 md:p-6`. On small screens, the grid has more padding than its parent.
- **Recommendation**: Align grid padding with the responsive scale used by its parent.

#### 20. Duplicate `h1` Elements

- **Location**: `src/ui/components/side-bar.tsx:111` and `src/ui/App.tsx:463`
- **Category**: Accessibility
- **Description**: Both the sidebar and the mobile header contain `<h1>ASSET MANAGER</h1>`. While only one is visible at a time (sidebar hidden on mobile, header hidden on desktop), having two `h1` elements in the DOM simultaneously is technically invalid heading hierarchy.
- **WCAG**: 1.3.1 Info and Relationships (Level A, minor)
- **Recommendation**: Use `h1` only in one location and `aria-hidden="true"` on the other, or use `<span>` with `role="heading" aria-level="1"` conditionally.

---

## Patterns & Systemic Issues

1. **Hard-coded Tailwind colors in ~6 component files** — The design system defines CSS variables but many components bypass them. This is the most pervasive issue.
2. **Focus styles inconsistent across interactive elements** — Some use `.focus-ring`, some use `focus-visible:ring-2`, some use `focus-visible:brightness-*`, and some (`NavItem`) have none.
3. **Platform detection scattered** — `isMac` detection appears in 3 places (`asset-context-menu.tsx:51`, `App.tsx:315`, `useKeyboardNavigation.ts:57`) using the same regex but not shared.
4. **Delete confirmation dialog duplicated** — The same AlertDialog pattern appears in `App.tsx`, `bulk-actions-bar.tsx`, and `asset-context-menu.tsx` with nearly identical markup.

---

## Positive Findings

1. **Virtual scrolling**: `useVirtualGrid` + `@tanstack/react-virtual` handles large asset collections efficiently with only visible rows rendered.
2. **Comprehensive keyboard navigation**: The `useKeyboardNavigation` hook covers arrow keys, vim bindings, and all major actions. This is above-average for a dev tool.
3. **Screen reader live region**: `role="status" aria-live="polite"` for focus and selection announcements shows genuine accessibility investment.
4. **Touch target enforcement**: `@media (pointer: coarse)` rule ensuring 44x44px minimums is production-quality.
5. **`prefers-reduced-motion`**: Full motion reduction support in globals.css.
6. **Code splitting**: 89% main bundle reduction through manual chunk splitting is excellent.
7. **SSE singleton pattern**: Shared EventSource connection prevents duplicate connections across hooks.
8. **Memoization discipline**: `React.memo` on all major components + `useCallback`/`useMemo` throughout shows performance awareness.
9. **Responsive design**: Dynamic column calculation via `useResponsiveColumns` with ResizeObserver is robust.
10. **Semantic HTML**: Proper use of `<nav>`, `<aside>`, `<main>`, `<header>`, `role="grid"`, `role="gridcell"`, `aria-selected`.

---

## Recommendations by Priority

### Immediate (Critical Blockers)

1. Fix the Tab key trap in `useKeyboardNavigation` — WCAG Level A violation

### Short-term (This Sprint)

2. Add focus trap to PreviewPanel
3. Add visible focus rings to `StatBadge` and `NavItem`
4. Add `aria-label` to SearchBar input
5. Fix platform-specific keyboard shortcut labels in context menu
6. Fix "Copied" indicator showing on all sub-menu items

### Medium-term (Next Sprint)

7. Extract hard-coded colors to CSS custom properties (biggest systemic change)
8. Replace `max-h-500` animation with content-aware technique
9. Remove legacy CSS variables if unused
10. Deduplicate delete confirmation dialog into a shared component
11. Create shared `usePlatformDetection` hook

### Long-term (Nice-to-haves)

12. Debounce screen reader announcements during rapid navigation
13. Font loading optimization (preconnect, font-display)
14. Audit and remove unused CSS utilities
15. Consider LRU cache for `formatBytesCache`

---

## Suggested Commands for Fixes

| Command | Issues Addressed | Count |
|---------|-----------------|-------|
| `/harden` | Tab trap, focus trap, focus rings, aria-labels, platform shortcuts, SR announcements | 7 |
| `/normalize` | Hard-coded colors, checkerboard, pulse-glow, hover-lift shadow, legacy variables | 6 |
| `/optimize` | max-h-500 animation, font loading, formatBytesCache, grid padding | 4 |
| `/simplify` | Legacy CSS variables, unused hover-lift, duplicate dialog, duplicate `isMac` | 4 |

**Recommended sequence**: `/harden` first (accessibility fixes are highest priority), then `/normalize` (theming consistency), then `/optimize` and `/simplify`.