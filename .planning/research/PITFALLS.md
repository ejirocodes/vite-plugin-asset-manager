# Domain Pitfalls

**Domain:** VitePress documentation site with custom landing page, embedded live demo, Vercel deployment
**Project:** Vite Plugin Asset Manager docs site
**Researched:** 2026-03-20

## Critical Pitfalls

Mistakes that cause rewrites, broken deployments, or wasted days.

### Pitfall 1: SSR Hydration Mismatches from Browser-Only Code in Custom Components

**What goes wrong:** Custom Vue components used on the landing page (animations, interactive demos, iframe embeds) access `window`, `document`, `localStorage`, or other browser APIs during SSR. VitePress pre-renders all pages in Node.js during production build. The build either fails outright or produces hydration mismatch warnings that cause visual glitches (content flashing, layout shifts, broken interactivity).

**Why it happens:** Developers write Vue components as if they run only in the browser. VitePress's SSG build executes component code server-side first. Any `window` reference at module scope or in `setup()` / `created()` crashes the build. Even third-party animation libraries (GSAP, Motion, Lottie) often access browser globals on import.

**Consequences:** Production build fails. Or worse, it succeeds but the deployed site has invisible hydration errors that break interactivity silently.

**Prevention:**
- Wrap all browser-only components in `<ClientOnly>` tags
- Use `defineClientComponent()` for components that import browser-dependent libraries
- Access browser APIs only in `onMounted()` hooks, never in `setup()` or module scope
- Gate browser-only code with `if (!import.meta.env.SSR) { ... }`
- Test with `vitepress build` early and often -- do not rely solely on `vitepress dev` which skips SSR

**Detection:** Build failures mentioning `window is not defined` or `document is not defined`. Console warnings about hydration mismatches in production preview. Content that appears different on first load vs. after navigation.

**Phase relevance:** Phase 1 (custom landing page) -- this will hit immediately when building the hero section, animated features, and iframe demo.

**Confidence:** HIGH -- this is the single most documented VitePress issue across GitHub Issues and community discussions.

### Pitfall 2: Iframe Demo Broken by Base URL Configuration

**What goes wrong:** The embedded iframe demo of the asset manager dashboard works in local dev but breaks in production. The iframe `src` attribute does not automatically adjust for VitePress's `base` URL configuration.

**Why it happens:** VitePress auto-processes static asset paths in markdown content for base URL, but does NOT process HTML attributes like iframe `src` dynamically. If the site is ever deployed with a non-root base (e.g., for staging at `/docs/`), the iframe points to the wrong path. Even with root base on Vercel, hardcoded paths in iframes can break during preview deployments which use different URLs.

**Consequences:** Hero section shows a blank iframe or 404 error. The primary differentiator (live demo) is dead on arrival.

**Prevention:**
- Always use `withBase()` helper for iframe src: `<iframe :src="withBase('/demo/index.html')" />`
- Use a Vue component (not raw HTML in markdown) for the iframe embed so you can use `<script setup>` with `withBase`
- Test the iframe in both `vitepress dev` and `vitepress build && vitepress preview`
- For the actual demo content, consider whether it should be a static HTML export in `public/` or a separately built artifact

**Detection:** Iframe shows blank or 404 in production/preview while working in dev.

**Phase relevance:** Phase 1 (landing page with embedded demo). This is a day-one concern since the live demo iframe is a core landing page feature.

