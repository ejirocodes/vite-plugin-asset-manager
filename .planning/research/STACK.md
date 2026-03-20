# Technology Stack

**Project:** Vite Plugin Asset Manager Documentation Site
**Researched:** 2026-03-20

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| VitePress | ^1.6.4 | Static site generator | Vite ecosystem alignment, Vue-based custom components, built-in Shiki syntax highlighting, Markdown-first with full Vue SFC support. The plugin is a Vite plugin — the docs should use VitePress, not Docusaurus or Starlight. | HIGH |
| Vue 3 | ^3.5 (peer dep of VitePress) | Custom landing page components | VitePress is Vue-powered; custom components use Vue SFCs natively. No additional framework needed. | HIGH |
| Node.js | >=22 | Runtime | Matches existing project constraint in package.json | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| UnoCSS | ^66.x | Utility CSS for custom components | UnoCSS is the Vite ecosystem standard for docs — used by Vite, Vitest, VueUse, Pinia, Rollup official docs. Lighter and faster than Tailwind in a VitePress context. Ships as a Vite plugin with zero PostCSS config. Tailwind v4 works too, but UnoCSS is the community-proven choice for VitePress specifically. | MEDIUM |
| VitePress default theme CSS | built-in | Base documentation styling | VitePress ships a well-designed default theme with CSS variables. Extend it, do not replace it. Custom landing page styles layer on top. | HIGH |

**Note on UnoCSS vs Tailwind:** The main plugin's UI already uses Tailwind v4. For the docs site, UnoCSS is recommended because (a) the docs site is isolated in `docs/` with its own deps, (b) UnoCSS integrates more cleanly with VitePress via Vite plugin, and (c) the Vite ecosystem docs all use it. If the team strongly prefers Tailwind for consistency, Tailwind v4 with `@tailwindcss/vite` works fine — it is not a blocking choice.

### Animation (Landing Page)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| CSS animations + Vue transitions | built-in | Landing page entrance animations | For a docs landing page, CSS `@keyframes` and Vue's `<Transition>` / `<TransitionGroup>` are sufficient. No external animation library needed. Keeps bundle minimal and avoids SSR hydration issues. | HIGH |

**Why NOT motion-v or @vueuse/motion:** These are overkill for a landing page with fade-ins and slide-ups. They add bundle weight and SSR complexity for effects achievable with 20 lines of CSS. Reserve animation libraries for apps with gesture-driven or physics-based motion.

### Code Highlighting & Developer Experience

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Shiki | built-in (VitePress) | Syntax highlighting | VitePress uses Shiki natively. Zero config. Supports dual themes, line highlighting, code groups, and diffs out of the box. | HIGH |
| @shikijs/vitepress-twoslash | ^2.x | TypeScript hover types in code blocks | Shows type information on hover in code examples — makes TypeScript API docs significantly better. Used by major Vite ecosystem projects. Worth the setup cost for a plugin that exposes a TypeScript API. | MEDIUM |

### Content & Markdown Plugins

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| VitePress built-in markdown extensions | built-in | Code groups, custom containers, line highlighting | VitePress ships with code groups (tabbed code blocks), custom containers (tip/warning/danger), frontmatter, and table of contents. No plugins needed for these. | HIGH |
| markdown-it (via VitePress) | built-in | Markdown processing | VitePress uses markdown-it internally. Custom markdown-it plugins can be added in `.vitepress/config.mts` for any edge cases. | HIGH |

### Interactive Demo

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| iframe embed | N/A | Live demo of asset manager dashboard in hero section | Per PROJECT.md, the hero features an embedded iframe of the running dashboard. This is the simplest and most reliable approach — no complex playground setup. Host the demo on a separate Vercel deployment or same deployment at a subpath. | HIGH |

**Why NOT Sandpack/Vue REPL:** The plugin is not a UI component library — it is a Vite dev server plugin. You cannot meaningfully run it in a browser sandbox. An iframe pointing to a hosted instance of a playground is the correct approach.

### Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting and CDN | Zero-config VitePress detection, preview deploys for PRs, immutable asset caching, fast global CDN. Matches PROJECT.md constraint. | HIGH |

