# Architecture Patterns

**Domain:** VitePress documentation site with custom theme and landing page
**Researched:** 2026-03-20

## Recommended Architecture

Extend the VitePress default theme rather than building from scratch. Use `layout: 'home'` with heavy slot injection for the landing page, and standard `layout: 'doc'` for all documentation content. Custom Vue components live in `.vitepress/theme/components/` and are registered globally or imported per-page.

```
docs/
├── .vitepress/
│   ├── config.mts              # Site config (nav, sidebar, meta)
│   ├── theme/
│   │   ├── index.ts            # Theme entry — extends DefaultTheme
│   │   ├── style.css           # CSS variable overrides, custom styles
│   │   ├── components/         # Custom Vue components
│   │   │   ├── HeroSection.vue       # Custom hero with iframe demo
│   │   │   ├── FeatureShowcase.vue   # Animated feature highlights
│   │   │   ├── QuickInstall.vue      # Copy-able install snippet
│   │   │   ├── FrameworkLogos.vue    # Supported frameworks strip
│   │   │   └── DemoEmbed.vue         # Iframe wrapper for live demo
│   │   └── composables/       # Shared Vue composables
│   │       └── useMediaQuery.ts
│   └── cache/                  # Dev server cache (gitignored)
├── public/
│   ├── logo.svg                # Site logo (light)
│   ├── logo-dark.svg           # Site logo (dark)
│   ├── og-image.png            # Open Graph image
│   └── screenshots/            # Feature screenshots for docs
├── index.md                    # Landing page (layout: home + custom slots)
├── guide/
│   ├── index.md                # Getting Started
│   ├── installation.md
│   └── configuration.md        # All plugin options
├── frameworks/
│   ├── index.md                # Framework overview
│   ├── vue.md
│   ├── react.md
│   ├── svelte.md
│   ├── solid.md
│   ├── lit.md
│   ├── preact.md
│   ├── qwik.md
│   └── vanilla.md
├── ssr/
│   ├── nuxt.md                 # @vite-asset-manager/nuxt
│   ├── nextjs.md               # nextjs-asset-manager
│   └── tanstack.md             # Manual SSR integration
├── features/
│   ├── scanning.md
│   ├── thumbnails.md
│   ├── duplicates.md
│   ├── bulk-operations.md
│   ├── keyboard-navigation.md
│   └── unused-detection.md
├── api/
│   └── index.md                # @vite-asset-manager/core API reference
└── resources/
    ├── troubleshooting.md
    └── contributing.md
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **config.mts** | Nav structure, sidebar definitions, site metadata, head tags, social links | Theme entry (defines themeConfig consumed by default theme) |
| **theme/index.ts** | Theme entry point — extends DefaultTheme, registers global components, imports custom CSS | config.mts (consumes config), Layout slots (injects components) |
| **theme/style.css** | Brand colors via CSS variables, font overrides, landing page animation styles | All components (CSS custom properties cascade) |
| **theme/components/** | Custom Vue SFCs for landing page and enhanced doc pages | Slots in DefaultTheme Layout, markdown pages via direct import |
| **index.md (landing)** | Landing page content and slot injection using frontmatter `hero`/`features` + custom components | HeroSection, FeatureShowcase, QuickInstall via layout slots |
| **guide/, frameworks/, ssr/, features/, api/** | Markdown content pages using `layout: 'doc'` | Sidebar config in config.mts, cross-links between pages |
| **public/** | Static assets (logos, screenshots, OG images) | Referenced by components and markdown via absolute paths |

### Data Flow

```
config.mts
    │
    ├──→ themeConfig.nav       ──→ Top navigation bar
    ├──→ themeConfig.sidebar   ──→ Per-section sidebar menus
    ├──→ head[]                ──→ Meta tags, OG tags, favicon
    └──→ themeConfig.socialLinks ──→ GitHub link in nav
              │
              ▼
theme/index.ts (extends DefaultTheme)
    │
    ├──→ Registers global components (HeroSection, etc.)
    ├──→ Imports style.css (CSS variable overrides)
    └──→ Passes slots to DefaultTheme Layout
              │
              ▼
Layout.vue (DefaultTheme with 34 named slots)
    │
    ├──→ home-hero-info slot   ──→ HeroSection.vue (custom hero with iframe demo)
    ├──→ home-hero-after slot  ──→ QuickInstall.vue
    ├──→ home-features-after slot ──→ FeatureShowcase.vue
    └──→ doc-before slot       ──→ (optional) breadcrumbs or banners
              │
              ▼
