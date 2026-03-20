import { defineConfig } from 'vitepress'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  lang: 'en-US',
  lastUpdated: true,

  sitemap: {
    hostname: 'https://vite-asset-manager.vercel.app',
  },

  vite: {
    plugins: [
      assetManager({
        include: ['public/assets'],
        floatingIcon: false,
      }),
    ],
    css: {
      postcss: {},
    },
  },

  title: 'Vite Asset Manager',
  description: 'Visual asset management dashboard for Vite projects',
  cleanUrls: true,
  srcExclude: ['SSR_INTEGRATION.md'],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#5e6ad2' }],
    ['meta', { name: 'author', content: 'Ejiro Asiuwhu' }],
    ['meta', { name: 'keywords', content: 'vite, plugin, asset manager, vite plugin, media assets, image management, thumbnail generation, duplicate detection' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Vite Asset Manager' }],
    ['meta', { property: 'og:title', content: 'Vite Asset Manager - Visual asset management for Vite' }],
    ['meta', { property: 'og:description', content: 'Discover, catalogue, and manage all media assets in your Vite projects. Real-time dashboard with thumbnail generation, duplicate detection, and framework-agnostic integration.' }],
    ['meta', { property: 'og:url', content: 'https://vite-asset-manager.vercel.app' }],
    ['meta', { property: 'og:image', content: 'https://vite-asset-manager.vercel.app/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Vite Asset Manager' }],
    ['meta', { name: 'twitter:description', content: 'Visual asset management dashboard for Vite projects' }],
    ['meta', { name: 'twitter:image', content: 'https://vite-asset-manager.vercel.app/og-image.png' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Frameworks', link: '/frameworks/vue' },
      { text: 'Features', link: '/features/overview' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/frameworks/': [
        {
          text: 'Vite Frameworks',
          items: [
            { text: 'Vue', link: '/frameworks/vue' },
            { text: 'React', link: '/frameworks/react' },
            { text: 'Svelte', link: '/frameworks/svelte' },
            { text: 'Solid', link: '/frameworks/solid' },
            { text: 'Lit', link: '/frameworks/lit' },
            { text: 'Preact', link: '/frameworks/preact' },
            { text: 'Qwik', link: '/frameworks/qwik' },
            { text: 'Vanilla', link: '/frameworks/vanilla' },
          ],
        },
        {
          text: 'SSR Frameworks',
          items: [
            { text: 'Nuxt', link: '/ssr/nuxt' },
            { text: 'Next.js', link: '/ssr/nextjs' },
            { text: 'TanStack Start', link: '/ssr/tanstack-start' },
          ],
        },
      ],
      '/ssr/': [
        {
          text: 'Vite Frameworks',
          items: [
            { text: 'Vue', link: '/frameworks/vue' },
            { text: 'React', link: '/frameworks/react' },
            { text: 'Svelte', link: '/frameworks/svelte' },
            { text: 'Solid', link: '/frameworks/solid' },
            { text: 'Lit', link: '/frameworks/lit' },
            { text: 'Preact', link: '/frameworks/preact' },
            { text: 'Qwik', link: '/frameworks/qwik' },
            { text: 'Vanilla', link: '/frameworks/vanilla' },
          ],
        },
        {
          text: 'SSR Frameworks',
          items: [
            { text: 'Nuxt', link: '/ssr/nuxt' },
            { text: 'Next.js', link: '/ssr/nextjs' },
            { text: 'TanStack Start', link: '/ssr/tanstack-start' },
          ],
        },
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Overview', link: '/features/overview' },
            { text: 'Asset Scanning', link: '/features/asset-scanning' },
            { text: 'Thumbnails', link: '/features/thumbnails' },
            {
              text: 'Duplicate Detection',
              link: '/features/duplicate-detection',
            },
            { text: 'Bulk Operations', link: '/features/bulk-operations' },
            {
              text: 'Keyboard Navigation',
              link: '/features/keyboard-navigation',
            },
            { text: 'Advanced Filters', link: '/features/advanced-filters' },
            {
              text: 'Virtual Scrolling',
              link: '/features/virtual-scrolling',
            },
            { text: 'Importer Detection', link: '/features/importers' },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/ejirocodes/vite-plugin-asset-manager',
      },
      { icon: 'npm', link: 'https://www.npmjs.com/package/vite-plugin-asset-manager' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present <a href="https://www.linkedin.com/in/ejirocodes" target="_blank">Ejiro Asiuwhu</a>',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/ejirocodes/vite-plugin-asset-manager/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