### Search

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| VitePress local search | built-in | Full-text search | VitePress ships MiniSearch-based local search. No external service needed. Sufficient for a docs site this size. Algolia DocSearch is out of scope per PROJECT.md. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| unplugin-vue-components | ^28.x | Auto-import Vue components in markdown | If you have many custom components used across markdown files. Optional — explicit imports work fine for <10 components. | LOW |
| vitepress-plugin-group-icons | ^1.x | Package manager icons in code groups (npm/pnpm/yarn tabs) | For installation code blocks showing multiple package managers with icons. Nice polish. | LOW |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Site generator | VitePress | Docusaurus | React-based, wrong ecosystem. This is a Vite plugin — VitePress is the natural home. |
| Site generator | VitePress | Starlight (Astro) | Good option but not Vue-native. Custom Vue components require extra setup. VitePress gives Vue SFC support for free. |
| Site generator | VitePress | Nextra (Next.js) | React-based, MDX instead of markdown+Vue. Wrong ecosystem. |
| Utility CSS | UnoCSS | Tailwind v4 | Both work. UnoCSS is the Vite ecosystem convention for docs sites. Tailwind is acceptable if team prefers. |
| Animation | CSS + Vue transitions | motion-v | Unnecessary weight for landing page fade/slide effects. |
| Animation | CSS + Vue transitions | GSAP | Heavy, commercial license concerns, overkill for docs. |
| Search | Local search | Algolia DocSearch | Out of scope per PROJECT.md. Local search is sufficient for this site size. |
| Demo | iframe embed | Sandpack | Plugin runs as Vite dev server middleware — cannot run in browser sandbox. |
| Demo | iframe embed | StackBlitz WebContainers | Could work (runs Node in browser) but complex to set up and maintain. iframe to hosted demo is simpler and more reliable. |
| Hosting | Vercel | Netlify | Both work. Vercel has native VitePress detection with zero config. |
| Hosting | Vercel | GitHub Pages | No preview deploys, more manual setup. Vercel is strictly better for this use case. |

## Project Structure

```
docs/
  .vitepress/
    config.mts          # VitePress configuration
    theme/
      index.ts          # Theme extensions
      style.css         # Custom CSS variables and overrides
      components/       # Custom Vue components (landing page, demo embed, etc.)
      layouts/          # Custom layout overrides if needed
  index.md              # Landing page (layout: home or custom)
  guide/
    getting-started.md
    configuration.md
    features/
      ...
  integrations/
    vue.md
    react.md
    nuxt.md
    nextjs.md
    ...
  api/
    core.md
    options.md
  public/
    og-image.png        # Social preview image
    favicon.ico
  package.json          # Docs-specific dependencies (NOT a workspace package)
```

## Installation

```bash
# From the docs/ directory
# Note: docs/ is NOT a pnpm workspace package — it has its own package.json

# Core (VitePress handles Vue as peer dep)
pnpm add -D vitepress

# Styling (if using UnoCSS)
pnpm add -D unocss

# TypeScript hover in code blocks (optional but recommended)
pnpm add -D @shikijs/vitepress-twoslash

# Package manager icons in code groups (optional polish)
pnpm add -D vitepress-plugin-group-icons
```

## Key Configuration Decisions

### docs/ is NOT a workspace package

The `docs/` folder should NOT be added to `pnpm-workspace.yaml`. VitePress docs sites are self-contained — they do not export anything consumed by other packages. Adding them to the workspace creates unnecessary dependency resolution complexity. Keep a standalone `package.json` in `docs/` and run it independently.

### VitePress version pinning

Pin to `^1.6.4` (latest stable). Do NOT use the 2.0.0-alpha series — it is unstable and the API is still changing. VitePress 1.x is production-ready and actively maintained.

### Custom landing page approach

Use `layout: page` in frontmatter with a fully custom Vue component for the landing page. This gives complete control over the hero section, demo iframe, and feature grid while still getting VitePress navigation and footer. The `layout: home` option with its `hero` and `features` frontmatter is too constrained for the visual polish described in PROJECT.md.

### Iframe demo hosting

The embedded dashboard demo in the hero should be one of the existing playgrounds (e.g., the vanilla playground) deployed as a separate Vercel project or at a subpath. This keeps the demo always up-to-date with the actual plugin behavior.

## Sources

- [VitePress Official Documentation](https://vitepress.dev/) - HIGH confidence
- [VitePress npm package](https://www.npmjs.com/package/vitepress) - v1.6.4 confirmed
- [VitePress GitHub Releases](https://github.com/vuejs/vitepress/releases) - version history
- [VitePress CHANGELOG](https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md) - 1.6.3 released 2025-01-22
- [Shiki VitePress Integration](https://shiki.style/packages/vitepress) - Twoslash setup
- [VitePress Deployment Guide](https://vitepress.dev/guide/deploy) - Vercel zero-config
- [Vercel VitePress Support](https://vercel.com/changelog/vitepress-projects-can-now-be-deployed-with-zero-configuration)
- [Motion for Vue (motion-v)](https://github.com/productdevbook/motion) - evaluated and rejected
- [UnoCSS](https://unocss.dev/) - Vite ecosystem standard for docs
- [VitePress Using Vue Guide](https://vitepress.dev/guide/using-vue) - custom components in markdown
- [VitePress Custom Theme Guide](https://vitepress.dev/guide/custom-theme) - theme extension
