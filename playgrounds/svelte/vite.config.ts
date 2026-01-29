import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), assetManager()],
  server: {
    open: true
  }
})
