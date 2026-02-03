// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@vite-asset-manager/nuxt'],

  assetManager: {
    // All options are optional - sensible defaults for Nuxt
    // base: '/__asset_manager__',
    // include: ['assets', 'public'],
    // floatingIcon: true,
    // watch: true,
    // launchEditor: 'code',
    // devtools: true,
    debug: true // Enable for testing
  }
})
