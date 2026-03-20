import { defineConfig } from 'vitepress'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  vite: {
    plugins: [
      assetManager({
        include: ['guide', 'frameworks', 'ssr', 'features', 'public'],
        floatingIcon: false,
      }),
    ],
  },

  title: 'Vite Asset Manager',
  description: 'Visual asset management dashboard for Vite projects',
  cleanUrls: true,
  srcExclude: ['SSR_INTEGRATION.md'],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Vite Asset Manager' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Visual asset management dashboard for Vite projects',
      },
    ],
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
      copyright: 'Copyright © 2024-present Ejiro Asiuwhu',
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
