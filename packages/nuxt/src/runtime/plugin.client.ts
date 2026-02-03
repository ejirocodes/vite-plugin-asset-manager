import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app"

declare global {
  interface Window {
    __VAM_BASE_URL__?: string
  }
}

export default defineNuxtPlugin({
  name: 'asset-manager-floating-icon',
  enforce: 'post',

  async setup() {
    // Only run in browser
    if (typeof window === 'undefined') return

    const config = useRuntimeConfig()
    const baseUrl = config.public.assetManager?.base || '/__asset_manager__'

    // Set global variable for floating icon
    window.__VAM_BASE_URL__ = baseUrl

    // Dynamically load the floating icon script
    const script = document.createElement('script')
    script.type = 'module'
    script.src = `${baseUrl}/floating-icon.js`
    document.body.appendChild(script)
  }
})
