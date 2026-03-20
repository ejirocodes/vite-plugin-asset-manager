# Project Research Summary

**Project:** Vite Plugin Asset Manager Documentation Site
**Domain:** Developer tool documentation (VitePress static site)
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

This project is a documentation site for an existing Vite plugin, built with VitePress. The research is unambiguous: VitePress 1.x is the correct choice (Vite ecosystem alignment, Vue SFC support, built-in features cover 80% of requirements). The default theme should be extended via slot injection, never replaced. UnoCSS is the Vite ecosystem convention for docs styling, though Tailwind v4 is an acceptable alternative. The landing page differentiator is an embedded iframe demo of the actual asset manager dashboard, served as a separate static build artifact.

The recommended approach is to scaffold VitePress with the default theme, immediately configure Vercel deployment with the correct `cleanUrls` and HTML minification settings, then layer content in parallel with custom landing page components. Content (guides, framework docs) and the custom landing page are independent workstreams that can be parallelized after the VitePress foundation is in place. The iframe demo requires a separately-built static version of the dashboard placed in `public/demo/`.

The primary risks are SSR hydration mismatches from browser-only code in custom Vue components (wrap in `<ClientOnly>`, test production builds early), Vercel HTML minification destroying Vue hydration comments (disable on first deploy), and the iframe demo strategy requiring careful base URL handling with `withBase()`. All three are well-documented with known solutions. The biggest time risk is content creation for 10+ framework integration guides, not technical complexity.

## Key Findings

### Recommended Stack

VitePress 1.x is the only sensible choice for a Vite plugin's documentation. It provides Vue SFC support for custom components, Shiki syntax highlighting, local search, dark mode, responsive layout, and sidebar navigation out of the box. The stack is intentionally minimal.

**Core technologies:**
- **VitePress ^1.6.4**: Static site generator -- Vite-native, Vue-powered, production-ready (do NOT use 2.0.0-alpha)
- **UnoCSS ^66.x**: Utility CSS for custom components -- Vite ecosystem standard for docs (UnoCSS over Tailwind is a preference, not a hard requirement)
- **CSS animations + Vue transitions**: Landing page animations -- no external animation library needed
- **@shikijs/vitepress-twoslash ^2.x**: TypeScript hover types in code blocks -- significant DX improvement for a TypeScript plugin's docs
- **Vercel**: Hosting -- zero-config VitePress detection, preview deploys for PRs

**Critical version note:** Pin VitePress to ^1.6.4. The 2.0.0-alpha is unstable.

### Expected Features

**Must have (table stakes):**
- Dark/light mode toggle (VitePress built-in)
- Search with Cmd+K (VitePress local search)
- Responsive sidebar navigation with mobile support
- Syntax-highlighted code blocks with copy buttons
- Getting Started guide and Configuration reference
- Framework integration guides (10+ frameworks)
- GitHub link in nav, edit-this-page links, last-updated timestamps
- Clean URL structure (`/guide/getting-started` not `.html`)

**Should have (differentiators):**
- Embedded live demo iframe in hero section (strongest proof of value)
- Custom animated landing page with feature showcase grid
- Tabbed code examples (pnpm/npm/yarn/bun)
- Visual screenshots/GIFs of the dashboard
- Keyboard shortcuts reference page
- "Works with" framework logos section
- Troubleshooting page (reduces support burden)
- Multi-package documentation (main plugin + core + nuxt + nextjs)

**Defer (v2+):**
- Algolia DocSearch (local search is sufficient for ~40 pages)
- i18n / translations (massive maintenance burden)
- Blog / changelog section (use GitHub Releases)
- Interactive API playground (iframe demo is sufficient)
- Video tutorials, AI chatbot, PWA support
- Auto-generated API docs from TypeScript (hand-write for quality)

### Architecture Approach

Extend the VitePress default theme using `extends: DefaultTheme` and inject custom content via the 34 named layout slots. The landing page uses `layout: home` with slot injection for custom sections (hero, feature showcase, install snippet, demo iframe). Documentation content uses `layout: doc` with multi-sidebar configuration keyed by URL path prefix. The `docs/` folder is NOT a pnpm workspace package -- it has its own standalone `package.json`.