Markdown (.md files)
    │
    ├──→ frontmatter.hero      ──→ Default hero config (name, text, tagline, actions)
    ├──→ frontmatter.features  ──→ Default feature cards
    └──→ <script setup> imports ──→ Per-page custom Vue components
```

**Key insight:** Content flows in one direction — from config.mts and frontmatter into the theme, which renders via Layout slots. Custom components are injected at specific slot boundaries, not by replacing the entire layout.

## Patterns to Follow

### Pattern 1: Extend Default Theme (Do Not Replace)

**What:** Use `extends: DefaultTheme` in theme/index.ts and inject custom content via layout slots.
**Why:** The default theme handles responsive nav, sidebar, dark mode, search, mobile menu, and dozens of edge cases. Replacing it means reimplementing all of that. Extending it gives full customization with zero maintenance burden.

```typescript
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import HeroSection from './components/HeroSection.vue'
import FeatureShowcase from './components/FeatureShowcase.vue'
import QuickInstall from './components/QuickInstall.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HeroSection', HeroSection)
    app.component('FeatureShowcase', FeatureShowcase)
    app.component('QuickInstall', QuickInstall)
  }
}
```

### Pattern 2: Slot-Based Landing Page Customization

**What:** Use `layout: 'home'` frontmatter with the default hero/features config, then inject custom components into named slots for advanced sections.
**Why:** You get the default hero (responsive, dark-mode-aware, accessible) for free, while adding custom sections (iframe demo, animated showcases) below or around it.

```markdown
<!-- index.md -->
---
layout: home
hero:
  name: Vite Asset Manager
  text: Visual Asset Dashboard for Vite
  tagline: Discover, catalogue, and manage every asset in your project
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/ejirocodes/vite-plugin-asset-manager
  image:
    src: /logo.svg
    alt: Vite Asset Manager
features:
  - icon: ...
    title: Real-time Scanning
    details: Discovers all media assets with thumbnail generation
  ...
---

<FeatureShowcase />
<QuickInstall />
```

The key slots for the landing page (confidence: HIGH, verified from Layout.vue source):

| Slot | Location | Use For |
|------|----------|---------|
| `home-hero-before` | Above hero | Announcement banner |
| `home-hero-info` | Replaces hero text area | Fully custom hero content |
| `home-hero-image` | Replaces hero image | Iframe demo embed |
| `home-hero-after` | Below hero | Quick install snippet |
| `home-features-before` | Above features grid | Section divider |
| `home-features-after` | Below features grid | Animated showcase, testimonials |

### Pattern 3: Multi-Sidebar by Path Prefix

**What:** Define separate sidebar configurations keyed by URL path prefix.
**Why:** The docs have distinct sections (guide, frameworks, ssr, features, api) that need independent navigation trees.

```typescript
// config.mts
sidebar: {
  '/guide/': [
    { text: 'Introduction', items: [...] }
  ],
  '/frameworks/': [
    { text: 'Vite Frameworks', items: [...] }
  ],
  '/ssr/': [
    { text: 'SSR Frameworks', items: [...] }
  ],
  '/features/': [
    { text: 'Features', items: [...] }
  ],
  '/api/': [
    { text: 'API Reference', items: [...] }
  ]
}
```

### Pattern 4: Iframe Demo in Hero Image Slot

**What:** Replace the default hero image with an iframe showing the actual asset manager dashboard.
**Why:** An interactive demo is the project's stated differentiator. The `home-hero-image` slot is the right injection point.

```vue
<!-- DemoEmbed.vue -->
<template>
  <div class="demo-container">
    <iframe
      :src="demoUrl"
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
      title="Asset Manager Demo"
    />
  </div>