**Confidence:** HIGH -- documented in [VitePress issue #3318](https://github.com/vuejs/vitepress/issues/3318), confirmed by maintainer with `withBase()` fix.

### Pitfall 3: Vercel HTML Minification Destroys Vue Hydration Comments

**What goes wrong:** Vercel's "Auto Minify" for HTML strips Vue's hydration marker comments from the static HTML output. Vue relies on these comments to match server-rendered DOM to the client-side virtual DOM. When they are removed, hydration fails silently or causes content to re-render incorrectly.

**Why it happens:** Vercel's HTML minification treats HTML comments as disposable. Vue SSR specifically uses `<!--[-->` and `<!--]-->` comment nodes as fragment markers. Removing them breaks the hydration contract.

**Consequences:** Deployed site has random hydration failures. Content may flash, disappear, or lose interactivity. These bugs are invisible in local dev and only appear on the deployed Vercel site.

**Prevention:**
- Disable HTML minification in Vercel project settings (Settings > General > Auto Minify > uncheck HTML)
- Alternatively, add a `vercel.json` that explicitly controls build output without HTML minification
- Test with `vitepress build && vitepress preview` locally, but also verify the actual Vercel deployment

**Detection:** Site works locally but has layout glitches, missing content, or broken interactivity on Vercel. Console shows hydration mismatch warnings.

**Phase relevance:** Deployment phase. Must be configured on first deploy and never changed.

**Confidence:** HIGH -- well-documented Vercel + Vue SSR interaction issue.

### Pitfall 4: Clean URLs Misconfiguration Causes 404s or Redirect Loops

**What goes wrong:** Links between doc pages either show `.html` extensions (ugly) or return 404 errors depending on how `cleanUrls` is configured across VitePress config and Vercel settings.

**Why it happens:** `cleanUrls` in VitePress only changes how links are generated in the HTML output -- it does NOT change the generated file names (still `about.html`, not `about/index.html`). The hosting platform must separately be configured to serve `about.html` when `/about` is requested. If VitePress and Vercel disagree, you get either `.html` in URLs or 404s.

**Consequences:** Broken navigation across the entire docs site. Users clicking sidebar links get 404 pages. Or URLs look unprofessional with `.html` suffixes.

**Prevention:**
- Set `cleanUrls: true` in `.vitepress/config.ts`
- Add `vercel.json` with `{ "cleanUrls": true }` to match
- Both settings must agree -- do not set one without the other
- Test navigation thoroughly in the Vercel preview deployment, not just local dev

**Detection:** Links work in dev but 404 in production. URLs show `.html` extension despite configuration. Browser shows redirect loops (308 back and forth).

**Phase relevance:** Deployment phase. Configure correctly on initial setup to avoid having to fix broken links later.

**Confidence:** HIGH -- documented in [VitePress issue #4187](https://github.com/vuejs/vitepress/issues/4187) and VitePress deploy guide.

## Moderate Pitfalls

### Pitfall 5: Custom Landing Page Loses Default Theme Features

**What goes wrong:** Using `layout: false` in frontmatter for a fully custom landing page removes the navbar, footer, and all default theme styling. Developers then have to re-implement navigation, dark mode toggle, mobile responsiveness, and the search bar from scratch.

**Prevention:**
- Do NOT use `layout: false`. Instead, use `layout: home` and extend it with named slots (`home-hero-before`, `home-hero-after`, `home-features-before`, `home-features-after`)
- Use the VitePress default theme's `Layout` component and inject custom content through slots rather than replacing the entire layout
- If the landing page needs sections beyond hero/features, use the `home-hero-after` slot or create a custom component that renders below the default hero
- Only go full custom (`layout: page` with no sidebar) if the design genuinely cannot work within the slot system

**Detection:** Finding yourself re-implementing the navbar, dark mode toggle, or mobile menu. If you are writing CSS for basic navigation, you went too far.

**Phase relevance:** Phase 1 (landing page design). Decision made at the start that is painful to reverse.

**Confidence:** HIGH -- based on VitePress layout documentation and multiple community discussions.

### Pitfall 6: Vue Component Naming Causes Silent Hydration Breaks in Markdown

**What goes wrong:** Custom Vue components used in markdown files with single-word lowercase names (e.g., `<demo>`) are treated as native HTML inline elements. VitePress wraps them in `<p>` tags. If the component renders block-level content, the HTML is invalid and hydration breaks silently.

**Prevention:**
- Always use PascalCase (`<DemoSection>`) or hyphenated names (`<demo-section>`) for custom components in markdown
- Never use single-word lowercase component names
- Register components globally in `.vitepress/theme/index.ts` to avoid import boilerplate in every markdown file

**Detection:** Hydration mismatch warnings in console. Component content unexpectedly wrapped in `<p>` tags. Layout breaks that only appear in production build.

**Phase relevance:** Phase 1 (landing page) and Phase 2 (documentation content with embedded components).

**Confidence:** HIGH -- explicitly documented in [VitePress "Using Vue in Markdown" guide](https://vitepress.dev/guide/using-vue).

### Pitfall 7: Monorepo `docs/` Folder Dependency Resolution Issues

**What goes wrong:** The `docs/` folder sits at the repo root but is NOT a pnpm workspace package. VitePress tries to import Vue components or utilities from the monorepo's other packages, but pnpm's strict dependency hoisting means dependencies are not available unless explicitly declared.

**Why it happens:** This project uses pnpm workspaces with `packages/*` and `playgrounds/*`. The `docs/` folder is intentionally not a workspace package (per PROJECT.md). But VitePress needs its own `node_modules` with `vue`, `vitepress`, and any shared dependencies. pnpm's strictness means you cannot rely on hoisted dependencies from the root.

**Prevention:**
- Install VitePress dependencies locally in `docs/` with its own `package.json`, OR add `docs` to the pnpm workspace and install dependencies there
- If `docs/` is NOT a workspace member, run `cd docs && pnpm install` separately
- If `docs/` IS a workspace member, add it to `pnpm-workspace.yaml` and use `workspace:*` for any shared packages
- Do not import from `@vite-asset-manager/core` or other workspace packages in docs unless dependency resolution is explicitly set up
- For Vercel deployment, ensure the build command runs from the correct directory with the right install context

**Detection:** `Cannot find module 'vue'` or `Cannot find module 'vitepress'` errors. Build works locally (where root node_modules might accidentally satisfy) but fails on Vercel CI.

**Phase relevance:** Phase 0 (project setup). Must be resolved before any content work begins.

**Confidence:** MEDIUM -- depends on whether `docs/` joins the workspace or stays independent. Both paths work but have different gotchas.

### Pitfall 8: Iframe Demo Content Serving Strategy

**What goes wrong:** The live demo of the asset manager dashboard is a full React application. Developers try to embed it as a VitePress page or Vue component, resulting in framework conflicts (Vue + React in same build), massive bundle sizes, or broken builds.

**Prevention:**
- Build the demo as a completely separate static artifact (its own Vite build)
- Place the built demo output in VitePress's `public/demo/` directory as static files
- Reference it via iframe only -- never try to mount React inside a Vue/VitePress page
- The demo should be a stripped-down, read-only version of the dashboard with mock data (not a live plugin instance)
- Add the demo build step to the docs build pipeline: `build:demo && vitepress build`
- Keep the demo lightweight -- it loads inside an iframe so it should not be a full app bundle

**Detection:** VitePress build fails with React/JSX errors. Bundle size explodes. Iframe shows loading spinner indefinitely.

**Phase relevance:** Phase 1 (landing page). The demo strategy must be decided before building the hero section.

**Confidence:** MEDIUM -- specific to this project's architecture (React dashboard inside Vue/VitePress docs).

## Minor Pitfalls

### Pitfall 9: Asset Paths in Custom CSS and Components Break in Production

**What goes wrong:** Image paths, font references, or other assets used in custom Vue components work in dev but 404 in production because they use absolute paths that do not account for the base URL.

**Prevention:**
- Use relative paths for assets imported in Vue components (Vite handles these correctly)
- For assets in `public/`, use `withBase()` helper in templates
- Never hardcode absolute paths like `/images/logo.svg` -- always go through Vite's asset pipeline or `withBase()`

**Detection:** Missing images or broken fonts in production that work in dev.

**Phase relevance:** Phase 1 (landing page assets) and ongoing.

**Confidence:** HIGH.

### Pitfall 10: Sidebar Configuration Explosion for Multi-Framework Docs

**What goes wrong:** With 10+ framework guides (Vue, React, Svelte, Solid, Lit, Preact, Qwik, Vanilla, Nuxt, Next.js, TanStack), the sidebar configuration becomes a massive, hard-to-maintain object. Adding or reordering guides requires updating multiple places.

**Prevention:**
- Use VitePress's multi-sidebar feature with path-based sidebar configs (e.g., `/guide/` gets one sidebar, `/frameworks/` gets another)
- Consider auto-generating sidebar from file system structure using `vitepress-sidebar` plugin or a custom `sidebar.ts` helper
- Group frameworks logically: "Vite Frameworks" (auto-detected) vs. "SSR Frameworks" (require modules/manual setup)
- Keep sidebar config in a separate `sidebar.ts` file, not inline in `config.ts`

**Detection:** `config.ts` grows past 200 lines. Adding a new framework guide requires changes in 3+ places.

**Phase relevance:** Phase 2 (documentation content structure).

**Confidence:** HIGH.

### Pitfall 11: Dark Mode CSS Conflicts Between VitePress Theme and Custom Components

**What goes wrong:** Custom landing page components use their own color values that do not respond to VitePress's dark mode toggle. The landing page looks fine in light mode but has unreadable text or clashing colors in dark mode.

**Prevention:**
- Use VitePress's CSS variables (`var(--vp-c-brand-1)`, `var(--vp-c-text-1)`, etc.) in custom components instead of hardcoded colors
- Test every custom component in both light and dark mode during development
- If using Tailwind in custom components, configure it to follow VitePress's `.dark` class on `html` element

**Detection:** Toggle dark mode -- if any section looks broken, you have hardcoded colors.

**Phase relevance:** Phase 1 (landing page styling).

**Confidence:** HIGH.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Project setup | Monorepo dependency resolution (#7) | Decide workspace membership for `docs/` on day one |
| Landing page | SSR hydration from custom components (#1) | Wrap everything browser-dependent in `<ClientOnly>`, test builds early |
| Landing page | Iframe demo strategy (#2, #8) | Build demo separately, use `withBase()`, serve from `public/` |
| Landing page | Losing default theme features (#5) | Extend `home` layout with slots, do not use `layout: false` |
| Landing page | Dark mode conflicts (#11) | Use VitePress CSS variables exclusively |
| Documentation content | Component naming hydration (#6) | PascalCase or hyphenated names only |
| Documentation content | Sidebar maintenance (#10) | Separate sidebar config, group by category |
| Deployment | Vercel HTML minification (#3) | Disable on first deploy |
| Deployment | Clean URLs mismatch (#4) | Configure both VitePress and `vercel.json` together |
| All phases | Asset path breaks (#9) | Always use `withBase()` or relative imports |

## Sources

- [VitePress SSR Compatibility Guide](https://vitepress.dev/guide/ssr-compat) -- HIGH confidence
- [VitePress Using Vue in Markdown](https://vitepress.dev/guide/using-vue) -- HIGH confidence
- [VitePress Asset Handling](https://vitepress.dev/guide/asset-handling) -- HIGH confidence
- [VitePress Deploy Guide](https://vitepress.dev/guide/deploy) -- HIGH confidence
- [VitePress Layout Reference](https://vitepress.dev/reference/default-theme-layout) -- HIGH confidence
- [Iframe base URL issue #3318](https://github.com/vuejs/vitepress/issues/3318) -- HIGH confidence
- [Clean URLs issue #4187](https://github.com/vuejs/vitepress/issues/4187) -- HIGH confidence
- [Custom theme discussion #1986](https://github.com/vuejs/vitepress/discussions/1986) -- MEDIUM confidence
- [Hydration mismatch with embeds #2441](https://github.com/vuejs/vitepress/issues/2441) -- HIGH confidence
- [Vercel VitePress zero-config announcement](https://vercel.com/changelog/vitepress-projects-can-now-be-deployed-with-zero-configuration) -- MEDIUM confidence