**Major components:**
1. **config.mts** -- Site metadata, nav structure, multi-sidebar configuration, social links
2. **theme/index.ts** -- Theme entry extending DefaultTheme, global component registration, CSS imports
3. **theme/components/** -- Custom Vue SFCs: HeroSection, FeatureShowcase, QuickInstall, DemoEmbed, FrameworkLogos
4. **theme/style.css** -- Brand colors via CSS variables, animation keyframes, dark mode overrides
5. **Content sections** -- guide/, frameworks/, ssr/, features/, api/, resources/ with independent sidebar configs

**Key architectural decision:** The iframe demo must be a separately-built static artifact placed in `public/demo/`, never a React component mounted inside VitePress. The dashboard is React; the docs are Vue. They must not share a build.

### Critical Pitfalls

1. **SSR hydration mismatches** -- Custom Vue components accessing `window`/`document` crash the production build or cause silent hydration failures. Wrap browser-only components in `<ClientOnly>`, access browser APIs only in `onMounted()`, test `vitepress build` early and often.

2. **Vercel HTML minification** -- Vercel's auto-minify strips Vue hydration comments, breaking the deployed site silently. Disable HTML minification in Vercel settings on the very first deploy.

3. **Clean URLs mismatch** -- VitePress `cleanUrls: true` and Vercel `cleanUrls: true` must both be set, or navigation breaks with 404s or redirect loops. Configure both together on initial setup.

4. **Iframe demo base URL** -- Hardcoded iframe `src` paths break in production/preview deploys. Always use `withBase()` helper in a Vue component wrapper. Build the demo as a separate static artifact in `public/demo/`.

5. **Monorepo dependency resolution** -- The `docs/` folder needs its own `package.json` and `node_modules`. Do not rely on hoisted dependencies from the pnpm workspace root. Resolve this on day one.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: VitePress Foundation and Deployment

**Rationale:** Everything depends on a working VitePress instance with correct deployment configuration. Deployment pitfalls (Vercel HTML minification, clean URLs) must be caught immediately, not after content is written.
**Delivers:** Working VitePress site deployed to Vercel with correct configuration, default home page with basic hero, nav structure, sidebar stubs, dark mode, search.
**Addresses:** Dark/light mode, search, responsive layout, GitHub link, clean URLs, edit-this-page links, last-updated timestamps.
**Avoids:** Pitfalls #3 (Vercel minification), #4 (clean URLs), #7 (monorepo deps) -- all caught on first deploy.

### Phase 2: Core Documentation Content

**Rationale:** Content is the highest-value deliverable. Developers visit docs to learn how to use the plugin, not to admire the landing page. Getting Started is the highest-traffic page on any docs site. Framework guides are critical given the plugin supports 10+ frameworks.
**Delivers:** Complete guide section (Getting Started, Installation, Configuration), all framework integration pages, SSR framework pages (Nuxt, Next.js, TanStack).
**Addresses:** Getting Started guide, Configuration reference, Framework integration guides, tabbed code examples.
**Avoids:** Pitfall #10 (sidebar explosion) -- use multi-sidebar with path prefixes and separate config file from the start.

### Phase 3: Custom Landing Page

**Rationale:** Independent of content work (can be parallelized with Phase 2 if resources allow). Requires careful SSR handling. The demo iframe needs a separately-built dashboard artifact, which is a non-trivial build pipeline addition.
**Delivers:** Custom animated landing page with HeroSection, FeatureShowcase, QuickInstall, FrameworkLogos, and DemoEmbed components.
**Addresses:** Embedded live demo, custom animated landing page, feature showcase grid, "Works with" logos, install snippet.
**Avoids:** Pitfalls #1 (SSR hydration -- use `<ClientOnly>`), #2 (iframe base URL -- use `withBase()`), #5 (losing default theme -- use `layout: home` with slots), #8 (demo serving strategy -- separate static build in `public/demo/`), #11 (dark mode conflicts -- use VitePress CSS variables).

### Phase 4: Feature Documentation and Polish

**Rationale:** Depends on content structure from Phase 2 and screenshots require a working landing page from Phase 3. This is where the docs go from "useful" to "impressive."
**Delivers:** Feature detail pages with screenshots/GIFs, API reference for core package, Troubleshooting guide, keyboard shortcuts reference, SEO meta tags and OG images.
**Addresses:** Visual screenshots/GIFs, API reference, Troubleshooting page, keyboard shortcuts reference, SEO optimization, multi-package docs.
**Avoids:** Pitfall #9 (asset paths in production -- use `withBase()` for all public assets).

### Phase Ordering Rationale

- **Phase 1 before everything** because deployment pitfalls (#3, #4) are invisible in local dev and must be validated against Vercel immediately. Discovering these after writing 30 pages of content wastes time.
- **Phase 2 before Phase 3** because content delivers more user value than visual polish. A developer can use the plugin with ugly docs; they cannot use it with pretty docs that lack setup instructions. However, Phases 2 and 3 are architecturally independent and can overlap.
- **Phase 3 requires the demo build pipeline** which is the most technically uncertain part of the project. The dashboard is React; the docs are Vue. Building a static demo artifact and serving it via iframe in `public/demo/` needs validation.
- **Phase 4 last** because it depends on content structure (Phase 2) and screenshots (Phase 3), and delivers diminishing returns compared to earlier phases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Custom Landing Page):** The iframe demo build pipeline (React dashboard -> static build -> `public/demo/`) needs validation. How to create a standalone, mock-data version of the dashboard that works without a live Vite dev server is an open question.
- **Phase 1 (Foundation):** If `docs/` joins the pnpm workspace vs. stays independent affects the Vercel build command configuration. Decide this during phase planning.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Core Content):** Pure content creation using well-documented VitePress markdown features. No technical uncertainty.
- **Phase 4 (Polish):** Standard VitePress patterns for screenshots, meta tags, and additional content pages.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | VitePress is the obvious choice; all alternatives were correctly eliminated. Version pinning to 1.x is well-supported. |
| Features | HIGH | Feature landscape thoroughly benchmarked against Vite, Vue, Nuxt, Tailwind, Vitest docs. Clear table-stakes vs. differentiator separation. |
| Architecture | HIGH | VitePress default theme extension is the documented best practice. Slot system verified against Layout.vue source (34 slots). Multi-sidebar is standard. |
| Pitfalls | HIGH | All critical pitfalls cite specific GitHub issues or official documentation. SSR hydration and Vercel minification are the most commonly reported VitePress issues. |

**Overall confidence:** HIGH

### Gaps to Address

- **Demo build pipeline:** How exactly to produce a static, mock-data version of the React dashboard for the iframe embed. The current dashboard requires a running Vite dev server with the plugin active. A static export with fake asset data needs to be prototyped.
- **docs/ workspace membership:** Research recommends NOT adding to workspace, but this affects how Vercel builds the docs. Validate the Vercel build command (`cd docs && pnpm install && pnpm run build`) works correctly with a standalone `package.json`.
- **UnoCSS vs. Tailwind decision:** Research recommends UnoCSS but acknowledges Tailwind v4 works fine. The team should make this call based on familiarity. It is a low-stakes decision.
- **Screenshot capture workflow:** Phase 4 needs high-quality screenshots of the dashboard. No tooling or process for capturing and optimizing these was researched.

## Sources

### Primary (HIGH confidence)
- [VitePress Official Documentation](https://vitepress.dev/) -- site generator configuration, theme extension, SSR compatibility, deployment
- [VitePress Layout.vue source](https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/Layout.vue) -- 34 named slots verified
- [VitePress SSR Compatibility Guide](https://vitepress.dev/guide/ssr-compat) -- `<ClientOnly>`, `onMounted()` patterns
- [VitePress Deploy Guide](https://vitepress.dev/guide/deploy) -- Vercel configuration
- [Iframe base URL issue #3318](https://github.com/vuejs/vitepress/issues/3318) -- `withBase()` fix confirmed by maintainer
- [Clean URLs issue #4187](https://github.com/vuejs/vitepress/issues/4187) -- VitePress + Vercel `cleanUrls` alignment

### Secondary (MEDIUM confidence)
- [Vite.dev](https://vite.dev), [Nuxt.com](https://nuxt.com), [Vitest.dev](https://vitest.dev) -- landing page benchmarking
- [UnoCSS](https://unocss.dev/) -- Vite ecosystem convention for docs sites
- [Vercel VitePress zero-config announcement](https://vercel.com/changelog/vitepress-projects-can-now-be-deployed-with-zero-configuration) -- deployment support

### Tertiary (LOW confidence)
- [Landify for VitePress](https://github.com/nexmoe/landify) -- landing page component library (may be useful, not validated)
- [vitepress-plugin-group-icons](https://www.npmjs.com/package/vitepress-plugin-group-icons) -- package manager icons (nice-to-have, not critical)

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