</template>
```

**Critical consideration:** The iframe needs a hosted instance of the asset manager dashboard. This could be a static build deployed to a subdomain, or a pre-recorded screenshot/video as a fallback. Plan for both — the iframe is aspirational for v1 and may need a static screenshot placeholder initially.

## Anti-Patterns to Avoid

### Anti-Pattern 1: layout: false for Landing Page

**What:** Using `layout: false` in frontmatter to build the entire landing page from scratch.
**Why bad:** Loses the default navbar, dark mode toggle, mobile hamburger menu, and responsive layout. You would need to reimplement all of that in your custom component, and maintain it across VitePress upgrades.
**Instead:** Use `layout: 'home'` with slot injection. You get the full chrome (nav, footer, dark mode) while customizing the content area.

### Anti-Pattern 2: Building a Custom Theme from Scratch

**What:** Creating a theme entry that does not `extend` DefaultTheme.
**Why bad:** The default theme is ~34 layout slots, responsive sidebar, search integration, edit links, prev/next navigation, and dark mode. Rebuilding from scratch is weeks of work for no user benefit.
**Instead:** Always use `extends: DefaultTheme`. Override only what you need via CSS variables and slot injection.

### Anti-Pattern 3: Putting Docs in a Workspace Package

**What:** Making `docs/` a workspace package in the monorepo (e.g., `packages/docs/`).
**Why bad:** VitePress is not a library consumed by other packages. Making it a workspace package adds unnecessary dependency resolution complexity. The convention is `docs/` at repo root.
**Instead:** Keep `docs/` at repo root. Add it to pnpm-workspace.yaml only if it needs shared dependencies.

### Anti-Pattern 4: One Giant Sidebar Array

**What:** A single sidebar config array used across all doc sections.
**Why bad:** Users navigating framework guides see feature docs links; API reference pages show getting started links. Irrelevant navigation confuses users.
**Instead:** Use path-prefix-keyed sidebar object (Pattern 3 above).

## Build Order (Dependencies Between Components)

The VitePress docs site has a clear dependency chain that maps to implementation phases:

```
Phase 1: Foundation (no dependencies)
├── Initialize VitePress in docs/
├── config.mts with site metadata, nav structure
├── theme/index.ts extending DefaultTheme
├── theme/style.css with brand colors
└── Basic index.md with default home layout

Phase 2: Content Structure (depends on Phase 1)
├── Sidebar configuration per section
├── guide/ pages (Getting Started, Installation, Configuration)
├── frameworks/ pages (one per framework)
├── ssr/ pages (Nuxt, Next.js, TanStack)
└── resources/ pages (Troubleshooting, Contributing)

Phase 3: Custom Landing Page (depends on Phase 1, independent of Phase 2)
├── HeroSection.vue component
├── FeatureShowcase.vue component
├── QuickInstall.vue component
├── DemoEmbed.vue component (iframe or screenshot)
├── Landing page animations and polish
└── index.md updated with slot injections

Phase 4: Advanced Content (depends on Phase 2)
├── features/ pages with screenshots
├── api/ reference documentation
└── Cross-linking between sections

Phase 5: Deployment (depends on all above)
├── Vercel configuration
├── Custom domain setup
└── OG image and social meta
```

**Key dependency insight:** Phase 2 (content) and Phase 3 (landing page) are independent of each other and can be parallelized. Phase 1 must come first as both depend on the VitePress foundation. Phase 4 is content-heavy and depends on the content structure from Phase 2. Phase 5 is deployment and depends on everything.

**Build-time data flow:** VitePress processes config.mts at build time, resolves all markdown files via file-based routing, applies the theme, injects slot content, and outputs static HTML + client-side hydration JS. No runtime server needed — it is pure SSG (static site generation) with optional SPA navigation via client-side routing.

## Scalability Considerations

| Concern | At 10 pages | At 50 pages | At 200+ pages |
|---------|-------------|-------------|---------------|
| Sidebar management | Manual config is fine | Multi-sidebar by prefix essential | Consider auto-generation plugin (vitepress-sidebar) |
| Build time | <5s | <15s | May need to exclude heavy assets from public/ |
| Search | VitePress local search works | Still fine | Consider Algolia DocSearch |
| Navigation | Flat nav sufficient | Grouped nav with dropdowns | Multi-level nav with sections |

For this project (estimated 30-40 pages), manual sidebar config with path-prefix grouping is the right approach. No auto-generation needed.

## Sources

- [VitePress - Extending Default Theme](https://vitepress.dev/guide/extending-default-theme) (official docs)
- [VitePress - Custom Theme](https://vitepress.dev/guide/custom-theme) (official docs)
- [VitePress - Home Page](https://vitepress.dev/reference/default-theme-home-page) (official docs)
- [VitePress - Layout](https://vitepress.dev/reference/default-theme-layout) (official docs)
- [VitePress - Routing](https://vitepress.dev/guide/routing) (official docs)
- [VitePress - Sidebar](https://vitepress.dev/reference/default-theme-sidebar) (official docs)
- [VitePress Layout.vue source](https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/Layout.vue) (34 named slots verified)
- [VitePress - Getting Started](https://vitepress.dev/guide/getting-started) (official docs)
