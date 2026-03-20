# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.9.3 - Core plugin code, services, API handlers, UI components
- HTML5 - UI dashboard templates
- CSS - Tailwind CSS v4 for styling

**Secondary:**
- JavaScript (ESM/CJS) - Build output, configuration files
- JSON - Configuration and data serialization

## Runtime

**Environment:**
- Node.js >= 22 (configured in `.nvmrc`, enforced in `package.json` engines field)

**Package Manager:**
- pnpm 10.30.0 - Workspace-aware package manager
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- Vite >=5.0.0 - Build tool and dev server integration, plugin system
- React 19.2.4 - UI dashboard framework
- TypeScript 5.9.3 - Type safety

**Testing:**
- Vitest 4.0.18 - Unit test runner (Vite-native)
- Playwright 1.58.2 - E2E testing framework
- `@testing-library/react` 16.3.2 - React component testing utilities
- `@testing-library/jest-dom` 6.9.1 - DOM matchers for assertions

**Build/Dev:**
- tsup 8.5.1 - TypeScript bundler for packages (ESM + CJS)
- Vite 7.3.1 - Build tool with code splitting
- PostCSS 8.5.6 - CSS processing pipeline
- Tailwind CSS 4.1.18 - Utility-first CSS framework

**Code Quality:**
- ESLint 9.39.2 - Linting with flat config (`eslint.config.js`)
  - `@typescript-eslint/parser` 8.55.0
  - `@typescript-eslint/eslint-plugin` 8.55.0
  - `eslint-plugin-react` 7.37.5
  - `eslint-plugin-react-hooks` 7.0.1
  - `eslint-config-prettier` 10.1.8
- Prettier 3.8.1 - Code formatter

## Key Dependencies

**Core Asset Management:**
- `sharp` 0.34.5 - Image processing for thumbnail generation (system-level dependency)
- `chokidar` 5.0.0 - File system watching for change detection
- `fast-glob` 3.3.3 - High-performance file globbing for asset discovery
- `archiver` 7.0.1 - ZIP archive creation for bulk downloads
- `launch-editor` 2.12.0 - Cross-platform editor launching (VS Code, Vim, etc.)

**HTTP/Middleware:**
- `sirv` 3.0.2 - Lightweight HTTP file server middleware for static asset serving
- Node.js built-in: `http`, `fs`, `fs/promises`, `path`, `crypto`, `os`, `child_process` - Core APIs

**UI Components & Styling:**
- `@base-ui/react` 1.2.0 - Unstyled accessible React component primitives (headless UI)
- shadcn (3.8.4) - CLI tool for installing pre-built component registry (not runtime dep)
- `class-variance-authority` 0.7.1 - Type-safe variant composition
- `clsx` 2.1.1 - Classname utility with better tree-shaking
- `tailwind-merge` 3.4.1 - Merge Tailwind classes intelligently
- `sonner` 2.0.7 - Toast notification system
- `next-themes` - Theme context provider
- `tw-animate-css` 1.4.0 - Tailwind animation utilities

**UI Enhancement:**
- `@tanstack/react-virtual` 3.13.18 - Virtual scrolling for large asset grids
- `@phosphor-icons/react` 2.1.10 - Icon library (155 KB chunk)
- `react-resizable-panels` 4.6.4 - Resizable panel container

**Utilities:**
- `picocolors` 1.1.1 - Colored console output (minimal, no dependencies)
- `memfs` 4.56.10 - In-memory filesystem for testing

**Development:**
- `@vitejs/plugin-react` 5.1.4 - React JSX/Fast Refresh support
- `jsdom` 27.4.0 - DOM implementation for component testing
- `@vitest/ui` 4.0.18 - Vitest UI dashboard
- `@vitest/coverage-v8` 4.0.18 - V8 code coverage reporting
- `@types/node` 25.2.3, `@types/react` 19.2.14, `@types/react-dom` 19.2.3 - Type definitions

**Monorepo Packages:**
- `@vite-asset-manager/core` - Core functionality (scanner, API, middleware)
- `@vite-asset-manager/nuxt` - Nuxt 3/4 module
- `nextjs-asset-manager` - Next.js 14+ integration (separate npm scope)

## Configuration

**Environment:**
- Node.js version locked to `v22` in `.nvmrc`
- No `.env` files required (configuration via plugin options)
- `pnpm.onlyBuiltDependencies` in `package.json`: `['esbuild', 'msw', 'sharp']` - Marks native deps to avoid building from source

**Build:**
- `tsup.config.ts` - Main plugin bundling (ESM + CJS, external deps: `vite`, `sharp`, `archiver`, `picocolors`)
- `vite.config.ui.ts` - React dashboard build with manual code splitting (4 vendor chunks)
- `vite.config.floating-icon.ts` - Floating icon IIFE build
- `.prettierrc` - Formatting rules (semi: false, singleQuote: true, trailingComma: none)
- `components.json` - shadcn configuration (style: base-mira, icon library: phosphor)
- `postcss.config.js` - PostCSS with Tailwind CSS plugin

**TypeScript:**
- Root `tsconfig.json` - Plugin layer code (target: ES2022, module: ESNext, strict mode)
  - Path alias: `@/*` → `./src/*`
  - Excludes: `src/ui/**`, `src/client/**`
- `src/ui/tsconfig.json` - UI dashboard code with DOM libraries
  - Path alias: `@/*` → `./src/*` (baseUrl: `../..`)
- `src/client/floating-icon/tsconfig.json` - Floating icon (target: ES2020 with DOM libs)
- `packages/core/tsconfig.json` - Core package (Node.js environment)
- `packages/nuxt/tsconfig.json` - Nuxt module with `@nuxt/kit` types
- `packages/nextjs/tsconfig.json` - Next.js integration with JSX react-jsx

## Platform Requirements

**Development:**
- Node.js >= 22
- pnpm >= 10.30.0
- system-level Sharp dependencies (libvips for image processing)

**Production:**
- Vite >= 5.0.0 (peer dependency for main plugin)
- Nuxt >= 3.0.0 (peer dependency for `@vite-asset-manager/nuxt`)
- Next.js >= 14.0.0 (peer dependency for `nextjs-asset-manager`)
- React >= 18.0.0 (peer dependency for `nextjs-asset-manager`)

**Deployment:**
- npm registry for npm package publishing
- GitHub Actions for CI/CD and releases
- Supports all Vite-compatible frameworks: Vue, React, Svelte, Solid, Qwik, Lit, Preact, Vanilla
- Special SSR support: Nuxt, Next.js, TanStack Start

---

*Stack analysis: 2026-03-20*
