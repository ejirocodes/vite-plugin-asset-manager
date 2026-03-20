# Feature Landscape

**Domain:** Developer tool documentation site (VitePress)
**Researched:** 2026-03-20
**Reference sites analyzed:** Vite, Vue.js, Nuxt, Tailwind CSS, Pinia, Vitest

## Table Stakes

Features users expect from a modern developer tool documentation site. Missing any of these signals an immature or abandoned project.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Dark/light mode toggle** | Every top doc site has it; developers work in dark mode | Low | VitePress built-in (`appearance: true`). Zero custom work needed. |
| **Responsive layout** | Developers read docs on phones/tablets during commutes | Low | VitePress default theme handles this. May need minor tweaks for custom components. |
| **Search** | Developers Cmd+K to find things, not browse sidebars | Low | VitePress local search (`minisearch`) is sufficient for a project this size. No Algolia needed. |
| **Sidebar navigation** | Primary way developers navigate docs after landing | Low | VitePress built-in. Define structure in config. |
| **On-page table of contents** | Developers scan headings to find relevant section | Low | VitePress built-in outline/aside. |
| **Syntax-highlighted code blocks** | Code is the primary content of dev docs | Low | VitePress uses Shiki. Built-in with language detection. |
| **Copy button on code blocks** | Developers copy-paste commands constantly | Low | VitePress built-in (`markdown.codeCopyButtonTitle`). |
| **Getting Started guide** | First thing every developer looks for | Med | Content effort, not technical. Step-by-step with framework variants. |
| **Configuration reference** | Developers need to know every option available | Med | Content effort. Document `AssetManagerOptions` interface exhaustively. |
| **Mobile-friendly navigation** | Hamburger menu, collapsible sidebar on mobile | Low | VitePress default theme handles this. |
| **Hero section with tagline** | Landing page must communicate what the project does in 5 seconds | Low | VitePress default home layout provides hero config. Use it as baseline. |
| **Install snippet on landing page** | Developers want to try immediately, not read first | Low | Part of hero or first section. `pnpm add -D vite-plugin-asset-manager` |
| **Framework integration guides** | Plugin supports 10+ frameworks; each needs clear setup instructions | Med-High | Significant content effort. One page per framework category (Vite frameworks, Nuxt, Next.js, SSR manual). |
| **GitHub link in nav** | Developers want to see the source, stars, activity | Low | VitePress `socialLinks` config. One line. |
| **Clean URL structure** | `/guide/getting-started` not `/guide/getting-started.html` | Low | VitePress `cleanUrls: true`. |
| **Prev/next page navigation** | Bottom-of-page links to continue reading flow | Low | VitePress built-in. |
| **Edit this page link** | Signals community contribution is welcome | Low | VitePress `editLink` config. Points to GitHub. |
| **Last updated timestamp** | Signals the docs are maintained and current | Low | VitePress `lastUpdated: true`. Uses git timestamps. |

## Differentiators

