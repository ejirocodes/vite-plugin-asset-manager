# Vite Plugin Asset Manager — Documentation Site

## What This Is

A comprehensive, visually polished documentation website for vite-plugin-asset-manager built with VitePress. The site serves as the primary public-facing resource for the plugin — covering getting started guides, framework-specific integration docs, configuration reference, feature showcases, and API documentation. It targets frontend developers evaluating or adopting the plugin across Vite, Nuxt, Next.js, and other frameworks.

## Core Value

A credible, well-designed docs site that makes developers trust and adopt the plugin within minutes of landing on it.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Custom landing page with hero section featuring embedded live iframe demo of the asset manager dashboard
- [ ] Full custom Vue components and animations on landing page (not just VitePress defaults)
- [ ] Feature highlights section showcasing key capabilities (scanning, thumbnails, duplicate detection, etc.)
- [ ] Quick install code snippet on landing page
- [ ] Getting Started guide with step-by-step setup
- [ ] Framework integration guides (Vue, React, Svelte, Solid, Lit, Preact, Qwik, Vanilla)
- [ ] SSR framework guides (Nuxt module, Next.js package, TanStack Start)
- [ ] Configuration reference documenting all plugin options
- [ ] Features documentation with visual examples (bulk ops, keyboard nav, duplicate detection, etc.)
- [ ] API reference for @vite-asset-manager/core package
- [ ] Troubleshooting guide
- [ ] Contributing guide
- [ ] Deployment to Vercel with auto-deploy from branch

### Out of Scope

- Blog/changelog section — not needed for v1, can add later
- i18n/translations — English only for now
- Search (Algolia DocSearch) — VitePress local search is sufficient for v1
- API playground/interactive API explorer — too complex for initial launch
- Video tutorials — screenshots and code examples are sufficient

## Context

- The plugin already has extensive internal docs (CLAUDE.md ~400 lines) but no public-facing documentation site
- The monorepo supports 10+ framework playgrounds — docs need to cover all of them clearly
- The plugin has three packages: main vite plugin, @vite-asset-manager/core, @vite-asset-manager/nuxt, and nextjs-asset-manager
- Target audience spans OSS developers discovering the plugin, team leads evaluating adoption, and potential contributors
- The docs site should signal project maturity and active maintenance

## Constraints

- **Location**: `docs/` folder at repo root (VitePress convention, not a workspace package)
- **Framework**: VitePress (Vue-based, aligns with Vite ecosystem)
- **Deployment**: Vercel with auto-deploy
- **Node**: >=22 (matching project requirement)
- **Content source**: Derive from existing CLAUDE.md, README, and codebase — don't fabricate features

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| VitePress over Docusaurus/Starlight | Vite ecosystem alignment, Vue-based custom components | — Pending |
| `docs/` at repo root, not `packages/docs/` | Not a library consumed by other packages, follows VitePress convention | — Pending |
| Full custom landing page | Project credibility requires visual polish beyond default themes | — Pending |
| Embedded iframe demo in hero | Interactive demo is a differentiator — lets users experience the plugin immediately | — Pending |
| Vercel deployment | Auto-deploy, preview deploys for PRs, fast CDN | — Pending |

---
*Last updated: 2026-03-20 after initialization*