Features that set the docs site apart. Not expected, but create a "wow, this is polished" impression. These are what make developers trust and adopt the plugin.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Embedded live demo (iframe)** | Lets users experience the asset manager dashboard without installing anything. Strongest possible proof of value. | Med | Iframe pointing to a hosted playground. Needs a deployed demo instance (e.g., on Vercel). Lazy-load with `loading="lazy"` and intersection observer. The PROJECT.md explicitly calls this out as a key differentiator. |
| **Custom animated landing page** | Signals professional-grade project. Vue, Nuxt, Vite all have bespoke landing pages beyond VitePress defaults. | Med-High | Use `layout: page` or `layout: false` with custom Vue components. Animations via CSS transitions (not a heavy library). Requires design work. |
| **Feature showcase grid** | Visual cards highlighting key capabilities (scanning, thumbnails, duplicates, bulk ops, keyboard nav). Nuxt has 11 feature cards, Vite has 4. | Med | Custom Vue component with icons (use Phosphor to match the plugin's UI). Grid layout with hover effects. |
| **Social proof / "used by" section** | Builds trust. Vite shows OpenAI, Shopify, Stripe logos. Even a "Built with" section showing framework logos helps. | Low | Show supported framework logos (Vue, React, Svelte, Solid, etc.) as a "Works with" section rather than "Used by" (since the project is early). |
| **Tabbed code examples** | Show install commands for pnpm/npm/yarn/bun side by side, or framework-specific config. Tailwind and Vite both do this. | Low-Med | VitePress code groups (`:::code-group`) handle this natively. |
| **Visual screenshots/GIFs** | Show what the dashboard looks like. A picture sells faster than prose. | Med | Need to capture high-quality screenshots of the asset manager UI (grid view, preview panel, search, bulk ops). Optimize images for web. |
| **Keyboard shortcuts reference** | The plugin has extensive keyboard nav. A visual cheat sheet is both useful and impressive. | Low-Med | Custom Vue component or styled table showing all shortcuts. |
| **Version badge / package info** | npm version, download count, license badge in header or hero. Vitest shows version in nav. | Low | Use shields.io badges or custom component pulling from npm API. |
| **Announcement banner** | Highlight new releases or important updates. Vite and Vitest both use dismissible banners. | Low | VitePress does not have this built-in but it's a simple custom component with localStorage persistence. |
| **Troubleshooting page** | Saves support burden. Common issues with solutions. | Med | Content effort. Pull from existing CLAUDE.md troubleshooting section and GitHub issues. |
| **API reference for core package** | For developers building integrations or contributing. | Med-High | Document `@vite-asset-manager/core` public API. TypeDoc could auto-generate but manual curation is better for VitePress. |
| **Multi-package docs in one site** | Document main plugin + core + nuxt module + nextjs package cohesively. | Med | Use VitePress sidebar multi-section with clear separation. Similar to how Nuxt documents modules. |
| **SEO meta tags per page** | Appear well in Google results. Title, description, OG image. | Low | VitePress frontmatter `title`, `description`, `head` per page. Create a single OG image template. |

## Anti-Features

Features to explicitly NOT build for v1. These add complexity without proportional value for a project at this stage.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Algolia DocSearch** | Overkill for a docs site this size. Requires application/approval process. Adds external dependency. | Use VitePress built-in local search. Reconsider when docs exceed 50+ pages. |
| **i18n / translations** | Massive ongoing maintenance burden. Translation quality degrades without dedicated maintainers for each language. | English only. Add i18n infrastructure later if community volunteers emerge. |
| **Blog / changelog section** | Content treadmill. Requires regular updates or looks abandoned. GitHub Releases already serve this purpose. | Link to GitHub Releases from nav. Add blog only when there's a content strategy. |
| **Interactive API playground** | Complex to build (needs a running server), fragile to maintain, and the embedded demo already shows the UI. | Embedded iframe demo + code examples are sufficient. |
| **Video tutorials** | Production quality video is expensive and goes stale fast when UI changes. | Screenshots and GIFs. Can embed YouTube links later if community creates videos. |
| **Comments / discussion system** | Adds moderation burden, spam risk, and another moving part. | Link to GitHub Discussions for community interaction. |
| **AI chatbot / "Ask AI"** | Gimmicky for a project this size. Needs training data, API costs, maintenance. | Good search + clear docs structure is more reliable. |
| **Custom theme from scratch** | VitePress default theme is well-designed. Building from scratch means maintaining nav, search, sidebar, mobile, dark mode yourself. | Extend the default theme with custom components for landing page only. Use `layout: home` and slot overrides. |
| **Auto-generated API docs from TypeScript** | TypeDoc output looks generic and hard to curate. Mixes internal types with public API. | Hand-write API reference pages. More work upfront but far better quality and readability. |
| **PWA / offline support** | Documentation sites don't need offline access. Adds service worker complexity. | Skip entirely. |

## Feature Dependencies

```
Landing Page (hero, features grid, demo iframe)
    --> No dependencies, can be built first

Getting Started Guide
    --> Needs: plugin to be published on npm (already is)

Framework Guides
    --> Needs: Getting Started Guide (references it)
    --> Needs: Each framework playground working (already exists)

Configuration Reference
    --> Needs: types/index.ts to be stable (it is)

API Reference
    --> Needs: @vite-asset-manager/core public API to be stable
    --> Needs: Configuration Reference (cross-references)

Embedded Demo
    --> Needs: A deployed playground instance (Vercel)
    --> Needs: Landing Page (embedded within it)

Troubleshooting
    --> Needs: Framework Guides (references common setup issues)

Contributing Guide
    --> Needs: Architecture understanding (from CLAUDE.md)
    --> Can be built independently
```

## MVP Recommendation

**Phase 1 - Foundation (build first):**
1. VitePress project scaffolding with config, sidebar, search, dark mode (all built-in, Low complexity)
2. Getting Started guide (highest-traffic page for any doc site)
3. Landing page with hero section using VitePress defaults (upgrade to custom later)
4. Configuration reference page

**Phase 2 - Framework Coverage:**
5. Framework integration guides (Vite frameworks page, Nuxt module page, Next.js package page, SSR manual page)
6. Feature documentation pages with screenshots
7. Tabbed code examples for install commands

**Phase 3 - Polish & Differentiation:**
8. Custom animated landing page with Vue components
9. Feature showcase grid with Phosphor icons
10. Embedded live demo iframe
11. Visual screenshots/GIFs throughout docs
12. "Works with" framework logos section

**Phase 4 - Completeness:**
13. API reference for core package
14. Troubleshooting guide
15. Contributing guide
16. SEO optimization (meta tags, OG images)
17. Deployment to Vercel with auto-deploy

**Defer indefinitely:**
- Blog, i18n, Algolia, video tutorials, API playground, AI chatbot

**Rationale:** Ship useful docs fast (Phase 1-2), then make them impressive (Phase 3-4). Developers care about "can I get this working?" before "is this landing page pretty?" But the landing page is what gets them to try in the first place, so a basic hero with install snippet ships in Phase 1, and the polished custom version comes in Phase 3.

## Sources

- [VitePress Default Theme Home Page](https://vitepress.dev/reference/default-theme-home-page) - Hero and features section configuration
- [VitePress Search Configuration](https://vitepress.dev/reference/default-theme-search) - Local search built-in capabilities
- [VitePress Default Theme Config](https://vitepress.dev/reference/default-theme-config) - Built-in theme features
- [Vite.dev](https://vite.dev) - Landing page with social proof, feature cards, framework showcase
- [Vue.js Docs](https://vuejs.org) - Algolia search, i18n, API preference toggles, sponsor section
- [Nuxt.com](https://nuxt.com) - Interactive code demos, statistics, ecosystem modules, production showcase
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Tabbed code examples, multi-step tutorials, copy buttons
- [Pinia Docs](https://pinia.vuejs.org) - Version selector, i18n, Algolia search
- [Vitest Docs](https://vitest.dev) - Animated terminal screenshot, version display, announcement banner, `/llms.txt` endpoint
- [Landify for VitePress](https://github.com/nexmoe/landify) - Landing page component library for VitePress
- [VitePress Showcases Discussion](https://github.com/vuejs/vitepress/discussions/1810) - Community examples of VitePress sites
